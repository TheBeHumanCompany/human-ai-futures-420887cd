import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { CACHE_TTL_MS, clearEpisodeCache, loadEpisodes } from "./feed";

const realFetch = globalThis.fetch;

const FEED = `<rss><channel>
<item>
  <title><![CDATA[Episode 1: One: Ada Lovelace on Engines]]></title>
  <pubDate>Tue, 01 Jul 2025 12:00:00 -0300</pubDate>
  <guid isPermaLink="false">show.podbean.com/one</guid>
  <description>Notes</description>
  <itunes:duration>600</itunes:duration>
  <itunes:episode>1</itunes:episode>
  <enclosure url="https://mcdn.podbean.com/mf/web/a/one.mp3" length="1" type="audio/mpeg"/>
</item>
</channel></rss>`;

function stubFetch(body: string, delayMs = 20) {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return new Response(body, { status: 200, headers: { "content-type": "text/xml" } });
  }) as typeof fetch;
  return () => calls;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  clearEpisodeCache();
  // Restore the real clock; the stale-serving test moves it forward.
  setSystemTime();
});

describe("loadEpisodes caching", () => {
  test("concurrent cold callers share a single upstream fetch", async () => {
    // Regression: caching the resolved value rather than the in-flight promise
    // meant 12 concurrent SSR requests on a cold instance each pulled and
    // parsed the full feed. Vercel Fluid Compute reuses instances across
    // concurrent invocations, so this is the realistic shape, not a corner case.
    clearEpisodeCache();
    const calls = stubFetch(FEED);

    const results = await Promise.all(Array.from({ length: 12 }, () => loadEpisodes()));

    expect(calls()).toBe(1);
    for (const result of results) expect(result).toHaveLength(1);
  });

  test("a warm cache issues no fetch at all", async () => {
    clearEpisodeCache();
    const calls = stubFetch(FEED);

    await loadEpisodes();
    expect(calls()).toBe(1);

    await loadEpisodes();
    await loadEpisodes();
    expect(calls()).toBe(1);
  });

  test("a failed fetch is not cached and does not throw", async () => {
    clearEpisodeCache();
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new Error("network down");
    }) as typeof fetch;

    await expect(loadEpisodes()).resolves.toEqual([]);
    await expect(loadEpisodes()).resolves.toEqual([]);
    // Retried rather than memoising the failure.
    expect(calls).toBe(2);
  });

  test("a non-200 response yields the empty state rather than throwing", async () => {
    clearEpisodeCache();
    globalThis.fetch = (async () =>
      new Response("nope", { status: 503 })) as unknown as typeof fetch;

    await expect(loadEpisodes()).resolves.toEqual([]);
  });

  test("serves the last good result when a later refresh fails", async () => {
    clearEpisodeCache();
    stubFetch(FEED, 0);
    expect(await loadEpisodes()).toHaveLength(1);

    // Genuinely expire the entry. The previous version of this test only said
    // it was forcing the TTL open — it never moved the clock, so `loadEpisodes`
    // short-circuited on the still-fresh value and the failing refresh below
    // was never attempted. It re-tested the warm-cache path and passed while
    // stale-serving was entirely unexercised.
    setSystemTime(new Date(Date.now() + CACHE_TTL_MS + 1_000));

    let refreshAttempts = 0;
    globalThis.fetch = (async () => {
      refreshAttempts += 1;
      throw new Error("network down");
    }) as typeof fetch;

    await expect(loadEpisodes()).resolves.toHaveLength(1);
    // The assertion that makes this test non-vacuous: the refresh was actually
    // attempted and failed, and the stale value was served instead of [].
    expect(refreshAttempts).toBe(1);
  });

  test("a cold instance has nothing stale to serve", async () => {
    // The honest bound on the guarantee above: stale-serving is instance-local
    // and opportunistic. With no prior success in this process there is no last
    // good value, and the empty state is what renders — not a stale catalogue.
    clearEpisodeCache();
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    await expect(loadEpisodes()).resolves.toEqual([]);
  });
});
