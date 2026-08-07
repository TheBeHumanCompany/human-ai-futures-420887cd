import { SanityHttpError } from "../sanity/http";

/**
 * "This episode does not exist" and "we could not reach Sanity" are different
 * states, and this module exists so they can never share a code path.
 *
 * A 404 on a permanent URL is a deliberate instruction to a crawler: this is
 * gone, drop it. Emitting one because a third party had a bad afternoon
 * destroys the exact artifact this project exists to protect — a link a guest
 * already posted. So every failure is classified before it is handled, and the
 * classification lives in one tested module rather than in three loaders.
 *
 * **The trap this module is shaped around.** `notFound()` does not return an
 * `Error`. It returns a plain object — `{isNotFound: true}` — so any hand-rolled
 * detector reaching for `instanceof Error`, `.name`, or a message match answers
 * `false` for every genuine 404 and misclassifies all of them as outages. That
 * is why nothing here is hand-rolled: `isNotFound` is re-exported from the
 * router that produces the value, so there is exactly one implementation and it
 * is the one that ships with the object.
 */
export { isNotFound } from "@tanstack/react-router";

/**
 * True when a failure means "Sanity did not answer", and false for everything
 * else — including a `notFound()`.
 *
 * Two checks, and the second is not redundant. `instanceof` is the precise
 * answer in-process, which is where the detail and directory loaders run. But a
 * failure can also arrive having crossed a server-function RPC boundary, where
 * it is serialized to a plain object and the prototype is gone; `instanceof`
 * silently answers `false` there, and on `/` that would turn a Sanity outage
 * into an unhandled 500 on the front door — the one thing Decision L forbids.
 * The structural check reads the `reason` discriminant that every transport
 * failure carries by construction (`SanityHttpError.reason` is a literal
 * `"upstream"`, not a constructor argument), so it survives the trip.
 *
 * Deliberately narrow. `/` is the only surface that catches, and it must
 * re-throw anything that is not this — a genuine bug in the homepage loader has
 * to surface as a 500 rather than being disguised as somebody else's outage.
 */
export function isSanityUnreachable(error: unknown): boolean {
  if (error instanceof SanityHttpError) return true;

  if (error === null || typeof error !== "object") return false;

  // A `notFound()` is a plain object too, so the marker has to be positive
  // rather than "an object that isn't an Error".
  return (error as { reason?: unknown }).reason === "upstream";
}
