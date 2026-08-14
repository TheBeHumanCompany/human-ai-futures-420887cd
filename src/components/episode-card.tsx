import { Link } from "@tanstack/react-router";

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
 * One card in the directory: artwork left, episode metadata right.
 *
 * **The row no longer plays audio.** It previously carried an inline
 * `EpisodePlayer`, and an earlier version of this file argued at length that the
 * player should never be removed to simplify the row. That decision was
 * deliberately overridden in Round 10 of the requirements interview, in favour
 * of the approved directory design: artwork with a play-styled overlay, and
 * playback happening on the episode page. Recording it here rather than deleting
 * the argument, so the reversal is visible to whoever reads this next.
 * `EpisodePlayer` itself is untouched and still used by the homepage and the
 * episode page.
 *
 * **The consequence, stated plainly: the triangle on the artwork is a link, not
 * a play button.** It looks like a transport control and it navigates. That is a
 * WCAG 4.1.2 hazard — the same standard the removed player argument was written
 * to defend — so the artwork link carries an explicit accessible name naming the
 * destination, the glyph is `aria-hidden`, and the visible "Listen to episode"
 * text affordance is retained rather than being replaced by the image alone.
 * Two links where one is an unlabelled image is precisely what to avoid here.
 *
 * **Keyed by `slug.current`, not `guid`.** `guid` left the list projection to
 * save payload, and `key={undefined}` is a console warning rather than a thrown
 * error — it would ship green. The directory's test asserts every rendered key
 * is defined and unique for exactly that reason.
 */
export function EpisodeCard({ episode }: EpisodeCardProps) {
  const slug = episode.slug.current;
  const image = episodeCardImage(episode);

  return (
    <li className="border-b border-hairline-dark py-8">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
        <Link
          to="/podcast/$slug"
          params={{ slug }}
          aria-label={`Open episode: ${episode.title}`}
          className="group relative block overflow-hidden bg-ink/5"
        >
          <img
            src={image}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span
            aria-hidden
            className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-full bg-ink/85 text-cream"
          >
            ▶
          </span>
        </Link>

        <div className="min-w-0">
          <span className="eyebrow inline-block bg-lime px-2.5 py-1 text-ink">
            Episode {episode.episodeNumber ?? "—"} · {formatDuration(episode.durationSeconds)}
          </span>

          <h3 className="display mt-4 text-2xl text-ink sm:text-3xl">
            <Link
              className="underline-offset-4 hover:underline"
              to="/podcast/$slug"
              params={{ slug }}
            >
              {episode.title}
            </Link>
          </h3>

          <p className="mt-2 text-sm text-ink/60">
            {episode.guestName ? `With ${episode.guestName} · ` : ""}
            {PUBLISHED.format(new Date(episode.publishedAt))}
          </p>

          {episode.excerpt && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{episode.excerpt}</p>
          )}

          <Link
            className="eyebrow link-underline mt-5 inline-block text-ink"
            to="/podcast/$slug"
            params={{ slug }}
          >
            Listen to episode <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

/**
 * The card's image source, exported so the directory's test can assert the
 * precedence chain without rendering.
 *
 * Precedence is `coverArtwork → shareCard → the branded default`. At the time of
 * writing exactly one of the thirty-nine episodes has cover artwork and none has
 * a generated share card, so the default is what almost every row resolves to.
 * Running `bun run podcast:share-cards` and uploading the output populates
 * `shareCard` and gives each row distinct artwork; a real photograph added to
 * `coverArtwork` later outranks the generated card automatically, with no code
 * change here.
 */
export function episodeCardImage(episode: EpisodeListItem): string {
  return shareImageUrl(episode);
}
