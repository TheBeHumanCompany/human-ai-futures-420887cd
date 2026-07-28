import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png.asset.json";
import manifestoImage from "@/assets/manifesto.jpg";
import humanAiProfile from "@/assets/human-ai-profile.jpg";
import archiveFeature from "@/assets/archive-feature.jpg";

import { Users, Shield, Target, Mic } from "lucide-react";
import { SocialSection } from "@/components/social-section";
import { PRINCIPLES } from "@/lib/content";

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
          src={heroImage.url}
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
              is <span className="text-lime">human.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/85 sm:text-lg">
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
                born with.
                <span className="mt-7 block">
                  Humanity is
                  <br />
                  what we
                  <br />
                  <span className="font-black text-lime">practice</span>.
                </span>
              </span>
              <span className="hidden sm:block">
                Being <span className="font-black text-lime">human</span> is
                <br />
                what we are
                <br />
                born with.
                <span className="mt-5 block">
                  Humanity is
                  <br />
                  what we <span className="font-black text-lime">practice</span>.
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
          <div className="max-w-2xl">
            <h2 className="display text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[0.95] text-ink">
              THE NEW HUMAN <span className="text-lime">ERA.</span>
            </h2>

            <div className="mt-4 max-w-md space-y-2 text-base leading-relaxed text-ink/75 sm:text-lg">
              <p>Status is measured by what you have.</p>
              <p>In the New Human Era, it is measured by who you are.</p>
            </div>

            <div className="mt-7 w-fit">
              <Link
                to="/the-new-human-era"
                className="group inline-flex items-center gap-5 rounded-full border border-ink/85 bg-cream py-3 pl-7 pr-3 text-ink transition-colors duration-300 hover:bg-ink hover:text-cream sm:py-3.5 sm:pl-8 sm:pr-3.5"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm">
                  Learn More
                </span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-base text-ink transition-transform duration-300 group-hover:translate-x-1 sm:h-10 sm:w-10 sm:text-lg"
                >
                  →
                </span>
              </Link>
              <span aria-hidden className="mt-3 block h-[5px] w-full rounded-full bg-lime" />
            </div>

          </div>


          {/* Six principles */}
          <div className="mt-8 border-t border-ink/15">
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
                      className="h-[2px] w-8 bg-lime transition-all duration-300 group-hover:w-12"
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




      {/* ---------- ARCHIVE + PODCAST ---------- */}
      <section className="section-cream border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr_1fr] lg:gap-12">
            {/* LEFT — THE HUMAN ARCHIVE */}
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink">
                The Human Archive
              </p>
              <span aria-hidden className="mt-2 block h-[4px] w-20 bg-lime" />
              <h2 className="display mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[0.95] text-ink">
                One question.
                <br />
                Thousands of <span className="text-lime">answers.</span>
              </h2>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/70">
                We ask one question to people around the world:
                <br />
                <span className="italic">“What does it mean to be human?”</span>
              </p>
              <Link
                to="/the-human-archive"
                className="group mt-7 inline-flex w-fit items-center gap-4 rounded-full border border-ink/85 bg-cream py-2.5 pl-6 pr-2.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-cream"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Explore the Human Archive
                </span>
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-base text-ink transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>

            {/* CENTER — ARCHIVE VISUAL */}
            <figure className="relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
                <img
                  src={archiveFeature}
                  alt="An older woman and a young man in conversation, from The Human Archive"
                  loading="lazy"
                  width={1200}
                  height={1504}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/70 bg-ink/25 text-cream backdrop-blur-sm">
                    <span aria-hidden className="ml-1 text-lg">▶</span>
                  </span>
                </span>
              </div>
              <figcaption className="mt-3 text-xs uppercase tracking-[0.16em] text-ink/55">
                From the archive · Nairobi, Kenya
              </figcaption>
            </figure>

            {/* RIGHT — PODCAST */}
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink">
                The People-Driven CEO Podcast
              </p>
              <span aria-hidden className="mt-2 block h-[4px] w-20 bg-lime" />
              <h3 className="display mt-5 text-[clamp(1.75rem,3.6vw,2.5rem)] font-extrabold leading-[1] text-ink">
                Where CEOs prepare for the New Human Era.
              </h3>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/70">
                Conversations on leadership, AI, culture, and building organizations where humanity
                becomes the competitive advantage.
              </p>

              {/* microphone + waveform */}
              <div className="mt-6 flex items-center gap-4 border-y border-ink/15 py-4">
                <Mic className="h-7 w-7 shrink-0 text-ink" strokeWidth={1.4} />
                <span aria-hidden className="flex h-8 flex-1 items-center gap-[3px]">
                  {[38, 62, 90, 54, 74, 100, 46, 82, 34, 68, 96, 50, 78, 42, 88, 58, 30, 72].map(
                    (h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-full flex-1 rounded-full ${i % 3 === 0 ? "bg-lime" : "bg-ink/25"}`}
                      />
                    ),
                  )}
                </span>
              </div>

              <Link
                to="/podcast"
                className="group mt-6 inline-flex w-fit items-center gap-4 rounded-full border border-ink/85 bg-cream py-2.5 pl-6 pr-2.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-cream"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Listen to the Podcast
                </span>
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-base text-ink transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
