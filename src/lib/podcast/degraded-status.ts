/**
 * Upgrades a deliberately-marked degraded response from 500 to 503.
 *
 * The router can only ever emit 200, 404 or 500 for a document response — its
 * status store holds nothing else — so a loader that throws during a Sanity
 * outage surfaces as a 500. That already satisfies the requirement: no 5xx is
 * indexed, and neither 500 nor 503 deindexes on a transient basis. This
 * function buys two narrower things.
 *
 * 1. Googlebot honours `Retry-After` on a 503 for crawl rescheduling. It has no
 *    defined meaning on a 500.
 * 2. In logs, a 500 on `/podcast*` means our code broke and a 503 means Sanity
 *    was down — the same missing-vs-unreachable distinction the rest of this
 *    design turns on, extended to whoever is on call.
 *
 * **It is a nicety, and it is written to be droppable.** Nothing else depends
 * on it; remove it and every acceptance criterion still holds.
 *
 * Both guards are refusals, not conveniences:
 * - a status other than 500 is returned untouched, so a genuine 404 can never
 *   be promoted into "come back later" — that would resurrect the exact
 *   missing-vs-unreachable conflation this design exists to prevent, one layer
 *   below where it was already defeated;
 * - a 500 without the deliberate marker is returned untouched, so a real bug in
 *   our own code is never dressed up as somebody else's outage.
 */

/** The header a route sets to say "this failure was an upstream outage". */
export const DEGRADED_SOURCE_HEADER = "x-podcast-source";
export const DEGRADED_SOURCE_VALUE = "degraded";

/** Seconds. Long enough to outlast a blip, short enough to recrawl the same day. */
export const DEGRADED_RETRY_AFTER_SECONDS = 300;

export function upgradeDegraded(response: Response): Response {
  if (response.status !== 500) return response;
  if (response.headers.get(DEGRADED_SOURCE_HEADER) !== DEGRADED_SOURCE_VALUE) return response;

  const headers = new Headers(response.headers);
  headers.set("retry-after", String(DEGRADED_RETRY_AFTER_SECONDS));

  // The body is passed through rather than read: it is the branded error page
  // the route already rendered, and buffering it here would mean holding a
  // streamed document in memory to change a number in the status line.
  return new Response(response.body, {
    status: 503,
    statusText: "Service Unavailable",
    headers,
  });
}
