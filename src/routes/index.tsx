import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { EpisodeListItem } from "@/lib/podcast/episode";
import heroImage from "@/assets/hero.png";
import founderVideoPoster from "@/assets/why-we-exist-video.jpg";
import podcastImage from "@/assets/podcast.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";
import collageImage from "@/assets/new-human-era-collage.png";

import {
  Users,
  Shield,
  Target,
  User,
  Brain,
  MessageCircle,
  Heart,
  ArrowUpRight,
} from "lucide-react";

/** Line-art accents for the six principles, in order. */
const PRINCIPLE_ICONS = [User, Brain, MessageCircle, Heart, Target, ArrowUpRight] as const;
import { EpisodePlayer } from "@/components/episode-player";
import { SocialSection } from "@/components/social-section";
import { HumanArchiveSection } from "@/components/human-archive-section";
import { HOME_PRINCIPLES } from "@/lib/content";
import { formatDuration } from "@/lib/podbean";
import { loadFeaturedEpisodes } from "@/lib/podcast/featured";
import { fetchEpisodeList } from "@/lib/podcast/queries";
import { episodeImage } from "@/lib/podcast/imagery";

export const Route = createFileRoute("/")({
  /**
   * The one loader in this app that CATCHES, and the asymmetry is deliberate.
   *
   * `/podcast` and `/podcast/$slug` throw, so a Sanity outage becomes an honest
   * 5xx there. Here that would be self-inflicted: a thrown loader errors the
   * match and takes the ENTIRE front door to 500 because a podcast section
   * could not load. The rest of this page is static and still true.
   *
   * The narrow catch itself lives in `loadFeaturedEpisodes` — a route loader
   * calling a server function cannot be invoked outside the server runtime, so
   * keeping the re-throw-versus-absorb branch here would make it untestable.
   */
  loader: () => loadFeaturedEpisodes(fetchEpisodeList, 39),

  head: () => ({
    meta: [
      { title: "The Be Human Company — The Future Is Human." },
      {
        name: "description",
        content:
          "Human readiness, governance, agents and leadership. We help organizations get ready for artificial intelligence without losing what makes them human.",
      },
      { property: "og:title", content: "The Be Human Company — The Future Is Human." },
      {
        property: "og:description",
        content:
          "Human readiness, governance, agents and leadership. We help organizations get ready for artificial intelligence without losing what makes them human.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { featured, podcastUnavailable } = Route.useLoaderData();
  const latest = featured.find((episode) => episode.episodeNumber === 5) ?? featured[0];
  const rest = featured.filter((episode) => episode.episodeNumber !== 5).slice(0, 2);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="section-ink grain relative isolate overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="A woman carefully adjusts a humanoid robot's hand in a workshop"
          width={1600}
          height={1200}
          className="absolute inset-0 -z-20 h-full w-full origin-center object-cover object-[49%_22%] sm:scale-[1.2] sm:translate-x-[12%] sm:object-[45%_28%] lg:scale-[1.18] lg:translate-x-[13%] lg:object-[42%_30%]"
        />
        {/* localized left gradient for headline legibility */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background/95 via-background/25 to-transparent lg:bg-gradient-to-r lg:from-background/95 lg:via-background/20 lg:to-transparent lg:[--tw-gradient-via-position:38%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 via-transparent to-transparent [--tw-gradient-via-position:32%] lg:hidden"
        />

        <div className="mx-auto flex min-h-[88svh] max-w-[1400px] items-end px-5 pb-16 pt-28 sm:px-8 lg:min-h-[80vh] lg:items-center lg:py-32">
          <div className="fade-up max-w-2xl">
            <h1 className="type-hero-caps-light">
              The future
              <br />
              is <span className="text-lime">human</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/85 sm:text-lg lg:max-w-xl">
              We help people and organizations practice what keeps us human in a world becoming more
              artificial.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/70 sm:text-lg lg:max-w-xl">
              Through artificial intelligence strategy, human readiness, governance, and
              transformation.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- WHY WE EXIST ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto grid max-w-[1360px] items-start gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[42%_58%] lg:gap-16 lg:px-14 lg:py-28">
          <div className="min-w-0">
            <p className="type-label-caps text-ink">WHY WE EXIST</p>
            <div className="type-eyebrow-rule mt-5 sm:mt-6" aria-hidden />

            <h2 className="type-h2-caps max-lg:text-[clamp(2.75rem,6.5vw,3.5rem)] max-lg:leading-[0.96] mt-10 max-lg:mt-12 lg:mt-14 text-ink">
              BEING HUMAN IS
              <br />
              WHAT WE ARE
              <br />
              BORN WITH
              <span className="mt-10 block max-lg:mt-14 lg:mt-12">
                HUMANITY IS
                <br />
                WHAT WE
                <br />
                <span className="text-lime">PRACTICE</span>
              </span>
            </h2>
          </div>

          <FounderVideoFigure />
        </div>
      </section>

      {/* ---------- BE HUMAN INTELLIGENCE ---------- */}
      <section
        id="be-human-ai"
        className="section-ink relative isolate overflow-hidden border-t border-border"
      >
        {/* INTEGRATED PORTRAIT LAYER */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <img
            src={humanAiProfile}
            alt=""
            width={1024}
            height={1280}
            className="absolute right-[-20%] top-[26%] h-[42%] w-auto max-w-none object-contain opacity-95 [mask-image:radial-gradient(ellipse_58%_58%_at_52%_45%,#000_38%,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_58%_58%_at_52%_45%,#000_38%,transparent_78%)] sm:right-[-6%] sm:top-[6%] sm:h-[70%] sm:opacity-70 lg:left-1/2 lg:right-auto lg:top-1/2 lg:h-[118%] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:opacity-90"
          />
          {/* localized dark gradients keeping copy legible */}
          <div className="absolute left-0 top-0 h-[52%] w-[72%] bg-gradient-to-r from-ink via-ink/85 to-transparent [mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)] sm:inset-y-0 sm:h-auto sm:w-[64%] sm:[mask-image:none] lg:hidden" />

          <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-ink via-ink/85 to-transparent lg:block" />
          <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-l from-ink via-ink/85 to-transparent lg:block" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[34%_22%_44%] lg:items-center lg:gap-8 lg:py-28">
          {/* LEFT COLUMN */}
          <div className="flex max-w-xl flex-col justify-center">
            <p className="type-label-caps text-lime">OUR SOLUTION</p>
            <h2 className="type-h2-caps-light mt-5 sm:mt-6 lg:mt-8">
              BE HUMAN <span className="text-lime">INTELLIGENCE</span>
            </h2>
            <p className="mt-6 max-w-[17.5rem] text-base leading-relaxed text-foreground/80 sm:max-w-sm">
              We help organizations prepare for the age of artificial intelligence by strengthening
              their people, protecting what matters, and transforming how work gets done.
            </p>
            <Link
              to="/be-human-ai"
              className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-lime px-6 py-3 text-xs font-medium uppercase tracking-widest text-foreground transition-colors hover:bg-lime hover:text-ink sm:mt-8 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              EXPLORE BE HUMAN INTELLIGENCE{" "}
              <span aria-hidden className="text-lime transition-colors group-hover:text-ink">
                →
              </span>
            </Link>
          </div>

          {/* centre spacer reserved for the portrait layer */}
          <div className="hidden lg:block" aria-hidden />

          {/* RIGHT COLUMN — CAPABILITIES */}
          <div className="mt-64 flex flex-col justify-center sm:mt-40 md:mt-20 lg:mt-0">
            <div className="border-t border-border">
              <div className="flex gap-5 py-7">
                <Users className="mt-0.5 h-6 w-6 shrink-0 text-lime" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em] text-lime">
                    HUMAN READINESS
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Prepare your team with the skills, mindset, and confidence to thrive alongside
                    the machines.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-border">
              <div className="flex gap-5 py-7">
                <Shield className="mt-0.5 h-6 w-6 shrink-0 text-lime" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em] text-lime">
                    SECURITY, GOVERNANCE
                    <br />& SOVEREIGNTY
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Protect your data, reduce risk, and build on a foundation of trust.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-border">
              <div className="flex gap-5 py-7">
                <Target className="mt-0.5 h-6 w-6 shrink-0 text-lime" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em] text-lime">
                    INTELLIGENCE STRATEGY & TRANSFORMATION
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Identify opportunities, redesign workflows, and implement systems that deliver
                    measurable business results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- THE NEW HUMAN ERA ---------- */}
      <section className="section-cream border-t border-border">
        {/* Top: editorial split — text ~35%, collage ~65% */}
        <div className="lg:grid lg:grid-cols-[35%_65%] lg:items-center">
          <div className="px-6 py-12 sm:px-10 sm:py-14 lg:py-16 lg:pl-[max(2rem,calc((100vw-1500px)/2+2rem))] lg:pr-12">
            <h2 className="type-h1-caps max-lg:text-[clamp(3.25rem,8vw,4.25rem)] max-lg:leading-[0.92] text-ink">
              THE NEW
              <br className="md:hidden lg:inline" />
              <span className="text-lime">HUMAN</span> ERA
            </h2>

            <div className="mt-8 max-w-md space-y-5 text-[15px] leading-relaxed text-ink/80 sm:text-base">
              <p>
                For generations, status was measured by{" "}
                <strong className="whitespace-nowrap font-semibold text-ink">what you had.</strong>
              </p>
              <p>
                In the New Human Era, it is measured by{" "}
                <strong className="whitespace-nowrap font-semibold text-ink">
                  who you become.
                </strong>
              </p>
            </div>

            <Link
              to="/the-new-human-era"
              className="group mt-9 inline-flex w-fit items-center gap-2 whitespace-nowrap py-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] text-ink"
            >
              <span className="border-b border-lime pb-0.5">Read the New Human Era</span>
              <span
                aria-hidden
                className="text-lime transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          {/*
            One uploaded collage, kept whole: displayed at its natural aspect
            ratio so none of the four people is cropped.
          */}
          <figure className="px-6 pb-10 sm:px-10 lg:py-10 lg:pl-0 lg:pr-[max(1.5rem,calc((100vw-1500px)/2+1.5rem))]">
            <img
              src={collageImage}
              alt="Four people photographed at street level, side by side as one continuous portrait"
              loading="lazy"
              width={1786}
              height={886}
              className="h-auto w-full"
            />
          </figure>
        </div>

        {/* Bottom: six principles */}
        <div className="mx-auto max-w-[1500px] px-6 pb-14 sm:px-10 sm:pb-16 lg:pb-20">
          <div className="border-t border-ink/10 pt-8">
            <p className="text-center font-display text-[11px] font-bold uppercase tracking-[0.24em] text-ink/55">
              6 Human Principles
            </p>

            <div className="mt-8 grid gap-x-0 gap-y-8 sm:grid-cols-2 lg:grid-cols-6">
              {HOME_PRINCIPLES.map((p, i) => {
                const Icon = PRINCIPLE_ICONS[i];
                return (
                  <article
                    key={p.n}
                    className={`px-0 sm:px-6 lg:px-5 ${
                      i % 2 === 1 ? "sm:border-l sm:border-ink/12" : "sm:pl-0"
                    } ${i > 0 ? "lg:border-l lg:border-ink/12" : "lg:border-l-0"} lg:first:pl-0`}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon ? (
                        <Icon className="h-5 w-5 text-lime-dark" strokeWidth={1.25} aria-hidden />
                      ) : null}
                      <span className="font-display text-xs font-black tracking-[0.14em] text-lime-dark">
                        {p.n}
                      </span>
                    </div>
                    <h3 className="type-h4-caps mt-3 text-[1.15rem] font-extrabold leading-[1.25] text-ink">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink/65">{p.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STAY CONNECTED ---------- */}
      <SocialSection />

      {/* ---------- THE HUMAN ARCHIVE ---------- */}
      <HumanArchiveSection />

      {/* ---------- PODCAST ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 md:py-16 lg:py-24">
          {/* Compact intro */}
          <div className="max-w-2xl">
            <h2 className="type-h1-caps-light">
              The people-driven
              <br />
              CEO <span className="text-lime">Podcast</span>
            </h2>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, technology and culture — where humanity becomes the
              competitive advantage.
            </p>
          </div>

          {/* Featured episode — hero of the section */}
          <article className="mt-10 grid overflow-hidden border border-border bg-foreground/[0.03] lg:mt-12 lg:grid-cols-[0.9fr_1fr]">
            <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-[380px]">
              <img
                src={latest ? episodeImage(latest) : podcastImage}
                alt={
                  latest?.guestName
                    ? `Portrait of ${latest.guestName}`
                    : "Studio condenser microphone lit in a dark recording room"
                }
                loading="lazy"
                width={1200}
                height={900}
                className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
              />
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-9 lg:p-12">
              <p className="eyebrow text-lime">
                FEATURED EPISODE
                {latest?.episodeNumber ? ` · ${String(latest.episodeNumber).padStart(3, "0")}` : ""}
              </p>
              <h3 className="type-h3-caps-light">
                {latest ? latest.title : "Where leaders prepare for the New Human Era"}
              </h3>
              {/*
                An outage says so, rather than rendering the generic headline
                above as though nothing were wrong. The rest of this page is
                static and still true, which is the whole reason this loader
                catches instead of throwing — but the podcast section must not
                quietly imply the show has no episodes.
              */}
              {podcastUnavailable && (
                <p className="text-sm text-muted-foreground">
                  Episodes are temporarily unavailable. They are all on{" "}
                  <a
                    className="underline underline-offset-4"
                    href="https://shanejjamesgroup.podbean.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Podbean
                  </a>{" "}
                  in the meantime.
                </p>
              )}
              {latest && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {latest.guestName ? `With ${latest.guestName} — ` : ""}
                    {formatDuration(latest.durationSeconds)}
                  </p>
                  <EpisodePlayer
                    src={latest.audioUrl}
                    title={latest.title}
                    durationSeconds={latest.durationSeconds}
                    tone="ink"
                    className="max-w-md"
                  />
                </>
              )}
              <Link
                to="/podcast"
                className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-lime/90"
              >
                {latest ? "All episodes" : "Listen now"}{" "}
                <span
                  aria-hidden
                  className="text-base transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </article>

          {/* Episode list */}
          {rest.length > 0 && (
            <ul className="mt-10 border-t border-border lg:mt-12">
              {rest.map((episode: EpisodeListItem) => (
                <li key={episode.slug.current} className="border-b border-border">
                  {/*
                    Safe to wrap the whole row here, unlike the directory: these
                    rows carry no player, so there is no interactive content to
                    nest inside the anchor.
                  */}
                  <Link
                    to="/podcast/$slug"
                    params={{ slug: episode.slug.current }}
                    className="flex items-baseline gap-4 py-4 transition hover:opacity-70 sm:gap-8"
                  >
                    <span className="eyebrow w-8 shrink-0 text-muted-foreground">
                      {episode.episodeNumber ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground/85">
                      {episode.title}
                    </span>
                    <span className="eyebrow hidden shrink-0 text-muted-foreground sm:block">
                      {episode.guestName ?? ""}
                    </span>
                    <span className="eyebrow w-14 shrink-0 text-right text-muted-foreground">
                      {formatDuration(episode.durationSeconds)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Why We Exist video, as a click-to-load facade: the YouTube iframe mounts only
 * after an explicit activation of the play button (click or keyboard), so the
 * homepage payload stays free of third-party embeds until the visitor asks.
 */
function FounderVideoFigure() {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="group relative aspect-[16/9] overflow-hidden rounded-lg lg:mt-32 lg:self-center">
      {playing ? (
        <iframe
          src="https://www.youtube-nocookie.com/embed/nJShKCUuT38?autoplay=1&rel=0"
          title="Homepage"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <img
            src={founderVideoPoster}
            alt="Shane speaking directly to camera in front of a shelf of books"
            loading="lazy"
            width={1280}
            height={720}
            className="h-full w-full object-cover object-[38%_center] transition-transform duration-700 group-hover:scale-[1.02] sm:object-center"
          />
          <button
            type="button"
            aria-label="Play video"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 grid place-items-center transition-colors hover:bg-ink/10"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border border-cream/70 text-cream transition-colors group-hover:border-cream sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="ml-[2px] h-5 w-5 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      )}
    </figure>
  );
}
