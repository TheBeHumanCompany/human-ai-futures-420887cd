import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import {
  displayTitle,
  episodeDuration,
  episodeImage,
  EpisodeNumberTag,
  publishedOn,
} from "@/components/episode-media-card";
import type { EpisodeListItem } from "@/lib/podcast/episode";

/**
 * The featured episode: flat, editorial, two columns on desktop.
 *
 * Deliberately not a rounded card — a hairline frame and a large portrait do
 * the work, so it reads as a magazine lead rather than a SaaS tile. The image
 * takes roughly 38% of the width so the episode information leads.
 */
export function FeaturedEpisode({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <article className="grid border border-hairline-dark lg:grid-cols-[minmax(0,36fr)_minmax(0,64fr)]">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        aria-label={`Listen to ${displayTitle(episode.title)}`}
        className="group relative block aspect-[4/5] overflow-hidden bg-ink/10 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[19rem]"
      >
        <img
          src={episodeImage(episode)}
          alt=""
          className="size-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 bg-lime px-2.5 py-1.5 text-[0.7rem] font-semibold uppercase leading-none tracking-[0.14em] text-ink">
          Latest episode
        </span>
        <span className="absolute bottom-5 left-5 flex size-12 items-center justify-center rounded-full border border-cream/80 text-cream transition-colors group-hover:bg-lime group-hover:text-ink">
          <Play className="size-4 translate-x-px" aria-hidden />
        </span>
      </Link>

      <div className="flex flex-col justify-center px-6 py-7 sm:px-10 lg:px-12 lg:py-8">
        <p className="inline-flex w-fit items-center gap-1.5 bg-lime px-2 py-1 text-[0.7rem] font-semibold uppercase leading-none tracking-[0.14em] text-ink">
          <EpisodeNumberTag episode={episode} />
          <span aria-hidden>·</span>
          <span>{episodeDuration(episode)}</span>
        </p>

        <h3 className="display mt-4 max-w-[26ch] text-[clamp(1.3rem,1.8vw,1.7rem)] font-semibold leading-[1.16] text-ink">
          <Link to="/podcast/$slug" params={{ slug }} className="hover:text-ink/70">
            {displayTitle(episode.title)}
          </Link>
        </h3>

        <p className="mt-4 text-sm font-medium text-ink">
          {episode.guestName ? `With ${episode.guestName} · ` : ""}
          {publishedOn(episode.publishedAt)}
        </p>

        {episode.excerpt && (
          <p className="mt-3 line-clamp-2 max-w-xl text-base leading-relaxed text-ink/80">
            {episode.excerpt}
          </p>
        )}

        <Link
          to="/podcast/$slug"
          params={{ slug }}
          className="eyebrow mt-6 inline-flex w-fit items-center gap-3 font-semibold tracking-[0.24em] text-ink"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-ink text-cream">
            <Play className="size-3.5 translate-x-px" aria-hidden />
          </span>
          Listen to episode <span aria-hidden className="text-lime-dark">→</span>
        </Link>
      </div>
    </article>
  );
}
