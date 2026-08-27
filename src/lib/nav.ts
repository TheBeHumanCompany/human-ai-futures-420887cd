/**
 * The site navigation, as data.
 *
 * Written from the binding tree in the spec (Amendment 1), which states it
 * completely:
 *
 *   ABOUT ⌄ (Why We Exist · Who We Are) | THE NEW HUMAN ERA | THE HUMAN ARCHIVE
 *   | PODCAST | CONTACT | [BLUEPRINT ⌄ pill] (Human Readiness ·
 *   Governance & Sovereignty · Intelligence Strategy)
 *
 * Six top-level items, in that order. Exactly two of them have children.
 * `nav.test.ts` deep-equals the whole tree rather than checking a length,
 * because every failure this model can have — a reordered item, a child
 * hoisted to the top level, a label drifting from the one the user approved —
 * is invisible to a count.
 *
 * ── The split-control trap ──────────────────────────────────────────────────
 *
 * A dropdown trigger is a `<button>`. It opens a panel; it does not navigate.
 * For a parent that is only a menu label, that is exactly right. For a parent
 * that is ALSO a real page, it is a trap: the page becomes unreachable from
 * the bar, and nothing about the markup looks wrong.
 *
 * Both parents here are the second kind. Blueprint is the commercial centre of
 * the site, and About points at `/about`, which stays live and would otherwise
 * be orphaned from navigation entirely. So both render as split controls: the
 * label is a `<Link>`, and a separate chevron button opens the panel.
 *
 * The difference is carried by `triggerNavigates`, and both the header and its
 * tests branch on the flag rather than naming an item. Nothing in the tree
 * currently sets it to `false` — the non-navigating shape is kept, tested
 * against a synthetic item, and reachable by changing one field, because that
 * is the switch that makes the `/about` redirect a one-line decision later
 * rather than a rebuild.
 */

/**
 * Every destination the nav may point at.
 *
 * A literal union rather than `string`, so a typo in a `to` is a type error
 * at the point it is written instead of a 404 discovered in production. These
 * are router `fullPath`s and must stay in step with `routeTree.gen.ts`;
 * `src/lib/surfaces.ts` is what asserts that agreement.
 */
export type NavRoute =
  | "/"
  | "/why-we-exist"
  | "/who-we-are"
  | "/the-new-human-era"
  | "/the-human-archive"
  | "/podcast"
  | "/contact"
  | "/be-human-ai";

/** An entry inside a dropdown panel. Always a real destination. */
export type NavChild = {
  to: NavRoute;
  label: string;
};

type NavItemBase = {
  label: string;
  children?: readonly NavChild[];
  /**
   * Render as the lime pill — visually distinct from the text items. Exactly
   * one item in the tree carries this, which is what "distinct" means.
   */
  cta?: boolean;
};

/**
 * An item whose primary control navigates: a plain link, or — when it also has
 * children — the split control.
 */
export type NavigatingItem = NavItemBase & {
  to: NavRoute;
  triggerNavigates: true;
};

/**
 * An item whose control only opens a panel.
 *
 * `children` is required here, and that is the point of splitting the type:
 * an item that neither navigates nor discloses anything would render as an
 * inert label, and the union makes that unrepresentable rather than merely
 * unlikely. It also makes `to` present exactly when `triggerNavigates` is
 * true, so the header can branch on the flag and get the destination narrowed
 * for free instead of asserting it is there.
 */
export type DisclosureItem = NavItemBase & {
  to?: undefined;
  triggerNavigates: false;
  children: readonly NavChild[];
};

export type NavItem = NavigatingItem | DisclosureItem;

export const NAV: readonly NavItem[] = [
  // 2026-08-26: the About dropdown was removed. Its two children are now
  // top-level items of their own, so the bar has no parents left — every item
  // navigates directly and `/about` stays live, reachable by URL.
  { label: "Why We Exist", to: "/why-we-exist", triggerNavigates: true },
  { label: "Who We Are", to: "/who-we-are", triggerNavigates: true },
  { label: "The New Human Era", to: "/the-new-human-era", triggerNavigates: true },
  { label: "The Human Archive", to: "/the-human-archive", triggerNavigates: true },
  { label: "Podcast", to: "/podcast", triggerNavigates: true },
  { label: "Contact", to: "/contact", triggerNavigates: true },
  {
    label: "Blueprint",
    to: "/be-human-ai",
    triggerNavigates: true,
    cta: true,
  },
] as const;

/**
 * True when the item renders a dropdown panel at all.
 *
 * Generic in `T` so it narrows *within* whichever union member it was handed,
 * rather than widening back to `NavItem` and losing the `to` the caller had
 * already established.
 */
export function hasChildren<T extends NavItem>(
  item: T,
): item is T & { children: readonly NavChild[] } {
  return (item.children?.length ?? 0) > 0;
}

/**
 * The links a mobile disclosure should list for a parent item.
 *
 * On desktop, Blueprint's own page is reached through the pill, which sits
 * beside the chevron. On mobile there is no pill — the row IS the toggle — so
 * a parent that navigates would otherwise become unreachable the moment it
 * grew a child. Derived from `triggerNavigates` rather than hardcoded, so the
 * rule holds for any future parent: if the trigger navigates, its own
 * destination leads its own sub-list.
 */
export function mobileNavChildren(item: NavItem): NavChild[] {
  const children = [...(item.children ?? [])];
  if (item.triggerNavigates) {
    return [{ to: item.to, label: item.label }, ...children];
  }
  return children;
}

/**
 * The flat set of destinations the nav can reach, for the footer's Navigate
 * column and for gates that need "every page the nav offers".
 *
 * Order is document order — parents' children appear where the parent sits.
 */
export function navDestinations(): NavChild[] {
  const out: NavChild[] = [];
  for (const item of NAV) {
    if (item.triggerNavigates) out.push({ to: item.to, label: item.label });
    for (const child of item.children ?? []) out.push(child);
  }
  return out;
}
