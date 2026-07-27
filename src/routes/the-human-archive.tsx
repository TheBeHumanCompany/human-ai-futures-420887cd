import { createFileRoute } from "@tanstack/react-router";
import { ARCHIVE } from "@/lib/content";

export const Route = createFileRoute("/the-human-archive")({
  head: () => ({
    meta: [
      { title: "The Human Archive — Real Stories. Real Humans." },
      {
        name: "description",
        content:
          "A growing archive of conversations, experiences and perspectives exploring what it means to be human.",
      },
      { property: "og:title", content: "The Human Archive — Real Stories. Real Humans." },
      {
        property: "og:description",
        content: "Documentary portraits and conversations from around the world.",
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-ink/50">The Human Archive</p>
          <h1 className="display mt-6 text-[clamp(2.75rem,8vw,6rem)] text-ink">
            Real stories.
            <br />
            Real humans.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
            We ask people around the world one question: what does it mean to be human? These are
            some of the answers.
          </p>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-24">
          {ARCHIVE.map((person) => (
            <figure key={person.name}>
              <img
                src={person.image}
                alt={`Portrait of ${person.name} from ${person.location}`}
                loading="lazy"
                width={800}
                height={1000}
                className="aspect-[4/5] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
              />
              <figcaption className="mt-4">
                <p className="eyebrow text-muted-foreground">{person.location}</p>
                <p className="display mt-2 text-2xl">{person.name}'s story</p>
                <p className="mt-1 text-sm text-muted-foreground">{person.story}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
