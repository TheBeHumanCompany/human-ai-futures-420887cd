import { createFileRoute, Link } from "@tanstack/react-router";
import { PRINCIPLES } from "@/lib/content";
import { initiativeById } from "@/lib/positioning";

export const Route = createFileRoute("/the-new-human-era")({
  head: () => ({
    meta: [
      { title: "The New Human Era — Six Principles" },
      {
        name: "description",
        content:
          "Presence is the new luxury. Wisdom is the new intelligence. Six ideas defining status in the New Human Era.",
      },
      { property: "og:title", content: "The New Human Era — Six Principles" },
      {
        /*
          The previous description framed The New Human Era as the container
          the other initiatives sat inside. It is one of four peers, and it is
          a worldview — so this text comes from `positioning.ts` rather than
          being restated here, where it drifted from everything else.
        */
        property: "og:description",
        content: initiativeById("the-new-human-era").short,
      },
    ],
  }),
  component: NewHumanEra,
});

function NewHumanEra() {
  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-ink/50">The New Human Era</p>
          <h1 className="display mt-6 max-w-3xl text-[clamp(2.75rem,8vw,6rem)] text-ink">
            The new status.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
            In every generation, status changes. In the New Human Era, status shifts from what you
            own to who you become.
          </p>
        </div>
      </section>

      <section className="section-ink grain">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
          {PRINCIPLES.map((p) => (
            <article
              key={p.n}
              className="grid gap-4 border-b border-border py-10 lg:grid-cols-[auto_1fr_1fr] lg:gap-12"
            >
              <span className="eyebrow text-lime lg:w-16">{p.n}</span>
              <h2 className="display text-[clamp(2rem,4vw,3.25rem)]">{p.title}</h2>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
          <Link
            to="/contact"
            className="eyebrow mt-12 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
          >
            Join the Movement <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
