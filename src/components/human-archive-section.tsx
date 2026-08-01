import { Link } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

function PortraitCard({
  image,
  name,
  location,
  no,
}: {
  image: string;
  name: string;
  location: string;
  no: string;
}) {
  return (
    <figure className="w-[74vw] shrink-0 snap-start sm:w-auto">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink">
        <img
          src={image}
          alt={`Portrait of ${name} from ${location}`}
          loading="lazy"
          width={800}
          height={1000}
          className="h-full w-full object-cover object-center"
        />
        <span className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/80">
          {no}
        </span>
      </div>
      <figcaption className="mt-3 text-left">
        <p className="font-display text-base font-bold uppercase tracking-[0.06em] text-ink">
          {name}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink/55">{location}</p>
        <span className="mt-3 block h-px w-[88%] bg-ink/15" aria-hidden />
      </figcaption>
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
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink sm:text-sm">
              The Human Archive
            </p>
            <div className="mt-2.5 h-[3px] w-14 bg-lime" aria-hidden />
            <h2 className="archive-question mt-6 text-[clamp(2.1rem,5.4vw,4.25rem)] text-ink">
              What does it mean
              <br />
              to be human?
            </h2>
          </div>

          {/* Right */}
          <div className="border-t border-ink/15 pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-1 lg:pl-16">
            <p className="font-display text-2xl font-bold uppercase tracking-[0.02em] text-ink sm:text-3xl md:whitespace-nowrap">
              We’re asking <span className="text-lime">Everyone</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/65 sm:text-lg">
              A living, growing archive
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
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ARCHIVE.map((person) => (
            <PortraitCard
              key={person.no}
              image={person.image}
              name={person.name}
              location={person.location}
              no={person.no}
            />
          ))}
        </div>

        {/* Archive footer */}
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/50 sm:text-[11px]">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-4 w-4 shrink-0 stroke-current"
            fill="none"
            strokeWidth="1.25"
          >
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18" />
          </svg>
          <span className="whitespace-nowrap">A global archive. Infinite perspectives.</span>
          <span className="hidden h-px flex-1 bg-ink/15 sm:block" aria-hidden />
          <span className="ml-auto whitespace-nowrap sm:ml-0">No. 0004</span>
        </div>
      </div>
    </section>
  );
}
