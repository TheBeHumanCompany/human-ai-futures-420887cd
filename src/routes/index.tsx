import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png";
import manifestoImage from "@/assets/manifesto.jpg";
import podcastImage from "@/assets/podcast.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";

import { Users, Shield, Target } from "lucide-react";
import { EpisodePlayer } from "@/components/episode-player";
import { SocialSection } from "@/components/social-section";
import { ARCHIVE, PRINCIPLES } from "@/lib/content";
import { formatDuration, getEpisodes, selectFeatured } from "@/lib/podbean";

export const Route = createFileRoute("/")({
  loader: async () => ({ featured: selectFeatured(await getEpisodes()) }),
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
  const { featured } = Route.useLoaderData();
  const [latest, ...rest] = featured;

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
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/85 sm:text-lg">
              We help people and organizations practice what keeps us human in a world becoming more
              artificial.
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
              EXPLORE BE HUMAN AI{" "}
              <span aria-hidden className="text-lime transition-colors group-hover:text-ink">
                →
              </span>
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
                    Prepare your team with the skills, mindset, and confidence to thrive alongside
                    AI.
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
          <div className="max-w-2xl">
            <h2 className="display text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[0.95] text-ink">
              THE NEW HUMAN <span className="text-lime">ERA</span>
            </h2>

            <div className="mt-4 max-w-md space-y-2 text-base leading-relaxed text-ink/75 sm:text-lg">
              <p>Status is measured by what you have.</p>
              <p>In the New Human Era, it is measured by who you are.</p>
            </div>

            <Link
              to="/the-new-human-era"
              className="group relative mt-6 inline-flex w-fit items-baseline gap-4 px-2 py-1.5 font-display text-sm font-medium uppercase tracking-[0.12em] text-ink sm:text-base"
            >
              <span>LEARN MORE</span>
              <span
                aria-hidden
                className="inline-block self-center text-xl font-black leading-none text-[oklch(0.79_0.22_118)] transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
              <span
                aria-hidden
                className="absolute bottom-[-7px] left-2 h-[2.5px] w-[55%] bg-[oklch(0.79_0.22_118)] transition-all duration-300 group-hover:w-[68%]"
              />
            </Link>
          </div>

          {/* Six principles */}
          <div className="mt-8 border-t border-ink/15">
            <div className="grid gap-px bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <article key={p.n} className="group bg-cream px-5 py-5 sm:px-6 lg:py-6">
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
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-ink/50">The Human Archive</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] text-ink">
                Real stories
                <br />
                Real humans
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-ink/70">
              A growing archive of conversations, experiences and perspectives exploring what it
              means to be human.
            </p>
          </div>

          <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
            {ARCHIVE.map((person) => (
              <figure key={person.name} className="w-[70vw] shrink-0 snap-start sm:w-72">
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
                <figcaption className="mt-4">
                  <p className="eyebrow text-ink/45">{person.location}</p>
                  <p className="display mt-2 text-2xl text-ink">{person.name}'s story</p>
                  <p className="mt-1 text-sm text-ink/65">{person.story}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <Link
            to="/the-human-archive"
            className="eyebrow link-underline mt-10 inline-flex items-center gap-2 text-ink"
          >
            Explore the Human Archive <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ---------- PODCAST ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="min-w-0">
            <p className="eyebrow text-lime">The People-Driven CEO Podcast</p>
            <h2 className="display mt-6 text-[clamp(2.25rem,5vw,4rem)]">
              Where leaders prepare
              <br />
              for the New Human Era
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, AI, culture and building organizations where humanity
              becomes the competitive advantage.
            </p>

            {latest && (
              <div className="mt-10 border-t border-border pt-6">
                <p className="eyebrow text-muted-foreground">
                  Featured episode
                  {latest.episodeNumber
                    ? ` · ${String(latest.episodeNumber).padStart(3, "0")}`
                    : ""}
                </p>
                <h3 className="display mt-3 text-3xl">{latest.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {latest.guest ? `With ${latest.guest} — ` : ""}
                  {formatDuration(latest.durationSeconds)}
                </p>
                <EpisodePlayer
                  src={latest.audioUrl}
                  title={latest.title}
                  durationSeconds={latest.durationSeconds}
                  tone="ink"
                  className="mt-6 max-w-md"
                />
              </div>
            )}

            {rest.length > 0 && (
              <ul className="mt-10 border-t border-border">
                {rest.map((episode) => (
                  <li
                    key={episode.guid}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-4"
                  >
                    <span className="eyebrow shrink-0 text-muted-foreground">
                      {episode.episodeNumber ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground/85">
                      {episode.title}
                    </span>
                    <span className="eyebrow shrink-0 text-muted-foreground">
                      {formatDuration(episode.durationSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              to="/podcast"
              className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-ink"
            >
              {latest ? "All episodes" : "Listen now"} <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="relative min-h-[280px] overflow-hidden">
            <img
              src={podcastImage}
              alt="Studio condenser microphone lit in a dark recording room"
              loading="lazy"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
