import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EpisodeMediaCard } from "@/components/episode-media-card";
import { PodcastDegraded } from "@/components/podcast-degraded";
import { browseEpisodes, DEFAULT_BROWSE_STATE, SORT_OPTIONS } from "@/lib/podbean";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { fetchEpisodeList } from "@/lib/podcast/queries";

/** Episodes per paginated page on desktop. */
const PAGE_SIZE = 8;

/** Episodes per paginated page on mobile. */
const MOBILE_PAGE_SIZE = 6;

export const Route = createFileRoute("/podcast_/archive")({
  /**
   * No catch, same contract as /podcast: an outage must reach the router as an
   * errored match rather than render an empty catalogue.
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
      { title: "All Episodes — The People-Driven CEO Podcast" },
      {
        name: "description",
        content:
          "Browse, search and sort every episode of The People-Driven CEO Podcast from The Be Human Company.",
      },
      { property: "og:title", content: "All Episodes — The People-Driven CEO Podcast" },
      {
        property: "og:description",
        content: "The complete archive of conversations on leadership, AI and culture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PodcastArchive,
});

function PodcastArchive() {
  const { episodes } = Route.useLoaderData();
  const isMobile = useIsMobile();
  const [browse, setBrowse] = useState(DEFAULT_BROWSE_STATE);

  const browsable = useMemo(
    () => episodes.map((episode: EpisodeListItem) => toBrowsable(episode)),
    [episodes],
  );
  const visible = useMemo(
    () => browseEpisodes<(typeof browsable)[number]>(browsable, browse),
    [browsable, browse],
  );

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [browse, isMobile]);
  const archiveRef = useRef<HTMLDivElement>(null);

  const perPage = isMobile ? MOBILE_PAGE_SIZE : PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(visible.length / perPage));
  const current = Math.min(page, pageCount);
  const rows = visible.slice((current - 1) * perPage, current * perPage);
  const filtered = browse.query.trim() !== "";

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), pageCount));
    archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="section-ink grain">
        <div className="mx-auto max-w-[1500px] px-5 pb-10 pt-8 sm:px-8 md:pl-8 lg:pl-16 xl:pl-24">
          <Link to="/podcast" className="eyebrow text-muted-foreground hover:text-cream">
            <span aria-hidden>←</span> Podcast
          </Link>
          <h1 className="display mt-5 text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.92] tracking-[0.01em]">
            All <span className="text-lime">episodes</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Search, sort and browse the complete archive.
          </p>
        </div>
      </section>

      <section className="section-cream">
        <div ref={archiveRef} className="mx-auto max-w-[1500px] scroll-mt-24 px-5 py-10 sm:px-8">
          <div className="relative w-full max-w-[38rem]">
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

          {visible.length === 0 ? (
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
            <ul className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:gap-x-14 lg:gap-y-14">
              {rows.map((row) => (
                <EpisodeMediaCard key={row.source.slug.current} episode={row.source} />
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav aria-label="Episode pages" className="mt-14 flex items-center justify-center gap-8">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => goToPage(number)}
                  aria-current={number === current ? "page" : undefined}
                  className={`border-b-2 pb-1 text-sm font-semibold tracking-[0.12em] transition-colors ${
                    number === current
                      ? "border-lime text-ink"
                      : "border-transparent text-ink/55 hover:text-ink"
                  }`}
                >
                  {String(number).padStart(2, "0")}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(current + 1)}
                disabled={current === pageCount}
                aria-label="Next page"
                className="pb-1 text-ink transition-opacity disabled:opacity-30"
              >
                <span aria-hidden>→</span>
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
