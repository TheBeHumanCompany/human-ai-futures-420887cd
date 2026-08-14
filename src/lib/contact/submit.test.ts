import { afterEach, describe, expect, it } from "bun:test";

import { submitLead, type LeadPayload } from "./submit";

const VALID: LeadPayload = {
  name: "Jordan Reyes",
  email: "jordan@example.ca",
  organization: "Example Co",
  message: "We are about to roll out AI across support and want a governance read first.",
};

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Replace `fetch` for one call and record what it received. */
function stubFetch(impl: () => Promise<Response> | never) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return impl();
  }) as unknown as typeof fetch;
  return calls;
}

describe("submitLead", () => {
  /**
   * The defect this function exists to fix: the form previously called
   * preventDefault and nothing else, so every enquiry was silently discarded.
   * A success path that does not actually reach the network would reproduce it,
   * so this asserts the request was made and not merely that `ok` came back.
   */
  it("posts to the endpoint and reports success", async () => {
    const calls = stubFetch(async () => new Response(null, { status: 200 }));

    const result = await submitLead(VALID, "https://forms.example/test");

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://forms.example/test");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({
      name: "Jordan Reyes",
      email: "jordan@example.ca",
      organization: "Example Co",
    });
  });

  it("trims whitespace before sending", async () => {
    const calls = stubFetch(async () => new Response(null, { status: 200 }));

    await submitLead({ ...VALID, name: "  Jordan Reyes  " }, "https://forms.example/test");

    expect(JSON.parse(String(calls[0].init?.body)).name).toBe("Jordan Reyes");
  });

  it("reports a network failure instead of throwing", async () => {
    stubFetch(() => {
      throw new Error("offline");
    });

    const result = await submitLead(VALID, "https://forms.example/test");

    expect(result).toMatchObject({ ok: false, reason: "network" });
  });

  it("reports a non-2xx response as rejected", async () => {
    stubFetch(async () => new Response(null, { status: 500 }));

    const result = await submitLead(VALID, "https://forms.example/test");

    expect(result).toMatchObject({ ok: false, reason: "rejected" });
    if (!result.ok) expect(result.detail).toContain("500");
  });

  describe("validation happens before the network call", () => {
    const cases: [string, Partial<LeadPayload>][] = [
      ["a blank name", { name: "   " }],
      ["a blank email", { email: "" }],
      ["a malformed email", { email: "jordan@example" }],
      ["a blank message", { message: "" }],
    ];

    for (const [label, patch] of cases) {
      it(`rejects ${label} without sending a request`, async () => {
        const calls = stubFetch(async () => new Response(null, { status: 200 }));

        const result = await submitLead({ ...VALID, ...patch }, "https://forms.example/test");

        expect(result).toMatchObject({ ok: false, reason: "validation" });
        expect(calls).toHaveLength(0);
      });
    }
  });
});
