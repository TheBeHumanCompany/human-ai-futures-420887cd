import { Link } from "@tanstack/react-router";

import { MapleLeaf } from "./maple-leaf";
import { Wordmark } from "./site-header";
import { INDIGENOUS_LINE, SOCIAL_LINKS } from "@/lib/brand";
import { navDestinations } from "@/lib/nav";

/**
 * The footer.
 *
 * Two things here are asserted rather than reviewed.
 *
 * The Indigenous line is rendered from `INDIGENOUS_LINE`, never typed inline —
 * several variants of that sentence were in circulation and two acceptance
 * criteria demanded different ones, so the constant is the tiebreak and a test
 * asserts no other file contains the copy. The maple leaf is a sibling of the
 * text node, not a decoration floating elsewhere in the block: it marks that
 * specific line, and the DOM distance between them is measured to prove it
 * still does.
 *
 * The social links are the accounts that exist. This column previously listed
 * six platform labels, every one linking to a bare fragment placeholder,
 * including platforms the company has no account on at all. A dead link on a
 * brand's own footer is worse than an absent one, so the missing ones were
 * removed rather than pointed somewhere plausible.
 *
 * The Contact column's "Studios" row is gone too. It named three cities this
 * company has no offices in.
 */
export function SiteFooter() {
  return (
    <footer className="section-ink border-t border-border">
      <div className="border-b border-border bg-lime py-5 text-center">
        {/* The `max-sm` size override is not a bespoke step reaching around the
            scale — it is an overflow guard. This one line is long enough that
            the scale's floor (2rem) breaks it across three rows on a 375px
            screen, inside a band sized for one. */}
        <p className="type-h2-caps px-4 tracking-normal text-ink max-sm:px-2 max-sm:text-[clamp(1.45rem,5.6vw,1.95rem)] max-sm:leading-none max-sm:tracking-[-0.02em] sm:tracking-normal">
          The future belongs to the most human
        </p>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <Wordmark />
          <p className="mt-6 max-w-xs type-body-sm text-muted-foreground">
            An AI strategy and transformation company, and a cultural movement for practising what
            keeps us human.
          </p>

          <p
            data-brand="indigenous-line"
            className="mt-6 inline-flex items-center gap-2 type-body-sm text-foreground/80"
          >
            <MapleLeaf className="h-4 w-4 shrink-0 text-lime" />
            <span>{INDIGENOUS_LINE}</span>
          </p>

          <p className="font-hand mt-8 text-2xl text-lime">Stay Human.</p>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Navigate</h3>
          <ul className="mt-5 space-y-3">
            {navDestinations().map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="type-body-sm text-foreground/80 hover:text-lime">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Follow</h3>
          <ul className="mt-5 space-y-3">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="type-body-sm text-foreground/80 hover:text-lime"
                >
                  {social.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Contact</h3>
          <ul className="mt-5 space-y-3 type-body-sm text-foreground/80">
            <li>
              <a href="mailto:hello@thebehumancompany.ca" className="hover:text-lime">
                hello@thebehumancompany.ca
              </a>
            </li>
            <li>
              <a href="mailto:ai@thebehumancompany.ca" className="hover:text-lime">
                ai@thebehumancompany.ca
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-6 sm:px-8">
        <p className="eyebrow text-muted-foreground">© 2026 The Be Human Company</p>
        <p className="eyebrow text-muted-foreground">Human + AI · Better together</p>
      </div>
    </footer>
  );
}
