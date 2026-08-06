import type { Episode } from "../podbean/types";
import { episodeDocId } from "./doc-id";

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
 * Everything an `episode` document takes verbatim from a feed item.
 *
 * Extracted so the backfill (below) and the Studio's "Sync from Podbean"
 * action (`planSyncDrafts`) cannot drift apart on what a feed-derived episode
 * contains. They differ in `_id` and provenance and in nothing else, and the
 * day that stops being true it should be a visible edit here rather than a
 * quiet divergence between two hand-maintained object literals.
 *
 * `slug`, `slugFrozenAt` and `searchText` are absent on purpose — `slug` is a
 * human decision (Decision B) and the other two are computed by
 * `publishEpisode()`. So are `topics`, `guestBio`, `guestPhoto` and
 * `coverArtwork`: the feed does not carry them and writing `undefined` into
 * them would be a claim the feed never made.
 */
export interface EpisodeFeedFields {
  guid: string;
  title: string;
  description: string;
  excerpt: string;
  /** `undefined` rather than a placeholder — see `Episode.guest`. */
  guestName: string | undefined;
  podbeanUrl: string;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
  episodeNumber: number | null;
}

function feedFields(episode: Episode): EpisodeFeedFields {
  return {
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
  };
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
        ...feedFields(episode),
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

/* ------------------------------------------------------------------ *
 * Studio "Sync from Podbean" — the plan, decided here rather than in
 * the Studio action, because `bun test src/` cannot see `studio/**`.
 * ------------------------------------------------------------------ */

/**
 * Provenance stamp on documents the Studio action creates.
 *
 * Deliberately distinct from the backfill's `backfill-v1`: an episode that
 * arrived through the button is an episode nobody proposed a slug for in
 * `slugs.snapshot.json`, which is exactly the thing `podcast:report` and any
 * future rollback need to be able to tell apart from the seeded 39.
 */
export const STUDIO_SYNC_SEEDED_BY = "studio-sync-v1";

/** A draft document the sync will create, ready to hand to `createIfNotExists`. */
export interface SyncDraftDocument extends EpisodeFeedFields {
  /** `drafts.<episodeDocId(guid)>`. */
  _id: string;
  _type: "episode";
  seededBy: typeof STUDIO_SYNC_SEEDED_BY;
}

/** Two or more distinct feed guids that sanitise to one document id. */
export interface DocIdCollision {
  _id: string;
  guids: string[];
}

export interface SyncPlan {
  /**
   * The drafts to create. Safe to commit **only** when `collisions` is empty —
   * a collision means the feed cannot be represented faithfully and the caller
   * must refuse the whole run, the way `scripts/backfill.ts` does.
   */
  create: SyncDraftDocument[];
  /** Feed guids that already have a published document, a draft, or both. */
  existingGuids: string[];
  /** Feed guids seen more than once in one feed. Counted once, created once. */
  duplicateGuids: string[];
  collisions: DocIdCollision[];
}

/**
 * Every document id the caller must probe for before creating anything:
 * `<id>` and `drafts.<id>` for each feed guid.
 *
 * **Both halves are load-bearing.** `createIfNotExists("drafts.episode-x")`
 * against an episode that is already *published* does not no-op — there is no
 * draft, so it creates one, and a live episode silently acquires an
 * "unpublished changes" badge and an editing state nobody asked for. Probing
 * only the published id would miss a sync already run but not yet published;
 * probing only the draft id would produce exactly that phantom draft on all 39.
 */
export function syncProbeIds(episodes: readonly { guid: string }[]): string[] {
  const ids = new Set<string>();
  for (const episode of episodes) {
    const id = episodeDocId(episode.guid);
    ids.add(id);
    ids.add(`drafts.${id}`);
  }
  return [...ids];
}

/**
 * Decides which feed episodes are new, from the feed and the set of document
 * ids that already exist (`syncProbeIds` names the ones to ask about).
 *
 * Pure: no client, no network, no clock. The Studio action supplies the two
 * I/O halves and commits the result.
 *
 * `existingIds` must be **literal** ids read under a raw perspective. A
 * `drafts` perspective folds `drafts.episode-x` onto `episode-x`, which would
 * make "is there a draft?" unanswerable and every already-drafted episode look
 * published.
 */
export function planSyncDrafts(
  episodes: readonly Episode[],
  existingIds: Iterable<string>,
): SyncPlan {
  const existing = new Set(existingIds);

  // Pass 1 — group guids by the id they sanitise to, so a collision is known
  // before any document is planned rather than discovered by a lost write.
  // `episodeDocId` is lossy (it substitutes every character outside
  // [A-Za-z0-9_-]), so two guids differing only in punctuation land on one id
  // and one episode would silently stand in for the other.
  const guidsById = new Map<string, Set<string>>();
  for (const episode of episodes) {
    const id = episodeDocId(episode.guid);
    const bucket = guidsById.get(id);
    if (bucket) bucket.add(episode.guid);
    else guidsById.set(id, new Set([episode.guid]));
  }

  const collisions: DocIdCollision[] = [];
  const collidingIds = new Set<string>();
  for (const [id, guids] of guidsById) {
    if (guids.size < 2) continue;
    collidingIds.add(id);
    collisions.push({ _id: id, guids: [...guids] });
  }

  // Pass 2 — classify each feed item exactly once.
  const create: SyncDraftDocument[] = [];
  const existingGuids: string[] = [];
  const duplicateGuids: string[] = [];
  const seenGuids = new Set<string>();

  for (const episode of episodes) {
    if (seenGuids.has(episode.guid)) {
      duplicateGuids.push(episode.guid);
      continue;
    }
    seenGuids.add(episode.guid);

    const id = episodeDocId(episode.guid);
    // Excluded from `create` as well as reported, so a caller that ignores
    // `collisions` still cannot write a document standing in for two episodes.
    if (collidingIds.has(id)) continue;

    if (existing.has(id) || existing.has(`drafts.${id}`)) {
      existingGuids.push(episode.guid);
      continue;
    }

    create.push({
      _id: `drafts.${id}`,
      _type: "episode",
      ...feedFields(episode),
      seededBy: STUDIO_SYNC_SEEDED_BY,
    });
  }

  return { create, existingGuids, duplicateGuids, collisions };
}
