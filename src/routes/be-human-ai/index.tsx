import { createFileRoute } from "@tanstack/react-router";

import { MapleLeaf } from "@/components/maple-leaf";
import { BOOKING_URL_30MIN } from "@/lib/booking";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * `/be-human-ai` — the Blueprint, rebuilt as one editorial page (2026-08-24).
 *
 * The previous version was a data-driven spine of tiered sections plus three
 * pillar subpages and an in-page sub-nav. That whole architecture is gone by
 * decision: one page, no dropdown, no accordions, no second nav. The pillars
 * are stated here as outcomes and no longer link anywhere.
 *
 * The file stays `be-human-ai/index.tsx` so the public URL — which is
 * published and linked — does not change.
 */
export const Route = createFileRoute("/be-human-ai/")({
  head: () => ({
    meta: [
      { title: "The Blueprint — Be Human Intelligence" },
      {
        name: "description",
        content:
          "Human readiness, governance and sovereignty, and intelligence strategy. One clear position on machine intelligence, for a small number of organizations at a time.",
      },
      { property: "og:title", content: "The Blueprint — Be Human Intelligence" },
      {
        property: "og:description",
        content: "Human judgment leads. The machines accelerate execution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlueprintPage,
});

const SHELL = "mx-auto max-w-[1400px] px-5 sm:px-8";

/** The section eyebrow used at the top of every band. */
function Eyebrow({ children, tone = "lime" }: { children: string; tone?: "lime" | "muted" }) {
  return (
    <div>
      <p className={`type-label-caps ${tone === "lime" ? "text-lime" : "text-ink/50"}`}>
        {children}
      </p>
      <span className="type-eyebrow-rule block" aria-hidden />
    </div>
  );
}

const PILLARS = [
  {
    n: "01",
    title: "Human Readiness",
    question: "Are your leaders and employees ready for the way machine intelligence is changing work?",
    items: [
      "Leadership holds one position on where machine intelligence belongs — and where judgment does not bend.",
      "What your people are already doing with these tools is known, not guessed at — without it becoming an audit they learn to hide from.",
      "Adoption still holds a quarter after the training ends, because what got built was confidence rather than attendance.",
    ],
  },
  {
    n: "02",
    title: "Governance & Sovereignty",
    question: "Are you still in control of your data, your decisions, and your future?",
    items: [
      "You can trace how data actually moves through every one of these systems in use — including the ones nobody approved.",
      "The gaps are named and the safeguards that close them are defined before the technology is embedded in the business, not after.",
      "Where your data lives, and under whose jurisdiction, becomes a decision you made rather than one you inherited.",
    ],
  },
  {
    n: "03",
    title: "Intelligence Strategy & Transformation",
    question: "Where does machine intelligence create the greatest business leverage?",
    items: [
      "The opportunities are ranked against each other, not listed — so the argument about what to do first is already settled.",
      "The work itself is redesigned around that ranking, rather than the same work with a chatbot beside it.",
      "A 90-day plan your own leadership team can run without us in the room.",
    ],
  },
] as const;

const CRITERIA = [
  {
    title: "Leadership is in the room",
    text: "The people who can change how decisions get made are the people we are working with — not a committee reporting upward afterwards.",
  },
  {
    title: "Someone owns the outcome",
    text: "One named person carries this after we leave. Where that person does not exist, the plan does not survive the quarter.",
  },
  {
    title: "You want the honest read",
    text: "Some of what we find will not be flattering. Organizations that want the flattering version are better served elsewhere.",
  },
  {
    title: "The data matters",
    text: "Client records, patient files, financial positions, family information — something in the business is worth protecting properly.",
  },
] as const;

function BlueprintPage() {
  return (
    <>
      {/* ── Hero, ink ─────────────────────────────────────────────────── */}
      <section className="section-ink grain border-b border-border">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <Eyebrow>Be Human Intelligence</Eyebrow>
            <p className="eyebrow max-w-[17rem] leading-loose text-muted-foreground sm:text-right">
              We work with a small number of organizations at a time
            </p>
          </div>

          <h1 className="type-h1-caps mt-12 max-w-5xl">
            Machine intelligence will change every business
          </h1>

          <p className="type-body-lg mt-8 max-w-2xl text-foreground/85">
            The Blueprint is how we take an organization from scattered, unmanaged use of these
            systems to one clear position on them &mdash; across the people who have to change, the
            data that has to stay protected, and the work that has to get faster.
          </p>

          <p
            data-brand="indigenous-line"
            className="type-body mt-10 inline-flex items-center gap-3 text-foreground/85"
          >
            <MapleLeaf className="h-5 w-5 shrink-0 text-lime" />
            <span>{INDIGENOUS_LINE}</span>
          </p>
        </div>
      </section>

      {/* ── Where organizations are, cream ────────────────────────────── */}
      <section className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Eyebrow tone="muted">Where organizations are</Eyebrow>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
            <h2 className="type-h2-caps max-w-[18ch] text-ink">
              Adoption is already ahead of <span className="text-lime-dark">direction</span>
            </h2>

            <div className="max-w-[54ch] space-y-6 text-ink/75">
              <p className="type-body">
                Your people are already using these tools. Some are saving hours a week. Almost none
                of it is visible from the top.
              </p>
              <p className="type-body">
                Without a shared position, every team invents its own way of working. Processes
                drift. Decisions stop matching each other. The technology does not create risk
                &mdash; it accelerates it, and it does so faster than a policy document can be
                written.
              </p>
              <p className="type-body">
                The organizations that came out of this well are not the ones that bought the most
                tools. They are the ones that decided, early and out loud, what they were not
                willing to hand over.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Blueprint, ink ────────────────────────────────────────── */}
      <section className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Eyebrow>The Blueprint</Eyebrow>

          <h2 className="type-h2-caps-light mt-10 max-w-[26ch]">
            Three pillars. <span className="text-lime">One position</span> on machine intelligence
          </h2>

          <p className="type-body mt-8 max-w-2xl text-foreground/70">
            We do not publish the method. What we will tell you is what is different in your
            organization when the work is done.
          </p>

          <div className="mt-16 space-y-16 lg:space-y-20">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.n}
                className="grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20"
              >
                <div>
                  <p className="eyebrow text-lime">{pillar.n}</p>
                  <h3 className="type-h3-caps mt-5 text-foreground">{pillar.title}</h3>
                  <p className="type-h4-prose mt-5 text-lime/80">{pillar.question}</p>
                </div>

                <div className="min-w-0">
                  <p className="eyebrow text-muted-foreground">What is different afterwards</p>
                  <ul className="mt-4">
                    {pillar.items.map((item) => (
                      <li
                        key={item}
                        className="type-body max-w-[60ch] border-t border-border py-6 text-foreground/80"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Client proof, cream ───────────────────────────────────────── */}
      <section className="section-cream">
        <div className={`${SHELL} py-20 lg:py-24`}>
          <Eyebrow tone="muted">Client proof</Eyebrow>

          <div
            data-testimonial-pending="true"
            className="mt-10 max-w-3xl border border-dashed border-ink/30 bg-cream-deep/40 p-8"
          >
            <p className="eyebrow text-ink/50">Case study &mdash; awaiting sign-off</p>
            <p className="type-body-sm mt-4 text-ink/70">
              A named client engagement goes here once the client has approved the wording in
              writing. Nothing is published in this slot before then &mdash; not a paraphrase, not
              an unattributed version.
            </p>
          </div>
        </div>
      </section>

      {/* ── Who we work best with, ink ────────────────────────────────── */}
      <section className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Eyebrow>Selection</Eyebrow>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
            <h2 className="type-h2-caps max-w-[12ch]">
              Who we work best <span className="text-lime">with</span>
            </h2>

            <div className="grid gap-px bg-border sm:grid-cols-2">
              {CRITERIA.map((item) => (
                <div key={item.title} className="bg-background p-6 lg:p-8">
                  <h3 className="type-h4-caps text-lime">{item.title}</h3>
                  <p className="type-body-sm mt-4 text-foreground/70">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing, cream ───────────────────────────────────────────── */}
      <section className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <h2 className="type-h2-caps-light max-w-[30ch] text-ink">
            We work with <span className="text-lime-dark">a small number of organizations</span> at a
            time
          </h2>

          <div className="mt-10 max-w-[54ch] space-y-6 text-ink/75">
            <p className="type-body">
              That is a statement about capacity, not scarcity marketing. The work only holds when
              we are in the room often enough to see it through, and there is a limit to how many
              rooms that is.
            </p>
            <p className="type-body">
              If that sounds like your organization, the next step is a conversation, not a
              purchase. We will tell you honestly whether this is the right year for it.
            </p>
          </div>

          <a
            href={BOOKING_URL_30MIN}
            target="_blank"
            rel="noreferrer"
            data-blueprint-cta="true"
            className="mt-12 inline-flex w-fit items-center gap-2.5 border-b border-lime-dark pb-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] text-ink"
          >
            Start a conversation{" "}
            <span aria-hidden className="text-lime-dark">
              &rarr;
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
