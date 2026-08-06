import { Link } from "@tanstack/react-router";

import { EpisodePlayer } from "@/components/episode-player";
import type { EpisodeListItem } from "@/lib/podcast/episode";
import { shareImageUrl } from "@/lib/podcast/seo";
import { formatDuration } from "@/lib/podbean";

const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

interface EpisodeCardProps {
  episode: EpisodeListItem;
}

/**
 * One row in the directory.
 *
 * **The title is the link, not the row.** Wrapping the whole row in a `<Link>`
 * would put the audio player inside an anchor — nested interactive content, a
 * real HTML content-model and WCAG 4.1.2 defect, not a style preference. A
 * full-card overlay has the same problem the moment it is large enough to be
 * useful, because it would sit over the player. So the title anchors the
 * navigation, the player stays a sibling, and an explicit affordance in the
 * footer gives a second, larger target to the same destination.
 *
 * The player is retained rather than removed. Deleting shipped capability to
 * simplify a diff is not a trade this codebase makes, and the row has worked
 * this way since before the episode pages existed.
 *
 * **Keyed by `slug.current`, not `guid`.** `guid` left the list projection to
 * save payload, and a `key={undefined}` is a React console warning rather than
 * a thrown error — it would ship green. The directory's test asserts every
 * rendered key is defined and unique for exactly that reason.
 */
export function EpisodeCard({ episode }: EpisodeCardProps) {
  const slug = episode.slug.current;

  return (
    <li className="border-b border-hairline-dark py-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-8">
        <span className="eyebrow text-ink/40">{episode.episodeNumber ?? "—"}</span>

        <div className="min-w-0">
          <h3 className="display text-2xl text-ink sm:text-3xl">
            <Link
              className="underline-offset-4 hover:underline"
              to="/podcast/$slug"
              params={{ slug }}
            >
              {episode.title}
            </Link>
          </h3>

          <p className="mt-1 text-sm text-ink/60">
            {episode.guestName ? `With ${episode.guestName} · ` : ""}
            {PUBLISHED.format(new Date(episode.publishedAt))}
          </p>

          {episode.excerpt && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{episode.excerpt}</p>
          )}
        </div>

        <span className="eyebrow text-ink/50">{formatDuration(episode.durationSeconds)}</span>
      </div>

      <EpisodePlayer
        src={episode.audioUrl}
        title={episode.title}
        durationSeconds={episode.durationSeconds}
        tone="cream"
        className="mt-4 max-w-xl"
      />

      <Link
        className="eyebrow link-underline mt-4 inline-block text-ink"
        to="/podcast/$slug"
        params={{ slug }}
      >
        View episode →
      </Link>
    </li>
  );
}

/**
 * The card's image source, exported so the directory's test can assert the
 * precedence chain without rendering.
 *
 * Every episode resolves to the branded placeholder today: cover artwork is
 * unset on all thirty-nine and generated cards are not uploaded. That is the
 * live path rather than a fallback, which is why it has to look deliberate.
 */
export function episodeCardImage(episode: EpisodeListItem): string {
  return shareImageUrl(episode);
}
