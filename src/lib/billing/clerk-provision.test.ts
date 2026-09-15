import { describe, expect, test } from "bun:test";

import {
  CLERK_SECRET_KEY_ENV,
  clerkSecretFromEnv,
  provisionClerkUserForEmail,
} from "./clerk-provision";

/**
 * Clerk provisioning (US-009), pinned without Clerk.
 *
 * Every transport is a stubbed `fetchImpl` that records what it answered,
 * so the suite proves the request shapes (URL, bearer header, skip flags,
 * invitation payload) and the failure contract — best-effort: `null`,
 * never a throw — without touching api.clerk.com. The secret always comes
 * from `clerkSecretKey`, never the environment, except the one branch
 * test that manipulates it (saved and restored).
 */

interface Recorded {
  url: string;
  init?: RequestInit;
}

function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function recorder(respond: (url: string) => ReturnType<typeof reply>) {
  const requests: Recorded[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    const record = { url: url.toString(), init };
    requests.push(record);
    return respond(record.url);
  }) as typeof fetch;
  return { requests, impl };
}

describe("clerkSecretFromEnv", () => {
  test("reads and trims the exported name; absent or blank is null", () => {
    expect(clerkSecretFromEnv({ [CLERK_SECRET_KEY_ENV]: " sk_test_x " })).toBe("sk_test_x");
    expect(clerkSecretFromEnv({})).toBeNull();
    expect(clerkSecretFromEnv({ [CLERK_SECRET_KEY_ENV]: "   " })).toBeNull();
  });
});

describe("provisionClerkUserForEmail", () => {
  test("answers the existing user id without creating anything", async () => {
    const { requests, impl } = recorder(() => reply(200, { data: [{ id: "user_exists" }] }));
    const result = await provisionClerkUserForEmail({
      email: "owner@acme.example",
      clerkSecretKey: "sk_test_x",
      fetchImpl: impl,
    });
    expect(result).toEqual({ clerkUserId: "user_exists" });
    // One read, no create, no invitation: replays cost a single GET.
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toContain("/v1/users?email_address[]=");
    expect(requests[0].url).toContain(encodeURIComponent("owner@acme.example"));
    expect((requests[0].init!.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer sk_test_x",
    );
  });

  test("creates passwordlessly and invites when the address is new", async () => {
    const { requests, impl } = recorder((url) => {
      if (url.includes("/v1/invitations")) return reply(201, { id: "inv_1" });
      if (url.includes("email_address")) return reply(200, { data: [] });
      return reply(201, { id: "user_new" });
    });
    const result = await provisionClerkUserForEmail({
      email: "buyer@acme.example",
      clerkSecretKey: "sk_test_x",
      fetchImpl: impl,
    });
    expect(result).toEqual({ clerkUserId: "user_new" });
    expect(requests).toHaveLength(3);

    const createBody = JSON.parse(requests[1].init!.body as string);
    expect(requests[1].url).toBe("https://api.clerk.com/v1/users");
    expect(createBody.email_addresses).toEqual(["buyer@acme.example"]);
    expect(createBody.skip_password_required).toBe(true);
    expect(createBody.skip_email_verification_required).toBe(true);

    const invitationBody = JSON.parse(requests[2].init!.body as string);
    expect(requests[2].url).toBe("https://api.clerk.com/v1/invitations");
    expect(invitationBody).toEqual({
      email_address: "buyer@acme.example",
      notify: true,
      ignore_existing: true,
    });
  });

  test("a raced create (identifier_taken) falls back to the list read", async () => {
    let listCalls = 0;
    const { requests, impl } = recorder((url) => {
      if (url.includes("email_address")) {
        listCalls += 1;
        return reply(200, { data: listCalls === 1 ? [] : [{ id: "user_raced" }] });
      }
      return reply(422, { errors: [{ code: "identifier_taken", message: "taken" }] });
    });
    const result = await provisionClerkUserForEmail({
      email: "raced@acme.example",
      clerkSecretKey: "sk_test_x",
      fetchImpl: impl,
    });
    expect(result).toEqual({ clerkUserId: "user_raced" });
    expect(requests).toHaveLength(3);
  });

  test("a create rejected for another reason answers null", async () => {
    const { impl } = recorder((url) => {
      if (url.includes("email_address")) return reply(200, { data: [] });
      return reply(422, { errors: [{ code: "param_invalid" }] });
    });
    expect(
      await provisionClerkUserForEmail({
        email: "bad@acme.example",
        clerkSecretKey: "sk_test_x",
        fetchImpl: impl,
      }),
    ).toBeNull();
  });

  test("lookup, transport, and create failures answer null without throwing", async () => {
    const failing = recorder(() => reply(503, {}));
    expect(
      await provisionClerkUserForEmail({
        email: "x@acme.example",
        clerkSecretKey: "sk_test_x",
        fetchImpl: failing.impl,
      }),
    ).toBeNull();

    const throwing = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    expect(
      await provisionClerkUserForEmail({
        email: "x@acme.example",
        clerkSecretKey: "sk_test_x",
        fetchImpl: throwing,
      }),
    ).toBeNull();

    const createFails = recorder((url) => {
      if (url.includes("email_address")) return reply(200, { data: [] });
      return reply(500, {});
    });
    expect(
      await provisionClerkUserForEmail({
        email: "x@acme.example",
        clerkSecretKey: "sk_test_x",
        fetchImpl: createFails.impl,
      }),
    ).toBeNull();
  });

  test("an unsent invitation does not null the linkage", async () => {
    const { impl } = recorder((url) => {
      if (url.includes("/v1/invitations")) return reply(500, {});
      if (url.includes("email_address")) return reply(200, { data: [] });
      return reply(201, { id: "user_inv_fail" });
    });
    expect(
      await provisionClerkUserForEmail({
        email: "inv@acme.example",
        clerkSecretKey: "sk_test_x",
        fetchImpl: impl,
      }),
    ).toEqual({ clerkUserId: "user_inv_fail" });
  });

  test("no secret anywhere means no request at all", async () => {
    const saved = process.env[CLERK_SECRET_KEY_ENV];
    delete process.env[CLERK_SECRET_KEY_ENV];
    try {
      let called = false;
      const impl = (async () => {
        called = true;
        return reply(200, {});
      }) as typeof fetch;
      expect(
        await provisionClerkUserForEmail({ email: "x@acme.example", fetchImpl: impl }),
      ).toBeNull();
      expect(called).toBe(false);
    } finally {
      if (saved !== undefined) process.env[CLERK_SECRET_KEY_ENV] = saved;
    }
  });
});
