import {
  GET_URL_LIMIT,
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_MUTATE_HOST,
  SANITY_QUERY_HOST,
} from "./config";

/**
 * Minimal Sanity HTTP transport.
 *
 * Hand-rolled rather than `@sanity/client`, on a runtime-bundle basis: this is
 * the only Sanity code that reaches the deployed server bundle, and it needs
 * roughly a hundred lines of `fetch`.
 *
 * **The write path came here too, and that is a deviation from the plan.**
 * Decision D scopes this module to reads and puts `@sanity/client` behind the
 * Node-only scripts, "where a battle-tested client's retry and error decoding
 * is worth more than 25 saved lines". That dependency was never added:
 * `scripts/backfill.ts` and the Studio publish action both write through
 * `mutate()` below. The result is one transport instead of two, tested offline
 * end to end — but it is a decision that was made by omission rather than
 * ratified, and what it forgoes is concrete: the official client's retry
 * handling and error decoding. `publish.ts` compensates only for the case it
 * needs, a 409 on a strict `create`. Awaiting an explicit call to either
 * ratify this or adopt the client.
 *
 * Deliberately runtime-agnostic — `fetch` and `AbortSignal.timeout` only, no
 * Node built-ins. The deployed target is reported as Vercel `bun1.x`, but that
 * evidence comes from a gitignored local build artifact, and `vite.config.ts`
 * documents cloudflare as Nitro's default target. Staying agnostic costs
 * nothing and means the question never has to be settled.
 *
 * **Nothing raw escapes this module.** Every failure path — a timeout, a
 * non-200, a body that is not JSON, a body that is JSON but not the shape
 * Sanity documents — leaves here as a `SanityHttpError`, and therefore carries
 * `reason: "upstream"`. That is not tidiness: Decision E makes the degradation
 * *cause* part of the product, and the surfaces downstream branch on it (a
 * `"upstream"` degradation answers an unknown slug with `503 + Retry-After`; a
 * `"load"` one, raised by the cache and never by this file, waits for the live
 * query instead). A raw `DOMException` or `SyntaxError` slipping out is not a
 * cosmetic leak — it is a degradation with no cause attached, arriving at a
 * branch that has no case for it.
 */

const QUERY_TIMEOUT_MS = 8_000;

const QUERY_ENDPOINT = `${SANITY_QUERY_HOST}/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

/**
 * The serialized-byte ceiling for one mutation request.
 *
 * Measured in **bytes of the serialized body**, never in mutation count: a
 * `createOrReplace` carrying a full episode with Portable Text is orders of
 * magnitude larger than a `delete`, so any count-based threshold is either
 * uselessly conservative or silently over the real limit. Decimal MB rather
 * than `3 * 1024 * 1024` — the difference is 5% of headroom against a ceiling
 * we are deliberately well under, and the round number is the one written down
 * in the plan and asserted in the tests.
 */
export const MUTATION_BATCH_LIMIT_BYTES = 3_000_000;

/** `{"mutations":[]}` — the fixed envelope every batch pays for before its first entry. */
const MUTATION_ENVELOPE_BYTES = 16;

export class SanityHttpError extends Error {
  /**
   * Decision E's degradation discriminant, and the reason this class exists as
   * a class rather than as a message string.
   *
   * A literal, not a parameter, because every failure this transport can
   * produce has the same cause from the reader's point of view: Sanity did not
   * answer with usable data. The other member of the union, `"load"`, is raised
   * by the keyed cache when a waiter gives up on a healthy upstream, and no
   * code path in this file can produce it. Making it a constructor argument
   * would invite exactly one bug — a new throw site here passing `"load"` and
   * telling the fallback layer that a Sanity outage was local congestion.
   */
  readonly reason = "upstream" as const;

  constructor(
    message: string,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "SanityHttpError";
  }
}

/**
 * `fetch`, with every way it can reject converted into a typed failure.
 *
 * Two distinct things land here and neither is an `Error` this project defined.
 * `AbortSignal.timeout()` rejects with a `DOMException` named `TimeoutError`;
 * a caller-supplied signal that aborts rejects with one named `AbortError`; a
 * DNS failure, a TLS failure or a dropped connection rejects with a `TypeError`
 * whose message is whatever the runtime felt like saying. Left alone, all three
 * cross the module boundary as themselves and reach a `catch` that is looking
 * for `reason`.
 *
 * Duck-typed on `name` rather than `instanceof DOMException`, for the same
 * reason the Studio's error adapter duck-types on `statusCode`: this module is
 * deliberately runtime-agnostic, and `DOMException` is a global whose presence
 * and identity is exactly the thing we have decided not to depend on.
 *
 * `status` is left undefined on purpose — there was no response, so there is no
 * status, and inventing a `0` or a `503` would put a number in front of
 * `publish.ts`'s `status === 409` check that never came from Sanity.
 */
async function send(url: string, init: RequestInit, what: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    const name = (cause as { name?: unknown } | null)?.name;
    // No duration in the message: the signal that fired may be the caller's
    // rather than this module's default, and quoting `QUERY_TIMEOUT_MS` for
    // someone else's deadline puts a number in the log that never applied.
    const detail =
      name === "TimeoutError"
        ? "timed out"
        : name === "AbortError"
          ? "was aborted before it completed"
          : `could not reach Sanity (${cause instanceof Error ? cause.message : String(cause)})`;

    throw new SanityHttpError(`[sanity] ${what} ${detail}`, undefined, { cause });
  }
}

/**
 * Reads a response body as a JSON object, or fails with a typed error.
 *
 * `response.json()` throws a bare `SyntaxError` on anything that is not JSON,
 * and "anything that is not JSON" is a real production shape rather than a
 * theoretical one: a CDN interstitial, a proxy error page, a truncated body on
 * a dropped connection. A JSON *array* or a bare JSON scalar parses fine and is
 * equally not what this API returns, so the object check is part of the same
 * guarantee rather than a separate paranoid one.
 *
 * The HTTP status is carried onto the error even though the parse is what
 * failed. `publish.ts` arbitrates its one retriable outcome on `status === 409`,
 * and a 409 whose body happened to be unparseable is still a lost
 * compare-and-set; dropping the status here would silently convert it into an
 * unretriable failure.
 */
async function readJsonObject(response: Response, what: string): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (cause) {
    throw new SanityHttpError(
      `[sanity] ${what} returned a body that is not JSON`,
      response.status,
      { cause },
    );
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SanityHttpError(
      `[sanity] ${what} returned ${Array.isArray(parsed) ? "a JSON array" : `\`${String(parsed)}\``} ` +
        `where a JSON object was expected`,
      response.status,
    );
  }

  return parsed as Record<string, unknown>;
}

/**
 * The `error` an API response reports, or `undefined` when it reports none.
 *
 * Sanity's usual shape is `{error: {description, type}}`, but some endpoints
 * answer with a bare `{error: "message"}`. Both are handled; anything else
 * truthy is reported as an error without a usable description rather than
 * being read past, because an unrecognised `error` key is still an error.
 */
function errorDescription(body: Record<string, unknown>): string | undefined {
  const error = body.error;
  if (error === undefined || error === null) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const description = (error as { description?: unknown }).description;
    if (typeof description === "string") return description;
  }
  return "unknown error";
}

function queryUrl(query: string, params: Record<string, unknown>): string {
  const search = new URLSearchParams({ query, perspective: "published" });
  for (const [key, value] of Object.entries(params)) {
    // Sanity expects params as `$name`, JSON-encoded.
    search.set(`$${key}`, JSON.stringify(value));
  }
  return `${QUERY_ENDPOINT}?${search}`;
}

/**
 * Runs a GROQ query against the published perspective.
 *
 * Throws on transport or API failure. Callers decide what a failure means —
 * the cache serves stale, and the route falls through to the committed
 * catalogue snapshot. Swallowing errors here would hide an outage behind an
 * empty page, which is the failure mode this project cares most about.
 *
 * No `Authorization` header on either branch, and not by omission (AC-11). A
 * published-perspective read needs no credential, and a token sent here would
 * be a token sent to the CDN, cached against a public URL, and — since this is
 * the one Sanity module that reaches the browser-facing server bundle — one
 * bundler mistake away from being a token sent to a browser.
 */
export async function groq<T>(
  query: string,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = queryUrl(query, params);
  const useGet = new TextEncoder().encode(url).length <= GET_URL_LIMIT;

  const request: RequestInit = useGet
    ? { method: "GET" }
    : {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, params, perspective: "published" }),
      };

  const response = await send(
    useGet ? url : QUERY_ENDPOINT,
    {
      ...request,
      headers: { accept: "application/json", ...(request.headers ?? {}) },
      signal: signal ?? AbortSignal.timeout(QUERY_TIMEOUT_MS),
    },
    "query",
  );

  if (!response.ok) {
    throw new SanityHttpError(`[sanity] query responded ${response.status}`, response.status);
  }

  const body = await readJsonObject(response, "query");

  const error = errorDescription(body);
  if (error !== undefined) {
    throw new SanityHttpError(`[sanity] ${error}`, response.status);
  }

  // The shape check that the old `body.result as T` skipped. A successful query
  // always carries `result` — confirmed against the live dataset, which answers
  // even a query matching nothing with `result: null` rather than by omitting
  // the key. So a missing `result` is never "no episodes matched"; it is a body
  // that reached here wearing a 200 without being a query response at all, and
  // the unchecked cast turned that into `undefined` flowing into the render
  // path as though Sanity had answered.
  if (!("result" in body)) {
    throw new SanityHttpError(
      `[sanity] query responded 200 with a JSON object carrying no \`result\` — ` +
        `keys were [${Object.keys(body).join(", ")}]`,
      response.status,
    );
  }

  return body.result as T;
}

/** Exposed for tests: which method a given query/params pair would use. */
export function methodFor(query: string, params: Record<string, unknown> = {}): "GET" | "POST" {
  return new TextEncoder().encode(queryUrl(query, params)).length <= GET_URL_LIMIT ? "GET" : "POST";
}

/** Exposed for tests: the exact URL a GET query would use. */
export function queryUrlFor(query: string, params: Record<string, unknown> = {}): string {
  return queryUrl(query, params);
}

function docsUrl(ids: string[]): string {
  const path = ids.map(encodeURIComponent).join(",");
  return `${SANITY_MUTATE_HOST}/v${SANITY_API_VERSION}/data/doc/${SANITY_DATASET}/${path}`;
}

/** Exposed for tests: the exact URL a `getDocuments` call would use. */
export function docsUrlFor(ids: string[]): string {
  return docsUrl(ids);
}

/**
 * Fetches full documents by id, uncached.
 *
 * Never routed through the CDN — this is the pre-read a publish transaction
 * takes of the documents it's about to touch (e.g. an episode and its
 * slug-lock), and a stale CDN read there would defeat the whole point of the
 * check. The token defaults from the environment the same way `mutate()`'s
 * does, so this is authenticated by default in the Node script path.
 *
 * Sanity's doc endpoint never errors for an id it can't return — it reports
 * each one in `omitted`, tagged with WHY: `reason: "existence"` for a
 * genuinely missing document (the normal, expected shape of "this episode
 * hasn't been published yet") versus `reason: "permission"` for one that
 * exists but the caller can't read. Those two are not interchangeable: a
 * `permission` omission silently misread as "does not exist" turns a strict
 * `create` into a spurious conflict against a document that was there all
 * along — confirmed empirically against this project's own dataset, where an
 * authenticated fetch of a real id alongside a fabricated one returned the
 * fabricated one as `reason: "existence"` and, separately, an unauthenticated
 * fetch of a real-but-restricted id returned `reason: "permission"`. Only
 * `permission` is treated as a hard error here; `existence` is left for
 * callers to handle as the ordinary absence it is.
 */
export async function getDocuments(
  ids: string[],
  options: { token?: string } = {},
): Promise<Record<string, unknown>[]> {
  const url = docsUrl(ids);
  const token = options.token ?? globalThis.process?.env?.SANITY_WRITE_TOKEN;

  const response = await send(
    url,
    {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    },
    "doc fetch",
  );

  if (!response.ok) {
    throw new SanityHttpError(`[sanity] doc fetch responded ${response.status}`, response.status);
  }

  const body = await readJsonObject(response, "doc fetch");

  const error = errorDescription(body);
  if (error !== undefined) {
    throw new SanityHttpError(`[sanity] ${error}`, response.status);
  }

  // `documents` is required, not defaulted. The endpoint always sends the key
  // — verified against this dataset, where a fetch of one fabricated id
  // answered `{"documents":[],"omitted":[{...,"reason":"existence"}]}` rather
  // than omitting it — so its absence means the body is not a doc response.
  // The old `body.documents ?? []` turned that into "no documents exist", and
  // an empty pre-read is precisely the input that makes `publish.ts` build a
  // *creating* transaction against documents that may already be there.
  if (!Array.isArray(body.documents)) {
    throw new SanityHttpError(
      `[sanity] doc fetch responded 200 without a \`documents\` array — ` +
        `keys were [${Object.keys(body).join(", ")}]`,
      response.status,
    );
  }

  // `omitted` is legitimately absent when nothing was omitted, so absence is
  // tolerated; a present-but-not-an-array `omitted` is not, because the
  // permission check below would silently pass over it.
  if (body.omitted !== undefined && !Array.isArray(body.omitted)) {
    throw new SanityHttpError(
      `[sanity] doc fetch responded 200 with an \`omitted\` that is not an array`,
      response.status,
    );
  }

  const omitted = (body.omitted ?? []) as { id?: unknown; reason?: unknown }[];
  const denied = omitted.filter((entry) => entry?.reason === "permission");
  if (denied.length > 0) {
    throw new SanityHttpError(
      `[sanity] permission denied reading ${denied.map((entry) => String(entry.id)).join(", ")} — ` +
        `the token lacks read access to a document that exists, not that it's absent`,
    );
  }

  return body.documents as Record<string, unknown>[];
}

/**
 * Splits a mutation array into request-sized batches by serialized bytes.
 *
 * Greedy and order-preserving: entries accumulate until the next one would take
 * the serialized body past the limit, then a new batch starts. Each entry is
 * charged its own serialized length plus one byte for the comma that will
 * separate it, on top of the fixed `{"mutations":[]}` envelope — so the
 * measurement is of the body that will actually be sent, not an approximation
 * of it.
 *
 * A single mutation larger than the limit becomes a batch of one rather than
 * being dropped or paired with an empty batch. It will be refused upstream,
 * with a status and a description naming the real problem — which is a better
 * answer than any this function could invent for a document that cannot be
 * written at all.
 *
 * An empty input yields one empty batch, preserving the pre-batching behaviour
 * exactly: one call in, at least one request out. Deciding for the caller that
 * an empty transaction should make no request would be a second, silent
 * behaviour hidden inside a size optimisation.
 */
function batchMutations(mutations: unknown[]): unknown[][] {
  const encoder = new TextEncoder();
  const batches: unknown[][] = [];

  let current: unknown[] = [];
  let currentBytes = MUTATION_ENVELOPE_BYTES;

  for (const mutation of mutations) {
    const bytes = encoder.encode(JSON.stringify(mutation)).length + 1;
    if (current.length > 0 && currentBytes + bytes > MUTATION_BATCH_LIMIT_BYTES) {
      batches.push(current);
      current = [];
      currentBytes = MUTATION_ENVELOPE_BYTES;
    }
    current.push(mutation);
    currentBytes += bytes;
  }

  if (current.length > 0 || batches.length === 0) batches.push(current);
  return batches;
}

/**
 * Runs a mutation transaction. Never routed through the CDN, and never
 * imported by a route component — only by the seeding and publish scripts.
 *
 * The token is read at call time from the environment so that importing this
 * module has no credential requirement and no side effect.
 *
 * ## Batching and the atomicity guarantee callers depend on
 *
 * **One batch is one Sanity transaction.** Sanity's all-or-nothing guarantee is
 * per request, so splitting an array across two requests produces two
 * independent transactions and the second can commit while the first has
 * failed. That is not an abstract concern here: `publishEpisode()` submits the
 * `slugLock` strict `create` and the episode strict `create` in ONE array
 * *because* losing the race must roll back both, and a split between those two
 * entries would leave a lock pointing at an episode that was never published —
 * reintroducing, through a size optimisation, the exact race Decision F exists
 * to close.
 *
 * The reconciliation is that the two requirements do not actually meet. The
 * atomicity-critical caller submits two or three mutations totalling a few kB;
 * the limit is 3 MB. A split is therefore reachable only by a bulk caller whose
 * array genuinely exceeds a single request — for which the alternatives are a
 * `413` or a split, and a split is the useful one. So the rule, stated for the
 * next caller rather than left to be inferred:
 *
 * > **Anything relying on all-or-nothing across its mutations must keep them
 * > under `MUTATION_BATCH_LIMIT_BYTES` in one call.** Under the limit — where
 * > every atomic caller in this codebase lives, by three orders of magnitude —
 * > batching is a no-op and the transaction is exactly the array passed in.
 *
 * That rule is **enforced, not merely documented**, via `atomic` — which
 * defaults to `true`. An atomic call that would have to split throws instead of
 * splitting. The headroom above makes this unreachable in practice, and that is
 * the point: the one way it becomes reachable is a future bulk caller reusing
 * this function without noticing the guarantee it carries, and a comment is not
 * a mechanism. This project's whole premise is that the slug is arbitrated by a
 * datastore operation rather than by care (Decision F, Principle 8); the
 * transport underneath it should not then rely on care either.
 *
 * A caller that genuinely does not need all-or-nothing passes `atomic: false`
 * and gets byte-based batching. Nothing in this codebase does today.
 *
 * Batches are submitted **sequentially and fail fast**, never concurrently. On
 * failure the caller is left with a deterministic prefix applied and the
 * remainder untouched, which is a state that can be reasoned about and re-run;
 * concurrent submission would leave an arbitrary subset applied instead.
 *
 * Returns one response body per submitted batch — an array in every case,
 * including the single-batch one. A return shape that changed with the input
 * size would be a footgun for the first caller to read it.
 */
export async function mutate(
  mutations: unknown[],
  options: { token?: string; returnDocuments?: boolean; atomic?: boolean } = {},
): Promise<unknown> {
  const token = options.token ?? globalThis.process?.env?.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new SanityHttpError("[sanity] SANITY_WRITE_TOKEN is required for mutations");
  }

  const atomic = options.atomic ?? true;
  const batches = batchMutations(mutations);

  if (atomic && batches.length > 1) {
    // Refused rather than split. Splitting here would hand back two
    // transactions to a caller that asked for one, and the failure that
    // produces — a committed `slugLock` whose episode never landed — is silent,
    // permanent, and only observable much later as a 404 on a shared URL.
    throw new SanityHttpError(
      `[sanity] refusing to split an atomic mutation of ${mutations.length} entries across ` +
        `${batches.length} requests: Sanity's all-or-nothing guarantee is per request, so a ` +
        `split would produce ${batches.length} independent transactions. Keep the array under ` +
        `${MUTATION_BATCH_LIMIT_BYTES} bytes, or pass { atomic: false } if this caller genuinely ` +
        `does not need all-or-nothing.`,
    );
  }

  const url = `${SANITY_MUTATE_HOST}/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}?returnIds=true${
    options.returnDocuments ? "&returnDocuments=true" : ""
  }`;

  const bodies: unknown[] = [];

  for (const batch of batches) {
    const response = await send(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations: batch }),
      },
      "mutation",
    );

    const body = await readJsonObject(response, "mutation");
    const error = errorDescription(body);
    if (!response.ok || error !== undefined) {
      throw new SanityHttpError(
        `[sanity] mutation failed (${response.status}): ${error ?? "unknown"}`,
        response.status,
      );
    }

    bodies.push(body);
  }

  return bodies;
}
