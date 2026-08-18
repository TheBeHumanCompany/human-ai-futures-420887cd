import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

export const Route = createFileRoute("/human-archive/$slug")({
  loader: ({ params }) => {
    const person = ARCHIVE.find((p) => p.slug === params.slug);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Archive entry unavailable" }, { name: "robots", content: "noindex" }],
      };
    }
    const { person } = loaderData;
    const title = `${person.name} — The Human Archive`;
    const description = `Human Archive entry No. ${person.no}: ${person.name}, ${person.location}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArchiveProfile,
  notFoundComponent: MissingProfile,
});

function ArchiveProfile() {
  const { person } = Route.useLoaderData();

  return (
    <section className="section-cream">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-24">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink">
          <img
            src={person.image}
            alt={`Portrait of ${person.name} from ${person.location}`}
            width={800}
            height={1000}
            className="h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/60">
              Human Archive
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/80">
              {person.no}
            </span>
          </div>
        </div>

        <div>
          <p className="type-label-caps text-ink">The Human Archive</p>
          <div className="type-eyebrow-rule" aria-hidden />
          <h1 className="type-h2-caps mt-6 text-ink">{person.name}</h1>
          <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-ink/55">
            {person.location}
          </p>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
            This archive entry is being prepared. Soon you’ll find {person.name}’s full conversation
            here — their answer to the question we ask everyone: what does it mean to be human?
          </p>
          <Link
            to="/the-human-archive"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-90 sm:text-xs"
          >
            Back to the Human Archive
          </Link>
        </div>
      </div>
    </section>
  );
}

function MissingProfile() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[1400px] px-6 py-24 sm:px-8">
        <h1 className="type-h2-caps text-ink">Archive entry not found</h1>
        <Link
          to="/the-human-archive"
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-90 sm:text-xs"
        >
          Back to the Human Archive
        </Link>
      </div>
    </section>
  );
}
