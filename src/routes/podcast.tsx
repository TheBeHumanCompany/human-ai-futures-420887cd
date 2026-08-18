import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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

/** Episodes per paginated page on mobile. */
const MOBILE_PAGE_SIZE = 6;

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
  const isMobile = useIsMobile();
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

  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => setShown(PAGE_SIZE), [browse]);

  // Mobile browses the archive a page at a time rather than scrolling forever.
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [browse, isMobile]);
  const archiveRef = useRef<HTMLDivElement>(null);

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

  const pageCount = Math.max(1, Math.ceil(gridEpisodes.length / MOBILE_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rest = isMobile
    ? gridEpisodes.slice((current - 1) * MOBILE_PAGE_SIZE, current * MOBILE_PAGE_SIZE)
    : gridEpisodes.slice(0, shown);

  const filtered = browse.query.trim() !== "";

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), pageCount));
    archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="section-ink grain">
        <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-5 pb-12 pt-8 sm:px-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] md:gap-14 lg:pb-16 lg:pt-10">
          <div className="md:pl-4 lg:pl-6 xl:pl-8">
            <h1 className="type-h1-caps-light">
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
              className="aspect-[3/2] max-h-[16rem] w-full object-cover object-[50%_45%] sm:aspect-[4/3] sm:max-h-[20rem] md:aspect-[5/4] md:max-h-[24rem]"
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
              {featured && <FeaturedEpisode episode={featured} />}

              {/* Archive discovery: generous breathing room after the featured
                  card, then search, then the "More episodes" heading, then the
                  count/sort row, then the grid. */}
              <div ref={archiveRef} className="mt-24 scroll-mt-24 lg:mt-32">
                <h2 className="type-label-caps text-ink">More episodes</h2>

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

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <span
                    className="eyebrow font-semibold tracking-[0.16em] text-ink"
                    aria-live="polite"
                  >
                    {filtered
                      ? `${visible.length} of ${episodes.length}`
                      : `${episodes.length} episodes`}
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

              <ul className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((episode) => (
                  <EpisodeMediaCard key={episode.slug.current} episode={episode} />
                ))}
              </ul>

              {isMobile && pageCount > 1 && (
                <nav
                  aria-label="Episode pages"
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(current - 1)}
                    disabled={current === 1}
                    aria-label="Previous page"
                    className="flex size-9 items-center justify-center rounded-full border border-hairline-dark text-ink disabled:opacity-35"
                  >
                    <span aria-hidden>‹</span>
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => goToPage(number)}
                      aria-current={number === current ? "page" : undefined}
                      className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${
                        number === current
                          ? "bg-ink text-cream"
                          : "border border-hairline-dark text-ink"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToPage(current + 1)}
                    disabled={current === pageCount}
                    aria-label="Next page"
                    className="flex size-9 items-center justify-center rounded-full border border-hairline-dark text-ink disabled:opacity-35"
                  >
                    <span aria-hidden>›</span>
                  </button>
                </nav>
              )}

              {!isMobile && shown + 1 < visible.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShown((count) => count + PAGE_SIZE)}
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
