import type {SanityClient} from 'sanity'

import {parseFeed} from '../../src/lib/podbean/parse'
import type {Episode} from '../../src/lib/podbean/types'
import {planSyncDrafts, syncProbeIds} from '../../src/lib/podcast/sync'

/**
 * The feed URL the **browser** must use, which is not the one the server uses.
 *
 * `PODBEAN_FEED_URL` (src/lib/podbean/feed.ts:14) is
 * `https://shanejjamesgroup.podbean.com/feed.xml`. Verified 2026-08-06: it
 * answers **302 with no `access-control-allow-origin` header**, and a browser
 * evaluates CORS on the redirect response itself — so the fetch is blocked
 * before the redirect is ever followed. Its target, the canonical host below,
 * answers **200 with `access-control-allow-origin: *`**.
 *
 * So this is a second constant rather than an import, and deduplicating the two
 * would break this file. Server-side code has no CORS to satisfy and should
 * keep using the show-branded host it already uses.
 *
 * That header is Podbean's to change. `bun run podcast:report` re-checks it
 * with a cross-origin `Origin` header as a standing line, so the day it
 * disappears is caught by a command rather than by an editor mid-task — and
 * until then, `FEED_UNREACHABLE_TITLE`/`_DETAIL` below say so out loud.
 */
export const STUDIO_PODBEAN_FEED_URL = 'https://feed.podbean.com/shanejjamesgroup/feed.xml'

/** Matches the server-side fetch in src/lib/podbean/feed.ts. */
const FETCH_TIMEOUT_MS = 8000

/**
 * The distinct message for the one failure whose cause is not guessable from a
 * generic error: the browser refused or could not complete the request.
 *
 * A rejected `fetch()` is indistinguishable from a CORS block by design — the
 * browser deliberately withholds the response — so this names every candidate
 * rather than pretending to know which one fired.
 */
export const FEED_UNREACHABLE_TITLE = 'could not reach the Podbean feed from the browser'
export const FEED_UNREACHABLE_DETAIL =
  'CORS, network or timeout. The feed host may have changed its headers: ' +
  `${STUDIO_PODBEAN_FEED_URL} must answer with access-control-allow-origin. ` +
  'Run `bun run podcast:report` to check that header from outside the browser.'

/** A `fetch()` that rejected — the CORS/network case, kept distinguishable. */
export class PodbeanFeedUnreachableError extends Error {
  constructor(options?: {cause?: unknown}) {
    super(FEED_UNREACHABLE_TITLE, options)
    this.name = 'PodbeanFeedUnreachableError'
  }
}

/** Two feed guids that sanitise to one document id — nothing may be written. */
export class PodbeanSyncCollisionError extends Error {
  constructor(public readonly detail: string) {
    super('the feed contains episodes that map to the same document id')
    this.name = 'PodbeanSyncCollisionError'
  }
}

/**
 * Fetches and parses the live feed from the browser.
 *
 * `parseFeed` is imported from the site library unchanged: it is pure string
 * manipulation with no DOM, no `Buffer` and no `node:` import (its only import
 * is a type), so the same parser that produced the seeded 39 produces these —
 * a second, browser-flavoured parser would be a second thing to keep correct.
 */
export async function fetchFeedEpisodes(): Promise<Episode[]> {
  let response: Response
  try {
    response = await fetch(STUDIO_PODBEAN_FEED_URL, {
      headers: {accept: 'application/rss+xml, application/xml, text/xml'},
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch (error) {
    throw new PodbeanFeedUnreachableError({cause: error})
  }

  if (!response.ok) {
    // Reached the host and got an answer: a plain error, not the CORS one.
    throw new Error(`the Podbean feed responded ${response.status}`)
  }

  const episodes = parseFeed(await response.text())
  if (episodes.length === 0) {
    // Never silently "0 new episodes" — a reachable feed that parses to
    // nothing means its format moved, and that is the one outcome an editor
    // would otherwise read as "everything is already in Sanity".
    throw new Error('the Podbean feed parsed to zero episodes — its format may have changed')
  }

  return episodes
}

export interface SyncOutcome {
  /** Drafts created by this run. */
  created: number
  /** Feed episodes already in Sanity as a published document, a draft, or both. */
  existing: number
  /** Feed guids that appeared more than once. Counted once, created once. */
  duplicates: number
  /** Episodes in the feed. */
  total: number
}

/**
 * Fetch the feed, work out which episodes Sanity has never seen, and create a
 * draft for each. The I/O half of Task 8; every decision it makes is
 * `planSyncDrafts`'s, in `src/lib/podcast/sync.ts`, under `bun test src/`.
 *
 * **Drafts only, never a publish.** This module does not import
 * `publishEpisode()` and must not: a draft has no frozen slug and therefore no
 * slug lock, so nothing here can bind a permanent URL. The lock binds when a
 * human presses Publish in the Studio — the already-shipped author path — and
 * AC-5.2 holds structurally in the meantime, because `http.ts:47` pins
 * `perspective: "published"` and the public site cannot see a draft at all.
 */
export async function syncEpisodeDrafts(client: SanityClient): Promise<SyncOutcome> {
  const episodes = await fetchFeedEpisodes()

  // `perspective: 'raw'` is required, not stylistic. Under `drafts` the API
  // folds `drafts.episode-x` onto `episode-x` and returns the published id, so
  // "does a draft already exist?" becomes unanswerable; under `published` a
  // draft is invisible and every sync would re-plan the drafts it already made.
  // Raw returns literal ids, which is what `planSyncDrafts` compares against.
  const existingIds = await client.fetch<string[]>(
    '*[_id in $ids]._id',
    {ids: syncProbeIds(episodes)},
    {perspective: 'raw'},
  )

  const plan = planSyncDrafts(episodes, existingIds)

  if (plan.collisions.length > 0) {
    throw new PodbeanSyncCollisionError(
      plan.collisions
        .map((collision) => `${collision._id} <- ${collision.guids.join(', ')}`)
        .join('; '),
    )
  }

  if (plan.create.length > 0) {
    // One transaction: either every new draft lands or none does, so a failure
    // half way through leaves nothing to reconcile by hand. `createIfNotExists`
    // rather than `create` so a document that appeared between the probe and
    // the commit is left exactly as it is instead of failing the batch.
    const transaction = client.transaction()
    for (const document of plan.create) transaction.createIfNotExists(document)
    await transaction.commit()
  }

  return {
    created: plan.create.length,
    existing: plan.existingGuids.length,
    duplicates: plan.duplicateGuids.length,
    total: episodes.length,
  }
}
