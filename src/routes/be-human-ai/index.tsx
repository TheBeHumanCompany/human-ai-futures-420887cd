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
    outcomes: [
      "Leadership holds one clear position on where machine intelligence belongs and where human judgment still leads.",
      "What your people are already doing with these tools is known, not guessed at.",
      "Leadership understands where employees are ready, where confidence or trust is weak, and what needs to change before adoption can succeed.",
    ],
    lookAt: [
      "Leadership readiness",
      "Employee AI usage",
      "Human judgment",
      "Trust and psychological readiness",
      "Change readiness",
      "Role and workflow readiness",
    ],
    insight: {
      title: "Confidence is part of the adoption problem",
      body: "Resistance to AI is not always a technology problem. It can come from low confidence, unclear expectations, distrust, job uncertainty, poor communication, or simply not understanding where the technology fits into someone's work. We look at what is actually getting in the way, rather than assuming another tool or training session will solve it.",
    },
  },
  {
    n: "02",
    title: "Governance & Sovereignty",
    question: "Are you still in control of your data, your decisions, and your future?",
    outcomes: [
      "You can trace how data actually moves through every one of these systems in use — including the ones nobody approved.",
      "The gaps are named and the safeguards that close them are defined before the technology is embedded in the business, not after.",
      "Where your data lives, and under whose jurisdiction, becomes a decision you made rather than one you inherited.",
    ],
    lookAt: undefined,
    insight: undefined,
    pathForward: undefined,
  },
  {
    n: "03",
    title: "Intelligence Strategy & Transformation",
    question: "Where does machine intelligence create the greatest business leverage?",
    outcomes: [
      "The opportunities are ranked against each other, not listed — so the argument about what to do first is already settled.",
      "The work itself is redesigned around that ranking, rather than the same work with a chatbot beside it.",
      "Most organizations start by asking what they can automate. The more useful question is what humans should still own.",
    ],
    lookAt: [
      "Opportunity ranking",
      "Workflow transformation",
      "Business value and implementation effort",
      "Human ownership",
      "Recommended priorities",
    ],
    insight: undefined,
    pathForward: {
      title: "A clear path forward",
      body: "The Blueprint does not end with a list of possibilities. We bring the findings together into a clear set of priorities: what deserves attention first, what should wait, who should own the next decision, and where implementation can create the greatest value. You can move forward internally, bring in another partner, or continue with us. The Blueprint is built around your organization and gives leadership clarity on what to do next.",
    },
  },
] as const;

const LEAVES_WITH = [
  "A clear picture of leadership and employee readiness",
  "Visibility into how AI is already being used across the organization",
  "The highest-priority business opportunities",
  "The most important governance, data, security, and sovereignty gaps",
  "Clear recommendations on what to address first",
  "Named ownership for the decisions and systems that matter",
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
                    {pillar.outcomes.map((item) => (
                      <li
                        key={item}
                        className="type-body max-w-[60ch] border-t border-border py-6 text-foreground/80"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  {pillar.lookAt && (
                    <>
                      <p className="eyebrow mt-12 text-muted-foreground">What we look at</p>
                      <ul className="mt-4">
                        {pillar.lookAt.map((item) => (
                          <li
                            key={item}
                            className="type-body max-w-[60ch] border-t border-border py-6 text-foreground/80"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {pillar.insight && (
                    <>
                      <p className="eyebrow mt-12 text-muted-foreground">{pillar.insight.title}</p>
                      <p className="type-body mt-4 max-w-[60ch] text-foreground/80">
                        {pillar.insight.body}
                      </p>
                    </>
                  )}

                  {pillar.pathForward && (
                    <>
                      <p className="eyebrow mt-12 text-muted-foreground">{pillar.pathForward.title}</p>
                      <p className="type-body mt-4 max-w-[60ch] text-foreground/80">
                        {pillar.pathForward.body}
                      </p>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* ── What leadership leaves with ─────────────────────────────── */}
          <div className="mt-20 border-t border-border pt-12">
            <p className="eyebrow text-muted-foreground">What leadership leaves with</p>
            <p className="type-body mt-6 max-w-[60ch] text-foreground/70">
              The Blueprint gives your leadership team one clear view of where the organization
              stands and what deserves attention next.
            </p>
            <p className="eyebrow mt-10 text-muted-foreground">You leave with</p>
            <ul className="mt-4">
              {LEAVES_WITH.map((item) => (
                <li
                  key={item}
                  className="type-body max-w-[60ch] border-t border-border py-6 text-foreground/80"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="type-body mt-10 max-w-[60ch] text-foreground/70">
              Not a generic AI report. A Blueprint built around your organization.
            </p>
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
              That is a statement about how we work, not scarcity marketing.
            </p>
            <p className="type-body">
              Every Blueprint receives direct senior attention. We want to understand the
              organization properly, challenge what needs challenging, and make recommendations
              we are prepared to stand behind.
            </p>
            <p className="type-body">
              If that sounds like your organization, the next step is a conversation, not a
              purchase. We will tell you honestly whether the Blueprint is the right place to start.
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
