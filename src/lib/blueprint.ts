import { POSITIONING_DISCLAIMER } from "./brand";
import sectionSpine from "../../docs/blueprint-sections.json";

/**
 * The Blueprint page, as content rather than markup.
 *
 * Every word the page renders lives here. That is not a style preference — three
 * separate checks need the complete text as data, and none of them can get it
 * reliably out of JSX:
 *
 *  - The prohibited-claim rule scans the copy for compliance and certification
 *    language that `controls.yaml` explicitly refuses to claim. Scanning rendered
 *    DOM would miss anything inside a collapsed section unless the test opened
 *    every one of them first, which is exactly the copy most likely to overclaim.
 *  - The visible-text ratio needs a *complete* denominator. Measuring it from the
 *    live DOM lets the denominator shrink whenever content is removed, so
 *    deleting a section would improve the score — rewarding the one fix that is
 *    forbidden.
 *  - The bracket-placeholder rule (`[Last Name]`, `[BRETT HEADSHOT]`) has to see
 *    the source strings, since a placeholder that never renders still ships.
 *
 * The section spine — ids, titles, order, tiers — lives in
 * `docs/blueprint-sections.json` and is imported, not restated. `blueprint.test.ts`
 * asserts the content keys and the spine agree exactly in both directions, so a
 * section cannot exist in one and not the other.
 */

export type Tier = 1 | 2 | 3;

export type SectionSpine = {
  id: string;
  title: string;
  tier: Tier;
};

export const SECTION_SPINE: readonly SectionSpine[] = sectionSpine.sections.map((s) => ({
  id: s.id,
  title: s.title,
  tier: s.tier as Tier,
}));

/** The ordered section ids, which is the thing "16 sections in PDF order" means. */
export const SECTION_IDS: readonly string[] = SECTION_SPINE.map((s) => s.id);

/* ── Pricing ──────────────────────────────────────────────────────────────────
   Named constants rather than literals in three places. The failure being
   avoided is ordinary and expensive: the founding rate changes, two of the four
   mentions get updated, and the page quotes two different prices for the same
   thing. Both the page and its tests read these. */

export const FOUNDING_RATE = "$795 CAD";
export const FUTURE_RATE = "$1,500 CAD";
export const TURNAROUND = "3 business days";

/* ── Content blocks ───────────────────────────────────────────────────────── */

/**
 * Marks expository depth inside an otherwise-visible section.
 *
 * The tier system alone could not get default-visible text under its ceiling,
 * and there are exactly two ways to respond to that. One is to delete
 * paragraphs until the number looks right, which is the forbidden fix — it
 * makes the metric pass by destroying the thing the metric exists to protect.
 * The other is finer-grained hierarchy, which is what this is.
 *
 * A `secondary` block stays in its own section, in document order, in the DOM,
 * openable with JavaScript disabled. It is simply not shouting on arrival. The
 * tier-1 spine keeps its statements, its prices and its calls to action; the
 * paragraphs that explain and justify sit one click below them.
 */
type Secondary = { secondary?: boolean };

export type Block =
  /**
   * A large statement line. The PDF's bold pull sentences.
   *
   * `strong` opts a single lead into the bold caps register. Maya asked for it
   * on one line only ("just change that one and see how it looks"), and there
   * are 23 leads across the Blueprint pages — so this is a per-block flag
   * rather than a change to how every lead renders.
   */
  | { kind: "lead"; text: string; strong?: boolean }
  | ({ kind: "para"; text: string } & Secondary)
  /** Plain bulleted list. */
  | ({ kind: "list"; items: readonly string[] } & Secondary)
  /** The PDF's ✓ lists — inclusions and qualifying questions. */
  | ({ kind: "check"; items: readonly string[] } & Secondary)
  | { kind: "steps"; items: readonly { n: string; title: string; text: string }[] }
  /** Numbered deliverables — the four Blueprint outputs. */
  | {
      kind: "deliverables";
      items: readonly { n: string; title: string; q: string; text: string }[];
    }
  /**
   * Summary cards. `to` makes the card a link to the route carrying the depth —
   * this is how a Tier-3 section stays present while its content lives
   * elsewhere.
   */
  | { kind: "cards"; items: readonly { title: string; text: string; to?: string }[] }
  | { kind: "faq"; items: readonly { q: string; a: string }[] }
  /** The three price facts, rendered from the constants above. */
  | { kind: "pricing" }
  /** A booking CTA. Every one points at the same 30-minute link. */
  | { kind: "cta"; label: string }
  /**
   * The positioning disclaimer, from `POSITIONING_DISCLAIMER`.
   *
   * Rendered wherever the page describes the assessment framework. The control
   * spine's own metadata says it provides readiness and assurance and is not a
   * certification; a sales page that quietly omits that while describing the
   * same framework is making a claim by silence.
   */
  | { kind: "disclaimer" }
  /**
   * An honest gap. Renders a visible "pending" state where a real testimonial
   * will go. Not lorem, not a hidden slot, and above all not an invented quote —
   * a fabricated endorsement attributed to a named real person at a named real
   * company is the one failure here that would be genuinely serious.
   */
  | { kind: "pending"; label: string; note: string };

export type Section = SectionSpine & {
  /**
   * The one-line summary shown on a collapsed section's `<summary>`. Required
   * for tier 2, since it is the only text a reader sees before opening it, and
   * a disclosure whose label does not say what is inside is a worse experience
   * than no disclosure at all.
   */
  summary?: string;
  blocks: readonly Block[];
};

const CONTENT: Record<string, { summary?: string; blocks: readonly Block[] }> = {
  hero: {
    blocks: [
      {
        kind: "lead",
        text: "The organizations that thrive will not simply adopt AI. They will redesign themselves around it — with human judgment still leading every decision that matters.",
      },
      {
        kind: "para",
        text: "Artificial intelligence is already inside your business. Your employees are using it. Your competitors are investing in it. New tools are being released every week. The question is no longer whether AI becomes part of your organization. It already has.",
        secondary: true,
      },
      {
        kind: "para",
        text: "The real question is whether your organization is intentionally shaping AI — or whether AI is quietly reshaping your organization without a clear strategy.",
        secondary: true,
      },
      {
        kind: "lead",
        text: "Human judgment leads. AI accelerates execution.",
      },
      {
        kind: "para",
        text: "Designed to help organizations stay in control of their data, their decisions, and their future. Not smarter tools. A stronger organization.",
      },
      { kind: "cta", label: "Book Your Blueprint" },
    ],
  },

  "the-problem": {
    blocks: [
      { kind: "lead", text: "Most companies are implementing AI backwards.", strong: true },
      {
        kind: "para",
        text: "They start by asking, “What can we automate?” They should be asking, “What should humans still own?” The distinction sounds simple. The organizational difference is enormous.",
        secondary: true,
      },
      {
        kind: "para",
        text: "Employees are already using ChatGPT, Copilot, Claude and other AI tools — often without leadership knowing where, how, or why. Some are saving hours every week. Others are quietly creating risk. Without direction, every employee begins inventing their own way of working.",
        secondary: true,
      },
      {
        kind: "para",
        text: "As AI spreads, it becomes harder to see where information is going, which tools touch it, and who is accountable for the decisions it influences. Most organizations do not discover how much control they have lost. They find out when something goes wrong.",
        secondary: true,
      },
      {
        kind: "lead",
        text: "AI does not improve organizations. It reveals them.",
      },
      {
        kind: "para",
        text: "Align the organization first, and AI compounds that alignment. Leave it fragmented, and AI compounds the fragmentation just as quickly. That is why transformation does not start with technology. It starts with leadership.",
      },
    ],
  },

  "our-approach": {
    blocks: [
      { kind: "lead", text: "Three moments every organization must get right." },
      {
        kind: "para",
        text: "Most AI companies ask, “What should we build?” We ask a different question: “What kind of organization are we building?” We begin with your business, your leaders and your people — before touching a single tool.",
      },
      {
        kind: "cards",
        items: [
          {
            title: "Human Readiness",
            text: "Prepare your people. Leadership readiness, employee AI usage, culture and confidence.",
            to: "/be-human-ai/human-readiness",
          },
          {
            title: "Governance & Sovereignty",
            text: "Protect your organization. Governance gaps, data flows, shadow AI exposure and the practices that close them.",
            to: "/be-human-ai/governance",
          },
          {
            title: "AI Strategy",
            text: "Transform your business. Opportunities ranked by value and effort, and a 90-day roadmap.",
            to: "/be-human-ai/ai-strategy",
          },
        ],
      },
      {
        kind: "para",
        text: "Not three disconnected services. One complete approach to becoming a human-first, AI-powered organization.",
      },
    ],
  },

  "canadian-trust": {
    summary: "Where your data goes, who controls it, and what we actually assess.",
    blocks: [
      { kind: "lead", text: "Speed without trust is not transformation. It is exposure." },
      {
        kind: "para",
        // The source PDF uses a superseded adjective in this sentence. Three
        // variants of the company's Indigenous descriptor were in circulation
        // and the user settled on "Indigenous-led"; a text rule asserts the
        // retired forms appear nowhere in the tree, and it caught this line
        // when the copy was first transcribed. That is the rule working: the
        // PDF is authoritative for what this paragraph says, not for a term
        // that has since been decided against.
        //
        // The retired wordings are deliberately not quoted in this comment —
        // the rule scans comments too, and quoting one to explain it is how it
        // gets copied back into a page later.
        text: "We are an Indigenous-led Canadian company. Trust, responsibility and stewardship are not features we add after the technology. They are the foundation we build from.",
      },
      {
        kind: "para",
        text: "We do not hand you a definition of sovereignty to agree with. We look at whether a specific set of practices is in place, and whether there is evidence that they are:",
      },
      {
        kind: "list",
        items: [
          "No-train and no-retention terms — contractual limits on what a provider may do with your prompts, uploads and outputs.",
          "Redaction at the model boundary — personal and confidential data detected and masked by a control, not by an instruction in a policy document.",
          "A call-level audit trail — a record of what was sent, what came back, how long it is kept, and who can review it.",
          "Key management — control of the encryption keys that ultimately decide who can read your AI data.",
          "Exit and portability — the ability to retrieve your data on the way out, and to have the provider's copy deleted.",
        ],
      },
      {
        kind: "para",
        text: "Where processing happens, and under which jurisdiction, is one recorded and rationalized factor in a data-handling decision. It is a real factor. It is not the whole question, and treating it as the whole question is how organizations end up confident and exposed at the same time.",
      },
      {
        kind: "para",
        text: "For Canadian organizations it also means understanding how PIPEDA, Quebec's Law 25 and the implications of the U.S. CLOUD Act may affect the way AI systems handle information. Those conversations need to happen before AI becomes embedded in the business — not after.",
      },
      { kind: "lead", text: "Canadian organizations deserve a Canadian approach." },
      {
        kind: "para",
        text: "As AI becomes part of everyday business, leaders face real questions:",
      },
      {
        kind: "check",
        items: [
          "Where is our data going?",
          "Who controls it?",
          "Which systems have access to it?",
          "Who is accountable when AI influences a decision, or gets one wrong?",
          "What information should never leave our organization?",
        ],
      },
      {
        kind: "para",
        text: "These are not merely technology questions. They are leadership questions. That is why every engagement begins by mapping governance, data flows and exposure before a single AI agent is designed or deployed.",
      },
      {
        kind: "para",
        text: "The review runs against a documented control framework rather than a checklist assembled per engagement. It covers eight domains: governance; privacy and data handling; cybersecurity; vendor and third-party risk; sovereignty; operational risk; workforce readiness; and transparency and auditability.",
      },
      { kind: "disclaimer" },
    ],
  },

  "our-commitments": {
    summary: "Four things we will not trade away, stated plainly.",
    blocks: [
      { kind: "lead", text: "Accountability should never belong to software." },
      {
        kind: "steps",
        items: [
          {
            n: "01",
            title: "Human review before client delivery",
            text: "No client-facing output is delivered without a human who has reviewed it, approved it, and stands behind it. No exceptions.",
          },
          {
            n: "02",
            title: "Humans make the final call",
            text: "AI can inform a decision. It never owns the judgment. The decisions that shape your organization remain human responsibilities.",
          },
          {
            n: "03",
            title: "Transparency around Canadian data",
            text: "If your information will pass through non-Canadian AI infrastructure, you will know before it happens — not after.",
          },
          {
            n: "04",
            title: "Every AI system has a human owner",
            text: "Every system we build or recommend has a named person responsible for its direction, oversight and outcomes.",
          },
        ],
      },
    ],
  },

  "the-blueprint": {
    blocks: [
      {
        kind: "lead",
        text: "Your executive AI assessment and 90-day transformation plan.",
      },
      { kind: "pricing" },
      {
        kind: "para",
        text: "A concise executive briefing built to be read quickly, discussed live, and acted on immediately.",
      },
      {
        kind: "para",
        text: "The challenge is not whether to adopt AI. It is deciding where AI creates real value, where judgment must remain human, and how to move forward with confidence. The Blueprint is a focused executive assessment built to answer those questions before you invest significant time, money or resources in implementation.",
        secondary: true,
      },
      {
        kind: "para",
        text: "We begin with how your organization operates today, how AI is already being used, where the greatest opportunities exist, and where governance, security and sovereignty need attention. By the end you will know where AI creates the greatest leverage, what must be protected, what to do first, and which priorities matter most over the next 90 days.",
        secondary: true,
      },
      {
        kind: "para",
        text: "Implement the roadmap internally or bring us in to build it. Either way, the strategy is built around your organization — not someone else's template.",
        secondary: true,
      },
    ],
  },

  "who-it-is-for": {
    summary: "Canadian organizations adopting AI on purpose rather than by accident.",
    blocks: [
      {
        kind: "para",
        text: "Canadian organizations that want to adopt AI intentionally rather than reactively. Leaders who want clarity before they commit, confidence before they invest, and a roadmap that does not trade governance for speed.",
      },
      {
        kind: "para",
        text: "Whether you are just beginning or already using AI across the business, the Blueprint gives leadership a shared starting point: the truth about where the organization actually stands.",
      },
      {
        kind: "lead",
        text: "The fastest way to waste money on AI is to implement before you understand.",
      },
      {
        kind: "para",
        text: "You do not need another presentation. You need a decision. That is exactly what the Be Human AI Blueprint was built to provide.",
      },
    ],
  },

  "what-youll-receive": {
    blocks: [
      { kind: "lead", text: "Four decisions. Not a hundred pages." },
      {
        kind: "para",
        text: "Not a report that sits in a folder. A concise executive briefing designed to be read in fifteen minutes, walked through live with your leadership team, and acted on the same week. Every Blueprint closes with our direct recommendation on where to start.",
        secondary: true,
      },
      {
        kind: "deliverables",
        items: [
          {
            n: "01",
            title: "Executive Findings",
            q: "Where are we today?",
            text: "Leadership readiness, employee AI usage, the organization's real strengths, and its most important risks — stated plainly and specifically.",
          },
          {
            n: "02",
            title: "AI Opportunity Map",
            q: "What should we do first?",
            text: "The highest-impact AI opportunities, ranked by effort and business value, each with a recommended human owner.",
          },
          {
            n: "03",
            title: "Risk & Governance Review",
            q: "What should we protect?",
            text: "Shadow AI exposure, data flows, governance gaps, cybersecurity concerns and Canadian sovereignty considerations — with what to address first.",
          },
          {
            n: "04",
            title: "90-Day Action Plan",
            q: "What happens next, in order?",
            text: "The first 30 days, the next 30, and the final 30. Every priority has an owner and an expected outcome. Actionable even if we are not in the room.",
          },
        ],
      },
      { kind: "lead", text: "Not a list of findings. A decision." },
    ],
  },

  "client-proof": {
    blocks: [
      { kind: "lead", text: "Built for real business decisions." },
      {
        kind: "para",
        text: "The strongest proof will come from the leaders who have used the Blueprint to make clearer, more confident decisions.",
      },
      {
        kind: "pending",
        label: "Testimonial pending",
        note: "A Blueprint has been delivered to All Y'All Foods, and a quote from its founder has been requested but not yet given. Rather than fill this space with something we wrote ourselves, it stays visibly empty until there is a real one to publish.",
      },
    ],
  },

  "how-it-works": {
    summary: "Discovery, assessment, and a live executive session — three business days.",
    blocks: [
      { kind: "lead", text: "From conversation to clarity in three business days." },
      {
        kind: "steps",
        items: [
          {
            n: "01",
            title: "Discovery",
            text: "A conversation, not a pitch. We learn your business, your team, and where AI already shows up in the organization — approved or not.",
          },
          {
            n: "02",
            title: "Assessment",
            text: "We assess leadership and employee readiness, governance and data flow, risk exposure, and where AI creates meaningful leverage in your specific workflows.",
          },
          {
            n: "03",
            title: "Executive Strategy Session",
            text: "We bring the findings back to your leadership team live. Not a document that sits in an inbox — a working conversation that ends with a clear recommendation on where to start.",
          },
        ],
      },
      { kind: "para", text: "Three business days. No long-term contract." },
    ],
  },

  "what-waiting-costs": {
    summary: "AI adoption does not pause while leadership decides what to do next.",
    blocks: [
      {
        kind: "lead",
        text: "AI adoption does not pause while leadership decides what to do next.",
      },
      {
        kind: "para",
        text: "Employees continue testing tools. New workflows emerge. Business information moves through systems that may not have been reviewed, approved or governed consistently. Over time, those individual decisions become organizational habits.",
      },
      {
        kind: "para",
        text: "The real cost is not simply that another company moves faster. It is that the distance between using AI and controlling AI keeps growing inside your own business. The longer ownership remains unclear, the harder it becomes to create one strategy, one standard, and one accountable way forward.",
      },
      {
        kind: "lead",
        text: "The Blueprint does not manufacture urgency. It reveals the exposure, opportunity and decisions that already exist.",
      },
    ],
  },

  "the-offer": {
    blocks: [
      { kind: "lead", text: "Founding organization rate." },
      {
        kind: "para",
        text: "We remain intentionally small so every Blueprint is led directly by the people responsible for the engagement — not passed to a junior consultant or rotating account team. For a limited number of founding organizations, the complete Be Human AI Blueprint is available at the founding rate.",
        secondary: true,
      },
      { kind: "pricing" },
      { kind: "para", text: "Your Blueprint includes:" },
      {
        kind: "check",
        items: [
          "Executive Findings",
          "AI Opportunity Map",
          "Risk & Governance Review",
          "90-Day Action Plan",
          "Live Executive Strategy Session",
          "Completion in approximately three business days",
        ],
      },
      {
        kind: "para",
        text: "If you choose to have us build any of the recommended AI systems, workflows or agents, your full Blueprint investment will be credited toward the implementation. No long-term contract. No obligation to continue.",
        secondary: true,
      },
      { kind: "cta", label: "Book Your Blueprint" },
    ],
  },

  "the-team": {
    blocks: [
      {
        kind: "lead",
        text: "No single discipline can lead AI transformation alone.",
      },
      {
        kind: "para",
        text: "AI is changing how organizations lead, decide, govern and grow — all at once. That is why The Be Human Company brings business leadership, cybersecurity, governance and human behaviour together. Not one generalist. Not the latest tool. A team built around the full challenge.",
      },
      {
        kind: "cards",
        items: [
          {
            title: "Shane James",
            text: "Founder & CEO. Entrepreneur, business strategist and executive advisor.",
            to: "/who-we-are",
          },
          {
            title: "Sid",
            text: "AI, Cybersecurity & Governance. A certified cybersecurity professional who builds the secure foundation and defines the guardrails.",
            to: "/who-we-are",
          },
          {
            title: "Maya",
            text: "Human Readiness & Organizational Change. A certified counsellor who leads the human side of transformation.",
            to: "/who-we-are",
          },
        ],
      },
      {
        kind: "para",
        text: "AI helps us research faster, analyze more deeply and execute more efficiently. It expands our capability. It never replaces our accountability.",
        secondary: true,
      },
    ],
  },

  "who-we-work-best-with": {
    summary: "Who this is for, and — just as usefully — who it is not.",
    blocks: [
      {
        kind: "lead",
        text: "The Blueprint works best for leaders who want AI on purpose — not by accident.",
      },
      { kind: "para", text: "We do our strongest work with leaders who:" },
      {
        kind: "check",
        items: [
          "Want AI adopted intentionally, not chased tool by tool.",
          "Believe governance, security and trust matter as much as speed.",
          "See their people as the advantage — not simply a cost to reduce.",
          "Want a clear strategy first, followed by implementation that actually serves it.",
          "Want a trusted advisor, not another software vendor.",
        ],
      },
      { kind: "lead", text: "We may not be the right fit if…" },
      {
        kind: "para",
        text: "You are looking for the cheapest possible implementation, a contractor to build an agent without understanding the business, or a vendor who simply executes instructions without challenging the decisions behind them. We would rather say that upfront. The right partnership creates better outcomes for everyone.",
      },
    ],
  },

  faq: {
    summary: "Nine questions leaders ask before booking.",
    blocks: [
      {
        kind: "faq",
        items: [
          {
            q: "How long does the Blueprint take?",
            a: "Most Blueprints are completed in approximately three business days, followed by a live Executive Strategy Session with your leadership team.",
          },
          {
            q: "How much time is required from our team?",
            a: "A discovery conversation, plus input from a small number of key people. We do the heavy lifting so your team can stay focused on the business.",
          },
          {
            q: "What happens after the Blueprint?",
            a: "Nothing you do not choose. Implement the roadmap internally, bring in another partner, or continue with us for implementation or ongoing advisory support. Our job is to create clarity — not lock you into a long-term engagement.",
          },
          {
            q: "Can you work alongside our existing IT provider or software vendors?",
            a: "Yes. The Blueprint is strategy and governance first. We often help organizations get more value from the systems, vendors and technology they already have.",
          },
          {
            q: "What size organizations do you work with?",
            a: "Our primary focus is Canadian organizations with approximately 5 to 100 employees, where founders or leadership teams remain close to strategic decisions. Larger organizations are welcome to reach out; the scope may simply expand.",
          },
          {
            q: "What if we are already using AI across the business?",
            a: "That is common. The Blueprint brings structure, ownership, governance and prioritization to what is already happening.",
          },
          {
            q: "What if we have never used AI before?",
            a: "That is also fine. The Blueprint meets the organization where it is and establishes an honest starting point.",
          },
          {
            q: "Is our data used to train AI models?",
            a: "No. Your information is used solely to complete your Blueprint. It is not used to train our systems or anyone else's.",
          },
          {
            q: "Can you work with us remotely or on-site?",
            a: "Yes. Most Blueprint work can be completed remotely without sacrificing quality. On-site work is available where it adds value.",
          },
        ],
      },
    ],
  },

  "closing-cta": {
    blocks: [
      {
        kind: "lead",
        text: "AI will become available to everyone. Human judgment will not.",
      },
      {
        kind: "para",
        text: "The organizations that thrive will not be the ones that adopted AI fastest. They will be the ones that built leaders who decide well, teams that change with confidence, and trust that holds while everything else accelerates.",
        secondary: true,
      },
      {
        kind: "para",
        text: "The Be Human AI Blueprint gives your leadership team the clarity to know where you stand, what to protect, and what to do next — in three business days, not three months.",
      },
      {
        kind: "lead",
        text: "Book your Blueprint. Build an organization the AI era cannot shake.",
      },
      { kind: "cta", label: "Book Your Blueprint" },
    ],
  },
};

/** The 16 sections, spine and content joined, in PDF order. */
export const BLUEPRINT_SECTIONS: readonly Section[] = SECTION_SPINE.map((spine) => {
  const content = CONTENT[spine.id];
  if (!content) {
    throw new Error(`blueprint: no content for section "${spine.id}"`);
  }
  return { ...spine, ...content };
});

/** The content keys, for the both-directions agreement check in the tests. */
export const CONTENT_IDS: readonly string[] = Object.keys(CONTENT);

/**
 * Every prose string in a block, in render order.
 *
 * Used by the text-ratio measurement and by the copy rules. Structural labels
 * that are not prose — a step's number, a card's route — are excluded, because
 * counting `"01"` as prose would inflate the numerator with characters no
 * reader experiences as text.
 */
export function blockText(block: Block): string[] {
  switch (block.kind) {
    case "lead":
    case "para":
      return [block.text];
    case "list":
    case "check":
      return [...block.items];
    case "steps":
      return block.items.flatMap((i) => [i.title, i.text]);
    case "deliverables":
      return block.items.flatMap((i) => [i.title, i.q, i.text]);
    case "cards":
      return block.items.flatMap((i) => [i.title, i.text]);
    case "faq":
      return block.items.flatMap((i) => [i.q, i.a]);
    case "pending":
      return [block.label, block.note];
    case "cta":
      return [block.label];
    case "pricing":
      return [FOUNDING_RATE, FUTURE_RATE, TURNAROUND];
    case "disclaimer":
      return [POSITIONING_DISCLAIMER];
  }
}

/** Collapse whitespace so character counts do not depend on source formatting. */
export function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Normalized prose characters in a set of sections. */
export function proseChars(sections: readonly Section[]): number {
  return sections.reduce(
    (total, section) =>
      total +
      normalize(section.title).length +
      normalize(section.summary ?? "").length +
      section.blocks.flatMap(blockText).reduce((n, t) => n + normalize(t).length, 0),
    0,
  );
}

/** True when a block is expository depth rather than spine. */
export function isSecondary(block: Block): boolean {
  return "secondary" in block && block.secondary === true;
}

/**
 * What a reader sees before opening anything.
 *
 * A tier-2 section contributes its heading and its one-line summary — the
 * `<summary>` element is visible, its body is not. Tier 1 and tier 3 contribute
 * everything except their `secondary` runs, which sit behind an in-section
 * disclosure.
 */
export function visibleProseChars(sections: readonly Section[]): number {
  return sections.reduce((total, section) => {
    if (section.tier === 2) {
      return total + normalize(section.title).length + normalize(section.summary ?? "").length;
    }
    const blocks = section.blocks.filter((b) => !isSecondary(b));
    return (
      total +
      normalize(section.title).length +
      blocks.flatMap(blockText).reduce((n, t) => n + normalize(t).length, 0)
    );
  }, 0);
}
