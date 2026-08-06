import { afterEach, describe, expect, test } from "bun:test";

import { SanityHttpError } from "../sanity/http";
import { EPISODE_LIST_PROJECTION, EPISODE_PROJECTION, project } from "../sanity/projection-map";
import catalogue from "./catalogue.snapshot.json";
import type { EpisodeListItem } from "./episode";
import {
  EPISODE_BY_SLUG_QUERY,
  EPISODE_LIST_QUERY,
  SITEMAP_ENTRIES_QUERY,
  fetchEpisodeBySlugFn,
  fetchEpisodeListFn,
  fetchSitemapEntriesFn,
  validateSlug,
} from "./queries";

/* ------------------------------------------------------------------ stubs -- */

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Records every outbound Request, so assertions run against the real thing. */
function stubFetch(respond: (request: Request) => Response): Request[] {
  const requests: Request[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as RequestInfo, init);
    requests.push(request);
    return Promise.resolve(respond(request));
  }) as typeof fetch;
  return requests;
}

/** Sanity's success shape: `{result: …}` with a JSON content type. */
const ok = (result: unknown) =>
  new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

async function capture(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error("expected a rejection, but the call resolved");
}

/* --------------------------------------------------------------- fixtures -- */

const LIST_ITEM: EpisodeListItem = {
  slug: { current: "jenn-harper-cheekbone-beauty" },
  episodeNumber: 5,
  title: "Building Cheekbone Beauty",
  excerpt: "An Indigenous-owned cosmetics company built on giving back.",
  topics: null,
  guestName: "Jenn Harper",
  guestPhoto: null,
  coverArtwork: null,
  audioUrl: "https://mcdn.podbean.com/a.mp3",
  durationSeconds: 3000,
  publishedAt: "2025-02-01T00:00:00.000Z",
};

/* --------------------------------------------- the generated-fragment rule -- */

describe("every query is built by project(), never hand-written", () => {
  test("the by-slug query embeds the generated EPISODE_PROJECTION fragment verbatim", () => {
    expect(EPISODE_BY_SLUG_QUERY).toContain(project(EPISODE_PROJECTION));
  });

  test("the list query embeds the generated EPISODE_LIST_PROJECTION fragment verbatim", () => {
    expect(EPISODE_LIST_QUERY).toContain(project(EPISODE_LIST_PROJECTION));
  });

  test("the two fragments are genuinely different, so neither test passes by coincidence", () => {
    // If the list query accidentally used the full projection, both assertions
    // above would still pass. This is the row that notices.
    expect(project(EPISODE_LIST_PROJECTION)).not.toBe(project(EPISODE_PROJECTION));
    expect(EPISODE_LIST_QUERY).not.toContain(project(EPISODE_PROJECTION));
  });

  test("the list is ordered newest-first by the server, not by the caller", () => {
    // Ordering is the query's job — a stubbed fetch cannot prove the server
    // sorted anything, so what is asserted here is that we asked for it. The
    // real ordering is covered by queries.live.test.ts.
    expect(EPISODE_LIST_QUERY).toContain("order(publishedAt desc)");
  });

  test("every query restricts to published episodes with a slug", () => {
    for (const query of [EPISODE_BY_SLUG_QUERY, EPISODE_LIST_QUERY, SITEMAP_ENTRIES_QUERY]) {
      expect(query).toContain('_type == "episode"');
      expect(query).toContain("defined(slug.current)");
    }
  });
});

/* ------------------------------------------------------------- by-slug -- */

describe("fetchEpisodeBySlugFn", () => {
  test("returns the episode when one matches", async () => {
    stubFetch(() => ok(LIST_ITEM));
    await expect(fetchEpisodeBySlugFn("jenn-harper-cheekbone-beauty")).resolves.toMatchObject({
      title: "Building Cheekbone Beauty",
    });
  });

  test("returns null for an unknown slug — a successful query, not a failure", async () => {
    // The distinction the whole outage design rests on. GROQ's `[0]` over an
    // empty result set yields null; the request succeeded and 404 is the honest
    // answer. This must never surface as a throw.
    stubFetch(() => ok(null));
    await expect(fetchEpisodeBySlugFn("no-such-episode")).resolves.toBeNull();
  });

  test("sends the slug as a GROQ parameter, never interpolated into the query", async () => {
    const requests = stubFetch(() => ok(null));
    const hostile = 'x"] { _id } // ';
    await fetchEpisodeBySlugFn(hostile);

    // Parsed rather than string-matched: `URLSearchParams` encodes a space as
    // `+`, which `decodeURIComponent` does not reverse, so a naive
    // `toContain` on the decoded URL fails against a correctly-sent value.
    const params = new URL(requests[0].url).searchParams;

    // Asserted POSITIVELY — the payload must survive into the params, intact,
    // round-tripping through the JSON encoding the transport applies. Asserting
    // only "the query does not contain the payload" would pass just as well if
    // the value had been dropped entirely: the classic vacuous injection test.
    expect(JSON.parse(params.get("$slug") ?? "null")).toBe(hostile);

    // And the query text carries the parameter reference, never the value —
    // which is what makes the injection structurally impossible rather than
    // filtered.
    expect(params.get("query")).toContain("$slug");
    expect(params.get("query")).not.toContain(hostile);
  });
});

describe("failures propagate rather than becoming empty results", () => {
  test("a non-200 throws instead of resolving to null", async () => {
    // Swallowing this would render "no such episode" during an outage — a 404
    // on a permanent URL because a third party was down.
    stubFetch(() => new Response("nope", { status: 503 }));
    const error = await capture(() => fetchEpisodeBySlugFn("jenn-harper-cheekbone-beauty"));
    expect(error).toBeInstanceOf(SanityHttpError);
  });

  test("a list failure throws instead of resolving to []", async () => {
    // An empty array is indistinguishable from a genuinely empty catalogue.
    stubFetch(() => new Response("nope", { status: 500 }));
    const error = await capture(() => fetchEpisodeListFn());
    expect(error).toBeInstanceOf(SanityHttpError);
    expect((error as SanityHttpError).reason).toBe("upstream");
  });

  test("a sitemap failure throws, so a truncated sitemap can never be emitted", async () => {
    stubFetch(() => new Response("nope", { status: 500 }));
    expect(await capture(() => fetchSitemapEntriesFn())).toBeInstanceOf(SanityHttpError);
  });
});

/* ------------------------------------------------------- the payload bound -- */

/**
 * The maximal value for each projected field, keyed by its alias.
 *
 * Built from the real corpus where the corpus has a maximum (title, excerpt)
 * and from the documented worst case elsewhere (a full six-topic array,
 * populated asset refs). A Sanity asset `_ref` is a fixed-shape string —
 * `image-<40 hex>-<dims>-<ext>` — so its length is a fact, not an estimate.
 */
const LONGEST_TITLE = catalogue.episodes.reduce((longest, episode) =>
  episode.title.length > longest.title.length ? episode : longest,
).title;

const LONGEST_EXCERPT = catalogue.episodes.reduce((longest, episode) =>
  episode.excerpt.length > longest.excerpt.length ? episode : longest,
).excerpt;

const ASSET_REF = `image-${"a".repeat(40)}-1200x630-png`;

const MAXIMAL_VALUES: Record<string, unknown> = {
  slug: { current: "a-fairly-long-guest-name-and-a-fairly-long-title-fragment" },
  episodeNumber: 39,
  title: LONGEST_TITLE,
  excerpt: LONGEST_EXCERPT,
  // Six topics — the documented upper end of the per-episode range — each
  // sized to the ~48 B the payload analysis assumed. See the headroom test
  // below: this dimension is the budget's tightest constraint by some margin.
  topics: Array.from({ length: 6 }, (_unused, index) => ({
    _id: `topic-leadership${index}`,
    name: "Leadership",
  })),
  guestName: "A Guest With A Fairly Long Name",
  guestPhoto: ASSET_REF,
  coverArtwork: ASSET_REF,
  shareCard: ASSET_REF,
  audioUrl: "https://mcdn.podbean.com/mf/web/abcdefghij/episode-thirty-nine-final-mix.mp3",
  durationSeconds: 5400,
  publishedAt: "2025-02-01T00:00:00.000Z",
};

describe("the offline per-episode payload bound", () => {
  /**
   * Decision K's regression detector.
   *
   * The directory fetches the whole catalogue, so per-episode size is the
   * architectural constraint. This bound is built from `EPISODE_LIST_PROJECTION`
   * itself rather than from a hand-listed object, which is what makes it go red
   * for the right reason: **adding a field to the projection** breaks the
   * completeness row below until someone gives it a maximal value, and then
   * grows the measured size. A hand-written fixture would only ever measure
   * itself.
   *
   * It is NOT the escalation trigger. That is the live 120 kB ceiling in
   * queries.live.test.ts, which fires on catalogue growth. This one fires on a
   * developer's change, which is the thing a developer can act on.
   */
  const PER_EPISODE_BUDGET_BYTES = 1_200;

  test("the fixture covers every projected field — this is what a new field breaks", () => {
    const projected = Object.keys(EPISODE_LIST_PROJECTION);
    const missing = projected.filter((alias) => !(alias in MAXIMAL_VALUES));

    expect(missing).toEqual([]);
    // Floor: an empty projection would satisfy the line above perfectly.
    expect(projected.length).toBeGreaterThanOrEqual(11);
  });

  test("a maximal episode serializes under the per-episode budget", () => {
    const maximal = Object.fromEntries(
      Object.keys(EPISODE_LIST_PROJECTION).map((alias) => [alias, MAXIMAL_VALUES[alias]]),
    );

    const bytes = new TextEncoder().encode(JSON.stringify(maximal)).length;
    expect(bytes).toBeLessThanOrEqual(PER_EPISODE_BUDGET_BYTES);
    // Floor: proves we measured a populated object rather than `{}`.
    expect(bytes).toBeGreaterThan(400);
  });

  test("records how much headroom the budget actually has, and where it goes", () => {
    // Measured, not asserted as a vague margin, because the margin is now
    // small enough that the next scheduled change spends it.
    //
    // A maximal episode measures ~1,169 B against the 1,200 B budget: about
    // 31 B. It was ~105 B before `shareCard` entered this projection; that one
    // field cost ~74 B, which is most of what there was.
    //
    // **The remaining headroom does not survive realistic topic names.** These
    // six entries use a 10-character name ("Leadership") costing ~48 B each. A
    // 22-character one ("Leadership and Culture") costs ~73 B — six of those add
    // ~150 B and take a maximal episode to roughly 1,320 B, well over budget,
    // with no new field involved at all.
    //
    // So the topic taxonomy's naming is a payload decision before it is an
    // editorial one, and it is decided in the task that creates the taxonomy —
    // which has not run yet. Two honest options at that point: keep topic names
    // short, or raise this budget deliberately with the measurement written
    // down. What must not happen is the number being nudged up to make a red
    // test green, because the budget is the only thing standing between the
    // directory and a payload nobody is watching.
    const maximal = Object.fromEntries(
      Object.keys(EPISODE_LIST_PROJECTION).map((alias) => [alias, MAXIMAL_VALUES[alias]]),
    );
    const bytes = new TextEncoder().encode(JSON.stringify(maximal)).length;

    const withoutTopics = { ...maximal };
    delete (withoutTopics as Record<string, unknown>).topics;
    const topicBytes = bytes - new TextEncoder().encode(JSON.stringify(withoutTopics)).length;

    expect(bytes).toBeLessThanOrEqual(PER_EPISODE_BUDGET_BYTES);
    // Topics are the single largest contributor after the two text fields; if
    // that stops being true the analysis above needs redoing.
    expect(topicBytes).toBeGreaterThan(200);
  });

  test("the maximal fixture is genuinely larger than a typical real episode", () => {
    // Otherwise "maximal" is a label rather than a property, and the budget is
    // being checked against something the real data can exceed.
    const typical = new TextEncoder().encode(JSON.stringify(LIST_ITEM)).length;
    const maximal = new TextEncoder().encode(
      JSON.stringify(
        Object.fromEntries(
          Object.keys(EPISODE_LIST_PROJECTION).map((alias) => [alias, MAXIMAL_VALUES[alias]]),
        ),
      ),
    ).length;

    expect(maximal).toBeGreaterThan(typical);
  });
});

/* -------------------------------------------------------------- validator -- */

describe("validateSlug", () => {
  test("accepts a real slug", () => {
    expect(validateSlug("jenn-harper-cheekbone-beauty")).toBe("jenn-harper-cheekbone-beauty");
  });

  test("rejects a non-string or empty value rather than coercing it", () => {
    for (const value of [undefined, null, 42, {}, [], ""]) {
      expect(() => validateSlug(value)).toThrow();
    }
  });
});
