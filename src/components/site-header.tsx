import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mobileNavChildren, type NavChild, type NavItem } from "@/lib/nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

/** Two children may share a route and differ only by hash, so the key needs both. */
const childKey = (child: NavChild): string => `${child.to}${child.hash ?? ""}`;

/**
 * The three service pillars, as the Blueprint's sections.
 *
 * Labels are shortened from their `NAV` entries — "Security, Governance &
 * Sovereignty" is the longest label on the site and wraps to three lines in a
 * dropdown. The footer still lists the full names.
 */
const BLUEPRINT_CHILDREN: readonly NavChild[] = [
  { to: "/be-human-ai/human-readiness", label: "Human Readiness" },
  { to: "/be-human-ai/governance", label: "Governance & Sovereignty" },
  { to: "/be-human-ai/ai-strategy", label: "AI Strategy" },
];

/**
 * Annotated `readonly NavChild[]` rather than left to `as const` inference, and
 * the annotation is load-bearing.
 *
 * Inside `as const satisfies` every child becomes its own literal type, so
 * `child.self` and `child.hash` are a TS2339 on the children that lack the key
 * — and an `in` check does not rescue `hash`, because when no member of the
 * union declares it the property narrows to `unknown`, which `<Link>` rejects.
 * Widening once here lets both renders read a child's fields directly. `to`
 * stays safe for `<Link>` because `NavRoute` is itself a literal union.
 */
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
const WHY_WE_EXIST_CHILDREN: readonly NavChild[] = [
  { to: "/why-we-exist", label: "Overview", self: true },
  { to: "/be-human-ai", label: "Be Human AI" },
  { to: "/the-new-human-era", label: "The New Human Era" },
  { to: "/the-human-archive", label: "The Human Archive" },
  { to: "/podcast", label: "Podcast" },
];

const NAV = [
  {
    to: "/why-we-exist",
    label: "Why We Exist",
    children: WHY_WE_EXIST_CHILDREN,
  },
  { to: "/be-human-ai", label: "Be Human AI", footerOnly: true },
  {
    to: "/be-human-ai/blueprint",
    label: "Blueprint",
    cta: true,
    // A split control: the pill navigates, the chevron beside it opens the
    // panel. Hence `triggerNavigates` and no `self` child — the three pillars
    // are the sections of the engagement the Blueprint sells, and they were
    // otherwise reachable only from the footer.
    triggerNavigates: true,
    children: BLUEPRINT_CHILDREN,
  },
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

/**
 * The promoted call to action, if one is flagged.
 *
 * Narrowed with a predicate rather than left as the whole union, because the
 * split control reads `CTA_ITEM.children` and a bare `find` returns every
 * member of `NAV` — most of which have no children.
 */
const CTA_ITEM = NAV.find(
  (item): item is Extract<(typeof NAV)[number], { cta: true }> => "cta" in item,
);

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
              // One level down the fix is different: the children arrays are
              // ANNOTATED `readonly NavChild[]`, so `child.self` and
              // `child.hash` read directly and need no narrow at all.
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
                  {/*
                    The focus ring is deliberate. An earlier version set
                    `focus-visible:outline-none` and leaned on `link-underline`,
                    which only reacts to `:hover` (styles.css) — so a keyboard
                    user tabbing onto the trigger got no visible indication at
                    all. `link-underline` now answers `:focus-visible` too, and
                    the outline is kept as well because the trigger opens a
                    panel rather than navigating.
                  */}
                  <NavigationMenuPrimitive.Trigger className="eyebrow link-underline group inline-flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime data-[state=open]:text-foreground">
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
                              {...(child.hash ? { hash: child.hash } : {})}
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
            /*
              A split control, not a trigger. The pill stays a real <Link> so
              the priced offer is still one click away; only the chevron beside
              it opens the panel. That is why this item carries
              `triggerNavigates` and no `self` child — see nav.ts.

              DropdownMenu rather than a second NavigationMenu: Radix's
              NavigationMenu.Root renders its own <nav>, and a second one here
              would give the header two navigation landmarks.
            */
            <div className="hidden items-center rounded-full bg-lime transition-transform hover:-translate-y-0.5 lg:inline-flex">
              <Link to={CTA_ITEM.to} className="eyebrow py-2.5 pl-5 pr-2 text-ink">
                {CTA_ITEM.label}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Show what ${CTA_ITEM.label} covers`}
                  className="group cursor-pointer rounded-full py-2.5 pl-1 pr-4 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <ChevronDown
                    className="h-3 w-3 transition-transform duration-300 group-data-[state=open]:rotate-180"
                    aria-hidden
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[15rem]">
                  {CTA_ITEM.children.map((child) => (
                    /*
                      `focus:bg-accent` is overridden for the same reason the
                      NavigationMenu trigger avoids the stock style: --accent
                      is --lime here, and Radix focuses a menu item on pointer
                      move, so the shipped default paints a lime block behind
                      every row the cursor passes over.
                    */
                    <DropdownMenuItem
                      key={childKey(child)}
                      asChild
                      className="cursor-pointer px-3 py-2.5 text-sm text-foreground/80 focus:bg-transparent focus:text-lime"
                    >
                      <Link to={child.to} {...(child.hash ? { hash: child.hash } : {})}>
                        {child.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    `mobileNavChildren` drops the `self` entry. The parent row
                    directly above IS a real <Link> to that destination, so
                    rendering it here would print "Why We Exist" immediately
                    beneath "Why We Exist". The filter lives in that exported
                    function rather than inline precisely so nav.test.ts can
                    bind to it — a test that re-created the expression would
                    stay green if this call ever stopped filtering.
                  */}
                  {mobileNavChildren(item.children).map((child) => (
                    <Link
                      key={childKey(child)}
                      to={child.to}
                      {...(child.hash ? { hash: child.hash } : {})}
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
            <>
              <Link
                to={CTA_ITEM.to}
                onClick={() => setOpen(false)}
                className="eyebrow mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
              >
                {CTA_ITEM.label} <span aria-hidden>→</span>
              </Link>

              {/*
                The Blueprint's sections, listed rather than tucked behind a
                disclosure. There is no split control to replicate here — the
                pill above is already the link — and three short rows at the
                very bottom of the menu cost nothing, whereas hiding them would
                leave the pillars reachable only from the footer on a phone.
              */}
              <ul className="mt-5 border-t border-border pt-4">
                {mobileNavChildren(CTA_ITEM.children).map((child) => (
                  <li key={childKey(child)}>
                    <Link
                      to={child.to}
                      {...(child.hash ? { hash: child.hash } : {})}
                      onClick={() => setOpen(false)}
                      className="block py-2 text-base text-foreground/70"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export { NAV };
