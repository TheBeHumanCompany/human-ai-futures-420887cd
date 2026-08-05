/**
 * Text-normalisation helpers for a slug generator (built on top of this file).
 *
 * Deliberately duplicates the diacritics-folding technique already used by
 * `podbean/filter.ts`'s private `normalise()` and `sanity/publish.ts`'s
 * `computeSearchText()`, rather than importing from either — both of those are
 * out of scope to touch, and this is the same established pattern.
 */

/** NFD-normalizes and strips the combining marks left behind, e.g. "João" -> "Joao". */
export function foldDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Lowercases, folds diacritics, collapses any run of non-alphanumeric
 * characters to a single hyphen, and trims leading/trailing hyphens.
 *
 * A possessive apostrophe is itself a one-character non-alphanumeric run,
 * separate from the space before it, so "Joao Ribeiro's" -> "joao-ribeiro-s":
 * the trailing "s" survives as its own token rather than rejoining "ribeiro".
 */
export function kebab(input: string): string {
  return foldDiacritics(input.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Dropped from `keywordSlug` because they demonstrably appear in real podcast
 * episode titles from this feed — e.g. "How Glyn Lewis Creates Community" —
 * where "how" needs to fall out of the keyword slug: `how`, `this`, `that`.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
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
  "is",
  "are",
  "how",
  "this",
  "that",
  "into",
  "onto",
  "as",
]);

/**
 * Tokenizes on non-alphanumeric boundaries, folds case and diacritics per
 * token, drops stopwords and single-character tokens, and joins the survivors
 * in their ORIGINAL order — never reordered or sorted.
 */
export function keywordSlug(text: string): string {
  const tokens = foldDiacritics(text.toLowerCase()).match(/[a-z0-9]+/g) ?? [];
  return tokens.filter((token) => token.length > 1 && !STOPWORDS.has(token)).join("-");
}

/**
 * Truncates to at most `maxLength` characters, cutting at the last hyphen
 * boundary at or before that position rather than mid-word, then strips any
 * trailing hyphen the cut leaves behind.
 */
export function capAtWordBoundary(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;

  const truncated = slug.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf("-");
  const cut = lastHyphen === -1 ? truncated : truncated.slice(0, lastHyphen);

  return cut.replace(/-+$/, "");
}
