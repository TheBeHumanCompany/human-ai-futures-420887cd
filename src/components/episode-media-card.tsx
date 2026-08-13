import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import type { EpisodeListItem } from "@/lib/podcast/episode";
import { episodeImage } from "@/lib/podcast/imagery";
import { formatDuration } from "@/lib/podbean";

export { episodeImage };

const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function publishedOn(iso: string): string {
  return PUBLISHED.format(new Date(iso));
}

/**
 * The feed bakes "Episode 39:" into many titles. The number has its own lime
 * metadata line above the headline on every surface, so the prefix is stripped
 * for display only — the stored title is untouched.
 */
export function displayTitle(title: string): string {
  return title.replace(/^\s*episode\s*#?\d+\s*[:\-–—]\s*/i, "");
}

/** "EPISODE 39 · 45 MIN" — the one metadata line shared by every card. */
export function episodeMeta(episode: EpisodeListItem): string {
  const number = episode.episodeNumber !== null ? `Episode ${episode.episodeNumber}` : "Episode";
  return `${number} · ${formatDuration(episode.durationSeconds)}`;
}

/**
 * One episode in the grid: portrait left, text right, compact enough to scan.
 *
 * The whole card is a `<Link>` — there is no audio player inside it, so there
 * is no nested interactive content to guard against. Playback lives on the
 * episode page.
 */
export function EpisodeMediaCard({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <li className="group">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        className="flex h-full gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="relative aspect-[3/4] w-[38%] shrink-0 overflow-hidden bg-ink/10">
          <img
            src={episodeImage(episode, 600)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span className="absolute bottom-3 left-3 flex size-8 items-center justify-center rounded-full border border-cream/70 bg-ink/40 text-cream backdrop-blur-sm transition-colors group-hover:bg-lime group-hover:text-ink">
            <Play className="size-3 translate-x-px" aria-hidden />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="eyebrow font-semibold tracking-[0.15em] text-lime">{episodeMeta(episode)}</p>
          <h3 className="display mt-3 text-[1.25rem] leading-[1.18] text-ink">
            {displayTitle(episode.title)}
          </h3>
          {episode.guestName && (
            <p className="mt-3 text-sm text-ink/65">With {episode.guestName}</p>
          )}
          <p className="mt-2 text-sm text-ink/50">{publishedOn(episode.publishedAt)}</p>
          <span className="eyebrow mt-auto pt-6 inline-flex items-center gap-2 text-ink">
            Listen <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
