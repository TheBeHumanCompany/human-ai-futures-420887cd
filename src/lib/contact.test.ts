import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CONTACT_EMAIL } from "./brand";
import {
  composeEnquiryEmail,
  deliverEnquiry,
  FALLBACK,
  rateLimited,
  validateEnquiry,
  type ContactEnquiry,
} from "./contact";

/**
 * The contact form's delivery path.
 *
 * The defect these tests exist for was not a crash. The form's submit handler
 * called `preventDefault()` and nothing else, so it accepted enquiries, looked
 * successful, and discarded every one. Nothing failed, which is why it survived
 * a live site — so the assertions below are about the two properties that make
 * the silent version impossible to reintroduce: the enquiry is addressed to the
 * real mailbox, and the page cannot claim success without a send.
 */

const REPO_ROOT = path.resolve(import.meta.dir, "..", "..");

const valid: ContactEnquiry = {
  name: "Dana Okafor",
  email: "dana@example.org",
  org: "Northwind Health",
  message: "We're mid-rollout and our governance is lagging the tooling.",
};

describe("validation", () => {
  test("a complete enquiry passes", () => {
    expect(validateEnquiry(valid)).toBeNull();
  });

  test("name, email and message are each required", () => {
    expect(validateEnquiry({ ...valid, name: "  " })).toMatch(/name/i);
    expect(validateEnquiry({ ...valid, email: "" })).toMatch(/email/i);
    expect(validateEnquiry({ ...valid, message: "\n\t " })).toMatch(/working on/i);
  });

  test("organization is optional, because plenty of people don't have one", () => {
    expect(validateEnquiry({ ...valid, org: "" })).toBeNull();
  });

  test("an address without an @ or a dotted domain is refused", () => {
    for (const email of ["dana", "dana@", "@example.org", "dana@example"]) {
      expect(validateEnquiry({ ...valid, email }), email).toMatch(/email/i);
    }
  });

  test("a real-shaped address with a plus tag and a subdomain is accepted", () => {
    // The permissive regex is a decision, not an oversight: these are valid and
    // a stricter pattern is how a form starts rejecting real people.
    expect(validateEnquiry({ ...valid, email: "dana+site@mail.example.co.uk" })).toBeNull();
  });

  test("each field is length-capped, so the mailbox cannot be flooded by one post", () => {
    expect(validateEnquiry({ ...valid, message: "x".repeat(5001) })).toMatch(/too long/i);
    expect(validateEnquiry({ ...valid, name: "x".repeat(201) })).toMatch(/too long/i);
  });
});

describe("the email that gets sent", () => {
  const mail = composeEnquiryEmail(valid);

  test("it is addressed to the canonical mailbox, from the one constant", () => {
    // The whole point of the send path. A drifted copy of this address routes
    // real enquiries somewhere nobody reads and looks identical from outside.
    expect(mail.to).toEqual([CONTACT_EMAIL]);
    expect(CONTACT_EMAIL).toBe("info@thebehumancompany.ca");
  });

  test("the domain carries the definite article", () => {
    // `behumancompany.ca` has no MX and no A record — checked 2026-08-19 — so
    // this is not a spelling preference, it is deliverable versus discarded.
    expect(CONTACT_EMAIL).toContain("@thebehumancompany.ca");
    expect(CONTACT_EMAIL).not.toMatch(/@behumancompany\.ca$/);
  });

  test("replying answers the sender, not the website", () => {
    expect(mail.reply_to).toBe(valid.email);
    expect(mail.from).not.toBe(valid.email);
  });

  test("every field the person filled in survives into the body", () => {
    for (const value of [valid.name, valid.email, valid.org, valid.message]) {
      expect(mail.text).toContain(value);
    }
    expect(mail.subject).toContain(valid.name);
  });

  test("a missing organization renders as a dash rather than 'undefined'", () => {
    const mailNoOrg = composeEnquiryEmail({ ...valid, org: "" });
    expect(mailNoOrg.text).not.toContain("undefined");
    expect(mailNoOrg.subject).toBe(`Website enquiry — ${valid.name}`);
  });
});

describe("the page cannot go back to pretending", () => {
  const source = readFileSync(path.join(REPO_ROOT, "src/routes/contact.tsx"), "utf8");

  test("the form's submit handler does more than preventDefault", () => {
    // The exact regression: `onSubmit={(e) => e.preventDefault()}` as the whole
    // handler. Asserted against the source because the failure is the ABSENCE
    // of a call, and absence is invisible to a test that only renders.
    expect(source).not.toMatch(/onSubmit=\{\(e\) => e\.preventDefault\(\)\}/);
    expect(source).toContain("sendContactEnquiry");
  });

  test("the success message is shown only for a successful result", () => {
    // A success banner that renders unconditionally is the same bug wearing a
    // confirmation message, which is worse than the original silence.
    expect(source).toContain("result?.ok");
  });

  test("the confirmation claims dispatch, not delivery", () => {
    // A 2xx from Resend is acceptance for delivery; the message can still
    // bounce or be suppressed afterwards. "reached us" would overstate that.
    expect(source).toContain("on its way");
    expect(source).not.toContain("reached us");
    expect(source).not.toMatch(/delivered/i);
  });

  test("the address is read from the constant, not retyped", () => {
    expect(source).toContain("CONTACT_EMAIL");
    expect(source).not.toContain("info@thebehumancompany.ca");
  });

  test("the client does not write its own copy of the fallback sentence", () => {
    // It imports FALLBACK. A second copy in the catch block drifts the moment
    // the address or the wording changes on one side only.
    expect(source).toContain("FALLBACK.failed");
    expect(source).not.toMatch(/Something went wrong sending that\. Please email/);
  });
});

describe("delivery: success is reported only when the provider accepted it", () => {
  /**
   * The narrow property. The bug being fixed reported success without sending,
   * so every branch that could reintroduce that is exercised here rather than
   * reasoned about — a `{ ok: true }` reachable without a 2xx is the same
   * defect with better manners.
   */
  const res = (status: number) =>
    new Response(status === 200 ? '{"id":"x"}' : '{"message":"nope"}', { status });

  test("a 2xx from the provider is the only way to ok:true", async () => {
    let called = 0;
    const out = await deliverEnquiry(valid, {
      apiKey: "re_test",
      fetchImpl: (async () => {
        called += 1;
        return res(200);
      }) as unknown as typeof fetch,
    });
    expect(out).toEqual({ ok: true, state: "accepted" });
    expect(called, "it actually called the provider").toBe(1);
  });

  test("a non-2xx reports failure with the direct-email fallback", async () => {
    // The real state on 2026-08-19: the sending domain is not yet verified, so
    // Resend answers 403. The visitor must be told, not thanked.
    const out = await deliverEnquiry(valid, {
      apiKey: "re_test",
      fetchImpl: (async () => res(403)) as unknown as typeof fetch,
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("failed");
    expect(out.ok === false && out.message).toContain(CONTACT_EMAIL);
  });

  test("a network throw reports failure, never success", async () => {
    const out = await deliverEnquiry(valid, {
      apiKey: "re_test",
      fetchImpl: (async () => {
        throw new Error("connection reset");
      }) as unknown as typeof fetch,
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("failed");
  });

  test("no API key never reaches the provider and never claims success", async () => {
    let called = 0;
    const out = await deliverEnquiry(valid, {
      apiKey: undefined,
      fetchImpl: (async () => {
        called += 1;
        return res(200);
      }) as unknown as typeof fetch,
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("unconfigured");
    expect(called, "no key means no call").toBe(0);
  });

  test("an invalid enquiry is refused before the provider is called", async () => {
    let called = 0;
    const out = await deliverEnquiry(
      { ...valid, email: "not-an-address" },
      {
        apiKey: "re_test",
        fetchImpl: (async () => {
          called += 1;
          return res(200);
        }) as unknown as typeof fetch,
      },
    );
    expect(out.ok === false && out.reason).toBe("invalid");
    expect(called).toBe(0);
  });

  test("the honeypot drops the message and does NOT confirm", async () => {
    // The one path that could still lie. Nothing is sent, so nothing may be
    // confirmed — a bot is not owed a polite success, and a real person who
    // trips it must get the fallback rather than a false receipt.
    let botted = 0;
    let called = 0;
    const out = await deliverEnquiry(
      { ...valid, fax: "http://spam.example" },
      {
        apiKey: "re_test",
        onBotDetected: () => {
          botted += 1;
        },
        fetchImpl: (async () => {
          called += 1;
          return res(200);
        }) as unknown as typeof fetch,
      },
    );
    expect(out.ok, "never reports success").toBe(false);
    expect(out.ok === false && out.reason).toBe("ignored");
    expect(out.ok === false && out.message).toBe(FALLBACK.ignored);
    expect(called, "nothing is sent").toBe(0);
    expect(botted, "and it is recorded").toBe(1);
  });

  test("NO path returns ok without the provider having accepted it", async () => {
    // The property stated as a total, rather than one case at a time: across
    // every reachable outcome, `ok: true` appears only where a 2xx did.
    const cases: Array<[string, Parameters<typeof deliverEnquiry>[0], number | "throw" | "nokey"]> =
      [
        ["accepted", valid, 200],
        ["provider refused", valid, 403],
        ["provider error", valid, 500],
        ["network throw", valid, "throw"],
        ["no key", valid, "nokey"],
        ["invalid", { ...valid, email: "x" }, 200],
        ["honeypot", { ...valid, fax: "bot" }, 200],
      ];
    for (const [label, data, mode] of cases) {
      const out = await deliverEnquiry(data, {
        apiKey: mode === "nokey" ? undefined : "re_test",
        onBotDetected: () => {},
        fetchImpl: (async () => {
          if (mode === "throw") throw new Error("reset");
          return res(typeof mode === "number" ? mode : 200);
        }) as unknown as typeof fetch,
      });
      const shouldBeOk = label === "accepted";
      expect(out.ok, `${label} must ${shouldBeOk ? "" : "NOT "}report success`).toBe(shouldBeOk);
    }
  });

  test("the honeypot field is not named something autofill completes", () => {
    // A hidden field named `website`/`url` gets filled by password managers,
    // which would silently drop a real enquiry — the original defect exactly.
    const form = readFileSync(path.join(REPO_ROOT, "src/routes/contact.tsx"), "utf8");
    expect(form).not.toMatch(/name="(website|url|email2|address)"/);
    expect(form).toContain('name="fax"');
  });
});

describe("abuse control", () => {
  /**
   * Review fired 50 concurrent valid submissions at the endpoint and got 50
   * provider calls: the mailbox, the Resend quota, the bill and the sending
   * reputation were all reachable from a loop. The honeypot is no defence —
   * a script omits the field.
   */
  const t0 = 1_760_000_000_000;

  test("a burst from one client stops reaching the provider", async () => {
    let calls = 0;
    const send = (n: number) =>
      deliverEnquiry(valid, {
        apiKey: "re_test",
        clientKey: "burst-client",
        now: t0 + n,
        fetchImpl: (async () => {
          calls += 1;
          return new Response('{"id":"x"}', { status: 200 });
        }) as unknown as typeof fetch,
      });

    const results = [];
    for (let n = 0; n < 50; n += 1) results.push(await send(n));

    const accepted = results.filter((r) => r.ok).length;
    const throttled = results.filter((r) => !r.ok && r.reason === "throttled").length;
    expect(accepted, "only the first few get through").toBe(5);
    expect(throttled).toBe(45);
    expect(calls, "the provider is called once per accepted enquiry, no more").toBe(5);
  });

  test("a throttled visitor is told how to reach us anyway", async () => {
    const out = await deliverEnquiry(valid, {
      apiKey: "re_test",
      clientKey: "burst-client",
      now: t0 + 100,
      fetchImpl: (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch,
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.message).toContain(CONTACT_EMAIL);
  });

  test("the window expires, so a real person is not locked out for good", () => {
    const key = "patient-client";
    for (let n = 0; n < 5; n += 1) expect(rateLimited(key, t0 + n)).toBe(false);
    expect(rateLimited(key, t0 + 6)).toBe(true);
    // Eleven minutes later the window has rolled off.
    expect(rateLimited(key, t0 + 11 * 60 * 1000)).toBe(false);
  });

  test("clients are bucketed separately", () => {
    for (let n = 0; n < 5; n += 1) rateLimited("noisy", t0 + n);
    expect(rateLimited("noisy", t0 + 6), "the flooder is stopped").toBe(true);
    expect(rateLimited("quiet", t0 + 6), "everyone else is unaffected").toBe(false);
  });

  test("a null payload is refused rather than throwing", async () => {
    // The server-fn validator is a TypeScript identity, so this reaches the
    // handler intact and `data.fax` would throw before any check ran.
    const out = await deliverEnquiry(null as unknown as ContactEnquiry, { apiKey: "re_test" });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("invalid");
  });
});
