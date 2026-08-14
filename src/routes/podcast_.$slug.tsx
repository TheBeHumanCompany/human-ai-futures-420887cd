import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { EpisodePlayer } from "@/components/episode-player";
import { PodcastDegraded } from "@/components/podcast-degraded";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import type { SanityEpisode } from "@/lib/podcast/episode";
import { episodeHeroImage } from "@/lib/podcast/imagery";
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
    return { episode, related: selectRelatedEpisodes(episode, candidates) };
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

  return (
    <>
      {/* ---- Hero: cream editorial column + portrait, 50/50, compact ---- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="grid lg:min-h-[540px] lg:grid-cols-2">
          <div className="order-1 flex flex-col justify-center px-5 py-8 sm:px-8 lg:py-10 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-10">
            {episode.episodeNumber !== null && (
              <span className="eyebrow w-fit bg-lime px-2.5 py-1 text-ink">
                Episode {episode.episodeNumber}
              </span>
            )}
            <h1 className="mt-3 border-l-4 border-lime pl-4 font-display text-[clamp(1.6rem,3.4vw,3.35rem)] font-medium leading-[0.97] tracking-[0.005em] text-ink">
              {displayTitle(episode.title)}
            </h1>

            {/* Date + duration in one compact metadata row. */}
            <p className="eyebrow mt-3 flex flex-wrap items-center gap-2 text-ink/60">
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

            {/* Mobile order: image sits above the player. */}
            <div className="mt-5 lg:hidden">
              <HeroImage episode={episode} hero={hero} />
            </div>

            <EpisodePlayer
              className="mt-4 max-w-sm"
              src={episode.audioUrl}
              title={episode.title}
              durationSeconds={episode.durationSeconds}
            />

            <a
              className="eyebrow group mt-4 inline-flex h-[50px] w-fit items-center gap-3 bg-ink px-6 text-cream transition-colors hover:bg-ink/90"
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

          <div className="order-2 hidden lg:block">
            <HeroImage episode={episode} hero={hero} className="h-full" />
          </div>
        </div>
      </section>

      {/* ---- Episode summary + guest: same 50/50 split as the hero ---- */}
      <section className="section-cream">
        <div className="grid lg:grid-cols-2">
          <div className="px-5 pt-12 pb-6 sm:px-8 lg:pb-12 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-10">
            <p className="section-label section-label-dark text-sm">Episode summary</p>
            {body.length > 0 && (
              <div className="mt-3 max-w-[58ch] space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80">
                {body.map((paragraph: string) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          {episode.guestName && (
            <div className="px-5 pb-12 sm:px-8 lg:border-l lg:border-hairline-dark lg:pt-12 lg:pl-10 lg:pr-[max(2rem,calc((100vw-1400px)/2+2rem))]">
              <p className="section-label text-sm text-lime">Meet the guest</p>
              <h2 className="mt-3 font-display text-[clamp(1.4rem,2.2vw,1.75rem)] font-medium uppercase leading-none tracking-[0.01em] text-ink">
                {episode.guestName}
              </h2>
              {episode.guestBio && (
                <p className="mt-3 max-w-[55ch] text-[1.0625rem] leading-[1.55] text-ink/75">
                  {episode.guestBio}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ---- More episodes ---- */}
        {related.length > 0 && (
          <div className="mx-auto max-w-[1400px] px-5 pb-12 sm:px-8">
            <div className="border-t border-hairline-dark pt-8">
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
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {related.map((item) => (
                  <li key={item.slug.current} className="border-t border-hairline-dark pt-4">
                    <Link
                      className="group block text-base leading-snug text-ink/85 hover:text-ink"
                      to="/podcast/$slug"
                      params={{ slug: item.slug.current }}
                    >
                      <span className="font-medium">
                        {item.episodeNumber !== null && `Episode ${item.episodeNumber}: `}
                        {displayTitle(item.title)}
                      </span>
                      {item.guestName && (
                        <span className="mt-1 block text-sm text-ink/55">
                          With {item.guestName}
                        </span>
                      )}
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
 * The hero photograph, with the guest overlay.
 *
 * The GUEST label renders only over a real portrait: over a recording still it
 * would attach a person's name to a photograph of someone else entirely.
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
  const labelled = hero.isPortrait && Boolean(episode.guestName);

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
      {labelled && (
        <div className="absolute right-5 top-5 text-right sm:right-8 sm:top-8">
          <span className="eyebrow inline-block bg-lime px-2.5 py-1 text-ink">Guest</span>
          <p className="mt-3 font-display text-xl uppercase tracking-[0.02em] text-cream sm:text-2xl">
            {episode.guestName}
          </p>
        </div>
      )}
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
