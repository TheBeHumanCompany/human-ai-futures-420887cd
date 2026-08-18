import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ARCHIVE } from "./content";
import baseline from "../../docs/archive-baseline.json";

/**
 * The Human Archive, guarded through the restructure (AC-7.1, AC-7.2, AC-7.3).
 *
 * ── Why a baseline file and not literals in here ───────────────────────────
 *
 * AC-7.1 says the four entries keep "their existing quotes, locations and
 * archive numbers". "Existing" is a claim about the past, so the criterion is
 * unprovable without a record of what they were before the work started.
 * `docs/archive-baseline.json` is that record, extracted programmatically from
 * `main@a6a377a` rather than retyped — a hand-copied expectation can drift
 * toward whatever the code happens to say, which is exactly the failure mode
 * of an assertion that was edited to make a test pass.
 *
 * These are real people's words. A quote silently reflowed or a location
 * quietly corrected is a content defect no type checker can see and no
 * reviewer would catch by eye, which is why they are compared character for
 * character including the line breaks.
 *
 * `image` is deliberately absent from the baseline. It was a Lovable pointer's
 * `.url` at a6a377a — the production 404 this pass exists to fix — so pinning
 * it would pin the bug.
 */

const REPO_ROOT = path.resolve(import.meta.dir, "..", "..");

describe("AC-7.1 — the four entries are preserved", () => {
  test("the baseline itself is populated", () => {
    // Every comparison below is against this file. An empty baseline would
    // make all of them vacuously true.
    expect(baseline.entries.length).toBe(4);
    expect(baseline.count).toBe(4);
  });

  test("exactly four entries, in the same order", () => {
    expect(ARCHIVE.length).toBe(4);
    expect(ARCHIVE.map((e) => e.name)).toEqual(baseline.entries.map((e) => e.name));
    expect(ARCHIVE.map((e) => e.name)).toEqual(["ADEWOLF", "BELLA", "ANTON", "ARLINA"]);
  });

  test("every quote, location, archive number and slug is unchanged", () => {
    for (const [i, want] of baseline.entries.entries()) {
      const got = ARCHIVE[i];
      expect(got.name).toBe(want.name);
      expect(got.location).toBe(want.location);
      expect(got.no).toBe(want.no);
      expect(got.slug).toBe(want.slug);
      // Character for character, line breaks included. These are quoted words.
      expect(got.quote).toBe(want.quote);
    }
  });

  test("archive numbers and slugs are unique", () => {
    expect(new Set(ARCHIVE.map((e) => e.no)).size).toBe(ARCHIVE.length);
    expect(new Set(ARCHIVE.map((e) => e.slug)).size).toBe(ARCHIVE.length);
  });
});

describe("AC-7.2 — the portraits render from committed binaries", () => {
  test("every image is a bundled asset, never a Lovable pointer path", () => {
    for (const entry of ARCHIVE) {
      expect(typeof entry.image).toBe("string");
      expect(entry.image.length).toBeGreaterThan(0);
      // `/__l5e/assets-v1/...` is served only by Lovable's own hosting, so one
      // of these reaching a build is a guaranteed production 404. This is the
      // exact defect AC-7.2 exists to prevent recurring.
      expect(entry.image).not.toContain("__l5e");
      expect(entry.image).not.toContain(".asset.json");
      expect(entry.image).toMatch(/\.(png|jpe?g|webp|avif)$/i);
    }
  });

  test("each portrait's binary is on disk and in the recovery manifest", () => {
    // AC-7.2 says "committed binaries" — so the file has to exist, and its
    // hash has to be the one the manifest recorded. Checking only that the
    // import resolves would pass against a file that had been swapped.
    const manifest = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "src/assets/asset-recovery-manifest.json"), "utf8"),
    ) as Array<{ filename: string; sha256: string; bytes: number }>;

    const portraits = [
      "archive-adewolf.png",
      "archive-bella.png",
      "archive-anton.png",
      "archive-arlina.png",
    ];
    expect(portraits.length).toBe(ARCHIVE.length);

    const hasher = new Bun.CryptoHasher("sha256");
    for (const filename of portraits) {
      const entry = manifest.find((m) => m.filename === filename);
      expect(entry, `${filename} must be in the recovery manifest`).toBeDefined();

      const file = path.join(REPO_ROOT, "src/assets", filename);
      expect(existsSync(file), `${filename} must be committed`).toBe(true);

      const bytes = readFileSync(file);
      expect(bytes.byteLength).toBe(entry!.bytes);
      const h = hasher.copy();
      h.update(bytes);
      expect(h.digest("hex")).toBe(entry!.sha256);
    }
  });

  test("the ARCHIVE images resolve to the four portrait files", () => {
    // Bundlers rewrite the import to a fingerprinted URL, so the assertion is
    // on the stem rather than the whole path.
    const stems = ["archive-adewolf", "archive-bella", "archive-anton", "archive-arlina"];
    for (const [i, stem] of stems.entries()) {
      expect(ARCHIVE[i].image).toContain(stem);
    }
  });
});

describe("AC-7.3 — both surfaces read from one source", () => {
  test("the archive routes and the homepage section all consume ARCHIVE", () => {
    // "Zero broken images" on two surfaces is only checkable in a browser, and
    // e2e/surfaces.spec.ts does that. What IS checkable here is the property
    // that makes it hold: both surfaces render the same four entries from one
    // module, so neither can drift into its own hardcoded list of portraits.
    const consumers = [
      "src/routes/the-human-archive.tsx",
      "src/routes/human-archive.$slug.tsx",
      "src/components/human-archive-section.tsx",
    ];
    for (const file of consumers) {
      const full = path.join(REPO_ROOT, file);
      expect(existsSync(full), `${file} must exist`).toBe(true);
      const source = readFileSync(full, "utf8");
      expect(source, `${file} must consume ARCHIVE`).toContain("ARCHIVE");
      // No surface may reach for a pointer or an image path of its own.
      expect(source).not.toContain("__l5e");
      expect(source).not.toContain(".asset.json");
    }
  });
});
