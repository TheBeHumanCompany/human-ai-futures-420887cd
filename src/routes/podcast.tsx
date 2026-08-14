import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import podcastImage from "@/assets/podcast.jpg";
import { EpisodeMediaCard } from "@/components/episode-media-card";
import { FeaturedEpisode } from "@/components/featured-episode";
import { PodcastDegraded } from "@/components/podcast-degraded";
import { browseEpisodes, DEFAULT_BROWSE_STATE } from "@/lib/podbean";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { fetchEpisodeList } from "@/lib/podcast/queries";

/**
 * How many episodes the curated landing page shows under the featured card.
 * The complete catalogue lives on /podcast/archive, so this page stays a
 * curated editorial spread rather than a database dump.
 */
const PAGE_SIZE = 4;

export const Route = createFileRoute("/podcast")({
  /**
   * No catch. A Sanity outage must reach the router as an errored match so the
   * page says "temporarily unavailable" rather than rendering an empty
   * catalogue, which would claim this show has no episodes.
   */
  loader: async () => ({ episodes: await fetchEpisodeList() }),

  headers: ({ match }): Record<string, string> =>
    match.status === "error"
      ? {
          "retry-after": String(DEGRADED_RETRY_AFTER_SECONDS),
          [DEGRADED_SOURCE_HEADER]: DEGRADED_SOURCE_VALUE,
        }
      : {},

  errorComponent: PodcastDegraded,
  head: () => ({
    meta: [
      { title: "The People-Driven CEO Podcast — The Be Human Company" },
      {
        name: "description",
        content:
          "Conversations on leadership, AI, culture and building organizations where humanity becomes the competitive advantage.",
      },
      { property: "og:title", content: "The People-Driven CEO Podcast" },
      {
        property: "og:description",
        content: "Where leaders prepare for the New Human Era.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Podcast,
});

function Podcast() {
  const { episodes } = Route.useLoaderData();
  const [browse, setBrowse] = useState(DEFAULT_BROWSE_STATE);

  // Filtering is client-side and deliberately so: the catalogue is already in
  // memory, so a round-trip per keystroke would be slower and no more correct.
  const browsable = useMemo(
    () => episodes.map((episode: EpisodeListItem) => toBrowsable(episode)),
    [episodes],
  );
  const visible = useMemo(
    () => browseEpisodes<(typeof browsable)[number]>(browsable, browse),
    [browsable, browse],
  );

  const featured =
    visible.find((row) => row.source.episodeNumber === 5)?.source ?? visible[0]?.source;

  const gridEpisodes = useMemo<EpisodeListItem[]>(() => {
    const withoutFeatured = visible.filter((row) => row.source.episodeNumber !== 5);
    const ep39 = withoutFeatured.find((row) => row.source.episodeNumber === 39)?.source;
    const ep38 = withoutFeatured.find((row) => row.source.episodeNumber === 38)?.source;
    const remainder = withoutFeatured.filter(
      (row) => row.source.episodeNumber !== 39 && row.source.episodeNumber !== 38,
    );
    return [ep39, ep38, ...remainder.map((row) => row.source)].filter(
      (episode): episode is EpisodeListItem => episode !== undefined,
    );
  }, [visible]);

  const rest = gridEpisodes.slice(0, PAGE_SIZE);

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="section-ink grain">
        <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-5 pb-12 pt-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-14 lg:pb-16 lg:pt-10">
          <div className="md:pl-8 lg:pl-16 xl:pl-24">
            <h1 className="display text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.9] tracking-[0.01em]">
              The people-driven
              <br />
              CEO <span className="text-lime">Podcast</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, AI, culture, and building organizations where humanity
              becomes the competitive advantage.
            </p>
          </div>

          {/* The photograph is dark-on-dark, so it is feathered into the ink
              background on every edge — and especially the top edge beneath the
              sticky header — instead of being cut off by a hard line. */}
          <div className="relative">
            <img
              src={podcastImage}
              alt="Studio condenser microphone lit warmly in a dark recording room"
              width={1400}
              height={1050}
              className="aspect-[4/3] w-full object-cover md:aspect-[5/4] md:max-h-[24rem]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--ink)_0%,transparent_45%,transparent_70%,var(--ink)_100%),linear-gradient(to_right,var(--ink)_0%,transparent_30%,transparent_75%,var(--ink)_100%),radial-gradient(ellipse_at_center,transparent_30%,var(--ink)_100%)]"
            />
          </div>
        </div>
      </section>

      {/* ---- Discovery ---- */}
      <section id="episodes" className="section-cream">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
          {episodes.length === 0 ? (
            <p className="mt-12 max-w-md text-lg leading-relaxed text-ink/60">
              Episodes are taking a moment to load. Please refresh, or listen on your usual podcast
              app.
            </p>
          ) : (
            <>
              {featured && <FeaturedEpisode episode={featured} />}

              {/* Curated archive: heading, then search, then four cards, then
                  the route through to the complete archive. */}
              <div className="mt-24 scroll-mt-24 lg:mt-32">
                <h2 className="section-label section-label-light text-sm">More episodes</h2>

                <div className="relative mt-5 w-full max-w-[38rem]">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/50"
                  />
                  <input
                    type="search"
                    value={browse.query}
                    onChange={(event) => setBrowse((s) => ({ ...s, query: event.target.value }))}
                    placeholder="Search episodes, guests, or keywords"
                    aria-label="Search episodes, guests, or keywords"
                    className="w-full rounded-full border border-hairline-dark bg-cream py-2.5 pl-11 pr-9 text-sm text-ink outline-none placeholder:text-ink/50 focus-visible:border-ink"
                  />
                  {browse.query && (
                    <button
                      type="button"
                      onClick={() => setBrowse((s) => ({ ...s, query: "" }))}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink/50 hover:text-ink"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              {rest.length === 0 ? (
                <div className="mt-10">
                  <p className="max-w-md text-lg leading-relaxed text-ink/60">
                    No episodes match{browse.query ? ` “${browse.query}”` : " that search"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBrowse(DEFAULT_BROWSE_STATE)}
                    className="eyebrow link-underline mt-4 text-ink"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <ul className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:gap-x-14 lg:gap-y-14">
                  {rest.map((episode) => (
                    <EpisodeMediaCard key={episode.slug.current} episode={episode} />
                  ))}
                </ul>
              )}

              <div className="mt-16 flex justify-center lg:mt-20">
                <Link
                  to="/podcast/archive"
                  className="eyebrow inline-flex items-center gap-3 rounded-full border border-ink px-8 py-4 font-semibold tracking-[0.24em] text-ink transition-colors hover:bg-ink hover:text-cream"
                >
                  View all episodes <span aria-hidden>→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
