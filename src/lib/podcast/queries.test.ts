import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

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
import {
  MAX_TOPICS_PER_EPISODE,
  TAXONOMY_RELATIVE_PATH,
  parseTaxonomy,
  topicDocId,
} from "./topics";

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

/**
 * Slug and audio URL, taken from the corpus rather than invented.
 *
 * These were hand-written stand-ins ("a-fairly-long-guest-name-…", 57 chars, and
 * a made-up 76-character mp3 URL) and **both were shorter than episodes that
 * already exist**: the real maxima are 60 and 90. A fixture called "maximal"
 * that the live data exceeds is not a bound, it is a guess — so both are now
 * derived the same way `LONGEST_TITLE` and `LONGEST_EXCERPT` already were.
 */
const LONGEST_SLUG = catalogue.episodes.reduce((longest, episode) =>
  episode.slug.length > longest.slug.length ? episode : longest,
).slug;

const LONGEST_AUDIO_URL = catalogue.episodes.reduce((longest, episode) =>
  (episode.audioUrl ?? "").length > (longest.audioUrl ?? "").length ? episode : longest,
).audioUrl;

const ASSET_REF = `image-${"a".repeat(40)}-1200x630-png`;

/**
 * The six most expensive topics in the SHIPPED taxonomy, read off
 * `content/topic-taxonomy.json` rather than invented here.
 *
 * This used to be six copies of a `{_id: "topic-leadership0", name: "Leadership"}`
 * placeholder, which measured the placeholder rather than the vocabulary — and
 * understated it in both dimensions: the real names run to 15 characters against
 * that stand-in's 10, and the real ids to 23 against its 18.
 *
 * Six is the documented upper end of the per-episode range, and taking the six
 * largest real entries makes this the genuine worst case a real episode can
 * reach rather than an average one. Because it is read from the file, adding a
 * longer topic name to the taxonomy moves this number — which is exactly the
 * coupling the 16-character ceiling is supposed to have.
 */
const ALL_TAXONOMY_TOPICS = (() => {
  const file = path.join(import.meta.dir, "..", "..", "..", TAXONOMY_RELATIVE_PATH);
  const { taxonomy, errors } = parseTaxonomy(JSON.parse(readFileSync(file, "utf8")));
  if (!taxonomy) throw new Error(`${TAXONOMY_RELATIVE_PATH} is unreadable: ${errors.join("; ")}`);

  return taxonomy.topics
    .map((topic) => ({ _id: topicDocId(topic.slug), name: topic.name }))
    .sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length);
})();

const MAXIMAL_TOPICS = ALL_TAXONOMY_TOPICS.slice(0, MAX_TOPICS_PER_EPISODE);

const MAXIMAL_VALUES: Record<string, unknown> = {
  slug: { current: LONGEST_SLUG },
  episodeNumber: 39,
  title: LONGEST_TITLE,
  excerpt: LONGEST_EXCERPT,
  // See MAXIMAL_TOPICS above: the six largest entries in the shipped taxonomy.
  // This dimension is the budget's tightest constraint by some margin.
  topics: MAXIMAL_TOPICS,
  // 31 chars against a real maximum of 17 — left over-provisioned on purpose.
  // A maximal fixture may exceed the corpus; what it may not do is fall short of
  // it, which is what the slug and audio URL were doing.
  guestName: "A Guest With A Fairly Long Name",
  coverArtwork: ASSET_REF,
  shareCard: ASSET_REF,
  audioUrl: LONGEST_AUDIO_URL,
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
    // Measured, not asserted as a vague margin, because this budget is what
    // decides how the topic taxonomy is allowed to be named.
    //
    // Getting any headroom at all took a deliberate trade, recorded because the
    // next person will want to know why `guestPhoto` is missing from a
    // projection that has `coverArtwork`:
    //
    //   with guestPhoto + shareCard   1,169 B →  31 B spare → ~12-char topics
    //   without guestPhoto            1,094 B → 106 B spare → ~16-char topics
    //
    // Topic names are the tightest input by a wide margin: each character costs
    // ~6 B per episode across a six-topic array. Twelve characters rules out
    // "Sustainability" and "Mental Health"; sixteen does not. That is the whole
    // reason `guestPhoto` was dropped — the directory card renders cover
    // artwork, and the imagery chain has no portrait in it.
    //
    // **RE-MEASURED against the shipped taxonomy (Task 9).** The two figures
    // above were taken against a `{topic-leadership0, "Leadership"}` placeholder
    // AND against a hand-written slug and audio URL that were both shorter than
    // episodes already in the corpus. Correcting all three:
    //
    //   placeholder topics, invented slug/url   1,094 B → 106 B spare
    //   shipped taxonomy, invented slug/url     1,144 B →  56 B spare
    //   shipped taxonomy, real corpus maxima    1,161 B →  39 B spare
    //
    // The last line is the honest one. The plan's own corrected analysis (§2,
    // "per-episode cost rises toward the ~1,145 B maximal case") predicted this
    // within ~16 B, so the number is a confirmation rather than a surprise.
    //
    // 39 B is not much: it is less than one additional topic (~53 B) and about
    // six characters spread across the six-topic array. The 16-character ceiling
    // still holds — the longest shipped name is 15 — but the budget is close to
    // spent, and the next person should treat it as full rather than as having
    // room.
    //
    // **So the taxonomy has a hard ceiling of 16 characters per topic name**,
    // and it is enforced here rather than remembered: exceed it and this row
    // goes red. If it ever does, the question is whether the taxonomy or the
    // budget should move — not whether the constant can be nudged.
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

  test("the maximal topics come from the shipped taxonomy, not a placeholder", () => {
    // Non-vacuity floor for everything above: an empty or unreadable taxonomy
    // would zero out the largest contributor to the measurement and every
    // budget row would pass for the wrong reason.
    expect(MAXIMAL_TOPICS.length).toBe(6);
    for (const topic of MAXIMAL_TOPICS) {
      expect(topic._id).toMatch(/^topic-[a-z0-9-]+$/);
      expect(topic.name.length).toBeGreaterThan(0);
    }
    // Distinct, so this is six real topics rather than one repeated six times.
    expect(new Set(MAXIMAL_TOPICS.map((topic) => topic._id)).size).toBe(6);
  });

  test("pins the recorded measurement, so the comment above cannot rot", () => {
    // The figures in the block above are load-bearing — they are what the
    // 16-character ceiling was derived from — and a comment nothing checks is a
    // comment that drifts. This is the tripwire.
    //
    // Three legitimate things move it: a taxonomy edit, a projection change, or
    // a `catalogue.snapshot.json` refresh that lands a longer title or excerpt.
    // All three are moments to re-read the budget analysis and update it, which
    // is exactly why this is pinned rather than bounded.
    const maximal = Object.fromEntries(
      Object.keys(EPISODE_LIST_PROJECTION).map((alias) => [alias, MAXIMAL_VALUES[alias]]),
    );
    const bytes = new TextEncoder().encode(JSON.stringify(maximal)).length;

    expect(bytes).toBe(1_161);
    expect(PER_EPISODE_BUDGET_BYTES - bytes).toBe(39);
  });

  /**
   * The cap the whole bound rests on, and the reason it lives in the Studio.
   *
   * Everything above measures a SIX-topic episode. Nothing in this file can stop
   * an editor attaching a seventh — Decision K is explicit that the offline
   * bound detects developer changes, and the live 120 kB ceiling detects
   * catalogue growth; an editor over-tagging one episode is neither.
   *
   * So the cap is enforced by `rule.unique().max(6)` on
   * `studio/schemaTypes/episode.ts`, and these rows are what tie that rule to
   * this budget: they prove the seventh topic is not a matter of taste but the
   * exact point where the bound breaks. If someone raises or removes the Studio
   * rule, this is the test that explains what it cost.
   */
  test("a seventh topic breaches the bound — this is why the Studio caps it at six", () => {
    const withN = (count: number) => {
      const values = { ...MAXIMAL_VALUES, topics: ALL_TAXONOMY_TOPICS.slice(0, count) };
      const episode = Object.fromEntries(
        Object.keys(EPISODE_LIST_PROJECTION).map((alias) => [alias, values[alias]]),
      );
      return new TextEncoder().encode(JSON.stringify(episode)).length;
    };

    expect(MAX_TOPICS_PER_EPISODE).toBe(6);
    expect(withN(MAX_TOPICS_PER_EPISODE)).toBeLessThanOrEqual(PER_EPISODE_BUDGET_BYTES);
    expect(withN(MAX_TOPICS_PER_EPISODE + 1)).toBeGreaterThan(PER_EPISODE_BUDGET_BYTES);

    // The taxonomy must actually be able to supply a seventh, or the row above
    // proves nothing about the cap.
    expect(ALL_TAXONOMY_TOPICS.length).toBeGreaterThan(MAX_TOPICS_PER_EPISODE);
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
