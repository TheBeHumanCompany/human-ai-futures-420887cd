import { parseGuest } from "../podbean/parse";
import { capAtWordBoundary, kebab, keywordSlug } from "./normalise";

const MAX_SLUG_LENGTH = 60;

/** The same prefix `parseGuest` strips internally, applied here to the display title. */
const EPISODE_PREFIX = /^Episode\s+\d+\s*[:\-—]\s*/i;

/**
 * Builds a stable, human-readable slug for an episode: guest name first, then
 * the distinctive keywords left in the title once the guest is removed.
 *
 * `existingSlugs` is the set of slugs already handed out; a caller walking a
 * catalogue accumulates each returned slug into it so later episodes see the
 * earlier ones and collisions resolve deterministically in processing order.
 * Never throws and never returns an empty string, whatever the input.
 */
export function makeEpisodeSlug(
  title: string,
  episodeNumber: number | null,
  existingSlugs: ReadonlySet<string>,
): string {
  const prefixStripped = title.replace(EPISODE_PREFIX, "");
  // `parseGuest` strips the prefix itself, so it wants the original title.
  const guest = parseGuest(title);

  // A plain string replace: `parseGuest` returns the substring exactly as it
  // appeared, so there is nothing to escape and only the first hit is removed.
  const titleKeywords = guest
    ? keywordSlug(prefixStripped.replace(guest, ""))
    : keywordSlug(prefixStripped);

  let base: string;
  if (guest) {
    const guestSlug = kebab(guest);
    base = titleKeywords ? `${guestSlug}-${titleKeywords}` : guestSlug;
  } else if (titleKeywords) {
    base = titleKeywords;
  } else {
    // Unreachable for the real catalogue, but the contract is total.
    base = episodeNumber === null ? "untitled-episode" : `episode-${episodeNumber}`;
  }

  const capped = capAtWordBoundary(base, MAX_SLUG_LENGTH);
  if (!existingSlugs.has(capped)) return capped;

  // Re-cap the base to leave room for `-<suffix>` so the total stays within
  // `MAX_SLUG_LENGTH`, however long the suffix turns out to be.
  const withSuffix = (suffix: string) =>
    `${capAtWordBoundary(capped, MAX_SLUG_LENGTH - 1 - suffix.length)}-${suffix}`;

  if (episodeNumber !== null) {
    const numbered = withSuffix(`${episodeNumber}`);
    if (!existingSlugs.has(numbered)) return numbered;
  }

  let counter = 2;
  while (existingSlugs.has(withSuffix(`${counter}`))) counter += 1;
  return withSuffix(`${counter}`);
}
