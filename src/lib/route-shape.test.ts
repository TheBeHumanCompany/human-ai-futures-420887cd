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

  test("the episode route exists, mounted at the root rather than nested under /podcast", () => {
    // Tightened from a conditional shape rule to an unconditional assertion now
    // that the route exists. The underscore is the whole point: `podcast.tsx`
    // is a leaf that renders no `<Outlet/>`, so a `podcast.$slug.tsx` would nest
    // inside it and never render — and the resulting 404s would be on the exact
    // URLs this project exists to keep alive.
    expect(fileRouteIds()).toContain("/podcast_/$slug");
  });

  test("no episode route is mounted under /podcast without the escape", () => {
    // The other direction: catches a rename that reintroduces the nesting even
    // if the escaped route is also present.
    const episodeRoutes = fileRouteIds().filter((id) => /podcast.*\$slug/.test(id));

    expect(episodeRoutes).toEqual(["/podcast_/$slug"]);
  });

  test("the generated route resolves to the public URL the id obscures", () => {
    // The id carries the underscore; the URL must not. `FileRoutesByFullPath` is
    // where the public path is declared, and asserting both together is what
    // pins D-J1's claim that the escape changes the id and nothing else.
    const source = readFileSync(GENERATED, "utf8");
    const start = source.indexOf("export interface FileRoutesByFullPath {");
    expect(start).toBeGreaterThan(-1);

    const block = source.slice(start, source.indexOf("\n}", start));
    const fullPaths = [...block.matchAll(/'([^']+)':/g)].map((match) => match[1]);

    expect(fullPaths).toContain("/podcast/$slug");
    expect(fullPaths).not.toContain("/podcast_/$slug");
  });
});
