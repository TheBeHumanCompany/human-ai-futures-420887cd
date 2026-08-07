import { describe, expect, test } from "bun:test";

import { SanityHttpError } from "../sanity/http";
import { publishEpisode } from "../sanity/publish";
import {
  EDIT_THRESHOLD_MS,
  planPairRollback,
  rollbackEpisodes,
  slugLockId,
  type RollbackPair,
} from "./rollback";

/**
 * The rollback pair matrix (plan §5).
 *
 * Every assertion here is about PAIRS, never about totals. A rollback that
 * deleted 38 of 39 episodes and 39 of 39 locks has a correct-looking total and
 * one stranded lock, so the load-bearing assertion in this file is
 * `halfPairs(...) === 0` — the count of publications left with exactly one half
 * standing. A total cannot see that; a per-pair count cannot miss it.
 *
 * The dataset below is shared and all-or-nothing, the same pattern
 * `publish.test.ts` uses and for the same reason: a mock scripted to fail
 * proves only the SHAPE of a transaction. Atomicity is a property of state, so
 * proving it needs something that has some.
 */

/* ------------------------------------------------------------------ mocks -- */

type Read = (ids: string[], options?: { token?: string }) => Promise<Record<string, unknown>[]>;
type Write = (
  mutations: unknown[],
  options?: { token?: string; returnDocuments?: boolean },
) => Promise<unknown>;

/** Sanity's answer to a `create` against an existing `_id`, and to a stale `ifRevisionID`. */
function conflict409(message: string): SanityHttpError {
  return new SanityHttpError(`[sanity] mutation failed (409): ${message}`, 409);
}

/**
 * One in-memory dataset with the two semantics the whole design rests on: a
 * mutation array is all-or-nothing, and `ifRevisionID` is enforced.
 *
 * `unset` of a path the document does not have is a no-op, which is exactly
 * what the revision guard relies on — it is a patch that performs nothing and
 * checks everything.
 */
function sharedDataset(): {
  documents: Map<string, Record<string, unknown>>;
  read: Read & { calls: string[][] };
  write: Write & { calls: unknown[][] };
  /** Ready to hand straight to `rollbackEpisodes` as its injected transport. */
  deps: { getDocuments: Read; mutate: Write };
} {
  const documents = new Map<string, Record<string, unknown>>();

  const commit = (mutations: unknown[]): void => {
    const staged = new Map(documents);

    for (const mutation of mutations as Record<string, Record<string, unknown>>[]) {
      if (mutation.create) {
        const id = String(mutation.create._id);
        if (staged.has(id)) throw conflict409(`document already exists: ${id}`);
        staged.set(id, mutation.create);
      } else if (mutation.patch) {
        const id = String(mutation.patch.id);
        const doc = staged.get(id);
        if (doc === undefined) throw conflict409(`document not found: ${id}`);
        const guard = mutation.patch.ifRevisionID;
        if (guard !== undefined && doc._rev !== guard) {
          throw conflict409(`revision mismatch on ${id}`);
        }
        const next = { ...doc };
        for (const path of (mutation.patch.unset ?? []) as string[]) delete next[path];
        staged.set(id, next);
      } else if (mutation.delete) {
        // Idempotent, as the real API is: deleting an absent id is not an error.
        staged.delete(String(mutation.delete.id));
      } else {
        throw new Error(`unsupported mutation in test dataset: ${JSON.stringify(mutation)}`);
      }
    }

    documents.clear();
    for (const [id, doc] of staged) documents.set(id, doc);
  };

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

  return { documents, read, write, deps: { getDocuments: read, mutate: write } };
}

/* --------------------------------------------------------------- fixtures -- */

const CREATED_AT = "2026-08-01T10:00:00.000Z";

/** A timestamp `ms` after the seed was created. */
function after(ms: number): string {
  return new Date(Date.parse(CREATED_AT) + ms).toISOString();
}

/** A seeded episode exactly as the backfill leaves it: created once, never touched. */
function episodeDoc(id: string, slug: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: id,
    _type: "episode",
    _rev: `rev-${id}`,
    _createdAt: CREATED_AT,
    _updatedAt: CREATED_AT,
    guid: `podbean-guid-${id}`,
    slug: { current: slug, _type: "slug" },
    slugFrozenAt: CREATED_AT,
    title: `Episode ${id}`,
    seededBy: "backfill-v1",
    ...overrides,
  };
}

function lockDoc(slug: string, episodeId: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: slugLockId(slug),
    _type: "slugLock",
    _rev: `rev-lock-${slug}`,
    episodeId,
    guid: `podbean-guid-${episodeId}`,
    frozenAt: CREATED_AT,
    ...overrides,
  };
}

const EPISODE_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const SLUG = "jane-doe-on-ai-safety";
const LOCK_ID = slugLockId(SLUG);
const PAIR: RollbackPair = { episodeId: EPISODE_ID, slug: SLUG };

/** The guard patch the transaction carries for a given episode document. */
function guardPatch(id: string, rev: string) {
  return { patch: { id, ifRevisionID: rev, unset: ["__rollbackRevisionGuard"] } };
}

/**
 * The count of publications left with exactly one half standing.
 *
 * This is the assertion the whole file exists for. It is deliberately not
 * "documents remaining === expected": that total is satisfied by a run that
 * deleted the wrong halves in matching numbers.
 */
function halfPairs(documents: Map<string, unknown>, pairs: RollbackPair[]): RollbackPair[] {
  return pairs.filter(
    (pair) => documents.has(pair.episodeId) !== documents.has(slugLockId(pair.slug)),
  );
}

/* ------------------------------------------------------------- the matrix -- */

describe("row 1 — a clean pair", () => {
  test("both halves are deleted in ONE transaction", async () => {
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, episodeDoc(EPISODE_ID, SLUG));
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, EPISODE_ID));

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.deleted).toBe(1);
    expect(report.retained).toBe(0);
    expect(report.failure).toBeUndefined();

    // ONE call. Two mutate() calls would open exactly the window in which the
    // lock is gone and the episode is not, which is how a permanent URL moves.
    expect(dataset.write.calls).toHaveLength(1);
    expect(dataset.write.calls[0]).toEqual([
      guardPatch(EPISODE_ID, `rev-${EPISODE_ID}`),
      { delete: { id: EPISODE_ID } },
      { delete: { id: LOCK_ID } },
    ]);

    expect(dataset.documents.size).toBe(0);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);

    // One pre-read, both ids, full documents.
    expect(dataset.read.calls).toEqual([[EPISODE_ID, LOCK_ID]]);
  });

  test("one transaction PER pair — never one transaction for the batch", async () => {
    // Three pairs, three transactions, each self-contained. Batching every
    // deletion into a single array would be atomic too, but a failure would then
    // undo pairs that had already succeeded, and a partial success could not be
    // resumed by re-running.
    const pairs: RollbackPair[] = [
      { episodeId: "ep-1", slug: "slug-1" },
      { episodeId: "ep-2", slug: "slug-2" },
      { episodeId: "ep-3", slug: "slug-3" },
    ];
    const dataset = sharedDataset();
    for (const pair of pairs) {
      dataset.documents.set(pair.episodeId, episodeDoc(pair.episodeId, pair.slug));
      dataset.documents.set(slugLockId(pair.slug), lockDoc(pair.slug, pair.episodeId));
    }

    const report = await rollbackEpisodes(pairs, {}, dataset.deps);

    expect(report.deleted).toBe(3);
    expect(dataset.write.calls).toHaveLength(3);
    for (const [index, pair] of pairs.entries()) {
      expect(dataset.write.calls[index]).toEqual([
        guardPatch(pair.episodeId, `rev-${pair.episodeId}`),
        { delete: { id: pair.episodeId } },
        { delete: { id: slugLockId(pair.slug) } },
      ]);
    }
    expect(dataset.documents.size).toBe(0);
  });
});

describe("row 2 — the episode was edited by a human", () => {
  /** `_updatedAt` an hour after `_createdAt`: Shane added a photo and a bio. */
  const EDITED = episodeDoc(EPISODE_ID, SLUG, {
    _updatedAt: after(60 * 60 * 1000),
    guestBio: "Jane Doe is a researcher working on AI safety.",
  });

  test("BOTH halves are retained and nothing at all is submitted", async () => {
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, EDITED);
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, EPISODE_ID));

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.retained).toBe(1);
    expect(report.deleted).toBe(0);
    expect(report.results[0].reason).toBe("edited");

    // The refusal is the whole pair. The lock is machine-written and carries no
    // edit of its own, so "delete the half nobody edited" is the plausible
    // shorthand — and it strands the slug on a document that still exists.
    expect(dataset.write.calls).toHaveLength(0);
    expect(dataset.documents.has(EPISODE_ID)).toBe(true);
    expect(dataset.documents.has(LOCK_ID)).toBe(true);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);
  });

  test("--force is REQUIRED: the same pair deletes only when it is passed", async () => {
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, EDITED);
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, EPISODE_ID));

    const refused = await rollbackEpisodes([PAIR], {}, dataset.deps);
    expect(refused.deleted).toBe(0);
    expect(dataset.documents.size).toBe(2);

    const forced = await rollbackEpisodes([PAIR], { force: true }, dataset.deps);

    expect(forced.deleted).toBe(1);
    expect(forced.retained).toBe(0);
    // Still one transaction carrying both halves: `--force` changes WHETHER the
    // pair is deleted, never HOW.
    expect(dataset.write.calls).toHaveLength(1);
    expect(dataset.write.calls[0]).toEqual([
      guardPatch(EPISODE_ID, `rev-${EPISODE_ID}`),
      { delete: { id: EPISODE_ID } },
      { delete: { id: LOCK_ID } },
    ]);
    expect(dataset.documents.size).toBe(0);
  });

  test("the threshold is a boundary, not a vibe: at it is clean, one ms past it is edited", () => {
    const at = planPairRollback(PAIR, {
      episode: episodeDoc(EPISODE_ID, SLUG, { _updatedAt: after(EDIT_THRESHOLD_MS) }),
      lock: lockDoc(SLUG, EPISODE_ID),
    });
    const past = planPairRollback(PAIR, {
      episode: episodeDoc(EPISODE_ID, SLUG, { _updatedAt: after(EDIT_THRESHOLD_MS + 1) }),
      lock: lockDoc(SLUG, EPISODE_ID),
    });

    expect(at.outcome).toBe("deleted");
    expect(past.outcome).toBe("retained");
    expect(past.reason).toBe("edited");
    expect(past.mutations).toEqual([]);
  });

  test("unreadable timestamps are treated as an edit, not as a clean pair", () => {
    // Fails towards retention. A document whose history cannot be read is a
    // document whose deletion cannot be justified.
    for (const stamps of [
      { _updatedAt: undefined },
      { _createdAt: undefined },
      { _updatedAt: "not a date" },
    ]) {
      const plan = planPairRollback(PAIR, {
        episode: { ...episodeDoc(EPISODE_ID, SLUG), ...stamps },
        lock: lockDoc(SLUG, EPISODE_ID),
      });
      expect(plan.outcome).toBe("retained");
      expect(plan.reason).toBe("edited");
      expect(plan.mutations).toEqual([]);
    }
  });
});

describe("row 3 — the lock is present and the episode is already absent", () => {
  test("the lock is deleted, completing the pair rather than stranding it", async () => {
    // The half-pair that is already there — a backfill interrupted, or a
    // previous rollback that someone stopped. Leaving the lock behind would
    // refuse the episode's own slug back to it, permanently, via a document
    // nobody can see in Studio.
    const dataset = sharedDataset();
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, EPISODE_ID));

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.deleted).toBe(1);
    expect(report.results[0].found).toEqual({ episode: false, lock: true });
    expect(dataset.write.calls).toHaveLength(1);
    // No guard patch: there is no episode to guard, and patching an absent
    // document would fail the transaction that is trying to repair it.
    expect(dataset.write.calls[0]).toEqual([{ delete: { id: LOCK_ID } }]);
    expect(dataset.documents.size).toBe(0);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);
  });
});

describe("row 4 — the episode is present and the lock is already absent", () => {
  test("the episode is deleted", async () => {
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, episodeDoc(EPISODE_ID, SLUG));

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.deleted).toBe(1);
    expect(report.results[0].found).toEqual({ episode: true, lock: false });
    expect(dataset.write.calls).toHaveLength(1);
    expect(dataset.write.calls[0]).toEqual([
      guardPatch(EPISODE_ID, `rev-${EPISODE_ID}`),
      { delete: { id: EPISODE_ID } },
    ]);
    expect(dataset.documents.size).toBe(0);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);
  });

  test("an edited episode with no lock is still retained", async () => {
    // The refusal is about the episode's content, so it cannot depend on
    // whether the other half happens to be there.
    const dataset = sharedDataset();
    dataset.documents.set(
      EPISODE_ID,
      episodeDoc(EPISODE_ID, SLUG, { _updatedAt: after(60 * 60 * 1000) }),
    );

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.retained).toBe(1);
    expect(dataset.write.calls).toHaveLength(0);
    expect(dataset.documents.has(EPISODE_ID)).toBe(true);
  });
});

describe("neither half exists", () => {
  test("no transaction at all, reported as absent rather than counted as deleted", async () => {
    const dataset = sharedDataset();

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.absent).toBe(1);
    expect(report.deleted).toBe(0);
    expect(dataset.write.calls).toHaveLength(0);
  });
});

/* ------------------------------------------------------ row 5: mid-batch -- */

describe("row 5 — a failure injected at pair 20 of 39", () => {
  test("19 complete deletions, 20 complete pairs, and ZERO half-pairs", async () => {
    const pairs: RollbackPair[] = Array.from({ length: 39 }, (_, index) => ({
      episodeId: `episode-${String(index + 1).padStart(2, "0")}`,
      slug: `episode-${String(index + 1).padStart(2, "0")}-slug`,
    }));

    const dataset = sharedDataset();
    for (const pair of pairs) {
      dataset.documents.set(pair.episodeId, episodeDoc(pair.episodeId, pair.slug));
      dataset.documents.set(slugLockId(pair.slug), lockDoc(pair.slug, pair.episodeId));
    }

    // Every pair is clean, so the Nth transaction is the Nth pair. The 20th is
    // rejected by the transport before anything is applied — a 503, a dropped
    // connection, a revoked token: the shape of the failure does not matter,
    // only that the transaction did not commit.
    const failing = (async (mutations: unknown[]) => {
      if (dataset.write.calls.length === 19) {
        dataset.write.calls.push(mutations);
        throw new SanityHttpError("[sanity] mutation failed (503): Service Unavailable", 503);
      }
      return dataset.write(mutations);
    }) as Write;

    const report = await rollbackEpisodes(
      pairs,
      {},
      { getDocuments: dataset.read, mutate: failing },
    );

    // Stopped exactly there, and said so.
    expect(report.failure?.index).toBe(19);
    expect(report.failure?.pair).toEqual(pairs[19]);
    expect((report.failure?.error as Error).message).toContain("503");

    expect(report.deleted).toBe(19);
    expect(report.results).toHaveLength(19);
    expect(report.skipped).toBe(19);

    // THE assertion. A run that deleted 19 episodes and 19 locks belonging to
    // different pairs would satisfy every count above and leave 38 broken
    // publications behind, so the count of half-pairs is checked directly and
    // pinned to exactly zero.
    expect(halfPairs(dataset.documents, pairs)).toEqual([]);

    // Every processed pair fully gone, every remaining pair fully intact —
    // including pair 20, whose transaction was submitted and rejected.
    for (const pair of pairs.slice(0, 19)) {
      expect(dataset.documents.has(pair.episodeId)).toBe(false);
      expect(dataset.documents.has(slugLockId(pair.slug))).toBe(false);
    }
    for (const pair of pairs.slice(19)) {
      expect(dataset.documents.has(pair.episodeId)).toBe(true);
      expect(dataset.documents.has(slugLockId(pair.slug))).toBe(true);
    }
    expect(dataset.documents.size).toBe(40);

    // It stopped rather than carrying on: pairs 21-39 were never even read.
    expect(dataset.write.calls).toHaveLength(20);
    expect(dataset.read.calls).toHaveLength(20);
  });

  test("a read failure stops the batch just as a write failure does", async () => {
    // The pre-read is the entire input to the decision. Guessing past a read
    // that failed is the one way this module could delete something it had no
    // basis to delete.
    const pairs: RollbackPair[] = [
      { episodeId: "ep-1", slug: "slug-1" },
      { episodeId: "ep-2", slug: "slug-2" },
      { episodeId: "ep-3", slug: "slug-3" },
    ];
    const dataset = sharedDataset();
    for (const pair of pairs) {
      dataset.documents.set(pair.episodeId, episodeDoc(pair.episodeId, pair.slug));
      dataset.documents.set(slugLockId(pair.slug), lockDoc(pair.slug, pair.episodeId));
    }

    const failing = (async (ids: string[]) => {
      if (dataset.read.calls.length === 1) {
        throw new SanityHttpError("[sanity] doc fetch responded 401", 401);
      }
      return dataset.read(ids);
    }) as Read;

    const report = await rollbackEpisodes(
      pairs,
      {},
      { getDocuments: failing, mutate: dataset.write },
    );

    expect(report.failure?.index).toBe(1);
    expect(report.deleted).toBe(1);
    expect(report.skipped).toBe(1);
    expect(halfPairs(dataset.documents, pairs)).toEqual([]);
    expect(dataset.documents.size).toBe(4);
  });
});

/* ------------------------------------------------------- refusals in full -- */

describe("a lock that belongs to a different episode", () => {
  test("both halves are retained, and --force does NOT override it", async () => {
    // `slugLock-<slug>` names someone else, so this pair is not ours to delete.
    // Deleting the lock would unbind a slug a still-published episode is serving
    // from; deleting our episode alone would be a half-pair by construction.
    // `--force` means "yes, discard that edit" — there is no edit here.
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, episodeDoc(EPISODE_ID, SLUG));
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, "a-completely-different-episode"));

    const report = await rollbackEpisodes([PAIR], { force: true }, dataset.deps);

    expect(report.retained).toBe(1);
    expect(report.results[0].reason).toBe("foreign-lock");
    expect(report.results[0].detail).toContain("a-completely-different-episode");
    expect(dataset.write.calls).toHaveLength(0);
    expect(dataset.documents.size).toBe(2);
  });
});

describe("the revision guard", () => {
  test("an edit landing between the pre-read and the transaction retains the PAIR", async () => {
    // The `_updatedAt` refusal is read from a pre-read, so on its own it is a
    // time-of-check/time-of-use gap. Here Shane publishes an enrichment in that
    // gap: the transaction's `ifRevisionID` no longer matches, Sanity rejects
    // the whole array, and both halves survive together.
    const dataset = sharedDataset();
    dataset.documents.set(EPISODE_ID, episodeDoc(EPISODE_ID, SLUG));
    dataset.documents.set(LOCK_ID, lockDoc(SLUG, EPISODE_ID));

    const racing = (async (mutations: unknown[]) => {
      const current = dataset.documents.get(EPISODE_ID);
      if (current !== undefined) {
        dataset.documents.set(EPISODE_ID, {
          ...current,
          _rev: "rev-shane-just-published",
          _updatedAt: after(90 * 60 * 1000),
          guestBio: "Added while the rollback was in flight.",
        });
      }
      return dataset.write(mutations);
    }) as Write;

    const report = await rollbackEpisodes(
      [PAIR],
      {},
      { getDocuments: dataset.read, mutate: racing },
    );

    expect(report.failure).toBeDefined();
    expect((report.failure?.error as SanityHttpError).status).toBe(409);
    expect(report.deleted).toBe(0);

    // Neither half went. The guard and the deletes are one transaction, so the
    // pair is retained by the same atomicity that would have deleted it.
    expect(dataset.documents.has(EPISODE_ID)).toBe(true);
    expect(dataset.documents.has(LOCK_ID)).toBe(true);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);
  });
});

/* ------------------------------------------------- cross-module contract -- */

describe("the lock id this module deletes is the one publishEpisode creates", () => {
  test("a real publish, then a real rollback, leaves nothing behind", async () => {
    // `slugLock-<slug>` is spelled out in two modules. If they ever diverged,
    // rollback would delete every episode and match no lock at all — 39
    // half-pairs, produced by a run that reported complete success. So the
    // format is not asserted against a literal here; it is asserted against
    // what `publishEpisode` actually writes.
    const dataset = sharedDataset();

    const published = await publishEpisode(
      {
        episodeDoc: { _id: EPISODE_ID, _type: "episode", guid: "podbean-guid-001", title: "Ep" },
        slug: SLUG,
        mode: "seed",
      },
      { getDocuments: dataset.read, mutate: dataset.write, now: () => CREATED_AT },
    );

    expect(published.outcome).toBe("created");
    const locks = [...dataset.documents.values()].filter((doc) => doc._type === "slugLock");
    expect(locks).toHaveLength(1);
    expect(locks[0]._id).toBe(slugLockId(SLUG));

    // `publishEpisode`'s create carries no `_rev`/`_createdAt`/`_updatedAt` —
    // Sanity stamps those server-side — so give the stored documents the stamps
    // a real read would return before rolling back.
    for (const [id, doc] of dataset.documents) {
      dataset.documents.set(id, {
        ...doc,
        _rev: `rev-${id}`,
        _createdAt: CREATED_AT,
        _updatedAt: CREATED_AT,
      });
    }

    const report = await rollbackEpisodes([PAIR], {}, dataset.deps);

    expect(report.deleted).toBe(1);
    expect(dataset.documents.size).toBe(0);
    expect(halfPairs(dataset.documents, [PAIR])).toEqual([]);
  });
});
