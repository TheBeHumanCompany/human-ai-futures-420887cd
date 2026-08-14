import { createFileRoute, Link } from "@tanstack/react-router";

import { Checklist } from "@/components/sales/checklist";
import { FaqAccordion } from "@/components/sales/faq-accordion";
import { OfferCard } from "@/components/sales/offer-card";
import { ProcessSteps } from "@/components/sales/process-steps";
import { Testimonial } from "@/components/sales/testimonial";
import { BOOKING_URL } from "@/lib/config";
import {
  APPROACH,
  BLUEPRINT_META,
  CLIENT_PROOF,
  CLOSING,
  COMMITMENTS,
  COST_OF_WAITING,
  FAQS,
  FIT,
  HERO,
  HOW_IT_WORKS,
  OFFER,
  OFFER_INTRO,
  PROBLEM,
  RECEIVABLES,
  SOVEREIGNTY,
  TEAM,
  THRIVE,
} from "@/lib/sales/blueprint";
import { PILLARS, PILLAR_ROUTES } from "@/lib/sales/pillars";

/**
 * The Be Human AI Blueprint™ flagship sales page.
 *
 * Layout only. Every readable string arrives from `@/lib/sales/blueprint`,
 * which holds the approved copy verbatim — so a copy revision is a data edit
 * and never a JSX edit, and the verbatim guarantee has exactly one file to
 * audit.
 *
 * The page alternates ink and cream sections in the rhythm the rest of the site
 * uses. That alternation is composed here rather than baked into the primitives,
 * which is why each of them takes a `theme` prop.
 */
export const Route = createFileRoute("/be-human-ai/blueprint")({
  head: () => ({
    meta: [
      { title: "The Be Human AI Blueprint™ — Executive AI assessment in 3 business days" },
      {
        name: "description",
        content:
          "An executive AI assessment and 90-day transformation plan: executive findings, an AI opportunity map, a risk and governance review, and a 90-day action plan. $795 CAD founding rate.",
      },
      { property: "og:title", content: "The Be Human AI Blueprint™" },
      {
        property: "og:description",
        content:
          "Know where you stand, what to protect, and what to do next - in three business days, not three months.",
      },
    ],
  }),
  component: Blueprint,
});

function teamMemberName(firstName: string, surname?: string) {
  return surname ? `${firstName} ${surname}` : firstName;
}

function Blueprint() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-32">
          <p className="eyebrow text-lime">{BLUEPRINT_META.eyebrow}</p>
          <h1 className="display mt-8 max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)]">
            {HERO.heading}
          </h1>
          <p className="mt-10 max-w-3xl text-lg leading-relaxed text-foreground/85">
            {HERO.standfirst}
          </p>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="min-w-0">
              {HERO.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-5 max-w-2xl leading-relaxed text-muted-foreground first:mt-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="min-w-0 lg:pt-2">
              <p className="display text-[clamp(1.75rem,3vw,2.75rem)] text-lime">
                {HERO.pullQuote}
              </p>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
                {HERO.provenance}
              </p>
              <p className="eyebrow mt-8 text-foreground/70">{HERO.kicker}</p>
            </div>
          </div>

          <a
            href={BOOKING_URL}
            className="eyebrow mt-14 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
          >
            {BLUEPRINT_META.ctaLabel} <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* ---------- THE PROBLEM ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-ink/45">{PROBLEM.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.75rem)] text-ink">
            {PROBLEM.heading}
          </p>

          <div className="mt-10 max-w-3xl">
            {PROBLEM.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-14 grid gap-px bg-hairline-dark lg:grid-cols-3">
            {PROBLEM.points.map((point) => (
              <article key={point.heading} className="bg-cream p-8 lg:p-10">
                <h3 className="display text-2xl text-ink lg:text-3xl">{point.heading}</h3>
                <p className="mt-5 text-sm leading-relaxed text-ink/70">{point.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 max-w-3xl border-t border-hairline-dark pt-10">
            {PROBLEM.close.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- OUR APPROACH ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-lime">{APPROACH.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.75rem)]">
            {APPROACH.heading}
          </p>

          <div className="mt-10 max-w-3xl">
            {APPROACH.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-muted-foreground first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="display mt-14 max-w-4xl text-[clamp(1.75rem,4vw,3rem)] text-lime">
            {APPROACH.pullQuote}
          </p>

          <div className="mt-12 grid gap-px bg-hairline lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <article key={pillar.slug} className="bg-background p-8 lg:p-10">
                <span className="eyebrow text-lime">{pillar.eyebrow}</span>
                <h3 className="display mt-6 text-3xl">{pillar.promise}</h3>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {pillar.question}
                </p>
                <Checklist items={pillar.focus} theme="ink" className="mt-7" />
                <Link
                  to={PILLAR_ROUTES[pillar.slug]}
                  className="eyebrow link-underline mt-8 inline-block text-lime"
                >
                  Explore <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {APPROACH.kicker}
          </p>
        </div>
      </section>

      {/* ---------- CANADIAN TRUST & SOVEREIGNTY ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-ink/45">{SOVEREIGNTY.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.75rem)] text-ink">
            {SOVEREIGNTY.heading}
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="min-w-0">
              {SOVEREIGNTY.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 leading-relaxed text-ink/75 first:mt-0">
                  {paragraph}
                </p>
              ))}
              <p className="display mt-10 text-2xl text-ink lg:text-3xl">
                {SOVEREIGNTY.disciplines}
              </p>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm leading-relaxed text-ink/70">
                {SOVEREIGNTY.questionsHeading}
              </h3>
              <Checklist items={SOVEREIGNTY.questions} theme="cream" className="mt-6" />
              <div className="mt-8 border-t border-hairline-dark pt-8">
                {SOVEREIGNTY.close.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-relaxed text-ink/70 first:mt-0"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <p className="display mt-16 max-w-4xl text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
            {SOVEREIGNTY.pullQuote}
          </p>
        </div>
      </section>

      {/* ---------- OUR COMMITMENTS ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">{COMMITMENTS.eyebrow}</h2>
          <p className="display mt-8 max-w-3xl text-[clamp(2rem,5vw,3.25rem)]">
            {COMMITMENTS.heading}
          </p>
          <ProcessSteps
            steps={COMMITMENTS.items}
            theme="ink"
            columnsClassName="sm:grid-cols-2 lg:grid-cols-4"
            className="mt-12"
          />
        </div>
      </section>

      {/* ---------- THE OFFER, INTRODUCED ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-ink/45">{BLUEPRINT_META.productName}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.75rem)] text-ink">
            {OFFER_INTRO.heading}
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/75">
            {OFFER_INTRO.standfirst}
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="min-w-0">
              {OFFER_INTRO.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 leading-relaxed text-ink/75 first:mt-0">
                  {paragraph}
                </p>
              ))}
              <p className="display mt-10 text-2xl text-ink lg:text-3xl">{OFFER_INTRO.pullQuote}</p>
            </div>

            <div className="min-w-0">
              <h3 className="eyebrow text-ink/45">{OFFER_INTRO.audience.heading}</h3>
              {OFFER_INTRO.audience.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 text-sm leading-relaxed text-ink/70">
                  {paragraph}
                </p>
              ))}

              <h3 className="eyebrow mt-10 border-t border-hairline-dark pt-8 text-ink/45">
                {OFFER_INTRO.why.heading}
              </h3>
              {OFFER_INTRO.why.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 text-sm leading-relaxed text-ink/70">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- WHAT YOU'LL RECEIVE ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-lime">{RECEIVABLES.eyebrow}</h2>
          <p className="display mt-8 max-w-3xl text-[clamp(2rem,5vw,3.75rem)]">
            {RECEIVABLES.heading}
          </p>
          <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
            {RECEIVABLES.standfirst}
          </p>

          <div className="mt-12 grid gap-px bg-hairline sm:grid-cols-2">
            {RECEIVABLES.items.map((item) => (
              <article key={item.n} className="bg-background p-8 lg:p-10">
                <span className="eyebrow text-lime">{item.n}</span>
                <h3 className="display mt-6 text-3xl lg:text-4xl">{item.title}</h3>
                <p className="eyebrow mt-4 text-muted-foreground">{item.question}</p>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {RECEIVABLES.note}
          </p>
          <p className="display mt-10 text-3xl text-lime lg:text-4xl">{RECEIVABLES.kicker}</p>
        </div>
      </section>

      {/* ---------- CLIENT PROOF (data-gated) ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-ink/45">{CLIENT_PROOF.eyebrow}</h2>
          <p className="display mt-8 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] text-ink">
            {CLIENT_PROOF.heading}
          </p>
          <p className="mt-8 max-w-2xl leading-relaxed text-ink/75">{CLIENT_PROOF.standfirst}</p>
          <Testimonial
            className="mt-14"
            theme="cream"
            quote={CLIENT_PROOF.testimonial.quote}
            author={CLIENT_PROOF.testimonial.author}
            role={CLIENT_PROOF.testimonial.role}
            organization={CLIENT_PROOF.testimonial.organization}
            headshotUrl={CLIENT_PROOF.testimonial.headshotUrl}
            logoUrl={CLIENT_PROOF.testimonial.logoUrl}
            videoUrl={CLIENT_PROOF.testimonial.videoUrl}
          />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">{HOW_IT_WORKS.eyebrow}</h2>
          <p className="display mt-8 max-w-3xl text-[clamp(2rem,5vw,3.75rem)]">
            {HOW_IT_WORKS.heading}
          </p>
          <ProcessSteps
            steps={HOW_IT_WORKS.steps}
            theme="ink"
            columnsClassName="lg:grid-cols-3"
            className="mt-12"
          />
          <p className="eyebrow mt-10 text-foreground/70">{HOW_IT_WORKS.kicker}</p>
        </div>
      </section>

      {/* ---------- WHAT WAITING COSTS ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-ink/45">{COST_OF_WAITING.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
            {COST_OF_WAITING.heading}
          </p>
          <div className="mt-10 max-w-3xl">
            {COST_OF_WAITING.body.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="display mt-12 max-w-4xl text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
            {COST_OF_WAITING.pullQuote}
          </p>
        </div>
      </section>

      {/* ---------- THE OFFER ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-lime">{OFFER.eyebrow}</h2>
          <p className="display mt-8 text-[clamp(2.25rem,6vw,4.5rem)]">{OFFER.heading}</p>
          <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">{OFFER.intro}</p>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
            {OFFER.availability}
          </p>

          <OfferCard
            className="mt-12 max-w-3xl"
            theme="ink"
            eyebrow={OFFER.rateLabel}
            price={OFFER.price}
            priceNote={OFFER.priceNote}
            compareAtPrice={OFFER.compareAtPrice}
            compareAtNote={OFFER.compareAtNote}
            turnaround={OFFER.turnaround}
            turnaroundNote={OFFER.turnaroundNote}
            inclusionsLabel={OFFER.inclusionsLabel}
            inclusions={OFFER.inclusions}
            ctaLabel={BLUEPRINT_META.ctaLabel}
            ctaHref={BOOKING_URL}
            terms={OFFER.terms}
          />

          <p className="mt-10 max-w-2xl leading-relaxed text-foreground/85">{OFFER.credit}</p>
        </div>
      </section>

      {/* ---------- THE TEAM ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="eyebrow text-ink/45">{TEAM.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
            {TEAM.heading}
          </p>
          <div className="mt-10 max-w-3xl">
            {TEAM.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <h3 className="display mt-16 text-3xl text-ink lg:text-4xl">{TEAM.membersHeading}</h3>
          <div className="mt-8 max-w-3xl">
            {TEAM.membersIntro.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-relaxed text-ink/70 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 grid gap-px bg-hairline-dark lg:grid-cols-3">
            {TEAM.members.map((member) => (
              <article key={member.firstName} className="bg-cream p-8 lg:p-10">
                {member.portraitUrl && (
                  <img
                    src={member.portraitUrl}
                    alt={teamMemberName(member.firstName, member.surname)}
                    loading="lazy"
                    className="mb-8 aspect-[4/5] w-full object-cover"
                  />
                )}
                <h4 className="display text-2xl text-ink lg:text-3xl">
                  {teamMemberName(member.firstName, member.surname)}
                </h4>
                <p className="eyebrow mt-3 text-ink/50">{member.role}</p>
                {member.credentials && (
                  <p className="mt-2 text-xs uppercase tracking-widest text-ink/45">
                    {member.credentials}
                  </p>
                )}
                <p className="mt-6 text-sm leading-relaxed text-ink/70">{member.bio}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 max-w-3xl border-t border-hairline-dark pt-10">
            <p className="display text-2xl text-ink lg:text-3xl">{TEAM.close.heading}</p>
            <p className="mt-5 leading-relaxed text-ink/75">{TEAM.close.body}</p>
          </div>
        </div>
      </section>

      {/* ---------- WHO WE WORK BEST WITH ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">{FIT.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.5rem)]">{FIT.heading}</p>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="min-w-0">
              <h3 className="text-sm leading-relaxed text-foreground/85">{FIT.goodFitHeading}</h3>
              <Checklist items={FIT.goodFit} theme="ink" className="mt-6" />
            </div>
            <div className="min-w-0 border-t border-hairline pt-10 lg:border-l lg:border-t-0 lg:pl-20 lg:pt-0">
              <h3 className="eyebrow text-muted-foreground">{FIT.poorFitHeading}</h3>
              {FIT.poorFit.map((paragraph) => (
                <p key={paragraph} className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-ink/45">Frequently asked questions</h2>
          <FaqAccordion items={FAQS} theme="cream" className="mt-10 max-w-4xl" />
        </div>
      </section>

      {/* ---------- THE ORGANIZATIONS THAT WILL THRIVE ---------- */}
      <section className="section-ink border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">{THRIVE.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.75rem)]">{THRIVE.heading}</p>
          <div className="mt-10 max-w-3xl">
            {THRIVE.body.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-muted-foreground first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="display mt-12 max-w-4xl text-[clamp(1.5rem,3.5vw,2.5rem)] text-lime">
            {THRIVE.pullQuote}
          </p>
        </div>
      </section>

      {/* ---------- CLOSING CTA ---------- */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-32">
          <h2 className="eyebrow text-ink/45">{CLOSING.eyebrow}</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
            {CLOSING.heading}
          </p>
          <p className="display mt-10 max-w-3xl text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
            {CLOSING.standfirst}
          </p>
          <a
            href={BOOKING_URL}
            className="eyebrow mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream"
          >
            {BLUEPRINT_META.ctaLabel} <span aria-hidden>→</span>
          </a>
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink/60">{CLOSING.terms}</p>
        </div>
      </section>
    </>
  );
}
