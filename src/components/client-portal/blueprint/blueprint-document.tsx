import type { BlueprintSection, TitleBlock } from "@/lib/client-portal/blueprint-schema";

import { BlueprintFooter } from "./blueprint-footer";
import { BlueprintSections } from "./blueprint-sections";
import { BlueprintHero } from "./hero";

/**
 * The blueprint, as one document — the single design, rendered once.
 *
 * Before this component the same content had three renderers: a Python
 * f-string page that only worked when served beside the design-system bundle,
 * the portal's section list (correct React, but no masthead, no cards and no
 * sign-off), and a hand-written PDF emitter that printed Helvetica. This is
 * what replaces all three: the portal mounts it live, and
 * `scripts/export-blueprint.ts` renders the very same element to a string with
 * the app's own compiled stylesheet, so the file an operator emails and the
 * page a client opens are the same document.
 *
 * `variant` toggles CHROME ONLY. The portal supplies its own header and the
 * export has none, so the export grows a running head; no band may look
 * different between the two, because then the export would stop being a
 * screenshot of the portal and start being a fourth renderer.
 */

export type BlueprintVariant = "portal" | "export";

/** The hero band carries exactly one `title` block; anything else has none. */
export const titleOf = (sections: readonly BlueprintSection[]): TitleBlock | null => {
  const hero = sections.find((section) => section.band === "hero");
  const block = hero?.blocks?.[0];
  return block?.type === "title" ? (block as TitleBlock) : null;
};

export const documentLineOf = (title: TitleBlock) =>
  `${title.company} — preliminary outside-in blueprint · ${title.assessmentDate}`;

export function BlueprintDocument({
  sections,
  variant,
}: {
  sections: readonly BlueprintSection[];
  variant: BlueprintVariant;
}) {
  const title = titleOf(sections);
  const documentLine = title ? documentLineOf(title) : "Preliminary outside-in blueprint";

  return (
    <article className="section-ink">
      {variant === "export" ? (
        <header className="section-ink sticky top-0 z-20 border-b border-current/15">
          <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6 py-3.5 sm:px-8">
            <span className="type-h4-caps">THE BE HUMAN COMPANY</span>
            <p className="eyebrow text-current/50">{documentLine}</p>
          </div>
        </header>
      ) : null}

      {title ? <BlueprintHero title={title} /> : null}
      <BlueprintSections sections={sections} />
      <BlueprintFooter documentLine={documentLine} />
    </article>
  );
}
