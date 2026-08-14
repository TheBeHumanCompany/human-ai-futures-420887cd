/**
 * The company's approved positioning, held as data.
 *
 * **Approved company positioning. Reproduce faithfully; do not rewrite.** Every
 * `full` string, and every field of `MISSION`, `WHATS_NEXT` and `CLOSING`, is
 * verbatim from the founder's copy. Shane's own version replaces this module's
 * contents without touching a component — that is the point of holding it here
 * rather than inside JSX. The durable source of the current text is
 * `.omc/artifacts/positioning-v1-source.txt` in the workspace root.
 *
 * **The drift note.** `short` is an independently authored string, NOT a
 * derivation of `full`. It exists for the homepage band, where the verbatim
 * paragraph is too long to sit in a card. Rewriting `full` requires rewriting
 * `short`. They sit adjacent in one object literal and `positioning.test.ts`
 * catches total drift by asserting a shared load-bearing token, but nothing
 * makes partial drift impossible — a paragraph can be rewritten around the
 * token while `short` keeps saying the old thing. This module's
 * "one source of truth" claim is about one edit SITE and one MODULE, not one
 * authored string per fact.
 */

/**
 * Route paths as literal types.
 *
 * TanStack's `<Link to>` is constrained to the generated union of known routes,
 * so this union gives every initiative a compile error rather than a dead link
 * if a route is ever renamed. Precedent: `PILLAR_ROUTES` in
 * `src/lib/sales/pillars.ts:125`, consumed at `src/lib/content.ts:34`.
 */
export type InitiativeRoute =
  | "/be-human-ai"
  | "/the-new-human-era"
  | "/the-human-archive"
  | "/podcast";

export interface Initiative {
  id: "be-human-ai" | "the-new-human-era" | "the-human-archive" | "podcast";
  /** Display name, verbatim. */
  name: string;
  /** Where the initiative lives. Typed, so a renamed route breaks the build. */
  to: InitiativeRoute;
  /** The founder's paragraph, VERBATIM. One entry per paragraph. */
  full: readonly string[];
  /** Homepage band summary — OURS, not approved copy. See the drift note. */
  short: string;
  /** Link text out to the initiative. Ours. */
  cta: string;
}

/**
 * The floor the archive copy claims, as a number rather than as prose.
 *
 * Named for a floor because the copy says "more than", and this repo cannot
 * corroborate it. No archive document type exists in Sanity
 * (`studio/schemaTypes/index.ts:15` exports only `episode`, `topic`,
 * `slugLock`); `ARCHIVE` in `src/lib/content.ts:87-120` is four hardcoded
 * entries; and all four detail pages render "This archive entry is being
 * prepared" (`src/routes/human-archive.$slug.tsx:70-72`). The figure is the
 * founder's own statement about his own archive, which lives off-site — this
 * repo is not the authority on it. The constant exists so the number has one
 * provenance anchor and one assertion target, NOT so it can be interpolated
 * into the sentence: the copy stays verbatim and `positioning.test.ts` is what
 * keeps the two from drifting apart.
 */
export const ARCHIVE_PERSPECTIVES_MIN = 200;

/**
 * ISO date the perspectives figure was confirmed in writing, or `null`.
 *
 * Confirmed 2026-08-14 by **Sid, on Shane's behalf**: the figure is accurate
 * and Shane stands behind it. The name matters as much as the date — a
 * provenance anchor whose value is that a future reader can go back to a
 * person, and "confirmed" with no name is indistinguishable from an assumption
 * that hardened.
 *
 * This is a mechanical gate, not a checklist item. While it is `null` the
 * sentence carrying the figure is absent from `INITIATIVES`, and
 * `positioning.test.ts` asserts the biconditional in BOTH directions — a claim
 * with no date fails, and a date with no claim fails. Shipping the figure
 * therefore takes a deliberate typed edit with a date attached, and cannot
 * happen by inattention.
 *
 * What confirming it does NOT resolve: a visitor reading "more than 200" and
 * clicking through still finds four portraits whose detail pages are unwritten.
 * That is follow-up #1, and it outranks the number.
 */
export const ARCHIVE_FIGURE_CONFIRMED: string | null = "2026-08-14";

export const MISSION = {
  eyebrow: "The Be Human Company",
  headline: "The Future Is Human.",
  lede: [
    "Artificial intelligence is changing the world faster than any technology in human history. The question is no longer whether AI will transform our world. It already is. The real question is: Will humanity advance with it?",
    "At The Be Human Company, we believe technology is advancing, and humanity has to advance with it. That's why we're building the human infrastructure people and organizations need to navigate one of history's biggest transitions.",
  ],
  missionLine:
    "Our mission is simple: to help people and organizations build the Human Advantage in the age of AI.",
  transitionLine:
    "Today, we're building that human infrastructure through four connected initiatives.",
} as const satisfies {
  eyebrow: string;
  headline: string;
  lede: readonly string[];
  missionLine: string;
  transitionLine: string;
};

/**
 * The paragraph carrying the figure, held separately so the gate can withhold
 * it as a whole.
 *
 * Binary rather than trimmed, deliberately: the same sentence also carries
 * "not to tell the world what humanity should mean, but to listen to what
 * humanity is telling us", which is the archive's entire framing. Cutting a
 * clause out of approved copy is rewriting it. The whole paragraph ships, or it
 * waits.
 */
const ARCHIVE_FIGURE_PARAGRAPH =
  "We've already documented more than 200 perspectives from people of different ages, backgrounds, and experiences—not to tell the world what humanity should mean, but to listen to what humanity is telling us. As technology advances, we believe preserving and learning from authentic human perspectives has never been more important.";

const ARCHIVE_FULL: readonly string[] = [
  "The Human Archive began with one simple question:",
  '"What does it mean to be human?"',
  "It's one of humanity's oldest questions, and we believe it may become one of the most important questions of the AI era.",
  ...(ARCHIVE_FIGURE_CONFIRMED === null ? [] : [ARCHIVE_FIGURE_PARAGRAPH]),
];

export const INITIATIVES: readonly [Initiative, Initiative, Initiative, Initiative] = [
  {
    id: "be-human-ai",
    name: "Be Human AI",
    to: "/be-human-ai",
    full: [
      "We help organizations adopt AI through strategy, human readiness, governance, and responsible transformation, ensuring technology strengthens both business performance and the people behind it.",
    ],
    short:
      "AI strategy, human readiness, and governance for organizations adopting AI without losing the people behind it.",
    cta: "Explore Be Human AI",
  },
  {
    id: "the-new-human-era",
    name: "The New Human Era",
    to: "/the-new-human-era",
    full: [
      "The New Human Era is our worldview. We attempt to build a framework for how humanity thrives in the age of AI. It asks a different question than most conversations about technology:",
      "As AI becomes more capable, how do we deliberately become more human?",
      "It invites us to rethink success, status, wealth, leadership, work, and what it means to live a meaningful life in a world becoming more artificial. Through ideas like Human Wealth, Human Debt, Human Reps, Human Mode, and The Bridge Generation, we're helping people and organizations better understand and navigate one of the biggest transitions humanity has ever faced.",
    ],
    short:
      "Our worldview: a framework for how humanity thrives, and deliberately becomes more human, in the age of AI.",
    cta: "Read The New Human Era",
  },
  {
    id: "the-human-archive",
    name: "The Human Archive",
    to: "/the-human-archive",
    full: ARCHIVE_FULL,
    short:
      "One question, asked around the world: what does it mean to be human? We listen rather than answer.",
    cta: "Explore The Human Archive",
  },
  {
    id: "podcast",
    name: "The People-Driven CEO Podcast",
    to: "/podcast",
    full: [
      "Through conversations with founders, CEOs, leaders, and innovators, we explore leadership, business, artificial intelligence, and humanity's future. We believe today's conversations will help shape the organizations and the world we build tomorrow.",
    ],
    short:
      "Founders, CEOs and innovators on leadership, business, and the world today's decisions are building.",
    cta: "Listen to the podcast",
  },
];

/**
 * Lookup by id, throwing rather than returning undefined.
 *
 * Same shape and same reason as `pillarBySlug` in `sales/pillars.ts`: callers
 * are rendering copy, and a silent `undefined` there is a blank section rather
 * than a failure anyone notices. Indexing `INITIATIVES` positionally would work
 * today and break the first time the order changes.
 */
export function initiativeById(id: Initiative["id"]): Initiative {
  const initiative = INITIATIVES.find((candidate) => candidate.id === id);
  if (!initiative) throw new Error(`Unknown initiative id: ${id}`);
  return initiative;
}

export const WHATS_NEXT = {
  heading: "We're just getting started.",
  body: [
    "Today's initiatives are the foundation of something much bigger. Over time, we'll continue expanding the human infrastructure through new education, research, media, leadership, community, and organizational initiatives, all designed to help people and organizations thrive in the age of AI.",
  ],
} as const satisfies { heading: string; body: readonly string[] };

export const CLOSING: readonly string[] = [
  "Technology is advancing. Humanity has to advance with it.",
  "The Future Is Human.",
];
