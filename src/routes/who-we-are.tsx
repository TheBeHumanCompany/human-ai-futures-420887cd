import { createFileRoute } from "@tanstack/react-router";

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
    <section className="section-ink">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
        {/* This label opens the page, so it is the h1 even though it is set at kicker
            size: `type-label-caps` is the treatment, not the rank. Member names below
            are h2 for the same reason — they are the page's second level, and
            `type-h3-caps` only describes how they look. */}
        <h1 className="type-label-caps text-lime">The team behind your transformation</h1>
        <p className="type-body mt-6 max-w-2xl text-muted-foreground">
          We stay intentionally small, so every client works directly with the people leading the
          engagement — not a rotating account team or junior consultants.
        </p>

        <div className="mt-12 grid gap-px bg-hairline lg:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.id} data-team-member={member.id} className="bg-background p-8">
              <h2 className="type-h3-caps text-foreground">{member.name}</h2>
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
  );
}
