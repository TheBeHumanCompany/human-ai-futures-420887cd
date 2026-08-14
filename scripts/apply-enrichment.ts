/**
 * Writes the drafted guest bios and topic assignments in
 * `content/episode-enrichment.json` to Sanity as **drafts**.
 *
 * Run with:
 *   bun scripts/apply-enrichment.ts --dry-run   validates and plans, writes nothing
 *   bun scripts/apply-enrichment.ts --apply     the real production write
 *
 * Exactly one of `--dry-run` / `--apply` is required, following
 * `scripts/backfill.ts` and `scripts/apply-topics.ts`: this is deliberately not
 * "anything other than --dry-run is live", because a typo'd flag (`--dry-rnu`)
 * must land on a hard argument error rather than silently falling through to a
 * production write.
 *
 * **Nothing this script does is visible on the site.** Every mutation targets
 * `drafts.<id>`, and `src/lib/sanity/http.ts:47` pins `perspective: "published"`
 * on every read the site makes. A bio reaches a visitor only when a human opens
 * the Studio and presses Publish. That is AC-5.4's "never auto-published", and
 * it is structural rather than conventional: this file cannot publish, because
 * `src/lib/podcast/enrichment.ts` does not import the module that can, and
 * `enrichment.test.ts` asserts the import is absent.
 *
 * **Safe to re-run, with one exception stated precisely.** The per-episode
 * `createIfNotExists` never touches a draft that already exists, so every field
 * an editor has changed — title, excerpt, artwork, guest photo — survives
 * untouched however many times this runs.
 *
 * The `patch` that follows sets exactly two fields, and it DOES overwrite them:
 * `guestBio` and `topics`. So "an in-progress draft is never clobbered" is true
 * of the document but not of those two fields, and the narrower statement is
 * the honest one: **`content/episode-enrichment.json` is the source of truth for
 * `guestBio` and `topics` until the draft is published.**
 *
 * The practical rule that follows: correct a bio in the FILE, where it is
 * reviewed as a diff, not in the draft — an in-Studio edit to either field is
 * undone by the next run. Every other correction belongs in the Studio and is
 * safe there. (Deliberately not conflict-detection-and-abort: that would block
 * legitimate re-runs after a bio is corrected in the file, which is the exact
 * workflow this script exists to serve.)
 *
 * A deliberately thin shell. Every rule about what valid enrichment is — the
 * entity and number check, the length bounds, the taxonomy membership, the
 * per-episode coverage — lives in `src/lib/podcast/enrichment.ts` and is
 * exercised by `bun test src/`. The PR gate runs that suite and does not run
 * this file, so logic living here is logic the gate cannot see. This function
 * parses argv, validates, prints, and picks an exit code.
 *
 * `SANITY_WRITE_TOKEN` comes from `.env.local`, which Bun loads automatically
 * for a bare `bun scripts/apply-enrichment.ts` from the repo root.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  ENRICHMENT_RELATIVE_PATH,
  type EnrichmentApplyDeps,
  type EnrichmentSource,
  applyEnrichment,
  parseEnrichment,
  validateEnrichmentFile,
} from "../src/lib/podcast/enrichment";
import { TAXONOMY_RELATIVE_PATH, parseTaxonomy } from "../src/lib/podcast/topics";
import { createScriptTransport } from "./sanity-client";

const REPO_ROOT = path.join(import.meta.dirname, "..");
const ENRICHMENT_PATH = path.join(REPO_ROOT, ENRICHMENT_RELATIVE_PATH);
const TAXONOMY_PATH = path.join(REPO_ROOT, TAXONOMY_RELATIVE_PATH);
const SNAPSHOT_PATH = path.join(REPO_ROOT, "src/lib/podcast/catalogue.snapshot.json");

const USAGE = [
  "Usage:",
  "  bun scripts/apply-enrichment.ts --dry-run   validate the enrichment and plan the writes",
  "  bun scripts/apply-enrichment.ts --apply     write the bios and topics to Sanity DRAFTS",
].join("\n");

/** Prints a FATAL header, every collected error, and a closing line, then exits non-zero. */
function failWith(header: string, errors: string[], closing: string): never {
  console.error(`\nFATAL: ${header} (${errors.length} issue(s)):\n`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(`\n${closing}`);
  process.exit(1);
}

function parseInvocation(argv: string[]): { dryRun: boolean } {
  const args = argv.slice(2);
  const known = new Set(["--dry-run", "--apply"]);
  const unknown = args.filter((arg) => !known.has(arg));

  const fail = (message: string): never => {
    console.error(`FATAL: ${message}`);
    console.error(USAGE);
    process.exit(1);
  };

  if (unknown.length > 0) fail(`unrecognised argument(s): ${unknown.join(", ")}`);

  const hasDryRun = args.includes("--dry-run");
  const hasApply = args.includes("--apply");

  if (hasDryRun === hasApply) {
    fail(
      hasDryRun
        ? "--dry-run and --apply are mutually exclusive."
        : "pass exactly one of --dry-run or --apply.",
    );
  }

  return { dryRun: hasDryRun };
}

const readJson = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, "utf8"));

async function main() {
  const { dryRun } = parseInvocation(process.argv);
  console.log(
    dryRun
      ? "MODE: dry run (no writes)\n"
      : "MODE: LIVE WRITE to Sanity production — DRAFTS ONLY, nothing is published\n",
  );

  const { enrichment, errors: shapeErrors } = parseEnrichment(await readJson(ENRICHMENT_PATH));
  if (!enrichment) {
    failWith(
      `${ENRICHMENT_RELATIVE_PATH} failed shape validation`,
      shapeErrors,
      "Nothing was written. Fix the file before re-running.",
    );
  }

  const { taxonomy, errors: taxonomyErrors } = parseTaxonomy(await readJson(TAXONOMY_PATH));
  if (!taxonomy) {
    failWith(
      `${TAXONOMY_RELATIVE_PATH} failed shape validation`,
      taxonomyErrors,
      "The enrichment's topics are validated against the taxonomy, so nothing was written.",
    );
  }

  const snapshot = (await readJson(SNAPSHOT_PATH)) as { episodes: EnrichmentSource[] };
  const sources: EnrichmentSource[] = snapshot.episodes.map((entry) => ({
    guid: entry.guid,
    title: entry.title,
    description: entry.description,
  }));

  // The whole file is validated before a single mutation is planned. A partial
  // apply would leave the archive in a state a re-run cannot distinguish from a
  // fresh one — and unlike the taxonomy, these strings are about real people.
  const { errors, entries } = validateEnrichmentFile(
    enrichment,
    sources,
    taxonomy.topics.map((topic) => topic.slug),
  );
  if (errors.length > 0) {
    failWith(
      `${ENRICHMENT_RELATIVE_PATH} failed enrichment validation`,
      errors,
      "Nothing was written. Fix the file before re-running.",
    );
  }

  console.log(
    `Loaded ${enrichment.episodes.length} enrichment entries, checked against ` +
      `${sources.length} snapshot episodes and ${taxonomy.topics.length} topics.`,
  );
  console.log(
    "Every bio is entities-and-numbers: clean against its OWN episode's title and description.",
  );
  console.log(
    "That is NOT the same as verified. Stated precisely: no bio contains a\n" +
      "capitalisation-bearing token, or a numeric literal, that its own episode's title or\n" +
      'description does not also contain. An all-lower-case invented name ("paypal") is NOT\n' +
      "caught, and neither is a real number attached to the wrong thing. Whether the claims\n" +
      "are TRUE is a human judgement, made in the Studio before pressing Publish.\n",
  );

  // The sign-off list. Printed per episode rather than as a total, because the
  // point of extracting claim verbs is that a human reads each relational claim
  // one at a time (pre-mortem #3) — a count of 17 tells a reviewer nothing.
  const withClaims = entries.filter((entry) => entry.report.claimVerbs.length > 0);
  console.log(
    `RELATIONAL CLAIMS NEEDING SIGN-OFF — ${withClaims.length} of ${entries.length} episodes:`,
  );
  for (const entry of withClaims) {
    console.log(`\n  Episode ${entry.episodeNumber ?? "?"}:`);
    for (const claim of entry.report.claimVerbs) {
      console.log(`    [${claim.verb}] ${claim.sentence}`);
    }
  }
  console.log("");

  // Roles get their own section rather than being folded into the list above.
  // Nearly every bio asserts one, so mixing them in would bury the verb claims —
  // but leaving them out entirely (the first attempt) dropped the single class
  // of claim most likely to upset a guest. founder vs co-founder is invisible to
  // the entity check: both words are lower case, so a wrong one is fully sourced.
  const withRoles = entries.filter((entry) => entry.report.roleClaims.length > 0);
  console.log(
    `ROLE CLAIMS NEEDING SIGN-OFF — ${withRoles.length} of ${entries.length} episodes.\n` +
      "Check each against the episode's own description: founder vs co-founder vs CEO is\n" +
      "a distinction the validator cannot see, because every word in it is lower case.",
  );
  for (const entry of withRoles) {
    const roles = entry.report.roleClaims.map((claim) => claim.verb).join(", ");
    console.log(`  Episode ${String(entry.episodeNumber ?? "?").padStart(2)}: ${roles}`);
  }
  console.log("");

  const deps: EnrichmentApplyDeps = dryRun
    ? {
        getDocuments: async () => {
          throw new Error("unreachable: a dry run performs no read");
        },
        mutate: async () => {
          throw new Error("unreachable: a dry run performs no write");
        },
      }
    : createScriptTransport();

  if (!dryRun && !process.env.SANITY_WRITE_TOKEN) {
    console.error("FATAL: SANITY_WRITE_TOKEN is not set. Nothing was written.");
    process.exit(1);
  }

  const report = await applyEnrichment(enrichment.episodes, { dryRun }, deps);

  if (dryRun) {
    console.log("Planned transaction — createIfNotExists then patch, per episode:");
    console.log(JSON.stringify(report.mutations, null, 2));
    console.log("\n" + "=".repeat(72));
    console.log("DRY RUN SUMMARY");
    console.log(`  episodes:            ${enrichment.episodes.length}`);
    console.log(`  mutations planned:   ${report.mutations.length}  (two per episode)`);
    console.log("  real network writes: 0");
    console.log(
      "\n  A dry run performs no read, so each createIfNotExists above shows the draft\n" +
        "  id and a placeholder where the PUBLISHED document's fields go — the live run\n" +
        "  copies the real document. The patch payloads are exact.",
    );
    return;
  }

  // Refused, not partially applied. `podcast:enrich` must never exit 0 having
  // enriched 34 of 39 episodes — the five left at `guestBio: null` would be
  // exactly the ones nobody thinks to check.
  if (report.refusedForSkips) {
    const skipped = report.entries.filter((entry) => entry.skippedReason !== undefined);
    failWith(
      "the dataset does not contain every episode this file enriches",
      skipped.map((entry) => `episode ${entry.episodeNumber ?? "?"}: ${entry.skippedReason}`),
      "NOTHING was written — not even for the episodes that do exist.\n" +
        "Every entry in the file matched the snapshot, so this means the dataset has\n" +
        "diverged from it: a document was deleted, or the snapshot is stale. Re-run\n" +
        "`bun run podcast:snapshot`, or restore the missing episodes, then try again.",
    );
  }

  // Reaching here means every episode was covered — a skip would have exited
  // above — so `drafts enriched` is the whole file by construction rather than
  // by coincidence, and there is no "skipped" line left to print.
  console.log("=".repeat(72));
  console.log("LIVE RUN SUMMARY");
  console.log(`  episodes in the file:  ${enrichment.episodes.length}`);
  console.log(
    `  drafts enriched:       ${report.applied}  (all of them, or this run would have refused)`,
  );
  console.log(`  mutations submitted:   ${report.mutations.length}`);
  console.log(`  transactions:          ${report.transactionsSubmitted}`);
  console.log(`  episodes published:    0 — this script cannot publish`);
  console.log("\nNext: open the Studio, review each draft against the diff, and press Publish.");
}

main();
