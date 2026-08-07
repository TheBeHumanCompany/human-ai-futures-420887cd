import { SanityHttpError } from "./http";

/**
 * Translates a `@sanity/client` failure into the error shape `publish.ts`
 * arbitrates on.
 *
 * `publishEpisode()`'s one retriable failure is a strict `create` losing its
 * compare-and-set, which it recognises as `SanityHttpError` with
 * `status === 409`. `@sanity/client` does not throw that: it rejects with its
 * own `ClientError`, a different class carrying its HTTP status on
 * `statusCode`. Untranslated, a genuine 409 fails both halves of that check,
 * skips the retry entirely, and surfaces as a raw client error instead of
 * "published by someone else" — the transport mismatch this boundary absorbs.
 *
 * **Two callers, one rule.** Both writers that speak to Sanity through the
 * official client need this: the Studio publish action, and the Node scripts
 * (`scripts/sanity-client.ts`). It lives here rather than in either of them
 * because the Studio module imports React and `sanity` at module scope, so a
 * script cannot borrow it from there, and a second copy would be a second thing
 * to keep correct. Nothing in this file imports `@sanity/client` — that is what
 * lets it sit in `src/` without pulling a 5 MB client anywhere near the
 * deployed bundle.
 *
 * Duck-typed on `statusCode` rather than `instanceof ClientError`. Staking
 * correctness on there being exactly one copy of the package in the tree would
 * be the identical failure this fixes: an `instanceof` that quietly returns
 * false against a duplicated install, and a 409 that silently stops being
 * retriable.
 *
 * Anything without a numeric `statusCode` — a network failure, an abort, a bug
 * in a caller — is returned untouched and propagates as itself. Nothing is
 * swallowed and nothing is relabelled.
 */
export function normalizeSanityError(error: unknown): unknown {
  if (error === null || typeof error !== "object") return error;

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode !== "number") return error;

  const message = error instanceof Error ? error.message : String(error);
  return new SanityHttpError(message, statusCode);
}
