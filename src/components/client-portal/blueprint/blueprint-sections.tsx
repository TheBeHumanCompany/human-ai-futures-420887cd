import type { BlueprintSection } from "@/lib/client-portal/blueprint-schema";

import { BlueprintBlock, LIST_BANDS } from "./blocks";

/**
 * The blueprint as alternating editorial bands, and the locked state that sells
 * the rest of it.
 *
 * BANDS. Ink and cream alternate by position, following the designed deliverable
 * (`podcasts/packages/vos-and-co/blueprint/index.html`) and the band vocabulary
 * in `podcasts/src/podcasts/gtm_blueprint.py`. The question band is always ink
 * because it is the page's one full-bleed moment.
 *
 * LOCKED. A locked section renders its title and teaser and nothing else. It is
 * deliberately NOT hidden: the client seeing the titles of the eight topics they
 * have not bought is the upsell the old static page could not perform. The body
 * is already absent from the props by the time it reaches here — `applyTier`
 * strips it server-side — so there is no version of this component that could
 * leak it.
 */

const groundFor = (section: BlueprintSection, index: number): "ink" | "cream" =>
  section.band === "question" ? "ink" : index % 2 === 0 ? "cream" : "ink";

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

  return LIST_BANDS.has(section.band) ? (
    <ul className="mt-4">{children}</ul>
  ) : (
    <div className="mt-4 max-w-[68ch] space-y-3">{children}</div>
  );
}

export function BlueprintSections({ sections }: { sections: readonly BlueprintSection[] }) {
  return (
    <>
      {sections.map((section, index) => {
        const ground = groundFor(section, index);
        return (
          <section
            key={section.id}
            id={`section-${section.sectionKey}`}
            data-tier={section.tier}
            data-locked={section.locked ? "true" : "false"}
            className={ground === "cream" ? "section-cream" : "section-ink"}
          >
            <div className="mx-auto w-full max-w-[1180px] px-6 py-14 sm:px-8">
              <p className="eyebrow opacity-60">{String(section.ordinal).padStart(2, "0")}</p>
              <h2 className="type-h4-caps mt-2">{section.title}</h2>
              <SectionBody section={section} />
            </div>
          </section>
        );
      })}
    </>
  );
}
