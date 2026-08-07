/**
 * The topic taxonomy's identity function and its shape rules.
 *
 * Pure by rule: no `node:` import, no filesystem, no network. The taxonomy
 * itself lives in `content/topic-taxonomy.json` and is read by whoever needs it
 * — `scripts/apply-topics.ts` to write it, `topics.test.ts` to check it. The
 * rules for what counts as a valid taxonomy live *here*, under `src/`, because
 * the PR gate runs `bun test src/` and rules that live under `scripts/` are
 * rules the gate cannot see (the same reasoning that put `rollback.ts` in `src/`
 * rather than inside `backfill.ts`).
 */

/**
 * The deterministic document id for a topic: `topic-<slug>`.
 *
 * **Why it must stay derived from the slug**, stated precisely because an
 * earlier version of this comment overstated it and the overstatement is worth
 * not repeating. The claim was that a random id would churn `topics[]._key` and
 * make Decision F's content comparison report a change on every republish. That
 * is **wrong**: `publish.ts`'s `STRIPPED_KEYS` (line 109) removes `_key` before
 * comparing, so `_key` churn is invisible to the comparison. A random id
 * generated once and stored would also be perfectly stable.
 *
 * The real invariants a derived id buys, all of which a *regenerated* id breaks:
 *
 *   1. `createIfNotExists` is only idempotent against a stable `_id`. Against a
 *      freshly generated one the "does this exist" test is false every run, so
 *      the verb silently degrades to `create` and every run adds a duplicate
 *      topic document.
 *   2. A reference can be derived from a slug with no lookup. `apply-topics.ts`,
 *      the enrichment pass, and anything else that needs `_ref` computes it from
 *      the slug instead of querying for the document first.
 *   3. The taxonomy stays single-valued: one slug is one document, so two runs
 *      cannot produce two "Leadership" topics competing for the same facet.
 *
 * And the content-comparison point restated correctly: if ids were regenerated,
 * what would differ is `topics[]._ref`, which `strip()` deliberately preserves
 * (`_type`, `_id`, `_ref` and `_weak` survive — publish.ts:111). So a
 * regenerated id *would* show up as a real content change — via `_ref`, not
 * `_key`.
 *
 * The sanitisation mirrors `episodeDocId`, including the deliberate exclusion of
 * '.': Sanity's `path()`-glob ACL grants treat '.' as a path-segment separator
 * (the same way "drafts." and "versions." are), so a '.' in an `_id` silently
 * moves the document outside single-segment grants.
 *
 * Over a valid taxonomy the substitution is the identity — slugs are validated
 * against `/^[a-z0-9-]+$/`, a subset of the allowed set — so it is a totality
 * guarantee rather than a transformation anyone should rely on.
 */
export function topicDocId(slug: string): string {
  return "topic-" + slug.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * The hard ceiling on a topic name, in characters.
 *
 * Decided by the user, and measured rather than guessed. Each character costs
 * ~6 B per episode across a six-topic array, and the directory fetches the
 * whole catalogue — so this number is set by `queries.test.ts`'s per-episode
 * payload bound, not by taste. Getting from ~12 to 16 took dropping `guestPhoto`
 * from `EPISODE_LIST_PROJECTION` (1,169 B → 1,094 B against a 1,200 B budget);
 * twelve characters would have ruled out "Sustainability" and "Mental Health".
 *
 * **Enforced in three places, and it needs all three.** Here, so a bad name in
 * the committed file is rejected before it is ever written. In
 * `queries.test.ts`, so the *reason* for the limit goes red if the budget moves.
 * And in `studio/schemaTypes/topic.ts` as `rule.max(16)` — without that one the
 * other two are decorative, because `apply-topics.ts` deliberately never
 * overwrites an existing document, so an editor renaming a topic to something
 * long in the Studio would grow the real payload while every offline test here
 * stayed green against the committed file.
 */
export const TOPIC_NAME_MAX_LENGTH = 16;

/**
 * The most topics one episode may carry.
 *
 * Not a style rule — it is the assumption `queries.test.ts`'s maximal fixture is
 * built on, and therefore the assumption the whole 1,200 B per-episode bound
 * rests on. Measured against the shipped taxonomy, a maximal episode is 1,161 B
 * at six topics and 1,214 B at seven: the seventh topic is what breaks the
 * budget, so the cap is load-bearing rather than advisory.
 *
 * Mirrored by `rule.max(6)` on `studio/schemaTypes/episode.ts`'s `topics` array,
 * which is the only place an editor can be stopped. The offline bound is a
 * regression detector for *developer* changes (Decision K says so explicitly);
 * it cannot see what an editor does, and before that `rule.max(6)` existed
 * nothing could.
 */
export const MAX_TOPICS_PER_EPISODE = 6;

/**
 * The taxonomy's size band, from the consensus plan's Task 9.
 *
 * Below ~10 the facet stops discriminating and the directory may as well not
 * have one; above ~20 it becomes a long tail of topics matching one episode
 * each, which is a worse browse experience than no facet at all. 12–18 is the
 * band the plan set, and it is asserted rather than aimed at.
 */
export const TAXONOMY_MIN_TOPICS = 12;
export const TAXONOMY_MAX_TOPICS = 18;

/**
 * The fewest attributed episodes a topic may carry.
 *
 * This is what "no facet of one" means mechanically. The evidence list IS the
 * support set — not a claimed count in prose, which is unverifiable and was how
 * an earlier version of this file stated it.
 */
export const TOPIC_MIN_EVIDENCE = 4;

/** Where the taxonomy lives, relative to the repo root. */
export const TAXONOMY_RELATIVE_PATH = "content/topic-taxonomy.json";

/**
 * One episode that supports a topic, and that episode's own words.
 *
 * Attributed rather than free text. The constraint governing Task 9 is that the
 * vocabulary is proposed ONLY from the 39 committed `title`/`description` values
 * — so `topics.test.ts` checks each quote against the episode named here, not
 * against the corpus as a whole. Searching the whole corpus would let a quote be
 * paired with the wrong episode and still pass, which is what it used to do.
 */
export interface EvidenceEntry {
  episodeNumber: number;
  quote: string;
}

export interface TopicEntry {
  /** The display name. At most `TOPIC_NAME_MAX_LENGTH` characters. */
  name: string;
  /** Lowercase, `/^[a-z0-9-]+$/`. The input to `topicDocId`, and so permanent. */
  slug: string;
  /** At least `TOPIC_MIN_EVIDENCE` distinct episodes. */
  evidence: EvidenceEntry[];
}

export interface Taxonomy {
  /** Where the vocabulary was derived from. Provenance, for the PR reviewer. */
  source: string;
  /** The constraint the vocabulary was derived under. */
  constraint: string;
  /** How US-109 should apply these when it assigns topics to episodes. */
  usageGuidanceForEnrichment: string;
  topics: TopicEntry[];
}

/**
 * Proves the parsed JSON actually has the shape the type asserts.
 *
 * `JSON.parse` returns `any`, and a type assertion checks nothing at runtime —
 * a hand-edited taxonomy with a numeric `name` would sail past every value-level
 * rule below (`(123).length` is `undefined`, which is neither `> 16` nor `=== 0`)
 * and only fail deep inside a Sanity mutation. This is `backfill.ts`'s
 * `parseSnapshot` applied to the same class of problem, for the same reason: the
 * input to an irreversible write is validated before the write is planned.
 *
 * Returns errors rather than throwing or exiting so it stays pure and testable;
 * the caller decides what a failure means.
 */
export function parseTaxonomy(raw: unknown): { taxonomy: Taxonomy | null; errors: string[] } {
  const errors: string[] = [];

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { taxonomy: null, errors: [`taxonomy is not an object (got ${describeType(raw)})`] };
  }

  const record = raw as Record<string, unknown>;
  for (const key of ["source", "constraint", "usageGuidanceForEnrichment"] as const) {
    if (typeof record[key] !== "string" || (record[key] as string).length === 0) {
      errors.push(`"${key}" must be a non-empty string (got ${JSON.stringify(record[key])})`);
    }
  }

  if (!Array.isArray(record.topics)) {
    errors.push(`"topics" must be an array (got ${describeType(record.topics)})`);
    return { taxonomy: null, errors };
  }

  record.topics.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`topic ${index} is not an object (got ${describeType(entry)})`);
      return;
    }
    const topic = entry as Record<string, unknown>;

    for (const key of ["name", "slug"] as const) {
      const value = topic[key];
      if (typeof value !== "string" || value.length === 0) {
        errors.push(
          `topic ${index} has a non-string or empty "${key}" (got ${JSON.stringify(value)})`,
        );
      }
    }

    if (!Array.isArray(topic.evidence)) {
      errors.push(
        `topic ${index} has a non-array "evidence" (got ${describeType(topic.evidence)})`,
      );
      return;
    }

    topic.evidence.forEach((item, evidenceIndex) => {
      const where = `topic ${index} evidence ${evidenceIndex}`;
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`${where} is not an object (got ${describeType(item)})`);
        return;
      }
      const { episodeNumber, quote } = item as Record<string, unknown>;
      // `Number.isInteger` rather than `typeof === "number"`: a float or a NaN
      // would never match a real episode and would fail confusingly later.
      if (!Number.isInteger(episodeNumber)) {
        errors.push(
          `${where} has a non-integer "episodeNumber" (got ${JSON.stringify(episodeNumber)})`,
        );
      }
      if (typeof quote !== "string" || quote.length === 0) {
        errors.push(`${where} has a non-string or empty "quote" (got ${JSON.stringify(quote)})`);
      }
    });
  });

  if (errors.length > 0) return { taxonomy: null, errors };
  return { taxonomy: record as unknown as Taxonomy, errors };
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * The value-level rules, applied to an already shape-validated taxonomy.
 *
 * Every rule here guards a failure that is either irreversible or invisible:
 * a duplicate slug is two topics competing for one document id, an over-long
 * name is a payload regression on every episode that references it, and a
 * malformed slug is a document id that may fall outside a Sanity ACL grant.
 * None of them are caught by the type checker.
 *
 * Returns every error rather than the first, so a taxonomy edit is corrected in
 * one pass instead of one error per run.
 */
export function validateTaxonomy(topics: TopicEntry[]): string[] {
  const errors: string[] = [];

  if (topics.length < TAXONOMY_MIN_TOPICS || topics.length > TAXONOMY_MAX_TOPICS) {
    errors.push(
      `the taxonomy has ${topics.length} topics; the plan's band is ` +
        `${TAXONOMY_MIN_TOPICS}–${TAXONOMY_MAX_TOPICS}`,
    );
  }

  const seenNames = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();

  for (const topic of topics) {
    if (topic.name.length > TOPIC_NAME_MAX_LENGTH) {
      errors.push(
        `"${topic.name}" is ${topic.name.length} characters; the ceiling is ` +
          `${TOPIC_NAME_MAX_LENGTH} (see queries.test.ts's per-episode payload bound)`,
      );
    }
    if (topic.name.trim() !== topic.name) {
      errors.push(`"${topic.name}" has leading or trailing whitespace`);
    }
    if (!/^[a-z0-9-]+$/.test(topic.slug)) {
      errors.push(`slug "${topic.slug}" must match /^[a-z0-9-]+$/`);
    }

    if (topic.evidence.length < TOPIC_MIN_EVIDENCE) {
      errors.push(
        `"${topic.name}" cites ${topic.evidence.length} episode(s); at least ` +
          `${TOPIC_MIN_EVIDENCE} are required so no topic is a facet of one`,
      );
    }

    // Four citations of the SAME episode is one episode's worth of support
    // wearing a disguise, and would satisfy the count rule above.
    const citedEpisodes = new Set(topic.evidence.map((item) => item.episodeNumber));
    if (citedEpisodes.size !== topic.evidence.length) {
      errors.push(`"${topic.name}" cites the same episode more than once`);
    }

    // Case-insensitive, because `Leadership` and `leadership` as two topics is
    // exactly the duplicate-facet failure the `topic` document type exists to
    // prevent (see studio/schemaTypes/topic.ts).
    const nameKey = topic.name.toLowerCase();
    if (seenNames.has(nameKey)) errors.push(`duplicate topic name: "${topic.name}"`);
    seenNames.add(nameKey);

    if (seenSlugs.has(topic.slug)) errors.push(`duplicate topic slug: "${topic.slug}"`);
    seenSlugs.add(topic.slug);

    // Distinct slugs do not by themselves guarantee distinct ids — `topicDocId`
    // maps through a lossy substitution, the same way `episodeDocId` does. Two
    // colliding ids would mean the second `createIfNotExists` silently resolves
    // to the first topic's document and one topic never exists at all.
    const id = topicDocId(topic.slug);
    if (seenIds.has(id)) errors.push(`two topics collapse onto one document id: ${id}`);
    seenIds.add(id);
  }

  return errors;
}

export interface TopicDocument {
  _id: string;
  _type: "topic";
  name: string;
  slug: { _type: "slug"; current: string };
}

/**
 * The document `apply-topics.ts` writes.
 *
 * Matches `studio/schemaTypes/topic.ts` exactly: a `name` string and a `slug` of
 * Sanity's `slug` type, which is an object with a `current` — not a bare string.
 */
export function topicDocument(topic: TopicEntry): TopicDocument {
  return {
    _id: topicDocId(topic.slug),
    _type: "topic",
    name: topic.name,
    slug: { _type: "slug", current: topic.slug },
  };
}

/**
 * The transaction `apply-topics.ts` submits: one `createIfNotExists` per topic.
 *
 * `createIfNotExists` rather than `create` or `createOrReplace`, and the
 * difference is the whole point of the story:
 *
 *   - `create` fails the entire transaction the second time it runs, so the
 *     script would be a one-shot rather than something an operator can re-run
 *     after adding a topic.
 *   - `createOrReplace` succeeds every time and **overwrites the name an editor
 *     has since fixed in the Studio**. The taxonomy file is a proposal reviewed
 *     in a PR; the Studio is where the name is allowed to be corrected
 *     afterwards. A re-run must not undo that.
 *   - `createIfNotExists` is the only one that is both re-runnable and
 *     non-destructive: it writes the document when its `_id` is absent and is a
 *     no-op when it is present, whatever the present document says.
 *
 * That guarantee only holds because `topicDocId` is derived rather than
 * generated — see its own comment for what a regenerated id would break.
 *
 * The cost of choice 2 is the reason `studio/schemaTypes/topic.ts` carries
 * `rule.max(16)`: preserving editor renames means the committed file's name
 * ceiling cannot bind production on its own.
 *
 * Built here rather than inside the script so `bun test src/` can see it: the
 * PR gate runs `bun test src/`, and a mutation shape that lives under `scripts/`
 * is a mutation shape nothing checks.
 */
export function buildTopicMutations(topics: TopicEntry[]): { createIfNotExists: TopicDocument }[] {
  return topics.map((topic) => ({ createIfNotExists: topicDocument(topic) }));
}

/**
 * Transport, injectable so this runs with no network and no credential in tests
 * — the same shape and the same reason as `PublishDeps` in `publish.ts`.
 */
export interface TopicApplyDeps {
  getDocuments: (ids: string[]) => Promise<Record<string, unknown>[]>;
  mutate: (mutations: unknown[]) => Promise<unknown>;
}

export interface TopicApplyReport {
  mutations: { createIfNotExists: TopicDocument }[];
  /** Ids that existed **at the moment of the pre-read**. Reporting only. */
  presentAtPreRead: string[];
  /** Ids that were absent **at the moment of the pre-read**. Reporting only. */
  missingAtPreRead: string[];
  /** True when the pre-read failed. Deliberately not fatal — see below. */
  preReadFailed: boolean;
  preReadError?: string;
  /** 0 for a dry run, 1 for a real apply. There is never more than one. */
  transactionsSubmitted: number;
}

/**
 * Applies the taxonomy, or plans it.
 *
 * Lives here rather than inside `scripts/apply-topics.ts` because the PR gate
 * runs `bun test src/` and does not run `scripts/`. With the logic in the
 * script, replacing the entire `--apply` branch with a no-op would have left
 * every test and the dry run green — the branch that performs the irreversible
 * write was the one thing nothing covered.
 *
 * **The pre-read is reporting only, and is deliberately non-fatal.** Its whole
 * purpose is to let an operator see whether a run is a first seed or a no-op
 * re-run. A read failure is therefore not a reason to refuse a write that would
 * otherwise succeed, so it is caught and recorded rather than propagated.
 *
 * Its counts are named `presentAtPreRead` / `missingAtPreRead` rather than
 * "existed" / "created" on purpose: another writer can create or delete a topic
 * between the read and the mutation, so these are observations at a moment, not
 * an account of what this transaction did. `createIfNotExists` is atomic and
 * needs no such account — it does the right thing regardless of what the
 * pre-read saw, which is exactly why nothing branches on it.
 *
 * A `mutate` failure DOES propagate: that one is the write actually failing.
 */
export async function applyTopics(
  topics: TopicEntry[],
  options: { dryRun: boolean },
  deps: TopicApplyDeps,
): Promise<TopicApplyReport> {
  const mutations = buildTopicMutations(topics);
  const ids = mutations.map((mutation) => mutation.createIfNotExists._id);

  if (options.dryRun) {
    // No read and no write. A dry run must stay runnable with no credential at
    // all, which is what makes it usable for validating the file in CI.
    return {
      mutations,
      presentAtPreRead: [],
      missingAtPreRead: [],
      preReadFailed: false,
      transactionsSubmitted: 0,
    };
  }

  let presentAtPreRead: string[] = [];
  let preReadFailed = false;
  let preReadError: string | undefined;

  try {
    const documents = await deps.getDocuments(ids);
    const found = new Set(documents.map((doc) => String(doc._id)));
    presentAtPreRead = ids.filter((id) => found.has(id));
  } catch (error) {
    preReadFailed = true;
    preReadError = error instanceof Error ? error.message : String(error);
  }

  // One array, one transaction. The taxonomy is a vocabulary; a half-applied one
  // would leave the directory's facet silently incomplete, and the whole set
  // fits comfortably in a single mutation request.
  await deps.mutate(mutations);

  return {
    mutations,
    presentAtPreRead,
    missingAtPreRead: preReadFailed ? [] : ids.filter((id) => !presentAtPreRead.includes(id)),
    preReadFailed,
    preReadError,
    transactionsSubmitted: 1,
  };
}
