import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

/**
 * One entry beneath a parent item, in the desktop dropdown and the mobile
 * sub-list.
 */
export interface NavChild {
  to: string;
  hash?: string;
  label: string;
  /**
   * The parent's own destination, repeated inside the panel.
   *
   * Exists ONLY because the desktop trigger is a non-navigating <button>
   * (ui/navigation-menu.tsx:41) — it is compensation for a desktop-only
   * affordance loss, not content. The mobile parent row IS a real <Link>
   * and already carries this destination, so the mobile render filters it
   * out. Its label must differ from the parent's; the nav test enforces that
   * unconditionally.
   */
  self?: true;
}

/**
 * The three things both renders need from a child, read through `NavChild`.
 *
 * `NAV` is `as const satisfies`, so every child is its own literal type and a
 * bare `child.hash` or `child.self` is a TS2339 on the children that lack the
 * key. An `in` check does not rescue it either: when NO member of the union
 * declares `hash`, `in` narrows the property to `unknown`, which `<Link>`
 * rejects. Taking a `NavChild` parameter widens the literal to the declared
 * shape once, in one place, and hands back something typed.
 *
 * Both renders go through these rather than repeating the access, because the
 * desktop and mobile blocks reading a child differently is exactly how the
 * `self` entry escaped into the mobile menu once already.
 */
const isSelfChild = (child: NavChild): boolean => child.self === true;

/** Two children may share a route and differ only by hash, so the key needs both. */
const childKey = (child: NavChild): string => `${child.to}${child.hash ?? ""}`;

/**
 * `hash` is threaded but unused today: no child carries one. The field exists
 * for the founder page, which lands as `#founder` on `/why-we-exist` before it
 * becomes a route of its own. Keeping the field and the threading is the
 * difference between an extensible shape and a rewrite later.
 */
const hashProps = (child: NavChild): { hash?: string } =>
  child.hash === undefined ? {} : { hash: child.hash };

/**
 * Every route worth linking to, in one array.
 *
 * This is the single navigation source of truth: the desktop bar, the mobile
 * menu, and the footer's Navigate column all render from it, so a route added
 * here appears in all three.
 *
 * **Two flags decide placement, and getting them backwards inverts the whole
 * intent.** The header filters `footerOnly` out; the footer filters nothing and
 * lists everything. So a `footerOnly` route is reachable from the footer and
 * from in-page links, but does not crowd the desktop bar — which matters here,
 * because six long labels already fill it and the three pillar labels are the
 * longest on the site.
 *
 * `cta` promotes the Blueprint out of the link row entirely. It is the priced
 * offer the sales pages exist to sell, and rendering it as the seventh
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
   * NAV flat and reads only `to` and `label` (site-footer.tsx:42-48), so
   * children are invisible there by construction.
   */
  children?: readonly NavChild[];
}

/**
 * The four initiatives sit UNDER the mission page rather than beside it.
 *
 * A bar reading `About · Be Human AI · The New Human Era · The Human Archive ·
 * Podcast · Contact` rendered the exact complaint this change answers: four
 * peers with no visible relationship to each other. Nesting them under "Why We
 * Exist" is where the four-initiative family is stated, so the navigation
 * asserts the model instead of contradicting it.
 *
 * They keep `footerOnly` — an application of the flag as documented above, not
 * a redefinition — so the footer still lists all eleven routes.
 */
const NAV = [
  {
    to: "/why-we-exist",
    label: "Why We Exist",
    children: [
      { to: "/why-we-exist", label: "Overview", self: true },
      { to: "/be-human-ai", label: "Be Human AI" },
      { to: "/the-new-human-era", label: "The New Human Era" },
      { to: "/the-human-archive", label: "The Human Archive" },
      { to: "/podcast", label: "Podcast" },
    ],
  },
  { to: "/be-human-ai", label: "Be Human AI", footerOnly: true },
  { to: "/be-human-ai/blueprint", label: "Blueprint", cta: true },
  { to: "/be-human-ai/human-readiness", label: "Human Readiness", footerOnly: true },
  {
    to: "/be-human-ai/governance",
    label: "Security, Governance & Sovereignty",
    footerOnly: true,
  },
  {
    to: "/be-human-ai/ai-strategy",
    label: "AI Strategy & Transformation",
    footerOnly: true,
  },
  { to: "/the-new-human-era", label: "The New Human Era", footerOnly: true },
  { to: "/the-human-archive", label: "The Human Archive", footerOnly: true },
  { to: "/podcast", label: "Podcast", footerOnly: true },
  // Team, story and press. It lost its bar slot to the mission page and would
  // otherwise be orphaned in the UI while still sitting in the sitemap.
  { to: "/about", label: "About", footerOnly: true },
  { to: "/contact", label: "Contact" },
] as const satisfies readonly NavItem[];

/** Menu entries: everything except footer-only routes and the promoted CTA. */
const MENU_ITEMS = NAV.filter((item) => !("footerOnly" in item) && !("cta" in item));

/** The promoted call to action, if one is flagged. */
const CTA_ITEM = NAV.find((item) => "cta" in item);

export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link to="/" className="group inline-flex flex-col leading-none">
      <span
        className={`display text-xl font-bold uppercase tracking-tight sm:text-2xl ${tone === "dark" ? "text-ink" : "text-foreground"}`}
      >
        THE BE HUMAN COMPANY
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8 lg:grid-cols-[auto_1fr_auto]">
        <Wordmark />

        {/*
          NavigationMenuPrimitive.Root renders a <nav>, so this REPLACES the
          bar's old <nav> wrapper rather than nesting inside it — the header
          must expose exactly one navigation landmark.

          `lg:justify-self-center` is load-bearing for the dropdown, not just
          for looks. The panel's positioning wrapper is a hard-coded
          `absolute left-0 top-full` that accepts no className
          (ui/navigation-menu.tsx:80), so the panel hangs from the ROOT's left
          edge. Letting the root stretch across the 1fr centre column would
          drop the panel at the column's left edge, far from its trigger.
          Shrinking the root to its content (`max-w-max`, already on the root
          at :14) and centring it in the column instead means the root's left
          edge IS the trigger's left edge — so the panel lands under the
          trigger with no edit to the shared file. `relative` on the root at
          :14 is what the panel positions against, and must survive any class
          change here.
        */}
        <NavigationMenu className="hidden lg:flex lg:justify-self-center">
          <NavigationMenuList className="gap-7 space-x-0">
            {MENU_ITEMS.map((item) =>
              // A presence narrow, not `item.children` — NAV is
              // `as const satisfies`, so MENU_ITEMS has a union element type
              // and a bare property access is a compile error on the members
              // without the key. Same idiom the filters above use.
              //
              // The same problem exists one level down, where `in` is NOT the
              // fix — see `isSelfChild` / `childKey` / `hashProps` above.
              "children" in item ? (
                <NavigationMenuItem key={item.to}>
                  {/*
                    The Radix trigger directly, NOT the shadcn
                    `NavigationMenuTrigger`: its `cva` string
                    (ui/navigation-menu.tsx:38) carries `hover:bg-accent`, and
                    `--accent` is `--lime` here (styles.css:73), so the stock
                    component paints a lime block behind a nav item on hover.
                    Its chevron is also hard-sized for shadcn's `text-sm`,
                    which is oversized inside an `eyebrow` label.
                  */}
                  <NavigationMenuPrimitive.Trigger className="eyebrow link-underline group inline-flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none data-[state=open]:text-foreground">
                    {item.label}
                    <ChevronDown
                      className="ml-1.5 h-2.5 w-2.5 transition-transform duration-300 group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </NavigationMenuPrimitive.Trigger>

                  {/*
                    The panel itself needs almost nothing: the viewport already
                    uses `bg-popover` (--ink-soft), `border` (--hairline) and
                    `rounded-md` (--radius) at :83, all existing tokens and all
                    correct on a dark header. The lime hazard was confined to
                    the trigger; do not rebuild a compliant panel.
                  */}
                  <NavigationMenuContent>
                    <ul className="w-[17rem] p-2">
                      {item.children.map((child) => (
                        <li key={childKey(child)}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={child.to}
                              {...hashProps(child)}
                              className="block px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:text-lime"
                              activeProps={{ className: "text-lime" }}
                            >
                              {child.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.to}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.to}
                      className="eyebrow link-underline text-muted-foreground transition-colors hover:text-foreground"
                      activeProps={{ className: "text-foreground" }}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {CTA_ITEM && (
            <Link
              to={CTA_ITEM.to}
              className="eyebrow hidden rounded-full bg-lime px-5 py-2.5 text-ink transition-transform hover:-translate-y-0.5 lg:inline-flex"
            >
              {CTA_ITEM.label}
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center border border-border lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-5 pb-6 pt-2 sm:px-8 lg:hidden">
          {MENU_ITEMS.map((item) =>
            "children" in item ? (
              // Radix Collapsible, closed by default. Four child rows beneath a
              // `text-3xl py-4` parent would otherwise push Contact and the
              // Blueprint CTA toward the fold on a small phone. This is a
              // tap-driven panel, so a hover-intent NavigationMenu does not
              // belong inside it.
              <Collapsible key={item.to}>
                <div className="flex items-center justify-between border-b border-border">
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="display block py-4 text-3xl text-foreground"
                  >
                    {item.label}
                  </Link>
                  <CollapsibleTrigger
                    aria-label={`Show what sits under ${item.label}`}
                    className="group grid h-10 w-10 shrink-0 cursor-pointer place-items-center text-muted-foreground"
                  >
                    <ChevronDown
                      className="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  {/*
                    The `self` child is filtered OUT here, and the filtered list
                    is mapped inline so no intermediate binding can be mapped by
                    mistake. `self` exists only to give the desktop dropdown a
                    route to the parent page, because the desktop trigger is a
                    non-navigating <button>. The parent row directly above IS a
                    real <Link> to that destination, so rendering the self entry
                    here would print "Why We Exist" immediately beneath "Why We
                    Exist" — and this block has no automated coverage beyond the
                    label-inequality rule in nav.test.ts.
                  */}
                  {item.children
                    .filter((child) => !isSelfChild(child))
                    .map((child) => (
                      <Link
                        key={childKey(child)}
                        to={child.to}
                        {...hashProps(child)}
                        onClick={() => setOpen(false)}
                        className="block border-b border-border py-3 pl-5 text-lg text-foreground/75"
                      >
                        {child.label}
                      </Link>
                    ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="display block border-b border-border py-4 text-3xl text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}

          {/* The pill has no room in the mobile bar, so the CTA lands here instead. */}
          {CTA_ITEM && (
            <Link
              to={CTA_ITEM.to}
              onClick={() => setOpen(false)}
              className="eyebrow mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
            >
              {CTA_ITEM.label} <span aria-hidden>→</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export { NAV };
