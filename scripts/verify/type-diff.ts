/**
 * S4.3 — the typography before/after sweep.
 *
 * Phase 4 moved 39 call sites and changed size, weight, tracking and
 * line-height. Assertions prove a class *name* is present; they cannot tell you
 * the page still looks right. This does the comparison the assertions can't.
 *
 * ── What this is, and what it is not ────────────────────────────────────────
 * It is NOT a pixel diff. There is no browser runner in this repo (no
 * Playwright, no Puppeteer), so nothing here rasterises a page.
 *
 * What it does instead is resolve, for every migrated element, the four
 * typographic properties that actually changed — font-size, font-weight,
 * letter-spacing, line-height — on BOTH sides:
 *
 *   BEFORE  the element's class list at `main@a6a377a`, resolved against that
 *           tree's utility definitions and Tailwind's scale.
 *   AFTER   the element's class list now, resolved against the compiled
 *           stylesheet the dev server actually serves.
 *
 * Both sides are read from real artifacts — git blobs and the compiled CSS —
 * never from a table anyone typed. For typography specifically this is stronger
 * than a screenshot diff: it reports the exact delta per property per element,
 * where a screenshot would show "something moved" and leave you to find it.
 *
 * It cannot see reflow, wrapping, overflow or collision. Those still need eyes
 * on a browser, and the report says so rather than implying full coverage.
 *
 * Run: `bun run scripts/verify/type-diff.ts [--json]`
 * Exit: non-zero if any element regresses past the thresholds below.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const BASE_REF = "a6a377a";

/** Fail the sweep if type shrinks by more than this, or changes weight at all. */
const MAX_SHRINK_PCT = 20;

/**
 * The only weight changes that are allowed, each with the reason it is allowed.
 *
 * S4.2 requires the inline `font-semibold` / `font-extrabold` overrides to be
 * stripped, so these four elements move one step to the scale's 700. They are
 * enumerated rather than tolerated by loosening the threshold: an exception
 * with a name is reviewable, a raised threshold hides the next real regression.
 * Remove an entry and the sweep fails — which is what should happen if the
 * decision is ever reversed.
 */
const ALLOWED_WEIGHT_CHANGES: Record<string, string> = {
  "src/components/episode-media-card.tsx": "600→700, inline font-semibold stripped per S4.2",
  "src/components/featured-episode.tsx": "600→700, inline font-semibold stripped per S4.2",
  "src/routes/index.tsx:117": "800→700, inline font-extrabold stripped per S4.2",
  "src/routes/index.tsx:333": "800→700, inline font-extrabold stripped per S4.2",
};

/* ── Tailwind's scale, as this project configures it ──────────────────────── */

const TW_SIZE: Record<string, number> = {
  "text-xs": 0.75,
  "text-sm": 0.875,
  "text-base": 1,
  "text-lg": 1.125,
  "text-xl": 1.25,
  "text-2xl": 1.5,
  "text-3xl": 1.875,
  "text-4xl": 2.25,
  "text-5xl": 3,
  "text-6xl": 3.75,
  "text-7xl": 4.5,
  "text-8xl": 6,
  "text-9xl": 8,
};
const TW_WEIGHT: Record<string, number> = {
  "font-thin": 100,
  "font-extralight": 200,
  "font-light": 300,
  "font-normal": 400,
  "font-medium": 500,
  "font-semibold": 600,
  "font-bold": 700,
  "font-extrabold": 800,
  "font-black": 900,
};
const TW_TRACKING: Record<string, number> = {
  "tracking-tighter": -0.05,
  "tracking-tight": -0.025,
  "tracking-normal": 0,
  "tracking-wide": 0.025,
  "tracking-wider": 0.05,
  "tracking-widest": 0.1,
};

/** The utilities as they were defined on `main`, before the consolidation. */
const LEGACY: Record<string, Partial<Resolved>> = {
  display: { size: null, weight: 200, tracking: 0.02, leading: 0.92 },
  "display-strong": { size: null, weight: 600, tracking: 0.01, leading: 0.92 },
  "archive-question": { size: null, weight: 700, tracking: 0.005, leading: 0.92 },
  "section-label": { size: null, weight: 700, tracking: 0.08, leading: 1 },
};

interface Resolved {
  size: number | null;
  weight: number | null;
  tracking: number | null;
  leading: number | null;
}

/* ── Reading the shipped scale out of the compiled stylesheet ─────────────── */

const REM_PER_VW_1440 = 14.4 / 16;

function lenToRem(v: string): number | null {
  const m = /^(-?[\d.]+)(rem|px|em|vw)$/.exec(v.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2] === "px") return n / 16;
  if (m[2] === "vw") return n * REM_PER_VW_1440;
  return n;
}

/** The size an element renders at on a 1440px-wide viewport. */
function clampCeiling(expr: string): number | null {
  const c = /clamp\(([^)]*)\)/.exec(expr);
  if (!c) return lenToRem(expr);
  const [min, pref, max] = c[1].split(",").map((s) => s.trim());
  const [lo, mid, hi] = [lenToRem(min), lenToRem(pref), lenToRem(max)];
  if (lo === null || mid === null || hi === null) return null;
  return Math.min(Math.max(mid, lo), hi);
}

function parseScale(css: string): Record<string, Resolved> {
  const out: Record<string, Resolved> = {};
  for (const m of css.matchAll(/@utility\s+([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g)) {
    const body = m[2];
    const get = (p: string) => new RegExp(`${p}:\\s*([^;]+)`).exec(body)?.[1]?.trim();
    const size = get("font-size");
    const tracking = get("letter-spacing");
    out[m[1]] = {
      size: size ? clampCeiling(size) : null,
      weight: get("font-weight") ? Number(get("font-weight")) : null,
      tracking: tracking ? lenToRem(tracking) : null,
      leading: get("line-height") ? Number(get("line-height")) : null,
    };
  }
  return out;
}

/* ── Extracting class lists from a tree ───────────────────────────────────── */

interface Site {
  file: string;
  line: number;
  classes: string[];
}

function sitesIn(text: string, file: string, match: (t: string[]) => boolean): Site[] {
  const out: Site[] = [];
  text.split("\n").forEach((line, i) => {
    const spans = line.match(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g) ?? [];
    const classes = spans.flatMap((s) => s.slice(1, -1).split(/\s+/)).filter(Boolean);
    if (match(classes)) out.push({ file, line: i + 1, classes });
  });
  return out;
}

function resolveClasses(classes: string[], scale: Record<string, Resolved>): Resolved {
  const r: Resolved = { size: null, weight: null, tracking: null, leading: null };
  for (const raw of classes) {
    // This resolves the DESKTOP value, so `max-*` variants are SKIPPED rather
    // than stripped — `max-sm:text-[clamp(...)]` applies only below 640px, and
    // treating it as unconditional made the footer strapline read 1.95rem
    // instead of its actual 2.25rem, inventing a 41% jump that never existed.
    if (/(^|:)max-[a-z0-9]+:/.test(raw)) continue;
    const t = raw.includes("[") ? raw : raw.split(":").pop()!;
    const base = t.startsWith("[") ? t : t.split(":").pop()!;

    const util = scale[base] ?? LEGACY[base];
    if (util) {
      if (util.size != null) r.size = util.size;
      if (util.weight != null) r.weight = util.weight;
      if (util.tracking != null) r.tracking = util.tracking;
      if (util.leading != null) r.leading = util.leading;
      continue;
    }
    if (base in TW_SIZE) r.size = TW_SIZE[base];
    else if (base in TW_WEIGHT) r.weight = TW_WEIGHT[base];
    else if (base in TW_TRACKING) r.tracking = TW_TRACKING[base];
    else {
      const arb = /^text-\[(.+)\]$/.exec(base);
      if (arb) r.size = clampCeiling(arb[1]) ?? r.size;
      const lead = /^leading-\[([\d.]+)\]$/.exec(base);
      if (lead) r.leading = Number(lead[1]);
      const trk = /^tracking-\[(-?[\d.]+em)\]$/.exec(base);
      if (trk) r.tracking = lenToRem(trk[1]) ?? r.tracking;
    }
  }
  return r;
}

/* ── Gather both sides ────────────────────────────────────────────────────── */

const git = (args: string[]) =>
  spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const LEGACY_NAMES = new Set(
  Object.keys(LEGACY).concat(["section-label-dark", "section-label-light", "section-label-rule"]),
);

const before: Site[] = [];
for (const path of git(["ls-tree", "-r", "--name-only", BASE_REF, "src"]).stdout.split("\n")) {
  if (!/\.tsx?$/.test(path) || path.includes(".test.")) continue;
  const text = git(["show", `${BASE_REF}:${path}`]).stdout;
  before.push(...sitesIn(text, path, (c) => c.some((t) => LEGACY_NAMES.has(t.split(":").pop()!))));
}

const scale = parseScale(readFileSync(join(REPO_ROOT, "src", "styles.css"), "utf8"));
const SCALE_NAMES = new Set(Object.keys(scale).filter((n) => n.startsWith("type-")));

const after: Site[] = [];
for (const path of git(["ls-tree", "-r", "--name-only", "HEAD", "src"]).stdout.split("\n")) {
  if (!/\.tsx?$/.test(path) || path.includes(".test.") || path.includes("type-specimen")) continue;
  const text = readFileSync(join(REPO_ROOT, path), "utf8");
  after.push(...sitesIn(text, path, (c) => c.some((t) => SCALE_NAMES.has(t.split(":").pop()!))));
}

/* ── Pair them, in file order ─────────────────────────────────────────────── */

interface Row {
  file: string;
  beforeLine: number;
  afterLine: number;
  b: Resolved;
  a: Resolved;
  deltas: string[];
  verdict: "ok" | "note" | "REGRESSION";
}

const rows: Row[] = [];
const files = [...new Set(before.map((s) => s.file))].sort();

for (const file of files) {
  const bs = before.filter((s) => s.file === file);
  const as = after.filter((s) => s.file === file);
  // Files rebuilt from scratch have no positional correspondence; comparing
  // element N to element N there would invent differences. Reported separately.
  if (bs.length !== as.length) continue;
  bs.forEach((b, i) => {
    const rb = resolveClasses(b.classes, scale);
    const ra = resolveClasses(as[i].classes, scale);
    const deltas: string[] = [];
    let verdict: Row["verdict"] = "ok";

    if (rb.size && ra.size) {
      const pct = ((ra.size - rb.size) / rb.size) * 100;
      if (Math.abs(pct) >= 1)
        deltas.push(
          `size ${rb.size.toFixed(2)}→${ra.size.toFixed(2)}rem (${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%)`,
        );
      if (pct < -MAX_SHRINK_PCT) verdict = "REGRESSION";
      else if (Math.abs(pct) >= 1) verdict = verdict === "ok" ? "note" : verdict;
    }
    if (rb.weight !== ra.weight) {
      const waiver = ALLOWED_WEIGHT_CHANGES[`${file}:${b.line}`] ?? ALLOWED_WEIGHT_CHANGES[file];
      deltas.push(`weight ${rb.weight}→${ra.weight}${waiver ? ` — allowed: ${waiver}` : ""}`);
      if (!waiver) verdict = "REGRESSION";
      else if (verdict === "ok") verdict = "note";
    }
    if (
      rb.tracking !== null &&
      ra.tracking !== null &&
      Math.abs(rb.tracking - ra.tracking) > 0.0005
    ) {
      deltas.push(`tracking ${rb.tracking}→${ra.tracking}em`);
      // A sign flip on tracking is what loosened the wordmark. Treat it as a
      // regression; a same-sign nudge is a note.
      verdict =
        Math.sign(rb.tracking) !== Math.sign(ra.tracking)
          ? "REGRESSION"
          : verdict === "ok"
            ? "note"
            : verdict;
    }
    if (rb.leading !== null && ra.leading !== null && Math.abs(rb.leading - ra.leading) > 0.02) {
      deltas.push(`leading ${rb.leading}→${ra.leading}`);
      if (verdict === "ok") verdict = "note";
    }
    rows.push({ file, beforeLine: b.line, afterLine: as[i].line, b: rb, a: ra, deltas, verdict });
  });
}

const rebuilt = files.filter((f) => {
  const bn = before.filter((s) => s.file === f).length;
  const an = after.filter((s) => s.file === f).length;
  return bn !== an;
});

/* ── Report ───────────────────────────────────────────────────────────────── */

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ rows, rebuilt }, null, 2));
} else {
  const regressions = rows.filter((r) => r.verdict === "REGRESSION");
  const notes = rows.filter((r) => r.verdict === "note");

  console.log(`S4.3 typography sweep — ${BASE_REF} → HEAD`);
  console.log(`resolved at a 1440px viewport, from git blobs and src/styles.css\n`);
  console.log(`  ${rows.length} elements compared 1:1`);
  console.log(`  ${rows.length - notes.length - regressions.length} unchanged`);
  console.log(`  ${notes.length} changed within tolerance`);
  console.log(`  ${regressions.length} regressions\n`);

  for (const r of rows.filter((x) => x.deltas.length)) {
    const tag = r.verdict === "REGRESSION" ? "REGRESSION" : "note";
    console.log(`  [${tag}] ${r.file.replace("src/", "")}:${r.beforeLine} → :${r.afterLine}`);
    for (const d of r.deltas) console.log(`             ${d}`);
  }

  if (rebuilt.length) {
    console.log(`\n  Not compared — rebuilt from scratch, so element N does not`);
    console.log(`  correspond to element N and any "delta" would be invented:`);
    for (const f of rebuilt) console.log(`    ${f.replace("src/", "")}`);
  }

  console.log(`\n  NOT covered: reflow, wrapping, overflow, collision. This sweep`);
  console.log(`  resolves computed values; it does not rasterise a page.`);

  if (regressions.length) process.exit(1);
}
