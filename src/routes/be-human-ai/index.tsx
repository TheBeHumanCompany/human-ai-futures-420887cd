import { createFileRoute } from "@tanstack/react-router";

import { BlueprintSectionView, BlueprintSubnav } from "@/components/blueprint";
import { MapleLeaf } from "@/components/maple-leaf";
import { BLUEPRINT_SECTIONS } from "@/lib/blueprint";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * `/be-human-ai` — the Blueprint page, as a directory index rather than a leaf.
 *
 * ── Why this file is `index.tsx` ──────────────────────────────────────────────
 *
 * It used to be `src/routes/be-human-ai.tsx`. Adding `be-human-ai/<pillar>.tsx`
 * beside a leaf file promotes that leaf to their *layout* route — and this one
 * renders no `<Outlet/>`, so all three pillar pages would have mounted and
 * displayed nothing: a 200, a correct title, and an empty body. This repo has
 * already been bitten by the same trap in the other direction, which is why
 * `podcast_.$slug.tsx` carries a trailing-underscore escape. As a directory
 * index this stays a leaf and the pillars are siblings.
 *
 * ── Why the page is assembled from data ───────────────────────────────────────
 *
 * The section spine and every word of copy live in `src/lib/blueprint.ts` and
 * `docs/blueprint-sections.json`, and this file is layout.
 *
 * That split was originally there to stop sections being deleted to make the
 * page feel shorter. As of 2026-08-22 the page is deliberately shorter — it no
 * longer sells the Blueprint — and the split earns its keep for a different
 * reason: `docs/blueprint-claims.json` maps public claims onto section ids and
 * on to controls in the framework, so a section that disappears orphans its
 * claims loudly in the tests rather than quietly on the page.
 */
export const Route = createFileRoute("/be-human-ai/")({
  head: () => ({
    meta: [
      { title: "The Be Human Intelligence Blueprint — For Select Organizations" },
      {
        name: "description",
        content:
          "Human readiness, governance and sovereignty, and intelligence strategy. We work with a small number of organizations at a time.",
      },
      {
        property: "og:title",
        content: "The Be Human Intelligence Blueprint — For Select Organizations",
      },
      {
        property: "og:description",
        content: "Human judgment leads. The machines accelerate execution.",
      },
    ],
  }),
  component: Blueprint,
});

function Blueprint() {
  return (
    <>
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="type-label-caps text-lime">Be Human Intelligence</p>
              <span className="type-eyebrow-rule block" aria-hidden />
            </div>

            {/*
              The exclusivity line, and the reason this page stopped selling.
              It sits in the hero rather than only in the closing section so a
              visitor who never scrolls still learns that engagements are
              limited — which is the whole positioning, not a footnote to it.
            */}
            <p
              data-blueprint-exclusivity="true"
              className="eyebrow max-w-[17rem] leading-loose text-muted-foreground sm:text-right"
            >
              We work with a small number of organizations at a time
            </p>
          </div>

          <h1 className="type-h1-caps mt-10 max-w-5xl">
            Machine intelligence will change every business.
          </h1>

          <p className="type-body-lg mt-8 max-w-2xl text-foreground/85">
            The Blueprint is how we take an organization from scattered, unmanaged use of these
            systems to one clear position on them &mdash; across the people who have to change, the
            data that has to stay protected, and the work that has to get faster.
          </p>

          {/* The leaf is a sibling of the text node, not a decoration parked
              elsewhere in the hero — it marks this specific line, and the DOM
              distance between the two is measured to prove it still does. */}
          <p
            data-brand="indigenous-line"
            className="type-body-lg mt-8 inline-flex items-center gap-2 text-foreground/85"
          >
            <MapleLeaf className="h-5 w-5 shrink-0 text-lime" />
            <span>{INDIGENOUS_LINE}</span>
          </p>
        </div>
      </section>

      <section className="section-cream">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-4 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            {BLUEPRINT_SECTIONS.map((section) => (
              <BlueprintSectionView key={section.id} section={section} />
            ))}
          </div>

          {/* The one page on the site with a second nav. Placed after the
              content in source order so a screen reader or a no-CSS reader
              meets the page itself first. */}
          <aside className="lg:col-start-1 lg:row-start-1 lg:py-14">
            <BlueprintSubnav sections={BLUEPRINT_SECTIONS} />
          </aside>
        </div>
      </section>
    </>
  );
}
