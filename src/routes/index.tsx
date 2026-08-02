import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png";
import founderVideoPoster from "@/assets/why-we-exist-video.jpg";
import podcastImage from "@/assets/podcast.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";

import { Users, Shield, Target } from "lucide-react";
import { SocialSection } from "@/components/social-section";
import { HumanArchiveSection } from "@/components/human-archive-section";
import { EPISODES, PRINCIPLES } from "@/lib/content";

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
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[38%_62%] lg:gap-16 lg:px-14 lg:py-24">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(2.2rem,8.5vw,3rem)] font-extrabold uppercase leading-[1.06] tracking-[0.01em] text-ink sm:text-[clamp(2.9rem,6.1vw,3.8rem)] lg:text-[clamp(3rem,4.2vw,4.9rem)] lg:leading-[1.04]">
              Being human is
              <br />
              what we are
              <br />
              born with
              <span className="mt-10 block sm:mt-12">
                Humanity is
                <br />
                what we
                <br />
                practice
              </span>
            </h2>

            <p className="section-label section-label-light mt-12 text-[15px] sm:mt-14 sm:text-base lg:text-lg">
              WHY WE EXIST
            </p>
            <div className="section-label-rule mt-5 sm:mt-6" aria-hidden />

            <p className="mt-8 max-w-md text-base leading-relaxed text-ink/75 sm:mt-9 sm:text-lg">
              We exist to help build a future where humanity becomes our greatest strength.
            </p>
          </div>

          <figure className="group relative aspect-[16/9] overflow-hidden rounded-lg">
            <img
              src={founderVideoPoster}
              alt="Shane speaking directly to camera in a warmly lit room with BE HUMAN lettering on the wall"
              loading="lazy"
              width={1600}
              height={912}
              className="h-full w-full object-cover object-[38%_center] transition-transform duration-700 group-hover:scale-[1.02] sm:object-center"
            />
            <button
              type="button"
              aria-label="Play video"
              className="absolute inset-0 grid place-items-center transition-colors hover:bg-ink/10"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-cream/70 text-cream transition-colors group-hover:border-cream sm:h-16 sm:w-16">
                <svg viewBox="0 0 24 24" className="ml-[2px] h-5 w-5 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
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
            <p className="section-label section-label-dark text-[15px] sm:text-base lg:text-lg">
              OUR SOLUTION
            </p>
            <h2 className="display mt-5 sm:mt-6 lg:mt-8 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92]">
              BE HUMAN <span className="text-lime">AI</span>
            </h2>
            <p className="mt-6 max-w-[17.5rem] text-base leading-relaxed text-foreground/80 sm:max-w-sm">
              We help organizations prepare for the AI era by strengthening their people, protecting
              what matters, and transforming how work gets done.
            </p>
            <Link
              to="/be-human-ai"
              className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-lime px-6 py-3 text-xs font-medium uppercase tracking-widest text-foreground transition-colors hover:bg-lime hover:text-ink sm:mt-8 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              EXPLORE BE HUMAN AI <span aria-hidden className="text-lime transition-colors group-hover:text-ink">→</span>
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
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 sm:py-20 lg:py-28">
          {/* Top: split intro */}
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
            <div>
              <p className="section-label section-label-light text-[15px] sm:text-base lg:text-lg">
                THE NEW HUMAN ERA
              </p>
              <div className="section-label-rule" aria-hidden />

              <h2 className="display mt-5 text-[clamp(2.5rem,7vw,4.75rem)] font-extrabold leading-[0.95] tracking-[0.01em] text-ink sm:mt-6 lg:mt-8">
                THE NEW HUMAN <span className="text-lime">ERA</span>
              </h2>

              <div className="mt-7 max-w-md space-y-4 text-base leading-relaxed text-ink/70 sm:text-lg lg:mt-8 lg:space-y-5">
                <p>For generations, status was measured by what you had.</p>
                <p>In the New Human Era, it is measured by who you become.</p>
              </div>

              <Link
                to="/the-new-human-era"
                className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-ink/25 px-7 py-3.5 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:border-lime hover:bg-lime sm:px-8 sm:text-sm lg:mt-10"
              >
                Learn More
                <span aria-hidden className="text-base transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <figure className="relative overflow-hidden">
              <img
                src={newHumanEraImage}
                alt="A woman looking out over the Vancouver skyline and North Shore mountains at dusk"
                loading="lazy"
                width={1280}
                height={1600}
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </figure>
          </div>

          {/* Bottom: six principles */}
          <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-14">
            {PRINCIPLES.map((p) => (
              <article key={p.n} className="group max-w-sm">
                <div className="flex items-center gap-4">
                  <span className="font-display text-xl font-black tracking-[0.04em] text-lime sm:text-2xl">
                    {p.n}
                  </span>
                  <span
                    aria-hidden
                    className="h-[2px] w-8 bg-lime transition-all duration-300 group-hover:w-14"
                  />
                </div>
                <h3 className="display mt-4 text-[clamp(1.2rem,2.4vw,1.5rem)] font-extrabold leading-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{p.body}</p>
              </article>
            ))}
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
            <p className="section-label section-label-dark text-[15px] sm:text-base lg:text-lg">
              THE PEOPLE-DRIVEN CEO PODCAST
            </p>
            <h2 className="display mt-5 sm:mt-6 lg:mt-8 whitespace-nowrap text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.02] tracking-[0.01em]">
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
        </div>
      </section>

    </>
  );
}
