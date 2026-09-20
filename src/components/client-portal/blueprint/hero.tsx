import type { TitleBlock } from "@/lib/client-portal/blueprint-schema";

/**
 * The document's masthead — a port of `_hero` in
 * `podcasts/src/podcasts/gtm_blueprint.py`, from the same data the Python
 * renderer parses out of the draft.
 *
 * Ink ground with the film grain, because this is the one band the reader
 * meets before they know what the document is. Everything below it is numbered
 * and alternates; this one is not numbered and never moves.
 *
 * The meta cells are a `dl`, not a table and not four paragraphs: each is a
 * label and its value, which is what a description list is, and it is what
 * lets `Purpose` — a sentence rather than a name — take a full row without a
 * second layout.
 */

const MetaCell = ({ label, value, wide }: { label: string; value: string; wide?: boolean }) => (
  <div className={`bg-ink px-6 py-5 ${wide ? "flex-[1_1_100%]" : "flex-[1_1_200px]"}`}>
    <dt className="eyebrow text-current/50">{label}</dt>
    <dd className="mt-2.5 text-[0.9375rem] leading-[1.55]">{value}</dd>
  </div>
);

export function BlueprintHero({ title }: { title: TitleBlock }) {
  return (
    <section className="section-ink grain" data-band="hero">
      <div className="relative z-2 mx-auto w-full max-w-[1180px] px-6 pt-22 pb-18 sm:px-8">
        <p className="eyebrow text-lime">
          Strategic intelligence — preliminary outside-in blueprint
        </p>
        <h1 className="type-h1-caps-light mt-7 max-w-[18ch]">{title.company}</h1>
        <p className="type-body-lg mt-8 max-w-[58ch]">{title.thesis}</p>

        <dl className="mt-14 flex flex-wrap gap-px border border-current/15 bg-current/15">
          <MetaCell label="Prepared for" value={title.preparedFor} />
          <MetaCell label="Prepared by" value={title.preparedBy} />
          <MetaCell label="Assessment date" value={title.assessmentDate} />
          <MetaCell label="Purpose" value={title.purpose} wide />
        </dl>

        {title.disclaimer ? (
          <p className="mt-8 max-w-[72ch] text-[0.9375rem] leading-[1.6] text-current/60">
            {title.disclaimer}
          </p>
        ) : null}
      </div>
    </section>
  );
}
