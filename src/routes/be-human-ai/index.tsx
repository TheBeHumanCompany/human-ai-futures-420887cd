import { createFileRoute } from "@tanstack/react-router";

import { BlueprintSectionView, BlueprintSubnav } from "@/components/blueprint";
import { MapleLeaf } from "@/components/maple-leaf";
import { BLUEPRINT_SECTIONS, FOUNDING_RATE, FUTURE_RATE, TURNAROUND } from "@/lib/blueprint";
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
 * All sixteen sections must be present and in the order the source document
 * puts them, and they must not all be equally loud — the previous version was
 * described as information overload, and a flat wall of sixteen would be worse.
 * Those are only compatible if presence and prominence are separate concerns,
 * so the section spine and every word of copy live in `src/lib/blueprint.ts`
 * and `docs/blueprint-sections.json`, and this file is layout.
 *
 * The practical effect is that "digestible" cannot be achieved by deletion. The
 * tests read the same fixture the page renders, and the ordered-id assertion
 * goes red the moment a section is dropped to make the page feel shorter.
 */
export const Route = createFileRoute("/be-human-ai/")({
  head: () => ({
    meta: [
      { title: "The Be Human AI Blueprint — Executive AI Assessment & 90-Day Plan" },
      {
        name: "description",
        content: `An executive AI assessment and 90-day transformation plan in ${TURNAROUND}. Founding organization rate ${FOUNDING_RATE}, future rate ${FUTURE_RATE}.`,
      },
      {
        property: "og:title",
        content: "The Be Human AI Blueprint — Executive AI Assessment & 90-Day Plan",
      },
      {
        property: "og:description",
        content: "Human judgment leads. AI accelerates execution.",
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
          <p className="eyebrow text-lime">Human + AI transformation</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-caps mt-6 max-w-5xl">
            Artificial intelligence will change every business.
          </h1>

          {/* The leaf is a sibling of the text node, not a decoration parked
              elsewhere in the hero — it marks this specific line, and the DOM
              distance between the two is measured to prove it still does. The
              copy comes from the shared constant, which supersedes the source
              PDF's own wording of this line. */}
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
