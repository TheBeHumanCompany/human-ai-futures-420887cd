/**
 * Fault injection for the asset recovery script.
 *
 * The recovery run reported 46/46. That number is only worth anything if the
 * script is capable of reporting less — so these tests inject the three ways a
 * fetch can lie and assert each one is caught, named, and non-zero:
 *
 *   non-2xx        the obvious case
 *   truncated body a 200 with fewer bytes than the pointer declares. This is
 *                  the dangerous one: it writes a corrupt image that looks
 *                  like a successful recovery, and nothing downstream would
 *                  notice until the picture rendered broken in production.
 *   wrong MIME     a 200 serving an HTML error page as though it were a PNG
 *
 * Plus the properties the plan requires of the script itself: retry with
 * backoff, resume, and no silent skips.
 *
 * Run: bun test scripts/
 */

import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  BACKOFF_MS,
  MAX_ATTEMPTS,
  listPointerFiles,
  originFor,
  readPointer,
  recoverOne,
  targetNameFor,
  urlFor,
  type FetchImpl,
  type Pointer,
} from "./recover-assets.ts";

const POINTER: Pointer = {
  version: 1,
  asset_id: "4817afbf-f626-4295-838f-0fdbf2dbbf8c",
  project_id: "d03b88e4-8da1-457b-8afc-3c434677b299",
  url: "/__l5e/assets-v1/4817afbf-f626-4295-838f-0fdbf2dbbf8c/archive-adewolf.png",
  r2_key: "a/v1/x/y/archive-adewolf.png",
  original_filename: "archive-adewolf.png",
  size: 64,
  content_type: "image/png",
  created_at: "2026-08-04T18:05:43Z",
};

const goodBody = new Uint8Array(POINTER.size).fill(7);
const noSleep = async () => {};
const tmp = () => path.join(mkdtempSync(path.join(tmpdir(), "recover-")), "archive-adewolf.png");

describe("integrity — a 200 is not evidence", () => {
  test("a non-2xx response is reported as failed, with the asset_id", async () => {
    const fetchImpl: FetchImpl = async () => ({
      status: 503,
      contentType: "text/html",
      body: new Uint8Array(),
    });
    const { entry, report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });

    expect(entry).toBeNull();
    expect(report.status).toBe("failed");
    expect(report.asset_id).toBe(POINTER.asset_id);
    expect(report.error).toContain("503");
  });

  test("a truncated body is rejected even though the status is 200", async () => {
    // The failure mode that matters most. Without the size assertion this
    // writes a corrupt PNG and reports success.
    const fetchImpl: FetchImpl = async () => ({
      status: 200,
      contentType: "image/png",
      body: new Uint8Array(POINTER.size - 1).fill(7),
    });
    const target = tmp();
    const { entry, report } = await recoverOne(POINTER, target, { fetchImpl, sleepImpl: noSleep });

    expect(entry).toBeNull();
    expect(report.status).toBe("failed");
    expect(report.error).toContain("size mismatch");
    // And crucially: nothing was written. A half-file left on disk would be
    // indistinguishable from a good one on the next resume pass.
    expect(existsSync(target)).toBe(false);
  });

  test("an over-long body is rejected too — the assertion is equality, not a floor", async () => {
    const fetchImpl: FetchImpl = async () => ({
      status: 200,
      contentType: "image/png",
      body: new Uint8Array(POINTER.size + 1).fill(7),
    });
    const { entry, report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });
    expect(entry).toBeNull();
    expect(report.error).toContain("size mismatch");
  });

  test("a wrong MIME type is rejected — an HTML error page is not a PNG", async () => {
    const fetchImpl: FetchImpl = async () => ({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: goodBody,
    });
    const { entry, report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });

    expect(entry).toBeNull();
    expect(report.error).toContain("content-type mismatch");
  });

  test("a charset parameter on the right media type is NOT a mismatch", async () => {
    // A proxy is entitled to add parameters. Rejecting `image/png; charset=…`
    // would fail 46 good recoveries for a cosmetic difference.
    const fetchImpl: FetchImpl = async () => ({
      status: 200,
      contentType: "image/png; charset=binary",
      body: goodBody,
    });
    const { entry } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });
    expect(entry).not.toBeNull();
  });

  test("a transport error is caught and reported, not thrown", async () => {
    // A throw on asset 7 of 46 would abandon the other 39.
    const fetchImpl: FetchImpl = async () => {
      throw new Error("ECONNRESET");
    };
    const { entry, report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });
    expect(entry).toBeNull();
    expect(report.error).toContain("ECONNRESET");
  });
});

describe("success path", () => {
  test("a good response is written byte-identically and hashed", async () => {
    const fetchImpl: FetchImpl = async () => ({
      status: 200,
      contentType: "image/png",
      body: goodBody,
    });
    const target = tmp();
    const { entry, report } = await recoverOne(POINTER, target, { fetchImpl, sleepImpl: noSleep });

    expect(entry).not.toBeNull();
    expect(entry!.bytes).toBe(POINTER.size);
    expect(entry!.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.status).toBe("ok");
    expect(new Uint8Array(readFileSync(target))).toEqual(goodBody);
  });
});

describe("retry and backoff", () => {
  test("a transient failure is retried and then succeeds", async () => {
    let calls = 0;
    const fetchImpl: FetchImpl = async () => {
      calls += 1;
      return calls < 3
        ? { status: 502, contentType: null, body: new Uint8Array() }
        : { status: 200, contentType: "image/png", body: goodBody };
    };
    const { entry, report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });

    expect(entry).not.toBeNull();
    expect(calls).toBe(3);
    expect(report.attempts).toBe(3);
  });

  test("it gives up after MAX_ATTEMPTS rather than retrying forever", async () => {
    let calls = 0;
    const fetchImpl: FetchImpl = async () => {
      calls += 1;
      return { status: 500, contentType: null, body: new Uint8Array() };
    };
    const { report } = await recoverOne(POINTER, tmp(), { fetchImpl, sleepImpl: noSleep });

    expect(calls).toBe(MAX_ATTEMPTS);
    expect(report.attempts).toBe(MAX_ATTEMPTS);
    expect(report.status).toBe("failed");
  });

  test("backoff is exponential and is actually waited on", async () => {
    const waited: number[] = [];
    const fetchImpl: FetchImpl = async () => ({
      status: 500,
      contentType: null,
      body: new Uint8Array(),
    });
    await recoverOne(POINTER, tmp(), {
      fetchImpl,
      sleepImpl: async (ms) => {
        waited.push(ms);
      },
    });
    // MAX_ATTEMPTS attempts means MAX_ATTEMPTS - 1 waits.
    expect(waited).toEqual(BACKOFF_MS.slice(0, MAX_ATTEMPTS - 1));
    expect(waited[1]).toBeGreaterThan(waited[0]);
  });
});

describe("the pointer set is discovered, never hardcoded", () => {
  test("listPointerFiles reads the directory rather than a literal count", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pointers-"));
    writeFileSync(path.join(dir, "a.png.asset.json"), "{}");
    writeFileSync(path.join(dir, "b.jpg.asset.json"), "{}");
    writeFileSync(path.join(dir, "c.png"), "not a pointer");

    const found = listPointerFiles(dir);
    expect(found.length).toBe(2);
    expect(found.every((f) => f.endsWith(".asset.json"))).toBe(true);
  });

  test("the real repo's pointer set is non-empty and every pointer parses", () => {
    // The floor that keeps every assertion above from being vacuous against
    // this repo: if the glob broke, "all assets recovered" would be true of
    // zero assets.
    const files = listPointerFiles();
    expect(files.length).toBeGreaterThanOrEqual(40);
    for (const f of files) {
      const p = readPointer(f);
      expect(p.asset_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(p.size).toBeGreaterThan(0);
      expect(p.content_type).toMatch(/^image\//);
    }
  });

  test("a pointer missing a required field is a hard error, not a skip", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pointers-"));
    const bad = path.join(dir, "broken.png.asset.json");
    writeFileSync(bad, JSON.stringify({ asset_id: "x", project_id: "y", url: "/z" }));
    expect(() => readPointer(bad)).toThrow(/size/);
  });

  test("the target file lands beside its pointer, with the pointer suffix stripped", () => {
    expect(targetNameFor("/anywhere/hero.png.asset.json")).toBe("hero.png");
    expect(targetNameFor("/anywhere/guest-ep8.webp.asset.json")).toBe("guest-ep8.webp");
  });

  test("the fetch URL is built from the pointer's own project_id and url", () => {
    expect(originFor(POINTER)).toBe(`https://id-preview--${POINTER.project_id}.lovable.app`);
    expect(urlFor(POINTER)).toBe(`${originFor(POINTER)}${POINTER.url}`);
  });
});

describe("the committed manifest and report agree with the pointer set", () => {
  const REPO_ROOT = path.resolve(import.meta.dirname, "..");
  const manifestPath = path.join(REPO_ROOT, "src", "assets", "asset-recovery-manifest.json");
  const reportPath = path.join(REPO_ROOT, ".baseline", "asset-recovery-report.json");

  test("every pointer has exactly one manifest entry", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Array<{
      filename: string;
      sha256: string;
      bytes: number;
    }>;
    const expected = listPointerFiles()
      .map((f) => targetNameFor(f))
      .sort();
    expect(manifest.map((e) => e.filename).sort()).toEqual(expected);
    expect(new Set(manifest.map((e) => e.filename)).size).toBe(manifest.length);
  });

  test("every manifest entry describes a file that is actually on disk, at that hash", () => {
    // The manifest is the restore drill's source of truth. If it can drift
    // from the files beside it, the drill verifies a fiction.
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Array<{
      filename: string;
      sha256: string;
      bytes: number;
    }>;
    const hasher = new Bun.CryptoHasher("sha256");
    for (const entry of manifest) {
      const file = path.join(REPO_ROOT, "src", "assets", entry.filename);
      expect(existsSync(file)).toBe(true);
      const bytes = readFileSync(file);
      expect(bytes.byteLength).toBe(entry.bytes);
      const h = hasher.copy();
      h.update(bytes);
      expect(h.digest("hex")).toBe(entry.sha256);
    }
  });

  test("the report names every asset and hides no failure", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Array<{
      asset_id: string;
      status: string;
    }>;
    expect(report.length).toBe(listPointerFiles().length);
    const failed = report.filter((r) => r.status === "failed");
    expect(failed.map((f) => f.asset_id)).toEqual([]);
  });

  test("the four archive portraits carry a host-independent second source", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Array<{
      filename: string;
      sha256: string;
      bytes: number;
      alt_source?: { ref: string; sha256: string; bytes: number };
    }>;
    const portraits = manifest.filter((e) =>
      /^archive-(adewolf|anton|arlina|bella)\.png$/.test(e.filename),
    );
    expect(portraits.length).toBe(4);
    for (const p of portraits) {
      expect(p.alt_source).toBeDefined();
      expect(p.alt_source!.sha256).toMatch(/^[0-9a-f]{64}$/);
      // The alt source is a JPEG re-encode of the same picture, so it must NOT
      // be byte-identical. If these ever matched, one of the two reads is
      // wrong and the "second source" is a copy of the first.
      expect(p.alt_source!.sha256).not.toBe(p.sha256);
    }
  });
});
