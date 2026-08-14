/**
 * Publishes episode drafts — the scripted equivalent of pressing Publish in the
 * Studio, once per episode.
 *
 *   bun scripts/publish-drafts.ts --dry-run    show what each draft would change
 *   bun scripts/publish-drafts.ts --apply      publish them
 *
 * Exactly one of `--dry-run` / `--apply`, following the other write scripts.
 *
 * THIS ONE IS DIFFERENT FROM ITS SIBLINGS AND THE DIFFERENCE IS THE POINT.
 * `apply-enrichment.ts` and `apply-guest-links.ts` cannot publish, structurally.
 * This script does nothing else. Everything it touches becomes publicly visible
 * on the live site the moment the transaction lands, so it reads like a review
 * tool first and a writer second: the dry run prints a per-episode field diff,
 * and the live run reports what each publish actually did.
 *
 * It routes every document through `publishEpisode()` rather than emitting
 * `createOrReplace` itself. That function is the single place the publish rules
 * live, and three of them matter here:
 *
 *   - `shareCard` and `shareCardKey` are carried forward FROM THE PUBLISHED
 *     document, so a draft created before those cards were generated cannot
 *     erase them. This is the hazard that makes a bulk publish worth being
 *     careful about, and it is already closed.
 *   - A frozen slug is immutable. An episode whose URL has been shared emits
 *     nothing at all rather than moving.
 *   - An unchanged document emits nothing, so re-running is free and a
 *     "published: 0, unchanged: 39" result is success, not failure.
 *
 * The draft is deleted in the same transaction as the publish it belongs to.
 * Splitting them would leave a published episode with a stale draft still
 * shadowing it in the Studio.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { episodeDocId } from "../src/lib/podcast/doc-id";
import { publishEpisode, strip, type PublishResult } from "../src/lib/sanity/publish";
import { createScriptTransport } from "./sanity-client";

interface EnrichmentEntry {
  guid: string;
  episodeNumber: number | null;
}

const ROOT = path.join(import.meta.dirname, "..");

/** Fields worth naming in a diff. Everything else is machinery. */
const REPORTED_FIELDS = [
  "title",
  "guestName",
  "guestBio",
  "guestRole",
  "guestLinks",
  "guestPhoto",
  "topics",
  "excerpt",
  "coverArtwork",
  "shareCard",
] as const;

function usage(): never {
  console.error(
    "usage:\n" +
      "  bun scripts/publish-drafts.ts --dry-run   show the per-episode diff, publish nothing\n" +
      "  bun scripts/publish-drafts.ts --apply     PUBLISH every draft to the live site",
  );
  process.exit(2);
}

function parseInvocation(argv: string[]): { dryRun: boolean } {
  const args = argv.slice(2);
  const known = new Set(["--dry-run", "--apply"]);
  const unknown = args.filter((arg) => !known.has(arg));
  if (unknown.length > 0) {
    console.error(`unknown argument: ${unknown.join(", ")}`);
    usage();
  }

  const hasDryRun = args.includes("--dry-run");
  const hasApply = args.includes("--apply");
  if (hasDryRun === hasApply) {
    console.error(
      hasDryRun
        ? "--dry-run and --apply are mutually exclusive."
        : "pass exactly one of --dry-run or --apply.",
    );
    usage();
  }

  return { dryRun: hasDryRun };
}

function describe(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "string") {
    const collapsed = value.replace(/\s+/g, " ").trim();
    return collapsed.length > 60 ? `${collapsed.slice(0, 57)}…` : collapsed;
  }
  if (typeof value === "object") return "set";
  return String(value);
}

/** Which reported fields differ between the draft and what is live today. */
function changedFields(
  draft: Record<string, unknown>,
  published: Record<string, unknown> | undefined,
): { field: string; before: string; after: string }[] {
  return REPORTED_FIELDS.flatMap((field) => {
    const before = published?.[field];
    const after = draft[field];
    if (JSON.stringify(strip(before)) === JSON.stringify(strip(after))) return [];
    return [{ field, before: describe(before), after: describe(after) }];
  });
}

async function main(): Promise<void> {
  const { dryRun } = parseInvocation(process.argv);
  console.log(
    dryRun
      ? "MODE: DRY RUN — nothing is published\n"
      : "MODE: LIVE PUBLISH — every change below becomes publicly visible\n",
  );

  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error(
      "FATAL: SANITY_WRITE_TOKEN is not set. Reading drafts requires it even for a dry run.",
    );
    process.exit(1);
  }

  const enrichment = JSON.parse(
    await readFile(path.join(ROOT, "content/episode-enrichment.json"), "utf8"),
  ) as { episodes: EnrichmentEntry[] };

  const transport = createScriptTransport();

  const ids = enrichment.episodes.flatMap((entry) => {
    const publishedId = episodeDocId(entry.guid);
    return [`drafts.${publishedId}`, publishedId];
  });

  const documents = await transport.getDocuments(ids);
  const byId = new Map<string, Record<string, unknown>>();
  for (const doc of documents) {
    if (doc) byId.set(doc._id as string, doc as Record<string, unknown>);
  }

  const pending = enrichment.episodes
    .map((entry) => {
      const publishedId = episodeDocId(entry.guid);
      return {
        episodeNumber: entry.episodeNumber,
        publishedId,
        draftId: `drafts.${publishedId}`,
        draft: byId.get(`drafts.${publishedId}`),
        published: byId.get(publishedId),
      };
    })
    .filter((item) => item.draft !== undefined)
    .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0));

  if (pending.length === 0) {
    console.log("No drafts found. Nothing to publish.");
    return;
  }

  console.log(`Drafts found: ${pending.length}\n`);

  for (const item of pending) {
    const changes = changedFields(item.draft!, item.published);
    const label = `Episode ${String(item.episodeNumber ?? "?").padStart(2)}`;
    if (changes.length === 0) {
      console.log(`${label}: no change`);
      continue;
    }
    console.log(`${label}:`);
    for (const change of changes) {
      console.log(`    ${change.field.padEnd(12)} ${change.before}  ->  ${change.after}`);
    }
  }

  if (dryRun) {
    const changing = pending.filter(
      (item) => changedFields(item.draft!, item.published).length > 0,
    );
    console.log("\n" + "=".repeat(72));
    console.log("DRY RUN SUMMARY");
    console.log(`  drafts found:        ${pending.length}`);
    console.log(`  would change:        ${changing.length}`);
    console.log(`  would be unchanged:  ${pending.length - changing.length}`);
    console.log("  published:           0");
    console.log(
      "\n  shareCard and shareCardKey are carried forward from the PUBLISHED\n" +
        "  document by publishEpisode(), so a draft made before the cards were\n" +
        "  generated cannot erase them.",
    );
    return;
  }

  const results: {
    episodeNumber: number | null;
    outcome: PublishResult["outcome"] | "failed";
    error?: string;
  }[] = [];

  for (const item of pending) {
    const draft = item.draft!;
    const slug = (draft.slug as { current?: string } | undefined)?.current;
    if (!slug) {
      results.push({
        episodeNumber: item.episodeNumber,
        outcome: "failed",
        error: "draft has no slug",
      });
      continue;
    }

    // The published id, not the draft id: this is the document being written.
    // The draft's own revision and timestamps are dropped — carrying a draft's
    // `_rev` onto a published write is how an ordinary publish turns into a
    // spurious conflict.
    const { _rev, _createdAt, _updatedAt, ...body } = draft;
    void _rev;
    void _createdAt;
    void _updatedAt;
    const episodeDoc: Record<string, unknown> = { ...body, _id: item.publishedId };

    try {
      const result = await publishEpisode(
        { episodeDoc, slug, mode: "author", deleteDraftId: item.draftId },
        transport,
      );
      results.push({ episodeNumber: item.episodeNumber, outcome: result.outcome });
    } catch (error) {
      results.push({
        episodeNumber: item.episodeNumber,
        outcome: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const counts = {
    created: results.filter((r) => r.outcome === "created").length,
    replaced: results.filter((r) => r.outcome === "replaced").length,
    unchanged: results.filter((r) => r.outcome === "unchanged").length,
    failed: results.filter((r) => r.outcome === "failed").length,
  };

  console.log("\n" + "=".repeat(72));
  console.log("LIVE PUBLISH SUMMARY");
  console.log(`  created:    ${counts.created}`);
  console.log(`  replaced:   ${counts.replaced}`);
  console.log(`  unchanged:  ${counts.unchanged}  (already identical — nothing was sent)`);
  console.log(`  failed:     ${counts.failed}`);

  if (counts.failed > 0) {
    console.log("\nFailures:");
    for (const result of results.filter((r) => r.outcome === "failed")) {
      console.log(`  Episode ${result.episodeNumber}: ${result.error}`);
    }
    // A partial publish is a real outcome, not a crash: the episodes that
    // succeeded are live and correct. Exit non-zero so CI or a caller notices,
    // but report the split rather than pretending the whole run failed.
    process.exit(1);
  }
}

await main();
