import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import {
  displayTitle,
  episodeImage,
  episodeMeta,
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
    <article className="grid border border-hairline-dark lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        aria-label={`Listen to ${displayTitle(episode.title)}`}
        className="group relative block aspect-[4/5] overflow-hidden bg-ink/10 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[26rem]"
      >
        <img
          src={episodeImage(episode)}
          alt=""
          className="size-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <span className="eyebrow absolute left-4 top-4 bg-ink px-3 py-2 text-lime">
          Featured episode
        </span>
        <span className="absolute bottom-5 left-5 flex size-12 items-center justify-center rounded-full border border-cream/80 text-cream transition-colors group-hover:bg-lime group-hover:text-ink">
          <Play className="size-4 translate-x-px" aria-hidden />
        </span>
      </Link>

      <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <p className="eyebrow text-lime-ink">{episodeMeta(episode)}</p>

        <h3 className="display mt-4 max-w-[20ch] text-[clamp(1.6rem,2.4vw,2.2rem)] leading-[1.08] text-ink">
          <Link to="/podcast/$slug" params={{ slug }} className="hover:text-ink/70">
            {displayTitle(episode.title)}
          </Link>
        </h3>

        <p className="mt-4 text-sm text-ink/60">
          {episode.guestName ? `With ${episode.guestName} · ` : ""}
          {publishedOn(episode.publishedAt)}
        </p>

        {episode.excerpt && (
          <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-ink/65">
            {episode.excerpt}
          </p>
        )}

        <Link
          to="/podcast/$slug"
          params={{ slug }}
          className="eyebrow mt-8 inline-flex items-center gap-3 text-ink"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-ink text-cream">
            <Play className="size-3.5 translate-x-px" aria-hidden />
          </span>
          Listen to episode <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
