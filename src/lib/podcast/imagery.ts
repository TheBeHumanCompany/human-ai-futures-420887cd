import studioA from "@/assets/podcast.jpg";
import studioB from "@/assets/podcast-still-1.jpg";
import studioC from "@/assets/podcast-still-2.jpg";
import studioD from "@/assets/podcast-still-3.jpg";
import guestEp39 from "@/assets/guest-ep39-jill.png";
import guestEp38 from "@/assets/guest-ep38.png";
import guestEp37 from "@/assets/guest-ep37.png";
import guestEp36 from "@/assets/guest-ep36.png";
import guestEp35 from "@/assets/guest-ep35.png";
import guestEp34 from "@/assets/guest-ep34.png";
import guestEp33 from "@/assets/guest-ep33.png";
import guestEp32 from "@/assets/guest-ep32.png";
import guestEp31 from "@/assets/guest-ep31.png";
import guestEp30 from "@/assets/guest-ep30.png";
import guestEp29 from "@/assets/guest-ep29.png";
import guestEp28 from "@/assets/guest-ep28.png";
import guestEp27 from "@/assets/guest-ep27.png";
import guestEp26 from "@/assets/guest-ep26.png";
import guestEp25 from "@/assets/guest-ep25.png";
import guestEp24 from "@/assets/guest-ep24.png";
import guestEp23 from "@/assets/guest-ep23.png";
import guestEp22 from "@/assets/guest-ep22.png";
import guestEp21 from "@/assets/guest-ep21.png";
import guestEp20 from "@/assets/guest-ep20.png";
import guestEp19 from "@/assets/guest-ep19.png";
import guestEp18 from "@/assets/guest-ep18.png";
import guestEp17 from "@/assets/guest-ep17.webp";
import guestEp16 from "@/assets/guest-ep16.webp";
import guestEp15 from "@/assets/guest-ep15.png";
import guestEp14 from "@/assets/guest-ep14.png";
import guestEp13 from "@/assets/guest-ep13.png";
import guestEp12 from "@/assets/guest-ep12.png";
import guestEp11 from "@/assets/guest-ep11.png";
import guestEp10 from "@/assets/guest-ep10.png";
import guestEp9 from "@/assets/guest-ep9.png";
import guestEp8 from "@/assets/guest-ep8.webp";
import guestEp7 from "@/assets/guest-ep7.png";
import guestEp6 from "@/assets/guest-ep6.png";
import guestEp5 from "@/assets/guest-ep5.png";
import guestEp4 from "@/assets/guest-ep4.png";
import guestEp3 from "@/assets/guest-ep3.png";
import guestEp2 from "@/assets/guest-ep2.png";
import guestEp1 from "@/assets/guest-ep1.png";
import { imageUrl } from "@/lib/sanity/image";
import type { EpisodeListItem } from "./episode";

/**
 * Supplied guest portraits, keyed by episode number. These are real, already
 * edited photographs of the guest, so they outrank every other source.
 */
const GUEST_PORTRAITS: Record<number, string> = {
  39: guestEp39,
  38: guestEp38,
  37: guestEp37,
  36: guestEp36,
  35: guestEp35,
  34: guestEp34,
  33: guestEp33,
  32: guestEp32,
  31: guestEp31,
  30: guestEp30,
  29: guestEp29,
  28: guestEp28,
  27: guestEp27,
  26: guestEp26,
  25: guestEp25,
  24: guestEp24,
  23: guestEp23,
  22: guestEp22,
  21: guestEp21,
  20: guestEp20,
  19: guestEp19,
  18: guestEp18,
  17: guestEp17,
  16: guestEp16,
  15: guestEp15,
  14: guestEp14,
  13: guestEp13,
  12: guestEp12,
  11: guestEp11,
  10: guestEp10,
  9: guestEp9,
  8: guestEp8,
  7: guestEp7,
  6: guestEp6,
  5: guestEp5,
  4: guestEp4,
  3: guestEp3,
  2: guestEp2,
  1: guestEp1,
};

function suppliedPortrait(episode: Pick<EpisodeListItem, "episodeNumber">): string | null {
  return episode.episodeNumber !== null ? (GUEST_PORTRAITS[episode.episodeNumber] ?? null) : null;
}

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

/** Grid/card imagery: supplied portrait, artwork, share card, then a still. */
export function episodeImage(episode: EpisodeListItem, width = 1200): string {
  return (
    suppliedPortrait(episode) ??
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
  const supplied = suppliedPortrait(episode);
  if (supplied) return { src: supplied, isPortrait: true };

  const portrait = imageUrl(episode.guestPhoto, { width: 1400, height: 1700, fit: "crop" });
  if (portrait) return { src: portrait, isPortrait: true };

  const artwork = imageUrl(episode.coverArtwork, { width: 1400, height: 1700, fit: "crop" });
  if (artwork) return { src: artwork, isPortrait: false };

  return { src: studioStill(episode), isPortrait: false };
}
