import { Link } from "@tanstack/react-router";

import { episodeCardImage } from "@/components/episode-card";
import type { EpisodeListItem } from "@/lib/podcast/episode";
import { formatDuration } from "@/lib/podbean";

const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  // Pinned for the same reason as everywhere else that prints a date here:
  // unpinned, the server resolves UTC and the browser resolves the visitor's
  // zone, so an episode published just after midnight UTC renders a different
  // day on each side and trips a hydration mismatch.
  timeZone: "UTC",
});

/**
 * The latest episode, given its own block above the directory.
 *
 * Same navigation model as `EpisodeCard`: the artwork is a link with an explicit
 * accessible name, the play glyph is decorative, and a visible text affordance
 * points at the same destination. Nothing here plays audio — playback lives on
 * the episode page.
 */
export function FeaturedEpisode({ episode }: { episode: EpisodeListItem }) {
  const slug = episode.slug.current;

  return (
    <article className="border border-hairline-dark">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,32rem)_1fr]">
        <Link
          to="/podcast/$slug"
          params={{ slug }}
          aria-label={`Open the latest episode: ${episode.title}`}
          className="group relative block overflow-hidden bg-ink/5"
        >
          <img
            src={episodeCardImage(episode)}
            alt=""
            className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="eyebrow absolute left-4 top-4 bg-lime px-2.5 py-1 text-ink">
            Latest episode
          </span>
          <span
            aria-hidden
            className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-ink/85 text-cream"
          >
            ▶
          </span>
        </Link>

        <div className="min-w-0 p-8 lg:p-12">
          <span className="eyebrow inline-block bg-lime px-2.5 py-1 text-ink">
            Episode {episode.episodeNumber ?? "—"} · {formatDuration(episode.durationSeconds)}
          </span>

          <h3 className="display mt-6 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-ink">
            <Link
              className="underline-offset-4 hover:underline"
              to="/podcast/$slug"
              params={{ slug }}
            >
              {episode.title}
            </Link>
          </h3>

          <p className="mt-4 text-sm text-ink/60">
            {episode.guestName ? `With ${episode.guestName} · ` : ""}
            {PUBLISHED.format(new Date(episode.publishedAt))}
          </p>

          {episode.excerpt && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/70">{episode.excerpt}</p>
          )}

          <Link
            to="/podcast/$slug"
            params={{ slug }}
            className="eyebrow mt-8 inline-flex items-center gap-3 text-ink"
          >
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream"
            >
              ▶
            </span>
            Listen to episode <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
