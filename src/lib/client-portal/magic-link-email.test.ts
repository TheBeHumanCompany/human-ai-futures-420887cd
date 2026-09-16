import { describe, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

function NO_NET(): typeof fetch {
  return (async () => {
    throw new Error("must not reach the network");
  }) as unknown as typeof fetch;
}

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

describe("template sends (RESEND_TEMPLATE_ID_MAGIC_LINK)", () => {
  function recordingFetch(calls: string[]): typeof fetch {
    return (async (_url: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response('{"id":"email_1"}', { status: 200 });
    }) as unknown as typeof fetch;
  }

  test("a template id posts template_id and escaped variables, never inline bodies", async () => {
    const calls: string[] = [];
    const result = await deliverMagicLinkEmail(
      { clientName: "Funnel & Co", to: "client@example.org", clientUrl: clientUrlForToken(TOKEN) },
      { apiKey: "key", fetchImpl: recordingFetch(calls), templateId: "tmpl_magic" },
    );
    expect(result.ok).toBe(true);
    const body = JSON.parse(calls[0]!);
    expect(body.template.id).toBe("tmpl_magic");
    expect(body.template.variables.RECIPIENT_FIRST_NAME).toBe("Funnel");
    expect(body.template.variables.COMPANY_NAME).toBe("Funnel &amp; Co");
    expect(body.template.variables.PORTAL_URL).toBe(clientUrlForToken(TOKEN));
    expect(body.html).toBeUndefined();
    expect(body.text).toBeUndefined();
    expect(body.subject).toBeUndefined();
  });

  test("a null template id forces the inline compose byte-for-byte", async () => {
    const calls: string[] = [];
    const result = await deliverMagicLinkEmail(request, {
      apiKey: "key",
      fetchImpl: recordingFetch(calls),
      templateId: null,
    });
    expect(result.ok).toBe(true);
    expect(calls[0]).toBe(JSON.stringify(composeMagicLinkEmail(request)));
  });

  test("the catcher captures the template body when a template id is set", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tmpl-catcher-"));
    try {
      const result = await deliverMagicLinkEmail(
        {
          clientName: "Acme Industrial",
          to: "client@example.org",
          clientUrl: clientUrlForToken(TOKEN),
        },
        { catcherDir: dir, fetchImpl: NO_NET, templateId: "tmpl_magic" },
      );
      expect(result.ok).toBe(true);
      const files = await readdir(dir);
      expect(files.length).toBe(1);
      const captured = JSON.parse(await readFile(join(dir, files[0]!), "utf8"));
      expect(captured.body.template.id).toBe("tmpl_magic");
      expect(captured.body.template.variables.PORTAL_URL).toBe(clientUrlForToken(TOKEN));
      expect(captured.body.html).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("blueprint-delivery sends (topFindings)", () => {
  const findings = ["Raise readiness, quantified", "The sneaker margin question"] as const;
  const withFindings: MagicLinkRequest = { ...request, topFindings: [...findings] };

  test("findings route through the delivery template with escaped titles", async () => {
    const calls: string[] = [];
    const recordingFetch = (async (_url: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response('{"id":"email_2"}', { status: 200 });
    }) as unknown as typeof fetch;
    const result = await deliverMagicLinkEmail(withFindings, {
      apiKey: "key",
      fetchImpl: recordingFetch,
      templateId: "tmpl_magic",
      deliveryTemplateId: "tmpl_delivery",
    });
    expect(result.ok).toBe(true);
    const body = JSON.parse(calls[0]!);
    // The delivery envelope wins over the bare magic-link template when
    // findings exist — the titles are the engagement, the link is the CTA.
    expect(body.template.id).toBe("tmpl_delivery");
    expect(body.template.variables.FINDING_1_TITLE).toBe(findings[0]);
    expect(body.template.variables.FINDING_2_TITLE).toBe(findings[1]);
    expect(body.template.variables.PORTAL_URL).toBe(clientUrlForToken(TOKEN));
    expect(body.template.variables.COMPANY_NAME).toBe("Acme Industrial");
    // DATE_LABEL is the "Preliminary · <Mon YYYY>" chip; never a full date.
    expect(body.template.variables.DATE_LABEL).toMatch(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/,
    );
    expect(body.html).toBeUndefined();
    expect(body.text).toBeUndefined();
  });

  test("findings escape into the template variables like every other value", async () => {
    const calls: string[] = [];
    const recordingFetch = (async (_url: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    await deliverMagicLinkEmail(
      { ...withFindings, topFindings: ['"Growth" <risk>', "Plain"] },
      { apiKey: "key", fetchImpl: recordingFetch, templateId: null, deliveryTemplateId: "tmpl" },
    );
    const vars = JSON.parse(calls[0]!).template.variables;
    expect(vars.FINDING_1_TITLE).toBe("&quot;Growth&quot; &lt;risk&gt;");
  });

  test("no delivery template keeps the titles in the inline compose, both bodies", async () => {
    const calls: string[] = [];
    const recordingFetch = (async (_url: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    // templateId set but deliveryTemplateId null: a silent downgrade to the
    // findings-less template send would drop the titles entirely.
    const result = await deliverMagicLinkEmail(withFindings, {
      apiKey: "key",
      fetchImpl: recordingFetch,
      templateId: "tmpl_magic",
      deliveryTemplateId: null,
    });
    expect(result.ok).toBe(true);
    const body = JSON.parse(calls[0]!);
    expect(body.template).toBeUndefined();
    expect(body.html).toContain(findings[0]);
    expect(body.html).toContain(findings[1]);
    expect(body.text).toContain(`- ${findings[0]}`);
    expect(body.text).toContain(`- ${findings[1]}`);
  });

  test("malformed findings are refused before the provider is called", async () => {
    let called = 0;
    const countingFetch = (async () => {
      called += 1;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const one = await deliverMagicLinkEmail(
      { ...request, topFindings: ["Only one"] as unknown as [string, string] },
      { apiKey: "key", fetchImpl: countingFetch, deliveryTemplateId: "tmpl" },
    );
    const empty = await deliverMagicLinkEmail(
      { ...request, topFindings: ["", "Second"] },
      { apiKey: "key", fetchImpl: countingFetch, deliveryTemplateId: "tmpl" },
    );
    expect(one.ok === false && one.reason).toBe("invalid");
    expect(empty.ok === false && empty.reason).toBe("invalid");
    expect(called).toBe(0);
  });

  test("the catcher captures the delivery envelope with a resolvable portal URL", async () => {
    const dir = await mkdtemp(join(tmpdir(), "delivery-catcher-"));
    try {
      const result = await deliverMagicLinkEmail(withFindings, {
        catcherDir: dir,
        fetchImpl: NO_NET,
        deliveryTemplateId: "tmpl_delivery",
      });
      expect(result.ok).toBe(true);
      const files = await readdir(dir);
      expect(files.length).toBe(1);
      const captured = JSON.parse(await readFile(join(dir, files[0]!), "utf8"));
      expect(captured.body.template.id).toBe("tmpl_delivery");
      expect(captured.body.template.variables.PORTAL_URL).toBe(clientUrlForToken(TOKEN));
      expect(captured.body.template.variables.FINDING_1_TITLE).toBe(findings[0]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
