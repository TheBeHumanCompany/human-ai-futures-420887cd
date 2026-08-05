import { describe, expect, test } from "bun:test";

import { SanityHttpError } from "./http";
import type { PublishResult } from "./publish";
import {
  PublishConflictError,
  SlugImmutableError,
  SlugTakenError,
  equal,
  publishEpisode,
  strip,
} from "./publish";

/**
 * Decision F.
 *
 * Every assertion here checks the *exact mutation array that was submitted*,
 * not just the returned outcome string. The guarantee Decision F rests on is a
 * property of the transaction's shape — a strict `create` rather than a
 * `createOrReplace`, both compare-and-sets in ONE `mutate()` call — and an
 * outcome string cannot distinguish a correct transaction from a dangerous one.
 *
 * No network: `getDocuments` and `mutate` are injected through `deps`, and the
 * clock is pinned so `frozenAt`/`slugFrozenAt` can be asserted literally.
 */

/* ------------------------------------------------------------------ mocks -- */

type Read = (ids: string[], options?: { token?: string }) => Promise<Record<string, unknown>[]>;
type Write = (
  mutations: unknown[],
  options?: { token?: string; returnDocuments?: boolean },
) => Promise<unknown>;

/**
 * Records the ids of every pre-read. Responses are consumed in order and the
 * last one repeats, so a retry that re-reads sees the same world unless a test
 * says otherwise.
 */
function readMock(...responses: Record<string, unknown>[][]): Read & { calls: string[][] } {
  const calls: string[][] = [];
  const fn = (async (ids: string[]) => {
    calls.push(ids);
    return responses[Math.min(calls.length - 1, responses.length - 1)] ?? [];
  }) as Read & { calls: string[][] };
  fn.calls = calls;
  return fn;
}

/**
 * Sanity's real answer to a strict `create` against an existing `_id`: HTTP
 * `409 Conflict`, surfaced by `mutate()` as a `SanityHttpError` carrying that
 * status. The status is the whole signal — it is what separates "someone else
 * won the race" from "the token expired".
 */
function conflict409(id = EPISODE_ID): SanityHttpError {
  return new SanityHttpError(`[sanity] mutation failed (409): document already exists: ${id}`, 409);
}

/**
 * Records the exact mutation array of every submission. `"fail"` is the 409
 * above — the only retriable failure. Pass an `Error` instead to model any
 * other rejection (auth, rate limit, transport).
 */
function writeMock(...outcomes: ("ok" | "fail" | Error)[]): Write & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  const fn = (async (mutations: unknown[]) => {
    calls.push(mutations);
    const outcome = outcomes[calls.length - 1];
    if (outcome === "fail") throw conflict409();
    if (outcome instanceof Error) throw outcome;
    return { transactionId: `txn-${calls.length}` };
  }) as Write & { calls: unknown[][] };
  fn.calls = calls;
  return fn;
}

interface Session {
  read: Read & { calls: string[][] };
  write: Write & { calls: unknown[][] };
}

/**
 * ONE in-memory dataset, shared by every session drawn from it, enforcing the
 * two semantics the whole design rests on: a strict `create` against an `_id`
 * that already exists is refused with 409, and a mutation array is
 * all-or-nothing.
 *
 * Independently-scripted mocks can only ever prove the SHAPE of a transaction —
 * `writeB` fails because a test said "fail", not because anything was actually
 * contended. Arbitration is a property of shared state, so proving it needs
 * something that has some.
 */
function sharedDataset(): {
  documents: Map<string, Record<string, unknown>>;
  session: () => Session;
} {
  const documents = new Map<string, Record<string, unknown>>();

  // Staged and swapped in wholesale: either every mutation in the array lands
  // or none does. The loser's lock rolling back with its failed episode create
  // is exactly this property, and a per-mutation apply would not have it.
  const commit = (mutations: unknown[]): void => {
    const staged = new Map(documents);

    for (const mutation of mutations as Record<string, Record<string, unknown>>[]) {
      if (mutation.create) {
        const id = String(mutation.create._id);
        if (staged.has(id)) throw conflict409(id);
        staged.set(id, mutation.create);
      } else if (mutation.createOrReplace) {
        staged.set(String(mutation.createOrReplace._id), mutation.createOrReplace);
      } else if (mutation.delete) {
        staged.delete(String(mutation.delete.id));
      }
    }

    documents.clear();
    for (const [id, doc] of staged) documents.set(id, doc);
  };

  const session = (): Session => {
    const readCalls: string[][] = [];
    const read = (async (ids: string[]) => {
      readCalls.push(ids);
      // Absent ids are omitted, not nulled — what the doc endpoint really does.
      return ids
        .map((id) => documents.get(id))
        .filter((doc): doc is Record<string, unknown> => doc !== undefined);
    }) as Read & { calls: string[][] };
    read.calls = readCalls;

    const writeCalls: unknown[][] = [];
    const write = (async (mutations: unknown[]) => {
      writeCalls.push(mutations);
      commit(mutations);
      return { transactionId: `txn-${writeCalls.length}` };
    }) as Write & { calls: unknown[][] };
    write.calls = writeCalls;

    return { read, write };
  };

  return { documents, session };
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to reject, but it resolved");
}

/* --------------------------------------------------------------- fixtures -- */

const EPISODE_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const GUID = "podbean-guid-001";
const SLUG = "jane-doe-on-ai-safety";
const LOCK_ID = `slugLock-${SLUG}`;
const DRAFT_ID = `drafts.${EPISODE_ID}`;

/** Pinned clock, so a stamped `frozenAt` is an assertable literal. */
const NOW = "2026-08-05T12:00:00.000Z";
/** An earlier freeze, for documents that are already published. */
const FROZEN_AT = "2026-01-16T09:30:00.000Z";

const now = () => NOW;

const SLUG_FIELD = { current: SLUG, _type: "slug" };

/** Topic references as authored — Studio's `_key`s are added by `publishEpisode`. */
const TOPICS = [
  { _ref: "topic-ai-safety", _type: "reference" },
  { _ref: "topic-product", _type: "reference" },
];

/** The same references after deterministic keying: `_key` is the referenced `_id`. */
const KEYED_TOPICS = [
  { _ref: "topic-ai-safety", _type: "reference", _key: "topic-ai-safety" },
  { _ref: "topic-product", _type: "reference", _key: "topic-product" },
];

/**
 * `computeSearchText` joins title, guestName and excerpt in that order, then
 * folds accents, lowercases and reduces punctuation to single spaces. Pinned
 * as a literal rather than recomputed, so a change to the haystack recipe goes
 * red here instead of silently altering what search matches.
 */
const SEARCH_TEXT = "jane doe on ai safety jane doe jane doe joins to discuss ai safety";

/** The desired published shape as a caller supplies it: no `slugFrozenAt`, no `searchText`. */
const AUTHORED: Record<string, unknown> = {
  _id: EPISODE_ID,
  _type: "episode",
  guid: GUID,
  slug: SLUG_FIELD,
  episodeNumber: 12,
  title: "Jane Doe on AI Safety",
  description: "Full show notes from the feed.",
  excerpt: "Jane Doe joins to discuss AI safety.",
  topics: TOPICS,
  guestName: "Jane Doe",
  guestBio: "Jane Doe is a researcher working on AI safety.",
  guestPhoto: {
    _type: "image",
    asset: { _type: "reference", _ref: "image-aaaa1111-800x800-jpg" },
    alt: "Jane Doe",
  },
  coverArtwork: {
    _type: "image",
    asset: { _type: "reference", _ref: "image-bbbb2222-1200x630-png" },
    alt: "Cover art",
  },
  podbeanUrl: "https://www.podbean.com/e/ep12",
  audioUrl: "https://mcdn.podbean.com/mf/ep12.mp3",
  durationSeconds: 2400,
  publishedAt: "2026-01-15T00:00:00Z",
};

/** What `publishEpisode` computes as `desired` on a *first* publication. */
const DESIRED_FIRST_PUBLISH = {
  ...AUTHORED,
  slug: SLUG_FIELD,
  slugFrozenAt: NOW,
  topics: KEYED_TOPICS,
  searchText: SEARCH_TEXT,
};

/** What `publishEpisode` computes as `desired` against an already-frozen document. */
const DESIRED_AGAINST_FROZEN = {
  ...AUTHORED,
  slug: SLUG_FIELD,
  slugFrozenAt: FROZEN_AT,
  topics: KEYED_TOPICS,
  searchText: SEARCH_TEXT,
};

/**
 * A published document that is byte-for-byte `desired` after stripping — the
 * row-3 fixture. It carries the system keys Sanity really returns (`_rev`,
 * `_createdAt`, `_updatedAt`, topic `_key`s) precisely so the test proves the
 * strip list is doing the work.
 */
const PUBLISHED_IDENTICAL: Record<string, unknown> = {
  ...DESIRED_AGAINST_FROZEN,
  _rev: "rev-abcdef",
  _createdAt: "2026-01-16T09:30:00.000Z",
  _updatedAt: "2026-02-02T11:00:00.000Z",
};

/** The same document with authored content that differs from `AUTHORED`. */
const PUBLISHED_DIFFERS: Record<string, unknown> = {
  ...PUBLISHED_IDENTICAL,
  title: "Jane Doe on Alignment",
  searchText: "jane doe on alignment jane doe jane doe joins to discuss ai safety",
};

const OWNED_LOCK: Record<string, unknown> = {
  _id: LOCK_ID,
  _type: "slugLock",
  _rev: "rev-lock-1",
  episodeId: EPISODE_ID,
  guid: GUID,
  frozenAt: FROZEN_AT,
};

const LOCK_CREATE_NOW = {
  create: { _id: LOCK_ID, _type: "slugLock", episodeId: EPISODE_ID, guid: GUID, frozenAt: NOW },
};

/* ------------------------------------------------------- row 1 and row 2 -- */

describe("row 1 — the slug is frozen and does not match", () => {
  test("rejects with SlugImmutableError and submits nothing at all", async () => {
    // The URL has been shared. Not even the draft delete is emitted.
    const read = readMock([
      { ...PUBLISHED_IDENTICAL, slug: { current: "an-older-slug", _type: "slug" } },
    ]);
    const write = writeMock();

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "author", deleteDraftId: DRAFT_ID },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).toBeInstanceOf(SlugImmutableError);
    expect((error as Error).message).toContain("an-older-slug");
    expect(write.calls).toHaveLength(0);
  });
});

describe("row 2 — the slug lock belongs to another episode", () => {
  test("rejects with SlugTakenError and submits nothing at all", async () => {
    const read = readMock([{ ...OWNED_LOCK, episodeId: "some-other-episode-id" }]);
    const write = writeMock();

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).toBeInstanceOf(SlugTakenError);
    expect((error as Error).message).toContain("some-other-episode-id");
    expect(write.calls).toHaveLength(0);
  });

  test("row 1 is evaluated before row 2", async () => {
    // Both conditions hold. Row 1 is the one about the permanent URL, so it is
    // the answer the caller gets.
    const read = readMock([
      { ...PUBLISHED_IDENTICAL, slug: { current: "an-older-slug", _type: "slug" } },
      { ...OWNED_LOCK, episodeId: "some-other-episode-id" },
    ]);
    const write = writeMock();

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).toBeInstanceOf(SlugImmutableError);
    expect(write.calls).toHaveLength(0);
  });
});

/* -------------------------------------------------------------- row 3 --- */

describe("row 3 — lock owned and the document is already exactly right", () => {
  test("seed: outcome unchanged, zero mutations, and mutate is never invoked (R2)", async () => {
    const read = readMock([PUBLISHED_IDENTICAL, OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("unchanged");
    expect(result.mutations).toEqual([]);
    // R2 stated as behaviour, not as a returned value: an empty mutation list
    // means no transaction was constructed and no request was made. The
    // backfill's "run it a third time" assertion rests on this exact fact.
    expect(write.calls).toHaveLength(0);
    // One pre-read, both ids, and no retry.
    expect(read.calls).toEqual([[EPISODE_ID, LOCK_ID]]);
  });

  test("author with a draft: exactly one mutation, the draft delete", async () => {
    const read = readMock([PUBLISHED_IDENTICAL, OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author", deleteDraftId: DRAFT_ID },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("unchanged");
    // Exactly one element. Anything touching the published document here would
    // rewrite `_updatedAt` on every republish of an unchanged episode.
    expect(write.calls).toHaveLength(1);
    expect(write.calls[0]).toEqual([{ delete: { id: DRAFT_ID } }]);
    expect(result.mutations).toEqual([{ delete: { id: DRAFT_ID } }]);
  });
});

/* -------------------------------------------------------------- row 4 --- */

describe("row 4 — episode absent: the episode-side compare-and-set", () => {
  test("seed: lock create and a STRICT episode create, together in one mutate call", async () => {
    const read = readMock([]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("created");

    // ONE call. The guarantee is that the loser's lock rolls back with its
    // episode create, and that only holds inside a single transaction —
    // splitting these into two mutate() calls would silently delete it.
    expect(write.calls).toHaveLength(1);
    const submitted = write.calls[0] as Record<string, unknown>[];
    expect(submitted).toHaveLength(2);
    expect(submitted[0]).toEqual(LOCK_CREATE_NOW);
    expect(submitted[1]).toEqual({ create: DESIRED_FIRST_PUBLISH });

    // Strict `create`, spelled out: `createIfNotExists` would make the episode
    // CAS a no-op and `createOrReplace` would let the later writer win.
    expect(Object.keys(submitted[1] as object)).toEqual(["create"]);
    expect(result.mutations).toEqual(submitted);
  });

  test("author: the episode mutation is STILL a strict create, never createOrReplace", async () => {
    const read = readMock([]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("created");
    expect(write.calls).toHaveLength(1);
    const submitted = write.calls[0] as Record<string, unknown>[];
    expect(submitted).toHaveLength(2);
    expect(submitted[0]).toEqual(LOCK_CREATE_NOW);
    expect(submitted[1]).toEqual({ create: DESIRED_FIRST_PUBLISH });

    // Codex 1's guarantee holds in BOTH modes. `author` is the mode where a
    // replace is otherwise legal, so this is the assertion that matters.
    expect(Object.keys(submitted[1] as object)).toEqual(["create"]);
    for (const mutation of submitted) {
      expect(mutation).not.toHaveProperty("createOrReplace");
      expect(mutation).not.toHaveProperty("createIfNotExists");
    }
  });

  test("author with a draft: the draft delete rides in the same transaction", async () => {
    const read = readMock([]);
    const write = writeMock();

    await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author", deleteDraftId: DRAFT_ID },
      { getDocuments: read, mutate: write, now },
    );

    expect(write.calls).toHaveLength(1);
    expect(write.calls[0]).toEqual([
      LOCK_CREATE_NOW,
      { create: DESIRED_FIRST_PUBLISH },
      { delete: { id: DRAFT_ID } },
    ]);
  });

  test("lock ALREADY owned but the episode is absent: no lock mutation, still a strict create", async () => {
    // A half-committed world — the lock landed, the episode did not. The lock
    // is ours, so nothing is emitted for it; the episode side is undiminished
    // by that, because the CAS it performs is about the episode, not the slug.
    const read = readMock([OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("created");
    expect(write.calls).toHaveLength(1);
    // Exactly one mutation: the owned lock is preserved untouched, so a
    // re-publish cannot restamp its `frozenAt` and lose when the slug was bound.
    expect(write.calls[0]).toEqual([{ create: DESIRED_FIRST_PUBLISH }]);
    expect(Object.keys(write.calls[0][0] as object)).toEqual(["create"]);
  });
});

describe("row 4 — episode present and differing", () => {
  test("seed emits no episode mutation at all: the backfill cannot overwrite enrichment", async () => {
    const read = readMock([PUBLISHED_DIFFERS, OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
      { getDocuments: read, mutate: write, now },
    );

    // Lock owned, so no lock create either — the whole transaction is empty and
    // nothing is sent. Not "the episode mutation was harmless": there is none.
    expect(result.outcome).toBe("unchanged");
    expect(result.mutations).toEqual([]);
    expect(write.calls).toHaveLength(0);
  });

  test("seed with the lock missing submits the lock create and NO episode mutation", async () => {
    // The variant where something *is* submitted, so "no episode mutation" is
    // asserted against a real transaction rather than against an empty one.
    const read = readMock([PUBLISHED_DIFFERS]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("unchanged");
    expect(write.calls).toHaveLength(1);
    expect(write.calls[0]).toEqual([LOCK_CREATE_NOW]);

    const submitted = write.calls[0] as Record<string, unknown>[];
    for (const mutation of submitted) {
      for (const verb of ["create", "createOrReplace", "createIfNotExists"] as const) {
        const payload = mutation[verb] as { _id?: unknown } | undefined;
        expect(payload?._id).not.toBe(EPISODE_ID);
      }
    }
  });

  test("author replaces, preserving the frozen slug and the existing lock", async () => {
    const read = readMock([PUBLISHED_DIFFERS, OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("replaced");
    expect(write.calls).toHaveLength(1);
    // One mutation only: the owned lock is preserved, never replaced or deleted,
    // and `slugFrozenAt` is carried forward from the published document rather
    // than restamped with the current clock.
    expect(write.calls[0]).toEqual([{ createOrReplace: DESIRED_AGAINST_FROZEN }]);
  });

  test("author replaces WITH a draft: replace and draft delete are one transaction", async () => {
    // The row-4 replace is the ordinary Studio republish, and it always arrives
    // with a draft to clear. Two mutate() calls would leave a window in which
    // the draft is gone and the replace has not landed, or the reverse.
    const read = readMock([PUBLISHED_DIFFERS, OWNED_LOCK]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author", deleteDraftId: DRAFT_ID },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("replaced");
    expect(write.calls).toHaveLength(1);
    expect(write.calls[0]).toEqual([
      { createOrReplace: DESIRED_AGAINST_FROZEN },
      { delete: { id: DRAFT_ID } },
    ]);
    expect(result.mutations).toEqual(write.calls[0]);
  });

  test("published identical but the lock is MISSING: the lock create alone", async () => {
    // Row 3 needs a lock, and there isn't one, so this falls through to row 4 —
    // which finds the document already exactly right and emits nothing for it.
    // The repair is the lock and only the lock: an unlocked publication is how
    // a slug gets stolen, and rewriting the document to fix that would restamp
    // `_updatedAt` for no content change at all.
    const read = readMock([PUBLISHED_IDENTICAL]);
    const write = writeMock();

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author", deleteDraftId: undefined },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("unchanged");
    expect(write.calls).toHaveLength(1);
    expect(write.calls[0]).toEqual([LOCK_CREATE_NOW]);
    expect(result.mutations).toEqual([LOCK_CREATE_NOW]);
  });
});

/* ----------------------------------------------------- the CRITICAL race -- */

describe("two sessions publishing the same unpublished episode under different slugs", () => {
  const OTHER_SLUG = "jane-doe-on-ai-safety-take-two";
  const OTHER_LOCK_ID = `slugLock-${OTHER_SLUG}`;

  test("the loser's lock create and episode create are one all-or-nothing transaction", async () => {
    // Both sessions pre-read "nothing there". Their lock ids DIFFER, so the
    // lock CAS never collides — the episode-side create is the only thing
    // standing between this and a permanent URL that moved.
    const readA = readMock([]);
    const writeA = writeMock("ok");
    const readB = readMock([]);
    // First submission loses the episode-`_id` collision; the retry succeeds.
    const writeB = writeMock("fail", "ok");

    const resultA = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
      { getDocuments: readA, mutate: writeA, now },
    );
    const resultB = await publishEpisode(
      { episodeDoc: AUTHORED, slug: OTHER_SLUG, mode: "author" },
      { getDocuments: readB, mutate: writeB, now },
    );

    expect(resultA.outcome).toBe("created");
    expect(writeA.calls).toHaveLength(1);
    expect(writeA.calls[0]).toEqual([LOCK_CREATE_NOW, { create: DESIRED_FIRST_PUBLISH }]);

    // (a) The loser's FIRST submission carried both compare-and-sets in ONE
    // array. If the implementation split them across two mutate() calls the
    // loser's lock would survive its failed episode create and the slug would
    // be permanently bound to a publication that never happened.
    const firstAttempt = writeB.calls[0] as Record<string, unknown>[];
    expect(firstAttempt).toHaveLength(2);
    expect(firstAttempt[0]).toEqual({
      create: {
        _id: OTHER_LOCK_ID,
        _type: "slugLock",
        episodeId: EPISODE_ID,
        guid: GUID,
        frozenAt: NOW,
      },
    });
    expect(firstAttempt[1]).toEqual({
      create: {
        ...DESIRED_FIRST_PUBLISH,
        slug: { current: OTHER_SLUG, _type: "slug" },
      },
    });
    expect(Object.keys(firstAttempt[1] as object)).toEqual(["create"]);

    // (b) The retry re-read before re-deciding — the decision table is
    // re-evaluated from the top, not the same transaction resubmitted.
    expect(readB.calls).toEqual([
      [EPISODE_ID, OTHER_LOCK_ID],
      [EPISODE_ID, OTHER_LOCK_ID],
    ]);
    expect(writeB.calls).toHaveLength(2);
    expect(resultB.outcome).toBe("created");
  });

  test("REAL arbitration: against one shared dataset, exactly one publication survives", async () => {
    // The test above proves the transaction's SHAPE against two mocks that
    // never meet. This one proves the OUTCOME: both sessions read and write the
    // same Map, whose `create` refuses an `_id` that already exists, so nothing
    // about who wins is scripted. Whoever loses, loses to the dataset.
    const dataset = sharedDataset();
    const a = dataset.session();
    const b = dataset.session();

    // Started together. `publishEpisode` runs synchronously as far as its
    // pre-read, so both pre-reads are taken against the empty dataset before
    // either transaction is submitted — the race exactly as it happens.
    const settled = await Promise.allSettled([
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
        { getDocuments: a.read, mutate: a.write, now },
      ),
      publishEpisode(
        { episodeDoc: AUTHORED, slug: OTHER_SLUG, mode: "author" },
        { getDocuments: b.read, mutate: b.write, now },
      ),
    ]);

    const won = settled.filter(
      (result): result is PromiseFulfilledResult<PublishResult> => result.status === "fulfilled",
    );
    const lost = settled.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    // Exactly one publication, and it is a first publication.
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(won[0].value.outcome).toBe("created");

    const [winner, loser] = settled[0].status === "fulfilled" ? [a, b] : [b, a];

    // Both pre-reads saw the empty world; neither was told the answer.
    expect(winner.read.calls[0]).toHaveLength(2);
    expect(loser.read.calls[0]).toHaveLength(2);

    // The winner needed no retry: one pre-read, one transaction.
    expect(winner.read.calls).toHaveLength(1);
    expect(winner.write.calls).toHaveLength(1);

    // The loser's first submission was rejected BY THE DATASET — its strict
    // create of the episode `_id` collided with the document the winner had
    // just committed — and it carried both compare-and-sets in one array.
    expect(loser.write.calls).toHaveLength(1);
    const attempt = loser.write.calls[0] as Record<string, unknown>[];
    expect(attempt).toHaveLength(2);
    expect(Object.keys(attempt[1] as object)).toEqual(["create"]);

    // It then re-read before re-deciding. The pre-read now sees the winner's
    // committed episode, frozen under the winner's slug — so the decision table
    // answers row 1, which is the honest answer to "publish this at a different
    // URL", and no second transaction is ever submitted.
    expect(loser.read.calls).toHaveLength(2);
    expect(lost[0].reason).toBeInstanceOf(SlugImmutableError);

    // No split brain. One episode, one lock, and the lock is the winner's — the
    // loser's lock create rolled back with the episode create it travelled
    // with, which is the entire reason they travel together.
    const stored = [...dataset.documents.values()];
    const episodes = stored.filter((doc) => doc._type === "episode");
    const locks = stored.filter((doc) => doc._type === "slugLock");
    expect(stored).toHaveLength(2);
    expect(episodes).toHaveLength(1);
    expect(locks).toHaveLength(1);

    const survivingSlug = (episodes[0].slug as { current: string }).current;
    expect(locks[0]._id).toBe(`slugLock-${survivingSlug}`);
    expect(locks[0].episodeId).toBe(EPISODE_ID);
    expect([SLUG, OTHER_SLUG]).toContain(survivingSlug);
  });

  test("a stale pre-read that resolves on re-read comes back unchanged, not conflicted", async () => {
    // The bounded cost of the strict create: a pre-read taken inside the
    // consistency window reports "absent" for a document that exists. The retry
    // sees the truth and row 3 answers correctly.
    const read = readMock([], [PUBLISHED_IDENTICAL, OWNED_LOCK]);
    const write = writeMock("fail");

    const result = await publishEpisode(
      { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
      { getDocuments: read, mutate: write, now },
    );

    expect(result.outcome).toBe("unchanged");
    expect(result.mutations).toEqual([]);
    // The retry's plan was empty, so nothing was sent a second time.
    expect(write.calls).toHaveLength(1);
    expect(read.calls).toHaveLength(2);
  });
});

describe("retry exhaustion", () => {
  test("one retry, then PublishConflictError — no backoff loop", async () => {
    const read = readMock([]);
    const write = writeMock("fail", "fail");

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).toBeInstanceOf(PublishConflictError);
    expect((error as Error).message).toContain(EPISODE_ID);
    // Exactly two attempts: one initial, one retry. Not three, not a loop.
    expect(read.calls).toHaveLength(2);
    expect(write.calls).toHaveLength(2);
  });

  test("a failure with no episode create is not retried and propagates unwrapped", async () => {
    // Only the episode-side strict create is a retriable conflict. A lock-only
    // transaction that fails failed for some other reason, and re-reading would
    // just lose the original error.
    const read = readMock([PUBLISHED_DIFFERS]);
    const write = writeMock("fail");

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "seed" },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).not.toBeInstanceOf(PublishConflictError);
    expect((error as Error).message).toContain("document already exists");
    expect(read.calls).toHaveLength(1);
    expect(write.calls).toHaveLength(1);
  });
});

describe("only a 409 is a conflict", () => {
  /**
   * The retry exists to absorb one specific failure: a strict `create` losing
   * its compare-and-set. Everything else is a different problem, and both
   * halves of the old behaviour were wrong on it — retrying doubled the damage,
   * and `PublishConflictError` told the editor a race had happened when none
   * had. Each case here would have passed under "any failure counts".
   */
  const cases: { label: string; error: Error }[] = [
    {
      label: "401, an expired or missing write token",
      error: new SanityHttpError("[sanity] mutation failed (401): Unauthorized", 401),
    },
    {
      label: "429, a rate limit",
      error: new SanityHttpError("[sanity] mutation failed (429): Too Many Requests", 429),
    },
    {
      label: "503, the API is down",
      error: new SanityHttpError("[sanity] mutation failed (503): Service Unavailable", 503),
    },
    {
      label: "a transport failure that never reached Sanity",
      error: new TypeError("fetch failed"),
    },
  ];

  for (const { label, error: thrown } of cases) {
    test(`${label}: propagates unwrapped, and is never retried`, async () => {
      // The transaction DOES contain the episode-side strict create, so the old
      // code retried on this and then relabelled it a conflict.
      const read = readMock([]);
      const write = writeMock(thrown);

      const error = await rejection(
        publishEpisode(
          { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
          { getDocuments: read, mutate: write, now },
        ),
      );

      expect(error).toBe(thrown);
      expect(error).not.toBeInstanceOf(PublishConflictError);
      // One attempt. Re-submitting an expired token or a rate-limited request
      // cannot succeed and costs the caller a second failure.
      expect(write.calls).toHaveLength(1);
      expect(read.calls).toHaveLength(1);
    });
  }

  test("a 409 followed by a non-409 reports the second failure, not a conflict", async () => {
    // The retry was legitimate — the first failure really was a 409. The second
    // was not, so the caller learns the token expired rather than being told to
    // reload a page that would show them nothing new.
    const authFailure = new SanityHttpError("[sanity] mutation failed (401): Unauthorized", 401);
    const read = readMock([]);
    const write = writeMock("fail", authFailure);

    const error = await rejection(
      publishEpisode(
        { episodeDoc: AUTHORED, slug: SLUG, mode: "author" },
        { getDocuments: read, mutate: write, now },
      ),
    );

    expect(error).toBe(authFailure);
    expect(error).not.toBeInstanceOf(PublishConflictError);
    expect(write.calls).toHaveLength(2);
  });
});

/* ------------------------------------------------------ strip() / equal() -- */

describe("strip", () => {
  test("removes the exact key list recursively, at every nesting level", () => {
    const raw = {
      _id: EPISODE_ID,
      _type: "episode",
      _rev: "rev-1",
      _createdAt: "2026-01-16T09:30:00.000Z",
      _updatedAt: "2026-02-02T11:00:00.000Z",
      _originalId: DRAFT_ID,
      title: "Jane Doe on AI Safety",
      topics: [
        {
          _key: "topic-ai-safety",
          _ref: "topic-ai-safety",
          _type: "reference",
          _weak: true,
          nested: { _key: "deep", _rev: "deep-rev", keep: 1 },
        },
      ],
      guestPhoto: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-aaaa1111-800x800-jpg", _updatedAt: "x" },
      },
    };

    expect(strip(raw)).toEqual({
      _id: EPISODE_ID,
      _type: "episode",
      title: "Jane Doe on AI Safety",
      topics: [
        {
          _ref: "topic-ai-safety",
          _type: "reference",
          _weak: true,
          nested: { keep: 1 },
        },
      ],
      guestPhoto: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-aaaa1111-800x800-jpg" },
      },
    });
  });

  test("keeps _type, _id, _ref and _weak", () => {
    // The whole reason the strip list is a literal set and not the pattern
    // "any key starting with _": that pattern eats `asset._ref`, and a swapped
    // guest photo would then compare equal and never publish.
    const kept = strip({ _type: "reference", _id: "x", _ref: "image-1", _weak: true }) as Record<
      string,
      unknown
    >;
    expect(Object.keys(kept).sort()).toEqual(["_id", "_ref", "_type", "_weak"]);
  });

  test("passes primitives, null and arrays of primitives through unchanged", () => {
    expect(strip("text")).toBe("text");
    expect(strip(42)).toBe(42);
    expect(strip(null)).toBeNull();
    expect(strip([1, "two", null])).toEqual([1, "two", null]);
  });
});

describe("equal", () => {
  test("objects compare by key set and value, regardless of insertion order", () => {
    // JSON.stringify comparison would call this a difference and republish
    // every episode on every run.
    expect(equal({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
  });

  test("a differing key set is not equal, in either direction", () => {
    expect(equal({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(equal({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  test("a swapped guestPhoto asset ref is never equal", () => {
    const before = {
      guestPhoto: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-aaaa1111-800x800-jpg" },
      },
    };
    const after = {
      guestPhoto: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-cccc3333-800x800-jpg" },
      },
    };
    expect(equal(before, after)).toBe(false);
  });

  test("arrays are order-sensitive, unlike objects", () => {
    // GROQ arrays are ordered, so a reordered topics[] is a real content change.
    expect(equal({ topics: TOPICS }, { topics: TOPICS })).toBe(true);
    expect(equal({ topics: TOPICS }, { topics: [...TOPICS].reverse() })).toBe(false);
    expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(equal([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(equal([1, 2], [1, 2, 3])).toBe(false);
  });

  test("an array is never equal to a non-array", () => {
    expect(equal([], {})).toBe(false);
    expect(equal({ 0: "a", length: 1 }, ["a"])).toBe(false);
  });

  test("strip + equal together make a real published document compare unchanged", () => {
    // The row-3 predicate exactly as publishEpisode evaluates it.
    expect(equal(strip(PUBLISHED_IDENTICAL), strip(DESIRED_AGAINST_FROZEN))).toBe(true);
    expect(equal(strip(PUBLISHED_DIFFERS), strip(DESIRED_AGAINST_FROZEN))).toBe(false);
  });
});
