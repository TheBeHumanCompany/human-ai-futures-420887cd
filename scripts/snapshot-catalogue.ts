/**
 * Writes `src/lib/podcast/catalogue.snapshot.json` — the durable floor under
 * every read surface (Decision E, layer 1).
 *
 * This file is committed on purpose. It is a full render-capable projection of
 * the catalogue, bundled into the server function, present on every cold
 * instance in every region with no network call and no eviction. When Sanity is
 * unreachable, this is what still renders a shared episode link instead of a
 * 404 — and a 404 on a link someone already posted is the one failure this
 * project exists to prevent.
 *
 * It is NOT generated during `vite build`. Doing that would make every build —
 * including the ones Lovable triggers — depend on Sanity being up, which
 * inverts the guarantee: the artifact that exists to survive an outage would
 * become impossible to produce during one.
 *
 * SOURCE, AND THE HANDOVER. Today this reads the PodBean feed, because the
 * Sanity project is not provisioned yet (plan Step 0a) and the backfill has not
 * run. That makes it the *seed* input as well as the fallback. Until then every
 * enrichment field below is necessarily null — enrichment only exists in Sanity
 * — and `isEnriched` is correspondingly false for all 39.
 *
 * Once Step 6's backfill lands, authority hands over and the feed stops being a
 * snapshot source: from that point the snapshot must be re-harvested from
 * Sanity, or it will silently overwrite real enrichment with nulls on the next
 * run. **The script that does that (`scripts/sync-slugs.ts`, plan Step 12) does
 * not exist yet** — it is out of this change's scope. Whoever runs the backfill
 * owns building it, and `source: "feed"` in the emitted file is the marker that
 * tells you the handover has not happened.
 *
 * Run with: bun run podcast:snapshot
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { clearEpisodeCache, loadEpisodes } from "../src/lib/podbean/feed";
import type { SlugProposal } from "../src/lib/podcast/sync";

/**
 * One episode, in the shape the degraded read path renders from.
 *
 * The enrichment fields are present-but-null rather than omitted. A stable key
 * set means the Sanity re-harvest fills values in place instead of changing the
 * shape, so the diff at handover is data and not structure — and a consumer
 * reading `entry.guestBio` gets `null` rather than `undefined` whichever source
 * produced the file.
 */
interface CatalogueEntry {
  guid: string;
  _id: string;
  slug: string;
  episodeNumber: number | null;
  title: string;
  description: string;
  excerpt: string;
  guestName: string | null;
  guestBio: string | null;
  guestPhotoRef: string | null;
  coverArtworkRef: string | null;
  topics: string[];
  podbeanUrl: string;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
  isEnriched: boolean;
}

interface CatalogueSnapshot {
  /**
   * When the contents were harvested — not when the file was written to disk.
   *
   * Stored rather than inferred from the file's git mtime, which reports when
   * the working copy was checked out and would read as "fresh" on every clone.
   * The plan's `podcast:report` age counter is meant to consume this; that
   * command is not built yet (it is out of this change's scope), so for now the
   * field is read by `snapshot.test.ts` and by whoever is looking at the file.
   */
  snapshotAt: string;
  source: "feed" | "sanity";
  episodes: CatalogueEntry[];
}

/** The documented trip-wire from Decision E, asserted here and in snapshot.test.ts. */
const MAX_SERIALIZED_BYTES = 1_000_000;

/**
 * Refuses to replace a snapshot that holds something this run cannot reproduce.
 *
 * The destructive case is quiet and one keystroke away: run this after the
 * backfill and it rebuilds from the feed, which has no guest bios, no photos and
 * no topics. Every enrichment field goes back to null, `isEnriched` goes to
 * false for all 39, and the file still looks perfectly well-formed. The next
 * outage then serves a catalogue that says nothing is enriched — every episode
 * page `noindex`, every episode dropped from the sitemap — from a commit whose
 * diff is 39 plausible-looking null assignments.
 *
 * So the check is on the OUTGOING file, not on operator intent. Two independent
 * signals, either one sufficient, because they fail in different ways: `source`
 * records where the data came from and is the honest marker once a re-harvest
 * exists, while the enrichment scan catches a file whose `source` was never
 * updated. `--force` is the deliberate override, and it prints what it is
 * discarding rather than just proceeding.
 */
function guardExistingSnapshot(existing: CatalogueSnapshot, force: boolean): void {
  const enriched = existing.episodes.filter(
    (entry) =>
      entry.isEnriched ||
      entry.guestBio !== null ||
      entry.guestPhotoRef !== null ||
      entry.coverArtworkRef !== null ||
      entry.topics.length > 0,
  );

  const fromSanity = existing.source === "sanity";
  if (!fromSanity && enriched.length === 0) return;

  const reasons = [
    fromSanity ? `was harvested from Sanity, not from the feed` : null,
    enriched.length > 0
      ? `carries enrichment on ${enriched.length} of its ${existing.episodes.length} episodes`
      : null,
  ].filter((reason): reason is string => reason !== null);

  if (force) {
    console.warn(`\n!! OVERWRITING a snapshot that ${reasons.join(", and ")}.`);
    console.warn("!! --force given; the enrichment below is being replaced with nulls:");
    for (const entry of enriched.slice(0, 10)) console.warn(`!!   ${entry.slug}`);
    if (enriched.length > 10) console.warn(`!!   ... and ${enriched.length - 10} more`);
    console.warn("");
    return;
  }

  console.error(`\nSNAPSHOT REFUSED — the existing file ${reasons.join(", and ")}.`);
  console.error("");
  console.error("This script rebuilds from the PodBean feed, which carries no guest bios,");
  console.error("photos or topics. Rebuilding now would overwrite real enrichment with nulls,");
  console.error("and the degraded read path would then report every episode as un-enriched:");
  console.error("noindex on every episode page, and an empty sitemap.");
  console.error("");
  console.error("Once the backfill has run, the snapshot must be re-harvested from Sanity");
  console.error("(plan Step 12) rather than regenerated from the feed. If you genuinely mean");
  console.error("to discard what is there, re-run with --force.");
  process.exit(1);
}

async function main() {
  const root = path.join(import.meta.dirname, "..");
  const slugsPath = path.join(root, "src/lib/podcast/slugs.snapshot.json");
  const outPath = path.join(root, "src/lib/podcast/catalogue.snapshot.json");

  const force = process.argv.slice(2).includes("--force");

  // Read-before-write. An absent file is the normal first run, not an error.
  const existing = await readFile(outPath, "utf8").then(
    (raw) => JSON.parse(raw) as CatalogueSnapshot,
    () => undefined,
  );
  if (existing !== undefined) guardExistingSnapshot(existing, force);

  const proposals: SlugProposal[] = JSON.parse(await readFile(slugsPath, "utf8"));
  const bySlugGuid = new Map(proposals.map((proposal) => [proposal.guid, proposal]));

  clearEpisodeCache();
  const episodes = await loadEpisodes();

  const missing: string[] = [];
  const entries: CatalogueEntry[] = [];

  for (const episode of episodes) {
    const proposal = bySlugGuid.get(episode.guid);
    if (proposal === undefined) {
      // Refused rather than skipped. An episode with no reviewed slug has no
      // permanent URL, and silently dropping it from the fallback would mean
      // the degraded path 404s exactly one episode with no signal anywhere.
      missing.push(episode.guid);
      continue;
    }

    entries.push({
      guid: episode.guid,
      _id: proposal._id,
      slug: proposal.slug,
      episodeNumber: episode.episodeNumber ?? null,
      title: episode.title,
      description: episode.description,
      excerpt: episode.excerpt,
      guestName: episode.guest ?? null,
      guestBio: null,
      guestPhotoRef: null,
      coverArtworkRef: null,
      topics: [],
      podbeanUrl: episode.podbeanUrl,
      audioUrl: episode.audioUrl,
      durationSeconds: episode.durationSeconds,
      publishedAt: episode.pubDate,
      isEnriched: false,
    });
  }

  const orphanProposals = proposals
    .filter((proposal) => !episodes.some((episode) => episode.guid === proposal.guid))
    .map((proposal) => proposal.guid);

  if (missing.length > 0 || orphanProposals.length > 0) {
    const parts: string[] = [];
    if (missing.length > 0)
      parts.push(`episode guid(s) with no slug proposal: ${missing.join(", ")}`);
    if (orphanProposals.length > 0) {
      parts.push(`slug proposal guid(s) with no episode: ${orphanProposals.join(", ")}`);
    }
    console.error(`\nSNAPSHOT REFUSED — ${parts.join("; ")}`);
    console.error("Re-run `bun run slugs:propose` and review the diff before retrying.");
    process.exit(1);
  }

  // Sorted by slug for the same reason the slug snapshot is: a re-run against
  // an unchanged catalogue must produce a byte-identical file, or the nightly
  // parity check reports drift that is really just ordering.
  entries.sort((a, b) => a.slug.localeCompare(b.slug));

  const snapshot: CatalogueSnapshot = {
    snapshotAt: new Date().toISOString(),
    source: "feed",
    episodes: entries,
  };

  const serialized = JSON.stringify(snapshot, null, 2) + "\n";
  const bytes = new TextEncoder().encode(serialized).length;

  await writeFile(outPath, serialized);

  console.log(`Wrote ${entries.length} episodes to ${outPath}`);
  console.log(`  snapshotAt:  ${snapshot.snapshotAt}`);
  console.log(`  source:      ${snapshot.source}`);
  console.log(
    `  size:        ${(bytes / 1024).toFixed(1)} kB of a ${MAX_SERIALIZED_BYTES / 1000} kB budget`,
  );

  if (bytes >= MAX_SERIALIZED_BYTES) {
    // Not a warning. Decision E bounds this artifact deliberately: it is
    // bundled into the server function, so unbounded growth is a deploy-size
    // problem long before it is a correctness one. Crossing this line is the
    // documented signal to move the fallback to Blob/KV, not to raise the cap.
    console.error(
      `\nSIZE TRIP-WIRE — snapshot is ${bytes} bytes, at or over the ${MAX_SERIALIZED_BYTES} budget.`,
    );
    console.error("Decision E: move the fallback to Blob/KV rather than raising this limit.");
    process.exit(1);
  }
}

main();
