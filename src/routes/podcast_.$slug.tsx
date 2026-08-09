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
 * Show notes as paragraphs.
 *
 * Split on blank lines first, since that is how the feed marks paragraphs. Long
 * single-block descriptions are then split on sentence boundaries into groups
 * of roughly three, which is formatting rather than rewriting — no word is
 * added, removed or reordered.
 */
function paragraphs(description: string): string[] {
  const blocks = description
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length > 1) return blocks;

  const sentences = (blocks[0] ?? "").match(/[^.!?]+[.!?]*\s*/g) ?? [];
  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    grouped.push(sentences.slice(i, i + 3).join("").trim());
  }
  return grouped.filter(Boolean);
}

function EpisodePage() {
  const { episode, related }: EpisodeLoaderData = Route.useLoaderData();
  const hero = episodeHeroImage(episode);
  const body = episode.description ? paragraphs(episode.description) : [];
  const topics = episode.topics ?? [];

  return (
    <>
      {/* ---- Hero: cream editorial column + full-bleed image ---- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="grid lg:grid-cols-2">
          <div className="order-1 flex flex-col justify-center px-5 py-12 sm:px-8 lg:py-20 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-16">
            {episode.episodeNumber !== null && (
              <p className="eyebrow text-ink/50">Episode {episode.episodeNumber}</p>
            )}
            <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.35rem)] font-medium leading-[1.08] tracking-[0.005em] text-ink">
              {episode.title}
            </h1>
            <p className="eyebrow mt-6 text-ink/50">
              <time dateTime={episode.publishedAt}>
                {DATE_FORMAT.format(new Date(episode.publishedAt))}
              </time>
            </p>

            {/* Mobile order: image sits above the player. */}
            <div className="mt-8 lg:hidden">
              <HeroImage episode={episode} hero={hero} />
            </div>

            <EpisodePlayer
              className="mt-8 max-w-md"
              src={episode.audioUrl}
              title={episode.title}
              durationSeconds={episode.durationSeconds}
            />

            <a
              className="eyebrow group mt-8 inline-flex w-fit items-center gap-3 bg-ink px-7 py-4 text-cream transition-colors hover:bg-ink/90"
              href={episode.podbeanUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Listen or watch full episode
              <span aria-hidden className="text-lime transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>

          <div className="order-2 hidden lg:block">
            <HeroImage episode={episode} hero={hero} className="h-full min-h-[560px]" />
          </div>
        </div>
      </section>

      {/* ---- Story + guest ---- */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            {body.length > 0 && (
              <div className="max-w-[65ch] space-y-6 text-base leading-[1.75] text-ink/80">
                {body.map((paragraph: string) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}

            {episode.guestName && (
              <div className="lg:border-l lg:border-hairline-dark lg:pl-16">
                <p className="section-label section-label-light text-xs">Meet the guest</p>
                <h2 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.1rem)] font-medium uppercase leading-none tracking-[0.01em] text-ink">
                  {episode.guestName}
                </h2>
                {episode.guestBio && (
                  <p className="mt-5 max-w-[60ch] text-base leading-[1.75] text-ink/75">
                    {episode.guestBio}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ---- Topics + more episodes ---- */}
          {(topics.length > 0 || related.length > 0) && (
            <div className="mt-16 grid gap-12 border-t border-hairline-dark pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              {topics.length > 0 && (
                <div>
                  <p className="section-label section-label-light text-xs">Topics</p>
                  <ul className="mt-5 flex flex-wrap gap-3">
                    {topics.map((topic) => (
                      <li key={topic._id}>
                        <span className="inline-block rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/80">
                          {topic.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {related.length > 0 && (
                <div className={topics.length > 0 ? "" : "lg:col-start-2"}>
                  <div className="flex items-baseline justify-between gap-6">
                    <p className="section-label section-label-light text-xs">More episodes</p>
                    <Link
                      to="/podcast"
                      className="eyebrow link-underline inline-flex items-center gap-2 text-ink/70 hover:text-ink"
                    >
                      View all episodes <span aria-hidden className="text-lime">→</span>
                    </Link>
                  </div>
                  <ul className="mt-5 space-y-4">
                    {related.map((item) => (
                      <li key={item.slug.current}>
                        <Link
                          className="group block text-base leading-snug text-ink/85 hover:text-ink"
                          to="/podcast/$slug"
                          params={{ slug: item.slug.current }}
                        >
                          <span className="font-medium">
                            {item.episodeNumber !== null && `Episode ${item.episodeNumber}: `}
                            {item.title}
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
              )}
            </div>
          )}
        </div>
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
