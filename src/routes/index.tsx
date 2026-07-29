import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png";
import manifestoImage from "@/assets/manifesto.jpg";
import podcastImage from "@/assets/podcast.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";

import { Users, Shield, Target, Headphones } from "lucide-react";
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
        <div className="mx-auto max-w-[1400px] px-6 pt-12 pb-12 sm:px-8 sm:pt-16 sm:pb-14 lg:py-20">
          {/* Section label matching WHY WE EXIST */}
          <p className="font-display text-xl font-black uppercase tracking-[0.06em] text-ink sm:text-2xl">
            THE HUMAN ARCHIVE
          </p>
          <div className="mt-3 h-[5px] w-24 bg-lime" aria-hidden />

          {/* Editorial text block */}
          <div className="mt-5 max-w-4xl">
            <h2 className="display text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[0.92] text-ink">
              WHAT DOES IT MEAN
              <br />
              TO BE HUMAN?
            </h2>
            <p className="font-display mt-3 text-base font-bold uppercase tracking-[0.05em] text-ink sm:text-lg">
              WE’RE ASKING EVERYONE
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/70">
              A living, growing archive of human perspective.
            </p>

            <Link
              to="/the-human-archive"
              className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-lime px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-lime hover:text-ink sm:mt-6 sm:px-5 sm:py-2.5"
            >
              EXPLORE THE HUMAN ARCHIVE
              <span
                aria-hidden
                className="text-sm font-black text-lime transition-colors group-hover:text-ink"
              >
                →
              </span>
            </Link>
          </div>

          {/* Portrait grid — swipeable on mobile, centered row on desktop */}
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mt-10 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible lg:mt-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <p className="eyebrow text-lime">The People-Driven CEO Podcast</p>
            <h2 className="display mt-4 text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.02] tracking-[0.01em]">
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
          <div className="mt-12 bg-cream px-6 py-5 sm:px-8 sm:py-6 lg:mt-16">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-ink">
                  Available on all major platforms
                </p>
              </div>
              <div className="flex items-center gap-5" aria-label="Podcast platforms">
                {/* Spotify */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ink" aria-hidden>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                {/* Apple Podcasts */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ink" aria-hidden>
                  <path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0H5.34zm9.926 5.376c.532 0 .963.43.963.963 0 .532-.43.963-.963.963a.963.963 0 0 1-.963-.963c0-.532.43-.963.963-.963zM12 7.045c2.736 0 4.955 2.218 4.955 4.955 0 2.403-1.718 4.408-3.99 4.85l-.299 2.574c-.05.435-.41.762-.846.762h-.64c-.436 0-.796-.327-.846-.762l-.299-2.574c-2.272-.442-3.99-2.447-3.99-4.85 0-2.737 2.218-4.955 4.955-4.955zm0 1.655c-1.821 0-3.3 1.478-3.3 3.3 0 1.821 1.479 3.3 3.3 3.3s3.3-1.479 3.3-3.3c0-1.822-1.479-3.3-3.3-3.3z" />
                </svg>
                {/* YouTube */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ink" aria-hidden>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {/* RSS / more platforms */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ink" aria-hidden>
                  <path d="M6.503 20.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5zm1.5-6.5c-3.87 0-7-3.13-7-7V4c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v3c0 2.76 2.24 5 5 5h3c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-2zm1 6c-5.8 0-10.5-4.7-10.5-10.5V4c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v1c0 4.14 3.36 7.5 7.5 7.5h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
