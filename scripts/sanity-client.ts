/**
 * The Node-only write transport, backed by `@sanity/client` — Decision D.
 *
 * The plan splits the transport deliberately. The deployed read path is the
 * hand-rolled `src/lib/sanity/http.ts`, because it is the only Sanity code that
 * reaches the server bundle and it needs about a hundred lines of `fetch`. The
 * irreversible writes are the other case entirely: these run once, in Node, off
 * a laptop, against `production`, and this is "where a battle-tested client's
 * retry and error decoding is worth more than 25 saved lines".
 *
 * That side of the split had never been built — `scripts/backfill.ts` fell
 * through to `http.ts`'s `mutate()` for both seeding and rollback. This module
 * is it. What the official client brings that the hand-rolled one does not:
 * request retries with backoff on transient failures, and error decoding that
 * turns Sanity's mutation-error payloads into typed, readable rejections rather
 * than a status code and a description string.
 *
 * **It must never be imported from `src/`.** `@sanity/client` is ~5 MB unpacked
 * and a `devDependency`; anything under `src/` can be pulled into the deployed
 * function by the bundler. `layering.test.ts` asserts this by path, so the rule
 * is enforced rather than remembered.
 *
 * The returned object satisfies both `PublishDeps` and `RollbackDeps` — the same
 * two-function shape — so `publishEpisode()` and `rollbackEpisodes()` take it
 * without knowing which transport is underneath. That injectability is what lets
 * their test suites run offline with no credential.
 */
import { createClient } from "@sanity/client";

import { normalizeSanityError } from "../src/lib/sanity/client-errors";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "../src/lib/sanity/config";
import type { getDocuments, mutate } from "../src/lib/sanity/http";

export interface ScriptTransport {
  getDocuments: typeof getDocuments;
  mutate: typeof mutate;
}

/**
 * Builds the write transport, or refuses.
 *
 * The token is read once, here, and the refusal is loud: a script that
 * discovered a missing credential halfway through 39 episodes would leave the
 * dataset in a state nobody planned. `publishEpisode()` is idempotent so a
 * re-run is safe, but "safe to re-run" is not a reason to start a run that
 * cannot finish.
 */
export function createScriptTransport(options: { token?: string } = {}): ScriptTransport {
  const token = options.token ?? process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "[sanity] SANITY_WRITE_TOKEN is required for writes. Copy .env.example to .env.local and fill it in.",
    );
  }

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    token,
    // Never the CDN. Decision F's pre-read decides whether to emit a strict
    // `create`, and a cached read there would mean deciding "no episode exists"
    // against a stale view — turning an ordinary republish into a 409 the retry
    // then has to absorb. Writes cannot go through the CDN at all.
    useCdn: false,
  });

  return {
    // `client.getDocuments()` returns an array parallel to `ids` with a `null`
    // per missing document. `publishEpisode()` expects only the documents that
    // exist, the way Sanity's own doc endpoint replies and the way `http.ts`'s
    // implementation behaves — absence is a normal result, not a hole to
    // preserve positionally.
    getDocuments: async (ids) => {
      try {
        const documents = await client.getDocuments(ids);
        return documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null);
      } catch (error) {
        throw normalizeSanityError(error);
      }
    },

    // One array, one transaction. `publishEpisode()` submits the slugLock
    // strict `create` and the episode strict `create` together *because* losing
    // the race has to roll back both, and `rollbackEpisodes()` submits each
    // {episode, lock} pair the same way. `client.mutate()` sends the array as a
    // single request, which is exactly that guarantee — there is no batching
    // here to undo it.
    mutate: async (mutations) => {
      try {
        return await client.mutate(mutations as Parameters<typeof client.mutate>[0]);
      } catch (error) {
        throw normalizeSanityError(error);
      }
    },
  };
}
