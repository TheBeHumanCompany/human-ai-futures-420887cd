/**
 * Writes each episode's guest links into its Sanity DRAFT.
 *
 *   bun scripts/apply-guest-links.ts --dry-run    print the exact mutations
 *   bun scripts/apply-guest-links.ts --apply      the real production write
 *
 * Exactly one of `--dry-run` / `--apply` is required, following
 * `scripts/apply-enrichment.ts` — an unflagged invocation that guesses would
 * eventually guess "apply".
 *
 * THIS SCRIPT CANNOT PUBLISH, structurally rather than by convention. Every
 * mutation targets `drafts.<id>`, and the read path pins
 * `perspective: "published"`, so nothing here is visible on the site until a
 * human opens the Studio and presses Publish.
 *
 * `createIfNotExists` never touches a draft that already exists, so every field
 * an editor has changed survives however many times this runs. The `patch` that
 * follows sets exactly one field and DOES overwrite it: `guestLinks`. So the
 * honest statement is the narrow one — **`content/episode-guest-links.json` is
 * the source of truth for `guestLinks` until the draft is published.** Correct a
 * link in the FILE, where it is reviewed as a diff; an in-Studio edit to that
 * one field is undone by the next run, and every other field is safe there.
 *
 * WHY THE DATA IS HAND-SUPPLIED AND NEVER DERIVED. A guest's website is a
 * factual claim about a real person or their company. Nothing in this repo can
 * establish it: the enrichment pipeline is deliberately forbidden from using
 * anything but an episode's own description, and a description rarely contains a
 * URL — when it does, it can be wrong, which is exactly why episode 22 ships
 * with no link rather than the one its description names. A plausible but
 * incorrect profile link sends visitors to a different real organisation, which
 * is worse than no link at all.
 *
 * Episodes are matched by `episodeNumber`, resolved to a `guid` through
 * `content/episode-enrichment.json` so document identity has one source.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { draftDocId } from "../src/lib/podcast/enrichment";
import { episodeDocId } from "../src/lib/podcast/doc-id";
import { createScriptTransport } from "./sanity-client";

interface GuestLink {
  label: string;
  url: string;
}

interface LinkEntry {
  episodeNumber: number;
  links: GuestLink[];
  omissionReason?: string;
}

interface EnrichmentEntry {
  guid: string;
  episodeNumber: number | null;
}

const ROOT = path.join(import.meta.dirname, "..");

function usage(): never {
  console.error(
    "usage:\n" +
      "  bun scripts/apply-guest-links.ts --dry-run   print the mutations, write nothing\n" +
      "  bun scripts/apply-guest-links.ts --apply     write the links to Sanity DRAFTS",
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

/**
 * `_key` is derived from the URL rather than randomised.
 *
 * A random key changes on every run, so re-applying an unchanged file would
 * rewrite every array member and fill the document's history with churn that
 * says nothing happened. Keying on the URL means an unchanged link is byte
 * -identical across runs, and a genuinely changed URL is a genuinely new member.
 */
function keyFor(url: string): string {
  return `link-${url.replace(/[^a-zA-Z0-9]/g, "").slice(-32)}`;
}

async function main(): Promise<void> {
  const { dryRun } = parseInvocation(process.argv);
  console.log(
    dryRun
      ? "MODE: DRY RUN — nothing is written\n"
      : "MODE: LIVE WRITE to Sanity production — DRAFTS ONLY, nothing is published\n",
  );

  const linkFile = JSON.parse(
    await readFile(path.join(ROOT, "content/episode-guest-links.json"), "utf8"),
  ) as { episodes: LinkEntry[] };

  const enrichment = JSON.parse(
    await readFile(path.join(ROOT, "content/episode-enrichment.json"), "utf8"),
  ) as { episodes: EnrichmentEntry[] };

  const guidByNumber = new Map<number, string>();
  for (const entry of enrichment.episodes) {
    if (entry.episodeNumber !== null) guidByNumber.set(entry.episodeNumber, entry.guid);
  }

  const unmatched = linkFile.episodes.filter((entry) => !guidByNumber.has(entry.episodeNumber));
  if (unmatched.length > 0) {
    console.error(
      "FATAL: no episode found for number(s): " +
        unmatched.map((entry) => entry.episodeNumber).join(", ") +
        "\nNothing was written.",
    );
    process.exit(1);
  }

  const withLinks = linkFile.episodes.filter((entry) => entry.links.length > 0);
  const withoutLinks = linkFile.episodes.filter((entry) => entry.links.length === 0);

  // Surfaced rather than silently skipped: an episode with no link is a decision
  // someone made, and it should be visible every time this runs.
  if (withoutLinks.length > 0) {
    console.log("Episodes deliberately shipping with no link:");
    for (const entry of withoutLinks) {
      console.log(`  Episode ${entry.episodeNumber}: ${entry.omissionReason ?? "no reason given"}`);
    }
    console.log("");
  }

  const mutations = withLinks.flatMap((entry) => {
    const guid = guidByNumber.get(entry.episodeNumber)!;
    const draftId = draftDocId(guid);
    return [
      {
        createIfNotExists: dryRun
          ? { _id: draftId, _type: "episode", __publishedFieldsCopiedAtRuntime: true }
          : { _id: draftId, _type: "episode" },
      },
      {
        patch: {
          id: draftId,
          set: {
            guestLinks: entry.links.map((link) => ({
              _type: "guestLink",
              _key: keyFor(link.url),
              label: link.label,
              url: link.url,
            })),
          },
        },
      },
    ];
  });

  if (dryRun) {
    console.log("Planned transaction — createIfNotExists then patch, per episode:");
    console.log(JSON.stringify(mutations, null, 2));
    console.log("\n" + "=".repeat(72));
    console.log("DRY RUN SUMMARY");
    console.log(`  episodes with links: ${withLinks.length}`);
    console.log(`  episodes skipped:    ${withoutLinks.length}`);
    console.log(`  links total:         ${withLinks.reduce((n, e) => n + e.links.length, 0)}`);
    console.log(`  mutations planned:   ${mutations.length}  (two per episode)`);
    console.log("  real network writes: 0");
    return;
  }

  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error("FATAL: SANITY_WRITE_TOKEN is not set. Nothing was written.");
    process.exit(1);
  }

  const transport = createScriptTransport();

  // Copy the published body into any draft that does not exist yet. A draft
  // created empty would publish as an episode with only a links array.
  const publishedIds = withLinks.map((entry) =>
    episodeDocId(guidByNumber.get(entry.episodeNumber)!),
  );
  const published = await transport.getDocuments(publishedIds);
  const publishedById = new Map(published.filter(Boolean).map((doc) => [doc!._id as string, doc!]));

  const liveMutations = withLinks.flatMap((entry) => {
    const guid = guidByNumber.get(entry.episodeNumber)!;
    const source = publishedById.get(episodeDocId(guid));
    const draftId = draftDocId(guid);
    const body = source
      ? { ...source, _id: draftId, _rev: undefined, _updatedAt: undefined, _createdAt: undefined }
      : { _id: draftId, _type: "episode" };

    return [
      { createIfNotExists: body },
      {
        patch: {
          id: draftId,
          set: {
            guestLinks: entry.links.map((link) => ({
              _type: "guestLink",
              _key: keyFor(link.url),
              label: link.label,
              url: link.url,
            })),
          },
        },
      },
    ];
  });

  await transport.mutate(liveMutations);

  console.log("=".repeat(72));
  console.log("LIVE RUN SUMMARY");
  console.log(`  episodes with links:  ${withLinks.length}`);
  console.log(`  episodes skipped:     ${withoutLinks.length}`);
  console.log(`  links written:        ${withLinks.reduce((n, e) => n + e.links.length, 0)}`);
  console.log(`  mutations submitted:  ${liveMutations.length}`);
  console.log("  episodes published:   0 — this script cannot publish");
  console.log("\nNext: open the Studio, review each draft, and press Publish.");
}

await main();
