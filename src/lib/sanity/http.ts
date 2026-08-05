import {
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
 * roughly a hundred lines of `fetch`. The Node-only scripts that seed and
 * publish are free to use the official client, where transaction and mutation
 * semantics are exactly what you least want hand-rolled.
 *
 * Deliberately runtime-agnostic — `fetch` and `AbortSignal.timeout` only, no
 * Node built-ins. The deployed target is reported as Vercel `bun1.x`, but that
 * evidence comes from a gitignored local build artifact, and `vite.config.ts`
 * documents cloudflare as Nitro's default target. Staying agnostic costs
 * nothing and means the question never has to be settled.
 */

const QUERY_TIMEOUT_MS = 8_000;

/**
 * Sanity caps a GET query URL at 11 kB and requires POST beyond it. POST is
 * still CDN-cacheable, so the only cost is the method. Crossing that limit is
 * not hypothetical — a multi-term search plus a topic filter plus pagination
 * against a non-trivial projection gets there — and it would fail in
 * production, not in a 39-episode test. The threshold is deliberately under
 * the documented ceiling.
 */
const GET_URL_LIMIT_BYTES = 10_000;

export class SanityHttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SanityHttpError";
  }
}

function queryUrl(query: string, params: Record<string, unknown>): string {
  const search = new URLSearchParams({ query, perspective: "published" });
  for (const [key, value] of Object.entries(params)) {
    // Sanity expects params as `$name`, JSON-encoded.
    search.set(`$${key}`, JSON.stringify(value));
  }
  return `${SANITY_QUERY_HOST}/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?${search}`;
}

/**
 * Runs a GROQ query against the published perspective.
 *
 * Throws on transport or API failure. Callers decide what a failure means —
 * the cache serves stale, and the route falls through to the committed
 * catalogue snapshot. Swallowing errors here would hide an outage behind an
 * empty page, which is the failure mode this project cares most about.
 */
export async function groq<T>(
  query: string,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = queryUrl(query, params);
  const useGet = new TextEncoder().encode(url).length <= GET_URL_LIMIT_BYTES;

  const request: RequestInit = useGet
    ? { method: "GET" }
    : {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, params, perspective: "published" }),
      };

  const response = await fetch(
    useGet ? url : `${SANITY_QUERY_HOST}/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
    {
      ...request,
      headers: { accept: "application/json", ...(request.headers ?? {}) },
      signal: signal ?? AbortSignal.timeout(QUERY_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new SanityHttpError(`[sanity] query responded ${response.status}`, response.status);
  }

  const body = (await response.json()) as { result?: T; error?: { description?: string } };
  if (body.error) {
    throw new SanityHttpError(`[sanity] ${body.error.description ?? "query error"}`);
  }
  return body.result as T;
}

/** Exposed for tests: which method a given query/params pair would use. */
export function methodFor(query: string, params: Record<string, unknown> = {}): "GET" | "POST" {
  return new TextEncoder().encode(queryUrl(query, params)).length <= GET_URL_LIMIT_BYTES
    ? "GET"
    : "POST";
}

/** Exposed for tests: the exact URL a GET query would use. */
export function queryUrlFor(query: string, params: Record<string, unknown> = {}): string {
  return queryUrl(query, params);
}

/**
 * Runs a mutation transaction. Never routed through the CDN, and never
 * imported by a route component — only by the seeding and publish scripts.
 *
 * The token is read at call time from the environment so that importing this
 * module has no credential requirement and no side effect.
 */
export async function mutate(
  mutations: unknown[],
  options: { token?: string; returnDocuments?: boolean } = {},
): Promise<unknown> {
  const token = options.token ?? globalThis.process?.env?.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new SanityHttpError("[sanity] SANITY_WRITE_TOKEN is required for mutations");
  }

  const url = `${SANITY_MUTATE_HOST}/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}?returnIds=true${
    options.returnDocuments ? "&returnDocuments=true" : ""
  }`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mutations }),
  });

  const body = (await response.json()) as { error?: { description?: string } };
  if (!response.ok || body.error) {
    throw new SanityHttpError(
      `[sanity] mutation failed (${response.status}): ${body.error?.description ?? "unknown"}`,
      response.status,
    );
  }
  return body;
}
