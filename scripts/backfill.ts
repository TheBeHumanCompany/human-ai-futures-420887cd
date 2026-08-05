/**
 * Seeds every live PodBean episode into Sanity as a published `episode`
 * document with a permanently frozen slug, one `publishEpisode` transaction
 * per episode.
 *
 * Run with:
 *   bun scripts/backfill.ts --dry-run   plans everything, writes nothing
 *   bun scripts/backfill.ts --apply     the real production write
 *
 * Exactly one of `--dry-run` / `--apply` is required. This is deliberately
 * not "anything other than --dry-run is live": a typo'd flag (`--dry-rnu`)
 * must land on a hard argument error, never silently fall through to a
 * production write.
 *
 * `--dry-run` injects a transport that returns an empty dataset and swallows
 * the mutation instead of sending it, so `publishEpisode`'s real decision table
 * runs and its real planned mutations can be read before anyone authorises the
 * live run. It still fetches the real feed over the network.
 *
 * `SANITY_WRITE_TOKEN` comes from `.env.local`, which Bun loads automatically
 * for a bare `bun scripts/backfill.ts` from the repo root — verified, not
 * assumed. No explicit loader is needed here.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { clearEpisodeCache, loadEpisodes } from "../src/lib/podbean/feed";
import { episodeDocId } from "../src/lib/podcast/doc-id";
import { buildSeedDocuments, type SlugProposal } from "../src/lib/podcast/sync";
import {
  PublishConflictError,
  SlugImmutableError,
  SlugTakenError,
  publishEpisode,
  type PublishDeps,
} from "../src/lib/sanity/publish";

const SNAPSHOT_PATH = path.join(import.meta.dirname, "..", "src/lib/podcast/slugs.snapshot.json");

/** Prints a FATAL header, every collected error, and a closing line, then exits non-zero. */
function failWith(header: string, errors: string[], closing: string): never {
  console.error(`\nFATAL: ${header} (${errors.length} issue(s)):\n`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(`\n${closing}`);
  process.exit(1);
}

/**
 * `episodeDocId` maps a guid through a lossy character substitution, so two
 * distinct guids differing only in punctuation would land on one `_id` and the
 * second episode would silently overwrite — or be refused as — the first. This
 * is not expected to fire against the real catalogue; it exists so that if it
 * ever did, it would stop the run before a single document was written rather
 * than after twenty.
 */
function assertDocIdsInjective(episodes: { guid: string }[]): void {
  const guidsById = new Map<string, string[]>();
  for (const episode of episodes) {
    const id = episodeDocId(episode.guid);
    const bucket = guidsById.get(id);
    if (bucket) bucket.push(episode.guid);
    else guidsById.set(id, [episode.guid]);
  }

  if (guidsById.size === episodes.length) return;

  console.error(
    `\nFATAL: episodeDocId is not injective over this feed — ` +
      `${episodes.length} episodes collapsed to ${guidsById.size} document ids.\n`,
  );
  for (const [id, guids] of guidsById) {
    if (guids.length < 2) continue;
    console.error(`  ${id}`);
    for (const guid of guids) console.error(`    <- ${guid}`);
  }
  console.error("\nNothing was written. Resolve the collision before re-running.");
  process.exit(1);
}

/**
 * Parses argv into a mode. Anything other than exactly one of `--dry-run` /
 * `--apply` is a hard argument error before any network call: a live-write
 * script must never guess what an operator meant.
 */
function parseMode(argv: string[]): { dryRun: boolean } {
  const args = argv.slice(2);
  const hasDryRun = args.includes("--dry-run");
  const hasApply = args.includes("--apply");
  const unknown = args.filter((arg) => arg !== "--dry-run" && arg !== "--apply");

  if (unknown.length > 0) {
    console.error(`FATAL: unrecognised argument(s): ${unknown.join(", ")}`);
    console.error("Usage: bun scripts/backfill.ts --dry-run | --apply");
    process.exit(1);
  }
  if (hasDryRun === hasApply) {
    console.error(
      hasDryRun
        ? "FATAL: --dry-run and --apply are mutually exclusive."
        : "FATAL: pass exactly one of --dry-run or --apply.",
    );
    console.error("Usage: bun scripts/backfill.ts --dry-run | --apply");
    process.exit(1);
  }

  return { dryRun: hasDryRun };
}

/**
 * `JSON.parse` returns `unknown` typed as `SlugProposal[]` only by a type
 * assertion — nothing has actually checked that a `slug` is a string rather
 * than, say, a number that happens to stringify to something
 * regex-plausible. `/^[a-z0-9-]+$/.test(123)` coerces its argument to
 * `"123"` and passes; `(123).length` is `undefined`, which fails neither
 * `=== 0` nor `> 60`. A malformed snapshot would sail through the integrity
 * checks below and only fail, confusingly, deep inside `buildSeedDocuments`
 * or the Sanity mutation itself. This is the check that closes that gap:
 * every record's shape is proven — an object with string `guid`/`_id`/`slug`
 * — before any value-level check runs.
 */
function parseSnapshot(raw: unknown): SlugProposal[] {
  if (!Array.isArray(raw)) {
    console.error(`\nFATAL: slugs.snapshot.json is not an array (got ${typeof raw}).\n`);
    process.exit(1);
  }

  const errors: string[] = [];
  raw.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      errors.push(`entry ${index} is not an object (got ${typeof entry})`);
      return;
    }
    for (const key of ["guid", "_id", "slug"] as const) {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value !== "string" || value.length === 0) {
        errors.push(
          `entry ${index} has a non-string or empty "${key}" (got ${JSON.stringify(value)})`,
        );
      }
    }
  });

  if (errors.length > 0) {
    failWith(
      "slugs.snapshot.json failed shape validation",
      errors,
      "Nothing was written. Regenerate the snapshot before re-running.",
    );
  }

  return raw as SlugProposal[];
}

/**
 * The injectivity check (above) proves the live feed's guids don't collide
 * with each other, but every mutation is actually built from `proposal._id`
 * as loaded from the snapshot file, not a recomputed id — so a stale,
 * hand-edited, or otherwise corrupted snapshot could carry an `_id` that no
 * longer matches `episodeDocId(guid)` and this check would never see it.
 * This is the check that closes that gap: every proposal record is
 * re-validated against the live feed's own derivation before a single
 * mutation is built. Assumes `parseSnapshot` has already proven every field
 * used here is actually a string.
 */
function assertSnapshotIntegrity(proposals: SlugProposal[]): void {
  const errors: string[] = [];

  const checkUnique = (seen: Set<string>, value: string, label: string) => {
    if (seen.has(value)) errors.push(`duplicate ${label} in snapshot: ${value}`);
    seen.add(value);
  };
  const guids = new Set<string>();
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const proposal of proposals) {
    checkUnique(guids, proposal.guid, "guid");
    checkUnique(ids, proposal._id, "_id");
    checkUnique(slugs, proposal.slug, "slug");

    const expectedId = episodeDocId(proposal.guid);
    if (proposal._id !== expectedId) {
      errors.push(
        `snapshot _id does not match episodeDocId(guid) for ${proposal.guid}: ` +
          `snapshot says "${proposal._id}", recomputed "${expectedId}"`,
      );
    }

    if (
      !/^[a-z0-9-]+$/.test(proposal.slug) ||
      proposal.slug.length === 0 ||
      proposal.slug.length > 60
    ) {
      errors.push(`invalid slug in snapshot for ${proposal.guid}: "${proposal.slug}"`);
    }
  }

  if (errors.length === 0) return;

  failWith(
    "slugs.snapshot.json failed integrity validation",
    errors,
    "Nothing was written. Regenerate the snapshot or fix it by hand before re-running.",
  );
}

/**
 * Dry-run transport. `getDocuments` reports an empty dataset, which matches the
 * real current state of `production`, and `mutate` records the transaction
 * instead of sending it. `now` is left at its default so the `frozenAt` stamps
 * printed are the real ones a live run would submit.
 */
function dryRunDeps(): PublishDeps {
  return {
    getDocuments: async () => [],
    mutate: async () => ({ transactionId: "dry-run" }),
  };
}

interface Failure {
  slug: string;
  guid: string;
  error: unknown;
}

function describe(error: unknown): string {
  if (
    error instanceof SlugImmutableError ||
    error instanceof SlugTakenError ||
    error instanceof PublishConflictError
  ) {
    return `${error.name}: ${error.message}`;
  }
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

async function main() {
  const { dryRun } = parseMode(process.argv);

  console.log(dryRun ? "MODE: dry run (no writes)\n" : "MODE: LIVE WRITE to Sanity production\n");

  clearEpisodeCache();
  const episodes = await loadEpisodes();
  if (episodes.length === 0) {
    console.error("FATAL: the feed returned zero episodes. Nothing to do.");
    process.exit(1);
  }
  console.log(`Loaded ${episodes.length} episodes from the live feed.`);

  assertDocIdsInjective(episodes);
  console.log(`Document ids are injective over all ${episodes.length} guids.`);

  const rawSnapshot: unknown = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  const proposals = parseSnapshot(rawSnapshot);
  console.log(`Loaded ${proposals.length} slug proposals from ${SNAPSHOT_PATH}.`);

  assertSnapshotIntegrity(proposals);
  console.log(
    "Snapshot passed integrity validation (unique guid/_id/slug, _id matches episodeDocId(guid)).",
  );

  const seeds = buildSeedDocuments(episodes, proposals);
  console.log(`Built ${seeds.length} seed documents.\n`);

  // A live run of 39 sequential transactions should not discover a missing
  // token on episode 1 and leave the operator wondering what got through.
  if (!dryRun && !process.env.SANITY_WRITE_TOKEN) {
    console.error("FATAL: SANITY_WRITE_TOKEN is not set. Nothing was written.");
    process.exit(1);
  }

  // Design decision: one episode's failure does NOT abort the batch. A publish
  // is per-episode atomic on its own (lock + document in one transaction), so
  // there is no cross-episode invariant a partial run can break — while
  // stopping at the first failure would leave the remaining episodes in an
  // unknown state and force the operator to work out where the run got to.
  // Every failure is collected and reported in full at the end, and the process
  // exits non-zero so the failure cannot be mistaken for success.
  const deps = dryRun ? dryRunDeps() : {};
  const failures: Failure[] = [];
  let succeeded = 0;
  let totalMutations = 0;

  for (const [index, { episodeDoc, slug }] of seeds.entries()) {
    const position = `[${index + 1}/${seeds.length}]`;
    const guid = String(episodeDoc.guid);

    try {
      const result = await publishEpisode({ episodeDoc, slug, mode: "seed" }, deps);
      succeeded += 1;
      totalMutations += result.mutations.length;

      console.log(`${position} ${slug}`);
      console.log(`  guid:      ${guid}`);
      console.log(`  outcome:   ${result.outcome}`);
      console.log(`  mutations: ${result.mutations.length}`);
      console.log(indent(JSON.stringify(result.mutations, null, 2)));
      console.log("");
    } catch (error) {
      failures.push({ slug, guid, error });
      console.error(`${position} ${slug}  FAILED`);
      console.error(`  guid:  ${guid}`);
      console.error(`  error: ${describe(error)}`);
      console.error("");
    }
  }

  console.log("=".repeat(72));
  console.log(dryRun ? "DRY RUN SUMMARY" : "LIVE RUN SUMMARY");
  console.log(`  episodes attempted:  ${seeds.length}`);
  console.log(`  succeeded:           ${succeeded}`);
  console.log(`  failed:              ${failures.length}`);
  console.log(
    dryRun
      ? `  mutations planned:   ${totalMutations}`
      : `  mutations submitted: ${totalMutations}`,
  );
  if (dryRun) console.log("  real network writes: 0");

  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const failure of failures) {
      console.error(`  ${failure.slug}`);
      console.error(`    guid:  ${failure.guid}`);
      console.error(`    error: ${describe(failure.error)}`);
    }
    process.exit(1);
  }
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

main();
