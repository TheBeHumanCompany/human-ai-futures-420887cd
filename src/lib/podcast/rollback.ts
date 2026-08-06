import { getDocuments, mutate } from "../sanity/http";

/**
 * Rollback — the secondary window (plan §5).
 *
 * The real rollback is `sanity dataset export` taken before the backfill runs.
 * This is the other one: it undoes a backfill in place, and the only thing it
 * has to get right is that it never leaves a HALF PAIR.
 *
 * A publication is two documents — the episode and `slugLock-<slug>` — created
 * together in one transaction precisely so the slug can never be bound to a
 * publication that did not happen. Undoing that has the mirror obligation: the
 * pair is deleted atomically or retained atomically. There is no code path here
 * that deletes one half of an existing pair, and that is the entire point of the
 * module.
 *
 * What a half pair actually costs, in each direction:
 *
 *   lock deleted, episode kept   the slug is unbound while a document still
 *                                claims it. The next publish of any episode can
 *                                take that slug, and the permanent URL moves —
 *                                the single failure this project exists to
 *                                prevent.
 *   episode deleted, lock kept   the slug is held by a document that no longer
 *                                exists, so re-publishing the same episode under
 *                                the same slug is refused as `SlugTakenError`
 *                                forever, by a lock nobody can see in Studio.
 *
 * Neither is recoverable by re-running anything; both need a human with a write
 * token and a theory. So every decision below resolves towards "retain both",
 * and refusal is always per pair.
 *
 * Layering note (AC-36): `layering.test.ts` rule 5 makes `publish.ts` the sole
 * writer of lock mutations, and it detects one by grepping for a lock-typed
 * object literal. This module passes that rule, and for the right reason rather
 * than by accident — the rule is about BINDING a slug, which is a create that
 * arbitrates one slug to one episode, and nothing here creates or rewrites a
 * lock. It emits `delete` against a lock id, and only for a lock whose
 * `episodeId` it has read and matched first. (The rule greps file text, so the
 * marker it looks for is deliberately not spelled out anywhere above.)
 */

/**
 * How much later than `_createdAt` an episode's `_updatedAt` may be before the
 * pair is treated as human-edited and retained.
 *
 * A seed document is created by one `create` inside one transaction and is
 * never touched again by the backfill — `seed` mode emits no episode mutation
 * at all against a document that already exists — so an untouched seed has
 * `_createdAt === _updatedAt` exactly. Measured against the real dataset after
 * the live backfill: 38 of the 39 published episodes have a gap of exactly
 * zero. The allowance is therefore not for our own writes. It is headroom for
 * post-commit touches by Sanity itself, which this project has not observed but
 * also has not ruled out.
 *
 * The size is chosen from the asymmetry of being wrong:
 *
 *   too tight   every pair reports "edited", the operator learns that `--force`
 *               is simply how you run this command, and the guard is gone. This
 *               is the failure mode that looks safe and isn't.
 *   too loose   a real edit is deleted. Irreversible except from the export.
 *
 * 60 s sits above any plausible post-commit machine touch and below the only
 * human path that produces an edit: open Studio, change a field, publish. That
 * cannot happen inside a minute of the backfill creating the document while the
 * operator is still watching the backfill's own output scroll past.
 *
 * The 39th episode is the check on all of this. Its `_updatedAt` is 106 s after
 * its `_createdAt` — something outside the seed path touched it, roughly a
 * minute after the backfill finished — and a rollback dry run against
 * production names it, retains both of its halves, and deletes the other 38.
 * That is the intended behaviour observed on real data rather than asserted:
 * one document flagged by id with a reason, and no operator trained to reach
 * for `--force`.
 *
 * A pair refused for this reason is reported by id, so `--force` is a decision
 * made about named documents rather than about a number.
 */
export const EDIT_THRESHOLD_MS = 60_000;

/**
 * A field name no episode document has. It exists only to give the revision
 * guard below a well-formed `unset` to perform: Sanity's `ifRevisionID` is a
 * `patch` parameter (confirmed against the Content Lake transaction docs —
 * `delete` has no revision form), so guarding a delete means putting a patch
 * that does nothing in the same transaction as the delete that does everything.
 */
const REVISION_GUARD_PATH = "__rollbackRevisionGuard";

/** One publication: the episode document and the lock that binds its slug. */
export interface RollbackPair {
  /** The episode document `_id`, exactly as the snapshot recorded it. */
  episodeId: string;
  /** The slug; the lock is `slugLock-<slug>`. */
  slug: string;
}

/** Why a pair that exists was left alone. Both halves are retained in either case. */
export type RetentionReason =
  /** `_updatedAt` is meaningfully later than `_createdAt` — a human edited it. */
  | "edited"
  /** `slugLock-<slug>` names a different episode. This pair is not ours to delete. */
  | "foreign-lock";

export interface PairPlan {
  /**
   * `deleted` — every half that exists is in `mutations`.
   * `retained` — both halves are left in place; `mutations` is empty.
   * `absent`  — neither half exists; nothing to do and nothing to report.
   */
  outcome: "deleted" | "retained" | "absent";
  /** Exactly what will be submitted, as ONE transaction. Empty means nothing is sent. */
  mutations: unknown[];
  reason?: RetentionReason;
  /** Operator-facing explanation of `reason`, naming the documents involved. */
  detail?: string;
}

export interface PairResult extends PairPlan {
  pair: RollbackPair;
  lockId: string;
  /** Which halves the pre-read found. Reported so a summary can be audited, not just totalled. */
  found: { episode: boolean; lock: boolean };
}

export interface RollbackReport {
  /** One entry per pair actually attempted, in order. */
  results: PairResult[];
  deleted: number;
  retained: number;
  absent: number;
  /**
   * Set when the batch stopped. Every pair before this one is fully resolved and
   * every pair from this one on is fully untouched — which is what makes a
   * mid-batch failure safe to walk away from.
   */
  failure?: { index: number; pair: RollbackPair; error: unknown };
  /** Pairs never attempted because the batch stopped. */
  skipped: number;
}

/**
 * Transport, injectable exactly as `PublishDeps` is, so the tests run with no
 * network and no credential. There is no clock here: rollback stamps nothing.
 */
export interface RollbackDeps {
  getDocuments?: typeof getDocuments;
  mutate?: typeof mutate;
}

/** The lock id for a slug. Pinned against `publishEpisode`'s own by `rollback.test.ts`. */
export function slugLockId(slug: string): string {
  return `slugLock-${slug}`;
}

/**
 * Milliseconds between creation and last update, or `null` when either stamp is
 * missing or unparseable.
 *
 * `null` is deliberately not zero. A document whose timestamps cannot be read is
 * a document whose edit history cannot be read, and the answer to that is the
 * same as the answer to "it was edited": retain it and make a human look.
 */
function editWindowMs(doc: Record<string, unknown>): number | null {
  const created = Date.parse(String(doc._createdAt));
  const updated = Date.parse(String(doc._updatedAt));
  if (Number.isNaN(created) || Number.isNaN(updated)) return null;
  return updated - created;
}

/**
 * The decision table for one pair, and the transaction it implies. Pure — it
 * neither reads nor writes, so every branch is directly assertable.
 */
export function planPairRollback(
  pair: RollbackPair,
  found: { episode?: Record<string, unknown>; lock?: Record<string, unknown> },
  options: { force?: boolean } = {},
): PairPlan {
  const lockId = slugLockId(pair.slug);
  const { episode, lock } = found;

  // Nothing to undo. Reported rather than silently counted as a deletion, so a
  // rollback of a backfill that never ran cannot look like a rollback that did.
  if (episode === undefined && lock === undefined) return { outcome: "absent", mutations: [] };

  // The lock exists but names someone else. Deleting it would unbind a slug that
  // a different, still-published episode is serving from — the exact half-pair
  // damage this module exists to avoid, just committed against a pair we were
  // never asked about. `--force` does NOT override this: force is the operator
  // saying "yes, discard that edit", and there is no edit here to discard.
  if (lock !== undefined && lock.episodeId !== pair.episodeId) {
    return {
      outcome: "retained",
      mutations: [],
      reason: "foreign-lock",
      detail:
        `${lockId} is held by ${String(lock.episodeId)}, not ${pair.episodeId} — ` +
        `retaining both halves; --force does not apply`,
    };
  }

  if (episode !== undefined) {
    const window = editWindowMs(episode);
    const edited = window === null || window > EDIT_THRESHOLD_MS;

    if (edited && options.force !== true) {
      return {
        outcome: "retained",
        mutations: [],
        reason: "edited",
        detail:
          window === null
            ? `${pair.episodeId} has unreadable _createdAt/_updatedAt stamps — retaining both halves; pass --force to delete anyway`
            : `${pair.episodeId} was updated ${Math.round(window / 1000)}s after it was created ` +
              `(threshold ${EDIT_THRESHOLD_MS / 1000}s) — retaining both halves; pass --force to delete anyway`,
      };
    }
  }

  // Every half that exists, in one array. `mutate()` is all-or-nothing, so this
  // array IS the atomicity guarantee — splitting it into two calls would create
  // exactly the window where a half pair can exist.
  const mutations: unknown[] = [];

  if (episode !== undefined) {
    // The pre-read told us this document is unedited; the transaction proves it
    // still is. Without this, the refusal above is a time-of-check/time-of-use
    // gap: Shane publishes an enrichment in the second between our read and our
    // delete and we delete it, having correctly decided not to. `ifRevisionID`
    // closes that — a moved `_rev` fails the patch, and because the patch and
    // the deletes are one transaction, BOTH halves roll back together. The pair
    // is retained atomically by the same mechanism that would have deleted it
    // atomically, which is why the guarantee survives concurrency rather than
    // merely surviving the happy path.
    //
    // A document with no `_rev` cannot be guarded, but it also cannot pass the
    // check above: `_rev` is absent only on documents Sanity did not return, and
    // those have no `_createdAt`/`_updatedAt` either, so `editWindowMs` has
    // already sent them to `retained` unless the operator forced them through.
    const rev = episode._rev;
    if (typeof rev === "string" && rev.length > 0) {
      mutations.push({
        patch: { id: pair.episodeId, ifRevisionID: rev, unset: [REVISION_GUARD_PATH] },
      });
    }
    mutations.push({ delete: { id: pair.episodeId } });
  }

  if (lock !== undefined) mutations.push({ delete: { id: lockId } });

  return { outcome: "deleted", mutations };
}

/**
 * Rolls back a batch of pairs, one transaction per pair, in order.
 *
 * Stops at the first failure — read or write — and reports where it stopped.
 * This is the opposite of the backfill's collect-and-continue, and for the
 * opposite reason: a publish failure is per-episode and tells you nothing about
 * the next episode, while a rollback failure means the dataset just answered
 * something we did not expect about the documents we are deleting. Continuing
 * would spend the operator's remaining pairs on a theory that has already been
 * falsified. Stopping leaves a state that needs no reconstruction: every pair
 * before the failure is gone in full, every pair from it on is intact in full.
 */
export async function rollbackEpisodes(
  pairs: RollbackPair[],
  options: { force?: boolean } = {},
  deps: RollbackDeps = {},
): Promise<RollbackReport> {
  const read = deps.getDocuments ?? getDocuments;
  const send = deps.mutate ?? mutate;

  const results: PairResult[] = [];
  const report = (failure?: RollbackReport["failure"]): RollbackReport => ({
    results,
    deleted: results.filter((entry) => entry.outcome === "deleted").length,
    retained: results.filter((entry) => entry.outcome === "retained").length,
    absent: results.filter((entry) => entry.outcome === "absent").length,
    failure,
    skipped: pairs.length - results.length - (failure ? 1 : 0),
  });

  for (const [index, pair] of pairs.entries()) {
    const lockId = slugLockId(pair.slug);

    try {
      // One request, both halves, full documents — `_rev` and the timestamps are
      // the whole input to the decision, and a projection would not carry them.
      const documents = await read([pair.episodeId, lockId]);
      const episode = documents.find((doc) => doc._id === pair.episodeId);
      const lock = documents.find((doc) => doc._id === lockId);

      const plan = planPairRollback(pair, { episode, lock }, options);
      if (plan.mutations.length > 0) await send(plan.mutations);

      results.push({
        ...plan,
        pair,
        lockId,
        found: { episode: episode !== undefined, lock: lock !== undefined },
      });
    } catch (error) {
      return report({ index, pair, error });
    }
  }

  return report();
}
