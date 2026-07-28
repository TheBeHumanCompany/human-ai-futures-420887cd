import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero.png.asset.json";
import manifestoImage from "@/assets/manifesto.jpg";
import podcastImage from "@/assets/podcast.jpg";
import { ARCHIVE, EPISODES, PRINCIPLES, SERVICES } from "@/lib/content";

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
      <section className="section-cream border-b border-border">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:py-24">
          <div className="min-w-0">
            <p className="eyebrow text-ink/50">Why we exist</p>
            <p className="mt-8 font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.88] tracking-[0.01em] text-ink">
              Being human is what
              <br />
              we are born with.
            </p>
            <p className="mt-3 font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.88] tracking-[0.01em] text-ink">
              Humanity is what
              <br />
              we <span className="text-lime">practise</span>.
            </p>
          </div>

          <figure className="group relative aspect-[4/3] overflow-hidden">
            <img
              src={manifestoImage}
              alt="Friends talking together on a rooftop at sunset"
              loading="lazy"
              width={1408}
              height={912}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 grid place-items-center bg-ink/20">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-cream/70 text-cream backdrop-blur-sm transition-colors group-hover:bg-lime group-hover:text-ink">
                ▶
              </span>
            </div>
          </figure>
        </div>
      </section>

      {/* ---------- BE HUMAN AI ---------- */}
      <section id="be-human-ai" className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 border-b border-border pb-14 lg:grid-cols-[1.1fr_1fr] lg:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-ink/50">Be Human AI · Our practice</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,6vw,5rem)] text-ink">
                Build an organization
                <br />
                ready for the AI era.
              </h2>
            </div>
            <div>
              <p className="max-w-md text-base leading-relaxed text-ink/70">
                We help organizations strengthen their people, protect what matters and transform
                how work gets done.
              </p>
              <Link
                to="/be-human-ai"
                className="eyebrow link-underline mt-7 inline-flex items-center gap-2 text-ink"
              >
                Explore Be Human AI <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-px bg-hairline-dark sm:grid-cols-2">
            {SERVICES.map((s) => (
              <article
                key={s.n}
                className="group bg-cream p-8 transition-colors hover:bg-cream-deep lg:p-12"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="eyebrow text-ink/40">{s.n}</span>
                  <span
                    aria-hidden
                    className="text-ink/30 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
                <h3 className="display mt-8 text-3xl text-ink lg:text-4xl">{s.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/70">{s.body}</p>
                <ul className="mt-7 space-y-2">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="border-t border-hairline-dark pt-2 text-xs uppercase tracking-widest text-ink/55"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- THE NEW HUMAN ERA ---------- */}
      <section className="section-ink grain border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-lime">The New Human Era</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,6vw,5rem)]">The new status.</h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              In every generation, status changes. In the New Human Era, it shifts from what you own
              to who you become. Six ideas we return to in every room we walk into.
            </p>
          </div>

          <div className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <article key={p.n} className="bg-background p-8 lg:p-10">
                <span className="eyebrow text-lime">{p.n}</span>
                <h3 className="display mt-6 text-3xl">{p.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </article>
            ))}
          </div>

          <Link
            to="/the-new-human-era"
            className="eyebrow link-underline mt-12 inline-flex items-center gap-2"
          >
            Explore the New Human Era <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ---------- THE HUMAN ARCHIVE ---------- */}
      <section className="section-cream border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-ink/50">The Human Archive</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] text-ink">
                Real stories.
                <br />
                Real humans.
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
              for the New Human Era.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Conversations on leadership, AI, culture and building organizations where humanity
              becomes the competitive advantage.
            </p>

            <div className="mt-10 border-t border-border pt-6">
              <p className="eyebrow text-muted-foreground">Featured episode · 013</p>
              <h3 className="display mt-3 text-3xl">
                What your people already know about AI
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                With Amara Chen, COO — 56 min
              </p>
              <Link
                to="/podcast"
                className="eyebrow mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-ink"
              >
                Listen now <span aria-hidden>→</span>
              </Link>
            </div>

            <ul className="mt-10 border-t border-border">
              {EPISODES.map((e) => (
                <li
                  key={e.n}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-4"
                >
                  <span className="eyebrow shrink-0 text-muted-foreground">{e.n}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground/85">
                    {e.title}
                  </span>
                  <span className="eyebrow shrink-0 text-muted-foreground">{e.length}</span>
                </li>
              ))}
            </ul>
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

      {/* ---------- FINAL CTA ---------- */}
      <section className="section-cream grain border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-24 text-center sm:px-8 lg:py-32">
          <p className="eyebrow text-ink/50">Work with us</p>
          <h2 className="display mx-auto mt-8 max-w-4xl text-[clamp(2.5rem,7vw,6rem)] text-ink">
            Prepare your organization for the New Human Era.
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="eyebrow inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-cream transition-transform hover:-translate-y-0.5"
            >
              Work With Be Human AI <span aria-hidden>→</span>
            </Link>
            <Link
              to="/the-new-human-era"
              className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink/30 px-8 py-4 text-ink transition-colors hover:border-ink"
            >
              Join the Movement
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
