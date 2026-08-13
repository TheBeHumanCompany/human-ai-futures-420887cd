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

/** "EPISODE 39" — the highlighted portion of the metadata line. */
export function episodeNumber(episode: EpisodeListItem): string {
  return episode.episodeNumber !== null ? `Episode ${episode.episodeNumber}` : "Episode";
}

/** "45 MIN" — the neutral duration portion of the metadata line. */
export function episodeDuration(episode: EpisodeListItem): string {
  return formatDuration(episode.durationSeconds);
}

/** "EPISODE 39 · 45 MIN" — the one metadata line shared by every card. */
export function episodeMeta(episode: EpisodeListItem): string {
  return `${episodeNumber(episode)} · ${episodeDuration(episode)}`;
}

/** Episode number, rendered inside the shared lime metadata stamp. */
export function EpisodeNumberTag({ episode }: { episode: EpisodeListItem }) {
  return <span>{episodeNumber(episode)}</span>;
}

/** "EPISODE 39 · 46 MIN" as one small lime editorial stamp. */
export function EpisodeMetaStamp({ episode }: { episode: EpisodeListItem }) {
  return (
    <p className="inline-flex items-center gap-1.5 bg-lime px-2 py-1 text-[0.7rem] font-semibold uppercase leading-none tracking-[0.14em] text-ink">
      <EpisodeNumberTag episode={episode} />
      <span aria-hidden>·</span>
      <span>{episodeDuration(episode)}</span>
    </p>
  );
}

/**
 * One episode in the grid: a single bordered horizontal card.
 *
 * The whole card is a `<Link>` — there is no audio player inside it, so there
 * is no nested interactive content to guard against. Playback lives on the
 * episode page.
 */
export function EpisodeMediaCard({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <li className="group h-full">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        className="flex h-full min-h-[10rem] overflow-hidden rounded-md border border-hairline-dark bg-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="relative w-[38%] shrink-0 overflow-hidden bg-ink/10">
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

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <EpisodeNumberTag episode={episode} />
            <span aria-hidden>·</span>
            <span className="eyebrow font-semibold tracking-[0.12em]">{episodeDuration(episode)}</span>
          </p>
          <h3 className="display-strong mt-3 text-[1.2rem] leading-[1.18] text-ink">
            {displayTitle(episode.title)}
          </h3>
          {episode.guestName && (
            <p className="mt-2 text-sm font-medium text-ink">With {episode.guestName}</p>
          )}
          <p className="mt-1.5 text-sm text-ink/80">{publishedOn(episode.publishedAt)}</p>
          <span className="eyebrow mt-auto inline-flex items-center gap-2 pt-4 font-semibold tracking-[0.24em] text-ink">
            Listen <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
