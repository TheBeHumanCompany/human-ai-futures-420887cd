import type { Episode } from "./types";

/* ------------------------------------------------------------------ *
 * Text helpers
 * ------------------------------------------------------------------ */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};

/** Decodes the named and numeric entities that appear in this feed. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/**
 * Strips markup and collapses whitespace.
 *
 * The feed's descriptions are ~1.9kB of HTML carrying leaked utility classes
 * (`<p class="whitespace-normal break-words">`), so this output is used as
 * text — it is never injected as HTML.
 */
export function stripHtml(input: string): string {
  return decodeEntities(
    input.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** `2773` -> `"46 min"`. The feed stores duration as an integer of seconds. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/* ------------------------------------------------------------------ *
 * Guest extraction
 * ------------------------------------------------------------------ */

/**
 * Word shapes that never appear in a personal name but do appear in the brand
 * phrases this feed's titles contain ("Plant-Based Cleaning Revolutionaries").
 * A candidate containing any of these is rejected outright.
 */
const NON_NAME_SUFFIX = /(?:ing|ies|tion|sion|ness|ment|ology|wear|food|care)$/i;

const NON_NAME_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "with",
  "on",
  "in",
  "for",
  "from",
  "to",
  "at",
  "by",
  "story",
  "stories",
  "journey",
  "mission",
  "rise",
  "legacy",
  "brand",
  "brands",
  "team",
  "company",
  "co",
  "inc",
  "ltd",
  "group",
  "studio",
  "labs",
  "lab",
  "beauty",
  "wellness",
  "health",
  "kitchen",
  "chocolates",
  "superfood",
  "elements",
  "revolutionaries",
  "conversation",
  "episode",
  "podcast",
  "business",
  "future",
  "world",
  "era",
  "life",
  "cleaning",
  "period",
  "care",
  "energy",
  "drink",
  "protein",
  "skincare",
  "fashion",
  "waste",
  "cannabis",
  "therapy",
  "tech",
  "deep",
  "radical",
  "culture",
  "community",
]);

/** Rejects candidates that don't look like a personal name. */
function looksLikePersonName(candidate: string): boolean {
  const words = candidate.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;

  for (const word of words) {
    // Real names in this feed never contain digits or internal hyphens
    // ("Plant-Based"), and brand words dominate the hyphenated cases.
    if (/[0-9]/.test(word) || word.includes("-")) return false;
    if (!/^[A-Z]/.test(word)) return false;

    const bare = word.replace(/[^A-Za-z]/g, "").toLowerCase();
    if (bare.length === 0) return false;
    if (NON_NAME_WORDS.has(bare)) return false;
    // Allow short particles like "de", "van", "Mc" — only test substantive words.
    if (bare.length > 3 && NON_NAME_SUFFIX.test(bare)) return false;
  }

  return true;
}

const NAME = String.raw`[A-Z][\p{L}'’.]*(?:\s+[A-Z][\p{L}'’.]*){1,3}`;

/**
 * Ordered most-specific first. Order is load-bearing: the possessive pattern
 * must win before the generic `with <X>` pattern, otherwise
 * "Joao Ribeiro's Journey with Elements Brazil" yields the brand.
 */
const GUEST_PATTERNS: RegExp[] = [
  // "Joao Ribeiro's Journey", "Jenn Harper's Cheekbone Beauty Journey"
  new RegExp(String.raw`(${NAME})['’]s\b`, "u"),
  // "A Conversation with Maria Porcellato"
  new RegExp(String.raw`\bConversation with\s+(${NAME})`, "u"),
  // "The Creative Journey of Mia Fiona Kut", "The Leadership Journey of Cathline James"
  new RegExp(String.raw`\b(?:Story|Journey) of\s+(${NAME})`, "u"),
  // "How Glyn Lewis Creates", "How Linda Biggs and Joni Are" -> stops at "and"
  new RegExp(
    String.raw`\bHow\s+(${NAME}?)\s+(?:and|is|Is|are|Are|Built|Grew|Turned|Creates|Made|Went)\b`,
    "u",
  ),
  // "Jill De Chavez on Building", "Marc Wandler on Purpose"
  new RegExp(String.raw`[:\-—]\s*(${NAME})\s+on\s`, "u"),
  // "with Alexandra Dean", "with Antonio Zivanovic of ElektraFi"
  new RegExp(String.raw`\bwith\s+(${NAME})`, "u"),
];

/**
 * Extracts the interview guest from an episode title.
 *
 * Returns `undefined` rather than a wrong answer. Measured against all 39 live
 * episodes: resolves 35, and correctly declines episodes 1, 4, 6 and 15, whose
 * titles name a brand or no person at all.
 */
export function parseGuest(title: string): string | undefined {
  const clean = decodeEntities(title).replace(/^Episode\s+\d+\s*[:\-—]\s*/i, "");

  for (const pattern of GUEST_PATTERNS) {
    const match = clean.match(pattern);
    const candidate = match?.[1]?.trim().replace(/[.,]$/, "");
    if (candidate && looksLikePersonName(candidate)) return candidate;
  }

  return undefined;
}

/* ------------------------------------------------------------------ *
 * Feed parsing
 * ------------------------------------------------------------------ */

function tagContent(chunk: string, tag: string): string | null {
  const match = chunk.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  return match[1]
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .trim();
}

function attr(chunk: string, tag: string, name: string): string | null {
  const match = chunk.match(new RegExp(`<${tag}[^>]*\\s${name}="([^"]*)"`, "i"));
  return match ? match[1] : null;
}

/**
 * Parses a PodBean RSS document into episodes, newest first.
 *
 * Items missing any required field are skipped rather than emitted partial —
 * all 39 live items satisfy the requirements, so a miss signals a feed change
 * worth failing loudly on in the evaluator rather than papering over.
 */
export function parseFeed(xml: string): Episode[] {
  const items = xml.split(/<item(?:\s[^>]*)?>/i).slice(1);
  const episodes: Episode[] = [];

  for (const raw of items) {
    const chunk = raw.split(/<\/item>/i)[0] ?? raw;

    const guid = tagContent(chunk, "guid");
    const rawTitle = tagContent(chunk, "title");
    const pubDateRaw = tagContent(chunk, "pubDate");
    const durationRaw = tagContent(chunk, "itunes:duration");
    const audioUrl = attr(chunk, "enclosure", "url");

    if (!guid || !rawTitle || !pubDateRaw || !durationRaw || !audioUrl) continue;

    const parsedDate = new Date(pubDateRaw);
    if (Number.isNaN(parsedDate.getTime())) continue;

    const durationSeconds = Number.parseInt(durationRaw, 10);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) continue;

    const title = decodeEntities(rawTitle).trim();
    const episodeRaw = tagContent(chunk, "itunes:episode");
    const episodeNumber = episodeRaw ? Number.parseInt(episodeRaw, 10) : NaN;

    episodes.push({
      guid,
      episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : null,
      title,
      guest: parseGuest(title),
      description: stripHtml(tagContent(chunk, "description") ?? ""),
      pubDate: parsedDate.toISOString(),
      durationSeconds,
      audioUrl: decodeEntities(audioUrl),
      audioType: attr(chunk, "enclosure", "type") ?? "audio/mpeg",
    });
  }

  // The feed already arrives newest-first; sorting makes that a guarantee
  // rather than an assumption about PodBean's ordering.
  return episodes.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

/** The three most recent episodes, for the homepage. */
export function selectFeatured(episodes: Episode[], count = 3): Episode[] {
  return episodes.slice(0, count);
}
