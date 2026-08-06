import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { EpisodePlayer } from "@/components/episode-player";
import { EpisodeTopics } from "@/components/episode-topics";
import { GuestAvatar } from "@/components/guest-avatar";
import { PodcastDegraded } from "@/components/podcast-degraded";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import type { SanityEpisode } from "@/lib/podcast/episode";
import { fetchEpisodeBySlug, fetchRelatedCandidates } from "@/lib/podcast/queries";
import { selectRelatedEpisodes } from "@/lib/podcast/related";
import { buildEpisodeJsonLd, buildEpisodeMeta } from "@/lib/podcast/seo";

/**
 * One episode, at a permanent URL.
 *
 * **The filename carries a deliberate escape.** `podcast.tsx` is a leaf route
 * that renders no `<Outlet/>`, so `podcast.$slug.tsx` would nest inside it and
 * never render at all. The trailing underscore produces `path: '/podcast/$slug'`
 * mounted off the root. The URL is identical either way, which is the thing
 * that actually matters; renaming `podcast.tsx` was rejected because that is
 * precisely the file move that collides with the other automated writers on
 * this branch.
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
 * instinctive `!loaderData` guard — which `human-archive.$slug.tsx` uses
 * correctly, because it genuinely has two states — collapses them here and
 * emits `noindex` on an outage. Every predicate below therefore discriminates
 * on `match.status`, which distinguishes `"notFound"` from `"error"`.
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
   *
   * A catch would also have to re-detect `notFound()`, which is a plain object
   * rather than an Error and defeats every instinctive detector. With no catch
   * there is nothing to misclassify.
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
   * status upgrade promote it to a 503 — reintroducing the missing-versus-
   * unreachable conflation one layer below where it was defeated.
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
   * The degraded branch emits a title and nothing else — no robots directive,
   * no canonical, no Open Graph. Each omission is deliberate: `noindex` on a
   * transient outage is a deindex instruction for a permanent URL, and a
   * canonical on an error body invites a crawler to consolidate the real page
   * onto it.
   *
   * `noindex` lives on the not-found branch and nowhere else.
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

function EpisodePage() {
  const { episode, related } = Route.useLoaderData();
  const hasGuest = Boolean(episode.guestName);

  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[900px] px-6 py-16 sm:px-8 lg:py-24">
        <Link className="text-sm text-ink/60 underline hover:text-ink" to="/podcast">
          ← All episodes
        </Link>

        <header className="mt-8">
          {episode.episodeNumber !== null && (
            <p className="text-sm uppercase tracking-[0.2em] text-ink/60">
              Episode {episode.episodeNumber}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{episode.title}</h1>
          <p className="mt-3 text-sm text-ink/60">
            <time dateTime={episode.publishedAt}>
              {DATE_FORMAT.format(new Date(episode.publishedAt))}
            </time>
          </p>
        </header>

        <EpisodePlayer
          className="mt-8"
          src={episode.audioUrl}
          title={episode.title}
          durationSeconds={episode.durationSeconds}
        />

        <a
          className="mt-6 inline-block rounded-md bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90"
          href={episode.podbeanUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen or Watch Full Episode
        </a>

        {episode.description && (
          <div className="mt-10 space-y-4 text-base leading-relaxed text-ink/85">
            {episode.description
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
          </div>
        )}

        {/*
          The guest block is omitted entirely when there is no name — two of the
          thirty-nine really are like this, because their titles name a company
          and the parser declines to guess. An empty "About the guest" heading
          would be worse than no heading.
        */}
        {hasGuest && (
          <div className="mt-12 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <GuestAvatar
              className="h-24 w-24 rounded-full object-cover"
              guestPhoto={episode.guestPhoto}
              guestName={episode.guestName}
            />
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-ink/60">Guest</h2>
              <p className="mt-2 font-display text-xl">{episode.guestName}</p>
              {episode.guestBio && (
                <p className="mt-3 text-base leading-relaxed text-ink/85">{episode.guestBio}</p>
              )}
            </div>
          </div>
        )}

        <EpisodeTopics className="mt-12" topics={episode.topics} />

        {related.length > 0 && (
          <div className="mt-16 border-t border-ink/10 pt-10">
            <h2 className="text-sm uppercase tracking-[0.2em] text-ink/60">More episodes</h2>
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.slug.current}>
                  <Link
                    className="font-display text-lg underline-offset-4 hover:underline"
                    to="/podcast/$slug"
                    params={{ slug: item.slug.current }}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function EpisodeNotFound() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl sm:text-4xl">Episode not found</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/80">
          We could not find that episode. It may have been moved, or the link may be mistyped.
        </p>
        <Link
          className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90"
          to="/podcast"
        >
          Browse all episodes
        </Link>
      </div>
    </section>
  );
}
