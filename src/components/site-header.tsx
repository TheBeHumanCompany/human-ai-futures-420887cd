import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  NAV,
  hasChildren,
  mobileNavChildren,
  type DisclosureItem,
  type NavChild,
  type NavItem,
  type NavigatingItem,
} from "@/lib/nav";

/** An item known to render a panel — the shape `hasChildren` narrows to. */
type WithChildren<T extends NavItem> = T & { children: readonly NavChild[] };

/**
 * The site header.
 *
 * ── Exactly one `<nav>`, deliberately ──────────────────────────────────────
 *
 * AC-3.3 asserts that every page except the Blueprint renders a single `<nav>`
 * inside the header, because a second one is how a page ends up with two
 * competing navigations that disagree. That constraint decided the primitive.
 *
 * The plan proposed Radix `NavigationMenu` for the desktop bar. It cannot be
 * used here: `NavigationMenuPrimitive.Root` renders its own `<nav>` element
 * (verified in `@radix-ui/react-navigation-menu`), so nesting it inside the
 * header's nav would put two `<nav>`s on every page and fail AC-3.3 site-wide.
 * `DropdownMenu` renders a button and a portalled panel — no landmark of its
 * own — so the header owns exactly one `<nav>`, always, open or closed.
 *
 * The mobile drawer lives inside that same `<nav>` rather than beside it, for
 * the same reason: a second `<nav>` that only appears when the menu is open is
 * a gate that passes on every page load and is wrong the moment a user taps.
 */

export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link to="/" className="group inline-flex flex-col leading-none">
      <span className={`type-wordmark ${tone === "dark" ? "text-ink" : "text-foreground"}`}>
        THE BE HUMAN COMPANY
      </span>
    </Link>
  );
}

const DESKTOP_LINK =
  "eyebrow link-underline text-muted-foreground transition-colors hover:text-foreground";

/**
 * A top-level item with no panel: an ordinary link — or the lime pill.
 *
 * The pill used to live only on the split control, because the one item
 * carrying `cta` also had a dropdown. Blueprint lost its dropdown in the
 * 2026-08-24 rebuild, so the treatment has to be available here too or the one
 * visually distinct item in the bar would silently become a text link.
 */
function FlatItem({ item }: { item: NavigatingItem }) {
  const pill = item.cta === true;

  return (
    <Link
      to={item.to}
      data-nav-item={item.label}
      {...(pill ? { "data-nav-cta": "true" } : {})}
      className={
        pill
          ? "eyebrow inline-flex items-center rounded-full border border-lime px-5 py-2 text-lime transition-colors duration-200 hover:bg-lime hover:text-ink"
          : DESKTOP_LINK
      }
      activeProps={pill ? undefined : { className: "text-foreground" }}
    >
      {item.label}
    </Link>
  );
}



/** The panel contents, shared by both parent shapes. */
function Panel({ item, onNavigate }: { item: WithChildren<NavItem>; onNavigate?: () => void }) {
  return (
    <DropdownMenuContent align="start" className="min-w-56 border-border bg-background p-1">
      {item.children.map((child) => (
        <DropdownMenuItem key={child.to} asChild>
          <Link
            to={child.to}
            onClick={onNavigate}
            className="eyebrow block w-full cursor-pointer px-3 py-2.5 text-muted-foreground focus:text-foreground"
          >
            {child.label}
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}

/**
 * A parent whose trigger does NOT navigate — the pure menu label.
 *
 * The whole control is the button, which is only safe for a parent that has no
 * page of its own. A parent that did have one and rendered this shape would be
 * unreachable from the bar, and nothing about the markup would look wrong —
 * which is why the shape is chosen off `triggerNavigates` rather than off the
 * label, and why the flag is asserted to track the presence of `to`.
 */
function TriggerOnlyItem({ item }: { item: DisclosureItem }) {
  // Currently unreached: both parents in the tree navigate. Kept, and covered
  // by a synthetic item in `nav.test.ts`, because it is the other half of the
  // switch — if `/about` is ever folded into `/why-we-exist`, About becomes a
  // pure label and lands here with no component change.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-nav-item={item.label}
        className={`${DESKTOP_LINK} inline-flex items-center gap-1.5 outline-none data-[state=open]:text-foreground`}
      >
        {item.label}
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <Panel item={item} />
    </DropdownMenu>
  );
}

/**
 * A parent that is also a page — the split control. Both parents use it.
 *
 * The label is a real `<Link>`; the chevron beside it is a separate button
 * that opens the panel. Two controls, one visual unit, so the parent's own
 * page is reachable in one click and its children in two.
 *
 * Only the pill treatment is conditional. Blueprint carries `cta`, so it gets
 * the lime ground; About does not, so it reads as a text item like the four
 * flat ones. That distinction is the criterion — the pill has to be the *only*
 * one, or "visually distinct" means nothing — so it is driven by the data and
 * asserted as a count, not applied by hand to whichever item looks important.
 *
 * The wrapper is also the node carrying `data-nav-item`, which is where the
 * computed `background-color` and `border-radius` are read from.
 */
function SplitItem({ item }: { item: WithChildren<NavigatingItem> }) {
  const pill = item.cta === true;

  return (
    <DropdownMenu>
      <div
        data-nav-item={item.label}
        {...(pill ? { "data-nav-cta": "true" } : {})}
        className={
          pill
            ? "inline-flex items-center gap-1 rounded-full bg-lime pl-4 pr-2.5 text-ink"
            : "inline-flex items-center gap-1.5"
        }
      >
        <Link
          to={item.to}
          className={pill ? "eyebrow py-2 text-ink" : `${DESKTOP_LINK} py-2`}
          activeProps={pill ? undefined : { className: "text-foreground" }}
        >
          {item.label}
        </Link>
        <DropdownMenuTrigger
          aria-label={`Open ${item.label} menu`}
          className={
            pill
              ? "grid h-6 w-6 place-items-center rounded-full text-ink outline-none transition-colors hover:bg-ink/10 data-[state=open]:bg-ink/10"
              : "grid h-5 w-5 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground"
          }
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </DropdownMenuTrigger>
      </div>
      <Panel item={item} />
    </DropdownMenu>
  );
}

function DesktopItem({ item }: { item: NavItem }) {
  // A non-navigating item is a disclosure by construction — the union requires
  // it to have children — so this branch needs no fallback for the "inert
  // label" case the types make unrepresentable.
  if (!item.triggerNavigates) return <TriggerOnlyItem item={item} />;
  return hasChildren(item) ? <SplitItem item={item} /> : <FlatItem item={item} />;
}

/** One row of the mobile drawer. Parents disclose; leaves navigate. */
function MobileItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  if (item.triggerNavigates && !hasChildren(item)) {
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        className="type-h3-caps-light block border-b border-border py-4 text-foreground"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <Collapsible className="border-b border-border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-4 text-left">
        <span className={`type-h3-caps-light ${item.cta ? "text-lime" : "text-foreground"}`}>
          {item.label}
        </span>
        <ChevronDown
          className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="pb-4 pl-4">
          {mobileNavChildren(item).map((child) => (
            <li key={child.to}>
              <Link
                to={child.to}
                onClick={onNavigate}
                className="eyebrow block py-3 text-muted-foreground"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)]">
      <nav aria-label="Primary">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8 lg:grid-cols-[auto_1fr_auto]">
          <Wordmark />

          <ul className="hidden items-center justify-center gap-5 xl:gap-6 lg:flex">
            {NAV.map((item) => (
              <li key={item.label}>
                <DesktopItem item={item} />
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-3">
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
          <div className="border-t border-border px-5 pb-6 pt-2 sm:px-8 lg:hidden">
            {NAV.filter((item) => !item.cta).map((item) => (
              <MobileItem key={item.label} item={item} onNavigate={close} />
            ))}
            <Link
              to="/be-human-ai"
              onClick={close}
              className="eyebrow mt-6 inline-flex rounded-full border border-lime px-5 py-3 text-lime"
            >
              Blueprint
            </Link>
          </div>
        )}

      </nav>
    </header>
  );
}
