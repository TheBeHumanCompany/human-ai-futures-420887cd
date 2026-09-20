import type { BlueprintSection } from "@/lib/client-portal/blueprint-schema";

import { BlueprintBlock, LIST_BANDS } from "./blocks";

/**
 * The blueprint as alternating editorial bands, and the locked state that sells
 * the rest of it.
 *
 * BANDS. Ink and cream alternate, following the designed deliverable
 * (`podcasts/packages/vos-and-co/blueprint/index.html`) and the band vocabulary
 * in `podcasts/src/podcasts/gtm_blueprint.py`. Four bands have a ground the
 * design fixes and the rest alternate around them — see `groundsFor`.
 *
 * The `hero` band is deliberately absent here: it is the document's masthead,
 * rendered by `BlueprintDocument` above this list, and rendering it again as
 * an ordinary numbered band would print the company name twice.
 *
 * LOCKED. A locked section renders its title and teaser and nothing else. It is
 * deliberately NOT hidden: the client seeing the titles of the eight topics they
 * have not bought is the upsell the old static page could not perform. The body
 * is already absent from the props by the time it reaches here — `applyTier`
 * strips it server-side — so there is no version of this component that could
 * leak it.
 */

/**
 * Bands whose ground the design fixes, keyed by band rather than by the
 * section number the Python renderer uses (`_FIXED_GROUND`, `:551`). The two
 * are the same rule for a blueprint in the canonical template — sections 2, 9,
 * 10 and 11 are exactly the `opportunities`, `question`, `questions` and
 * `sources` bands — but a band cannot be knocked out of its register by a
 * blueprint that numbers its sections differently, and the question band's
 * "always ink" guarantee then holds wherever the question lands.
 */
const FIXED_GROUND: Record<string, "ink" | "cream"> = {
  opportunities: "ink",
  question: "ink",
  questions: "cream",
  sources: "ink",
};

/**
 * The ground of every band, in order.
 *
 * Alternation is computed against the ground actually emitted before, not a
 * running parity, so a fixed-ground register does not knock the rest out of
 * step. Where the fixed grounds make a perfect alternation impossible the
 * clash falls on ink: the reference page runs a findings band straight into
 * the ink band below it with no seam, but never puts two cream bands together
 * — two cream bands read as one over-long band. The hero above this list is
 * ink, which is what the first alternation is measured against.
 */
export const groundsFor = (sections: readonly BlueprintSection[]): readonly ("ink" | "cream")[] => {
  let previous: "ink" | "cream" = "ink";
  return sections.map((section, index) => {
    const fixed = FIXED_GROUND[section.band];
    if (fixed) {
      previous = fixed;
      return fixed;
    }
    let ground: "ink" | "cream" = previous === "ink" ? "cream" : "ink";
    const following = sections[index + 1];
    if (ground === "cream" && following && FIXED_GROUND[following.band] === "cream") {
      ground = "ink";
    }
    previous = ground;
    return ground;
  });
};

function LockedBody({ teaser }: { teaser?: string }) {
  return (
    <div className="mt-4 border-t border-current/20 pt-4">
      <p className="eyebrow opacity-60">Included in the full blueprint</p>
      {teaser ? (
        <p className="mt-2 max-w-[52ch] text-[1.0625rem] leading-[1.55] opacity-80">{teaser}</p>
      ) : null}
    </div>
  );
}

function SectionBody({ section }: { section: BlueprintSection }) {
  if (section.locked) return <LockedBody teaser={section.teaser} />;

  const blocks = section.blocks ?? [];
  if (blocks.length === 0) return null;

  const children = blocks.map((block, i) => <BlueprintBlock key={i} block={block} />);

  // Section 10's open assumptions are a scan-list, not a reading list: the
  // design's auto-fit grid (`_questions_band`) puts them two-up so the band
  // reads as a survey of what is still unknown rather than as ten paragraphs.
  if (section.band === "questions") {
    return <ul className="mt-4 grid gap-x-14 min-[900px]:grid-cols-2">{children}</ul>;
  }

  // The opportunities are cards, three-up at the page's own max width — the
  // band the whole preliminary exists to deliver, and the one place a reader
  // compares items against each other rather than reading them in sequence.
  if (section.band === "opportunities") {
    return <div className="mt-4 grid gap-x-12 min-[1180px]:grid-cols-3">{children}</div>;
  }

  return LIST_BANDS.has(section.band) ? (
    <ul className="mt-4">{children}</ul>
  ) : (
    <div className="mt-4 max-w-[68ch] space-y-3">{children}</div>
  );
}

export function BlueprintSections({ sections }: { sections: readonly BlueprintSection[] }) {
  const bands = sections.filter((section) => section.band !== "hero");
  const grounds = groundsFor(bands);

  return (
    <>
      {bands.map((section, index) => (
        <section
          key={section.id}
          id={`section-${section.sectionKey}`}
          data-tier={section.tier}
          data-band={section.band}
          data-ground={grounds[index]}
          data-locked={section.locked ? "true" : "false"}
          className={grounds[index] === "cream" ? "section-cream" : "section-ink"}
        >
          <div className="mx-auto w-full max-w-[1180px] px-6 py-14 sm:px-8">
            <p className="eyebrow opacity-60">{String(section.ordinal).padStart(2, "0")}</p>
            <h2 className="type-h4-caps mt-2">{section.title}</h2>
            <SectionBody section={section} />
          </div>
        </section>
      ))}
    </>
  );
}
