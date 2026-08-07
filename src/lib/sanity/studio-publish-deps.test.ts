import { describe, expect, test } from "bun:test";

import {
  createStudioPublishDeps,
  normalizeSanityError,
} from "../../../studio/actions/publish-episode";
import { SanityHttpError } from "./http";

/**
 * The Studio's transport adapter (US-004).
 *
 * `publishEpisode()` arbitrates one retriable failure — a strict `create`
 * losing its compare-and-set — and recognises it as `SanityHttpError` with
 * `status === 409`. The Studio does not speak that: `@sanity/client` rejects
 * with `ClientError`, which carries the same HTTP status under a different
 * class on a different field (`statusCode`). Untranslated, a real Studio-side
 * 409 skips the retry entirely and surfaces to the editor as a raw client
 * error rather than "published by someone else".
 *
 * These tests pin the translation at the adapter boundary, where it belongs:
 * `publish.ts` stays transport-agnostic and knows only `SanityHttpError`.
 * `createStudioPublishDeps()` takes a client rather than calling `useClient()`
 * itself precisely so this can be exercised with no React and no Studio.
 */

/** The shape `@sanity/client` actually throws — `statusCode`, never `status`. */
class FakeClientError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ClientError";
    this.statusCode = statusCode;
  }
}

type FakeClient = Parameters<typeof createStudioPublishDeps>[0];

const clientThatThrows = (error: unknown): FakeClient =>
  ({
    getDocuments: () => Promise.resolve([]),
    mutate: () => Promise.reject(error),
  }) as unknown as FakeClient;

describe("normalizeSanityError", () => {
  test("a ClientError-shaped 409 becomes a SanityHttpError carrying status 409", () => {
    const result = normalizeSanityError(new FakeClientError("Document already exists", 409));

    expect(result).toBeInstanceOf(SanityHttpError);
    expect((result as SanityHttpError).status).toBe(409);
    expect((result as SanityHttpError).message).toBe("Document already exists");
  });

  test("a non-409 status is translated too, so it stays a 401 rather than becoming a conflict", () => {
    const result = normalizeSanityError(new FakeClientError("Unauthorized", 401));

    expect(result).toBeInstanceOf(SanityHttpError);
    expect((result as SanityHttpError).status).toBe(401);
  });

  test("an error with no numeric statusCode passes through untouched", () => {
    const network = new TypeError("Failed to fetch");

    expect(normalizeSanityError(network)).toBe(network);
  });

  test("non-object rejections pass through untouched", () => {
    expect(normalizeSanityError("nope")).toBe("nope");
    expect(normalizeSanityError(null)).toBe(null);
    expect(normalizeSanityError(undefined)).toBe(undefined);
  });
});

describe("createStudioPublishDeps: mutate", () => {
  test("rethrows a ClientError 409 as a SanityHttpError, which isCreateConflict() recognises", async () => {
    const deps = createStudioPublishDeps(
      clientThatThrows(new FakeClientError("Document already exists", 409)),
    );

    const error = await deps.mutate!([{ create: { _id: "e1" } }]).then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(SanityHttpError);
    expect((error as SanityHttpError).status).toBe(409);
  });

  test("lets a transport failure through as itself — never relabelled as a conflict", async () => {
    const network = new TypeError("Failed to fetch");
    const deps = createStudioPublishDeps(clientThatThrows(network));

    const error = await deps.mutate!([{ create: { _id: "e1" } }]).then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBe(network);
    expect(error).not.toBeInstanceOf(SanityHttpError);
  });

  test("passes the mutations through and returns the client's result when nothing throws", async () => {
    const seen: unknown[] = [];
    const client = {
      getDocuments: () => Promise.resolve([]),
      mutate: (mutations: unknown) => {
        seen.push(mutations);
        return Promise.resolve({ transactionId: "t1" });
      },
    } as unknown as FakeClient;

    const mutations = [{ create: { _id: "e1" } }];
    const result = await createStudioPublishDeps(client).mutate!(mutations);

    expect(seen).toEqual([mutations]);
    expect(result).toEqual({ transactionId: "t1" });
  });
});

describe("createStudioPublishDeps: getDocuments", () => {
  test("drops the nulls client.getDocuments() returns for missing ids", async () => {
    const client = {
      getDocuments: (ids: string[]) =>
        Promise.resolve(ids.map((id) => (id === "e1" ? { _id: "e1" } : null))),
      mutate: () => Promise.resolve(null),
    } as unknown as FakeClient;

    const docs = await createStudioPublishDeps(client).getDocuments!(["e1", "slugLock-x"]);

    expect(docs).toEqual([{ _id: "e1" } as unknown as Record<string, unknown>]);
  });
});
