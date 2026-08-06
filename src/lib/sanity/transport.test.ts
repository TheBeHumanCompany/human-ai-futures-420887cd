import { afterEach, describe, expect, test } from "bun:test";

import { GET_URL_LIMIT, SITE_ORIGIN, absoluteUrl, episodeUrl } from "./config";
import { imageRef, imageUrl, ogImageUrl } from "./image";
import {
  MUTATION_BATCH_LIMIT_BYTES,
  SanityHttpError,
  docsUrlFor,
  getDocuments,
  groq,
  methodFor,
  mutate,
  queryUrlFor,
} from "./http";

/**
 * Everything below the pure-URL tests goes through a stubbed `fetch` and
 * asserts against the **outbound `Request`**, not against the `RequestInit`
 * this module happened to construct.
 *
 * The distinction is the point. An assertion on the config object checks what
 * we intended to send; an assertion on a real `Request` checks what a runtime
 * built from it — after header merging, after the spread of `request.headers`
 * over the defaults, after `Request`'s own normalisation. AC-11 ("reads carry
 * no `Authorization`") is a claim about the wire, and only the second kind of
 * assertion is evidence for it. The first kind is how a header added by a
 * later spread stays green forever.
 */
const realFetch = globalThis.fetch;

function stubFetch(respond: (request: Request) => Response | Promise<Response>): Request[] {
  const requests: Request[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as RequestInfo, init);
    requests.push(request);
    return Promise.resolve(respond(request));
  }) as typeof fetch;
  return requests;
}

/** JSON, the way Sanity answers: a 200 with an object body. */
function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * A `fetch` that never answers and rejects exactly the way a real one does when
 * its signal fires — with `signal.reason`, which is the runtime's own
 * `TimeoutError` `DOMException`.
 *
 * Deliberately not `Promise.reject(new DOMException(...))`: that would assert
 * this module handles an error the test invented. This way the error under test
 * is produced by `AbortSignal.timeout()` itself, which is the thing that
 * actually throws in production.
 */
function stubHangingFetch(): void {
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    const signal = init?.signal;
    return new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal.reason));
    });
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Fails the test if `thrown` is not a transport error carrying Decision E's cause. */
function expectUpstream(thrown: unknown): SanityHttpError {
  expect(thrown).toBeInstanceOf(SanityHttpError);
  const error = thrown as SanityHttpError;
  // The whole reason the class exists: `fallback.ts` branches on `reason`, and
  // a transport failure that arrives without one is a degradation with no cause
  // reaching a switch that has no case for it.
  expect(error.reason).toBe("upstream");
  return error;
}

async function capture(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to reject, but it resolved");
}

describe("config", () => {
  test("the canonical origin is the confirmed .ca host", () => {
    // Confirmed 2026-08-05. Every shared link is absolute against this and it
    // cannot change afterwards, so it is asserted rather than assumed.
    expect(SITE_ORIGIN).toBe("https://thebehumancompany.ca");
  });

  test("episode URLs are absolute and correctly shaped", () => {
    expect(episodeUrl("john-smith-building-trust")).toBe(
      "https://thebehumancompany.ca/podcast/john-smith-building-trust",
    );
  });

  test("absoluteUrl handles paths with and without a leading slash consistently", () => {
    expect(absoluteUrl("/podcast")).toBe("https://thebehumancompany.ca/podcast");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://thebehumancompany.ca/sitemap.xml");
  });
});

describe("query transport", () => {
  test("builds a CDN query URL against the published perspective", () => {
    const url = queryUrlFor('*[_type == "episode"]');
    expect(url).toStartWith("https://5apyl3sk.apicdn.sanity.io/v2026-08-01/data/query/production?");
    expect(url).toContain("perspective=published");
  });

  test("encodes params as $-prefixed JSON, which is what makes injection impossible", () => {
    const params = new URL(
      queryUrlFor('*[_type == "episode" && slug.current == $slug][0]', { slug: "john-smith" }),
    ).searchParams;
    expect(params.get("$slug")).toBe('"john-smith"');
  });

  test("a hostile param value stays in the params, never in the query", () => {
    // The classic GROQ injection shape. It must survive as inert data.
    const hostile = '"] || _type == "user" || ["';
    const source = '*[_type == "episode" && slug.current == $slug]';
    const params = new URL(queryUrlFor(source, { slug: hostile })).searchParams;

    // The query is byte-for-byte what we wrote — the payload never becomes syntax.
    expect(params.get("query")).toBe(source);
    // And the payload is carried as a JSON string value, not concatenated in.
    expect(params.get("$slug")).toBe(JSON.stringify(hostile));
  });

  test("short queries use GET", () => {
    expect(methodFor('*[_type == "episode"][0...12]')).toBe("GET");
  });

  test("switches to POST before Sanity's 11 kB GET ceiling", () => {
    // Not hypothetical: a long multi-term search plus filters against a real
    // projection crosses this. It would fail in production, not in a test with
    // 39 episodes, which is why the threshold is pinned here.
    const huge = "x".repeat(11_000);
    expect(methodFor('*[_type == "episode" && searchText match $q]', { q: huge })).toBe("POST");
  });

  test("the GET threshold sits below the documented ceiling with room for the hops in between", () => {
    // Pinned as a number because the safety margin *is* the decision: the URL
    // that has to fit under 11 kB is the one arriving at Sanity after a CDN POP
    // and whatever re-encoding it applies, not the one measured here.
    expect(GET_URL_LIMIT).toBe(9_000);
    expect(GET_URL_LIMIT).toBeLessThan(11_000);
  });
});

describe("groq() over the wire", () => {
  const RESULT = [{ _id: "episode-1", title: "One" }];

  test("a read carries no authorization header on the actual outbound Request (AC-11)", async () => {
    // The guarantee is about the wire. A published-perspective read needs no
    // credential, this is the one Sanity module that reaches the server bundle,
    // and the URL it produces is cached by a public CDN — so a token here would
    // be a token cached against a public key.
    const requests = stubFetch(() => json({ result: RESULT }));

    await groq('*[_type == "episode"]');

    expect(requests).toHaveLength(1);
    expect(requests[0].headers.get("authorization")).toBeNull();
    // Asserted by absence of the *header*, not by absence of a token variable:
    // no spelling of it survives either.
    expect([...requests[0].headers.keys()]).not.toContain("authorization");
  });

  test("the POST branch is equally credential-free", async () => {
    // The long-query branch builds its own headers object and merges it over
    // the defaults, so it is a second, separate opportunity to leak one.
    const requests = stubFetch(() => json({ result: RESULT }));

    await groq('*[_type == "episode" && searchText match $q]', { q: "x".repeat(11_000) });

    expect(requests[0].method).toBe("POST");
    expect(requests[0].headers.get("authorization")).toBeNull();
  });

  test("a short query is sent as a real GET with the query in the URL", async () => {
    // `methodFor()` is a pure helper and can agree with itself forever. This
    // asserts the method the request actually carried.
    const requests = stubFetch(() => json({ result: RESULT }));

    await groq('*[_type == "episode"][0...12]');

    expect(requests[0].method).toBe("GET");
    expect(new URL(requests[0].url).searchParams.get("query")).toBe(
      '*[_type == "episode"][0...12]',
    );
  });

  test("a query past the limit is sent as a real POST carrying query and params in the body", async () => {
    const huge = "x".repeat(11_000);
    const requests = stubFetch(() => json({ result: RESULT }));

    await groq('*[_type == "episode" && searchText match $q]', { q: huge });

    const request = requests[0];
    expect(request.method).toBe("POST");
    // The endpoint, with the query no longer in the URL at all — which is the
    // entire reason the switchover exists.
    expect(new URL(request.url).search).toBe("");
    expect(await request.json()).toEqual({
      query: '*[_type == "episode" && searchText match $q]',
      params: { q: huge },
      perspective: "published",
    });
  });

  test("a successful query returns the result body unwrapped", async () => {
    stubFetch(() => json({ result: RESULT, ms: 6 }));
    expect(await groq('*[_type == "episode"]')).toEqual(RESULT);
  });

  test("an empty match is a result, not a failure", async () => {
    // Confirmed against the live dataset: a no-match array query answers
    // `result: []` and a no-match `[0]` answers `result: null`. Neither is a
    // malformed body, and treating either as one would turn "no episodes
    // matched this filter" into an outage.
    stubFetch(() => json({ result: [] }));
    expect(await groq('*[_type == "episode" && slug.current == $s]', { s: "nope" })).toEqual([]);

    stubFetch(() => json({ result: null }));
    expect(await groq('*[_type == "episode"][0]')).toBeNull();
  });

  test("a timeout surfaces as a typed error carrying reason: upstream, not a raw DOMException", async () => {
    stubHangingFetch();

    const error = expectUpstream(
      await capture(() => groq('*[_type == "episode"]', {}, AbortSignal.timeout(5))),
    );

    expect(error.message).toContain("timed out");
    // The runtime's own TimeoutError is preserved rather than discarded, so a
    // log line can still show what the platform actually reported.
    expect((error.cause as { name?: string }).name).toBe("TimeoutError");
  });

  test("a non-200 surfaces as a typed error carrying reason: upstream and the status", async () => {
    stubFetch(() => json({ error: { description: "nope" } }, 503));

    const error = expectUpstream(await capture(() => groq('*[_type == "episode"]')));

    expect(error.status).toBe(503);
  });

  test("a body that is not JSON surfaces as a typed error carrying reason: upstream, not a SyntaxError", async () => {
    // A CDN interstitial or proxy error page wearing a 200 — the shape that
    // made `response.json()` throw a bare SyntaxError out of the transport.
    stubFetch(() => new Response("<html>gateway</html>", { status: 200 }));

    const error = expectUpstream(await capture(() => groq('*[_type == "episode"]')));

    expect(error.message).toContain("not JSON");
    expect(error).not.toBeInstanceOf(SyntaxError);
  });

  test("a 200 whose JSON has no result is a malformed shape, not an undefined result", async () => {
    // The failure the old `body.result as T` cast hid: a well-formed JSON body
    // that is not a query response at all became `undefined` flowing into the
    // render path as though Sanity had answered.
    stubFetch(() => json({ ok: true }));

    const error = expectUpstream(await capture(() => groq('*[_type == "episode"]')));

    expect(error.message).toContain("result");
  });

  test("an API-level error object is an error even under a 200", async () => {
    stubFetch(() => json({ error: { description: "expected ']' following array body" } }));

    const error = expectUpstream(await capture(() => groq("*[[[")));

    expect(error.message).toContain("expected ']'");
  });
});

describe("getDocuments() over the wire", () => {
  const EPISODE = {
    _id: "episode-1",
    _type: "episode",
    title: "One",
    // A full document, not a projection: the nested wrapper is exactly what a
    // projected pre-read would have flattened, and what `publish.ts`'s row-3
    // comparison needs to see to ever be equal.
    guestPhoto: { _type: "image", asset: { _ref: "image-abc123def456-1200x630-jpg" } },
  };
  const LOCK = { _id: "slugLock-one", _type: "slugLock", episodeId: "episode-1" };

  test("requests the uncached api.sanity.io host on the actual outbound Request", async () => {
    // `docsUrlFor()` is a string builder and cannot prove where the request
    // went. A pre-read served from the CDN would be stale by design, which
    // defeats the entire purpose of taking it.
    const requests = stubFetch(() => json({ documents: [EPISODE], omitted: [] }));

    await getDocuments(["episode-1"], { token: "t" });

    expect(requests[0].url).toStartWith("https://5apyl3sk.api.sanity.io/v2026-08-01/data/doc/");
    expect(requests[0].url).not.toContain("apicdn");
    expect(requests[0].method).toBe("GET");
  });

  test("returns the full documents Sanity sent, untouched", async () => {
    stubFetch(() => json({ documents: [EPISODE, LOCK] }));

    expect(await getDocuments(["episode-1", "slugLock-one"], { token: "t" })).toEqual([
      EPISODE,
      LOCK,
    ]);
  });

  test("authenticates with the supplied token, unlike the read path", async () => {
    const requests = stubFetch(() => json({ documents: [] }));

    await getDocuments(["episode-1"], { token: "secret-token" });

    expect(requests[0].headers.get("authorization")).toBe("Bearer secret-token");
  });

  test("an existence omission is ordinary absence and returns the documents that were found", async () => {
    // The normal shape of "this episode has not been published yet", which is
    // the majority case for every backfill run.
    stubFetch(() =>
      json({ documents: [EPISODE], omitted: [{ id: "slugLock-one", reason: "existence" }] }),
    );

    expect(await getDocuments(["episode-1", "slugLock-one"], { token: "t" })).toEqual([EPISODE]);
  });

  test("a permission omission is a hard error carrying reason: upstream", async () => {
    // Misreading this as absence turns a strict `create` into a spurious
    // conflict against a document that was there the whole time.
    stubFetch(() =>
      json({ documents: [], omitted: [{ id: "slugLock-one", reason: "permission" }] }),
    );

    const error = expectUpstream(
      await capture(() => getDocuments(["slugLock-one"], { token: "t" })),
    );

    expect(error.message).toContain("slugLock-one");
    expect(error.message).toContain("permission denied");
  });

  test("a non-200 surfaces as a typed error carrying reason: upstream and the status", async () => {
    stubFetch(() => json({}, 401));

    const error = expectUpstream(await capture(() => getDocuments(["episode-1"], { token: "t" })));

    expect(error.status).toBe(401);
  });

  test("a body that is not JSON surfaces as a typed error carrying reason: upstream", async () => {
    stubFetch(() => new Response("not json at all", { status: 200 }));

    const error = expectUpstream(await capture(() => getDocuments(["episode-1"], { token: "t" })));

    expect(error.message).toContain("not JSON");
  });

  test("a 200 without a documents array is a malformed shape, never an empty pre-read", async () => {
    // The single most dangerous default this transport could have. Verified
    // against the live endpoint: even a fetch that matches nothing answers
    // `{"documents":[],"omitted":[...]}`, so a missing key is never "nothing
    // exists" — and `publish.ts` builds a *creating* transaction from an empty
    // pre-read.
    stubFetch(() => json({ omitted: [] }));

    const error = expectUpstream(await capture(() => getDocuments(["episode-1"], { token: "t" })));

    expect(error.message).toContain("documents");
  });

  test("a timeout surfaces as a typed error carrying reason: upstream", async () => {
    // `getDocuments()` takes no caller signal, so its 8 s deadline cannot be
    // shortened the way `groq()`'s can. Rather than assert against an error the
    // test invented, a genuine one is harvested from a 1 ms `AbortSignal.timeout`
    // and handed to the stub — the same object identity and the same `name` the
    // runtime would produce eight seconds later.
    const genuineTimeout = await new Promise<unknown>((resolve) => {
      const signal = AbortSignal.timeout(1);
      signal.addEventListener("abort", () => resolve(signal.reason));
    });
    globalThis.fetch = (() => Promise.reject(genuineTimeout)) as typeof fetch;

    const error = expectUpstream(await capture(() => getDocuments(["episode-1"], { token: "t" })));

    expect(error.message).toContain("timed out");
    expect(error.cause).toBe(genuineTimeout);
  });
});

describe("mutate() batching", () => {
  const OK = () => json({ transactionId: "t1", results: [] });

  /** Roughly `bytes` of serialized JSON in a single mutation. */
  function bigMutation(id: string, bytes: number): unknown {
    return { create: { _id: id, _type: "episode", description: "a".repeat(bytes) } };
  }

  async function submitted(requests: Request[]): Promise<unknown[][]> {
    return Promise.all(
      requests.map(
        async (request) => ((await request.json()) as { mutations: unknown[] }).mutations,
      ),
    );
  }

  test("the atomic pair publish.ts depends on is submitted as ONE transaction", async () => {
    // This is the guarantee batching must not cost. `publishEpisode()` submits
    // the slugLock strict `create` and the episode strict `create` together
    // *because* losing the race has to roll back both; a split between them
    // leaves a lock pointing at an episode that was never published, which is
    // the exact race Decision F exists to close.
    const requests = stubFetch(OK);
    const pair = [
      { create: { _id: "slugLock-one", _type: "slugLock", episodeId: "episode-1" } },
      { create: { _id: "episode-1", _type: "episode", title: "One" } },
    ];

    await mutate(pair, { token: "t" });

    expect(requests).toHaveLength(1);
    expect(await submitted(requests)).toEqual([pair]);
  });

  test("a body past the 3 MB limit is split into multiple batches", async () => {
    const requests = stubFetch(OK);
    const mutations = [
      bigMutation("a", 1_000_000),
      bigMutation("b", 1_000_000),
      bigMutation("c", 1_000_000),
      bigMutation("d", 1_000_000),
    ];

    await mutate(mutations, { token: "t", atomic: false });

    expect(requests.length).toBeGreaterThan(1);
    // Every mutation is submitted exactly once, in order, across the batches —
    // splitting must not drop, duplicate or reorder anything.
    expect((await submitted(requests)).flat()).toEqual(mutations);
  });

  test("no submitted batch exceeds the byte limit, which is the point of measuring bytes", async () => {
    const requests = stubFetch(OK);

    await mutate(
      Array.from({ length: 8 }, (_unused, index) => bigMutation(`doc-${index}`, 900_000)),
      { token: "t", atomic: false },
    );

    for (const request of requests) {
      const bytes = new TextEncoder().encode(await request.text()).length;
      expect(bytes).toBeLessThanOrEqual(MUTATION_BATCH_LIMIT_BYTES);
    }
  });

  test("a mutation array under the limit is never split, however many entries it has", async () => {
    // The count-based threshold this deliberately is not: 500 small mutations
    // are one request, because 500 small mutations are a small request.
    const requests = stubFetch(OK);
    const mutations = Array.from({ length: 500 }, (_unused, index) => ({
      delete: { id: `episode-${index}` },
    }));

    await mutate(mutations, { token: "t" });

    expect(requests).toHaveLength(1);
    expect(await submitted(requests)).toEqual([mutations]);
  });

  test("a single mutation larger than the limit is sent alone rather than dropped", async () => {
    // It will be refused upstream, with a status and a description naming the
    // real problem. Silently discarding it, or pairing it with an empty batch,
    // would be this transport inventing an answer it does not have.
    const requests = stubFetch(OK);
    const oversized = bigMutation("huge", MUTATION_BATCH_LIMIT_BYTES + 1_000);

    await mutate([oversized], { token: "t" });

    expect(await submitted(requests)).toEqual([[oversized]]);
  });

  test("batches are submitted sequentially and stop at the first failure", async () => {
    // Fail-fast leaves a deterministic prefix applied and the remainder
    // untouched — a state a caller can reason about and re-run. Concurrent
    // submission would leave an arbitrary subset applied instead.
    let call = 0;
    const requests = stubFetch(() => {
      call += 1;
      return call === 1 ? OK() : json({ error: { description: "quota exceeded" } }, 429);
    });

    const error = expectUpstream(
      await capture(() =>
        mutate(
          Array.from({ length: 6 }, (_unused, index) => bigMutation(`doc-${index}`, 1_200_000)),
          { token: "t", atomic: false },
        ),
      ),
    );

    expect(error.status).toBe(429);
    // Two attempted, four never sent — not all six fired off in parallel.
    expect(requests).toHaveLength(2);
  });

  test("a mutation failure keeps carrying its status, which is what publish.ts retries on", async () => {
    // `isCreateConflict()` in publish.ts is `status === 409` and nothing else.
    // Batching moved this throw site, so the status has to be re-proved here.
    stubFetch(() => json({ error: { description: "document already exists" } }, 409));

    const error = expectUpstream(
      await capture(() => mutate([{ create: { _id: "episode-1" } }], { token: "t" })),
    );

    expect(error.status).toBe(409);
  });

  test("every batch response is returned, one entry per submitted batch", async () => {
    // A uniform array in every case, including the single-batch one. A return
    // shape that changed with the input size would be a footgun for the first
    // caller to read it.
    let call = 0;
    stubFetch(() => json({ transactionId: `t${(call += 1)}` }));

    const single = await mutate([{ delete: { id: "x" } }], { token: "t" });
    expect(single).toEqual([{ transactionId: "t1" }]);

    const split = await mutate([bigMutation("a", 2_000_000), bigMutation("b", 2_000_000)], {
      token: "t",
      atomic: false,
    });
    expect(split).toEqual([{ transactionId: "t2" }, { transactionId: "t3" }]);
  });

  test("an atomic call REFUSES to split rather than silently becoming two transactions", async () => {
    // The mechanism behind the rule the comments state. `atomic` defaults to
    // true, so a caller that never thought about batching cannot accidentally
    // receive two independent transactions when its payload grows — it gets a
    // loud error naming the choice instead.
    //
    // This is the counterpart to the "atomic pair" test above: that one proves
    // the pair is not split under the limit; this one proves that going over
    // the limit fails closed rather than splitting. Without it, the guarantee
    // holds only for as long as payloads happen to stay small.
    const requests = stubFetch(OK);
    const oversized = [bigMutation("a", 2_000_000), bigMutation("b", 2_000_000)];

    const error = await capture(() => mutate(oversized, { token: "t" }));

    expect(error).toBeInstanceOf(SanityHttpError);
    expect((error as SanityHttpError).message).toContain("refusing to split");
    // Nothing was sent. A partial write before the refusal would be the very
    // half-applied state the refusal exists to prevent.
    expect(requests).toHaveLength(0);
  });

  test("a mutation refuses to send at all without a token", async () => {
    // The env var is cleared explicitly rather than assumed absent: `.env.local`
    // carries a real write token in this working tree and bun loads it into
    // `process.env` for the test run, so the fallback would otherwise satisfy
    // this call and the assertion would pass for the wrong reason on CI only.
    const saved = process.env.SANITY_WRITE_TOKEN;
    delete process.env.SANITY_WRITE_TOKEN;
    try {
      const requests = stubFetch(OK);

      const error = expectUpstream(await capture(() => mutate([{ delete: { id: "x" } }])));

      expect(error.message).toContain("SANITY_WRITE_TOKEN");
      expect(requests).toHaveLength(0);
    } finally {
      if (saved !== undefined) process.env.SANITY_WRITE_TOKEN = saved;
    }
  });
});

describe("doc transport", () => {
  test("hits the uncached api.sanity.io host, never apicdn", () => {
    const url = docsUrlFor(["episode-1"]);
    expect(url).toStartWith("https://5apyl3sk.api.sanity.io/v2026-08-01/data/doc/production/");
    expect(url).not.toContain("apicdn");
  });

  test("joins multiple ids with a comma", () => {
    const url = docsUrlFor(["episode-1", "slug-lock-john-smith"]);
    expect(url).toEndWith("/data/doc/production/episode-1,slug-lock-john-smith");
  });

  test("URL-encodes each id before joining, so a literal comma inside an id can't be mistaken for a separator", () => {
    const url = docsUrlFor(["a,b", "c/d"]);
    expect(url).toEndWith("/data/doc/production/a%2Cb,c%2Fd");
  });
});

describe("image URLs", () => {
  const REF = "image-abc123def456-1200x630-jpg";

  test("builds a CDN URL from an asset ref", () => {
    const url = imageUrl(REF);
    expect(url).toStartWith(
      "https://cdn.sanity.io/images/5apyl3sk/production/abc123def456-1200x630.jpg",
    );
    expect(url).toContain("auto=format");
  });

  test("applies transforms", () => {
    const url = imageUrl(REF, { width: 800, height: 450, fit: "crop", quality: 80 });
    expect(url).toContain("w=800");
    expect(url).toContain("h=450");
    expect(url).toContain("fit=crop");
    expect(url).toContain("q=80");
  });

  test("the OG variant is a 1200x630 hotspot-aware crop", () => {
    const url = ogImageUrl(REF)!;
    expect(url).toContain("w=1200");
    expect(url).toContain("h=630");
    expect(url).toContain("fit=crop");
  });

  test("reads the ref out of an image field", () => {
    expect(imageRef({ asset: { _ref: REF } })).toBe(REF);
  });

  test("an image wrapper with no asset yields null, not a broken URL", () => {
    // Studio can leave the object present with the asset unset. This is the
    // same shape the enrichment predicate has to see through.
    expect(imageRef({})).toBeNull();
    expect(imageRef({ asset: null })).toBeNull();
    expect(imageUrl({ asset: {} })).toBeNull();
  });

  test("malformed refs yield null rather than a 404ing URL", () => {
    for (const bad of ["", "not-an-image", "image-abc-nope-jpg", "file-abc123-1200x630-jpg"]) {
      expect(imageUrl(bad)).toBeNull();
    }
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
  });
});
