import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

function PortraitCard({
  image,
  name,
  location,
  no,
  slug,
}: {
  image: string;
  name: string;
  location: string;
  no: string;
  slug: string;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);

  return (
    <figure className="group w-[74vw] shrink-0 snap-start transition-[flex-grow,flex-basis] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-auto lg:min-w-0 lg:flex-[1_1_0%] lg:hover:flex-[1.16_1_0%] lg:focus-within:flex-[1.16_1_0%]">
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
        className="block cursor-pointer rounded-md outline-none transition-transform duration-300 ease-out focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:scale-[0.99]"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink">
          <img
            src={image}
            alt={`Portrait of ${name} from ${location}`}
            loading="lazy"
            width={800}
            height={1000}
            className="h-full w-full object-cover object-center transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10 group-focus-within:bg-ink/10" />
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-cream/75">
              The Human Archive
            </span>
            <span className="font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-cream/75">
              No. {no}
            </span>
          </div>
        </div>
        <figcaption className="mt-3 text-left">
          <p className="font-display text-base font-bold uppercase tracking-[0.06em] text-ink">
            {name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink/55">{location}</p>
        </figcaption>

      </Link>
    </figure>
  );
}

export function HumanArchiveSection() {
  return (
    <section className="section-cream border-t border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
        {/* Intro */}
        <div className="grid gap-8 md:grid-cols-[1.35fr_1fr] md:gap-0">
          {/* Left */}
          <div className="md:pr-12 lg:pr-16">
            <p className="section-label section-label-light text-[15px] sm:text-base lg:text-lg">
              THE HUMAN ARCHIVE
            </p>
            <div className="section-label-rule" aria-hidden />
            <h2 className="archive-question mt-5 sm:mt-6 lg:mt-8 text-[clamp(2.1rem,5.4vw,4.25rem)] text-ink">
              What does it mean
              <br />
              to be human?
            </h2>
          </div>

          {/* Right */}
          <div className="border-t border-ink/15 pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0 lg:pl-16">
            <p className="text-base leading-relaxed text-ink/65 sm:text-lg">
              A growing archive
              <br />
              of human perspective.
            </p>
            <Link
              to="/the-human-archive"
              className="mt-6 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-lime px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-90 sm:text-xs"
            >
              Explore the Human Archive
              <span aria-hidden className="text-sm font-black">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Portraits */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:flex lg:snap-none lg:items-start [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ARCHIVE.map((person) => (
            <PortraitCard
              key={person.no}
              image={person.image}
              name={person.name}
              location={person.location}
              no={person.no}
              slug={person.slug}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
