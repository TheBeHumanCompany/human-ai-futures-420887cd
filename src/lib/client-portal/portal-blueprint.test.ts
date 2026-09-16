import { describe, expect, test } from "bun:test";

import { clientIdForClerkUser, loadPortalBlueprint } from "./portal-blueprint";

/**
 * The engagement lookup behind the signed-in portal (the locked preview).
 *
 * The regression this suite exists to hold: the paid/locked split is made
 * with the `unlocked` flag across two queries, NEVER with one timestamp
 * order. `unlocked` and `unlocked_at` are independent columns with no CHECK
 * tying them, and the fixtures treat `{ unlocked: true, unlocked_at: null }`
 * as valid — a single `order=unlocked_at.desc.nullslast,client_id.asc` would
 * pick a *locked* low-id row ahead of an unlocked row whose timestamp is
 * null, showing a paying client the paywall. A stub cannot prove PostgREST's
 * own ordering, so the URLs are pinned instead: the DB is asked for the
 * unlocked row first, and the locked query only ever fires when the first
 * answers empty.
 */

const CONFIG = {
  url: "https://fixture.supabase.test",
  serviceRoleKey: "service-role-key-for-tests-only",
};

const USER = "user_2KQnABC";

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * A fetch stub that records every request URL and answers
 * `client_paid_reports` reads from a queue of row sets (one per request,
 * last repeating); anything else answers from `other` or 500s.
 */
function stubFetchingEngagements(
  queue: unknown[][],
  other: (url: URL) => Response = () => json(500, { message: "unexpected url in test stub" }),
) {
  const seen: string[] = [];
  let served = 0;
  const impl = (async (input: string | URL | Request) => {
    const raw = input instanceof Request ? input.url : String(input);
    seen.push(raw);
    const url = new URL(raw);
    if (!url.pathname.endsWith("/client_paid_reports")) return other(url);
    const rows = queue[Math.min(served, queue.length - 1)];
    served += 1;
    return json(200, rows);
  }) as typeof fetch;
  return { impl, seen };
}

describe("clientIdForClerkUser — the two-query engagement rule", () => {
  test("the first query asks for the unlocked row, nulls-last ordered, limited to one", async () => {
    const { impl, seen } = stubFetchingEngagements([[{ client_id: "cli-9", unlocked: true }]]);

    await clientIdForClerkUser(USER, CONFIG, impl);

    expect(seen).toHaveLength(1);
    const url = new URL(seen[0]!);
    expect(url.searchParams.get("clerk_user_id")).toBe(`eq.${USER}`);
    expect(url.searchParams.get("unlocked")).toBe("eq.true");
    expect(url.searchParams.get("order")).toBe("unlocked_at.desc.nullslast,client_id.asc");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(url.searchParams.get("select")).toBe("client_id,unlocked");
  });

  test("an unlocked row wins and the locked query is never issued", async () => {
    const { impl, seen } = stubFetchingEngagements([[{ client_id: "cli-9", unlocked: true }]]);

    const engagement = await clientIdForClerkUser(USER, CONFIG, impl);

    expect(engagement).toEqual({ clientId: "cli-9", unlocked: true });
    expect(seen).toHaveLength(1);
  });

  test("only when nothing is unlocked does the lowest-id locked query run", async () => {
    const { impl, seen } = stubFetchingEngagements([[], [{ client_id: "cli-3", unlocked: false }]]);

    const engagement = await clientIdForClerkUser(USER, CONFIG, impl);

    expect(engagement).toEqual({ clientId: "cli-3", unlocked: false });
    expect(seen).toHaveLength(2);
    const second = new URL(seen[1]!);
    expect(second.searchParams.get("unlocked")).toBe("eq.false");
    expect(second.searchParams.get("order")).toBe("client_id.asc");
    expect(second.searchParams.get("limit")).toBe("1");
  });

  test("an unlocked row with a null timestamp still wins over a lower-id locked row", async () => {
    // The fixture shape the repo treats as valid: unlocked, no timestamp. A
    // single ordered query could rank a locked cli-1 ahead of this row; the
    // two-query split cannot — this row's query is answered, so no second
    // query (the only source of locked rows) ever runs.
    const { impl, seen } = stubFetchingEngagements([[{ client_id: "cli-7", unlocked: true }]]);

    const engagement = await clientIdForClerkUser(USER, CONFIG, impl);

    expect(engagement).toEqual({ clientId: "cli-7", unlocked: true });
    expect(seen).toHaveLength(1);
    expect(new URL(seen[0]!).searchParams.get("unlocked")).toBe("eq.true");
  });

  test("two locked rows resolve through the stub's id-ordered answer, reading one page", async () => {
    const { impl, seen } = stubFetchingEngagements([
      [],
      [
        { client_id: "cli-1", unlocked: false },
        { client_id: "cli-5", unlocked: false },
      ],
    ]);

    const engagement = await clientIdForClerkUser(USER, CONFIG, impl);

    expect(engagement).toEqual({ clientId: "cli-1", unlocked: false });
    expect(seen).toHaveLength(2);
  });

  test("no rows at all answers null", async () => {
    const { impl } = stubFetchingEngagements([[], []]);

    expect(await clientIdForClerkUser(USER, CONFIG, impl)).toBeNull();
  });
});

describe("loadPortalBlueprint — the server-only wrapper", () => {
  const SECTION_ROWS = [
    {
      id: "sec-1",
      section_key: "where-you-are",
      ordinal: 1,
      tier: "preliminary",
      title: "Where you are",
      band: "prose",
      body: { blocks: [{ kind: "paragraph", text: "visible" }] },
    },
    {
      id: "sec-2",
      section_key: "the-verdict",
      ordinal: 2,
      tier: "final",
      title: "The verdict",
      band: "prose",
      teaser: "What we actually think",
      body: { blocks: [{ kind: "paragraph", text: "WITHHELD-FINAL-BODY" }] },
    },
  ];

  const sectionsUrl = () => {
    const url = new URL(`${CONFIG.url}/rest/v1/client_blueprint_sections`);
    url.searchParams.set("client_id", "eq.cli-3");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("select", "id,section_key,ordinal,tier,title,teaser,band,body");
    url.searchParams.set("order", "ordinal.asc");
    return url.toString();
  };

  test("a locked engagement arrives with the tier gate applied at the chokepoint", async () => {
    const { impl } = stubFetchingEngagements([[], [{ client_id: "cli-3", unlocked: false }]], () =>
      json(200, SECTION_ROWS),
    );

    const blueprint = await loadPortalBlueprint(USER, {
      fetchImpl: impl,
      supabaseConfig: CONFIG,
    });

    expect(blueprint).toEqual({
      clientId: "cli-3",
      unlocked: false,
      sections: [
        expect.objectContaining({ title: "Where you are", locked: false }),
        expect.objectContaining({
          title: "The verdict",
          locked: true,
          teaser: "What we actually think",
        }),
      ],
    });
    // The withheld body never survives the read.
    const serialized = JSON.stringify(blueprint);
    expect(serialized).not.toContain("WITHHELD-FINAL-BODY");
    expect(serialized).not.toContain(sectionsUrl());
  });

  test("no configuration answers null without any request", async () => {
    const { impl, seen } = stubFetchingEngagements([[]]);

    const blueprint = await loadPortalBlueprint(USER, {
      fetchImpl: impl,
      supabaseConfig: null,
    });

    expect(blueprint).toBeNull();
    expect(seen).toHaveLength(0);
  });

  test("a non-ok status degrades to null with no exception escaping", async () => {
    const { impl } = stubFetchingEngagements([[]], () => json(500, { message: "boom" }));

    const blueprint = await loadPortalBlueprint(USER, {
      fetchImpl: impl,
      supabaseConfig: CONFIG,
    });

    expect(blueprint).toBeNull();
  });

  test("a throwing fetch degrades to null with no exception escaping", async () => {
    const impl = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const blueprint = await loadPortalBlueprint(USER, {
      fetchImpl: impl,
      supabaseConfig: CONFIG,
    });

    expect(blueprint).toBeNull();
  });
});
