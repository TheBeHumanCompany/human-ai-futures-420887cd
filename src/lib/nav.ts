/**
 * The navigation's shape, and the one piece of logic both renders share.
 *
 * The `NAV` array itself stays in `site-header.tsx` — it is the single
 * navigation source of truth the header, the mobile menu and the footer all
 * read, and the footer imports it from there. What lives here is the typing
 * and the mobile filter: pure, component-free, and therefore testable without
 * a DOM. Keeping the filter out of the component file is also what lets
 * `nav.test.ts` call the exact function the mobile block calls, rather than
 * re-creating the expression and asserting against itself.
 */

/**
 * Routes that may appear inside a dropdown.
 *
 * A literal union rather than `string`, because TanStack's `<Link to>` is
 * constrained to the generated route union. Declaring it here is what lets a
 * children array be annotated `readonly NavChild[]` rather than const-inferred
 * — see `WHY_WE_EXIST_CHILDREN` in `site-header.tsx`.
 */
export type NavRoute =
  | "/why-we-exist"
  | "/be-human-ai"
  | "/the-new-human-era"
  | "/the-human-archive"
  | "/podcast";

/** One entry beneath a parent item, in the desktop dropdown and the mobile sub-list. */
export interface NavChild {
  to: NavRoute;
  hash?: string;
  label: string;
  /**
   * The parent's own destination, repeated inside the panel.
   *
   * Exists ONLY because the desktop trigger is a non-navigating <button>
   * (ui/navigation-menu.tsx:41) — it is compensation for a desktop-only
   * affordance loss, not content. The mobile parent row IS a real <Link> and
   * already carries this destination, so `mobileNavChildren` filters it out.
   * Its label must differ from the parent's; the nav test enforces that
   * unconditionally.
   */
  self?: true;
}

/**
 * Every route worth linking to.
 *
 * **Two flags decide placement, and getting them backwards inverts the whole
 * intent.** The header filters `footerOnly` out; the footer filters nothing and
 * lists everything. So a `footerOnly` route is reachable from the footer and
 * from in-page links, but does not crowd the desktop bar.
 *
 * `cta` promotes the Blueprint out of the link row entirely. It is the priced
 * offer the sales pages exist to sell, and rendering it as one more
 * indistinguishable link would bury it.
 */
export interface NavItem {
  to: string;
  label: string;
  /** Hidden from the desktop and mobile menus; still rendered in the footer. */
  footerOnly?: boolean;
  /** Rendered as a lime pill beside the menu rather than as a nav link. */
  cta?: boolean;
  /**
   * Dropdown in the desktop bar; sub-list in the mobile menu. The footer maps
   * NAV flat and reads only `to` and `label` (site-footer.tsx), so children are
   * invisible there by construction.
   */
  children?: readonly NavChild[];
}

/**
 * The children the MOBILE menu renders.
 *
 * `self` is dropped because the mobile parent row is itself a `<Link>` to that
 * destination — rendering it would print the parent's label twice, once
 * directly beneath itself. That defect survived a full review round once
 * already, which is why the filter is a named function the test can bind to
 * instead of an expression inlined in JSX: a test that re-created the
 * expression would stay green if the render stopped filtering.
 */
export const mobileNavChildren = (children: readonly NavChild[]): readonly NavChild[] =>
  children.filter((child) => !child.self);
