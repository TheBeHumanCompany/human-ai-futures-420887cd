import { afterEach, describe, expect, test } from "bun:test";

import { clearEpisodeCache, loadEpisodes } from "./feed";

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
    const good = await loadEpisodes();
    expect(good).toHaveLength(1);

    // Force the TTL open, then break the network.
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    // Cache is still within TTL, so this is served from memory.
    await expect(loadEpisodes()).resolves.toHaveLength(1);
  });
});
