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
export function cleanShowNotes(description: string | null | undefined): string {
  if (!description) return "";

  const kept = description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !PROMO_LINE.test(line))
    .map((line) => {
      const cut = firstPromoIndex(line);
      return cut === -1 ? line : toSentenceBoundary(line.slice(0, cut));
    })
    .filter(Boolean);

  return kept.join("\n\n").trim();
}

/**
 * Cleaned show notes as readable paragraphs.
 *
 * Blank lines are the feed's own paragraph marks and win when present. A long
 * single block is otherwise grouped roughly three sentences at a time, which is
 * formatting rather than rewriting — no word is added, removed or reordered.
 */
export function showNoteParagraphs(description: string | null | undefined): string[] {
  const cleaned = cleanShowNotes(description);
  if (!cleaned) return [];

  const blocks = cleaned
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length > 1) return blocks;

  const sentences = (blocks[0] ?? "").match(/[^.!?]+[.!?]*\s*/g) ?? [];
  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    grouped.push(sentences.slice(i, i + 3).join("").trim());
  }
  return grouped.filter(Boolean);
}
