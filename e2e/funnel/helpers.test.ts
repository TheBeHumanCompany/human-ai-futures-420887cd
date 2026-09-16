import { describe, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FUNNEL_EMAIL_CATCHER_DIR_ENV,
  buildProspectUrl,
  extractMagicLink,
  parseCatcherPayload,
  pollForMagicLink,
  resetFunnelStorage,
  resolveMagicLink,
} from "./helpers.ts";
import {
  clientUrlForToken,
  deliverMagicLinkEmail,
} from "../../src/lib/client-portal/magic-link-email.ts";

/**
 * Helper unit smoke for the funnel interception library (todo 12).
 *
 * These pin the pure seams todo 13's stage specs will lean on: the catcher
 * payload contract (what the dev server writes instead of a real Resend
 * send) and the magic-link extraction that turns a captured send into the
 * prospect URL a spec navigates to. Malformed payloads must fail loudly,
 * naming the file — a silently empty extraction would read as "email never
 * arrived" instead of "the capture format broke".
 *
 * Run: bun test e2e/funnel/helpers.test.ts
 */

const TOKEN = "iwk6Gn111auDWiidHvz9OwOkOI9_Yqnum7-pUNEageI";
const URL = `https://portal.thebehumancompany.ca/c/${TOKEN}`;

function payloadHtml(url: string): string {
  return `<p><a href="${url}">Open your private blueprint</a></p>`;
}

function validPayload(url: string = URL): Record<string, unknown> {
  return {
    capturedAt: "2026-09-16T00:00:00.000Z",
    endpoint: "https://api.resend.com/emails",
    body: {
      from: "The Be Human Company <website@updates.thebehumancompany.ca>",
      to: ["funnel-test@example.test"],
      reply_to: "hello@thebehumancompany.ca",
      subject: "Funnel Fixture Co — your private blueprint link",
      html: payloadHtml(url),
      text: `Your blueprint is ready:\n${url}`,
    },
  };
}

describe("the prospect URL builder", () => {
  test("it joins the base URL and the /c/ token path", () => {
    expect(buildProspectUrl("http://localhost:3000", TOKEN)).toBe(
      `http://localhost:3000/c/${TOKEN}`,
    );
  });

  test("it tolerates a trailing slash on the base URL", () => {
    expect(buildProspectUrl("http://localhost:3000/", TOKEN)).toBe(
      `http://localhost:3000/c/${TOKEN}`,
    );
  });
});

describe("magic-link extraction", () => {
  test("it finds the client URL in html", () => {
    expect(extractMagicLink(payloadHtml(URL))).toBe(URL);
  });

  test("it finds the client URL in plain text", () => {
    expect(extractMagicLink(`Hi,\n\n${URL}\n\nBye`)).toBe(URL);
  });

  test("it refuses a body without a /c/ link", () => {
    expect(() => extractMagicLink("<p>no link here</p>")).toThrow(/no magic link/i);
  });

  test("it does not mistake a lookalike host for the portal", () => {
    expect(() => extractMagicLink('<a href="https://evil.example/c/abc123def456">x</a>')).toThrow();
  });
});

describe("the catcher payload contract", () => {
  test(`${FUNNEL_EMAIL_CATCHER_DIR_ENV} is the agreed env var name`, () => {
    expect(FUNNEL_EMAIL_CATCHER_DIR_ENV).toBe("FUNNEL_EMAIL_CATCHER_DIR");
  });

  test("it parses a well-formed capture and extracts the link", () => {
    const parsed = parseCatcherPayload(JSON.stringify(validPayload()), "send-1.json");
    const captured = resolveMagicLink(parsed, "send-1.json");
    expect(captured.file).toBe("send-1.json");
    expect(captured.url).toBe(URL);
    expect(captured.to).toEqual(["funnel-test@example.test"]);
    expect(captured.subject).toContain("blueprint");
  });

  test("a non-JSON payload fails naming the file", () => {
    expect(() => parseCatcherPayload("{not json", "captures/send-corrupt.json")).toThrow(
      /send-corrupt\.json/,
    );
  });

  test("a JSON payload with the wrong shape fails naming the file", () => {
    const malformed = JSON.stringify({ body: "an email happened" });
    expect(() => parseCatcherPayload(malformed, "captures/send-shape.json")).toThrow(
      /send-shape\.json/,
    );
  });

  test("a capture with no magic link fails naming the file", () => {
    const linklessBody = validPayload() as { body: Record<string, unknown> };
    linklessBody.body.html = "<p>regards</p>";
    linklessBody.body.text = "regards";
    const parsed = parseCatcherPayload(JSON.stringify(linklessBody), "captures/send-linkless.json");
    expect(() => resolveMagicLink(parsed, "captures/send-linkless.json")).toThrow(
      /send-linkless\.json/,
    );
  });

  test("an empty capture fails naming the file", () => {
    expect(() => parseCatcherPayload("   ", "captures/send-empty.json")).toThrow(
      /send-empty\.json/,
    );
  });
});

describe("the write → parse round-trip", () => {
  test("a real seam capture parses back to its magic link", async () => {
    const dir = await mkdtemp(join(tmpdir(), "funnel-roundtrip-"));
    const clientUrl = clientUrlForToken(TOKEN);
    const out = await deliverMagicLinkEmail(
      { clientName: "The Funnel Fixture Co", to: "funnel-test@example.test", clientUrl },
      {
        catcherDir: dir,
        fetchImpl: (async () => {
          throw new Error("the catcher path must never reach the network");
        }) as unknown as typeof fetch,
      },
    );
    expect(out.ok).toBe(true);

    const names = (await readdir(dir)).filter((name) => name.endsWith(".json"));
    expect(names).toHaveLength(1);
    const file = join(dir, names[0]!);
    const captured = resolveMagicLink(
      parseCatcherPayload(await readFile(file, "utf8"), file),
      file,
    );
    expect(captured.url).toBe(clientUrl);
    expect(captured.to).toEqual(["funnel-test@example.test"]);
  });
});

describe("the catcher poller", () => {
  test("an empty directory times out naming it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "funnel-poll-"));
    await expect(pollForMagicLink(dir, { timeoutMs: 150, intervalMs: 50 })).rejects.toThrow(
      /no capture appeared/,
    );
  });
});

describe("the reset wiring (scripts/verify/funnel-reset.ts)", () => {
  const saved = (name: string) => process.env[name];
  const savedEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "FUNNEL_RUN_ID"].map((name) => [
    name,
    saved(name),
  ]);

  function stripEnv() {
    // The child must only ever reach the env gate, never a real project.
    for (const [name] of savedEnv) delete process.env[name];
  }
  function restoreEnv() {
    for (const [name, value] of savedEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }

  test("it refuses to spawn without a run id", async () => {
    stripEnv();
    try {
      await expect(resetFunnelStorage()).rejects.toThrow(/FUNNEL_RUN_ID/);
    } finally {
      restoreEnv();
    }
  });

  test("a dry invocation reaches the reset script, which exits 1 without env", async () => {
    stripEnv();
    try {
      await expect(resetFunnelStorage("fw1-dry")).rejects.toThrow(/funnel-reset\.ts/);
    } finally {
      restoreEnv();
    }
  });
});

describe("template-shaped captures", () => {
  test("a Resend Template send resolves from variables.PORTAL_URL with the derived subject", () => {
    const token = "t".repeat(43);
    const payload = {
      capturedAt: "2026-09-16T00:00:00.000Z",
      endpoint: "https://api.resend.com/emails",
      body: {
        from: "The Be Human Company <website@updates.thebehumancompany.ca>",
        to: ["funnel-test@example.com"],
        reply_to: "info@thebehumancompany.ca",
        template: {
          id: "3375c068-8c60-4588-8e90-fb3dc5b6c65f",
          variables: {
            RECIPIENT_FIRST_NAME: "The",
            COMPANY_NAME: "The Funnel Fixture Co",
            PORTAL_URL: `https://portal.thebehumancompany.ca/c/${token}`,
          },
        },
      },
    } as unknown as Parameters<typeof resolveMagicLink>[0];
    const captured = resolveMagicLink(payload, "send-template.json");
    expect(captured.url).toBe(`https://portal.thebehumancompany.ca/c/${token}`);
    expect(captured.subject).toContain("The Funnel Fixture Co");
    expect(captured.to).toContain("funnel-test@example.com");
  });

  test("a template capture without a portal URL fails loudly, naming the file", () => {
    const payload = {
      capturedAt: "2026-09-16T00:00:00.000Z",
      endpoint: "https://api.resend.com/emails",
      body: {
        from: "x",
        to: ["y"],
        reply_to: "z",
        template: { id: "tmpl_x", variables: { COMPANY_NAME: "No Link Co" } },
      },
    } as unknown as Parameters<typeof resolveMagicLink>[0];
    expect(() => resolveMagicLink(payload, "send-broken.json")).toThrow(
      "send-broken.json carries no magic link",
    );
  });
});
