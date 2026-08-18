/**
 * Bulk asset recovery from the Lovable preview host.
 *
 * ── Why this is the first thing that happens ────────────────────────────────
 *
 * 45 of the 46 `src/assets/*.asset.json` pointers have no binary in this repo.
 * A pointer is not an image: it is `{asset_id, url, size, content_type}` and a
 * path — `/__l5e/assets-v1/<id>/<file>` — that ONLY Lovable's own hosting
 * serves. Nothing rewrites it at build time, so it 404s in production, and if
 * the preview host goes away the images are gone with it. Every other risk in
 * this plan is recoverable by editing code. This one is not.
 *
 * So: capture first, commit second, and never skip silently.
 *
 * ── What "recovered" has to mean ───────────────────────────────────────────
 *
 * A 200 is not evidence. Cloudflare will happily serve an error page, a
 * truncated body, or the wrong object with a 200 on it. The pointer declares
 * both `size` and `content_type`, so recovery asserts BOTH against what
 * actually arrived, and records a SHA-256 of the bytes that were written. A
 * file that fails either assertion is not written and is reported as failed
 * with its `asset_id`.
 *
 * ── Resumability ───────────────────────────────────────────────────────────
 *
 * 85 MB over 46 requests will fail partway at least once. A re-run must be
 * free, so an asset whose file already exists AND whose SHA-256 already
 * matches the manifest is skipped. Note the "and": existence alone is not a
 * skip condition, because a half-written file from an interrupted run exists.
 *
 * ── Outputs ────────────────────────────────────────────────────────────────
 *
 *   src/assets/<name>              the byte-identical original, beside its pointer
 *   src/assets/asset-recovery-manifest.json   {asset_id, filename, sha256, bytes}
 *   .baseline/asset-recovery-report.json      per-asset status — tracked, so a
 *                                             failure is visible in review, not
 *                                             only in a console someone closed
 *   docs/asset-inventory.json                 the derived count every prod gate
 *                                             compares against (never a literal)
 *
 * The originals will never appear in the Vite build manifest, and that is
 * correct: nothing imports them, so Vite never processes them. AC-1.1 checks
 * original SHA-256s; AC-1.6 checks *derivative* URLs. They never meet. Do not
 * "fix" the absence by importing 85 MB into the bundle.
 *
 * Usage:
 *   bun run scripts/recover-assets.ts            # recover, resumable
 *   bun run scripts/recover-assets.ts --verify   # re-check only, fetch nothing
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS_DIR = path.join(REPO_ROOT, "src", "assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, "asset-recovery-manifest.json");
const REPORT_PATH = path.join(REPO_ROOT, ".baseline", "asset-recovery-report.json");
const INVENTORY_PATH = path.join(REPO_ROOT, "docs", "asset-inventory.json");

/** Attempts per asset, and the backoff between them. */
export const MAX_ATTEMPTS = 3;
export const BACKOFF_MS = [1_000, 4_000, 16_000];

export type Pointer = {
  version: number;
  asset_id: string;
  project_id: string;
  url: string;
  r2_key: string;
  original_filename: string;
  size: number;
  content_type: string;
  created_at: string;
};

/**
 * Where an asset came from.
 *
 * `recovered` — fetched from the Lovable preview host against a
 *   `*.asset.json` pointer that declares its size and content type. Integrity
 *   is checkable against the pointer, and re-running recovery reproduces it.
 *
 * `supplied` — handed over directly (designer, WhatsApp, a crop of video
 *   content). There is no pointer, there never was one, and no fetch can
 *   reproduce it. Forcing one of these into the recovery shape would mean
 *   inventing a `url` and a pointer `size` to check against — a fabricated
 *   provenance that reads, to every later gate, exactly like a real one.
 *
 * The distinction is load-bearing rather than descriptive: `recover-assets.ts`
 * rebuilds the manifest from the pointer glob on every run, so an entry that
 * is not marked `supplied` and has no pointer is silently dropped, and AC-7.2
 * then fails on an asset that is sitting right there.
 */
export type AssetSource = "recovered" | "supplied";

export type ManifestEntry = {
  asset_id: string;
  filename: string;
  sha256: string;
  bytes: number;
  content_type: string;
  source?: AssetSource;
  /**
   * Required when `source` is "supplied": who provided it, when, and what was
   * done to it. A supplied asset has no pointer to check against, so this
   * prose is the only provenance it will ever have.
   */
  provenance?: string;
  /**
   * A WebP derivative that serves the browser, beside the original. Recorded
   * with its own hash and byte count because it is a DIFFERENT image — never
   * compared against the original's.
   */
  derivative?: {
    filename: string;
    sha256: string;
    bytes: number;
    content_type: string;
    note: string;
  };
  /**
   * A host-independent second copy of the same *picture*, recovered from a
   * blob on the reference branch. Deliberately NOT byte-identical — those
   * blobs are JPEG re-encodes of these PNGs — so it carries its own hash and
   * its own byte count and is never compared against the original's. It
   * exists so that "the Lovable host went dark" is not the same event as
   * "these four portraits are unrecoverable".
   */
  alt_source?: { ref: string; path: string; sha256: string; bytes: number; note: string };
};

export type ReportEntry = {
  asset_id: string;
  filename: string;
  status: "ok" | "skipped-already-present" | "failed";
  attempts: number;
  bytes?: number;
  sha256?: string;
  url: string;
  error?: string;
};

export type FetchImpl = (url: string) => Promise<{
  status: number;
  contentType: string | null;
  body: Uint8Array;
}>;

const realFetch: FetchImpl = async (url) => {
  const res = await fetch(url, {
    headers: { "user-agent": "thebehumancompany-asset-recovery/1.0" },
    redirect: "follow",
  });
  const body = new Uint8Array(await res.arrayBuffer());
  return { status: res.status, contentType: res.headers.get("content-type"), body };
};

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every `*.asset.json` under src/assets, sorted. Never a hardcoded 46. */
export function listPointerFiles(dir = ASSETS_DIR): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".asset.json"))
    .sort()
    .map((name) => path.join(dir, name));
}

/** `hero.png.asset.json` -> `hero.png`, beside the pointer. */
export const targetNameFor = (pointerFile: string) =>
  path.basename(pointerFile).replace(/\.asset\.json$/, "");

export function readPointer(file: string): Pointer {
  const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<Pointer>;
  for (const key of ["asset_id", "project_id", "url", "size", "content_type"] as const) {
    if (raw[key] === undefined) {
      throw new Error(`${path.basename(file)}: pointer is missing required field '${key}'`);
    }
  }
  return raw as Pointer;
}

export const originFor = (pointer: Pointer) =>
  `https://id-preview--${pointer.project_id}.lovable.app`;

export const urlFor = (pointer: Pointer) => `${originFor(pointer)}${pointer.url}`;

/**
 * Normalizes `image/png; charset=utf-8` down to `image/png`. The pointer
 * declares a bare media type and a proxy is entitled to add parameters; a
 * parameter is not a mismatch. A different media type is.
 */
const mediaType = (value: string | null) => (value ?? "").split(";")[0].trim().toLowerCase();

export type RecoveryOutcome = { entry: ManifestEntry | null; report: ReportEntry };

/**
 * One asset, with retries. Never throws for a recoverable condition — a
 * failure is a reported failure, because a thrown error on asset 7 of 46
 * would abandon the other 39.
 */
export async function recoverOne(
  pointer: Pointer,
  targetPath: string,
  opts: { fetchImpl?: FetchImpl; sleepImpl?: (ms: number) => Promise<void>; write?: boolean } = {},
): Promise<RecoveryOutcome> {
  const doFetch = opts.fetchImpl ?? realFetch;
  const doSleep = opts.sleepImpl ?? sleep;
  const write = opts.write ?? true;
  const url = urlFor(pointer);
  const filename = path.basename(targetPath);

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await doFetch(url);

      if (res.status < 200 || res.status >= 300) {
        lastError = `HTTP ${res.status}`;
      } else if (res.body.byteLength !== pointer.size) {
        // The single most important assertion here. A truncated transfer is
        // the failure mode this whole script exists to not paper over, and it
        // arrives as a 200 with a short body.
        lastError = `size mismatch: got ${res.body.byteLength} bytes, pointer declares ${pointer.size}`;
      } else if (mediaType(res.contentType) !== mediaType(pointer.content_type)) {
        lastError = `content-type mismatch: got '${res.contentType}', pointer declares '${pointer.content_type}'`;
      } else {
        const digest = sha256(res.body);
        if (write) writeFileSync(targetPath, res.body);
        return {
          entry: {
            asset_id: pointer.asset_id,
            filename,
            sha256: digest,
            bytes: res.body.byteLength,
            content_type: mediaType(pointer.content_type),
          },
          report: {
            asset_id: pointer.asset_id,
            filename,
            status: "ok",
            attempts: attempt,
            bytes: res.body.byteLength,
            sha256: digest,
            url,
          },
        };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_ATTEMPTS) await doSleep(BACKOFF_MS[attempt - 1] ?? 16_000);
  }

  return {
    entry: null,
    report: {
      asset_id: pointer.asset_id,
      filename,
      status: "failed",
      attempts: MAX_ATTEMPTS,
      url,
      error: lastError || "unknown failure",
    },
  };
}

/**
 * The four Human Archive portraits also exist as JPEG blobs on the reference
 * branch. Reading a blob is not merging: `git show <ref>:<path>` touches no
 * ref, creates no commit, and leaves `git cherry` output unchanged. The
 * branch stays reference-only.
 */
const ALT_SOURCES: Record<string, { ref: string; path: string }> = {
  "archive-adewolf.png": {
    ref: "origin/feat/podbean-rss-integration",
    path: "src/assets/archive-adewolf.jpg",
  },
  "archive-anton.png": {
    ref: "origin/feat/podbean-rss-integration",
    path: "src/assets/archive-anton.jpg",
  },
  "archive-arlina.png": {
    ref: "origin/feat/podbean-rss-integration",
    path: "src/assets/archive-arlina.jpg",
  },
  "archive-bella.png": {
    ref: "origin/feat/podbean-rss-integration",
    path: "src/assets/archive-bella.jpg",
  },
};

function readAltSource(filename: string): ManifestEntry["alt_source"] {
  const src = ALT_SOURCES[filename];
  if (!src) return undefined;
  // `node:child_process` rather than `Bun.spawn`: this file is shipped script
  // code, typechecked by `tsc -p scripts` with `types: ["node"]` only. Reaching
  // for the `Bun` global here would mean adding bun-types to satisfy a
  // type-only need, and `bunfig.toml` enforces a 24h minimumReleaseAge on new
  // packages. The tests may use Bun freely — they are excluded from that project.
  const r = spawnSync("git", ["show", `${src.ref}:${src.path}`], {
    cwd: REPO_ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  const bytes = r.stdout ? new Uint8Array(r.stdout) : new Uint8Array();
  if (r.status !== 0 || bytes.byteLength === 0) return undefined;
  return {
    ref: src.ref,
    path: src.path,
    sha256: sha256(bytes),
    bytes: bytes.byteLength,
    note:
      "Host-independent second source, read as a blob — never merged or cherry-picked. " +
      "A JPEG re-encode of the same picture, so its hash and size intentionally differ " +
      "from the PNG original above and must never be compared against them.",
  };
}

// ── main ────────────────────────────────────────────────────────────────────

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const verifyOnly = argv.includes("--verify");

  const pointerFiles = listPointerFiles();
  if (pointerFiles.length === 0) {
    console.error("FAIL: no *.asset.json pointers found under src/assets — nothing to recover.");
    console.error("A 'success' here would be vacuous, so this is an error, not a no-op.");
    return 1;
  }
  console.log(`${pointerFiles.length} pointers found under src/assets/`);

  const priorManifest: ManifestEntry[] = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
    : [];
  const priorByName = new Map(priorManifest.map((e) => [e.filename, e]));

  const manifest: ManifestEntry[] = [];
  const report: ReportEntry[] = [];

  for (const pointerFile of pointerFiles) {
    const pointer = readPointer(pointerFile);
    const filename = targetNameFor(pointerFile);
    const targetPath = path.join(ASSETS_DIR, filename);
    const label = `${filename} (${pointer.asset_id})`;

    // Resume. Existence alone is not enough — an interrupted write leaves a
    // file behind. The file has to hash to what the manifest recorded, or, if
    // there is no manifest entry yet, to match the size the pointer declares
    // and then be hashed fresh.
    if (existsSync(targetPath)) {
      const bytes = new Uint8Array(readFileSync(targetPath));
      const digest = sha256(bytes);
      const prior = priorByName.get(filename);
      const sizeOk = bytes.byteLength === pointer.size;
      const hashOk = prior ? prior.sha256 === digest : true;
      if (sizeOk && hashOk) {
        manifest.push({
          asset_id: pointer.asset_id,
          filename,
          sha256: digest,
          bytes: bytes.byteLength,
          content_type: mediaType(pointer.content_type),
          source: "recovered",
          alt_source: readAltSource(filename),
        });
        report.push({
          asset_id: pointer.asset_id,
          filename,
          status: "skipped-already-present",
          attempts: 0,
          bytes: bytes.byteLength,
          sha256: digest,
          url: urlFor(pointer),
        });
        console.log(`  skip  ${label} — already present, ${bytes.byteLength} bytes`);
        continue;
      }
      console.log(
        `  redo  ${label} — on disk but ${sizeOk ? "hash" : "size"} disagrees; re-fetching`,
      );
    }

    if (verifyOnly) {
      report.push({
        asset_id: pointer.asset_id,
        filename,
        status: "failed",
        attempts: 0,
        url: urlFor(pointer),
        error: "--verify: file absent or failed integrity, and fetching is disabled",
      });
      console.log(`  MISS  ${label}`);
      continue;
    }

    const outcome = await recoverOne(pointer, targetPath);
    if (outcome.entry) {
      outcome.entry.source = "recovered";
      outcome.entry.alt_source = readAltSource(filename);
      manifest.push(outcome.entry);
      console.log(
        `  ok    ${label} — ${outcome.entry.bytes} bytes, sha256 ${outcome.entry.sha256.slice(0, 12)}…` +
          (outcome.report.attempts > 1 ? ` (attempt ${outcome.report.attempts})` : ""),
      );
    } else {
      console.error(`  FAIL  ${label} — ${outcome.report.error}`);
    }
    report.push(outcome.report);
  }

  // Carry SUPPLIED assets across the rebuild.
  //
  // This loop reconstructs the manifest from the pointer glob, which is what
  // keeps the recovered set honest — an asset whose pointer is deleted stops
  // being claimed. But a supplied asset has no pointer and never did, so the
  // same mechanism would drop it on every run, and AC-7.2 would fail on a file
  // sitting in `src/assets/` untouched. They are re-verified against disk
  // rather than trusted from the old manifest: a manifest that can drift from
  // the bytes beside it describes a fiction, and the restore drill would then
  // verify that fiction.
  for (const entry of priorManifest) {
    if (entry.source !== "supplied") continue;
    const file = path.join(ASSETS_DIR, entry.filename);
    if (!existsSync(file)) {
      report.push({
        asset_id: entry.asset_id,
        filename: entry.filename,
        status: "failed",
        attempts: 0,
        url: "(supplied — no source URL)",
        error: "manifest claims a supplied asset that is not on disk",
      });
      console.error(
        `  FAIL  ${entry.filename} (${entry.asset_id}) — supplied asset missing from disk`,
      );
      continue;
    }
    const bytes = new Uint8Array(readFileSync(file));
    const digest = sha256(bytes);
    if (digest !== entry.sha256 || bytes.byteLength !== entry.bytes) {
      report.push({
        asset_id: entry.asset_id,
        filename: entry.filename,
        status: "failed",
        attempts: 0,
        url: "(supplied — no source URL)",
        error: `supplied asset changed on disk: sha256 ${digest} (manifest ${entry.sha256}), ${bytes.byteLength} bytes (manifest ${entry.bytes})`,
      });
      console.error(
        `  FAIL  ${entry.filename} (${entry.asset_id}) — supplied asset does not match its manifest hash`,
      );
      continue;
    }
    manifest.push(entry);
    report.push({
      asset_id: entry.asset_id,
      filename: entry.filename,
      status: "skipped-already-present",
      attempts: 0,
      bytes: bytes.byteLength,
      sha256: digest,
      url: "(supplied — no source URL)",
    });
    console.log(
      `  keep  ${entry.filename} (${entry.asset_id}) — supplied, ${bytes.byteLength} bytes`,
    );
  }

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  mkdirSync(path.dirname(INVENTORY_PATH), { recursive: true });

  manifest.sort((a, b) => a.filename.localeCompare(b.filename));
  report.sort((a, b) => a.filename.localeCompare(b.filename));

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

  // The inventory is what every production image gate counts against. It is
  // derived here, from the pointer set, so no gate ever contains a literal a
  // scan could have derived.
  writeFileSync(
    INVENTORY_PATH,
    JSON.stringify(
      manifest.map((e) => ({ filename: e.filename, bytes: e.bytes, content_type: e.content_type })),
      null,
      2,
    ) + "\n",
  );

  const failures = report.filter((r) => r.status === "failed");
  const recovered = report.filter((r) => r.status !== "failed");
  console.log("");
  const suppliedCount = manifest.filter((e) => e.source === "supplied").length;
  console.log(
    `${recovered.length} assets present and integrity-checked ` +
      `(${pointerFiles.length} recovered from pointers, ${suppliedCount} supplied) ` +
      `(${manifest.reduce((n, e) => n + e.bytes, 0)} bytes total)`,
  );
  console.log(`manifest: ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
  console.log(`report:   ${path.relative(REPO_ROOT, REPORT_PATH)}`);

  if (failures.length > 0) {
    console.error("");
    console.error(`FAIL: ${failures.length} asset(s) could not be recovered. Named, not skipped:`);
    for (const f of failures) console.error(`  - ${f.asset_id}  ${f.filename}  ${f.error}`);
    return 1;
  }
  return 0;
}

/**
 * Registers an asset that was SUPPLIED rather than recovered.
 *
 * Team-supplied images (a designer's crop, a still from video content) have no
 * `*.asset.json` pointer and never will. They still have to appear in the
 * manifest, because AC-7.2 asserts every rendered asset's SHA-256 resolves
 * there — an image dropped straight into `src/assets/` would either fail that
 * gate or, worse, prompt someone to loosen it.
 *
 * This is the entry point for them, rather than a hand-edited manifest, for
 * three reasons: the hash is computed rather than typed, `provenance` is
 * mandatory so an asset can never arrive without a recorded origin, and the
 * WebP derivative is registered with its own hash so no later check mistakes
 * it for a corrupted copy of the original.
 *
 * Usage:
 *   bun run scripts/recover-assets.ts --add-supplied <file> \
 *     --provenance "who supplied it, when, and what was done to it" \
 *     [--derivative <file>] [--as <name-in-src-assets>]
 */
export function addSupplied(argv: string[]): number {
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const source = arg("--add-supplied");
  const provenance = arg("--provenance");
  const derivative = arg("--derivative");
  const as = arg("--as");

  if (!source) {
    console.error(
      "usage: --add-supplied <file> --provenance <text> [--derivative <file>] [--as <name>]",
    );
    return 2;
  }
  if (!provenance || provenance.trim().length < 20) {
    console.error("FAIL: --provenance is required and must actually say something (>= 20 chars).");
    console.error("  A supplied asset has no pointer to check against, so this text is the only");
    console.error("  provenance it will ever have. 'from the designer' is not provenance.");
    return 1;
  }

  const filename = as ?? path.basename(source);
  const target = path.join(ASSETS_DIR, filename);

  if (!existsSync(target)) {
    console.error(
      `FAIL: ${filename} is not in src/assets/. Copy it there first, then register it.`,
    );
    return 1;
  }
  if (existsSync(path.join(ASSETS_DIR, `${filename}.asset.json`))) {
    console.error(
      `FAIL: ${filename} has a *.asset.json pointer, so it is a RECOVERED asset, not a supplied one.`,
    );
    console.error("  Run recovery instead; its integrity is checkable against the pointer.");
    return 1;
  }

  const bytes = new Uint8Array(readFileSync(target));
  const digest = sha256(bytes);

  const manifest: ManifestEntry[] = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
    : [];

  const entry: ManifestEntry = {
    // Not a Lovable asset_id — there is no Lovable asset. The hash prefix is
    // used so the id is derived from the bytes rather than invented, and so it
    // is visibly not a UUID.
    asset_id: `supplied-${digest.slice(0, 12)}`,
    filename,
    sha256: digest,
    bytes: bytes.byteLength,
    content_type: filename.endsWith(".png")
      ? "image/png"
      : filename.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg",
    source: "supplied",
    provenance: provenance.trim(),
  };

  if (derivative) {
    const derivName = path.basename(derivative);
    const derivPath = path.join(ASSETS_DIR, derivName);
    if (!existsSync(derivPath)) {
      console.error(`FAIL: derivative ${derivName} is not in src/assets/`);
      return 1;
    }
    const derivBytes = new Uint8Array(readFileSync(derivPath));
    entry.derivative = {
      filename: derivName,
      sha256: sha256(derivBytes),
      bytes: derivBytes.byteLength,
      content_type: "image/webp",
      note:
        "WebP derivative that serves the browser. A different image from the original above, " +
        "so its hash and byte count intentionally differ and must never be compared against them.",
    };
  }

  const existing = manifest.findIndex((e) => e.filename === filename);
  if (existing >= 0) {
    if (manifest[existing].sha256 === digest) {
      console.log(`${filename} is already registered at this hash — nothing to do.`);
      return 0;
    }
    console.log(`${filename} is registered at a different hash; updating.`);
    manifest[existing] = entry;
  } else {
    manifest.push(entry);
  }

  manifest.sort((a, b) => a.filename.localeCompare(b.filename));
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`registered ${filename} as SUPPLIED`);
  console.log(`  asset_id  ${entry.asset_id}`);
  console.log(`  sha256    ${entry.sha256}`);
  console.log(`  bytes     ${entry.bytes}`);
  if (entry.derivative) {
    console.log(`  webp      ${entry.derivative.filename} (${entry.derivative.bytes} bytes)`);
  }
  console.log("");
  console.log("Now re-run recovery so the report and inventory are regenerated:");
  console.log("  bun run scripts/recover-assets.ts");
  return 0;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  process.exit(argv.includes("--add-supplied") ? addSupplied(argv) : await main(argv));
}
