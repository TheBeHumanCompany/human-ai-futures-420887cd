import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Globe,
  ListChecks,
  Lock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { MapleLeaf } from "@/components/maple-leaf";
import { BOOKING_URL_30MIN } from "@/lib/booking";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * `/be-human-ai` — the Blueprint, one editorial page.
 *
 * 2026-08-24: re-presented against Maya's reference visual. Same approved copy,
 * new composition — label / large condensed heading / three-column service
 * modules per pillar, no eyebrow rules, no periods in headings, icons only
 * where the reference keeps them (pillar overview + Governance outcomes).
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

/** Section label. No rule underneath — hierarchy comes from scale and space. */
function Label({
  children,
  tone = "lime",
}: {
  children: string;
  tone?: "lime" | "ink" | "muted";
}) {
  const color = tone === "lime" ? "text-lime" : tone === "muted" ? "text-ink/45" : "text-ink";
  return <p className={`type-label-caps ${color}`}>{children}</p>;
}

/** Chess-knight mark for the strategy pillar (no lucide equivalent). */
function KnightIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 3.5 8 6 5.5 8.2A3.5 3.5 0 0 0 4.3 11l-.3 2 2.2-1.1 1.4 1.6L6 15.5c-1.2 1.4-2 3-2 4.5h13c0-4-.6-7-1.7-9.4C14.1 8 12 6.3 9.6 5.6" />
      <path d="M8.8 9.2h.01" />
      <path d="M4 20h15" />
    </svg>
  );
}

/** The heading that opens the right-hand content area of each pillar module. */
function ModuleHeading({ children }: { children: string }) {
  return <h4 className="type-h4-caps">{children}</h4>;
}

type Outcome = { title: string; body: string; icon?: LucideIcon };

const PILLAR_OVERVIEW = [
  {
    n: "01",
    title: "Human Readiness",
    icon: Users,
    question:
      "Are your leaders and employees ready for the way machine intelligence is changing work?",
  },
  {
    n: "02",
    title: "Governance & Sovereignty",
    icon: ShieldCheck,
    question: "Are you still in control of your data, your decisions, and your future?",
  },
  {
    n: "03",
    title: "Intelligence Strategy & Transformation",
    icon: KnightIcon,
    question: "Where does machine intelligence create the greatest business leverage?",
  },
] as const;

const READINESS_OUTCOMES: Outcome[] = [
  {
    title: "One position",
    body: "Leadership holds one clear position on where machine intelligence belongs and where human judgment still leads.",
  },
  {
    title: "Real visibility",
    body: "What your people are already doing with these tools is known, not guessed at.",
  },
  {
    title: "Readiness to change",
    body: "Leadership understands where employees are ready, where confidence or trust is weak, and what needs to change before adoption can succeed.",
  },
];

const READINESS_LOOK_AT = [
  "Leadership readiness",
  "Employee AI usage",
  "Human judgment",
  "Trust & psychological readiness",
  "Change readiness",
  "Role & workflow readiness",
] as const;

const GOVERNANCE_OUTCOMES: Outcome[] = [
  {
    title: "Control",
    icon: Lock,
    body: "You can trace how data actually moves through every one of these systems in use — including the ones nobody approved.",
  },
  {
    title: "Defined guardrails",
    icon: ListChecks,
    body: "The gaps are named and the safeguards that close them are defined before the technology is embedded in the business, not after.",
  },
  {
    title: "Decisions you make",
    icon: Globe,
    body: "Where your data lives, and under whose jurisdiction, becomes a decision you made rather than one you inherited.",
  },
];

const GOVERNANCE_LOOK_AT = [
  "Data flows & storage",
  "Access, identity & permissions",
  "Third-party & vendor risk",
] as const;

const STRATEGY_OUTCOMES: Outcome[] = [
  {
    title: "Ranked, not listed",
    body: "The opportunities are ranked against each other, not listed — so the argument about what to do first is already settled.",
  },
  {
    title: "The work redesigned",
    body: "The work itself is redesigned around that ranking, rather than the same work with a chatbot beside it.",
  },
];

const STRATEGY_LOOK_AT = [
  "Opportunity ranking",
  "Workflow transformation",
  "Business value and implementation effort",
  "Human ownership",
  "Recommended priorities",
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

/** Three-across outcome columns. Icons only when the outcome carries one. */
function OutcomeGrid({ items, tone }: { items: Outcome[]; tone: "ink" | "cream" }) {
  const body = tone === "cream" ? "text-ink/75" : "text-foreground/75";
  const heading = tone === "cream" ? "text-ink" : "text-foreground";
  return (
    <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
      {items.map((item) => (
        <div key={item.title}>
          {item.icon && <item.icon className="mb-5 h-7 w-7 text-lime" strokeWidth={1.25} />}
          <h5 className={`type-h4-caps text-[1rem] ${heading}`}>{item.title}</h5>
          <p className={`type-body-sm mt-3 max-w-[34ch] ${body}`}>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

/** The assessment-framework grid: no icons, hairline cells. */
function LookAtGrid({ items, tone }: { items: readonly string[]; tone: "ink" | "cream" }) {
  return (
    <div className="mt-6 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <p
          key={item}
          className={`type-body-sm border-b border-border py-4 pr-6 sm:border-r ${
            tone === "cream" ? "text-ink/80" : "text-foreground/80"
          }`}
        >
          {item}
        </p>
      ))}
    </div>
  );
}

/** One pillar module: left identity rail, right content area. */
function PillarModule({
  n,
  title,
  question,
  tone,
  children,
}: {
  n: string;
  title: string;
  question: string;
  tone: "ink" | "cream";
  children: React.ReactNode;
}) {
  return (
    <div className={`${SHELL} py-20 lg:py-28`}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:border-r lg:border-border lg:pr-12">
          <p className="type-label-caps text-lime">{n}</p>
          <h3
            className={`type-h3-caps mt-5 max-w-[14ch] ${tone === "cream" ? "text-ink" : "text-foreground"}`}
          >
            {title}
          </h3>
          <p
            className={`type-body mt-5 max-w-[30ch] ${tone === "cream" ? "text-ink/70" : "text-foreground/70"}`}
          >
            {question}
          </p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function BlueprintPage() {
  return (
    <>
      {/* ── Hero, ink ─────────────────────────────────────────────────── */}
      <section id="blueprint-hero" className="section-ink grain border-b border-border">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <Label>Be Human Intelligence</Label>
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

      {/* ── Adoption, cream ───────────────────────────────────────────── */}
      <section id="blueprint-adoption" className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-24">
            <div>
              <Label tone="lime">Where organizations are</Label>
              <h2 className="type-h1-caps mt-8 max-w-[14ch] text-ink">
                Adoption is already ahead of direction
              </h2>
            </div>

            <div className="max-w-[52ch] space-y-6 self-end text-ink/75 lg:pb-3">
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

      {/* ── Blueprint intro, ink ──────────────────────────────────────── */}
      <section id="blueprint-intro" className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:gap-20">
            <div>
              <Label>The Blueprint</Label>
              <h2 className="type-h2-caps mt-8 max-w-[12ch]">
                Three pillars.
                <br />
                One position
              </h2>
              <p className="type-body mt-8 max-w-[44ch] text-foreground/70">
                Together, these three areas show where the organization stands, what needs
                protecting, and where machine intelligence can create the greatest value. We do not
                publish the method. What we will tell you is what is different in your organization
                when the work is done.
              </p>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-3">
              {PILLAR_OVERVIEW.map((pillar) => (
                <div key={pillar.n} className="bg-background py-8 sm:px-6 sm:py-2 lg:px-8">
                  <pillar.icon className="h-8 w-8 text-lime" strokeWidth={1.25} />
                  <p className="type-label-caps mt-6 text-lime">{pillar.n}</p>
                  <h3 className="type-h4-caps mt-3 text-foreground">{pillar.title}</h3>
                  <p className="type-body-sm mt-4 max-w-[26ch] text-foreground/70">
                    {pillar.question}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 Human Readiness, cream ─────────────────────────────────── */}
      <section id="blueprint-human-readiness" className="section-cream">
        <PillarModule
          n="01"
          title="Human Readiness"
          question="Are your leaders and employees ready for the way machine intelligence is changing work?"
          tone="cream"
        >
          <ModuleHeading>What is different afterwards</ModuleHeading>
          <OutcomeGrid items={READINESS_OUTCOMES} tone="cream" />

          <div className="mt-16 grid gap-12 border-t border-border pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <ModuleHeading>What we look at</ModuleHeading>
              <div className="mt-6 grid border-t border-border sm:grid-cols-2">
                {READINESS_LOOK_AT.map((item) => (
                  <p
                    key={item}
                    className="type-body-sm border-b border-border py-4 pr-6 text-ink/80 sm:odd:border-r"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="border-l-2 border-lime pl-6 lg:pl-8">
              <h4 className="type-h4-caps max-w-[22ch] text-ink">
                Confidence is part of the adoption problem
              </h4>
              <div className="mt-5 max-w-[46ch] space-y-4 text-ink/75">
                <p className="type-body-sm">
                  Resistance to AI is not always a technology problem.
                </p>
                <p className="type-body-sm">
                  It can come from low confidence, unclear expectations, distrust, job uncertainty,
                  poor communication, or simply not understanding where the technology fits into
                  someone&rsquo;s work.
                </p>
                <p className="type-body-sm">
                  We look at what is actually getting in the way, rather than assuming another tool
                  or training session will solve it.
                </p>
              </div>
            </div>
          </div>
        </PillarModule>
      </section>

      {/* ── 02 Governance & Sovereignty, ink ──────────────────────────── */}
      <section id="blueprint-governance" className="section-ink">
        <PillarModule
          n="02"
          title="Governance & Sovereignty"
          question="Are you still in control of your data, your decisions, and your future?"
          tone="ink"
        >
          <ModuleHeading>What is different afterwards</ModuleHeading>
          <OutcomeGrid items={GOVERNANCE_OUTCOMES} tone="ink" />

          <div className="mt-16 border-t border-border pt-12">
            <ModuleHeading>What we look at</ModuleHeading>
            <LookAtGrid items={GOVERNANCE_LOOK_AT} tone="ink" />
          </div>
        </PillarModule>
      </section>

      {/* ── 03 Intelligence Strategy, cream ──────────────────────────── */}
      <section id="blueprint-intelligence-strategy" className="section-cream">
        <PillarModule
          n="03"
          title="Intelligence Strategy & Transformation"
          question="Where does machine intelligence create the greatest business leverage?"
          tone="cream"
        >
          <ModuleHeading>What is different afterwards</ModuleHeading>
          <OutcomeGrid items={STRATEGY_OUTCOMES} tone="cream" />

          <div className="mt-14 border-t border-border pt-12">
            <h4 className="type-h3-caps max-w-[18ch] text-ink">What humans should still own</h4>
            <p className="type-body-lg mt-6 max-w-[52ch] text-ink/80">
              Most organizations start by asking what they can automate. The more useful question is
              what humans should still own.
            </p>
          </div>

          <div className="mt-14 border-t border-border pt-12">
            <ModuleHeading>What we look at</ModuleHeading>
            <LookAtGrid items={STRATEGY_LOOK_AT} tone="cream" />
          </div>

          <div className="mt-14 border-l-2 border-lime pl-6 lg:pl-8">
            <h4 className="type-h4-caps text-ink">A clear path forward</h4>
            <p className="type-body-sm mt-4 max-w-[60ch] text-ink/75">
              The Blueprint does not end with a list of possibilities. We bring the findings
              together into a clear set of priorities: what deserves attention first, what should
              wait, who should own the next decision, and where implementation can create the
              greatest value. You can move forward internally, bring in another partner, or continue
              with us. The Blueprint is built around your organization and gives leadership clarity
              on what to do next.
            </p>
          </div>
        </PillarModule>
      </section>

      {/* ── What leadership leaves with, ink ─────────────────────────── */}
      <section id="blueprint-leadership-output" className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
            <div className="lg:border-r lg:border-border lg:pr-12">
              <ClipboardCheck className="h-9 w-9 text-lime" strokeWidth={1.25} />
              <h2 className="type-h3-caps mt-6 max-w-[14ch]">What leadership leaves with</h2>
              <p className="type-body mt-5 max-w-[30ch] text-foreground/70">
                The Blueprint gives your leadership team one clear view of where the organization
                stands and what deserves attention next.
              </p>
            </div>

            <div>
              <ModuleHeading>You leave with</ModuleHeading>
              <ol className="mt-6 grid border-t border-border sm:grid-cols-2">
                {LEAVES_WITH.map((item, i) => (
                  <li
                    key={item}
                    className="flex gap-4 border-b border-border py-5 pr-6 sm:odd:border-r"
                  >
                    <span className="eyebrow mt-1 shrink-0 text-lime">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="type-body-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="type-body mt-10 max-w-[60ch] text-foreground/70">
                Not a generic AI report. A Blueprint built around your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Client proof, cream ───────────────────────────────────────── */}
      <section id="blueprint-client-proof" className="section-cream">
        <div className={`${SHELL} py-20 lg:py-24`}>
          <Label tone="lime">Client proof</Label>

          <div
            data-testimonial-pending="true"
            className="mt-8 max-w-3xl border border-dashed border-ink/30 bg-cream-deep/40 p-8"
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
      <section id="blueprint-selection" className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
            <div>
              <Label>Selection</Label>
              <h2 className="type-h2-caps mt-8 max-w-[12ch]">Who we work best with</h2>
            </div>

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
      <section id="blueprint-closing" className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <h2 className="type-h2-caps max-w-[16ch] text-ink">
              We work with a small number of organizations at a time
            </h2>

            <div>
              <div className="max-w-[52ch] space-y-6 text-ink/75">
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
                  purchase. We will tell you honestly whether the Blueprint is the right place to
                  start.
                </p>
              </div>

              <a
                href={BOOKING_URL_30MIN}
                target="_blank"
                rel="noreferrer"
                data-blueprint-cta="true"
                className="mt-10 inline-flex w-fit items-center gap-2.5 border-b border-lime-dark pb-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] text-ink"
              >
                Start a conversation{" "}
                <span aria-hidden className="text-lime-dark">
                  &rarr;
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
