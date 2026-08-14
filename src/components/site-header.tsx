import { Link } from "@tanstack/react-router";
import { useState } from "react";

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
}

const NAV = [
  { to: "/about", label: "About" },
  { to: "/be-human-ai", label: "Be Human AI" },
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
  { to: "/the-new-human-era", label: "The New Human Era" },
  { to: "/the-human-archive", label: "The Human Archive" },
  { to: "/podcast", label: "Podcast" },
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

        <nav className="hidden justify-center gap-7 lg:flex">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="eyebrow link-underline text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="display block border-b border-border py-4 text-3xl text-foreground"
            >
              {item.label}
            </Link>
          ))}

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
