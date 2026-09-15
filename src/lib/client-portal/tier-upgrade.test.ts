import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { fetchClientPageByTokenFn, type ClientRecord } from "./tokens";
import { LEGACY_REPORT_ID, publishReportToFile } from "./publish";
import store from "../../../content/clients.json";

/**
 * US-007 — the same link before and after pay, pinned without a server.
 *
 * A tier upgrade is a publish, not a re-issue: preliminary content goes
 * live, then paid-tier content is appended to the same client, and the
 * original token keeps serving both. Beacon is the upgrading client
 * because its record is still the legacy preliminary-only shape, so the
 * flow also proves the paid report migrates the old body instead of
 * replacing it. Everything runs against a scratch copy of the store with
 * the Supabase tier forced off (the `deliverEnquiry` deps-seam idiom),
 * which is what the dev-server curl in `docs/client-portal-tokens.md`
 * repeats over HTTP.
 */

const MARKER_PRELIMINARY = "BEACON-FIXTURE-MARKER-44d2c8";
const MARKER_PAID = "TIER-UPGRADE-FIXTURE-PAID-3b7e21";
const MARKER_OTHER_CLIENT = "ACME-FIXTURE-MARKER-7f3a91";

const PAID_REPORT_ID = "paid";

const copyStoreToScratch = async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "client-portal-tier-upgrade-"));
  const storePath = path.join(dir, "clients.json");
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  return storePath;
};

const readStore = async (storePath: string) =>
  JSON.parse(await readFile(storePath, "utf8")) as ClientRecord[];

const tokenOf = (clients: readonly ClientRecord[], id: string) =>
  clients.find((client) => client.id === id)!.token;

const pageFor = (token: string, storePath: string) =>
  fetchClientPageByTokenFn(token, {
    supabaseConfig: null,
    readStore: () => readStore(storePath),
  });

describe("tier upgrade — paid content joins the same link", () => {
  test("preliminary then paid under one token: both markers resolve, token never moves", async () => {
    const storePath = await copyStoreToScratch();
    const token = tokenOf(await readStore(storePath), "beacon-health");

    // Step one, the preliminary publish: the legacy singleton updates in
    // place, keeping its shape and its link.
    const preliminary = await publishReportToFile(storePath, {
      clientId: "beacon-health",
      reportId: LEGACY_REPORT_ID,
      title: "Beacon Health — Preliminary Blueprint",
      html: `<p>${MARKER_PRELIMINARY} — preliminary findings for Beacon Health.</p>`,
    });
    expect(preliminary.created).toBe(false);
    expect(tokenOf(await readStore(storePath), "beacon-health")).toBe(token);

    // Step two, the paid tier: a new report id appends beside the
    // preliminary body — the client's id, name, and token are untouched.
    const paid = await publishReportToFile(storePath, {
      clientId: "beacon-health",
      reportId: PAID_REPORT_ID,
      title: "Beacon Health — Paid Report",
      html: `<p>${MARKER_PAID} — paid findings for Beacon Health.</p>`,
    });
    expect(paid.created).toBe(true);
    const after = await readStore(storePath);
    expect(tokenOf(after, "beacon-health")).toBe(token);

    // The original token URL serves both tiers, and nobody else's content.
    const page = await pageFor(token, storePath);
    expect(page?.id).toBe("beacon-health");
    expect(page?.html).toContain(MARKER_PRELIMINARY);
    expect(page?.html).toContain(MARKER_PAID);
    expect(page?.html).not.toContain(MARKER_OTHER_CLIENT);
    expect(page?.reports.map((report) => report.id)).toEqual([LEGACY_REPORT_ID, PAID_REPORT_ID]);
  });
});

describe("the tier-upgrade locator performs no rotation, by inspection", () => {
  test("publishReportToStore never writes the token field", () => {
    // The upgrade path shares the publisher with every other publish, so
    // the no-rotation guarantee is structural: the one function that
    // writes client records has no token assignment. Any future rotation
    // step must arrive with this row updated, not silently.
    const source = readFileSync(path.join(import.meta.dir, "publish.ts"), "utf8");
    expect(source).not.toMatch(/\.token\s*=/);
  });
});
