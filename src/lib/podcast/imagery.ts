import studioA from "@/assets/podcast.jpg";
import studioB from "@/assets/podcast-still-1.jpg";
import studioC from "@/assets/podcast-still-2.jpg";
import studioD from "@/assets/podcast-still-3.jpg";
import { imageUrl } from "@/lib/sanity/image";
import type { EpisodeListItem } from "./episode";

/**
 * Which photograph an episode surface shows, decided in one place.
 *
 * Two rules govern this module and neither is cosmetic:
 *
 * - **No portrait is ever invented.** A guest photo is used only when the
 *   episode actually carries one. When it does not, the fallback is
 *   recording-room photography of no one in particular — never a generated
 *   face attached to a real person's name.
 * - **The choice is deterministic.** The still is picked by episode number
 *   rather than at random, so the server and the browser agree; a random pick
 *   would swap the image on hydration.
 */

const STUDIO_STILLS = [studioA, studioB, studioC, studioD];

/** Stable per-episode still, used whenever no real imagery exists. */
export function studioStill(episode: Pick<EpisodeListItem, "episodeNumber">): string {
  return STUDIO_STILLS[Math.abs(episode.episodeNumber ?? 0) % STUDIO_STILLS.length]!;
}

/**
 * `shareCard` is in the list projection but not in the rendered interface, so
 * it is read structurally rather than by widening the shared type.
 */
function shareCardRef(episode: EpisodeListItem): string | null {
  return (episode as { shareCard?: string | null }).shareCard ?? null;
}

/** Grid/card imagery: episode artwork, then its share card, then a still. */
export function episodeImage(episode: EpisodeListItem, width = 1200): string {
  return (
    imageUrl(episode.coverArtwork, { width, fit: "crop" }) ??
    imageUrl(shareCardRef(episode), { width, fit: "crop" }) ??
    studioStill(episode)
  );
}

/**
 * Hero imagery for one episode page, in the order the design asks for:
 * the real guest portrait, then episode artwork, then a recording still.
 *
 * The flag travels with the URL because the page treats the two differently —
 * only a real portrait earns the GUEST label overlay, and only a portrait is
 * described to a screen reader as a person.
 */
export function episodeHeroImage(episode: EpisodeListItem): {
  src: string;
  isPortrait: boolean;
} {
  const portrait = imageUrl(episode.guestPhoto, { width: 1400, height: 1700, fit: "crop" });
  if (portrait) return { src: portrait, isPortrait: true };

  const artwork = imageUrl(episode.coverArtwork, { width: 1400, height: 1700, fit: "crop" });
  if (artwork) return { src: artwork, isPortrait: false };

  return { src: studioStill(episode), isPortrait: false };
}
