/**
 * The surfaces this site ships, as data.
 *
 * Every acceptance check that says "on each page" needs a list of pages, and
 * the plan's derived-floor rule (ADR-002) forbids that list from being a
 * literal somewhere in a shell script. So it lives here once, typed, and both
 * the gates and the visual-diff runner read it.
 *
 * `route-shape.test.ts` asserts this agrees with the generated router — a
 * route added to `src/routes/` and forgotten here would otherwise be a page no
 * gate ever visits, which is the exact shape of "the check passed and the page
 * was broken". That assertion lives beside the other route-tree guards rather
 * than in a file of its own, because it is the same failure they exist for.
 */

export type SurfaceKind =
  /** A public content page that must render the single site nav. */
  | "page"
  /** The Blueprint page — the one surface allowed a second, in-page sub-nav. */
  | "blueprint"
  /** A dynamic route; the gate needs a concrete slug to visit it. */
  | "dynamic"
  /** Machine-readable output. Not a page; no nav, no visual diff. */
  | "machine";

/** How often a page changes, in the vocabulary the sitemap protocol accepts. */
export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export type Surface = {
  /**
   * The public URL, as a browser visits it — which is also the router
   * `fullPath` with any trailing slash trimmed. A directory index route is
   * generated as `/be-human-ai/` but is served, linked and crawled as
   * `/be-human-ai`, and this list holds the form that goes in a sitemap.
   */
  path: string;
  kind: SurfaceKind;
  /**
   * Whether AC-3.3 applies: "every page except the Blueprint page renders only
   * the single top nav". False for the Blueprint page (AC-3.4 grants it a
   * sub-nav) and for non-page surfaces.
   */
  expectsSingleNav: boolean;
  /**
   * For `dynamic` surfaces, a real slug that exists in production, so the gate
   * fetches a page instead of a 404. `undefined` for static surfaces.
   */
  sampleSlug?: string;
  /**
   * Crawl hints, present exactly when this surface belongs in the sitemap.
   *
   * Absent means "real page, deliberately not advertised" — the type specimen
   * is a working artifact for reviewing the type scale, not something a search
   * engine should index. Making the sitemap read this field rather than keep
   * its own list is what stopped the two from drifting: the sitemap route and
   * its test previously held separate copies of the page list, and the test
   * asserted its copy exactly, so adding a route turned it red while updating
   * only the test dropped pages from the sitemap with a green suite.
   */
  sitemap?: { changefreq: ChangeFreq; priority: string };
};

export const SURFACES: readonly Surface[] = [
  {
    path: "/",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "weekly", priority: "1.0" },
  },
  {
    path: "/why-we-exist",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  {
    path: "/who-we-are",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  {
    path: "/be-human-ai",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "monthly", priority: "0.9" },
  },
  {
    // Maya's 2026-08-18 brief. Not in the nav tree — AC-3.1a deep-equals that
    // tree, so a seventh top-level item is an amendment, not an edit. Reachable
    // from /who-we-are until that is decided.
    path: "/about-the-founder",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "yearly", priority: "0.6" },
  },
  {
    path: "/the-new-human-era",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "monthly", priority: "0.7" },
  },
  {
    path: "/the-human-archive",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "weekly", priority: "0.7" },
  },
  {
    path: "/podcast",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "weekly", priority: "0.7" },
  },
  {
    path: "/contact",
    kind: "page",
    expectsSingleNav: true,
    sitemap: { changefreq: "yearly", priority: "0.6" },
  },
  // A review artifact for the type scale. Renders the site chrome, so the
  // single-nav rule applies — but it is not content, so it stays out of the
  // sitemap.
  { path: "/type-specimen", kind: "page", expectsSingleNav: true },
  { path: "/sitemap.xml", kind: "machine", expectsSingleNav: false },
  { path: "/podcast/$slug", kind: "dynamic", expectsSingleNav: true, sampleSlug: "" },
] as const;

/**
 * The static pages the sitemap advertises, in declaration order.
 *
 * Dynamic surfaces are excluded on purpose: an episode's URL comes from the
 * catalogue at request time, not from this list, and emitting `$slug` as a
 * literal path would publish a URL that cannot exist.
 */
export function sitemapSurfaces(): { path: string; changefreq: ChangeFreq; priority: string }[] {
  return SURFACES.filter((s) => s.sitemap !== undefined && s.kind !== "dynamic").map((s) => ({
    path: s.path,
    changefreq: s.sitemap!.changefreq,
    priority: s.sitemap!.priority,
  }));
}

/** Surfaces a browser-facing gate should visit, with dynamic slugs resolved. */
export function visitableSurfaces(): Surface[] {
  return SURFACES.filter(
    (s) => s.kind !== "machine" && (s.kind !== "dynamic" || (s.sampleSlug ?? "") !== ""),
  ).map((s) =>
    s.kind === "dynamic" ? { ...s, path: s.path.replace("$slug", s.sampleSlug ?? "") } : s,
  );
}

/** The single surface AC-3.4 exempts from the single-nav rule. */
export const BLUEPRINT_PATH = "/be-human-ai";
