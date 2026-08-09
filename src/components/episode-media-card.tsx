import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import studioA from "@/assets/podcast.jpg";
import studioB from "@/assets/podcast-still-1.jpg";
import studioC from "@/assets/podcast-still-2.jpg";
import studioD from "@/assets/podcast-still-3.jpg";
import type { EpisodeListItem } from "@/lib/podcast/episode";
import { imageUrl } from "@/lib/sanity/image";
import { formatDuration } from "@/lib/podbean";

const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Studio stills used when an episode has no artwork of its own.
 *
 * Rotated deterministically by episode number rather than at random: the same
 * episode must show the same still on the server and in the browser, or the
 * grid flickers on hydration.
 */
const STUDIO_STILLS = [studioA, studioB, studioC, studioD];

/**
 * Card imagery, in precedence order: an episode's own cover artwork, then its
 * generated share card, then a studio still.
 *
 * The still is deliberate rather than a placeholder — it is recording-room
 * photography, and no guest portrait is invented for an episode without one.
 */
export function episodeImage(episode: EpisodeListItem, width = 1200): string {
  // `shareCard` is in the list projection but not in the rendered interface, so
  // it is read structurally rather than by widening the shared type.
  const shareCard = (episode as { shareCard?: string | null }).shareCard ?? null;
  const still = STUDIO_STILLS[Math.abs(episode.episodeNumber ?? 0) % STUDIO_STILLS.length]!;
  return (
    imageUrl(episode.coverArtwork, { width, fit: "crop" }) ??
    imageUrl(shareCard, { width, fit: "crop" }) ??
    still
  );
}




export function publishedOn(iso: string): string {
  return PUBLISHED.format(new Date(iso));
}

/**
 * One image-forward card in the episode grid.
 *
 * The whole card is a `<Link>` — there is no audio player inside it any more,
 * so there is no nested interactive content to guard against. Playback lives on
 * the episode page.
 */
export function EpisodeMediaCard({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <li className="group">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink/10">
          <img
            src={episodeImage(episode)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-full border border-cream/70 bg-ink/40 text-cream backdrop-blur-sm transition-colors group-hover:bg-lime group-hover:text-ink">
            <Play className="size-4 translate-x-px" aria-hidden />
          </span>
        </div>

        <div className="flex flex-1 flex-col pt-5">
          <p className="eyebrow text-ink/45">
            Episode {episode.episodeNumber ?? "—"} · {formatDuration(episode.durationSeconds)}
          </p>
          <h3 className="display mt-3 text-[1.6rem] leading-[1.02] text-ink">{episode.title}</h3>
          <p className="mt-3 text-sm text-ink/60">
            {episode.guestName ? `With ${episode.guestName}` : "The People-Driven CEO"}
          </p>
          <p className="mt-1 text-sm text-ink/45">{publishedOn(episode.publishedAt)}</p>
          <span className="eyebrow mt-5 inline-flex items-center gap-2 text-ink">
            Listen <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
