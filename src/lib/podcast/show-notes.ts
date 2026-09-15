/**
 * Show notes, cleaned of the promotional tail the feed carries.
 *
 * Every episode description in the catalogue is a real editorial summary with a
 * social-media caption welded onto the end:
 *
 *   "...this one's for you. Mobile viewers: tap the link to watch the
 *    interview: https://youtu.be/... 🌐 AdhereTo Studio: https://...
 *    #ThePeopleDrivenPodcast | Hosted by Shane Jeremy James 🎧 Listen on:"
 *
 * That tail is distribution copy, not the episode. It is always trailing, so
 * the cut is made at the FIRST promotional marker and everything after it goes.
 * Truncating rather than deleting matched fragments is deliberate: it cannot
 * leave a half-sentence stitched to the next one.
 *
 * The rules are content-shaped, not episode-shaped — a future episode importing
 * the same caption style is cleaned by the same pass, with no per-episode
 * intervention.
 */

/** Anything from here onward is distribution copy rather than the episode. */
const PROMO_MARKERS: RegExp[] = [
  /mobile viewers/i,
  /tap the link/i,
  /watch the (?:full )?(?:interview|episode)/i,
  /listen on\s*:?/i,
  /hosted by\b/i,
  /subscribe (?:on|to)\b/i,
  /follow (?:us|along) on\b/i,
  /available on (?:apple|spotify|youtube)/i,
  /https?:\/\//,
  /#[A-Za-z]/,
  /[🌐🎧🎥🎙📺📱▶️]/u,
];

/** A whole line that is nothing but promo: a handle, a hashtag row, a link. */
const PROMO_LINE = /^(?:[@#][\w.]+|\W*https?:\/\/\S+\W*|[\s|·—–-]*)$/;

/**
 * Any CMS text field as a plain string, with its paragraph structure intact.
 *
 * A field may arrive as plain text or as Portable Text block content. Blocks
 * are joined with a blank line so each stored block stays its own paragraph —
 * never flattened into one continuous string.
 */
export function toPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value
    .map((block) => {
      if (typeof block === "string") return block;
      const children = (block as { children?: Array<{ text?: unknown }> })?.children;
      if (!Array.isArray(children)) return "";
      return children.map((child) => (typeof child?.text === "string" ? child.text : "")).join("");
    })
    .filter((block) => block.trim() !== "")
    .join("\n\n");
}

/** Split into paragraphs on blank lines; single newlines stay inside a paragraph. */
function toBlocks(text: string): string[] {
  return text
    .split(/\n[ \t]*\n+/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function firstPromoIndex(text: string): number {
  let cut = -1;
  for (const marker of PROMO_MARKERS) {
    const found = text.search(marker);
    if (found !== -1 && (cut === -1 || found < cut)) cut = found;
  }
  return cut;
}

/**
 * Trim a block back to the last complete sentence before the promo cut, so the
 * summary never ends mid-clause.
 */
function toSentenceBoundary(text: string): string {
  const trimmed = text.trim();
  const lastStop = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf("!"),
    trimmed.lastIndexOf("?"),
  );
  return lastStop === -1 ? trimmed : trimmed.slice(0, lastStop + 1);
}

/** The editorial summary alone, with the promotional tail removed. */
export function cleanShowNotes(description: unknown): string {
  const source = toPlainText(description);
  if (!source) return "";

  const blocks = toBlocks(source).map((block) =>
    block
      .split("\n")
      .filter((line) => line !== "" && !PROMO_LINE.test(line))
      .map((line) => {
        const cut = firstPromoIndex(line);
        return cut === -1 ? line : toSentenceBoundary(line.slice(0, cut));
      })
      .filter(Boolean)
      .join("\n"),
  );

  return blocks.filter(Boolean).join("\n\n").trim();
}

/**
 * Cleaned show notes as readable paragraphs.
 *
 * Blank lines are the CMS's own paragraph marks and always win. Single line
 * breaks are preserved inside the paragraph they belong to. A long single block
 * with no breaks at all is grouped roughly three sentences at a time, which is
 * formatting rather than rewriting — no word is added, removed or reordered.
 */
export function showNoteParagraphs(description: unknown): string[] {
  const cleaned = cleanShowNotes(description);
  if (!cleaned) return [];

  const blocks = toBlocks(cleaned);
  if (blocks.length > 1) return blocks;

  const single = blocks[0] ?? "";
  if (single.includes("\n")) return [single];

  const sentences = single.match(/[^.!?]+[.!?]*\s*/g) ?? [];
  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    grouped.push(sentences.slice(i, i + 3).join("").trim());
  }
  return grouped.filter(Boolean);
}

/**
 * Free CMS prose (a guest bio) as paragraphs.
 *
 * No promotional cleaning: a bio is authored copy, not feed copy. Blank lines
 * become separate paragraphs and single newlines are kept inside them.
 */
export function proseParagraphs(text: unknown): string[] {
  return toBlocks(toPlainText(text));
}

