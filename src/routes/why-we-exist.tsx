import { createFileRoute, Link } from "@tanstack/react-router";

import { CLOSING, INITIATIVES, MISSION, WHATS_NEXT } from "@/lib/positioning";

/**
 * The mission page: one purpose, four initiatives.
 *
 * Every word here comes from `@/lib/positioning`. The page renders it and
 * nothing else — no data layer, no loader — because the thing that made this
 * page necessary was positioning copy living in four components at once, each
 * edited without the others.
 *
 * Each initiative links to its own destination. The Human Archive link points
 * at `/the-human-archive`, the index that frames itself honestly as a selection
 * ("These are some of the answers"), and NEVER at a `human-archive/$slug`
 * detail page — all four of those currently render "This archive entry is being
 * prepared", so a deep link from a paragraph promising 200 perspectives would
 * land a visitor on a placeholder. Do not "improve" this into a deep link.
 */
export const Route = createFileRoute("/why-we-exist")({
  head: () => ({
    meta: [
      { title: "Why We Exist — The Be Human Company" },
      {
        name: "description",
        content:
          "Technology is advancing, and humanity has to advance with it. We build the human infrastructure people and organizations need — through four connected initiatives.",
      },
      { property: "og:title", content: "Why We Exist — The Be Human Company" },
      {
        property: "og:description",
        content:
          "One mission, four connected initiatives: Be Human AI, The New Human Era, The Human Archive, and The People-Driven CEO Podcast.",
      },
    ],
  }),
  component: WhyWeExist,
});

function WhyWeExist() {
  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-ink/50">{MISSION.eyebrow}</p>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] text-ink">
            {MISSION.headline}
          </h1>

          <div className="mt-10 max-w-2xl space-y-6">
            {MISSION.lede.map((paragraph) => (
              <p key={paragraph} className="text-lg leading-relaxed text-ink/70">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="mt-12 max-w-2xl border-t border-border pt-8 text-xl leading-relaxed text-ink">
            {MISSION.missionLine}
          </p>
        </div>
      </section>

      {/*
        `scroll-mt-24` (96px) clears the sticky header, whose tallest grid child
        is the h-10 button (40px) plus py-4 (32px) and a 1px border — about 73px,
        leaving ~23px of breathing room. `styles.css` sets `scroll-behavior:
        smooth` globally, which honours scroll-margin-top on both a native hash
        landing and TanStack's own hash scrolling.
      */}
      <section id="initiatives" className="section-ink scroll-mt-24">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-lime">Four connected initiatives</p>
          <h2 className="display mt-6 max-w-3xl text-4xl lg:text-5xl">{MISSION.transitionLine}</h2>

          <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-16">
            {INITIATIVES.map((initiative) => (
              <article key={initiative.id} className="border-t border-border pt-8">
                <h3 className="display text-3xl lg:text-4xl">{initiative.name}</h3>

                <div className="mt-6 space-y-4">
                  {initiative.full.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <Link
                  to={initiative.to}
                  className="eyebrow link-underline mt-8 inline-flex items-center gap-2"
                >
                  {initiative.cta} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="whats-next" className="section-cream scroll-mt-24 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="display max-w-3xl text-4xl text-ink lg:text-5xl">{WHATS_NEXT.heading}</h2>

          <div className="mt-8 max-w-2xl space-y-6">
            {WHATS_NEXT.body.map((paragraph) => (
              <p key={paragraph} className="text-lg leading-relaxed text-ink/70">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          {CLOSING.map((line, index) => (
            <p
              key={line}
              className={
                index === CLOSING.length - 1
                  ? "display mt-6 text-[clamp(2.25rem,6vw,4.5rem)] text-lime"
                  : "display max-w-3xl text-3xl lg:text-4xl"
              }
            >
              {line}
            </p>
          ))}

          <p className="font-hand mt-12 text-3xl text-muted-foreground">Stay Human.</p>
        </div>
      </section>
    </>
  );
}
