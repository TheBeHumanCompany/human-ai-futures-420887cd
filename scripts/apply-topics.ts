/**
 * Creates one `topic` document per entry in `content/topic-taxonomy.json`, at a
 * deterministic `_id` of `topic-<slug>`.
 *
 * Run with:
 *   bun scripts/apply-topics.ts --dry-run   validates and plans, writes nothing
 *   bun scripts/apply-topics.ts --apply     the real production write
 *
 * Exactly one of `--dry-run` / `--apply` is required, following
 * `scripts/backfill.ts`: this is deliberately not "anything other than
 * --dry-run is live", because a typo'd flag (`--dry-rnu`) must land on a hard
 * argument error rather than silently falling through to a production write.
 *
 * **Safe to re-run, by construction.** Every mutation is a `createIfNotExists`
 * (built by `buildTopicMutations` in `src/lib/podcast/topics.ts`, where the PR
 * gate can see it), so a second run against an applied dataset is a no-op and a
 * name an editor has since corrected in the Studio is never clobbered. Run it
 * again after adding a topic to the file; only the new one is written.
 *
 * A deliberately thin shell. Every rule about what a valid taxonomy is —
 * the size band, the 16-character name ceiling, slug well-formedness,
 * id injectivity — lives in `src/lib/podcast/topics.ts` and is exercised by
 * `bun test src/`. The PR gate runs that suite and does not run this file, so
 * logic living here is logic the gate cannot see. This function parses argv,
 * validates, prints, and picks an exit code.
 *
 * `SANITY_WRITE_TOKEN` comes from `.env.local`, which Bun loads automatically
 * for a bare `bun scripts/apply-topics.ts` from the repo root.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  TAXONOMY_RELATIVE_PATH,
  type TopicApplyDeps,
  applyTopics,
  parseTaxonomy,
  topicDocId,
  validateTaxonomy,
} from "../src/lib/podcast/topics";
import { createScriptTransport } from "./sanity-client";

const TAXONOMY_PATH = path.join(import.meta.dirname, "..", TAXONOMY_RELATIVE_PATH);

const USAGE = [
  "Usage:",
  "  bun scripts/apply-topics.ts --dry-run   validate the taxonomy and plan the writes",
  "  bun scripts/apply-topics.ts --apply     create the topic documents in Sanity",
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

async function main() {
  const { dryRun } = parseInvocation(process.argv);
  console.log(dryRun ? "MODE: dry run (no writes)\n" : "MODE: LIVE WRITE to Sanity production\n");

  const raw: unknown = JSON.parse(await readFile(TAXONOMY_PATH, "utf8"));

  // Shape first, then values — `JSON.parse` returns `any` and a hand-edited
  // file with a numeric `name` would pass every value-level rule below
  // (`(123).length` is `undefined`, which is neither `> 16` nor `=== 0`) and
  // only fail inside the mutation itself.
  const { taxonomy, errors: shapeErrors } = parseTaxonomy(raw);
  if (!taxonomy) {
    failWith(
      `${TAXONOMY_RELATIVE_PATH} failed shape validation`,
      shapeErrors,
      "Nothing was written. Fix the file before re-running.",
    );
  }

  const ruleErrors = validateTaxonomy(taxonomy.topics);
  if (ruleErrors.length > 0) {
    failWith(
      `${TAXONOMY_RELATIVE_PATH} failed taxonomy validation`,
      ruleErrors,
      "Nothing was written. Fix the file before re-running.",
    );
  }

  console.log(`Loaded ${taxonomy.topics.length} topics from ${TAXONOMY_PATH}.`);
  console.log(
    "Taxonomy passed validation (size band, name ceiling, slug shape, id injectivity).\n",
  );

  const nameWidth = Math.max(...taxonomy.topics.map((topic) => topic.name.length));
  for (const topic of taxonomy.topics) {
    console.log(`  ${topic.name.padEnd(nameWidth)}  ${topicDocId(topic.slug)}`);
  }
  console.log("");

  // A dry run must stay runnable with no credential at all — that is what makes
  // it usable for validating the file in CI — so the transport is only built on
  // the live path. `applyTopics` never reads or writes in dry-run mode, so the
  // stub below is never called; it exists so the two paths share one call site.
  const deps: TopicApplyDeps = dryRun
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

  const report = await applyTopics(taxonomy.topics, { dryRun }, deps);

  if (dryRun) {
    console.log("Planned transaction:");
    console.log(JSON.stringify(report.mutations, null, 2));
    console.log("\n" + "=".repeat(72));
    console.log("DRY RUN SUMMARY");
    console.log(`  topics:              ${taxonomy.topics.length}`);
    console.log(`  mutations planned:   ${report.mutations.length}`);
    console.log("  real network writes: 0");
    return;
  }

  // Deliberately phrased as an observation at a moment, not as an account of
  // what the transaction did. Another writer can create or delete a topic
  // between the pre-read and the mutation; `createIfNotExists` is atomic and
  // decides per document regardless of what the read saw, which is why nothing
  // branches on it and why a failed read does not stop the write.
  if (report.preReadFailed) {
    console.log(`Pre-read failed (${report.preReadError}) — continuing.`);
    console.log("It is reporting only; the write below is unaffected.\n");
  } else {
    console.log(
      `Pre-read: ${report.presentAtPreRead.length} of ${taxonomy.topics.length} ` +
        `topic documents were present at that moment.`,
    );
    console.log(
      report.missingAtPreRead.length === 0
        ? "Nothing was missing — createIfNotExists will leave every document untouched.\n"
        : `Missing at pre-read: ${report.missingAtPreRead.join(", ")}\n`,
    );
  }

  console.log("=".repeat(72));
  console.log("LIVE RUN SUMMARY");
  console.log(`  topics:                ${taxonomy.topics.length}`);
  console.log(`  mutations submitted:   ${report.mutations.length}`);
  console.log(`  transactions:          ${report.transactionsSubmitted}`);
  console.log(`  present at pre-read:   ${report.presentAtPreRead.length}`);
  console.log(`  missing at pre-read:   ${report.missingAtPreRead.length}`);
}

main();
