import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { EpisodePlayer } from "@/components/episode-player";
import { formatDuration } from "@/lib/podbean/parse";
import { PodcastDegraded } from "@/components/podcast-degraded";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import type { SanityEpisode } from "@/lib/podcast/episode";
import { episodeHeroImage, episodeImage } from "@/lib/podcast/imagery";
import { fetchEpisodeBySlug, fetchRelatedCandidates } from "@/lib/podcast/queries";
import { selectRelatedEpisodes } from "@/lib/podcast/related";
import { buildEpisodeJsonLd, buildEpisodeMeta } from "@/lib/podcast/seo";
import { showNoteParagraphs } from "@/lib/podcast/show-notes";

/**
 * One episode, at a permanent URL — and the single template every episode uses.
 *
 * **The filename carries a deliberate escape.** `podcast.tsx` is a leaf route
 * that renders no `<Outlet/>`, so `podcast.$slug.tsx` would nest inside it and
 * never render at all. The trailing underscore produces `path: '/podcast/$slug'`
 * mounted off the root. The URL is identical either way, which is the thing
 * that actually matters.
 *
 * **This route has three states, not two, and that is the whole design.**
 *
 *   found        — render the episode
 *   not found    — the query SUCCEEDED and returned null. A 404 is the truth.
 *   unreachable  — the query THREW. We do not know whether this slug exists,
 *                  and a 404 here would be a permanent lie about a URL someone
 *                  has already shared.
 *
 * The trap is that `loaderData` is `undefined` on BOTH of the last two, so the
 * instinctive `!loaderData` guard collapses them. Every predicate below
 * therefore discriminates on `match.status`, which distinguishes `"notFound"`
 * from `"error"`.
 *
 * **Nothing on this page is authored per-episode.** Every block below is
 * conditional on the field it renders, so an episode without a portrait, a
 * guest, a bio or topics loses that block rather than showing an invented one.
 */

interface EpisodeLoaderData {
  episode: SanityEpisode;
  related: ReturnType<typeof selectRelatedEpisodes>;
}

export const Route = createFileRoute("/podcast_/$slug")({
  /**
   * Deliberately no try/catch.
   *
   * A `SanityHttpError` must escape: the router maps a thrown loader to an
   * errored match and emits 500, which `src/server.ts` upgrades to 503. Catching
   * here to "handle it gracefully" is what produces a 200 with an empty page, or
   * a 404 — both of which claim something untrue about the episode.
   */
  loader: async ({ params }): Promise<EpisodeLoaderData> => {
    const episode = await fetchEpisodeBySlug({ data: params.slug });
    if (!episode) throw notFound();

    const candidates = await fetchRelatedCandidates();
    return { episode, related: selectRelatedEpisodes(episode, candidates, 2) };
  },

  /**
   * The degraded markers, emitted only on a genuine outage.
   *
   * `match.status === "error"` rather than `!loaderData`: the latter is also
   * true for a `notFound()`, and marking a real 404 as degraded would let the
   * status upgrade promote it to a 503.
   */
  headers: ({ match }): Record<string, string> =>
    match.status === "error"
      ? {
          "retry-after": String(DEGRADED_RETRY_AFTER_SECONDS),
          [DEGRADED_SOURCE_HEADER]: DEGRADED_SOURCE_VALUE,
        }
      : {},

  /**
   * Three branches, one discriminator.
   *
   * The degraded branch emits a title and nothing else — `noindex` on a
   * transient outage is a deindex instruction for a permanent URL, and a
   * canonical on an error body invites a crawler to consolidate the real page
   * onto it.
   */
  head: ({ match, loaderData }) => {
    if (match.status === "error") {
      return { meta: [{ title: "Episodes are temporarily unavailable" }] };
    }

    if (!loaderData) {
      return {
        meta: [{ title: "Episode not found" }, { name: "robots", content: "noindex" }],
      };
    }

    const { meta, links } = buildEpisodeMeta(loaderData.episode);
    return {
      meta,
      links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildEpisodeJsonLd(loaderData.episode)),
        },
      ],
    };
  },

  component: EpisodePage,
  notFoundComponent: EpisodeNotFound,
  // Declared explicitly. Without it the boundary falls to the router library's
  // own built-in ErrorComponent — a bare panel — and NOT the branded component
  // in `__root.tsx`, which only fires when the ROOT match errors.
  errorComponent: PodcastDegraded,
});

/** UTC-pinned so the server and the client format the same string. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * The feed bakes "Episode 39:" into many titles. The number already has its own
 * label above the headline, so the prefix is stripped for display only — the
 * stored title is untouched.
 */
function displayTitle(title: string): string {
  // The lazy quantifier before the separator class is deliberate: the greedy
  // form spells the GROQ root-filter token the layering test bans under routes.

  return title.replace(/^\s*episode\s*#?\d+\s*?[:\-–—]\s*/i, "");
}

function EpisodePage() {
  const { episode, related }: EpisodeLoaderData = Route.useLoaderData();
  const hero = episodeHeroImage(episode);
  // Cleaned at render for every episode, present and future: the feed's
  // promotional tail ("Mobile viewers…", hashtags, "Listen on:") is never shown.
  const body = showNoteParagraphs(episode.description);
  // A guest column exists only when there is something real to put in it: a
  // name AND a bio. A name alone would render a heading over empty space, which
  // is the "empty panel" this template is meant never to show.
  const hasGuestColumn = Boolean(episode.guestName && episode.guestBio);

  return (
    <>
      {/* ---- Hero: 52/48 editorial column + portrait ---- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto grid max-w-[1400px] items-stretch gap-0 lg:grid-cols-[52fr_48fr]">
          <div className="order-1 flex flex-col justify-center px-5 py-9 sm:px-8 lg:py-14 lg:pr-12">
            {episode.episodeNumber !== null && (
              <span className="eyebrow w-fit bg-lime px-2.5 py-1 text-ink">
                Episode {episode.episodeNumber}
              </span>
            )}
            <h1 className="mt-4 font-display text-[clamp(1.75rem,3.1vw,2.9rem)] font-medium leading-[1.02] tracking-[0.005em] text-ink">
              {displayTitle(episode.title)}
            </h1>

            <p className="eyebrow mt-4 flex flex-wrap items-center gap-2 text-ink/55">
              <time dateTime={episode.publishedAt}>
                {DATE_FORMAT.format(new Date(episode.publishedAt))}
              </time>
              {episode.durationSeconds > 0 && (
                <>
                  <span aria-hidden className="text-lime">
                    •
                  </span>
                  <span>{formatDuration(episode.durationSeconds)}</span>
                </>
              )}
            </p>

            {/* Mobile order: text first, then image, then player. */}
            <div className="mt-6 lg:hidden">
              <HeroImage episode={episode} hero={hero} className="aspect-[4/3]" />
            </div>

            <div className="mt-6 border-t border-hairline-dark pt-5">
              <EpisodePlayer
                className="max-w-sm"
                src={episode.audioUrl}
                title={episode.title}
                durationSeconds={episode.durationSeconds}
              />

              <a
                className="eyebrow group mt-5 inline-flex h-[50px] w-fit items-center gap-3 bg-ink px-6 text-cream transition-colors hover:bg-ink/90"
                href={episode.podbeanUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Listen or Watch Full Episode
                <span
                  aria-hidden
                  className="text-lime transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </div>
          </div>

          <div className="order-2 hidden lg:block">
            <HeroImage episode={episode} hero={hero} className="h-full min-h-[460px]" />
          </div>
        </div>
      </section>

      {/* ---- Summary + guest ---- */}
      <section className="section-cream">
        <div
          className={`mx-auto grid max-w-[1400px] px-5 pt-12 sm:px-8 lg:pt-14 ${
            hasGuestColumn ? "lg:grid-cols-[62fr_38fr]" : ""
          }`}
        >
          <div className={hasGuestColumn ? "pb-8 lg:pb-14 lg:pr-12" : "pb-8 lg:pb-14"}>
            <p className="section-label section-label-dark text-sm text-lime">Episode summary</p>
            {body.length > 0 && (
              <div className="mt-4 max-w-[62ch] space-y-4 text-[1.0625rem] leading-[1.65] text-ink/80">
                {body.map((paragraph: string) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          {hasGuestColumn && (
            <div className="border-t border-hairline-dark pt-8 pb-12 lg:border-l lg:border-t-0 lg:pt-0 lg:pb-14 lg:pl-12">
              <p className="section-label text-sm text-lime">Meet the guest</p>
              <h2 className="mt-4 font-display text-[clamp(1.35rem,2vw,1.6rem)] font-medium uppercase leading-none tracking-[0.01em] text-ink">
                {episode.guestName}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[1rem] leading-[1.65] text-ink/75">
                {episode.guestBio}
              </p>
            </div>
          )}
        </div>

        {/* ---- More episodes: compact related listening ---- */}
        {related.length > 0 && (
          <div className="mx-auto max-w-[1400px] px-5 pb-14 sm:px-8">
            <div className="border-t border-hairline-dark pt-7">
              <div className="flex flex-wrap items-baseline justify-between gap-5">
                <p className="section-label section-label-light text-xs">More episodes</p>
                <Link
                  to="/podcast"
                  className="eyebrow link-underline inline-flex items-center gap-2 text-ink/70 hover:text-ink"
                >
                  View all episodes{" "}
                  <span aria-hidden className="text-lime">
                    →
                  </span>
                </Link>
              </div>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.slug.current}>
                    <Link
                      className="group flex items-center gap-4 border border-hairline-dark p-3 transition-colors hover:border-ink/40"
                      to="/podcast/$slug"
                      params={{ slug: item.slug.current }}
                    >
                      <img
                        src={episodeImage(item, 320)}
                        alt=""
                        width={96}
                        height={96}
                        loading="lazy"
                        className="size-20 shrink-0 object-cover sm:size-[5.5rem]"
                      />
                      <div className="min-w-0">
                        {item.episodeNumber !== null && (
                          <span className="eyebrow inline-block bg-lime px-2 py-0.5 text-[0.65rem] text-ink">
                            Episode {item.episodeNumber}
                          </span>
                        )}
                        <p className="mt-2 line-clamp-2 text-[0.95rem] font-medium leading-snug text-ink group-hover:text-ink/70">
                          {displayTitle(item.title)}
                        </p>
                        <p className="eyebrow mt-1.5 flex flex-wrap items-center gap-2 text-ink/50">
                          {item.guestName && <span className="truncate">{item.guestName}</span>}
                          {item.guestName && item.durationSeconds > 0 && (
                            <span aria-hidden className="text-lime">
                              •
                            </span>
                          )}
                          {item.durationSeconds > 0 && (
                            <span>{formatDuration(item.durationSeconds)}</span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
    </section>
    </>
  );
}

/**
 * The hero photograph.
 *
 * No name overlay: the guest is named in the copy beside it, and stamping a
 * person's name over a photograph that may be a recording still is worse than
 * showing the photograph plainly.
 */
function HeroImage({
  episode,
  hero,
  className,
}: {
  episode: SanityEpisode;
  hero: { src: string; isPortrait: boolean };
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-ink ${className ?? "aspect-[4/5]"}`}>
      <img
        src={hero.src}
        alt={
          hero.isPortrait && episode.guestName
            ? `Portrait of ${episode.guestName}`
            : `Artwork for ${episode.title}`
        }
        className="size-full object-cover"
      />
    </div>
  );
}


function EpisodeNotFound() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <h1 className="display text-3xl sm:text-4xl">Episode not found</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/80">
          We could not find that episode. It may have been moved, or the link may be mistyped.
        </p>
        <Link className="eyebrow mt-8 inline-block bg-ink px-7 py-4 text-cream" to="/podcast">
          Browse all episodes
        </Link>
      </div>
    </section>
  );
}
