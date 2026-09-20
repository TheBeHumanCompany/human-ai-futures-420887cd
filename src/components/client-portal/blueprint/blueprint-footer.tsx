import { MapleLeaf } from "@/components/maple-leaf";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * The document's sign-off — a port of `_FOOTER` in
 * `podcasts/src/podcasts/gtm_blueprint.py`, as plain React rather than an
 * `<x-import>` of the design-system bundle. That import is the reason the
 * Python page only ever worked when served beside the bundle, and the reason
 * pasting it into `content/clients.json` produced an unstyled document.
 *
 * The brand mark is a plain `<span>`, not the site's `Wordmark`: that is a
 * `<Link to="/">`, which cannot render outside a router — and the export
 * script renders these components to a string with no router at all.
 */
export function BlueprintFooter({ documentLine }: { documentLine: string }) {
  return (
    <footer className="section-ink border-t border-current/15">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start gap-10 px-6 pt-16 pb-7 sm:px-8">
        <div className="flex-[1_1_240px]">
          <span className="type-h4-caps">THE BE HUMAN COMPANY</span>
          <p className="mt-4 max-w-[34ch] text-sm text-current/60">
            Human readiness, security and governance, and intelligence strategy.
          </p>
        </div>
        <div className="flex-[1_1_240px]">
          <p className="eyebrow text-current/50">Document</p>
          <p className="mt-3 text-sm text-current/60">{documentLine}</p>
        </div>
        <p
          data-brand="indigenous-line"
          className="flex flex-[1_1_240px] items-center gap-3 text-[0.9375rem] text-current/70"
        >
          <MapleLeaf className="h-5 w-5 shrink-0 text-lime" />
          <span>{INDIGENOUS_LINE}</span>
        </p>
        <p className="font-hand ml-auto text-3xl text-lime">Stay Human.</p>
      </div>
      <div className="mx-auto w-full max-w-[1180px] border-t border-current/15 px-6 pt-6 sm:px-8">
        <p className="eyebrow tracking-[0.28em] text-current/50">
          The future belongs to the most human
        </p>
      </div>
    </footer>
  );
}
