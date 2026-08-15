import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

function PortraitCard({
  image,
  name,
  location,
  no,
  quote,
  active,
  onActivate,
  onDeactivate,
  onInView,
}: {
  image: string;
  name: string;
  location: string;
  no: string;
  quote: string;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onInView: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.72) onInView();
      },
      { threshold: [0, 0.4, 0.72, 0.95], rootMargin: "-8% 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onInView]);


  return (
    <figure
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onMouseLeave={onDeactivate}
      onBlur={onDeactivate}
      className={[
        "group w-[86vw] shrink-0 snap-center transition-[flex-grow,flex-basis,padding] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "sm:w-auto lg:min-w-0",
        active ? "lg:flex-[1.34_1_0%]" : "lg:flex-[1_1_0%]",
        active ? "lg:pt-0" : "lg:pt-8",
      ].join(" ")}
    >
      <div
        ref={ref}
        className="relative aspect-4/5 overflow-hidden rounded-lg bg-ink"
      >
        <img
          src={image}
          alt={`Portrait of ${name} from ${location}`}
          loading="lazy"
          width={800}
          height={1000}
          className={[
            "h-full w-full object-cover object-center brightness-[1.04] contrast-[1.08] saturate-[0.95]",
            "transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            active ? "lg:scale-[1.03]" : "",
          ].join(" ")}
        />
        {/* soft cinematic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 34%, transparent 0%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.45) 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-ink/45 to-transparent" />

        {/* archive marker */}
        <div className="pointer-events-none absolute left-5 top-5 flex flex-col gap-2">
          <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.24em] text-cream/80">
            The Human Archive
          </span>
          <span className="h-px w-6 bg-cream/50" aria-hidden />
          <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.24em] text-cream/80">
            No. {no}
          </span>
        </div>

        {/* quote — only on the active card */}
        <blockquote
          aria-hidden={!active}
          className="pointer-events-none invisible absolute left-5 top-[46%] max-w-[80%] translate-y-3 whitespace-pre-line font-display text-[clamp(1.1rem,2.2vw,1.6rem)] font-light uppercase leading-[1.18] tracking-[0.02em] text-cream opacity-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] transition-all duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[active=true]:visible data-[active=true]:translate-y-0 data-[active=true]:opacity-100"
          data-active={active ? "true" : "false"}
        >
          {quote}
        </blockquote>

        {/* name / location on image */}
        <figcaption className="pointer-events-none absolute inset-x-5 bottom-5 text-left">
          <p className="font-display text-[clamp(1rem,1.5vw,1.25rem)] font-bold uppercase leading-none tracking-[0.12em] text-cream">
            {name}
          </p>
          <p className="mt-2 font-mono text-[9.5px] uppercase leading-none tracking-[0.22em] text-cream/70">
            {location}
          </p>
        </figcaption>
      </div>
    </figure>
  );
}



export function HumanArchiveSection() {
  const DEFAULT_ACTIVE = 1;
  const [hovered, setHovered] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState<number | null>(null);
  const active = hovered ?? scrolled ?? DEFAULT_ACTIVE;

  const handleInView = (i: number) => {
    if (typeof window === "undefined") return;
    // Only the small/tablet carousel drives the active card via scroll position.
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    setScrolled(i);
  };


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
              What does it
              <br />
              mean to
              <br />
              be <span className="text-lime">human</span>?
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
                className="group mt-8 inline-flex w-fit items-center gap-2 py-1 text-sm font-semibold uppercase tracking-[0.12em] text-ink sm:mt-10"
              >
                <span className="border-b border-lime pb-0.5">Explore the Human Archive</span>
                <span aria-hidden className="text-lime transition-transform group-hover:translate-x-1">
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
              quote={person.quote}
              active={active === i}
              onActivate={() => setHovered(i)}
              onDeactivate={() => setHovered(null)}
              onInView={() => handleInView(i)}
            />
          ))}
        </div>

        {/* Swipe cue — mobile only */}
        <div className="mt-5 flex items-center gap-3 sm:hidden" aria-hidden>
          <span className="h-px w-8 bg-ink/25" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-ink/45">
            Swipe
          </span>
          <span className="text-sm text-ink/40">→</span>
        </div>

      </div>
    </section>
  );
}
