import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import podcastImage from "@/assets/podcast.jpg";
import { EpisodeMediaCard } from "@/components/episode-media-card";
import { FeaturedEpisode } from "@/components/featured-episode";
import { PodcastDegraded } from "@/components/podcast-degraded";
import { browseEpisodes, DEFAULT_BROWSE_STATE, SORT_OPTIONS } from "@/lib/podbean";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { fetchEpisodeList } from "@/lib/podcast/queries";

/** Rows rendered before "View all episodes". */
const PAGE_SIZE = 9;

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
  const browsable = useMemo(() => episodes.map((episode: EpisodeListItem) => toBrowsable(episode)), [episodes]);
  const visible = useMemo(
    () => browseEpisodes<(typeof browsable)[number]>(browsable, browse),
    [browsable, browse],
  );

  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => setShown(PAGE_SIZE), [browse]);

  const featured = visible[0]?.source;
  const rest = visible.slice(1, 1 + shown);
  const filtered = browse.query.trim() !== "";

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto grid max-w-[1500px] items-center gap-8 px-5 py-10 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-10 lg:py-12">
          <div>
            <h1 className="display text-[clamp(2.4rem,6.5vw,4.6rem)] leading-[0.92]">
              The people-
              <br />
              driven CEO
              <br />
              <span className="text-lime">Podcast</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, AI, culture, and building organizations where humanity
              becomes the competitive advantage.
            </p>

            <div className="relative mt-6 w-full max-w-[34rem]">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/50"
              />
              <input
                type="search"
                value={browse.query}
                onChange={(event) => setBrowse((s) => ({ ...s, query: event.target.value }))}
                placeholder="Search episodes, guests, or topics"
                aria-label="Search episodes, guests, or topics"
                className="w-full rounded-full border border-cream/20 bg-cream py-3 pl-11 pr-9 text-sm text-ink outline-none placeholder:text-ink/50 focus-visible:border-lime"
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

          <img
            src={podcastImage}
            alt="Studio condenser microphone lit warmly in a dark recording room"
            width={1400}
            height={1050}
            className="aspect-[4/3] w-full object-cover md:aspect-[5/4] md:max-h-[26rem]"
          />
        </div>
      </section>

      {/* ---- Discovery ---- */}
      <section id="episodes" className="section-cream">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
          {/* ---- Featured + grid ---- */}
          {episodes.length === 0 ? (
            <p className="mt-12 max-w-md text-lg leading-relaxed text-ink/60">
              Episodes are taking a moment to load. Please refresh, or listen on your usual podcast
              app.
            </p>
          ) : visible.length === 0 ? (
            <div className="mt-12 border-t border-hairline-dark pt-10">
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
            <>
              {featured && (
                <div className="mt-10 lg:mt-12">
                  <FeaturedEpisode episode={featured} />
                </div>
              )}

              <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-hairline-dark pt-6">
                <h2 className="section-label section-label-light text-sm">All episodes</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="eyebrow font-semibold tracking-[0.16em] text-ink" aria-live="polite">
                    {filtered ? `${visible.length} of ${episodes.length}` : `${episodes.length} episodes`}
                  </span>
                  <span aria-hidden className="h-4 w-px bg-hairline-dark" />
                  <label className="flex items-center gap-3 text-sm text-ink">
                    <span className="eyebrow text-ink/70">Sort by</span>
                    <select
                      value={browse.sort}
                      onChange={(event) =>
                        setBrowse((s) => ({ ...s, sort: event.target.value as typeof s.sort }))
                      }
                      className="border-b border-hairline-dark bg-transparent py-1.5 pr-6 text-sm font-semibold text-ink outline-none focus-visible:border-ink"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((row) => (
                  <EpisodeMediaCard key={row.source.slug.current} episode={row.source} />
                ))}
              </ul>

              {shown + 1 < visible.length && (
                <div className="mt-16 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShown((current) => current + PAGE_SIZE)}
                    className="eyebrow rounded-full border border-ink px-8 py-4 text-ink transition-colors hover:bg-ink hover:text-cream"
                  >
                    View all episodes <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
