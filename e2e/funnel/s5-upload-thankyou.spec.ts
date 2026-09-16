import { expect, test } from "@playwright/test";

import { BOOKING_URL_15MIN } from "../../src/lib/booking.ts";
import { ALLOWED_EXTENSIONS } from "../../src/lib/client-portal/upload-policy.ts";
import { openPortalAuthenticated } from "./helpers.ts";
import { ensureFunnelSeeded, snap } from "./suite-setup.ts";

/**
 * Stage 5 — the closing loop (plan todo 13, S5): the intake asks exactly the
 * seeded finals' questions, a policy-violating upload is explained inline
 * and never stored, and the fixture PDF uploads through to the confirmation,
 * the thank-you surface, and the 15-minute booking CTA.
 *
 * "Never stored" is asserted against the bucket itself, not the UI: the
 * service-role object list under the funnel prefix must stay empty after a
 * rejection, and must hold exactly the happy-path object after the upload.
 * Like S4 this consumes S3 — the intake card renders only when the RLS read
 * can see the unlocked finals.
 */
const STAGE = "s5-upload-thankyou";
const REJECTION_TEXT = `We accept documents and images: ${ALLOWED_EXTENSIONS.join(", ")}.`;

const QUESTIONS = [
  "For the section 'Final Opportunity Map', upload the supporting document.",
  "For the section 'Final Playbook Detail', upload the supporting document.",
];

/** A minimal well-formed PDF 1.4 document — the policy judges name/type/size. */
const FIXTURE_PDF = [
  "%PDF-1.4",
  "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj",
  "trailer<</Size 4/Root 1 0 R>>",
  "%%EOF",
  "",
].join("\n");

test.beforeAll(async () => {
  await ensureFunnelSeeded();
});

async function listStoredObjects(): Promise<string[]> {
  const url = process.env["SUPABASE_URL"]?.trim();
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    throw new Error(
      "funnel: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to list uploads",
    );
  }
  const response = await fetch(`${url}/storage/v1/object/list/client-uploads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix: "funnel-fixture/", limit: 1000 }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`funnel: storage list answered ${response.status}`);
  const entries = (await response.json()) as Array<{ name?: unknown }>;
  return entries.map((entry) => (typeof entry.name === "string" ? entry.name : ""));
}

async function openIntakeCard(page: import("@playwright/test").Page) {
  await openPortalAuthenticated(page);
  const card = page.getByTestId("intake-card");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.getByTestId("intake-question")).toHaveText(QUESTIONS);
  return card;
}

test("a policy-violating upload is explained inline and never stored", async ({ page }) => {
  const card = await openIntakeCard(page);

  await card.getByTestId("intake-file-input").setInputFiles({
    name: "funnel-rejected.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("this is not a document"),
  });
  await card.getByTestId("intake-submit").click();

  const rejection = card.getByTestId("intake-rejection");
  await expect(rejection).toBeVisible({ timeout: 20_000 });
  await expect(rejection).toHaveText(REJECTION_TEXT);
  await expect(card.getByTestId("intake-confirm")).toHaveCount(0);
  await snap(page, STAGE, "policy-rejection");

  expect(await listStoredObjects()).toEqual([]);
});

test("the fixture document uploads through to the thank-you surface", async ({ page }) => {
  const card = await openIntakeCard(page);

  await card.getByTestId("intake-file-input").setInputFiles({
    name: "funnel-fixture-document.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(FIXTURE_PDF, "utf8"),
  });
  await card.getByTestId("intake-submit").click();

  await expect(card.getByTestId("intake-confirm")).toBeVisible({ timeout: 30_000 });
  await expect(card.getByTestId("intake-confirm")).toContainText("funnel-fixture-document.pdf");

  const thankyou = page.getByTestId("thankyou");
  await expect(thankyou).toBeVisible();
  await expect(thankyou.getByTestId("thankyou-copy")).toContainText("24 hours");
  await expect(thankyou.getByTestId("booking-cta")).toHaveAttribute("href", BOOKING_URL_15MIN);
  await snap(page, STAGE, "thankyou-booking");

  const stored = await listStoredObjects();
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatch(/funnel-fixture-document\.pdf$/);
});
