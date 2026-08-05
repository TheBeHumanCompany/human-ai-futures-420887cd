import type { Episode } from "../podbean/types";

export interface SlugProposal {
  guid: string;
  _id: string;
  slug: string;
}

export interface SeedDocument {
  episodeDoc: Record<string, unknown>;
  slug: string;
}

/**
 * Builds the seed-shaped documents the backfill will hand to `publishEpisode`
 * (`slug` stays a separate top-level value; `publishEpisode` derives
 * `episodeDoc.slug`/`slugFrozenAt` itself). Pure and side-effect-free so it can
 * also be reused to build realistic fixtures for read-path tests.
 */
export function buildSeedDocuments(
  episodes: Episode[],
  slugProposals: SlugProposal[],
): SeedDocument[] {
  const proposalsByGuid = new Map(slugProposals.map((proposal) => [proposal.guid, proposal]));
  const matchedGuids = new Set<string>();
  const missingProposals: string[] = [];
  const results: SeedDocument[] = [];

  for (const episode of episodes) {
    const proposal = proposalsByGuid.get(episode.guid);
    if (proposal === undefined) {
      missingProposals.push(episode.guid);
      continue;
    }

    matchedGuids.add(episode.guid);
    results.push({
      episodeDoc: {
        _id: proposal._id,
        _type: "episode",
        guid: episode.guid,
        title: episode.title,
        description: episode.description,
        excerpt: episode.excerpt,
        guestName: episode.guest,
        podbeanUrl: episode.podbeanUrl,
        audioUrl: episode.audioUrl,
        durationSeconds: episode.durationSeconds,
        publishedAt: episode.pubDate,
        episodeNumber: episode.episodeNumber,
        seededBy: "backfill-v1",
      },
      slug: proposal.slug,
    });
  }

  const missingEpisodes = slugProposals
    .filter((proposal) => !matchedGuids.has(proposal.guid))
    .map((proposal) => proposal.guid);

  if (missingProposals.length > 0 || missingEpisodes.length > 0) {
    const parts: string[] = [];
    if (missingProposals.length > 0) {
      parts.push(`episode guid(s) with no matching slug proposal: ${missingProposals.join(", ")}`);
    }
    if (missingEpisodes.length > 0) {
      parts.push(`slug proposal guid(s) with no matching episode: ${missingEpisodes.join(", ")}`);
    }
    throw new Error(`[podcast/sync] buildSeedDocuments: ${parts.join("; ")}`);
  }

  return results;
}
