/**
 * S0.6 — FULL type inventory (pre-gate).
 *
 * Enumerates every type-setting declaration in the shipped (non-test) source so
 * that Phase 4's migration floor is *derived*, never retyped. The AC-4.2 gate
 * asserts that a live run of this scanner equals the committed
 * `docs/type-inventory.json`, and that this file's own SHA-256 still matches the
 * one recorded there — so editing the scanner without regenerating the inventory
 * fails the gate rather than silently under-counting.
 *
 * ── The four pinned rules (AC-4.2b; all binding) ────────────────────────────
 *  1. Scan STRING LITERALS, not `className=` attributes. Every `"…"`, `'…'` and
 *     `` `…` `` in non-test `src/**\/*.{ts,tsx}`, regardless of syntactic
 *     position. This is what catches the two call sites an attribute regex
 *     structurally cannot see:
 *       · `src/routes/podcast_.$slug.tsx`  — `const SECTION_HEADING = "section-label …"`
 *       · `src/components/episode-player.tsx` — `className={cn("eyebrow …")}`
 *     A previous `className="…"`-only scanner missed both and reported 46/91.
 *  2. Tokenize on whitespace, then strip variant prefixes (`sm:`, `lg:`,
 *     `hover:`, …) by taking the segment after the final `:`.
 *  3. Match the token EXACTLY against the utility set. Never substring-match —
 *     substring matching is what makes `font-display` a false positive for
 *     `display`, and `--font-display` a false positive for both.
 *  4. Also scan `src/styles.css` separately and report `@utility` definitions as
 *     a DISTINCT category, so definitions are never conflated with call sites.
 *
 * Run: `bun run scripts/type-inventory.ts`
 * Emits: `docs/type-inventory.md` (human) + `docs/type-inventory.json` (machine)
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import ts from "typescript";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const SRC_DIR = join(REPO_ROOT, "src");
const STYLES_CSS = join(SRC_DIR, "styles.css");
const SCANNER_PATH = join(REPO_ROOT, "scripts", "type-inventory.ts");
const OUT_MD = join(REPO_ROOT, "docs", "type-inventory.md");
const OUT_JSON = join(REPO_ROOT, "docs", "type-inventory.json");

/* ── The utility set ──────────────────────────────────────────────────────── */

/**
 * The binding AC-4.2 migration scope (Amendment 2, decision 1): the four
 * AC-4.2 utility names plus the three `section-label-*` variants.
 */
const IN_SCOPE_UTILITIES = [
  "display",
  "display-strong",
  "archive-question",
  "section-label",
  "section-label-dark",
  "section-label-light",
  "section-label-rule",
] as const;

/**
 * `eyebrow` is EXPLICITLY OUT of scope (Amendment 2, decision 1) — it is
 * counted and reported so the 47-vs-92 reconciliation stays visible, but it is
 * not migrated and does not enter the floor.
 */
const OUT_OF_SCOPE_UTILITIES = ["eyebrow"] as const;

const ALL_UTILITIES = new Set<string>([...IN_SCOPE_UTILITIES, ...OUT_OF_SCOPE_UTILITIES]);
const IN_SCOPE = new Set<string>(IN_SCOPE_UTILITIES);

/** Tailwind's named font-size scale, in rem. Exact-match only (rule 3). */
const TAILWIND_TEXT_SIZES: Record<string, number> = {
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

/* ── File walking (mirrors src/lib/layering.test.ts:44-84) ────────────────── */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const isSourceFile = (file: string) => /\.(ts|tsx)$/.test(file);
const isTestFile = (file: string) => /\.test\.tsx?$/.test(file);

/* ── Kinds of declaration we inventory ────────────────────────────────────── */

type Category =
  | "utility-in-scope"
  | "utility-out-of-scope"
  | "arbitrary-size"
  | "tailwind-size"
  | "utility-definition";

interface Occurrence {
  file: string;
  line: number;
  token: string;
  /** The token with its variant prefix intact, as written in source. */
  raw: string;
  category: Category;
  /** Largest font-size this token can resolve to, in rem. `null` when unsized. */
  maxRem: number | null;
  /** The two-register scale step this occurrence maps onto in Phase 4. */
  proposed: string;
}

/* ── Size resolution ──────────────────────────────────────────────────────── */

const REM_PER_VW_AT_1440 = 14.4 / 16; // 1vw at a 1440px reference viewport, in rem

function lengthToRem(value: string): number | null {
  const m = /^(-?[\d.]+)(rem|px|em|vw|vh|ch)$/.exec(value.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  switch (m[2]) {
    case "rem":
    case "em":
      return n;
    case "px":
      return n / 16;
    case "vw":
    case "vh":
      return n * REM_PER_VW_AT_1440;
    case "ch":
      return n * 0.5;
    default:
      return null;
  }
}

/** Split `clamp(a,b,c)` arguments at top level (they may nest `calc()` etc.). */
function splitArgs(inner: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of inner) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  args.push(current);
  return args.map((a) => a.trim());
}

/**
 * The largest size an arbitrary `text-[…]` value can render at. For a
 * `clamp(min, preferred, max)` that is the third argument — the ceiling is what
 * decides which scale step a heading belongs to.
 */
function arbitraryMaxRem(inner: string): number | null {
  const clamp = /^clamp\((.*)\)$/s.exec(inner.trim());
  if (clamp) {
    const args = splitArgs(clamp[1]);
    if (args.length === 3) return lengthToRem(args[2]) ?? lengthToRem(args[1]);
    return null;
  }
  return lengthToRem(inner);
}

/* ── Token classification ─────────────────────────────────────────────────── */

/**
 * Rule 2: strip variant prefixes by taking the segment after the final `:`.
 *
 * Colons inside `[…]` are ignored here — a Tailwind arbitrary value may legally
 * contain one (`[mask-image:linear-gradient(…)]`, `[--cell-size:2rem]`), and the
 * literal reading of rule 2 would truncate such a token mid-value. Ten tokens in
 * this repo differ textually between the two readings; the scanner asserts below
 * that **none of them differ in classification**, so the refinement is provably
 * a no-op for the inventory and rule 2's intent is preserved exactly.
 */
function stripVariants(token: string): { base: string; literalBase: string } {
  let depth = 0;
  let lastTopLevelColon = -1;
  let lastColon = -1;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    else if (ch === ":") {
      lastColon = i;
      if (depth === 0) lastTopLevelColon = i;
    }
  }
  return { base: token.slice(lastTopLevelColon + 1), literalBase: token.slice(lastColon + 1) };
}

/** Scale step names introduced in Phase 4 (S4.1). */
function proposeStep(category: Category, token: string, maxRem: number | null): string {
  if (category === "utility-out-of-scope") return "eyebrow (unchanged — out of scope)";
  if (category === "utility-definition") return "deleted (definition, not a call site)";

  // Register: every existing in-scope utility hardcodes `text-transform:
  // uppercase`, so each of its call sites lands in the `-caps` register. The
  // `-prose` register is new surface (voices 2 and 3) with no legacy call sites.
  const capsUtility =
    token === "display" ||
    token === "display-strong" ||
    token === "archive-question" ||
    token.startsWith("section-label");

  if (token === "section-label-rule") return "eyebrow-rule (role preserved, V39)";
  if (token === "section-label-dark" || token === "section-label-light") {
    return "eyebrow colour modifier (role preserved, V39)";
  }
  if (token === "section-label") return "type-h4-caps + eyebrow role";

  const level =
    maxRem === null ? null : maxRem >= 4 ? 1 : maxRem >= 2.75 ? 2 : maxRem >= 1.75 ? 3 : 4;
  const register = capsUtility ? "caps" : "prose";
  if (level === null) return `type-h?-${register} (size set elsewhere — resolve at migration)`;
  if (level === 4 && !capsUtility && (maxRem ?? 0) < 1.375) return "type-body";
  return `type-h${level}-${register}`;
}

/* ── The scan ─────────────────────────────────────────────────────────────── */

const occurrences: Occurrence[] = [];
const colonAmbiguities: string[] = [];

function classify(
  rawToken: string,
): { token: string; category: Category; maxRem: number | null } | null {
  const { base, literalBase } = stripVariants(rawToken);
  if (base !== literalBase && classifyBase(base)?.token !== classifyBase(literalBase)?.token) {
    colonAmbiguities.push(rawToken);
  }
  return classifyBase(base);
}

function classifyBase(
  base: string,
): { token: string; category: Category; maxRem: number | null } | null {
  if (ALL_UTILITIES.has(base)) {
    return {
      token: base,
      category: IN_SCOPE.has(base) ? "utility-in-scope" : "utility-out-of-scope",
      maxRem: null,
    };
  }

  const arbitrary = /^text-\[(.+)\]$/s.exec(base);
  if (arbitrary) {
    return { token: base, category: "arbitrary-size", maxRem: arbitraryMaxRem(arbitrary[1]) };
  }

  if (Object.hasOwn(TAILWIND_TEXT_SIZES, base)) {
    return { token: base, category: "tailwind-size", maxRem: TAILWIND_TEXT_SIZES[base] };
  }

  return null;
}

/**
 * Rule 1: walk the AST and take every string-literal-ish node, whatever its
 * syntactic position — variable initialiser, `cn()` argument, JSX attribute,
 * object property, ternary branch. Tokens are read off the RAW source slice so
 * that reported line numbers are exact even inside multi-line templates.
 */
function scanSourceFile(absPath: string) {
  const text = readFileSync(absPath, "utf8");
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = relative(REPO_ROOT, absPath);

  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      const start = node.getStart(sf);
      const raw = text.slice(start, node.end);
      // Tokenize the raw slice on whitespace (rule 2). Delimiters (`"`, `` ` ``,
      // `${`, `}`) are whitespace-adjacent or attach to tokens we never match
      // exactly, so they cannot produce a false positive under rule 3.
      const tokenRe = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = tokenRe.exec(raw)) !== null) {
        const cleaned = m[0].replace(/^[`'"{$]+/, "").replace(/[`'"}]+$/, "");
        if (!cleaned) continue;
        const hit = classify(cleaned);
        if (!hit) continue;
        const { line } = sf.getLineAndCharacterOfPosition(start + m.index);
        occurrences.push({
          file: rel,
          line: line + 1,
          token: hit.token,
          raw: cleaned,
          category: hit.category,
          maxRem: hit.maxRem,
          proposed: proposeStep(hit.category, hit.token, hit.maxRem),
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
}

/** Rule 4: `@utility` definitions are a separate category, never a call site. */
function scanStylesCss() {
  const text = readFileSync(STYLES_CSS, "utf8");
  const rel = relative(REPO_ROOT, STYLES_CSS);
  text.split("\n").forEach((lineText, i) => {
    const m = /^@utility\s+([A-Za-z0-9_-]+)\s*\{/.exec(lineText.trim());
    if (!m) return;
    if (!ALL_UTILITIES.has(m[1])) return;
    occurrences.push({
      file: rel,
      line: i + 1,
      token: m[1],
      raw: m[1],
      category: "utility-definition",
      maxRem: null,
      proposed: proposeStep("utility-definition", m[1], null),
    });
  });
}

/**
 * The ONE excluded file, and why.
 *
 * `/type-specimen` is a review instrument, not shipped surface: it exists to get
 * the scale approved at G1 and is deleted in S8.2. It necessarily *names* the
 * utilities it is proposing to replace — a mapping table that says "`display`
 * → `type-h1-caps`" contains the bare literal `display`. Under rule 1 (scan
 * every string literal, wherever it sits) those names would be counted as call
 * sites, and the specimen would silently inflate the very floor it exists to
 * establish.
 *
 * The exclusion is one hardcoded path, not a pattern, so it cannot quietly grow.
 */
const EXCLUDED_FILE = join(SRC_DIR, "routes", "type-specimen.tsx");

const allSourceFiles = walk(SRC_DIR)
  .filter(isSourceFile)
  .filter((f) => !isTestFile(f));
const sourceFiles = allSourceFiles.filter((f) => f !== EXCLUDED_FILE);
const specimenExcluded = allSourceFiles.length - sourceFiles.length;

sourceFiles.forEach(scanSourceFile);
scanStylesCss();

/* ── Aggregation ──────────────────────────────────────────────────────────── */

const byCategory = (c: Category) => occurrences.filter((o) => o.category === c);
const countOf = (token: string, c: Category) =>
  occurrences.filter((o) => o.token === token && o.category === c).length;

const inScope = byCategory("utility-in-scope");
const outOfScope = byCategory("utility-out-of-scope");
const arbitrary = byCategory("arbitrary-size");
const tailwindSized = byCategory("tailwind-size");
const definitions = byCategory("utility-definition");

const fourNames = inScope.filter((o) => !o.token.startsWith("section-label-")).length;
const filesTouched = new Set(
  occurrences.filter((o) => o.category !== "utility-definition").map((o) => o.file),
);

const scannerSha256 = createHash("sha256").update(readFileSync(SCANNER_PATH)).digest("hex");

/**
 * WHICH TREE was scanned. Without this the inventory is a number with no
 * referent: the 47-site floor is a user decision measured against `main@a6a377a`,
 * and any concurrent branch work that adds a `display` or `section-label` call
 * site moves the live count without anything being wrong. Recording the ref and
 * the dirty flag makes that drift visible instead of silent.
 */
function gitProvenance() {
  const run = (args: string[]) => {
    const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : null;
  };
  const head = run(["rev-parse", "HEAD"]);
  const status = run(["status", "--porcelain"]);
  return {
    head,
    branch: run(["rev-parse", "--abbrev-ref", "HEAD"]),
    workingTreeDirty: status === null ? null : status.length > 0,
    mergeBaseWithPlanBase: run(["merge-base", "HEAD", "a6a377a"]),
  };
}

const provenance = gitProvenance();

const perUtility = [...IN_SCOPE_UTILITIES, ...OUT_OF_SCOPE_UTILITIES].map((name) => ({
  utility: name,
  callSites: countOf(name, IN_SCOPE.has(name) ? "utility-in-scope" : "utility-out-of-scope"),
  definitions: countOf(name, "utility-definition"),
  inScope: IN_SCOPE.has(name),
}));

const inventory = {
  generatedBy: "scripts/type-inventory.ts",
  scannerSha256,
  provenance,
  scope: {
    binding: inScope.length,
    fourAc42Names: fourNames,
    sectionLabelVariants: inScope.length - fourNames,
    eyebrowOutOfScope: outOfScope.length,
    combinedWithEyebrow: inScope.length + outOfScope.length,
    utilityDefinitions: definitions.length,
  },
  rawSizeDeclarations: {
    arbitrary: arbitrary.length,
    tailwindNamed: tailwindSized.length,
    total: arbitrary.length + tailwindSized.length,
  },
  filesScanned: sourceFiles.length,
  filesWithTypeDeclarations: filesTouched.size,
  excluded: {
    path: relative(REPO_ROOT, EXCLUDED_FILE),
    applied: specimenExcluded === 1,
    reason: "G1 review instrument; names the utilities it replaces; deleted in S8.2",
  },
  perUtility,
  occurrences: occurrences
    .slice()
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.raw.localeCompare(b.raw)),
};

writeFileSync(OUT_JSON, `${JSON.stringify(inventory, null, 2)}\n`);

/* ── Human-readable report ────────────────────────────────────────────────── */

const mdRows = (rows: Occurrence[]) =>
  rows
    .map(
      (o) =>
        `| \`${o.file}:${o.line}\` | \`${o.raw}\` | ${o.maxRem === null ? "—" : `${o.maxRem.toFixed(3)}rem`} | ${o.proposed} |`,
    )
    .join("\n");

const md = `# Type inventory (S0.6)

> **Generated. Do not hand-edit.** Regenerate with \`bun run scripts/type-inventory.ts\`.
> Scanner SHA-256: \`${scannerSha256}\`
> The AC-4.2 gate re-runs the scanner, compares the result against
> \`docs/type-inventory.json\`, and re-checks the hash above. Editing the scanner
> without regenerating this file fails the gate.

> ### Which tree this describes
> Branch \`${provenance.branch ?? "unknown"}\` at \`${(provenance.head ?? "unknown").slice(0, 12)}\`, working tree **${provenance.workingTreeDirty === null ? "unknown" : provenance.workingTreeDirty ? "dirty" : "clean"}**.
>
> **The 47-site floor is a user decision measured against \`main@a6a377a\`** (Amendment 2,
> decision 1). Verified: run against that tree this scanner returns \`display\` 24 ·
> \`display-strong\` 0 · \`archive-question\` 4 · \`section-label\` 8 ·
> \`section-label-{dark,light,rule}\` 1/6/4 = **47**, with \`eyebrow\` at 45 — the decision,
> digit for digit.
>
> A live count above 47 does **not** mean the scanner is wrong. It means branch work
> landed after the decision and added call sites of the same utilities. Phase 4 migrates
> whatever the tree actually holds, so **regenerate this file at the start of Phase 4** and
> treat the number it then reports as the floor.

## 1. The binding migration scope

| Scope | Call sites |
|---|---|
| The four AC-4.2 names (\`display\`, \`display-strong\`, \`archive-question\`, \`section-label\`) | **${fourNames}** |
| + \`section-label-{dark,light,rule}\` | **${inScope.length}** ← **the binding scope (AC-4.2b)** |
| + \`eyebrow\` (**explicitly OUT of scope**, Amendment 2 decision 1) | ${inScope.length + outOfScope.length} |
| \`@utility\` definitions in \`src/styles.css\` (deleted, not migrated) | ${definitions.length} |

| Utility | Call sites | Definitions | In scope |
|---|---|---|---|
${perUtility.map((u) => `| \`${u.utility}\` | ${u.callSites} | ${u.definitions} | ${u.inScope ? "yes" : "**no**"} |`).join("\n")}

Files scanned (non-test \`src/**/*.{ts,tsx}\`): **${sourceFiles.length}**.
Files carrying at least one type-setting declaration: **${filesTouched.size}**.

**One file is excluded**, \`${relative(REPO_ROOT, EXCLUDED_FILE)}\` (exclusion ${specimenExcluded === 1 ? "applied" : "**NOT applied — the file does not exist**"}).
It is the G1 review instrument and is deleted in S8.2. It necessarily *names* the
utilities it proposes to replace, and under rule 1 those bare names would be
counted as call sites — inflating the very floor it exists to establish. The
exclusion is one hardcoded path, not a pattern.

### The two sites an attribute regex cannot see

These are the reason rule 1 scans string literals rather than \`className="…"\`.
Both are present in the table below; if either goes missing, the scanner has
regressed to the defective form and the count silently drops by two.

${occurrences
  .filter(
    (o) =>
      (o.file.endsWith("podcast_.$slug.tsx") && o.token === "section-label") ||
      (o.file.endsWith("episode-player.tsx") && o.token === "eyebrow"),
  )
  .map((o) => `- \`${o.file}:${o.line}\` — \`${o.raw}\``)
  .join("\n")}

## 2. Utility call sites — in scope (${inScope.length})

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|
${mdRows(inScope)}

## 3. Utility call sites — \`eyebrow\`, out of scope (${outOfScope.length})

Listed for reconciliation only. **Phase 4 does not touch these** (Amendment 2,
decision 1). \`eyebrow\` is extended in place rather than duplicated (V25).

| Site | Token | Max size | Disposition |
|---|---|---|---|
${mdRows(outOfScope)}

## 4. Raw size declarations (${arbitrary.length + tailwindSized.length})

Not part of the 47-occurrence utility floor, but migrated alongside it in S4.2 —
these are what a \`clamp(\`-only scan misses. AC-4.5 bans all of them from
\`the-new-human-era.tsx\` and \`be-human-ai.tsx\`.

### 4a. Arbitrary values \`text-[…]\` (${arbitrary.length})

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|
${mdRows(arbitrary)}

### 4b. Tailwind named sizes (${tailwindSized.length})

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|
${mdRows(tailwindSized)}

## 5. \`@utility\` definitions in \`src/styles.css\` (${definitions.length})

Rule 4 keeps these in their own category so a definition is never counted as a
call site. They are **deleted** in S4.2, not migrated.

| Site | Token | Disposition |
|---|---|---|
${definitions.map((o) => `| \`${o.file}:${o.line}\` | \`${o.token}\` | ${o.proposed} |`).join("\n")}

## 6. The proposed scale — two registers, not one

Maya's mockups use three display voices; only one is reachable today.

| # | Voice | Family / weight | Exemplar | Status on \`main\` |
|---|---|---|---|---|
| 1 | Condensed **bold uppercase** | Oswald 700 | "THIS IS BIGGER THAN AI." | exists (\`display\`, \`archive-question\`) |
| 2 | Condensed **light sentence-case** | Oswald 200/300 | "We are the Bridge Generation." | **unreachable** — \`display\` hardcodes \`text-transform: uppercase\` |
| 3 | Wide **light sentence-case, very large** | Work Sans 300 | "But what if your humanity is not the reward at the end of a good life?" | **does not exist** |

So the scale gains an **axis** (\`case\` × family), not merely more steps:

**The caps steps are fitted to the measured site, not chosen in the abstract.**
Every pre-existing uppercase heading was measured at a 1440px viewport first.
Two results changed the first draft of this scale: the four page heroes
disagreed with each other (8.5 / 6.5 / 6 / 5.5rem) and now share one step at
7rem; and \`section-label\` had **nowhere to go** — 0.75–1.125rem Oswald 700 at
0.08em tracking fits neither \`eyebrow\` (0.6875rem Work Sans 500 at 0.22em) nor
\`type-h4-caps\` (nearly double), so it survives as \`type-label-caps\`.

| Step | Family | Weight | Case | Size (clamp) | Tracking |
|---|---|---|---|---|---|
| \`type-h1-caps\` | Oswald | 700 | uppercase | \`clamp(2.75rem, 8.5vw, 7rem)\` | \`0.005em\` |
| \`type-h2-caps\` | Oswald | 700 | uppercase | \`clamp(2.25rem, 5.4vw, 4.5rem)\` | \`0.01em\` |
| \`type-h3-caps\` | Oswald | 700 | uppercase | \`clamp(1.5rem, 2.6vw, 2.25rem)\` | \`0.015em\` |
| \`type-h4-caps\` | Oswald | 700 | uppercase | \`clamp(1.0625rem, 1.5vw, 1.375rem)\` | \`0.02em\` |
| \`type-label-caps\` | Oswald | 700 | uppercase | \`clamp(0.8125rem, 1vw, 1rem)\` | \`0.08em\` |
| \`type-h1-condensed\` | Oswald | 300 | none | \`clamp(2.5rem, 6vw, 4.25rem)\` | \`0.005em\` |
| \`type-h2-condensed\` | Oswald | 300 | none | \`clamp(2rem, 4.4vw, 3.25rem)\` | \`0.005em\` |
| \`type-h3-condensed\` | Oswald | 300 | none | \`clamp(1.5rem, 2.8vw, 2.25rem)\` | \`0.01em\` |
| \`type-h4-condensed\` | Oswald | 300 | none | \`clamp(1.25rem, 2vw, 1.625rem)\` | \`0.01em\` |
| \`type-h1-prose\` | Work Sans | 200 | none | \`clamp(2.25rem, 5.6vw, 5rem)\` | \`0.005em\` |
| \`type-h2-prose\` | Work Sans | 300 | none | \`clamp(2rem, 4.4vw, 3.5rem)\` | \`0.005em\` |
| \`type-h3-prose\` | Work Sans | 300 | none | \`clamp(1.5rem, 2.6vw, 2.25rem)\` | \`0.005em\` |
| \`type-h4-prose\` | Work Sans | 300 | none | \`clamp(1.25rem, 1.8vw, 1.5rem)\` | \`0.005em\` |
| \`type-body-lg\` | Work Sans | 400 | none | \`clamp(1.0625rem, 1.2vw, 1.25rem)\` | \`0\` |
| \`type-body\` | Work Sans | 400 | none | \`1rem\` | \`0\` |
| \`type-body-sm\` | Work Sans | 400 | none | \`0.875rem\` | \`0\` |

**Font cost is zero.** Work Sans 300 is already loaded (\`__root.tsx:104\`) and
Oswald 200/300 are already requested; voice 2 needs only a utility that omits
\`text-transform\`, and voice 3 needs no new file at all.

**\`eyebrow\` + lime rule survives as a role** (V39): every mockup section opens
with a letterspaced uppercase eyebrow above a ~4rem lime rule. The four old
utility *names* are deleted; that *role* is preserved.

## 7. Mapping rules used above

The "proposed scale step" column is computed, not hand-assigned:

- **Register** — every existing in-scope utility hardcodes \`text-transform:
  uppercase\`, so all of their call sites map to \`-caps\`. The \`-prose\`
  register is new surface with no legacy call sites.
- **Level** — from the token's largest resolvable size (a \`clamp()\`'s third
  argument; \`vw\` resolved at a 1440px reference viewport):
  ≥4rem → h1 · ≥2.75rem → h2 · ≥1.75rem → h3 · else h4, and <1.375rem prose → body.
- **Unsized utility tokens** carry no size of their own; their level is set by
  the sibling size token on the same element and is resolved at migration time.
`;

writeFileSync(OUT_MD, md);

/* ── Console summary + self-checks ────────────────────────────────────────── */

if (colonAmbiguities.length > 0) {
  console.error(
    `SURFACE: ${colonAmbiguities.length} token(s) CLASSIFY DIFFERENTLY under the literal reading of ` +
      `rule 2 and the bracket-aware reading. The inventory is ambiguous and must not be trusted: ` +
      `${[...new Set(colonAmbiguities)].join(", ")}`,
  );
  process.exit(1);
}

console.log(`files scanned          : ${sourceFiles.length}`);
console.log(`four AC-4.2 names      : ${fourNames}`);
console.log(`+ section-label-*      : ${inScope.length}   <-- BINDING SCOPE`);
console.log(`eyebrow (out of scope) : ${outOfScope.length}`);
console.log(`combined               : ${inScope.length + outOfScope.length}`);
console.log(`@utility definitions   : ${definitions.length}`);
console.log(`arbitrary text-[…]     : ${arbitrary.length}`);
console.log(`tailwind text-{size}   : ${tailwindSized.length}`);
console.log(`scanner sha256         : ${scannerSha256}`);
console.log(`wrote ${relative(REPO_ROOT, OUT_MD)} + ${relative(REPO_ROOT, OUT_JSON)}`);
