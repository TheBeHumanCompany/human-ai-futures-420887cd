import { Link } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

function ArchiveCard({
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
    <figure className="w-[78vw] shrink-0 snap-center sm:w-auto">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink">
        <img
          src={image}
          alt={`Portrait of ${name} from ${location}`}
          loading="lazy"
          width={800}
          height={1000}
          className="h-full w-full object-cover object-center grayscale transition-all duration-700 hover:grayscale-0"
        />
        <figcaption className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-cream/85 sm:left-4 sm:top-4">
          <span className="block">The Human Archive</span>
          <span className="block">{no}</span>
        </figcaption>
      </div>
      <div className="mt-3 text-left sm:mt-4">
        <p className="font-display text-sm font-bold uppercase tracking-[0.05em] text-ink">
          {name}
        </p>
        <p className="mt-0.5 text-xs tracking-wide text-ink/60 sm:text-sm">{location}</p>
      </div>
    </figure>
  );
}

export function HumanArchiveSection() {
  return (
    <section className="section-cream border-t border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-8 sm:py-16 lg:py-20">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-start md:gap-12 lg:gap-16">
          {/* Left column */}
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink sm:text-sm">
              The Human Archive
            </p>
            <div className="mt-2.5 h-[3px] w-14 bg-lime" aria-hidden />
            <h2 className="archive-question mt-6 text-[clamp(2.25rem,6vw,4.5rem)] text-ink sm:mt-7">
              What does it mean
              <br />
              to be human?
            </h2>
          </div>

          {/* Right panel */}
          <div className="rounded-2xl bg-cream-deep p-6 sm:p-7 lg:p-8">
            <p className="font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl lg:text-2xl">
              We’re asking <span className="text-lime">Everyone</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              A living, growing archive
              <br className="hidden sm:block" /> of human perspective.
            </p>
            <Link
              to="/the-human-archive"
              className="mt-6 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-lime px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-xs"
            >
              Explore the Human Archive
              <span aria-hidden className="text-base font-black">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Portrait row */}
        <div className="-mx-6 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:mt-16 lg:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ARCHIVE.map((person) => (
            <ArchiveCard
              key={person.no}
              image={person.image}
              name={person.name}
              location={person.location}
              no={person.no}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
