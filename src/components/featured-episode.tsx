import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { episodeImage, publishedOn } from "@/components/episode-media-card";
import type { EpisodeListItem } from "@/lib/podcast/episode";
import { formatDuration } from "@/lib/podbean";

/**
 * The featured episode: flat, editorial, two columns on desktop.
 *
 * Deliberately not a rounded card — a hairline frame and a large photograph do
 * the work, so it reads as a magazine lead rather than a SaaS tile.
 */
export function FeaturedEpisode({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <article className="grid border border-hairline-dark lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Link
        to="/podcast/$slug"
        params={{ slug }}
        aria-label={`Listen to ${episode.title}`}
        className="group relative block aspect-[4/3] overflow-hidden bg-ink/10 lg:aspect-auto"
      >
        <img
          src={episodeImage(episode)}
          alt=""
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <span className="eyebrow absolute left-4 top-4 bg-ink px-3 py-2 text-cream">
          Featured episode
        </span>
        <span className="absolute bottom-6 left-6 flex size-14 items-center justify-center rounded-full border border-cream/80 text-cream transition-colors group-hover:bg-lime group-hover:text-ink">
          <Play className="size-5 translate-x-px" aria-hidden />
        </span>
      </Link>

      <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
        <p className="eyebrow text-ink/45">
          Episode {episode.episodeNumber ?? "—"} · {formatDuration(episode.durationSeconds)}
        </p>

        <h3 className="display mt-4 text-[clamp(1.9rem,3.2vw,2.9rem)] text-ink">
          <Link to="/podcast/$slug" params={{ slug }} className="hover:text-ink/70">
            {episode.title}
          </Link>
        </h3>

        <p className="eyebrow mt-4 text-ink/55">
          {episode.guestName ? `With ${episode.guestName} · ` : ""}
          {publishedOn(episode.publishedAt)}
        </p>

        {episode.excerpt && (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65">{episode.excerpt}</p>
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
