import { createFileRoute } from "@tanstack/react-router";

import { BOOKING_URL_15MIN } from "@/lib/booking";
import { INDIGENOUS_LINE } from "@/lib/brand";
import { MapleLeaf } from "@/components/maple-leaf";
import { TEAM } from "@/lib/team";

export const Route = createFileRoute("/who-we-are")({
  head: () => ({
    meta: [
      { title: "Who We Are — The Be Human Company" },
      {
        name: "description",
        content:
          "Business leadership, cybersecurity and governance, and human behaviour — the three disciplines behind every Be Human AI engagement.",
      },
      { property: "og:title", content: "Who We Are — The Be Human Company" },
      {
        property: "og:description",
        content: "No single discipline can lead AI transformation alone.",
      },
    ],
  }),
  component: WhoWeAre,
});

/**
 * `/who-we-are` — three cards, and deliberately only three.
 *
 * The scope decision here was explicit: the main cards now, per-member detail
 * pages later. So this page renders `TEAM` and nothing more; there are no
 * `/who-we-are/<member>` routes in this pass, and the card content lives in
 * `src/lib/team.ts` precisely so adding them later is a new route file rather
 * than a teardown of this one.
 */
function WhoWeAre() {
  return (
    <>
      <section className="section-cream grain border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-ink/50">Who we are</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-condensed mt-6 max-w-4xl text-ink">
            Built for human-first AI transformation
          </h1>
          <p className="type-body-lg mt-8 max-w-2xl text-ink/70">
            No single discipline can lead AI transformation alone. AI is changing how organizations
            lead, decide, govern and grow — all at once. That is why The Be Human Company brings
            business leadership, cybersecurity, governance, and human behaviour together.
          </p>
          <p className="type-body-lg mt-6 max-w-2xl text-ink/70">
            Not one generalist. Not the latest tool. A team built around the full challenge. Our
            role is not simply to implement AI — it is to help you build a stronger organization
            because of it.
          </p>

          <p className="type-body-sm mt-10 inline-flex items-center gap-2 text-ink/70">
            <MapleLeaf className="h-4 w-4 shrink-0 text-ink/70" />
            <span>{INDIGENOUS_LINE}</span>
          </p>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">The team behind your transformation</h2>
          <p className="type-body mt-6 max-w-2xl text-muted-foreground">
            We stay intentionally small, so every client works directly with the people leading the
            engagement — not a rotating account team or junior consultants.
          </p>

          <div className="mt-12 grid gap-px bg-hairline lg:grid-cols-3">
            {TEAM.map((member) => (
              <article key={member.id} data-team-member={member.id} className="bg-background p-8">
                <h3 className="type-h3-caps text-foreground">{member.name}</h3>
                <p className="eyebrow mt-3 text-lime">{member.role}</p>

                <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
                  {member.descriptors.map((descriptor) => (
                    <li
                      key={descriptor}
                      className="text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      {descriptor}
                    </li>
                  ))}
                </ul>

                <div className="type-body-sm mt-6 space-y-4 text-muted-foreground">
                  {member.bio.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="type-h2-condensed max-w-3xl text-ink">One team. One shared purpose.</h2>
          <p className="type-body mt-6 max-w-2xl text-ink/70">
            AI helps us research faster, analyze more deeply, and execute more efficiently. It
            expands our capability. It never replaces our accountability.
          </p>
          <p className="type-body mt-4 max-w-2xl text-ink/70">
            AI will continue to evolve. Human leadership will continue to matter. Together, we help
            Canadian organizations adopt AI responsibly, strengthen their people, protect what
            matters, and build for what comes next.
          </p>

          <a
            href={BOOKING_URL_15MIN}
            target="_blank"
            rel="noreferrer"
            className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream"
          >
            Book a call <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </>
  );
}
