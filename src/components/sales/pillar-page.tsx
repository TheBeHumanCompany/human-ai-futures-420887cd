import { Link } from "@tanstack/react-router";

import { Checklist } from "@/components/sales/checklist";
import { ProofBand } from "@/components/sales/proof-band";
import { BOOKING_URL } from "@/lib/config";
import { POSITIONING_GUARDRAIL, SPINE, type Pillar, pillarControlCount } from "@/lib/sales/pillars";

/**
 * Shared layout for the three pillar pages.
 *
 * The three differ only in their data, so the layout lives here once and each
 * route stays a thin body. All copy arrives on the `pillar` object — nothing
 * readable is written into this file.
 *
 * The "what we assess" table is the page's whole reason to exist. Naming the
 * real domains and their control counts is what separates this from every other
 * consultancy's services page, and it is why the guardrail below it is not
 * optional: the moment a page cites a framework by its numbers, it has to say
 * plainly what those numbers do and do not confer.
 */
export function PillarPage({ pillar }: { pillar: Pillar }) {
  const controls = pillarControlCount(pillar);

  return (
    <>
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-32">
          <p className="eyebrow text-lime">{pillar.eyebrow}</p>
          <h1 className="display mt-8 max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)]">
            {pillar.title}
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {pillar.question}
          </p>
        </div>
      </section>

      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div className="min-w-0">
              {pillar.body.map((paragraph) => (
                <p key={paragraph} className="mt-6 text-lg leading-relaxed text-ink/75 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="min-w-0">
              <h2 className="eyebrow text-ink/45">What this covers</h2>
              <Checklist items={pillar.focus} theme="cream" className="mt-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">What we assess</h2>

          <div className="mt-10 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {pillar.domains.map((domain) => (
              <div
                key={domain.name}
                className="flex items-baseline justify-between bg-background p-6"
              >
                <span className="text-sm text-foreground/85">{domain.name}</span>
                <span className="eyebrow shrink-0 pl-4 text-muted-foreground">
                  {domain.controls}
                </span>
              </div>
            ))}
          </div>

          <ProofBand
            className="mt-12"
            theme="ink"
            stats={[
              { value: String(controls), label: "Controls in this area" },
              { value: String(SPINE.controls), label: "Controls in the full spine" },
              { value: SPINE.ratingScale, label: `Rated across ${SPINE.domains} domains` },
            ]}
            footnote={POSITIONING_GUARDRAIL}
          />
        </div>
      </section>

      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="display max-w-3xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
            {pillar.promise}
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={BOOKING_URL}
              className="eyebrow inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream"
            >
              Book Your Blueprint <span aria-hidden>→</span>
            </a>
            <Link to="/be-human-ai/blueprint" className="eyebrow link-underline text-ink">
              See what the Blueprint includes <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
