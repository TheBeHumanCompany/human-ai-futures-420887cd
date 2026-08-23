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
 *  - The bracket-placeholder rule (`[Last Name]`, `[BRETT HEADSHOT]`) has to see
 *    the source strings, since a placeholder that never renders still ships.
 *  - The claim-traceability check maps public claims onto sections, and a claim
 *    pointing at a section that no longer exists must fail loudly.
 *
 * The section spine — ids, titles, order, tiers — lives in
 * `docs/blueprint-sections.json` and is imported, not restated. `blueprint.test.ts`
 * asserts the content keys and the spine agree exactly in both directions, so a
 * section cannot exist in one and not the other.
 *
 * ── 2026-08-22: this page stopped being a sales page ─────────────────────────
 *
 * It previously carried sixteen sections, a price, a turnaround, and three
 * "Book Your Blueprint" calls to action. The commercial model changed: the
 * Blueprint is no longer sold from the website, the sales cycle is referral-
 * and conversation-led, and the page's job is credibility rather than
 * conversion. What survives states outcomes; the method is not published.
 *
 * The pricing constants are gone rather than unused. A `FOUNDING_RATE` still
 * exported "for later" is a price that reappears on a page the moment someone
 * imports it, which is exactly the reversal this direction cannot afford.
 */

export type Tier = 1 | 2;

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

/** The ordered section ids. */
export const SECTION_IDS: readonly string[] = SECTION_SPINE.map((s) => s.id);

/* ── Content blocks ───────────────────────────────────────────────────────── */

/**
 * Marks expository depth inside an otherwise-visible section.
 *
 * A `secondary` block stays in its own section, in document order, in the DOM,
 * openable with JavaScript disabled. It is simply not shouting on arrival.
 */
type Secondary = { secondary?: boolean };

export type Block =
  /** A large statement line. `strong` opts a single lead into the bold caps register. */
  | { kind: "lead"; text: string; strong?: boolean }
  | ({ kind: "para"; text: string } & Secondary)
  /** Plain bulleted list. */
  | ({ kind: "list"; items: readonly string[] } & Secondary)
  /** The ✓ lists — the leadership questions. */
  | ({ kind: "check"; items: readonly string[] } & Secondary)
  | { kind: "steps"; items: readonly { n: string; title: string; text: string }[] }
  /**
   * The three pillars, stated as outcomes.
   *
   * This is the shape the exclusive positioning turns on, so it is its own kind
   * rather than a reuse of `cards`. Each pillar names the question it answers
   * and what is different in the organization afterwards — never how it is
   * done. `to` carries the reader to the pillar page that holds the depth,
   * which is what keeps the page from reading as a philosophy company once the
   * method is withheld.
   */
  | {
      kind: "outcomes";
      pillars: readonly {
        n: string;
        title: string;
        question: string;
        items: readonly string[];
        to: string;
        linkLabel: string;
      }[];
    }
  /** Selection criteria — a two-column grid of title + explanation, unnumbered. */
  | { kind: "criteria"; items: readonly { title: string; text: string }[] }
  /** The single booking CTA. */
  | { kind: "cta"; label: string }
  /**
   * The positioning disclaimer, from `POSITIONING_DISCLAIMER`.
   *
   * The control spine's own metadata says it provides readiness and assurance
   * and is not a certification; copy that describes the same framework while
   * quietly omitting that is making a claim by silence.
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
   * for tier 2, since it is the only text a reader sees before opening it.
   */
  summary?: string;
  blocks: readonly Block[];
};

const CONTENT: Record<string, { summary?: string; blocks: readonly Block[] }> = {
  "the-problem": {
    blocks: [
      {
        kind: "para",
        text: "Your people are already using these tools. Some are saving hours a week. Others are quietly creating risk. Almost none of it is visible from the top.",
      },
      {
        kind: "para",
        text: "Without a shared position, every team invents its own way of working. Processes drift. Decisions stop matching each other. The technology does not create that — it accelerates it, and it does so faster than a policy document can be written.",
      },
      {
        kind: "para",
        text: "As these systems spread, it becomes harder to see where information is going, which tools touch it, and who is accountable for the decisions it influences. Most organizations do not discover how much control they have lost. They find out when something goes wrong.",
        secondary: true,
      },
      {
        kind: "para",
        text: "Align the organization first, and the technology compounds that alignment. Leave it fragmented, and it compounds the fragmentation just as quickly. That is why transformation does not start with technology. It starts with leadership.",
        secondary: true,
      },
      {
        kind: "para",
        text: "The organizations that come out of this well are not the ones that bought the most tools. They are the ones that decided, early and out loud, what they were not willing to hand over.",
      },
    ],
  },

  "the-blueprint": {
    blocks: [
      {
        kind: "lead",
        text: "We do not publish the method. What we will tell you is what is different in your organization when the work is done.",
      },
      {
        kind: "outcomes",
        pillars: [
          {
            n: "01",
            title: "Human Readiness",
            question:
              "Are your leaders and employees ready for the way machine intelligence is changing work?",
            items: [
              "Leadership holds one position on where machine intelligence belongs — and where judgment does not bend.",
              "What your people are already doing with these tools is known, not guessed at — without it becoming an audit they learn to hide from.",
              "Adoption still holds a quarter after the training ends, because what got built was confidence rather than attendance.",
            ],
            to: "/be-human-ai/human-readiness",
            linkLabel: "Human Readiness in depth",
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
            to: "/be-human-ai/governance",
            linkLabel: "Governance & Sovereignty in depth",
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
            to: "/be-human-ai/ai-strategy",
            linkLabel: "Intelligence Strategy in depth",
          },
        ],
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
        // when the copy was first transcribed.
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
          "Key management — control of the encryption keys that ultimately decide who can read your data.",
          "Exit and portability — the ability to retrieve your data on the way out, and to have the provider's copy deleted.",
        ],
      },
      {
        kind: "para",
        text: "Where processing happens, and under which jurisdiction, is one recorded and rationalized factor in a data-handling decision. It is a real factor. It is not the whole question, and treating it as the whole question is how organizations end up confident and exposed at the same time.",
      },
      {
        kind: "para",
        text: "For Canadian organizations it also means understanding how PIPEDA, Quebec's Law 25 and the implications of the U.S. CLOUD Act may affect the way these systems handle information. Those conversations need to happen before the technology becomes embedded in the business — not after.",
      },
      { kind: "lead", text: "Canadian organizations deserve a Canadian approach." },
      {
        kind: "para",
        text: "As these systems become part of everyday business, leaders face real questions:",
      },
      {
        kind: "check",
        items: [
          "Where is our data going?",
          "Who controls it?",
          "Which systems have access to it?",
          "Who is accountable when a machine influences a decision, or gets one wrong?",
          "What information should never leave our organization?",
        ],
      },
      {
        kind: "para",
        text: "These are not merely technology questions. They are leadership questions. That is why every engagement begins by mapping governance, data flows and exposure before a single agent is designed or deployed.",
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
            text: "A machine can inform a decision. It never owns the judgment. The decisions that shape your organization remain human responsibilities.",
          },
          {
            n: "03",
            title: "Transparency around Canadian data",
            text: "If your information will pass through non-Canadian infrastructure, you will know before it happens — not after.",
          },
          {
            n: "04",
            title: "Every system has a human owner",
            text: "Every system we build or recommend has a named person responsible for its direction, oversight and outcomes.",
          },
        ],
      },
      {
        kind: "para",
        text: "Your information is used solely to complete your Blueprint. It is not used to train our models, and it is not shared with anyone outside the engagement.",
      },
    ],
  },

  "client-proof": {
    blocks: [
      {
        kind: "pending",
        label: "Case study — pending client sign-off",
        note: "A named client engagement goes here once the client has approved the wording in writing. Nothing is published in this slot before then — not a paraphrase, and not an unattributed version.",
      },
    ],
  },

  "who-we-work-best-with": {
    blocks: [
      {
        kind: "criteria",
        items: [
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
        ],
      },
    ],
  },

  "closing-cta": {
    blocks: [
      {
        kind: "para",
        text: "That is a statement about capacity, not scarcity marketing. The work only holds when we are in the room often enough to see it through, and there is a limit to how many rooms that is.",
      },
      {
        kind: "para",
        text: "If that sounds like your organization, the next step is a conversation, not a purchase. We will tell you honestly whether this is the right year for it.",
      },
      { kind: "cta", label: "Start a conversation" },
    ],
  },
};

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
 * Structural labels that are not prose — a step's number, a pillar's route —
 * are excluded, because counting `"01"` as prose would inflate the numerator
 * with characters no reader experiences as text.
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
    case "outcomes":
      return block.pillars.flatMap((p) => [p.title, p.question, ...p.items, p.linkLabel]);
    case "criteria":
      return block.items.flatMap((i) => [i.title, i.text]);
    case "pending":
      return [block.label, block.note];
    case "cta":
      return [block.label];
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
 * `<summary>` element is visible, its body is not. Tier 1 contributes
 * everything except its `secondary` runs, which sit behind an in-section
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
