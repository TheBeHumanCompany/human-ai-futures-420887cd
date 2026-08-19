import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BOOKING_URL_30MIN } from "@/lib/booking";

/**
 * The shared shape of the three Blueprint pillar pages.
 *
 * These routes exist because the Blueprint page was carrying all three
 * pillars' depth inline, which is most of what made it read as information
 * overload. Moving the depth to its own destination is the single largest
 * lever on that, and it is why the pillars are routes rather than anchors:
 * an anchor would have satisfied "the destination exists" while leaving every
 * word on the page it was supposed to relieve.
 *
 * Lives in `src/components/` rather than beside the routes so that the router
 * never has to be told to ignore it — a non-route file inside `src/routes/`
 * is a filename convention away from becoming a route by accident.
 */
export type PillarSection = {
  /** Stable anchor id, so the Blueprint's summary cards can deep-link in. */
  id: string;
  heading: string;
  body: ReactNode;
};

export function PillarPage({
  title,
  kicker,
  lede,
  question,
  sections,
  focusAreas,
}: {
  /** Rendered as the page's only `<h1>`, verbatim. */
  title: string;
  kicker: string;
  lede: string;
  /** The one question this pillar exists to answer, in the client's words. */
  question: string;
  sections: readonly PillarSection[];
  focusAreas: readonly string[];
}) {
  return (
    <>
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-lime">{kicker}</p>
          {/* The eyebrow-over-lime-rule opening. It is the one section marker
              every mockup uses, so it survives the type consolidation under a
              successor name rather than being folded into a heading style. */}
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-caps mt-6 max-w-4xl">{title}</h1>
          <p className="type-body-lg mt-8 max-w-2xl text-muted-foreground">{lede}</p>
          <p className="type-h3-prose mt-10 max-w-3xl text-lime">{question}</p>
        </div>
      </section>

      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[2fr_1fr] lg:gap-20">
            <div className="min-w-0 space-y-14">
              {sections.map((section) => (
                <article key={section.id} id={section.id}>
                  <h2 className="type-h3-condensed text-ink">{section.heading}</h2>
                  <div className="type-body mt-5 max-w-2xl space-y-4 text-ink/70">
                    {section.body}
                  </div>
                </article>
              ))}
            </div>

            <aside className="lg:pt-2">
              <h2 className="type-label-caps text-ink/50">What we look at</h2>
              <ul className="mt-6 space-y-2">
                {focusAreas.map((area) => (
                  <li
                    key={area}
                    className="border-t border-hairline-dark pt-2 text-xs uppercase tracking-widest text-ink/60"
                  >
                    {area}
                  </li>
                ))}
              </ul>

              <a
                href={BOOKING_URL_30MIN}
                target="_blank"
                rel="noreferrer"
                className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream"
              >
                Book Your Blueprint <span aria-hidden>→</span>
              </a>

              <Link
                to="/be-human-ai"
                className="eyebrow link-underline mt-6 block text-ink/60 hover:text-ink"
              >
                Back to the Blueprint
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
