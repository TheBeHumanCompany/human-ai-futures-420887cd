import { describe, expect, test } from "bun:test";

import {
  CLIENT_PORTAL_ORIGIN,
  clientUrlForToken,
  composeMagicLinkEmail,
  deliverMagicLinkEmail,
  type MagicLinkRequest,
} from "./magic-link-email";

/**
 * The default send is the HTML magic link only (US-006).
 *
 * These tests pin the three properties a regression would break silently: the
 * link carries the canonical apex origin, the email carries the client URL,
 * and no send path attaches a PDF — asserted structurally (no `attachments`
 * field) and on the wire bytes (no PDF signature in the fixture send).
 */

const TOKEN = "d5PLdS3fF5OFFaC-LO9HVcmphoi746VR19aH9hs4Uhs";

const request: MagicLinkRequest = {
  clientName: "Acme Industrial",
  to: "desiree@example.org",
  clientUrl: clientUrlForToken(TOKEN),
};

describe("the client URL", () => {
  test("it uses the canonical apex origin, never www", () => {
    expect(CLIENT_PORTAL_ORIGIN).toBe("https://thebehumancompany.ca");
    expect(request.clientUrl).toBe(`https://thebehumancompany.ca/c/${TOKEN}`);
    expect(request.clientUrl).not.toContain("www.");
  });
});

describe("the email that gets sent", () => {
  const mail = composeMagicLinkEmail(request);

  test("it goes through the existing Resend sender domain", () => {
    expect(mail.from).toContain("updates.thebehumancompany.ca");
  });

  test("it carries the client URL in both bodies", () => {
    expect(mail.html).toContain(request.clientUrl);
    expect(mail.text).toContain(request.clientUrl);
  });

  test("it has no attachment step", () => {
    // Structural: the field does not exist, so the default send cannot grow
    // a PDF without someone adding it — which turns this row red.
    expect(mail).not.toHaveProperty("attachments");
    expect(JSON.stringify(mail)).not.toContain("attachments");
  });

  test("final copy is still TBD, marked as placeholder", () => {
    expect(mail.html).toMatch(/placeholder/i);
    expect(mail.html).toMatch(/TBD/);
  });
});

describe("delivery: the fixture send carries the link and zero PDF bytes", () => {
  test("a 2xx send posts the client URL with no PDF attached", async () => {
    let body = "";
    const out = await deliverMagicLinkEmail(request, {
      apiKey: "re_test",
      fetchImpl: (async (_url: unknown, init?: RequestInit) => {
        body = String(init?.body ?? "");
        return new Response('{"id":"magic-link-fixture"}', { status: 200 });
      }) as unknown as typeof fetch,
    });
    expect(out).toEqual({ ok: true });
    expect(body).toContain(request.clientUrl);
    expect(body).not.toContain("attachments");
    // Zero PDF bytes: neither a signature nor a filename on the wire.
    expect(body).not.toContain("%PDF");
    expect(body).not.toMatch(/\.pdf/i);
  });

  test("no API key never reaches the provider and never claims success", async () => {
    let called = 0;
    const out = await deliverMagicLinkEmail(request, {
      apiKey: undefined,
      fetchImpl: (async () => {
        called += 1;
        return new Response("{}", { status: 200 });
      }) as unknown as typeof fetch,
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("unconfigured");
    expect(called).toBe(0);
  });

  test("a non-apex client URL is refused before the provider is called", async () => {
    let called = 0;
    const out = await deliverMagicLinkEmail(
      { ...request, clientUrl: "https://www.thebehumancompany.ca/c/abc" },
      {
        apiKey: "re_test",
        fetchImpl: (async () => {
          called += 1;
          return new Response("{}", { status: 200 });
        }) as unknown as typeof fetch,
      },
    );
    expect(out.ok === false && out.reason).toBe("invalid");
    expect(called).toBe(0);
  });

  test("a bad recipient is refused before the provider is called", async () => {
    let called = 0;
    const out = await deliverMagicLinkEmail(
      { ...request, to: "not-an-address" },
      {
        apiKey: "re_test",
        fetchImpl: (async () => {
          called += 1;
          return new Response("{}", { status: 200 });
        }) as unknown as typeof fetch,
      },
    );
    expect(out.ok === false && out.reason).toBe("invalid");
    expect(called).toBe(0);
  });
});
