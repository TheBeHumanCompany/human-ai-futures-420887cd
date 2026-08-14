import { Link } from "@tanstack/react-router";

import { MISSION } from "@/lib/positioning";
import { PLACEHOLDER_HREF, displaySocialLinks } from "@/lib/socials";

import { NAV, Wordmark } from "./site-header";

/**
 * Platforms come from `src/lib/socials.ts`, shared with the homepage's
 * "Follow the journey" section.
 *
 * This footer previously carried its own six-name array that listed Spotify
 * while the homepage listed Facebook and Snapchat. Neither had a working link
 * and each was edited without the other. One list now feeds both.
 */
const SOCIAL = displaySocialLinks();

export function SiteFooter() {
  return (
    <footer className="section-ink border-t border-border">
      <div className="border-b border-border bg-lime py-5 text-center">
        <p className="display px-4 text-4xl uppercase tracking-normal text-ink max-sm:px-2 max-sm:text-[clamp(1.45rem,5.6vw,1.95rem)] max-sm:leading-none max-sm:tracking-[-0.02em] sm:tracking-normal">
          The future belongs to the most human
        </p>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <Wordmark />
          {/*
            Drawn from `positioning.ts` rather than re-typed here. This line
            previously split the company into a commercial arm and a cultural
            one — the superseded model that `/why-we-exist` replaces — and it
            rendered on every page of the site, which made it the widest single
            statement of it anywhere.
          */}
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {MISSION.missionLine}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Indigenous and Canadian-owned.
          </p>
          <p className="font-hand mt-8 text-2xl text-lime">Stay Human.</p>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Navigate</h3>
          <ul className="mt-5 space-y-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-foreground/80 hover:text-lime">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Follow</h3>
          <ul className="mt-5 space-y-3">
            {SOCIAL.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  {...(s.href === PLACEHOLDER_HREF
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="text-sm text-foreground/80 hover:text-lime"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm text-foreground/80">
            {/*
              One address, replacing the previous hello@ and ai@ split. Two
              published addresses make a visitor choose before they have said
              anything, and the wrong choice reads as being sent to the wrong
              desk. The studios line that sat here was removed: it named Sydney,
              London and New York, which contradicts the Indigenous-founded
              Canadian positioning stated directly above it.
            */}
            <li>
              <a href="mailto:connect@thebehumancompany.ca" className="hover:text-lime">
                connect@thebehumancompany.ca
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-6 sm:px-8">
        <p className="eyebrow text-muted-foreground">© 2026 The Be Human Company</p>
      </div>
    </footer>
  );
}
