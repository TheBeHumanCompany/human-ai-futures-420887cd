import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { NAV } from "./nav";
import { SURFACES } from "./surfaces";

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

function generatedKeys(interfaceName: string): string[] {
  const source = readFileSync(GENERATED, "utf8");
  const start = source.indexOf(`export interface ${interfaceName} {`);
  expect(start).toBeGreaterThan(-1);

  const end = source.indexOf("\n}", start);
  expect(end).toBeGreaterThan(start);

  const block = source.slice(start, end);
  return [...block.matchAll(/'([^']+)':/g)].map((match) => match[1]);
}

function fileRouteIds(): string[] {
  return generatedKeys("FileRoutesById");
}

/**
 * A directory index route generates as `/be-human-ai/` but is served, linked
 * and crawled as `/be-human-ai`. `SURFACES` holds the public form, so the two
 * are compared after trimming the trailing slash from everything but root.
 */
const publicForm = (p: string) => (p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p);

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

  test("the Blueprint is a directory index, and the three pillars are its siblings", () => {
    // The trap this guards is the same one the podcast escape guards, in the
    // other direction. `be-human-ai.tsx` was a leaf with no `<Outlet/>`;
    // creating `be-human-ai/<pillar>.tsx` beside it would have promoted it to
    // their layout route, and a layout that renders no outlet renders its
    // children nowhere. All three pillars would have mounted and displayed
    // nothing — with a 200, a title, and an empty body.
    //
    // Converting it to `be-human-ai/index.tsx` keeps it a leaf and makes the
    // pillars siblings instead. The generated ids are what record that: an
    // index route is `/be-human-ai/` with the trailing slash, and the pillars
    // sit alongside it rather than under it.
    const ids = fileRouteIds();

    expect(ids).toContain("/be-human-ai/");
    expect(ids).toContain("/be-human-ai/human-readiness");
    expect(ids).toContain("/be-human-ai/governance");
    expect(ids).toContain("/be-human-ai/ai-strategy");

    // And the file it replaced is gone. A leftover `be-human-ai.tsx` would
    // generate a bare `/be-human-ai` id beside the index and reintroduce the
    // layout nesting while every assertion above still passed.
    expect(ids).not.toContain("/be-human-ai");
  });

  test("the About menu's two destinations both exist as routes", () => {
    // "About" is a nav label with no page of its own — its dropdown is the
    // only way to reach either of these, so a missing route here is a dead
    // menu entry rather than a 404 someone stumbles onto.
    const ids = fileRouteIds();

    expect(ids).toContain("/why-we-exist");
    expect(ids).toContain("/who-we-are");
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

describe("SURFACES agrees with the generated router", () => {
  /**
   * Why this is asserted rather than trusted.
   *
   * `SURFACES` is what every "on each page" gate iterates — the single-nav
   * sweep, the production image sweep, the visual-diff matrix, the sitemap. A
   * route added to `src/routes/` and forgotten there is not a loud failure: it
   * is a page no gate ever visits, which is precisely the shape of "the checks
   * passed and the page was broken". The reverse — a surface listed that no
   * longer routes — makes every one of those gates fetch a 404 and, depending
   * on the gate, either fail for a confusing reason or quietly skip.
   */
  const generatedPublicPaths = () => generatedKeys("FileRoutesByFullPath").map(publicForm).sort();
  const surfacePaths = () => SURFACES.map((s) => publicForm(s.path)).sort();

  test("the two lists are populated before they are compared", () => {
    expect(SURFACES.length).toBeGreaterThanOrEqual(12);
    expect(generatedKeys("FileRoutesByFullPath").length).toBeGreaterThanOrEqual(12);
  });

  test("every generated route is a declared surface, and vice versa", () => {
    expect(surfacePaths()).toEqual(generatedPublicPaths());
  });

  test("exactly one surface is exempt from the single-nav rule", () => {
    // AC-3.4 grants the Blueprint page a second, in-page sub-nav. Every other
    // page gets exactly one nav; a second exemption would be a page quietly
    // opting out of the rule rather than a decision.
    const exempt = SURFACES.filter((s) => s.kind !== "machine" && !s.expectsSingleNav);
    expect(exempt.map((s) => s.path)).toEqual(["/be-human-ai"]);
  });
});

describe("every nav destination is a real route", () => {
  /**
   * The nav is typed against a literal union, so a typo is a compile error —
   * but the union is hand-written and could itself drift from the router. This
   * closes that gap: a nav entry pointing at a route that no longer exists is
   * a dead link in the site's primary navigation, on every page.
   */
  const destinations = NAV.flatMap((item) => [
    ...(item.to ? [item.to] : []),
    ...(item.children ?? []).map((child) => child.to),
  ]);

  test("the nav offers a realistic number of destinations", () => {
    expect(destinations.length).toBeGreaterThanOrEqual(9);
  });

  test("each one resolves in the generated route tree", () => {
    const routable = new Set(generatedKeys("FileRoutesByFullPath").map(publicForm));
    const dangling = destinations.filter((to) => !routable.has(to));

    expect(dangling).toEqual([]);
  });
});
