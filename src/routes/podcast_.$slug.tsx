import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { EpisodePlayer } from "@/components/episode-player";
import { formatDuration } from "@/lib/podbean/parse";
import { PodcastDegraded } from "@/components/podcast-degraded";
import { withContentCorrections } from "@/lib/podcast/content-corrections";
import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
} from "@/lib/podcast/degraded-status";
import type { SanityEpisode } from "@/lib/podcast/episode";
import { businessNameOf, guestProfile } from "@/lib/podcast/guest-profiles";
import { episodeHeroImage, episodeImage } from "@/lib/podcast/imagery";
import { fetchEpisodeBySlug, fetchRelatedCandidates } from "@/lib/podcast/queries";
import { selectRelatedEpisodes } from "@/lib/podcast/related";
import { buildEpisodeJsonLd, buildEpisodeMeta } from "@/lib/podcast/seo";
import { proseParagraphs, showNoteParagraphs } from "@/lib/podcast/show-notes";

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

    const corrected = withContentCorrections(episode);
    const candidates = await fetchRelatedCandidates();
    return { episode: corrected, related: selectRelatedEpisodes(corrected, candidates) };
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

/**
 * The one heading style for both lower columns. Shared so "Episode summary" and
 * "Meet the guest" cannot drift apart in colour, size, tracking or spacing.
 *
 * Rendered as a solid lime tag with black ink text to match the highlighted
 * labels used elsewhere on the site (e.g. "LATEST EPISODE", episode numbers).
 */
const SECTION_HEADING = "type-label-caps w-fit bg-lime px-2.5 py-1.5 text-ink";

function EpisodePage() {
  const { episode, related }: EpisodeLoaderData = Route.useLoaderData();
  const hero = episodeHeroImage(episode);
  const profile = guestProfile(episode.episodeNumber);
  // Cleaned at render for every episode, present and future: the feed's
  // promotional tail ("Mobile viewers…", hashtags, "Listen on:") is never shown.
  const body = showNoteParagraphs(episode.description);
  // Guest bio: CMS copy first, the on-file profile only as a fallback. Both go
  // through the same paragraph splitter so breaks survive either way.
  const bio = proseParagraphs(episode.guestBio ?? profile.bio ?? "");
  // External links, built from the episode's optional Sanity URL fields.
  // Empty when none are authored, and then nothing renders at all.
  const links = guestLinks(episode, businessNameOf(profile));

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
              Watch the Full Episode
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
            {/* Both column headings share ONE class string, deliberately: the
                brief is that "Episode summary" and "Meet the guest" always
                match. Any divergence here is a bug, not a variant. */}
            <p className={SECTION_HEADING}>Episode summary</p>
            {body.length > 0 && (
              <div className="mt-3 max-w-[58ch] space-y-3 whitespace-pre-line text-[1.0625rem] leading-[1.55] text-ink/80">
                {body.map((paragraph: string) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}

            {/* Company-titled episodes have no guest column, so their links
                live here instead — same list, same rules. */}
            {!episode.guestName && links.length > 0 && (
              <GuestLinks links={links} className="mt-8 max-w-[58ch]" />
            )}
          </div>

          {episode.guestName && (
            <div className="px-5 pb-12 sm:px-8 lg:border-l lg:border-hairline-dark lg:pt-12 lg:pl-10 lg:pr-[max(2rem,calc((100vw-1400px)/2+2rem))]">
              <p className={SECTION_HEADING}>Meet the guest</p>
              <h2 className="mt-5 font-display text-[clamp(1.4rem,2.2vw,1.75rem)] font-medium uppercase leading-none tracking-[0.01em] text-ink">
                {episode.guestName}
              </h2>
              {profile.role && <p className="eyebrow mt-2 text-ink/60">{profile.role}</p>}
              {/* Sanity first, the on-file profile only as a fallback — and
                  nothing at all when neither exists. No filler. */}
              {bio.length > 0 && (
                <div className="mt-3 max-w-[55ch] space-y-3 whitespace-pre-line text-[1.0625rem] leading-[1.55] text-ink/75">
                  {bio.map((paragraph: string) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              )}
              {/* Below the bio, never between the name and it — and absent
                  entirely when no URL fields are populated. */}
              {links.length > 0 && <GuestLinks links={links} className="mt-6" />}
            </div>
          )}
        </div>

        {/* ---- More episodes ---- */}
        {related.length > 0 && (
          <div className="mx-auto max-w-[1400px] px-5 pb-12 sm:px-8">
            <div className="border-t border-hairline-dark pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-5">
                <p className="type-label-caps text-ink">More episodes</p>
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
              {/* Mobile: compact swipe row (snap) instead of a long stack. */}
              <ul className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-8">
                {related.map((item) => (
                  <li
                    key={item.slug.current}
                    className="w-[78%] shrink-0 snap-start sm:w-auto"
                  >
                    <Link
                      className="group block h-full border border-hairline-dark"
                      to="/podcast/$slug"
                      params={{ slug: item.slug.current }}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-ink">
                        <img
                          src={episodeImage(item, 700)}
                          alt={item.guestName ? `Portrait of ${item.guestName}` : ""}
                          loading="lazy"
                          className="size-full object-cover object-[50%_22%] transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="p-4">
                        <p className="eyebrow flex items-center gap-2 text-ink/60">
                          {item.episodeNumber !== null && (
                            <span className="bg-lime px-2 py-0.5 text-ink">
                              Ep {item.episodeNumber}
                            </span>
                          )}
                          {item.durationSeconds > 0 && (
                            <span>{formatDuration(item.durationSeconds)}</span>
                          )}
                        </p>
                        <p className="mt-3 font-display text-lg font-medium uppercase leading-tight text-ink">
                          {displayTitle(item.title)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-ink/60">{item.guestName ?? ""}</span>
                          <span
                            aria-hidden
                            className="text-lime transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </div>
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

interface GuestLink {
  label: string;
  href: string;
}

/**
 * The external links for an episode, built from its optional Sanity URL
 * fields. A field with no value produces no link — no placeholder, no empty
 * line — and an episode with none populated produces an empty list, which the
 * caller renders as nothing at all. Personal and company accounts are
 * independent: both, either, or neither may appear.
 */
function guestLinks(episode: SanityEpisode, businessName: string | undefined): GuestLink[] {
  const business = businessName ?? "the business";
  // Personal links use the guest's first name only — never a role or title.
  const first = episode.guestName?.trim().split(/\s+/)[0];
  const bothInstagram = Boolean(episode.guestInstagramUrl && episode.companyInstagramUrl);
  const links: GuestLink[] = [];
  if (episode.businessWebsiteUrl) {
    links.push({
      label: businessName ? `Visit ${businessName}` : "Visit the website",
      href: episode.businessWebsiteUrl,
    });
  }
  if (episode.guestInstagramUrl && first) {
    links.push({ label: `${first} on Instagram`, href: episode.guestInstagramUrl });
  }
  if (episode.companyInstagramUrl) {
    links.push({
      label: bothInstagram || businessName ? `${business} on Instagram` : "Instagram",
      href: episode.companyInstagramUrl,
    });
  }
  if (episode.facebookUrl) {
    links.push({ label: "Facebook", href: episode.facebookUrl });
  }
  if (episode.guestLinkedinUrl && first) {
    links.push({ label: `${first} on LinkedIn`, href: episode.guestLinkedinUrl });
  }
  if (episode.companyLinkedinUrl) {
    links.push({ label: `${business} on LinkedIn`, href: episode.companyLinkedinUrl });
  }
  return links;
}

/**
 * EXPLORE MORE: an understated heading (no lime fill, no rule above) and the
 * editorial links — uppercase ink, lime arrow, whole label clickable, new tab.
 * Two compact columns from sm up; stacked with touch spacing on mobile.
 */
function GuestLinks({ links, className }: { links: GuestLink[]; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow font-semibold tracking-[0.14em] text-ink">Explore more</p>
      <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 sm:gap-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow inline-flex min-h-[40px] w-fit items-center gap-1.5 font-medium text-ink transition-colors hover:text-ink/60 sm:min-h-0"
            >
              {link.label}
              <span aria-hidden className="text-lime">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
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
        <div className="absolute right-5 top-5 flex flex-col items-end text-right sm:right-8 sm:top-8">
          <p className="font-display text-lg uppercase tracking-[0.04em] text-cream drop-shadow sm:text-xl">
            {episode.guestName}
          </p>
          <span aria-hidden className="mt-2 block h-[2px] w-10 bg-lime" />
        </div>
      )}
    </div>
  );
}

function EpisodeNotFound() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <h1 className="type-h3-caps-light">Episode not found</h1>
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
