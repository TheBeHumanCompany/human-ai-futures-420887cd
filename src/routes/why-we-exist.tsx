import { createFileRoute, Link } from "@tanstack/react-router";

import manifestoImage from "@/assets/manifesto.jpg";

export const Route = createFileRoute("/why-we-exist")({
  head: () => ({
    meta: [
      { title: "Why We Exist — The Be Human Company" },
      {
        name: "description",
        content:
          "As technology becomes more powerful, humanity has to become more intentional. Why this company exists, and what it is for.",
      },
      { property: "og:title", content: "Why We Exist — The Be Human Company" },
      {
        property: "og:description",
        content: "Being human is what we're born with. Humanity is what we practice.",
      },
    ],
  }),
  component: WhyWeExist,
});

/**
 * `/why-we-exist` — the mission half of the About menu.
 *
 * "About" is a label in the nav, not a page: its two destinations are this
 * one and `/who-we-are`. This page argues *why*; that one introduces *who*.
 *
 * The existing `/about` route is deliberately left in place and untouched. The
 * plan recommends folding it into this URL behind a 301, but that changes a
 * live, indexed URL and the decision has not been made — so this route is
 * additive, and `/about` keeps working exactly as it did.
 */
function WhyWeExist() {
  return (
    <>
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">Why we exist</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-prose mt-6 max-w-4xl text-ink">
            Being human is what we're born with. Humanity is what we practice.
          </h1>
          <p className="type-body-lg mt-8 max-w-xl text-ink/70">
            As technology becomes more powerful, humanity has to become more intentional. We exist
            to help people and organizations become more capable with AI while becoming more
            deliberate about their humanity.
          </p>
          {/* Maya asked for the signature in brand lime. This band is cream, where
              `--lime` lands at ~1.3:1 — `text-lime-dark` is the same hue at the
              lightness the cream side is designed for. */}
          <p className="font-hand mt-10 text-3xl text-lime-dark">Stay Human.</p>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <p className="type-label-caps text-lime">The problem we kept running into</p>
          <h2 className="type-h2-condensed mt-6 max-w-3xl">
            AI does not improve organizations. It reveals them.
          </h2>
          <div className="type-body mt-8 grid max-w-5xl gap-8 text-muted-foreground lg:grid-cols-2">
            <p>
              Artificial intelligence is already inside most businesses. Employees are using it.
              Competitors are investing in it. The question was never whether AI becomes part of an
              organization — it already has. The real question is whether the organization is
              intentionally shaping AI, or whether AI is quietly reshaping the organization without
              a strategy.
            </p>
            <p>
              Align an organization first and AI compounds that alignment. Leave it fragmented and
              AI compounds the fragmentation just as fast. That is why we start with leadership and
              people rather than tools — and why the greatest risk is not falling behind, but moving
              forward without a plan for where human judgment still has to lead.
            </p>
          </div>
        </div>
      </section>

      <section className="section-ink border-t border-border">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="type-label-caps text-lime">One company, two halves</p>
            <h2 className="type-h2-condensed mt-6">A practice and a movement.</h2>
            <p className="type-body mt-6 text-muted-foreground">
              Be Human AI is our commercial practice: AI readiness, governance, agents and
              leadership work for organizations preparing for the AI era.
            </p>
            <p className="type-body mt-4 text-muted-foreground">
              The New Human Era is our cultural work: the archive, the podcast and the ideas that
              keep the human question in front of the technology question. Neither half works
              without the other — a practice with no point of view sells tools, and a movement with
              no practice never has to be right about anything.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <Link
                to="/be-human-ai"
                className="eyebrow link-underline inline-flex items-center gap-2"
              >
                Explore Be Human AI <span aria-hidden>→</span>
              </Link>
              <Link
                to="/who-we-are"
                className="eyebrow link-underline inline-flex items-center gap-2"
              >
                Meet the team <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
          <img
            src={manifestoImage}
            alt="Friends talking together on a rooftop at sunset"
            loading="lazy"
            width={1408}
            height={912}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        </div>
      </section>
    </>
  );
}
