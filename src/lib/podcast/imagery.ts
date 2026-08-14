import studioA from "@/assets/podcast.jpg";
import studioB from "@/assets/podcast-still-1.jpg";
import studioC from "@/assets/podcast-still-2.jpg";
import studioD from "@/assets/podcast-still-3.jpg";
import guestEp39 from "@/assets/guest-ep39.png.asset.json";
import guestEp38 from "@/assets/guest-ep38.png.asset.json";
import guestEp37 from "@/assets/guest-ep37.png.asset.json";
import guestEp36 from "@/assets/guest-ep36.png.asset.json";
import guestEp35 from "@/assets/guest-ep35.png.asset.json";
import guestEp34 from "@/assets/guest-ep34.png.asset.json";
import guestEp33 from "@/assets/guest-ep33.png.asset.json";
import guestEp32 from "@/assets/guest-ep32.png.asset.json";
import guestEp31 from "@/assets/guest-ep31.png.asset.json";
import guestEp30 from "@/assets/guest-ep30.png.asset.json";
import guestEp29 from "@/assets/guest-ep29.png.asset.json";
import guestEp28 from "@/assets/guest-ep28.png.asset.json";
import guestEp27 from "@/assets/guest-ep27.png.asset.json";
import guestEp26 from "@/assets/guest-ep26.png.asset.json";
import guestEp25 from "@/assets/guest-ep25.png.asset.json";
import guestEp24 from "@/assets/guest-ep24.png.asset.json";
import guestEp23 from "@/assets/guest-ep23.png.asset.json";
import guestEp22 from "@/assets/guest-ep22.png.asset.json";
import guestEp21 from "@/assets/guest-ep21.png.asset.json";
import guestEp20 from "@/assets/guest-ep20.png.asset.json";
import guestEp19 from "@/assets/guest-ep19.png.asset.json";
import guestEp18 from "@/assets/guest-ep18.png.asset.json";
import guestEp17 from "@/assets/guest-ep17.webp.asset.json";
import guestEp16 from "@/assets/guest-ep16.webp.asset.json";
import guestEp15 from "@/assets/guest-ep15.png.asset.json";
import guestEp14 from "@/assets/guest-ep14.png.asset.json";
import guestEp13 from "@/assets/guest-ep13.png.asset.json";
import guestEp12 from "@/assets/guest-ep12.png.asset.json";
import guestEp11 from "@/assets/guest-ep11.png.asset.json";
import guestEp10 from "@/assets/guest-ep10.png.asset.json";
import guestEp9 from "@/assets/guest-ep9.png.asset.json";
import guestEp8 from "@/assets/guest-ep8.webp.asset.json";
import guestEp7 from "@/assets/guest-ep7.png.asset.json";
import guestEp6 from "@/assets/guest-ep6.png.asset.json";
import guestEp5 from "@/assets/guest-ep5.png.asset.json";
import guestEp4 from "@/assets/guest-ep4.png.asset.json";
import guestEp3 from "@/assets/guest-ep3.png.asset.json";
import guestEp2 from "@/assets/guest-ep2.png.asset.json";
import guestEp1 from "@/assets/guest-ep1.png.asset.json";
import { imageUrl } from "@/lib/sanity/image";
import type { EpisodeListItem } from "./episode";

/**
 * Supplied guest portraits, keyed by episode number. These are real, already
 * edited photographs of the guest, so they outrank every other source.
 */
const GUEST_PORTRAITS: Record<number, string> = {
  39: guestEp39.url,
  38: guestEp38.url,
  37: guestEp37.url,
  36: guestEp36.url,
  35: guestEp35.url,
  34: guestEp34.url,
  33: guestEp33.url,
  32: guestEp32.url,
  31: guestEp31.url,
  30: guestEp30.url,
  29: guestEp29.url,
  28: guestEp28.url,
  27: guestEp27.url,
  26: guestEp26.url,
  25: guestEp25.url,
  24: guestEp24.url,
  23: guestEp23.url,
  22: guestEp22.url,
  21: guestEp21.url,
  20: guestEp20.url,
  19: guestEp19.url,
  18: guestEp18.url,
  17: guestEp17.url,
  16: guestEp16.url,
  15: guestEp15.url,
  14: guestEp14.url,
  13: guestEp13.url,
  12: guestEp12.url,
  11: guestEp11.url,
  10: guestEp10.url,
  9: guestEp9.url,
  8: guestEp8.url,
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
