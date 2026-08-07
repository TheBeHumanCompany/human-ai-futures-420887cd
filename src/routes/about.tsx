import { createFileRoute, Link } from "@tanstack/react-router";
import manifestoImage from "@/assets/manifesto.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Be Human Company" },
      {
        name: "description",
        content:
          "An AI strategy and transformation company, and a cultural movement. Being human is what we're born with. Humanity is what we practise.",
      },
      { property: "og:title", content: "About — The Be Human Company" },
      {
        property: "og:description",
        content:
          "Why we exist, what we believe, and how the movement and the practice fit together.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-ink/50">About</p>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] text-ink">
            Being human is what we're born with. Humanity is what we practise.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
            As technology becomes more powerful, humanity must become more intentional. We exist to
            help people and organizations become more capable with AI while becoming more deliberate
            about their humanity.
          </p>
          <p className="font-hand mt-10 text-3xl text-ink/70">Stay Human.</p>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="eyebrow text-lime">One company, two halves</p>
            <h2 className="display mt-6 text-4xl lg:text-5xl">A practice and a movement.</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Be Human AI is our commercial practice: AI readiness, governance, agents and
              leadership work for organizations preparing for the AI era.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The New Human Era is our cultural work: the archive, the podcast and the ideas that
              keep the human question in front of the technology question.
            </p>
            <Link
              to="/be-human-ai"
              className="eyebrow link-underline mt-8 inline-flex items-center gap-2"
            >
              Explore Be Human AI <span aria-hidden>→</span>
            </Link>
          </div>
          <img
            src={manifestoImage}
            alt="Friends talking together on a rooftop at sunset"
            loading="lazy"
            width={1408}
            height={912}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>
    </>
  );
}
