import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png";
import manifestoImage from "@/assets/manifesto.jpg";
import podcastImage from "@/assets/podcast.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";

import { Users, Shield, Target, Headphones } from "lucide-react";
import {
  siApplepodcasts,
  siSpotify,
  siIheartradio,
  siCastbox,
  siRss,
  siPocketcasts,
} from "simple-icons";
import { SocialSection } from "@/components/social-section";
import { ARCHIVE, EPISODES, PRINCIPLES } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Be Human Company — The Future Is Human." },
      {
        name: "description",
        content:
          "AI readiness, governance, agents and leadership. We help organizations become AI-ready without losing what makes them human.",
      },
      { property: "og:title", content: "The Be Human Company — The Future Is Human." },
      {
        property: "og:description",
        content:
          "AI strategy and transformation for the New Human Era. Being human is what we're born with. Humanity is what we practise.",
      },
    ],
  }),
  component: Home,
});

function Home() {
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
            <h1 className="display text-[clamp(3.5rem,11vw,8.5rem)]">
              The future
              <br />
              is <span className="text-lime">human</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/85 sm:text-lg lg:max-w-xl">
              We help people and organizations practice what keeps us human in a world becoming
              more artificial.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- WHY WE EXIST ---------- */}
      <section className="section-cream border-b border-ink/10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 pt-14 pb-8 sm:px-8 sm:pb-14 lg:grid-cols-[2fr_3fr] lg:gap-12 lg:py-20">
          <div className="min-w-0">
            <p className="font-display text-xl sm:text-2xl font-black uppercase tracking-[0.06em] text-ink">
              WHY WE EXIST
            </p>
            <div className="mt-3 h-[5px] w-24 bg-lime" aria-hidden />
            <p className="mt-8 w-full max-w-none font-display text-[clamp(2rem,9.75vw,2.45rem)] font-black uppercase leading-[0.92] tracking-[0.01em] text-ink sm:text-[clamp(2.75rem,8vw,3.5rem)] lg:text-[clamp(1.875rem,3.8vw,3.25rem)]">
              <span className="sm:hidden">
                Being <span className="font-black text-lime">human</span> is
                <br />
                what we are
                <br />
                born with
                <span className="mt-7 block">
                  Humanity is
                  <br />
                  what we
                  <br />
                  <span className="font-black text-lime">practice</span>
                </span>
              </span>
              <span className="hidden sm:block">
                Being <span className="font-black text-lime">human</span> is
                <br />
                what we are
                <br />
                born with
                <span className="mt-5 block">
                  Humanity is
                  <br />
                  what we <span className="font-black text-lime">practice</span>
                </span>
              </span>
            </p>
          </div>

          <figure className="group relative aspect-[2/1] overflow-hidden shadow-[0_28px_70px_-22px_rgba(0,0,0,0.22)] ring-1 ring-ink/[0.07]">
            <img
              src={manifestoImage}
              alt="Friends talking together on a rooftop at sunset"
              loading="lazy"
              width={1408}
              height={912}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 grid place-items-center bg-ink/20">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-cream/80 text-cream shadow-[0_12px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors group-hover:bg-lime group-hover:text-ink">
                ▶
              </span>
            </div>
          </figure>
        </div>
      </section>

      {/* ---------- BE HUMAN AI ---------- */}
      <section id="be-human-ai" className="section-ink relative isolate overflow-hidden border-t border-border">
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
            <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-lime">
              OUR SOLUTION
            </p>
            <h2 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92]">
              BE HUMAN <span className="text-lime">AI</span>
            </h2>
            <p className="mt-6 max-w-[17.5rem] text-base leading-relaxed text-foreground/80 sm:max-w-sm">
              We help organizations prepare for the AI era by strengthening their people, protecting
              what matters, and transforming how work gets done.
            </p>
            <Link
              to="/be-human-ai"
              className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-lime px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground transition-colors hover:bg-lime hover:text-ink sm:mt-8 sm:px-6 sm:py-3 sm:text-sm"
            >
              EXPLORE BE HUMAN AI <span aria-hidden className="text-lime transition-colors group-hover:text-ink">→</span>
            </Link>
          </div>

          {/* centre spacer reserved for the portrait layer */}
          <div className="hidden lg:block" aria-hidden />

          {/* RIGHT COLUMN — CAPABILITIES */}
          <div className="mt-64 flex flex-col justify-center sm:mt-40 lg:mt-0">


            <div className="border-t border-border">
              <div className="flex gap-5 py-7">
                <Users className="mt-0.5 h-6 w-6 shrink-0 text-lime" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em] text-lime">
                    HUMAN READINESS
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Prepare your team with the skills, mindset, and confidence to thrive alongside AI.
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
                    <br />
                    & SOVEREIGNTY
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Protect your data, reduce risk, and build AI on a foundation of trust.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-border">
              <div className="flex gap-5 py-7">
                <Target className="mt-0.5 h-6 w-6 shrink-0 text-lime" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em] text-lime">
                    AI STRATEGY & TRANSFORMATION
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
                    Identify opportunities, redesign workflows, and implement AI that delivers
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
        <div className="mx-auto max-w-[1400px] px-6 pt-12 pb-10 sm:px-8 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
          {/* Intro */}
          <div className="max-w-3xl">
            <h2 className="display text-[clamp(2.25rem,7vw,4.25rem)] font-extrabold leading-[0.95] tracking-[0.01em] text-ink lg:whitespace-nowrap">
              THE NEW HUMAN <span className="text-lime">ERA</span>
            </h2>

            <div className="mt-5 h-[2px] w-16 bg-lime" aria-hidden />

            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink/75 sm:text-lg lg:mt-7 lg:space-y-5">
              <p>
                For generations, status was measured by{" "}
                <span className="font-bold text-ink">what&nbsp;you&nbsp;had</span>.
              </p>
              <p>
                In the New Human Era, it is measured by{" "}
                <span className="font-bold text-ink">who&nbsp;you&nbsp;become</span>.
              </p>
            </div>

            <Link
              to="/the-new-human-era"
              className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-lime px-6 py-3 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-lime hover:text-ink sm:px-8 sm:py-3.5 sm:text-sm lg:mt-8"
            >
              LEARN MORE
              <span
                aria-hidden
                className="text-base font-black text-lime transition-colors group-hover:text-ink sm:text-lg"
              >
                →
              </span>
            </Link>
          </div>


          {/* Six principles */}
          <div className="mt-10 border-t border-ink/15 lg:mt-12">
            <div className="grid gap-px bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <article
                  key={p.n}
                  className="group bg-cream px-5 py-5 sm:px-6 lg:py-6"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-xl font-black tracking-[0.04em] text-lime [text-shadow:0_0_0.6px_currentColor] sm:text-2xl">
                      {p.n}
                    </span>
                    <span
                      aria-hidden
                      className="h-[2px] w-7 bg-lime transition-all duration-300 group-hover:w-12"
                    />
                  </div>
                  <h3 className="display mt-2.5 text-[clamp(1.25rem,3vw,1.5rem)] font-extrabold leading-tight text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-snug text-ink/65">{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ---------- STAY CONNECTED ---------- */}
      <SocialSection />




      {/* ---------- THE HUMAN ARCHIVE ---------- */}
      <section className="section-cream border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 pt-10 pb-14 sm:px-8 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20">
          {/* Section label */}
          <div className="mb-6 lg:mb-8">
            <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-ink">
              THE HUMAN ARCHIVE
            </p>
            <div className="mt-3 h-[4px] w-20 bg-lime" aria-hidden />
          </div>

          {/* Editorial header — split on desktop, aligned tops */}
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left side */}
            <div>
              <h2 className="display text-[clamp(2.5rem,6.5vw,5rem)] leading-[0.92] text-ink">
                WHAT DOES IT MEAN
                <br />
                TO BE HUMAN?
              </h2>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-start lg:pl-4">
              <p className="font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl lg:text-2xl">
                WE’RE ASKING <span className="text-lime">EVERYONE</span>
              </p>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/70 sm:text-xl/relaxed">
                A living, growing archive of human perspective.
              </p>

              <Link
                to="/the-human-archive"
                className="group mt-6 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-lime px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-lime hover:text-ink sm:mt-7 sm:px-6 sm:py-3 sm:text-sm"
              >
                EXPLORE THE HUMAN ARCHIVE
                <span
                  aria-hidden
                  className="text-base font-black text-lime transition-colors group-hover:text-ink sm:text-lg"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Portrait grid — swipeable on mobile, centered row on desktop */}
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mt-12 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible lg:mt-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ARCHIVE.map((person, i) => (
              <figure
                key={`archive-${i}`}
                className="w-[calc(100%-3rem)] shrink-0 snap-start sm:w-auto"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                  <img
                    src={person.image}
                    alt={`Portrait of ${person.name} from ${person.location}`}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  />
                </div>
                <figcaption className="mt-3 sm:mt-4">
                  <p className="font-display text-sm font-bold uppercase tracking-[0.04em] text-ink">
                    {person.name}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-ink/60">
                    {person.location}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

        </div>
      </section>

      {/* ---------- PODCAST ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 md:py-16 lg:py-24">
          {/* Compact intro */}
          <div className="max-w-2xl">
            <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-lime">
              THE PEOPLE-DRIVEN CEO PODCAST
            </p>
            <h2 className="display mt-5 whitespace-nowrap text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.02] tracking-[0.01em]">
              Leadership for the New Human Era
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, AI and culture — where humanity becomes the competitive
              advantage.
            </p>
          </div>

          {/* Featured episode — hero of the section */}
          <article className="mt-10 grid overflow-hidden border border-border bg-foreground/[0.03] lg:mt-12 lg:grid-cols-[0.9fr_1fr]">
            <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-[380px]">
              <img
                src={podcastImage}
                alt="Studio condenser microphone lit in a dark recording room"
                loading="lazy"
                width={1200}
                height={900}
                className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
              />
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-9 lg:p-12">
              <p className="eyebrow text-lime">Featured episode</p>
              <h3 className="display text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.05]">
                What your people already know about AI
              </h3>
              <p className="text-sm text-muted-foreground">With Amara Chen, COO — 56 min</p>
              <Link
                to="/podcast"
                className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-lime/90"
              >
                Listen now{" "}
                <span aria-hidden className="text-base transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </article>

          {/* Episode list */}
          <ul className="mt-10 border-t border-border lg:mt-12">
            {EPISODES.map((e) => (
              <li
                key={e.n}
                className="flex items-baseline gap-4 border-b border-border py-4 sm:gap-8"
              >
                <span className="eyebrow w-8 shrink-0 text-muted-foreground">{e.n}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/85">{e.title}</span>
                <span className="eyebrow hidden shrink-0 text-muted-foreground sm:block">
                  {e.guest}
                </span>
                <span className="eyebrow w-14 shrink-0 text-right text-muted-foreground">
                  {e.length}
                </span>
              </li>
            ))}
          </ul>


          {/* Platform availability block */}
          <div className="mt-12 bg-cream px-6 py-6 sm:px-8 sm:py-7 lg:mt-16">
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <p className="font-display text-sm font-black uppercase tracking-[0.06em] text-ink">
                  Available on all major platforms
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6" aria-label="Podcast platforms">
                {/* Apple Podcasts */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-1.1 5.3c.04-.27.28-.47.55-.47h1.1c.27 0 .51.2.55.47l.55 4.7c.04.34-.2.65-.53.72l-.36.08c-.34.07-.62-.16-.66-.5l-.25-2.14-.25 2.14c-.04.34-.32.57-.66.5l-.36-.08c-.33-.07-.57-.38-.53-.72l.55-4.7z" />
                </svg>
                {/* Broadcast / Radio */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-2.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm0-4c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z" />
                </svg>
                {/* Spotify */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.85c-.18.3-.56.4-.85.22-2.34-1.43-5.29-1.76-8.76-.96-.33.08-.66-.13-.74-.45-.08-.33.13-.66.45-.74 3.82-.9 7.1-.51 9.74 1.11.29.18.38.56.16.82zm1.24-2.75c-.23.36-.7.48-1.06.25-2.68-1.65-6.76-2.13-9.92-1.17-.4.12-.82-.11-.94-.5-.12-.4.11-.82.5-.94 3.6-1.09 8.08-.56 11.17 1.35.36.23.48.7.25 1.01zm.11-2.86c-3.22-1.91-8.53-2.09-11.6-1.15-.47.14-.97-.13-1.11-.6-.14-.47.13-.97.6-1.11 3.5-1.06 9.34-.85 13.05 1.35.45.26.59.84.33 1.28-.26.44-.83.59-1.27.23z" />
                </svg>
                {/* Amazon Music */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-4.1c0-.55-.45-1-1-1s-1 .45-1 1v4.1c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-7c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v2.6c.42-.38.97-.6 1.55-.6 1.66 0 2.95 1.45 2.95 3.1v2.4zM9 9.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v7c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-7zm-2.5 0c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v7c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-7z" />
                </svg>
                {/* iHeartRadio */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  <path d="M12 5c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1zm-3.5 2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1zm7 0c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1z" />
                </svg>
                {/* Castbox */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7zm0 2c-2.76 0-5 2.24-5 5s2.24 5 5 5c.83 0 1.5-.67 1.5-1.5S12.83 14.5 12 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
                {/* RSS */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M4.5 17.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5zM4 11c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1zm0-4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1zm2 2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1zm3 3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1z" />
                </svg>
                {/* Pocket Casts */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7 0 2.76-1.6 5.15-3.92 6.3-.16-.68-.52-1.28-1.02-1.73.9-.72 1.44-1.82 1.44-3.07 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.25.54 2.35 1.44 3.07-.5.45-.86 1.05-1.02 1.73C5.6 17.15 4 14.76 4 12c0-3.87 3.13-7 7-7z" />
                </svg>
                {/* Boomplay */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-ink" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5h-5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5zm0-3h-5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5zm0-3h-5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
