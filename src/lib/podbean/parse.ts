import type { Episode, EpisodeListItem } from "./types";

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

/**
 * A code point that `String.fromCodePoint` will accept.
 *
 * It throws `RangeError` above U+10FFFF, and the feed is third-party input, so
 * an out-of-range entity anywhere in any one item would otherwise escape
 * `parseFeed`'s per-item guards and take down the entire catalogue.
 */
function codePointOrNull(value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) return null;
  // Lone surrogates are valid to construct but produce unpaired garbage.
  if (value >= 0xd800 && value <= 0xdfff) return null;
  return String.fromCodePoint(value);
}

/** Decodes the named and numeric entities that appear in this feed. */
export function decodeEntities(input: string): string {
  return input
    .replace(
      /&#x([0-9a-f]+);/gi,
      (match, hex: string) => codePointOrNull(Number.parseInt(hex, 16)) ?? match,
    )
    .replace(
      /&#(\d+);/g,
      (match, dec: string) => codePointOrNull(Number.parseInt(dec, 10)) ?? match,
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/**
 * Reduces markup to plain text and collapses whitespace.
 *
 * NOT a sanitizer, and must never be trusted as one — regex tag-stripping
 * cannot be made safe. Entities are decoded *before* tags are stripped, so
 * escaped markup (`&lt;script&gt;`) is neutralised rather than resurrected as
 * live markup, but the only safe destination for this output is React text.
 * Never pass it to `dangerouslySetInnerHTML`.
 */
export function stripHtml(input: string): string {
  return decodeEntities(input)
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Most show notes open with a near-identical host introduction — 10 of the 39
 * begin with the exact same sentence, and most of the rest with a variant of
 * "In this episode … Shane Jeremy James sits down with …". Excerpting the raw
 * opening would make every row read the same, so the lead-in is dropped up to
 * and including the introducing verb, which lands the excerpt on the guest and
 * what they actually do.
 */
const INTRO_PATTERNS: readonly RegExp[] = [
  // "In this episode of the podcast, host Shane Jeremy James, known as S1H,
  // sits down with " — anything up to and including the introducing verb.
  /^.{0,160}?\b(?:sits? down with|sat down with|speaks? with|spoke with|talks? with|talked with|talks? to|is joined by|chats? with|welcomes)\s+/i,
  // "In this inspiring episode, " / "In this episode of The People-Driven CEO
  // Podcast, " — the 16 items that name the guest directly with no verb.
  /^In this\b[^,.]{0,60}?\bepisode\b(?:\s+of\s+[^,.]{0,60})?,\s*/i,
  // Whatever "meet " is left over once the clause above is gone.
  /^(?:we\s+)?meet\s+/i,
];

/**
 * A short, display-safe summary of an episode.
 *
 * Also the search haystack, which is why it ships to the browser while the
 * full `description` does not. Episodes whose notes do not use the house
 * intro pattern (episode 1, for one) are left alone rather than mangled.
 */
export function makeExcerpt(description: string, maxChars = 200): string {
  let body = description.trim();
  for (const pattern of INTRO_PATTERNS) {
    const stripped = body.replace(pattern, "").trim();
    // Never strip away the whole summary — episode 1 opens with real prose and
    // must survive untouched.
    if (stripped.length > 0) body = stripped;
  }
  if (body.length === 0) body = description.trim();
  if (body.length <= maxChars) return body;

  const cut = body.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
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
  // "How Glyn Lewis Creates", "How Linda Biggs and Joni Are" -> stops at "and".
  // NAME ends in `{1,3}`, so the trailing `?` makes that quantifier LAZY — it
  // is not an "optional name". Laziness is exactly what stops the capture at
  // "and" instead of swallowing the co-named brand.
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
 * episodes: resolves 37, declining only episodes 6 and 1, whose titles name no
 * person at all. Episodes 4 and 15 *do* resolve — to "Elizabeth Fisher" and
 * "Joao Ribeiro" — because the possessive pattern runs before the generic
 * `with <X>` pattern and so beats the trailing brand name.
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
    const linkRaw = tagContent(chunk, "link");

    if (!guid || !rawTitle || !pubDateRaw || !durationRaw || !audioUrl || !linkRaw) continue;

    const parsedDate = new Date(pubDateRaw);
    if (Number.isNaN(parsedDate.getTime())) continue;

    // Strict digits-only: this feed stores plain seconds, but the iTunes spec
    // also permits HH:MM:SS, and `parseInt("46:31")` would quietly yield 46 —
    // rendering a 46-minute episode as "1 min" with a 46-second seek bar.
    // Better to skip the item and let the evaluator fail loudly.
    if (!/^\d+$/.test(durationRaw)) continue;
    const durationSeconds = Number.parseInt(durationRaw, 10);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) continue;

    const title = decodeEntities(rawTitle).trim();
    const episodeRaw = tagContent(chunk, "itunes:episode");
    const episodeNumber = episodeRaw ? Number.parseInt(episodeRaw, 10) : NaN;
    const description = stripHtml(tagContent(chunk, "description") ?? "");

    episodes.push({
      guid,
      episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : null,
      title,
      guest: parseGuest(title),
      description,
      excerpt: makeExcerpt(description),
      pubDate: parsedDate.toISOString(),
      durationSeconds,
      audioUrl: decodeEntities(audioUrl),
      podbeanUrl: decodeEntities(linkRaw),
    });
  }

  // The feed already arrives newest-first; sorting makes that a guarantee
  // rather than an assumption about PodBean's ordering.
  return episodes.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

/**
 * The three most recent episodes, for the homepage.
 *
 * Generic so it works on both the full `Episode` and the trimmed
 * `EpisodeListItem` the loaders actually receive.
 */
export function selectFeatured<T>(episodes: readonly T[], count = 3): T[] {
  return episodes.slice(0, count);
}

/**
 * Drops show notes before an episode list crosses the wire.
 *
 * Nothing renders `description`, but it is ~1.05 kB per episode — across 39
 * items it was 41 kB of the 57 kB dehydrated payload on every `/podcast`
 * response, and again on every client-side navigation back to the route.
 * Parsing it stays worthwhile (it is the natural source for an excerpt later);
 * shipping it to the browser unrendered is not.
 */
export function forListing(episodes: Episode[]): EpisodeListItem[] {
  return episodes.map(({ description: _description, ...rest }) => rest);
}
