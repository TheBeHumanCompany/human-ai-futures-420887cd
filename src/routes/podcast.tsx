import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import podcastImage from "@/assets/podcast.jpg";
import { EpisodeCard } from "@/components/episode-card";
import { FeaturedEpisode } from "@/components/featured-episode";
import { PodcastDegraded } from "@/components/podcast-degraded";
import {
  browseEpisodes,
  DEFAULT_BROWSE_STATE,
  isDefaultBrowseState,
  SORT_OPTIONS,
} from "@/lib/podbean";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import { toBrowsable } from "@/lib/podcast/episode";
import { fetchEpisodeList } from "@/lib/podcast/queries";

/** Rows rendered before "Show more". */
const PAGE_SIZE = 12;

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
    ],
  }),
  component: Podcast,
});

// timeZone is pinned deliberately. Without it the formatter resolves against
// the runtime's zone — UTC on the server, the visitor's in the browser — so an
// episode published between 00:00 and ~08:00 UTC on the 1st of a month renders
// a different month on each side and trips a hydration mismatch.
const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

function Podcast() {
  const { episodes } = Route.useLoaderData();
  const [browse, setBrowse] = useState(DEFAULT_BROWSE_STATE);

  // Filtering is client-side and deliberately so: 39 episodes are already in
  // memory, so a round-trip per keystroke would be slower and no more correct.
  // The shipped filter is reused unchanged — `toBrowsable` renames two fields
  // and carries the original along so a filtered row can still be rendered.
  const browsable = useMemo(() => episodes.map(toBrowsable), [episodes]);

  /**
   * The newest episode gets its own block above the directory — but only on the
   * default view.
   *
   * Featuring it unconditionally would make it unfindable: search the guest's
   * name and the one episode that matches is the one excluded from the results,
   * because it is sitting in the block above. So the moment a query or sort is
   * applied, the feature block disappears and the list carries every match.
   */
  const isDefaultView = isDefaultBrowseState(browse);
  const featured = isDefaultView ? browsable[0] : undefined;

  const visible = useMemo(() => {
    const rows = browseEpisodes(browsable, browse);
    return featured
      ? rows.filter((row) => row.source.slug.current !== featured.source.slug.current)
      : rows;
  }, [browsable, browse, featured]);

  // Renders a page at a time rather than the whole catalogue. The fetch is
  // deliberately unbounded — filtering happens in memory so search stays
  // instant — but rendering all of it is what would actually cost something.
  const [shown, setShown] = useState(PAGE_SIZE);
  const rows = visible.slice(0, shown);

  // Reset the window whenever the query changes. Without this, searching after
  // "Show more" leaves the count reporting against the previous result set.
  useEffect(() => setShown(PAGE_SIZE), [browse]);

  return (
    <>
      {/*
        The show's name is the headline, and the microphone bleeds off the right
        edge rather than sitting in a contained cell. `isolate` and the negative
        z-index keep the image behind the copy without it escaping the section.
      */}
      <section className="section-ink grain relative isolate overflow-hidden border-b border-border">
        <img
          src={podcastImage}
          alt=""
          width={1200}
          height={900}
          className="absolute inset-y-0 right-0 -z-20 h-full w-full object-cover object-[70%_center] lg:w-[58%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/40 lg:bg-gradient-to-r lg:from-background lg:via-background/90 lg:to-transparent lg:[--tw-gradient-via-position:46%]"
        />

        <div className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8 lg:py-40">
          <h1 className="display max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)]">
            The People-Driven CEO <span className="text-lime">Podcast</span>
          </h1>
          <p className="mt-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Conversations on leadership, AI, culture and building organizations where humanity
            becomes the competitive advantage.
          </p>
        </div>
      </section>

      {featured && (
        <section className="section-cream border-b border-ink/10">
          <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20">
            <FeaturedEpisode episode={featured.source} />
          </div>
        </section>
      )}

      {/* scroll-mt-24 clears the sticky header on a `/podcast#episodes` landing. */}
      <section id="episodes" className="section-cream scroll-mt-24">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display text-3xl text-ink lg:text-4xl">
              {featured ? "More episodes" : "All episodes"}
            </h2>
            {episodes.length > 0 && (
              <div className="flex items-baseline gap-4">
                <span className="eyebrow text-ink/40" aria-live="polite">
                  {visible.length === episodes.length
                    ? `${episodes.length} episodes`
                    : `${visible.length} of ${episodes.length}`}
                </span>
                {!isDefaultBrowseState(browse) && (
                  <button
                    type="button"
                    onClick={() => setBrowse(DEFAULT_BROWSE_STATE)}
                    className="eyebrow link-underline text-ink/60 hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {episodes.length === 0 ? (
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/60">
              Episodes are taking a moment to load. Please refresh, or listen on your usual podcast
              app.
            </p>
          ) : (
            <>
              <div className="mt-8 flex flex-col gap-5 border-t border-hairline-dark pt-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    type="search"
                    value={browse.query}
                    onChange={(event) => setBrowse((s) => ({ ...s, query: event.target.value }))}
                    placeholder="Search episodes, guests or topics"
                    aria-label="Search episodes, guests or topics"
                    className="w-full border-b border-hairline-dark bg-transparent py-2.5 pl-7 pr-8 text-base text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink"
                  />
                  {browse.query && (
                    <button
                      type="button"
                      onClick={() => setBrowse((s) => ({ ...s, query: "" }))}
                      aria-label="Clear search"
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                {/*
                  The duration-length filter chips were removed here. They
                  filtered by episode length with live per-bucket counts and
                  worked, but they are not part of the approved directory design,
                  which specifies search and sort only. The filter library behind
                  them is deliberately kept — see src/lib/podbean/filter.ts.
                */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <label className="flex items-center gap-2 text-sm text-ink/60">
                    <span className="eyebrow">Sort</span>
                    <select
                      value={browse.sort}
                      onChange={(event) =>
                        setBrowse((s) => ({
                          ...s,
                          sort: event.target.value as typeof s.sort,
                        }))
                      }
                      className="border-b border-hairline-dark bg-transparent py-2 pr-6 text-sm text-ink outline-none focus-visible:border-ink"
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

              {visible.length === 0 ? (
                <div className="mt-10 border-t border-hairline-dark pt-10">
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
                  <ul className="mt-6 border-t border-hairline-dark">
                    {rows.map((row) => (
                      <EpisodeCard key={row.source.slug.current} episode={row.source} />
                    ))}
                  </ul>

                  {shown < visible.length && (
                    <button
                      type="button"
                      onClick={() => setShown((current) => current + PAGE_SIZE)}
                      className="eyebrow link-underline mt-8 text-ink"
                    >
                      Show more ({visible.length - shown} remaining)
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
