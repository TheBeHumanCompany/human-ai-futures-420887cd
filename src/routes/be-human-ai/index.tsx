import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users, type LucideIcon } from "lucide-react";

import { BlueprintPageNav, type PageNavItem } from "@/components/blueprint-page-nav";
import { MapleLeaf } from "@/components/maple-leaf";
import { BOOKING_URL_30MIN } from "@/lib/booking";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * `/be-human-ai` — the Blueprint, one editorial page.
 *
 * 2026-08-25: rebuilt below the hero against Shane's final Blueprint copy (the
 * content source of truth) and Maya's black/cream executive-report references.
 * The hero above is untouched. Every section reads: label → one heading →
 * evidence, and the three pillars share a single information hierarchy —
 * question, what we look at, what changes afterwards, supporting insight.
 */
export const Route = createFileRoute("/be-human-ai/")({
  head: () => ({
    meta: [
      { title: "The Blueprint — Be Human Intelligence" },
      {
        name: "description",
        content:
          "Human readiness, governance and sovereignty, and intelligence strategy. One clear position on artificial intelligence, for a small number of organizations at a time.",
      },
      { property: "og:title", content: "The Blueprint — Be Human Intelligence" },
      {
        property: "og:description",
        content: "Human judgment leads. Artificial intelligence expands what is possible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlueprintPage,
});

const SHELL = "mx-auto max-w-[1400px] px-5 sm:px-8";

/** Same shell, plus the reserved left gutter for the "on this page" rail.
 *  Applied to the CONTENT so section backgrounds still span the full width. */
const SHELL_IN = "mx-auto max-w-[1400px] px-5 sm:px-8 lg:pl-[84px] xl:pl-[92px]";

const PAGE_NAV: readonly PageNavItem[] = [
  { id: "blueprint-introduction", label: "Introduction" },
  { id: "blueprint-adoption", label: "AI Readiness" },
  { id: "blueprint-before-anyone-else", label: "Before We Brought This to Anyone Else" },
  { id: "blueprint-three-pillars", label: "Three Pillars" },
  { id: "blueprint-scorecard", label: "Blueprint Scorecard" },
  { id: "blueprint-readiness-gap", label: "The Readiness Gap" },
  { id: "blueprint-deliverables", label: "What You Receive" },
  { id: "blueprint-client-proof", label: "Client Proof" },
  { id: "blueprint-canadian-trust", label: "Canadian Trust" },
  { id: "blueprint-small-number", label: "Who We Work With" },
  { id: "blueprint-closing", label: "Start a Conversation" },
];

/** Section label. Lime on ink, light grey on cream. */
function Label({ children, tone = "lime" }: { children: string; tone?: "lime" | "muted" }) {
  return (
    <p className={`type-label-caps ${tone === "lime" ? "text-lime" : "text-ink/45"}`}>{children}</p>
  );
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

/* ── Content, from the final Blueprint copy ─────────────────────────────── */

const OBSERVATIONS = [
  "Some AI use is already creating real value.",
  "Other AI use is quietly creating risk.",
  "Most organizations are making decisions about AI while seeing only part of what is happening inside their business.",
] as const;


type Pillar = {
  n: string;
  title: string;
  question: string;
  overviewQuestion: string;
  icon: LucideIcon | typeof KnightIcon;
  lookAt: readonly string[];
  lookAtIntro: string;
  changes: readonly string[];
  insightTitle: string;
  insight: readonly string[];
};

const PILLARS: readonly Pillar[] = [
  {
    n: "01",
    title: "Human Readiness",
    question: "A company can have high AI usage and low Human Readiness.",
    overviewQuestion: "Are your leaders and people ready for the way intelligence is changing work?",
    icon: Users,
    lookAtIntro: "Are your leaders and people ready for the way intelligence is changing work?",
    lookAt: [
      "Leadership alignment",
      "Executive readiness",
      "Employee usage",
      "Confidence",
      "Human judgment",
      "Trust",
      "Manager readiness",
      "Change readiness",
      "Role clarity",
    ],
    changes: [
      "A clearer view of where leadership is aligned.",
      "How employees are actually using AI, compared with what leadership believes is happening.",
      "Where confidence or judgment is weak, and what needs attention before adoption can scale.",
    ],
    insightTitle: "What should humans still own",
    insight: [
      "Most organizations ask: what can we automate?",
      "We ask another question first: what should humans still own?",
    ],
  },
  {
    n: "02",
    title: "Governance & Sovereignty",
    question: "As AI becomes more capable, more business information moves through more systems.",
    overviewQuestion: "Do you still control your data, your systems, and your decisions?",
    icon: ShieldCheck,
    lookAtIntro:
      "Do you still control your data, your systems, and your decisions?",
    lookAt: [
      "Governance",
      "Security",
      "Shadow AI",
      "Data flows",
      "Vendor exposure",
      "Privacy",
      "Accountability",
      "Canadian sovereignty considerations",
    ],
    changes: [
      "Leadership knows what information enters those systems and where it goes.",
      "Who has access, and what providers can do with that information, is known rather than assumed.",
      "Important gaps are visible before more intelligence becomes embedded into the business.",
    ],
    insightTitle: "Accountability should never belong to software",
    insight: [
      "Leadership needs to know who remains accountable for the outcome when machines influence a decision.",
    ],
  },
  {
    n: "03",
    title: "Intelligence Strategy & Transformation",
    question: "We do not begin with tools. We begin with the work.",
    overviewQuestion: "Where does artificial intelligence create the greatest business leverage?",
    icon: KnightIcon,
    lookAtIntro: "Where does artificial intelligence create the greatest business leverage?",
    lookAt: [
      "Where expensive human time is being lost",
      "Where customers are waiting",
      "Where information is repeatedly moved between disconnected systems",
      "Where work bottlenecks",
      "Where intelligence could create meaningful capacity",
    ],
    changes: [
      "The opportunities are ranked instead of simply listed.",
      "The work is redesigned around that ranking, rather than adding a chatbot to the same process.",
      "Where people create the greatest advantage is identified first, then where artificial intelligence creates the greatest leverage.",
    ],
    insightTitle: "Adding AI to a poor process can make a poor process faster",
    insight: [
      "We identify where people create the greatest advantage first, then determine where artificial intelligence creates the greatest leverage.",
    ],
  },
];

const SCORE_CATEGORIES = [
  {
    title: "Executive & Leadership Readiness",
    score: 68,
    note: "Leadership sees the opportunity, but alignment, ownership, and decision standards need attention.",
  },
  {
    title: "Employee Readiness",
    score: 72,
    note: "Employees are actively using AI, but manager readiness and standards for human review are inconsistent.",
  },
  {
    title: "Governance & Sovereignty",
    score: 51,
    note: "AI usage has outpaced formal ownership, data-flow visibility, and consistent controls.",
  },
  {
    title: "Intelligence & Workflow Readiness",
    score: 69,
    note: "Several workflows are strong candidates for redesign, but implementation needs priority.",
  },
] as const;

const GAPS = [
  {
    belief: "A CEO believes AI usage is occasional.",
    reality: "Employees report using multiple tools every day.",
  },
  {
    belief: "Leadership believes the team understands why AI is being introduced.",
    reality: "Employees believe it is about replacing jobs.",
  },
  {
    belief: "Everyone believes leadership is aligned.",
    reality:
      "Ask the leaders separately what AI should accomplish, and the answers are completely different.",
  },
  {
    belief: "The company believes its information is protected.",
    reality:
      "Nobody can clearly explain which AI systems employees are putting that information into.",
  },
] as const;

const DELIVERABLES = [
  {
    title: "A Scored Organizational Readiness Assessment",
    body: "Your overall Organizational Readiness Score, with separate views of Executive & Leadership Readiness, Employee Readiness, Governance & Sovereignty, and Intelligence & Workflow Readiness.",
  },
  {
    title: "A Ranked Intelligence Opportunity Map",
    body: "The strongest workflow and AI opportunities, ranked by business value, implementation effort, risk, and where human judgment still matters.",
  },
  {
    title: "A Governance & Sovereignty Review",
    body: "The most important issues around data, Shadow AI, security, vendors, accountability, and sovereignty that leadership needs to understand.",
  },
  {
    title: "A Clear Priority Plan",
    body: "What we believe should happen first, what can wait, and who should own the next decision.",
  },
  {
    title: "A Live Executive Strategy Session",
    body: "We walk leadership through the scores, the gaps, the opportunities, the risks, and our direct recommendation on what should happen next.",
  },
] as const;

/* ── Small shared pieces ─────────────────────────────────────────────────── */

function ConversationCta({ tone }: { tone: "ink" | "cream" }) {
  return (
    <a
      href={BOOKING_URL_30MIN}
      target="_blank"
      rel="noreferrer"
      data-blueprint-cta="true"
      className={`inline-flex w-fit items-center gap-2.5 border-b pb-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] ${
        tone === "cream" ? "border-lime-dark text-ink" : "border-lime text-foreground"
      }`}
    >
      Start a conversation{" "}
      <span aria-hidden className={tone === "cream" ? "text-lime-dark" : "text-lime"}>
        &rarr;
      </span>
    </a>
  );
}

function PillarModule({ pillar, isFirst }: { pillar: Pillar; isFirst?: boolean }) {
  const Icon = pillar.icon;
  return (
    <div className="border-t border-border py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        {/* Identity */}
        <div className={`lg:pl-8 xl:pl-12 ${isFirst ? "lg:-mt-11" : ""}`}>
          <div className="flex items-center gap-4">
            <p className="type-label-caps text-lime">{pillar.n}</p>
            <Icon className="h-6 w-6 text-lime" strokeWidth={1.25} />
          </div>
          <h3 className="type-h3-caps-light mt-5 max-w-[14ch]">{pillar.title}</h3>
          <p className="type-body mt-5 max-w-[30ch] text-foreground/70">{pillar.question}</p>
        </div>

        {/* Sequence: what we look at → what changes → insight */}
        <div className="min-w-0">
          <p className="type-label-caps text-lime">What we look at</p>
          <p className="type-body mt-4 max-w-[62ch] text-foreground/80">{pillar.lookAtIntro}</p>
          <div className="mt-6 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {pillar.lookAt.map((item) => (
              <p
                key={item}
                className="type-body-sm border-b border-border py-3.5 pr-6 text-foreground/75"
              >
                {item}
              </p>
            ))}
          </div>

          <p className="type-label-caps mt-14 text-lime">What changes afterwards</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {pillar.changes.map((change, i) => (
              <div key={change}>
                <p className="type-label-caps text-[0.8125rem] text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="type-body-sm mt-3 text-foreground/80">{change}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 border-l-2 border-lime pl-6 lg:pl-8">
            <h4 className="type-h4-caps max-w-[26ch]">{pillar.insightTitle}</h4>
            <div className="mt-4 max-w-[60ch] space-y-3">
              {pillar.insight.map((line) => (
                <p key={line} className="type-body-sm text-foreground/75">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlueprintPage() {
  return (
    <>
      {/* ── Hero, ink ─────────────────────────────────────────────────── */}
      <section id="blueprint-hero" className="section-ink grain border-b border-border">
        <div className={`${SHELL} pt-12 pb-10 lg:pt-16 lg:pb-14`}>
          <div className="lg:pl-[84px] xl:pl-[92px]">
            <h1 className="type-h1-caps-light max-w-5xl lg:mt-4">
              <span className="text-foreground">ARTIFICIAL</span>
              <br />
              <span className="text-lime">INTELLIGENCE</span>
              <br />
              <span className="text-foreground">WILL CHANGE</span>
              <br />
              <span className="text-foreground">EVERY BUSINESS</span>
            </h1>

            <p className="type-body mt-12 max-w-3xl font-semibold text-foreground lg:mt-16">
              Human judgment leads. Artificial intelligence expands what is possible.
            </p>

            <p className="type-body mt-8 inline-flex items-center gap-3 text-foreground/70 lg:mt-10">
              <MapleLeaf className="h-5 w-5 shrink-0 text-lime" />
              <span>{INDIGENOUS_LINE}</span>
            </p>
          </div>
        </div>
      </section>

      <BlueprintPageNav items={PAGE_NAV} />

      {/* Page-wide left gutter (desktop/large tablet) reserving space for the
          collapsed "on this page" rail so no section content sits under it. */}
      <>
      {/* ── 02 The Blueprint introduction, cream ─────────────────────── */}
      <section id="blueprint-introduction" className="section-cream">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="grid h-auto min-h-0 items-start gap-7 md:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 xl:gap-20">
            {/* LEFT COLUMN — dominant headline and narrative */}
            <div className="max-w-[58ch]">
              <Label tone="muted">BE HUMAN INTELLIGENCE</Label>
              <h2 className="type-h2-caps mt-4 text-ink">
                THE BLUEPRINT IS
                <br />
                WHERE WE START
              </h2>

              <div className="mt-10 space-y-6 text-ink/85">
                <p className="type-body">
                  We look across your leadership, your people, your current use of machine
                  intelligence, your workflows, your data, your governance, and the opportunities
                  inside the business.
                </p>
                <p className="type-body">
                  Then we bring leadership back to one clear position on where the organization
                  stands, what needs protecting, where intelligence can create the greatest leverage,
                  and what deserves to happen next.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN — supporting narrative */}
            <div className="max-w-[54ch]">
              <p className="type-body font-semibold text-ink">
                We start by asking who is actually shaping how AI enters your business.
              </p>
              <div className="mt-5 space-y-5 text-ink/85">
                <p className="type-body">
                  Artificial intelligence will change every business. The question is whether leadership
                  is shaping that change, or whether it is happening one employee, one tool, and one
                  decision at a time.
                </p>
                <p className="type-body">
                  Your people are already experimenting. New systems are entering the business. Work
                  is changing. Information is moving through tools leadership may not fully see.
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM — three standalone observations */}
          <div className="relative mt-5 pt-5 md:mt-6 md:border-t md:pt-6 lg:mt-20 lg:border-t lg:pt-16">
            <div className="grid md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.35fr]">
              {OBSERVATIONS.map((line, i) => (
                <div
                  key={line}
                  className={`relative ${
                    i === 2 ? "md:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  {/* Mobile horizontal divider + lime accent */}
                  <div className="absolute top-0 right-0 left-0 h-px bg-ink/15 md:hidden" />
                  <span className="absolute top-0 left-0 h-[2px] w-6 bg-lime md:hidden" />

                  {/* Tablet vertical divider + lime accent */}
                  {i === 1 && (
                    <>
                      <div className="absolute top-0 bottom-0 left-0 hidden w-px bg-ink/15 md:block lg:hidden" />
                      <span className="absolute top-0 left-0 hidden h-6 w-[2px] bg-lime md:block lg:hidden" />
                    </>
                  )}

                  {/* Tablet horizontal divider above spanning third item */}
                  {i === 2 && (
                    <>
                      <div className="absolute top-0 right-0 left-0 hidden h-px bg-ink/15 md:block lg:hidden" />
                      <span className="absolute top-0 left-0 hidden h-[2px] w-6 bg-lime md:block lg:hidden" />
                    </>
                  )}

                  <p className="type-body py-5 font-medium leading-snug text-ink/90 md:py-0 md:pl-6 lg:py-0 lg:pl-0">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>




      {/* ── 03 AI adoption / organizational readiness, ink ───────────── */}
      <section id="blueprint-adoption" className="section-ink">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <Label>Why this matters</Label>
              <h2 className="type-h2-caps mt-6">
                <span className="block lg:whitespace-nowrap">AI adoption is</span>
                <span className="block lg:whitespace-nowrap">moving faster than</span>
                <span className="block lg:whitespace-nowrap">organizational</span>
                <span className="block lg:whitespace-nowrap">readiness</span>
              </h2>
            </div>

            <div className="max-w-[58ch] space-y-6 text-foreground/80">
              <p aria-hidden className="type-label-caps invisible hidden lg:block">
                Why this matters
              </p>


              <p className="type-body">
                Most organizations no longer have an AI access problem. They have an organizational
                readiness problem.
              </p>
              <p className="type-body">
                Employees are already using ChatGPT, Copilot, Claude, Gemini, and AI-enabled
                systems. Leadership may not be aligned on what AI is actually for. Managers may not
                know how roles and workflows should change. Employees may be using AI every day
                without a shared standard for what good use looks like.
              </p>
              <p className="type-body">
                And technology is moving beyond answering questions. Agents can increasingly
                complete tasks, move between systems, coordinate parts of workflows, and act with
                less human prompting.
              </p>
            </div>
          </div>

          {/* The leadership question, restated */}
          <div className="mt-16 grid gap-12 border-t border-border pt-10 md:pt-14 lg:grid-cols-2 lg:gap-24">
            <div>
              {/* Desktop / tablet version — unchanged */}
              <div className="hidden md:block">
                <Label>That changes the leadership question</Label>
                <p className="type-body mt-6 text-foreground/70">It is no longer simply:</p>
                <p className="type-body mt-2 max-w-[38ch] font-bold text-foreground">
                  Are our employees using AI?
                </p>
                <p className="type-body mt-8 text-foreground/70">It becomes:</p>
                <p className="type-body mt-2 max-w-[52ch] font-bold text-foreground">
                  What work are we delegating? Who supervises it? What authority are we giving these
                  systems? Where must a human step back in? And who owns the outcome?
                </p>
              </div>

              {/* Mobile version — matches the editorial reference */}
              <div className="md:hidden">
                <Label>That changes the leadership question</Label>

                <p className="type-body-sm mt-6 font-medium uppercase tracking-[0.12em] text-foreground/45">
                  BEFORE
                </p>
                <p className="type-body mt-2 text-foreground/75">
                  Are our employees using AI?
                </p>

                <p className="type-body-sm mt-8 font-medium uppercase tracking-[0.12em] text-foreground/45">
                  NOW
                </p>
                <div className="mt-3 space-y-3">
                  <p className="type-body text-foreground/75">What work are we delegating?</p>
                  <p className="type-body text-foreground/75">Who supervises it?</p>
                  <p className="type-body text-foreground/75">What authority are we giving these systems?</p>
                  <p className="type-body text-foreground/75">Where must a human step back in?</p>
                  <p className="type-body text-foreground/75">And who owns the outcome?</p>
                </div>

                <div className="mt-11 border-t border-border" aria-hidden="true" />
              </div>
            </div>

            <div className="hidden space-y-8 md:block">
              <div className="border-l-2 border-lime pl-6">
                <p className="type-h4-caps">AI does not automatically improve an organization</p>
                <p className="type-h4-caps mt-2 text-lime">It reveals it</p>
              </div>
              <div className="max-w-[52ch] space-y-5 text-foreground/80">
                <p className="type-body">
                  Align the organization first, and the technology compounds that alignment. Leave
                  it fragmented, and it compounds the fragmentation just as quickly.
                </p>
                <p className="type-body">
                  Organizational readiness means aligning leadership, people, governance, data,
                  workflows, and priorities around one clear direction. That is what the Blueprint
                  is designed to establish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 Before we brought this to anyone else, cream ──────────── */}
      <section id="blueprint-before-anyone-else" className="section-cream">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,0.5fr)] lg:gap-14 xl:gap-16">
            {/* LEFT COLUMN — statement */}
            <div>
              <Label tone="muted">The Blueprint</Label>
              <h2 className="type-h3-caps-light mt-4 text-ink">
                We needed the Blueprint ourselves
              </h2>
            </div>


            {/* RIGHT COLUMN — explanation and proof */}
            <div className="max-w-[64ch]">
              <div className="space-y-6 text-ink/75">
                <p className="type-body">
                  We built The Be Human Company while artificial intelligence was changing how companies
                  operate, so we ran the questions on our own business first.
                </p>
                <p className="type-body">
                  What should we automate? What should we protect? Where should human judgment still
                  lead? Where should intelligence take work off our plate?
                </p>
                <p className="type-body">
                  We tested systems, found gaps, changed workflows, and learned where things break
                  before bringing this work into a client organization.
                </p>
              </div>

              <div className="mt-6 lg:mt-10">
                <p className="type-body-lg max-w-[52ch] font-semibold text-ink">
                  Every principle inside this Blueprint is one we use to run our own business.
                </p>
                <p className="type-body mt-3 max-w-[52ch] text-ink/70 lg:mt-4">
                  Not a framework we studied from the outside. A way of working we live inside every
                  day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── 05 Three pillars, ink ────────────────────────────────────── */}
      <section id="blueprint-three-pillars" className="section-ink">
        <div className={`${SHELL_IN} py-16 lg:py-20`}>
          <div className="max-md:-mx-1">
            <Label>The Blueprint</Label>
            <h2 className="type-h2-caps mt-4 whitespace-nowrap">THE THREE PILLARS</h2>
          </div>

          <div className="mt-16">
            {PILLARS.map((pillar, i) => (
              <div key={pillar.n} id={`blueprint-pillar-${pillar.n}`}>
                <PillarModule pillar={pillar} isFirst={i === 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 06 Scorecard, cream ──────────────────────────────────────── */}
      <section id="blueprint-scorecard" className="section-cream">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <Label tone="muted">Example Blueprint Scorecard</Label>
          <h2
            className="type-h2-caps mt-5 max-w-[18ch] text-ink"
            style={{ fontSize: "clamp(2.25rem, 5.2vw, 4.25rem)", lineHeight: 0.95 }}
          >
            Your Blueprint makes readiness visible
          </h2>
          <p className="type-body mt-8 max-w-[52ch] text-ink/75">
            You leave knowing where you stand, what matters most, what needs protecting, and what we
            believe you should do first.
          </p>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:gap-16">
            {/* Headline score */}
            <div>
              <p className="type-label-caps text-[0.75rem] tracking-[0.18em] text-ink/50">
                Organizational readiness
              </p>
              <p className="mt-5 flex items-baseline gap-3 text-ink">
                <span className="type-hero-caps" style={{ lineHeight: 0.82 }}>
                  64
                </span>
                <span className="type-h1-caps text-ink/30">/ 100</span>
              </p>
            </div>

            {/* Category cards */}
            <div className="grid gap-5 sm:grid-cols-2">
              {SCORE_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  className="rounded-xl border border-ink/12 bg-ink/[0.02] p-6"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="type-h4-caps text-[0.9375rem] text-ink">{cat.title}</h3>
                    <p className="type-h4-caps text-ink">{cat.score}%</p>
                  </div>
                  <p className="type-body-sm mt-3 max-w-[42ch] text-ink/70">{cat.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority opportunity strip */}
          <div className="mt-12 border-t border-ink/15 pt-10">
            <div className="grid gap-8 rounded-xl bg-ink/[0.05] px-8 py-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-0">
              <div className="lg:pr-8">
                <p className="type-label-caps text-[0.7rem] tracking-[0.18em] text-ink/55">
                  Priority opportunity
                </p>
                <p className="type-h4-caps mt-4 max-w-[14ch] text-ink">Customer Intake Workflow</p>
              </div>
              <div className="lg:border-l lg:border-ink/15 lg:px-8">
                <p className="type-label-caps text-[0.7rem] tracking-[0.18em] text-ink/55">
                  Business value
                </p>
                <p className="type-h3-caps mt-4 text-ink">
                  5 <span className="text-ink/35">/</span> 5
                </p>
              </div>
              <div className="lg:border-l lg:border-ink/15 lg:px-8">
                <p className="type-label-caps text-[0.7rem] tracking-[0.18em] text-ink/55">
                  Implementation effort
                </p>
                <p className="type-h3-caps mt-4 text-ink">
                  4 <span className="text-ink/35">/</span> 5
                </p>
              </div>
              <div className="lg:border-l lg:border-ink/15 lg:pl-8">
                <p className="type-label-caps text-[0.7rem] tracking-[0.18em] text-ink/55">
                  Recommended position
                </p>
                <span className="mt-4 inline-block rounded-lg bg-ink px-7 py-3 type-h4-caps text-cream">
                  Do now
                </span>
              </div>
            </div>
          </div>

          {/* Closing insight */}
          <div className="mt-14 max-w-[60ch] border-l-2 border-lime-dark pl-6">
            <p className="type-body-lg font-bold text-ink">A number by itself is not the value.</p>
            <p className="type-body mt-2 text-ink/75">
              The value is understanding why the organization scored where it did, what sits
              underneath the number, and what leadership should do about it.
            </p>
            <p className="type-label-caps mt-7 text-[0.7rem] tracking-[0.18em] text-ink/40">
              Illustrative example only.
            </p>
          </div>

        </div>
      </section>

      {/* ── 07 The readiness gap, ink ────────────────────────────────── */}
      <section id="blueprint-readiness-gap" className="section-ink">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <Label>The gap</Label>
          <h2 className="type-h2-caps mt-6 max-w-[18ch]">Finding the gap</h2>
          <p className="type-body mt-6 max-w-[64ch] text-foreground/80">
            Sometimes the most important finding is the gap. Organizations do not transform based on
            what leadership assumes is true. They transform based on what is actually true.
          </p>


          <div className="mt-14 border-t border-border">
            {GAPS.map((gap) => (
              <div
                key={gap.belief}
                className="grid gap-4 border-b border-border py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
              >
                <div>
                  <p className="eyebrow text-muted-foreground">What is believed</p>
                  <p className="type-body-lg mt-3 max-w-[42ch] text-foreground/60">{gap.belief}</p>
                </div>
                <div>
                  <p className="eyebrow text-lime">What is actually true</p>
                  <p className="type-body-lg mt-3 max-w-[46ch] text-foreground">{gap.reality}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-[56ch]">
            <p className="type-h4-caps text-[1.0625rem] text-lime">The Blueprint is built to find the difference</p>
          </div>

        </div>
      </section>

      {/* ── 08 What you receive, cream ───────────────────────────────── */}
      <section id="blueprint-deliverables" className="section-cream">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="max-w-[60ch] lg:max-w-[58%]">
            <Label tone="muted">The output</Label>
            <h2 className="type-h2-caps mt-5 text-ink lg:whitespace-nowrap">
              What you receive
            </h2>
            <p className="type-body mt-6 max-w-[52ch] text-ink/75">
              You leave knowing where you stand, what matters most, what needs protecting, and what
              we believe you should do first.
            </p>

            <ol className="mt-14">
              {DELIVERABLES.map((item, i) => (
                <li
                  key={item.title}
                  className="grid grid-cols-[3.25rem_1fr] gap-x-5 border-t border-ink/12 py-8 first:border-t-0 first:pt-0 sm:grid-cols-[4.5rem_1fr] sm:gap-x-6"
                >
                  <span
                    className="type-h3-caps-light leading-none text-lime-dark"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="border-l border-ink/15 pl-5 sm:pl-6">
                    <h3 className="type-h4-caps text-ink">{item.title}</h3>
                    <p className="type-body mt-3 max-w-[58ch] text-ink/75">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>


        </div>
      </section>

      {/* ── 09 Client proof, cream ───────────────────────────────────── */}
      <section id="blueprint-client-proof" className="section-cream border-t border-ink/20">
        <div className={`${SHELL_IN} py-20 lg:py-24`}>
          <Label tone="muted">From finding to business decision</Label>
          <h2 className="type-h3-caps mt-6 text-ink">All Y&rsquo;all Foods</h2>
          <p className="type-body mt-4 text-ink/70">
            Real business. Real workflows. Real findings.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <div
                data-asset-pending="true"
                className="flex aspect-[4/3] items-center justify-center border border-dashed border-ink/30 bg-cream-deep/40 p-8"
              >
                <p className="eyebrow max-w-[22ch] text-center text-ink/45">
                  [All Y&rsquo;all Foods logo / Brett photo]
                </p>
              </div>
              <p className="type-body-sm mt-6 max-w-[46ch] text-ink/75">
                We do not look for ways to force AI into a business. We look at how the organization
                actually operates: where money is spent, where work is duplicated, where systems
                overlap, where people lose time, and where intelligence could create leverage.
              </p>
            </div>

            <div className="space-y-8">
              <div className="border-t border-border pt-6">
                <p className="eyebrow text-ink/50">What we found</p>
                <p
                  data-copy-pending="true"
                  className="type-body mt-3 border border-dashed border-ink/30 bg-cream-deep/40 px-5 py-4 text-ink/55"
                >
                  [Insert verified All Y&rsquo;all Foods finding.]
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <p className="eyebrow text-ink/50">What changed</p>
                <p
                  data-copy-pending="true"
                  className="type-body mt-3 border border-dashed border-ink/30 bg-cream-deep/40 px-5 py-4 text-ink/55"
                >
                  [Insert verified business outcome.]
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <p className="eyebrow text-ink/50">In Brett&rsquo;s words</p>
                <blockquote
                  data-testimonial-pending="true"
                  className="mt-3 border border-dashed border-ink/30 bg-cream-deep/40 px-5 py-4"
                >
                  <p className="type-body text-ink/55">
                    &ldquo;[Insert approved testimonial.]&rdquo;
                  </p>
                  <footer className="type-body-sm mt-4 text-ink/70">
                    Brett Christoffel
                    <br />
                    Founder &amp; CEO, All Y&rsquo;all Foods
                  </footer>
                </blockquote>
              </div>

              <p className="type-body-lg text-ink">
                Find what matters. Make it visible. Make a better decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 + 11 Relationship and Canadian trust, ink ─────────────── */}
      <section id="blueprint-relationship" className="section-ink">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-24">
            <div>
              <Label>Before this page</Label>
              <h2 className="type-h3-caps-light mt-6 max-w-[18ch]">
                We may have already been looking at your business
              </h2>

            </div>

            <div className="max-w-[58ch] space-y-6 text-foreground/80">
              <p className="type-body">This conversation likely didn&rsquo;t begin on this page.</p>
              <p className="type-body">
                You may have joined us on the CEO People Podcast. We may already have spent time
                understanding your company, listening to what you are trying to solve, and looking
                at areas we believe deserve your attention. That is intentional.
              </p>
              <p className="type-body">
                The first thing an advisor should bring to a conversation is not a pitch. It is
                evidence that they paid attention.
              </p>
              <p className="type-body">
                We will never pretend to know something internal that we cannot know from the
                outside. But we can bring thoughtful observations, show you where we would want to
                look deeper, and begin the conversation with something useful.
              </p>
              <p className="type-body-lg text-foreground">
                If something we have uncovered has made you look at your organization differently,
                that is where the conversation starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="blueprint-canadian-trust" className="section-ink border-t border-border">
        <div className={`${SHELL_IN} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-24">
            <div>
              <Label>Trust</Label>
              <h2 className="mt-6 max-w-[20ch]">
                <span className="type-h3-caps-light block">Canadian trust</span>
                <span className="type-h3-caps mt-1 block text-foreground">
                  Human accountability
                </span>
              </h2>

              <p className="type-body mt-8 inline-flex items-center gap-3 text-foreground/85">
                <MapleLeaf className="h-5 w-5 shrink-0 text-lime" />
                <span>{INDIGENOUS_LINE}</span>
              </p>
            </div>

            <div className="max-w-[58ch] space-y-6 text-foreground/80">
              <p className="type-body">
                The Be Human Company is an Indigenous-led Canadian company. Trust, responsibility,
                and stewardship shape how we approach artificial intelligence from the beginning.
              </p>
              <p className="type-body">
                As AI becomes embedded in everyday business, leadership needs clear answers about
                where information goes, who controls it, which systems have access, and who remains
                accountable when machines influence decisions.
              </p>
              <p className="type-body">
                For Canadian organizations, that also means understanding privacy, cross-border
                processing, provider jurisdiction, and sovereignty.
              </p>
              <p className="type-body font-semibold text-foreground">
                Speed without trust is not transformation. It is exposure.
              </p>


            </div>
          </div>
        </div>
      </section>

      {/* ── 12 A small number of organizations, cream ────────────────── */}
      <section id="blueprint-small-number" className="section-cream">
        <div className={`${SHELL_IN} py-24 lg:py-32`}>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <Label tone="muted">The process</Label>
              <h2 className="type-h3-caps-light mt-4 max-w-[16ch] text-ink">How we work</h2>
            </div>


            <div className="max-w-[56ch] space-y-6 text-ink/75">
              <p className="type-body">
                <strong className="font-semibold text-ink">
                  We work with a small number of organizations at a time.
                </strong>{" "}
                This is not manufactured scarcity. It is how we protect the quality of the work.
              </p>
              <p className="type-body">
                Every Blueprint receives direct senior attention from the people responsible for the
                engagement. That naturally limits how many organizations we can take through the
                process at one time.
              </p>
              <p className="type-body">
                For some organizations, the Blueprint will be the right place to start. For others,
                it will not.
              </p>
              <p className="type-body">
                The next step is a conversation, not a purchase. We will tell you which we believe
                is true.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13 Final positioning, ink ────────────────────────────────── */}
      <section id="blueprint-closing" className="section-ink grain">
        <div className={`${SHELL_IN} py-24 lg:py-32`}>
          <Label>The position</Label>
          <h2 className="type-h3-caps-light mt-8 w-full max-w-[24ch]">
            The future belongs to the most human
          </h2>


          <div className="mt-12 max-w-[46ch] space-y-6 text-foreground/80 lg:max-w-[720px]">
            <p className="type-body-lg text-foreground">
              Artificial intelligence will become increasingly available to everyone. Human judgment
              will not.
            </p>
            <p className="type-body">
              The organizations that thrive will not simply be the ones that adopted AI fastest.
              They will be the ones that aligned the organization first, redesigned the work
              intelligently, protected what mattered, and clarified what their people should still
              own.
            </p>
            <p className="type-body lg:whitespace-nowrap">
              Technology will keep accelerating. Build an organization that is ready for that.
            </p>
          </div>

          <div className="mt-12">
            <ConversationCta tone="ink" />
          </div>

        </div>
      </section>
      </>
    </>

  );
}
