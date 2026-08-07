/**
 * Generates a 1200×630 share card for every published episode, uploads it to
 * Sanity, and records the content key it was generated from.
 *
 * Run with:
 *   bun run podcast:share-cards --dry-run   render everything, upload nothing
 *   bun run podcast:share-cards --apply     upload and patch
 *   bun run podcast:share-cards --apply --force   regenerate even unchanged cards
 *
 * **Why a script and not a publish-time action.** Rasterizing needs a font and
 * a native rasterizer, and neither belongs in the deployed function — the
 * `og:image` a crawler fetches is then a plain CDN URL rather than a cold
 * serverless render on the one request that matters.
 *
 * **Its cost, stated rather than hidden.** An episode published in Studio has
 * no card until someone runs this. That is a real gap and it is mitigated
 * rather than solved: `/og-default.png` means `og:image` always resolves, and
 * `shareCardKey` makes "which cards are stale?" a query that `podcast:report`
 * answers. Real `coverArtwork` outranks a generated card anyway, so uploading
 * artwork is always the better fix.
 */
import { createClient } from "@sanity/client";

import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "../src/lib/sanity/config";
import { buildShareCardModel, shareCardKey } from "../src/lib/podcast/share-card";
import { renderShareCard } from "./lib/share-card-render";

interface EpisodeRow {
  _id: string;
  title: string;
  guestName: string | null;
  episodeNumber: number | null;
  slug: { current: string } | null;
  shareCardKey: string | null;
}

const USAGE = [
  "Usage:",
  "  bun run podcast:share-cards --dry-run          render every card, upload nothing",
  "  bun run podcast:share-cards --apply            upload and patch changed cards",
  "  bun run podcast:share-cards --apply --force    regenerate even unchanged cards",
].join("\n");

function parseArgs(argv: string[]): { apply: boolean; force: boolean } {
  const args = argv.slice(2);
  const known = new Set(["--dry-run", "--apply", "--force"]);
  const unknown = args.filter((arg) => !known.has(arg));

  const fail = (message: string): never => {
    console.error(`FATAL: ${message}`);
    console.error(USAGE);
    process.exit(1);
  };

  if (unknown.length > 0) fail(`unrecognised argument(s): ${unknown.join(", ")}`);

  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  // Exactly one, deliberately. "Anything that is not --dry-run is live" is how
  // a typo becomes a production write.
  if (dryRun === apply) fail("pass exactly one of --dry-run or --apply.");

  return { apply, force: args.includes("--force") };
}

async function main() {
  const { apply, force } = parseArgs(process.argv);

  const token = process.env.SANITY_WRITE_TOKEN;
  if (apply && !token) {
    console.error("FATAL: SANITY_WRITE_TOKEN is required for --apply. Nothing was written.");
    process.exit(1);
  }

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  });

  const episodes = await client.fetch<EpisodeRow[]>(
    `*[_type == "episode" && defined(slug.current)] | order(episodeNumber asc){
      _id, title, guestName, episodeNumber, slug, shareCardKey
    }`,
  );

  console.log(`MODE: ${apply ? "apply" : "dry run"}${force ? " (--force)" : ""}`);
  console.log(`Found ${episodes.length} published episodes.\n`);

  let generated = 0;
  let skipped = 0;
  const failures: { slug: string; error: unknown }[] = [];

  for (const [index, episode] of episodes.entries()) {
    const slug = episode.slug?.current ?? episode._id;
    const position = `[${index + 1}/${episodes.length}]`;
    const key = shareCardKey(episode);

    // The key is what makes this idempotent AND makes staleness detectable.
    // Unchanged content is skipped rather than re-uploaded, so a re-run costs
    // nothing and does not churn asset ids.
    if (!force && episode.shareCardKey === key) {
      console.log(`${position} ${slug} — unchanged (${key}), skipped`);
      skipped += 1;
      continue;
    }

    try {
      const png = await renderShareCard(buildShareCardModel(episode));

      if (!apply) {
        console.log(`${position} ${slug} — rendered ${(png.length / 1024).toFixed(0)} kB (${key})`);
        generated += 1;
        continue;
      }

      const asset = await client.assets.upload("image", Buffer.from(png), {
        filename: `share-card-${slug}.png`,
        contentType: "image/png",
      });

      // Patched together: an asset without its key would look current on the
      // next run, and a key without its asset would claim a card that is not
      // there.
      await client
        .patch(episode._id)
        .set({
          shareCard: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
          shareCardKey: key,
        })
        .commit();

      console.log(`${position} ${slug} — uploaded ${asset._id} (${key})`);
      generated += 1;
    } catch (error) {
      console.error(
        `${position} ${slug} — FAILED: ${error instanceof Error ? error.message : error}`,
      );
      // Collected rather than thrown: one bad episode should not strand the
      // other thirty-eight, and the run reports every failure at the end.
      failures.push({ slug, error });
    }
  }

  console.log("\n========================================================================");
  console.log(apply ? "APPLY SUMMARY" : "DRY RUN SUMMARY");
  console.log(`  episodes:   ${episodes.length}`);
  console.log(`  generated:  ${generated}`);
  console.log(`  unchanged:  ${skipped}`);
  console.log(`  failed:     ${failures.length}`);
  if (!apply) console.log("  uploads:    0 (dry run)");

  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const failure of failures) console.error(`  ${failure.slug}`);
    process.exit(1);
  }
}

main();
