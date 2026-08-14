/**
 * The three service pillars, and the audit framework they map onto.
 *
 * The pillar framing — Prepare your people, Protect your organization,
 * Transform your business — comes from the approved sales copy. The domains and
 * counts come from the audit framework's controls spine, which is the single
 * source of truth for what an engagement actually assesses. Naming them is the
 * point: a page that says "we assess governance" is indistinguishable from every
 * other consultancy's page, and one that says "Governance, 8 controls, rated
 * 0–5" can be checked.
 *
 * **Depth stops at domain names and counts.** No control text, no engagement
 * pathway internals, no scoring weights, no maturity band thresholds. Those are
 * the auditor's working material, and the framework's own disclosure policy
 * treats the prospect-facing tier as the most restricted one.
 *
 * Counting note for anyone re-deriving these from `framework/controls.yaml`:
 * count `- id:` entries, not `domain:` lines. A naive grep for `domain:` returns
 * 73 because one of them sits in a changelog entry rather than on a control.
 */

/** One control domain as the framework names it. */
export interface ControlDomain {
  /** Display name, verbatim from the framework's domain definitions. */
  name: string;
  /** Number of controls in this domain. */
  controls: number;
}

export interface Pillar {
  /** Route slug beneath /be-human-ai. */
  slug: "human-readiness" | "governance" | "ai-strategy";
  /** Section label from the sales copy. */
  eyebrow: string;
  /** Page headline. */
  title: string;
  /** The promise, as the sales copy phrases it. */
  promise: string;
  /** The question the pillar answers for a leader. */
  question: string;
  /** Body copy — adapted for the web, not lifted verbatim from the PDF. */
  body: readonly string[];
  /** What this pillar covers, in the sales copy's vocabulary. */
  focus: readonly string[];
  /** The framework domains this pillar assesses. */
  domains: readonly ControlDomain[];
}

/**
 * The positioning guardrail, carried on every page that names the framework.
 *
 * This is not boilerplate and must not be softened or dropped. The framework's
 * own methodology states it as non-negotiable: the work supports readiness and
 * alignment, it does not promise regulatory compliance, and the Maturity Score
 * is not a certification and is not recognised by any government. A sales page
 * that implies otherwise is the exact failure the framework audits clients for.
 */
export const POSITIONING_GUARDRAIL =
  "Readiness and assurance — not a compliance guarantee. The AI Governance Maturity Score is not a certification and is not recognized by any government.";

/** Totals stated on every pillar page. */
export const SPINE = {
  controls: 72,
  domains: 8,
  ratingScale: "0–5",
} as const;

export const PILLARS: readonly Pillar[] = [
  {
    slug: "human-readiness",
    eyebrow: "Human Readiness",
    title: "Prepare your people.",
    promise: "Prepare your people",
    question: "Are your leaders and employees ready for the way AI is changing work?",
    body: [
      "Every successful AI transformation starts with leadership, not technology. Before employees can adopt AI with confidence, leaders need clarity on where AI belongs, where judgment does not bend, and how the organization must evolve.",
      "We build the confidence, understanding, and shared direction that adoption depends on — then measure it, so readiness is something you can point at rather than something you hope for.",
    ],
    focus: ["Leadership readiness", "Employee AI usage", "Culture", "Confidence"],
    domains: [{ name: "Workforce Readiness", controls: 7 }],
  },
  {
    slug: "governance",
    eyebrow: "Security, Governance & Sovereignty",
    title: "Protect your organization.",
    promise: "Protect your organization",
    question: "Are you still in control of your data, your decisions, and your future?",
    body: [
      "We uncover governance gaps, trace how data actually moves through AI systems, and define the safeguards that close them.",
      "Sovereignty here means control — over your data, your knowledge, your decisions, and your long-term independence. That is a leadership question long before it becomes a compliance one, which is why every engagement maps governance, data flows, and exposure before a single AI system is designed or deployed.",
    ],
    focus: ["Governance", "Security", "Shadow AI exposure", "Sovereignty"],
    domains: [
      { name: "Governance", controls: 8 },
      { name: "Privacy & Data Handling", controls: 9 },
      { name: "Cybersecurity", controls: 10 },
      { name: "Vendor & Third-Party Risk", controls: 12 },
      { name: "Sovereignty", controls: 9 },
      { name: "Transparency & Auditability", controls: 8 },
    ],
  },
  {
    slug: "ai-strategy",
    eyebrow: "AI Strategy & Transformation",
    title: "Transform your business.",
    promise: "Transform your business",
    question: "Where does AI create the greatest business leverage?",
    body: [
      "Only after your people are prepared and what matters most is protected do we identify where AI creates the greatest impact.",
      "We rank opportunities across workflows, operations, and customer experience by business value, effort, and long-term advantage — not by what is trending. Use AI where it creates leverage. Keep humans where they create advantage.",
    ],
    focus: ["AI opportunity ranking", "Workflow transformation", "90-day roadmap"],
    domains: [{ name: "Operational Risk", controls: 9 }],
  },
] as const;

/**
 * Slug → route path, as literal types.
 *
 * TanStack's `<Link to>` is constrained to the generated union of known routes,
 * so a template literal built at runtime will not typecheck. This map keeps the
 * literals in one place and gives every caller a compile error rather than a
 * dead link if a pillar route is ever renamed.
 */
export const PILLAR_ROUTES = {
  "human-readiness": "/be-human-ai/human-readiness",
  governance: "/be-human-ai/governance",
  "ai-strategy": "/be-human-ai/ai-strategy",
} as const satisfies Record<Pillar["slug"], string>;

/** Total controls a pillar assesses. */
export function pillarControlCount(pillar: Pillar): number {
  return pillar.domains.reduce((total, domain) => total + domain.controls, 0);
}

/** Lookup by route slug. */
export function pillarBySlug(slug: Pillar["slug"]): Pillar {
  const pillar = PILLARS.find((candidate) => candidate.slug === slug);
  if (!pillar) throw new Error(`Unknown pillar slug: ${slug}`);
  return pillar;
}
