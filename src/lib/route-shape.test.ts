import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The generated route tree, guarded as data.
 *
 * Pre-mortem #1 in the consensus plan: the catalogue snapshot protects the
 * `slug`, but nothing protects the *route*. Someone renames the episode route
 * file, or a Lovable regeneration plus a merge shifts it, `routeTree.gen.ts`
 * regenerates, and every shared `/podcast/<slug>` link 404s while the whole
 * suite stays green. `routeTree.gen.ts` is a generated file on a branch with
 * three automated writers — the highest-entropy, lowest-scrutiny file here.
 *
 * `FileRoutesById` is a TypeScript interface, so there is no runtime object to
 * read. Asserting over the generated source text is not a workaround: the
 * generated text IS the artifact that regresses, and reading it catches a
 * rename that a runtime walk of built routes would have to reconstruct.
 *
 * Deliberately asserted by ID rather than by full path. The trailing-underscore
 * escape (`podcast_.$slug.tsx`) is what stops the episode route nesting under
 * the existing `podcast.tsx` leaf, which renders no `<Outlet/>` and would
 * therefore swallow the page entirely. That escape shows up ONLY in the ID
 * (`/podcast_/$slug`); `FileRoutesByFullPath` reads `/podcast/$slug` either
 * way and stays green straight through the regression it is supposed to catch.
 */

const GENERATED = path.join(import.meta.dir, "..", "routeTree.gen.ts");

function fileRouteIds(): string[] {
  const source = readFileSync(GENERATED, "utf8");
  const start = source.indexOf("export interface FileRoutesById {");
  expect(start).toBeGreaterThan(-1);

  const end = source.indexOf("\n}", start);
  expect(end).toBeGreaterThan(start);

  const block = source.slice(start, end);
  return [...block.matchAll(/'([^']+)':/g)].map((match) => match[1]);
}

describe("generated route ids", () => {
  test("the directory route is present under its expected id", () => {
    expect(fileRouteIds()).toContain("/podcast");
  });

  test("the generated block parses to a non-empty id set", () => {
    // Non-vacuity floor. Every assertion here is a `toContain` or a filter over
    // this list, and all of them pass trivially against `[]` — which is exactly
    // what a changed generator preamble or a renamed interface would produce.
    const ids = fileRouteIds();
    expect(ids.length).toBeGreaterThanOrEqual(8);
    expect(ids).toContain("/");
  });

  test("any episode route is mounted at the root, not nested under /podcast", () => {
    // The episode route itself arrives with Step 8 of the plan, so there is
    // nothing to find today and this passes on an empty match. It is written as
    // a shape rule rather than a presence assertion precisely so it can exist
    // before the route does — the plan calls for the guard to land first — and
    // it goes red the moment a `$slug` route appears under `/podcast` without
    // the trailing-underscore escape.
    //
    // When Step 8 lands, tighten this to an unconditional
    // `expect(ids).toContain('/podcast_/$slug')`.
    const episodeRoutes = fileRouteIds().filter((id) => /podcast.*\$slug/.test(id));

    for (const id of episodeRoutes) {
      expect(id).toBe("/podcast_/$slug");
    }
  });
});
