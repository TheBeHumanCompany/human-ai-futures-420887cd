/**
 * Proposes a permanent slug + Sanity `_id` for every live episode and writes
 * them to `src/lib/podcast/slugs.snapshot.json` for human review before any
 * document is ever written to Sanity.
 *
 * Pure feed-read + already-approved pure functions only: no Sanity import,
 * no Sanity call, no credential of any kind.
 *
 * Run with: bun scripts/propose-slugs.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { clearEpisodeCache, loadEpisodes } from "../src/lib/podbean/feed";
import { episodeDocId } from "../src/lib/podcast/doc-id";
import { makeEpisodeSlug } from "../src/lib/podcast/slug";

interface SlugProposal {
  guid: string;
  _id: string;
  slug: string;
}

async function main() {
  clearEpisodeCache();
  const episodes = await loadEpisodes();

  // `loadEpisodes` returns newest-first (see its own doc comment). Re-sort to
  // oldest-first here: slug assignment is a permanent identity, and walking
  // oldest-first makes that assignment reproducible independent of when new
  // episodes get added at the feed's newest end. Newest-first would mean a
  // brand-new episode landing at the top of the feed could "steal" the
  // unsuffixed slug from an existing older episode on a collision — the wrong
  // direction for something meant to stay stable once assigned.
  const oldestFirst = [...episodes].sort(
    (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime(),
  );

  const existingSlugsSoFar = new Set<string>();
  const proposals: SlugProposal[] = oldestFirst.map((episode) => {
    const slug = makeEpisodeSlug(episode.title, episode.episodeNumber, existingSlugsSoFar);
    existingSlugsSoFar.add(slug);
    return { guid: episode.guid, _id: episodeDocId(episode.guid), slug };
  });

  // Sorted alphabetically by slug (not processing order) so re-running the
  // script against an unchanged feed produces a stable, readable diff.
  const sorted = [...proposals].sort((a, b) => a.slug.localeCompare(b.slug));

  const outPath = path.join(import.meta.dirname, "..", "src/lib/podcast/slugs.snapshot.json");
  await writeFile(outPath, JSON.stringify(sorted, null, 2) + "\n");

  const slugs = sorted.map((p) => p.slug);
  const checks = {
    distinct: new Set(slugs).size === slugs.length,
    nonEmpty: slugs.every((s) => s.length > 0),
    withinLength: slugs.every((s) => s.length <= 60),
    validChars: slugs.every((s) => /^[a-z0-9-]+$/.test(s)),
  };

  const truncatedGuid = (guid: string) => `${guid.slice(0, 20)}...`;
  const guidColumnWidth = Math.max(...sorted.map((p) => truncatedGuid(p.guid).length));

  console.log(`Proposed slugs for ${sorted.length} episodes:\n`);
  for (const p of sorted) {
    console.log(`${truncatedGuid(p.guid).padEnd(guidColumnWidth)}  ${p.slug}`);
  }

  console.log(`\nWrote ${sorted.length} entries to ${outPath}\n`);
  console.log("Validation:");
  console.log(`  distinct slugs:            ${checks.distinct}`);
  console.log(`  all non-empty:             ${checks.nonEmpty}`);
  console.log(`  all <= 60 chars:           ${checks.withinLength}`);
  console.log(`  all match /^[a-z0-9-]+$/:  ${checks.validChars}`);

  if (!Object.values(checks).every(Boolean)) {
    console.error("\nVALIDATION FAILED — see above.");
    process.exit(1);
  }
}

main();
