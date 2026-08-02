import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

function PortraitCard({
  image,
  name,
  location,
  no,
  slug,
  quote,
  featured,
}: {
  image: string;
  name: string;
  location: string;
  no: string;
  slug: string;
  quote: string;
  featured: boolean;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);

  return (
    <figure
      className={[
        "group w-[68vw] shrink-0 snap-start transition-[flex-grow,flex-basis] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "sm:w-auto lg:min-w-0",
        featured ? "lg:flex-[1.34_1_0%]" : "lg:flex-[1_1_0%]",
        "lg:hover:flex-[1.34_1_0%]! lg:focus-within:flex-[1.34_1_0%]!",
        featured ? "lg:pt-0" : "lg:pt-8",
      ].join(" ")}
    >
      <Link
        to="/human-archive/$slug"
        params={{ slug }}
        aria-label={`View ${name}'s Human Archive profile`}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          swiping.current = false;
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          if (Math.abs(e.clientX - start.current.x) > 10) swiping.current = true;
        }}
        onClick={(e) => {
          if (swiping.current) e.preventDefault();
        }}
        className="block cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
      >
        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-ink">
          <img
            src={image}
            alt={`Portrait of ${name} from ${location}`}
            loading="lazy"
            width={800}
            height={1000}
            className="h-full w-full object-cover object-center brightness-[0.72] contrast-[1.12] saturate-[0.85] transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035] group-hover:brightness-[0.82] group-focus-within:scale-[1.035] group-focus-within:brightness-[0.82]"
          />
          {/* cinematic vignette + base darkening */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(115% 85% at 50% 32%, transparent 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.82) 100%)",
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-ink via-ink/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-ink/70 to-transparent" />

          {/* archive marker */}
          <div className="pointer-events-none absolute left-5 top-5 flex flex-col gap-2">
            <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.24em] text-cream/70">
              The Human Archive
            </span>
            <span className="h-px w-6 bg-cream/40" aria-hidden />
            <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.24em] text-cream/70">
              No. {no}
            </span>
          </div>

          {/* quote — hover / focus */}
          <blockquote className="pointer-events-none absolute left-5 top-[46%] max-w-[80%] whitespace-pre-line font-display text-[clamp(1.1rem,2.2vw,1.6rem)] font-light uppercase leading-[1.18] tracking-[0.02em] text-cream opacity-0 transition-all duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-3 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            {quote}
          </blockquote>


          {/* name / location on image */}
          <figcaption className="pointer-events-none absolute inset-x-5 bottom-5 text-left">
            <p className="font-display text-[clamp(1rem,1.5vw,1.25rem)] font-bold uppercase leading-none tracking-[0.12em] text-cream">
              {name}
            </p>
            <p className="mt-2 font-mono text-[9.5px] uppercase leading-none tracking-[0.22em] text-cream/60">
              {location}
            </p>
          </figcaption>
        </div>
      </Link>
    </figure>
  );
}


export function HumanArchiveSection() {
  return (
    <section className="section-cream border-t border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 sm:py-20 lg:py-28">
        {/* Intro */}
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-0">
          {/* Label — mobile only, sits above the title */}
          <div className="md:hidden">
            <p className="section-label section-label-light text-[15px]">THE HUMAN ARCHIVE</p>
            <div className="section-label-rule" aria-hidden />
          </div>

          {/* Title */}
          <div className="md:order-1 md:pr-12 lg:pr-16">
            <h2 className="archive-question text-[clamp(2.3rem,9vw,3.5rem)] text-ink md:text-[5vw] lg:text-[clamp(2.3rem,6.4vw,5.4rem)]">
              What does it mean
              <br />
              to be human?
            </h2>
          </div>

          <div className="md:order-2 md:border-l md:border-ink/15 md:pl-12 lg:pl-16">
            <div className="md:pt-4 lg:pt-8">
              <p className="section-label section-label-light hidden text-base md:block lg:text-lg">
                THE HUMAN ARCHIVE
              </p>
              <div className="section-label-rule hidden md:block" aria-hidden />
              <p className="text-base leading-relaxed text-ink/60 md:mt-8 lg:mt-9 lg:whitespace-nowrap lg:text-[17px]">
                A growing archive of real, human perspective.
              </p>
              <Link
                to="/the-human-archive"
                className="mt-8 inline-flex w-fit items-center gap-2.5 whitespace-nowrap rounded-full bg-lime px-7 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink shadow-[0_1px_0_0_rgba(0,0,0,0.06)] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:opacity-95 sm:mt-10 sm:text-xs"
              >
                Explore the Human Archive
                <span aria-hidden className="text-sm font-black">
                  →
                </span>
              </Link>
            </div>
          </div>

        </div>

        {/* Portraits */}
        <div className="mt-14 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto pb-2 sm:mt-16 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible lg:mt-20 lg:flex lg:snap-none lg:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ARCHIVE.map((person, i) => (
            <PortraitCard
              key={person.no}
              image={person.image}
              name={person.name}
              location={person.location}
              no={person.no}
              slug={person.slug}
              quote={person.quote}
              featured={i === 1}

            />
          ))}
        </div>
      </div>
    </section>
  );
}
