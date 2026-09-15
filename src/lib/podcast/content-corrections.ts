import type { SanityEpisode } from "./episode";

/**
 * Per-episode content corrections.
 *
 * These fixes apply only to the render layer. They do not rewrite the upstream
 * CMS; instead they guarantee that a specific episode page shows accurate
 * names and company details even when the feed data still carries an old typo.
 *
 * Every correction is keyed by slug so it cannot leak onto other episodes.
 */

const MINT_CLEANING_SLUG = "minting-success-story-plant-based-cleaning-revolutionaries";

/**
 * Corrects known copy issues on the Mint Cleaning episode page.
 *
 * Current fixes:
 *   - "Monica and Robin" -> "Monika Scott and Robyn Hodas"
 *   - "Monica" -> "Monika Scott"
 *   - "Robin" -> "Robyn Hodas"
 *   - "Minta" -> "Mint Cleaning"
 */
function correctMintCleaning(text: string): string {
  return (
    text
      // Full names first, so the standalone replacements below do not double-patch.
      .replace(/Monica and Robin/g, "Monika Scott and Robyn Hodas")
      .replace(/Monica & Robin/g, "Monika Scott & Robyn Hodas")
      .replace(/Monica, and Robin/g, "Monika Scott, and Robyn Hodas")
      .replace(/Monica, Robin/g, "Monika Scott, Robyn Hodas")
      // Standalone first names (case-insensitive, preserve case).
      .replace(/\bMonica\b/g, "Monika Scott")
      .replace(/\bRobin\b/g, "Robyn Hodas")
      // Company name — "Minting" is a pun in the title and must stay as-is.
      .replace(/\bMinta\b/g, "Mint Cleaning")
  );
}

/**
 * Returns a copy of the episode with corrected description/excerpt when the
 * slug matches a known correction set.
 *
 * The original episode object is never mutated.
 */
export function withContentCorrections(episode: SanityEpisode): SanityEpisode {
  if (episode.slug.current !== MINT_CLEANING_SLUG) return episode;

  return {
    ...episode,
    description: correctMintCleaning(episode.description),
    excerpt: correctMintCleaning(episode.excerpt),
  };
}
