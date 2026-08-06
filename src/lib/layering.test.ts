import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The layering boundary, guarded as text (AC-36).
 *
 * The consensus plan's whole read-path shape rests on one split: route files
 * under `src/routes/` only import and render, and every data operation —
 * `fetch`, GROQ, cache — lives in `src/lib/`. Nothing in TypeScript's type
 * system enforces that split; a route file that reaches straight for
 * `fetch()` or a GROQ string, or imports the client-side `browseEpisodes`
 * filter the plan is retiring, compiles and renders exactly as well as one
 * that goes through the library. It just quietly reopens the coupling the
 * plan exists to remove — the SSR/CSR duplication and the stale-cache drift
 * that motivated this rewrite in the first place.
 *
 * The other two rules guard narrower but sharper failures: `groq-js` is a
 * `devDependency` (Decision D) that must never enter the deployed bundle —
 * `http.ts` talks to Sanity over `fetch`, not through this in-memory
 * evaluator — and `publish.ts` is the one place a `slugLock` mutation may be
 * built, because its compare-and-set over that single document is what
 * closes the two-writer race in Decision F (see pre-mortem #6 in this plan).
 * A second construction site is a second, unsynchronized writer.
 *
 * Every rule below is a "no file does X" assertion read off file text, not
 * off module resolution or a type checker, so every one of them is
 * vacuously true against an empty file list. `fixture sanity` asserts the
 * walks actually found real files, and that they were actually read, before
 * any rule below is allowed to claim a clean bill of health.
 */

const SRC_DIR = path.join(import.meta.dir, "..");
const ROUTES_DIR = path.join(SRC_DIR, "routes");
const PUBLISH_FILE = path.join(SRC_DIR, "lib", "sanity", "publish.ts");

/**
 * The one documented exception to "no non-test file imports groq-js"
 * (rule 4). `groq-eval.ts` is a test-only wrapper around groq-js — imported
 * only by `*.test.ts` files — that exists so tests can evaluate real GROQ
 * fragments (see its own header comment). It is allowed here by exact path,
 * not by a loose pattern, so widening the exemption requires editing this
 * constant, not just matching a naming convention.
 */
const GROQ_EVAL_FILE = path.join(SRC_DIR, "lib", "sanity", "groq-eval.ts");

const SKIP_DIRS = new Set(["node_modules", ".git"]);

/** Recursively lists every file under `dir`, skipping vendor/VCS directories. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const isSourceFile = (file: string) => /\.(ts|tsx)$/.test(file);
const isTestFile = (file: string) => /\.test\.tsx?$/.test(file);
const read = (file: string) => readFileSync(file, "utf8");

// Route files are scanned for what they render, not for how they're tested —
// a `*.test.tsx` alongside a route (there are none today) would legitimately
// import fixtures, mocks, or the library functions it's asserting against.
const routeFiles = walk(ROUTES_DIR)
  .filter(isSourceFile)
  .filter((file) => !isTestFile(file));

// The library-wide scans (rules 4 and 5) cover all of src/, tests included,
// then filter tests back out per rule — a *.test.ts fixture legitimately
// constructs a literal `_type: "slugLock"` object to assert against
// (publish.test.ts, sync.test.ts), and legitimately imports groq-js itself
// (projection-map.test.ts) or the groq-eval.ts wrapper. Neither is "a module"
// in the sense these rules police; only shipped, non-test modules are.
const srcFiles = walk(SRC_DIR).filter(isSourceFile);
const srcNonTestFiles = srcFiles.filter((file) => !isTestFile(file));

describe("fixture sanity — non-vacuity floors", () => {
  test("the routes walk finds a realistic number of files", () => {
    // Below this, "no route file does X" is closer to "no file exists" than
    // to a guarantee about the routing layer.
    expect(routeFiles.length).toBeGreaterThanOrEqual(8);
  });

  test("the src walk finds a realistic number of files", () => {
    expect(srcFiles.length).toBeGreaterThanOrEqual(30);
  });

  test("the routes walker reads file content, not just file names", () => {
    // Every hand-authored route in this app is a TanStack Router file route,
    // declared with `createFileRoute(...)`. If this string can't be found,
    // the walker is returning empty or truncated reads rather than real
    // source text, and every "no route contains X" assertion below would be
    // passing for that reason instead of for the one it claims.
    const combined = routeFiles.map(read).join("\n");
    expect(combined).toContain("createFileRoute");
  });

  test("the src walker reads file content, not just file names", () => {
    // `groq-js` already appears in this tree today (imports/comments in
    // projection-map.ts, groq-eval.ts). Same purpose as above, over the
    // wider src/ walk that rules 4 and 5 depend on.
    const combined = srcFiles.map(read).join("\n");
    expect(combined).toContain("groq-js");
  });
});

describe("AC-36 rule 1 — no fetch() call in src/routes/", () => {
  test("no route file calls fetch(...) directly", () => {
    const offenders = routeFiles.filter((file) => /\bfetch\s*\(/.test(read(file)));
    expect(offenders).toEqual([]);
  });
});

describe("AC-36 rule 2 — no GROQ query string in src/routes/", () => {
  /**
   * GROQ has no file extension or import statement of its own — a GROQ query
   * is just a string, so there is no exact way to detect "this file contains
   * a GROQ query" by text search alone. This matches the `*[` token: GROQ's
   * root-dataset-into-filter idiom (`*[_type == "episode"]`) that opens
   * essentially every real query in this codebase and in Sanity's own docs.
   * `*[` is not valid standalone JS/TS (there is no array-literal right-hand
   * side to multiplication), so as a signal inside `.ts`/`.tsx` source it is
   * strong and, in practice here, false-positive-free.
   *
   * What this cannot catch: a query with no `*[` root filter (e.g. a bare
   * `count(*)` fragment), one assembled by string concatenation that splits
   * `*` and `[` across an interpolation boundary, or one that never appears
   * as source text at all (read from JSON, an env var, or built at runtime).
   * This is a text-level heuristic, not a GROQ parser — it is exactly the
   * kind of check that would miss a sufficiently determined workaround, and
   * it is asserted as such rather than as a guarantee.
   */
  test("no route file contains the `*[` GROQ root-filter token", () => {
    const offenders = routeFiles.filter((file) => /\*\[/.test(read(file)));
    expect(offenders).toEqual([]);
  });
});

describe("AC-36 rule 3 — no route imports browseEpisodes or durationCounts", () => {
  /**
   * The one route that still does, and why this is an exception rather than a
   * failure.
   *
   * `src/routes/podcast.tsx` is today's client-side directory: it loads the
   * whole catalogue from the PodBean feed and filters it in the browser with
   * `browseEpisodes`. Step 10 of the plan replaces that with a server-side
   * query, and the cleanup PR *after production confirmation* deletes
   * `filter.ts` and `browseEpisodes` outright. Both are explicitly out of this
   * change's scope, so AC-36 is not yet satisfiable for this file.
   *
   * Recorded as a named, single-file exception rather than by loosening the
   * rule. The rule still fires for every other route, so a NEW violation is
   * still caught — which is the property worth protecting while Step 10 is
   * pending.
   */
  const KNOWN_PRE_STEP_10_EXCEPTION = "src/routes/podcast.tsx";

  const referencesBrowseHelpers = (file: string) =>
    /\bbrowseEpisodes\b|\bdurationCounts\b/.test(read(file));

  test("no route file other than the pre-Step-10 directory references browseEpisodes or durationCounts", () => {
    // Matched as bare identifiers anywhere in the file, not only inside an
    // `import { ... }` clause — a narrower import-statement regex would miss
    // a renamed import alias (`import { browseEpisodes as filterEpisodes }`)
    // still resolving to the same client-side filter. Neither identifier has
    // a legitimate reason to appear in a route file at all under the plan's
    // shape: browse logic belongs in the library, and routes only call it.
    const offenders = routeFiles
      .filter(referencesBrowseHelpers)
      .filter((file) => !file.endsWith(KNOWN_PRE_STEP_10_EXCEPTION));

    expect(offenders).toEqual([]);
  });

  test("the exception is still load-bearing, so it cannot rot silently", () => {
    // An allowlist nobody re-checks is how a temporary exception becomes
    // permanent. This asserts the exception is still NEEDED: once Step 10 moves
    // the directory server-side and `browseEpisodes` leaves `podcast.tsx`, this
    // test goes red and tells the next person to delete both the exception and
    // this test, then tighten the rule above to cover every route with no
    // carve-out.
    const exceptionFile = routeFiles.find((file) => file.endsWith(KNOWN_PRE_STEP_10_EXCEPTION));

    expect(exceptionFile).toBeDefined();
    expect(referencesBrowseHelpers(exceptionFile!)).toBe(true);
  });
});

describe("AC-36 rule 4 — groq-js never reaches a non-test file", () => {
  test("no non-test file under src/ imports groq-js, except the documented groq-eval.ts wrapper", () => {
    const offenders = srcNonTestFiles
      .filter((file) => file !== GROQ_EVAL_FILE)
      .filter((file) => /from\s+["']groq-js["']|require\(\s*["']groq-js["']\s*\)/.test(read(file)));
    expect(offenders).toEqual([]);
  });
});

describe("AC-36 rule 5 — publish.ts is the sole slugLock mutation writer", () => {
  test("no module outside publish.ts constructs a slugLock mutation", () => {
    // A slugLock mutation is built by handing Sanity a plain object with
    // `_type: "slugLock"` (see publish.ts's `create` call). This matches
    // that literal marker under either quote style. It would not catch a
    // mutation assembled through indirection (a `type` variable holding the
    // string, spread in later) — but publish.ts, the one module this rule
    // exempts, writes the literal form, and that is the pattern this rule
    // exists to keep singular.
    const offenders = srcNonTestFiles
      .filter((file) => file !== PUBLISH_FILE)
      .filter((file) => /_type:\s*["']slugLock["']/.test(read(file)));
    expect(offenders).toEqual([]);
  });
});

describe("Decision D — the Sanity runtime path imports no Node built-in", () => {
  /**
   * `http.ts`'s header stakes its whole design on this: "runtime-agnostic by
   * rule — `fetch` + `AbortSignal.timeout` only, no Node built-ins, regardless
   * of what `.vc-config.json` says." The deployed bundle has been observed
   * building under a `cloudflare-module` preset, so a Node built-in here is not
   * a style question — it is a module that resolves locally, passes every test,
   * and fails at the edge in production.
   *
   * Until now that claim was only a comment. A future edit could add
   * `import { createHash } from "node:crypto"` and nothing would go red.
   *
   * Scoped to the whole Sanity module directory rather than to `http.ts` alone,
   * because every one of these ships inside the same server function — pinning
   * only the file that currently makes the promise would leave its neighbours
   * free to break it on its behalf.
   */
  const NODE_BUILTIN_MODULES = [
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "dns",
    "events",
    "fs",
    "http",
    "https",
    "net",
    "os",
    "path",
    "process",
    "stream",
    "tls",
    "url",
    "util",
    "zlib",
  ];

  // Test-only, never bundled: it wraps `groq-js` for tests that evaluate real
  // GROQ fragments. Exempted by exact path for the same reason rule 4 exempts
  // it — by name, so widening the exemption takes an edit here.
  const sanityRuntimeFiles = srcNonTestFiles.filter(
    (file) =>
      file.includes(`${path.sep}lib${path.sep}sanity${path.sep}`) && file !== GROQ_EVAL_FILE,
  );

  test("the file set is non-empty and includes http.ts", () => {
    // Floor first: every assertion below is a filter over this list and passes
    // trivially when it is empty.
    expect(sanityRuntimeFiles.length).toBeGreaterThanOrEqual(5);
    expect(sanityRuntimeFiles.some((file) => file.endsWith("http.ts"))).toBe(true);
  });

  test("no `node:`-prefixed import anywhere in the Sanity runtime path", () => {
    const offenders = sanityRuntimeFiles.filter((file) =>
      /from\s+["']node:|require\(\s*["']node:/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  test("no bare built-in module import either, which is the form that looks innocuous", () => {
    // `import { readFile } from "fs"` is the same dependency as `"node:fs"` and
    // reads like an ordinary package import, so it is the form most likely to
    // survive review.
    const pattern = new RegExp(
      `(from\\s+["'](${NODE_BUILTIN_MODULES.join("|")})["']|` +
        `require\\(\\s*["'](${NODE_BUILTIN_MODULES.join("|")})["']\\s*\\))`,
    );
    const offenders = sanityRuntimeFiles.filter((file) => pattern.test(read(file)));
    expect(offenders).toEqual([]);
  });

  test("no Buffer usage, which needs no import and so evades both rules above", () => {
    const offenders = sanityRuntimeFiles.filter((file) => /\bBuffer\s*\./.test(read(file)));
    expect(offenders).toEqual([]);
  });

  /**
   * The distinction this rule is drawing, and why it is not a blanket ban.
   *
   * `http.ts` reads `globalThis.process?.env?.SANITY_WRITE_TOKEN`. The `?.` is
   * the whole point: on a runtime with no `process` the expression evaluates to
   * `undefined` instead of throwing. That is the runtime-agnostic pattern, so
   * banning the identifier outright would fail on correct code.
   *
   * What must not appear is any UNGUARDED reach for `process.env` — it throws a
   * `ReferenceError` (bare) or a `TypeError` (hard-chained off `globalThis`)
   * the first time it runs at the edge, and both fail identically.
   *
   * The regex excludes preceding word characters so `someProcess.env` on an
   * unrelated object is not swept up, but deliberately does NOT exclude a
   * preceding `.` — that is what lets it catch `globalThis.process.env`. The
   * legitimately-guarded form needs no exclusion of its own: `?` is neither
   * whitespace nor `.`, so `process?.env` simply cannot match
   * `process\s*\.\s*env`.
   */
  const UNGUARDED_PROCESS_ENV = /(^|[^\w])process\s*\.\s*env/;

  test("`process` is reached only as a guarded optional global, never unguarded", () => {
    const offenders = sanityRuntimeFiles.filter((file) => UNGUARDED_PROCESS_ENV.test(read(file)));
    expect(offenders).toEqual([]);
  });

  test("the rule separates the guarded form from the two unguarded ones", () => {
    // Pinned as a table rather than left to a scratch-file probe, because the
    // boundary here is subtle enough that a future tightening could silently
    // start rejecting the correct idiom — or, as an earlier version of this
    // rule actually did, silently stop catching the hard-chained form.
    // `globalThis.process.env` throws exactly as readily as a bare
    // `process.env`; only the `?.` makes it safe.
    expect(UNGUARDED_PROCESS_ENV.test("const x = process.env.FOO;")).toBe(true);
    expect(UNGUARDED_PROCESS_ENV.test("const x = globalThis.process.env.FOO;")).toBe(true);

    expect(UNGUARDED_PROCESS_ENV.test("globalThis.process?.env?.FOO")).toBe(false);
    // An unrelated identifier that merely ends in "process" is not a violation.
    expect(UNGUARDED_PROCESS_ENV.test("childProcess.env")).toBe(false);
  });
});
