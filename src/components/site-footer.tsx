import { Link } from "@tanstack/react-router";
import { NAV, Wordmark } from "./site-header";

const SOCIAL = ["YouTube", "LinkedIn", "Instagram", "TikTok", "Spotify", "X"];

export function SiteFooter() {
  return (
    <footer className="section-ink border-t border-border">
      <div className="border-b border-border bg-lime py-5 text-center">
        <p className="display px-4 text-2xl text-ink sm:text-4xl">
          The future belongs to the most human
        </p>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <Wordmark />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            An AI strategy and transformation company, and a cultural movement for practising what
            keeps us human.
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
              <li key={s}>
                <a href="#" className="text-sm text-foreground/80 hover:text-lime">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-muted-foreground">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm text-foreground/80">
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
            <li className="text-muted-foreground">Sydney · London · New York</li>
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
