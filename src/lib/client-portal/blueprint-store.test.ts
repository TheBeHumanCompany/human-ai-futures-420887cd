import { describe, expect, test } from "bun:test";

import { fetchBlueprintSections } from "./blueprint-store";
import type { SupabaseTokenConfig } from "./supabase-tokens";

const CONFIG: SupabaseTokenConfig = {
  url: "https://x.supabase.co",
  serviceRoleKey: "service-role-key",
};

const PAID = "PAID-BODY-MARKER-9f1c22";

const ROWS = [
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    section_key: "operating-reality",
    ordinal: 1,
    tier: "preliminary",
    title: "The operating reality",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: ["Free."] }] },
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    section_key: "implementation",
    ordinal: 2,
    tier: "final",
    title: "How to build it",
    teaser: "Eight more topics.",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: [PAID] }] },
  },
];

const stub = (rows: unknown, status = 200): typeof fetch =>
  ((input: string | URL | Request) => {
    void input;
    return Promise.resolve(
      new Response(JSON.stringify(rows), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;

describe("fetchBlueprintSections", () => {
  test("asks only for published rows, scoped to the client, ordered", async () => {
    let seen = "";
    const spy = ((input: string | URL | Request) => {
      seen = String(input);
      return Promise.resolve(new Response("[]", { status: 200 }));
    }) as unknown as typeof fetch;

    await fetchBlueprintSections("voes-and-co", true, CONFIG, spy);

    expect(seen).toContain("client_id=eq.voes-and-co");
    expect(seen).toContain("status=eq.published");
    expect(seen).toContain("order=ordinal.asc");
  });

  test("locked: the paid body never leaves this function", async () => {
    const sections = await fetchBlueprintSections("voes-and-co", false, CONFIG, stub(ROWS));

    expect(JSON.stringify(sections)).not.toContain(PAID);
    const final = sections.find((s) => s.tier === "final")!;
    expect(final.locked).toBe(true);
    expect(final.blocks).toBeUndefined();
    expect(final.teaser).toBe("Eight more topics.");
  });

  test("unlocked: the paid body is returned", async () => {
    const sections = await fetchBlueprintSections("voes-and-co", true, CONFIG, stub(ROWS));
    expect(JSON.stringify(sections)).toContain(PAID);
  });

  test("a failed read throws with the status only, never the body", async () => {
    const promise = fetchBlueprintSections(
      "voes-and-co",
      true,
      CONFIG,
      stub({ hint: "secret query detail" }, 500),
    );
    await expect(promise).rejects.toThrow("blueprint lookup answered 500");
    await promise.catch((error: Error) => {
      expect(error.message).not.toContain("secret query detail");
    });
  });

  test("a non-array payload parses to nothing rather than to content", async () => {
    const sections = await fetchBlueprintSections(
      "voes-and-co",
      true,
      CONFIG,
      stub({ not: "an array" }),
    );
    expect(sections).toEqual([]);
  });

  test("a client with no sections yields an empty list, not a failure", async () => {
    expect(await fetchBlueprintSections("new-client", true, CONFIG, stub([]))).toEqual([]);
  });
});
