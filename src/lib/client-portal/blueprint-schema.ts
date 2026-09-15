/**
 * The blueprint's content contract: a growable section list, and the one place
 * the paywall is applied to it.
 *
 * SHAPE. A blueprint is an ordered list of sections, not a document. The
 * preliminary expands into the final by ADDING sections (and occasionally
 * superseding a shallow one), so "publish four more topics" appends four
 * sections and rewrites nothing. `tier` is a property of each section, which is
 * what lets one list serve both tabs.
 *
 * OPEN BY CONSTRUCTION. `band` is a string and `Block` keeps an `unknown`
 * member, both deliberately. The section vocabulary is still being discovered —
 * the preliminary has shipped three times under two disagreeing section models —
 * so a new band or block type must cost a renderer branch, never a migration and
 * never a parse failure. `parseBlocks` keeps a block it does not recognise;
 * the renderer falls back for it.
 *
 * THE GATE. `applyTier` is the only function that decides what a client may
 * read, and it is the chokepoint the magic-link path depends on. That path
 * (`/c/<token>`) reads with the service-role key, which bypasses RLS by design
 * (US-001), so Postgres is NOT the boundary there — this function is. It strips
 * `blocks` from locked sections on the server and returns the title and teaser
 * only, so locked prose never enters the SSR payload to be hidden with CSS.
 *
 * The Clerk path (`/portal`) is additionally covered by the RLS policy in
 * `supabase/migrations/20260915000000_client_blueprint_sections.sql`. Both
 * paths, one rule, enforced twice on purpose.
 *
 * Counterfactual: returning locked bodies and hiding them in the component
 * puts the paid blueprint in the page source of an unpaid client.
 */

export type BlueprintTier = "preliminary" | "final";

/** Known bands. Kept as a union of string literals WIDENED to string so an
 *  unrecognised band parses and renders through the fallback. */
export const KNOWN_BANDS = [
  "hero",
  "findings",
  "opportunities",
  "question",
  "unknowns",
  "sources",
  "prose",
  "playbook",
] as const;

export type KnownBand = (typeof KNOWN_BANDS)[number];

export interface FindingBlock {
  type: "finding";
  /** Mirrors ResearchReport.Finding.kind — a hypothesis must never render as a fact. */
  kind: "fact" | "estimate" | "hypothesis";
  claim: string;
  verification?: string;
  evidenceIds?: string[];
  supportingExcerpts?: string[];
}

export interface OpportunityBlock {
  type: "opportunity";
  label: string;
  title: string;
  bullets: { label: string; text: string }[];
}

export interface ProseBlock {
  type: "prose";
  /** Paragraphs as plain text. Rendered as React children, never as HTML. */
  paragraphs: string[];
}

export interface QuestionBlock {
  type: "question";
  question: string;
}

export interface UnknownItemBlock {
  type: "unknown";
  text: string;
}

export interface SourceBlock {
  type: "source";
  label: string;
  url?: string;
}

export interface PlaybookRefBlock {
  type: "playbookRef";
  /** Resolved server-side against the Sanity playbook library. */
  playbookId: string;
  note?: string;
}

/**
 * The migration escape hatch: the one existing report is a single authored HTML
 * body. Carrying it as an explicit block type keeps it renderable while the
 * structured sections are built, and makes the remaining blob greppable rather
 * than indistinguishable from structured content.
 */
export interface LegacyHtmlBlock {
  type: "legacyHtml";
  html: string;
}

/**
 * Any JSON the database can hold. Spelled out rather than `unknown` because
 * these values cross the server-function boundary, and TanStack validates that
 * everything returned from a server function is serialisable — `unknown` is not
 * provably so, and the whole `ClientPage` type is rejected if one field is.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** A block whose `type` this version does not know. Preserved, not dropped. */
export interface UnrecognisedBlock {
  type: string;
  [key: string]: JsonValue | undefined;
}

export type Block =
  | FindingBlock
  | OpportunityBlock
  | ProseBlock
  | QuestionBlock
  | UnknownItemBlock
  | SourceBlock
  | PlaybookRefBlock
  | LegacyHtmlBlock
  | UnrecognisedBlock;

export interface BlueprintSection {
  id: string;
  sectionKey: string;
  ordinal: number;
  tier: BlueprintTier;
  title: string;
  band: string;
  /** Present only when the section is readable. Absent when locked. */
  blocks?: Block[];
  /** The upsell line, shown in place of the body when locked. */
  teaser?: string;
  /** True when this section is withheld pending payment. */
  locked: boolean;
}

/* ------------------------------------------------------------------ */
/* Parsing — hand-rolled narrowing, matching `supabase-clerk.ts`.       */
/* ------------------------------------------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Keeps every block that has a usable `type`; drops only malformed entries. */
export const parseBlocks = (value: unknown): Block[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (block): block is Block => isRecord(block) && isNonEmptyString(block.type),
  );
};

/** One Postgres row, as PostgREST returns it. */
export interface BlueprintSectionRow {
  id?: unknown;
  section_key?: unknown;
  ordinal?: unknown;
  tier?: unknown;
  status?: unknown;
  title?: unknown;
  teaser?: unknown;
  band?: unknown;
  body?: unknown;
}

/**
 * A row becomes a section only if it carries the fields the renderer needs.
 * Mirrors the US-011 both-halves rule: a half-written row renders as nothing
 * rather than as an empty section with a title.
 */
export const parseSection = (row: unknown): BlueprintSection | null => {
  if (!isRecord(row)) return null;
  const { id, section_key, ordinal, tier, title, teaser, band, body } = row;

  if (!isNonEmptyString(id)) return null;
  if (!isNonEmptyString(section_key)) return null;
  if (!isNonEmptyString(title)) return null;
  if (!isNonEmptyString(band)) return null;
  if (tier !== "preliminary" && tier !== "final") return null;
  if (typeof ordinal !== "number" || !Number.isFinite(ordinal)) return null;

  const blocks = isRecord(body) ? parseBlocks(body.blocks) : [];

  return {
    id,
    sectionKey: section_key,
    ordinal,
    tier,
    title,
    band,
    blocks,
    teaser: isNonEmptyString(teaser) ? teaser : undefined,
    locked: false,
  };
};

export const parseSections = (rows: unknown): BlueprintSection[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(parseSection)
    .filter((section): section is BlueprintSection => section !== null)
    .sort((a, b) => a.ordinal - b.ordinal);
};

/* ------------------------------------------------------------------ */
/* The gate                                                            */
/* ------------------------------------------------------------------ */

/**
 * Apply the paywall. The ONLY place a section's readability is decided.
 *
 * `unlocked` is the client's paid state (`client_paid_reports.unlocked`).
 * Preliminary sections are always readable. Final sections keep their title and
 * teaser — that is the upsell — and lose `blocks` entirely, so the withheld
 * content is never serialised into the page.
 */
export const applyTier = (
  sections: readonly BlueprintSection[],
  unlocked: boolean,
): BlueprintSection[] =>
  sections.map((section) => {
    const locked = section.tier === "final" && !unlocked;
    if (!locked) return { ...section, locked: false };
    const { blocks: _withheld, ...rest } = section;
    return { ...rest, locked: true };
  });

/** The two tabs, derived from one list rather than stored as two documents. */
export const tabsOf = (sections: readonly BlueprintSection[]) => ({
  preliminary: sections.filter((s) => s.tier === "preliminary"),
  final: sections.filter((s) => s.tier === "final"),
});
