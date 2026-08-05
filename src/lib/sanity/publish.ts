import { SanityHttpError, getDocuments, mutate } from "./http";

/**
 * Publication — Decision F.
 *
 * Two relations need arbitrating and therefore there are two compare-and-sets,
 * both of them a strict Sanity `create` (which fails when the `_id` exists,
 * inside a transaction that is all-or-nothing):
 *
 *   slug → episode   `create` of `slugLock-<slug>`  — one slug, one episode.
 *   episode → slug   `create` of the episode itself, whenever the pre-read
 *                    found none — one episode, one first publication.
 *
 * The second is the one that matters most and the one that is easiest to talk
 * yourself out of. Two Studio sessions publishing the *same* unpublished
 * episode under *different* slugs both pre-read "nothing there"; their lock ids
 * differ, so the lock CAS never collides. Without the episode-side `create`
 * both transactions commit, the later wins the slug, both locks survive, and
 * the permanent URL moved — the single failure this project exists to prevent.
 * With it, exactly one transaction commits and the loser's lock rolls back
 * with it. That guarantee lives entirely in the fact that the lock mutation and
 * the episode mutation are submitted in ONE `mutate()` call; splitting them
 * into two calls would silently delete it.
 *
 * The pre-read is a fast path, never a guard. Every safety-critical outcome is
 * re-arbitrated by a strict `create` inside the transaction, which is why a
 * stale read is survivable and a missing check is not.
 */

/** Row 1: the episode is published under a different, already-frozen slug. */
export class SlugImmutableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugImmutableError";
  }
}

/** Row 2: `slugLock-<slug>` exists and belongs to a different episode. */
export class SlugTakenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugTakenError";
  }
}

/**
 * A strict `create` was answered `409 Conflict` twice. Either a genuine race
 * (correct — the other writer won) or a pre-read that stayed inside the
 * consistency window for two attempts. Retriable by the caller; the Studio
 * action surfaces it as "this episode was published by someone else; reload and
 * try again."
 *
 * Raised for a real 409 and nothing else. An expired token, a rate limit or a
 * 5xx propagates as itself — unwrapped and unretried. Telling an editor their
 * episode was published by someone else when the write token expired sends them
 * hunting a race that never happened.
 */
export class PublishConflictError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PublishConflictError";
  }
}

/**
 * `author` is Shane publishing in Studio; `seed` is the backfill.
 *
 * The distinction is create-vs-replace resolved by construction rather than by
 * care: `seed` emits no episode mutation at all against an existing document,
 * so re-running the backfill cannot overwrite enrichment — there is no code
 * path that would.
 */
export type PublishMode = "author" | "seed";

export interface PublishEpisodeArgs {
  /** The desired published shape. Must carry `_id`. */
  episodeDoc: Record<string, unknown>;
  slug: string;
  mode: PublishMode;
  /** `author` only — deleted in the same transaction, including on row 3. */
  deleteDraftId?: string;
}

export interface PublishResult {
  outcome: "created" | "replaced" | "unchanged";
  /** Exactly what was submitted. Empty means nothing was sent at all. */
  mutations: unknown[];
}

/**
 * Transport and clock, injectable so the tests run with no network and no
 * credential. The clock is here for the same reason: `frozenAt` and
 * `slugFrozenAt` are stamped inside a transaction, and a test that can pin them
 * can assert the mutation array exactly rather than approximately.
 */
export interface PublishDeps {
  getDocuments?: typeof getDocuments;
  mutate?: typeof mutate;
  now?: () => string;
}

/**
 * Removed before comparing, matched by exact key name at every object level.
 *
 * An exact list, never a pattern. "Any key starting with `_`" is the plausible
 * shorthand and it strips `asset._ref` recursively — which would make a swapped
 * guest photo compare equal and silently never publish.
 */
const STRIPPED_KEYS = new Set(["_rev", "_createdAt", "_updatedAt", "_key", "_originalId"]);

/** Recursively drops the system keys above. `_type`, `_id`, `_ref` and `_weak` survive. */
export function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (STRIPPED_KEYS.has(key)) continue;
      out[key] = strip(inner);
    }
    return out;
  }
  return value;
}

/**
 * Structural deep equality: objects by key set and per-key value regardless of
 * insertion order, arrays **in order** — GROQ arrays are ordered, so a
 * reordered `topics[]` is a real content change. Never a JSON-string compare,
 * which would call a key reshuffle a difference and republish on every run.
 */
export function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => equal(item, b[index]));
  }

  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const leftKeys = Object.keys(left);
    if (leftKeys.length !== Object.keys(right).length) return false;
    return leftKeys.every((key) => Object.hasOwn(right, key) && equal(left[key], right[key]));
  }

  return false;
}

/**
 * Mirrors `podbean/filter.ts`'s `normalise()` so a stored haystack and a
 * typed query meet in the same shape.
 *
 * Topic names are deliberately absent: a `topics[]` entry is a reference, and
 * resolving `_ref` to a name needs a second query that this transaction has no
 * reason to make.
 */
function computeSearchText(doc: Record<string, unknown>): string {
  const parts = [doc.title, doc.guestName, doc.excerpt].filter(
    (value): value is string => typeof value === "string",
  );

  return parts
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic `_key`s: the referenced topic's id. Reproducible across runs, which a random key is not. */
function keyedTopics(topics: unknown): unknown {
  if (!Array.isArray(topics)) return topics;
  return topics.map((entry) => {
    if (entry === null || typeof entry !== "object") return entry;
    const ref = (entry as Record<string, unknown>)._ref;
    return typeof ref === "string" ? { ...(entry as Record<string, unknown>), _key: ref } : entry;
  });
}

/**
 * The document we intend to have published: the authored fields, plus the slug
 * carried forward when it is already frozen (row 1 has already established it
 * matches), plus a recomputed `searchText` and deterministic topic keys.
 */
function buildDesired(
  episodeDoc: Record<string, unknown>,
  slug: string,
  published: Record<string, unknown> | undefined,
  now: string,
): Record<string, unknown> {
  const frozen =
    published !== undefined && isNonEmptyString(published.slugFrozenAt) ? published : undefined;

  const desired: Record<string, unknown> = {
    ...episodeDoc,
    slug: frozen ? frozen.slug : { current: slug, _type: "slug" },
    slugFrozenAt: frozen ? frozen.slugFrozenAt : now,
  };

  if ("topics" in desired) desired.topics = keyedTopics(desired.topics);
  desired.searchText = computeSearchText(desired);

  return desired;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

interface Plan {
  outcome: PublishResult["outcome"];
  mutations: unknown[];
  /** Whether the transaction contains a strict episode `create` — the one retriable conflict. */
  createsEpisode: boolean;
}

/**
 * One pre-read, the decision table in order, and the transaction it implies.
 * Purely a construction step — nothing here writes.
 */
async function planTransaction(
  args: PublishEpisodeArgs,
  read: typeof getDocuments,
  now: () => string,
): Promise<Plan> {
  const episodeId = String(args.episodeDoc._id);
  const lockId = `slugLock-${args.slug}`;

  // One request, both documents, full — not a projection. A projected pre-read
  // compares a flattened `guestPhoto` string against `{_type, asset:{_ref}}`
  // and can essentially never be equal, so row 3 would never fire. Missing ids
  // are omitted rather than erroring, so absence is a normal result.
  const documents = await read([episodeId, lockId]);
  const published = documents.find((doc) => doc._id === episodeId);
  const lock = documents.find((doc) => doc._id === lockId);

  // Row 1 — the URL has been shared. Nothing is emitted, not even a draft delete.
  if (published !== undefined && isNonEmptyString(published.slugFrozenAt)) {
    const current = (published.slug as { current?: unknown } | undefined)?.current;
    if (current !== args.slug) {
      throw new SlugImmutableError(
        `[sanity] ${episodeId} is published at "${String(current)}" and its slug is frozen; ` +
          `refusing to republish it as "${args.slug}"`,
      );
    }
  }

  // Row 2 — the slug belongs to someone else.
  if (lock !== undefined && lock.episodeId !== episodeId) {
    throw new SlugTakenError(
      `[sanity] slug "${args.slug}" is held by ${String(lock.episodeId)}, not ${episodeId}`,
    );
  }

  const stamp = now();
  const desired = buildDesired(args.episodeDoc, args.slug, published, stamp);
  const identical = published !== undefined && equal(strip(published), strip(desired));
  const draftDelete =
    args.mode === "author" && args.deleteDraftId !== undefined
      ? [{ delete: { id: args.deleteDraftId } }]
      : [];

  // Row 3 — lock held by us, document already exactly right. The published
  // document is not touched; the draft still is, or N13 leaves an editable
  // draft shadowing an unchanged publication forever.
  if (lock !== undefined && identical) {
    return { outcome: "unchanged", mutations: draftDelete, createsEpisode: false };
  }

  // Row 4 — build from what is actually missing or changed.
  const mutations: unknown[] = [];

  // Lock present and owned is preserved: never replaced, never deleted.
  if (lock === undefined) {
    mutations.push({
      create: {
        _id: lockId,
        _type: "slugLock",
        episodeId,
        guid: args.episodeDoc.guid,
        frozenAt: stamp,
      },
    });
  }

  let outcome: PublishResult["outcome"] = "unchanged";
  let createsEpisode = false;

  if (published === undefined) {
    // Strict `create` in BOTH modes. This is the episode→slug CAS; downgrading
    // it to `createIfNotExists` or `createOrReplace` reopens the race that lets
    // two sessions publish one episode under two slugs.
    mutations.push({ create: desired });
    outcome = "created";
    createsEpisode = true;
  } else if (!identical && args.mode === "author") {
    mutations.push({ createOrReplace: desired });
    outcome = "replaced";
  }
  // Otherwise no episode mutation at all: `seed` never overwrites an existing
  // published document (that is what makes the backfill idempotent and
  // enrichment-preserving), and an identical document has nothing to write.

  mutations.push(...draftDelete);

  return { outcome, mutations, createsEpisode };
}

/**
 * Whether a failure is a strict `create` losing its compare-and-set.
 *
 * Sanity's mutate endpoint answers a `create` against an existing `_id` with
 * HTTP `409 Conflict`, and `mutate()` carries that status onto
 * `SanityHttpError.status`. Every other failure — `401`, `429`, a `5xx`, or a
 * transport `TypeError` that never reached Sanity at all — is a different
 * problem wearing no disguise, and is treated as one.
 */
function isCreateConflict(error: unknown): error is SanityHttpError {
  return error instanceof SanityHttpError && error.status === 409;
}

/**
 * Publishes an episode and binds its slug, in one transaction.
 *
 * An empty mutation list emits nothing — no transaction, no network call —
 * which is what the backfill's "run it a third time" assertion rests on.
 */
export async function publishEpisode(
  args: PublishEpisodeArgs,
  deps: PublishDeps = {},
): Promise<PublishResult> {
  const read = deps.getDocuments ?? getDocuments;
  const send = deps.mutate ?? mutate;
  const now = deps.now ?? (() => new Date().toISOString());

  const first = await planTransaction(args, read, now);
  if (first.mutations.length === 0) return { outcome: first.outcome, mutations: [] };

  try {
    await send(first.mutations);
    return { outcome: first.outcome, mutations: first.mutations };
  } catch (error) {
    // Retried only when BOTH hold: the transaction carried the episode-side
    // strict `create`, and Sanity answered 409. That pair is the one failure a
    // re-read can legitimately resolve — a pre-read that reported "absent" from
    // inside the consistency window of a just-committed write. The decision
    // table is re-run from the top, so a second attempt can come back
    // "unchanged", or throw row 1 or row 2, which are real answers.
    //
    // Everything else propagates immediately, unwrapped, unretried. Retrying an
    // expired token or a rate limit only doubles the damage, and there is no
    // outcome for which a second attempt is more likely to succeed.
    if (!first.createsEpisode || !isCreateConflict(error)) throw error;

    const second = await planTransaction(args, read, now);
    if (second.mutations.length === 0) return { outcome: second.outcome, mutations: [] };

    try {
      await send(second.mutations);
      return { outcome: second.outcome, mutations: second.mutations };
    } catch (retryError) {
      // Same rule on the way out. Only a second 409 means "someone else won";
      // any other failure is reported as what it actually was.
      if (!isCreateConflict(retryError)) throw retryError;

      throw new PublishConflictError(
        `[sanity] ${String(args.episodeDoc._id)} could not be published after one retry: ${retryError.message}`,
        { cause: retryError },
      );
    }
  }
}
