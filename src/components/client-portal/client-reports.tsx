import type { ClientPage } from "@/lib/client-portal/tokens";

import { BlueprintDocument } from "./blueprint/blueprint-document";
import { PrintButton } from "./blueprint/print-button";

/**
 * One client's reports under their single URL.
 *
 * Reports stack in store order — preliminary first, the paid report (when
 * unlocked) after it — so the page is a single scroll with no navigation
 * chrome. Each report keeps its section anchor for deep links.
 *
 * The report body is deliberately width-unconstrained (`max-w-none`): the
 * authored HTML is a self-contained document that ships its own layout
 * (`.page` container, `--page-max`, gutters, breakpoints), so a site-side
 * prose measure would squeeze it into a ribbon and force its own mobile
 * breakpoint on desktop — which is exactly the "report too narrow" defect.
 * The shell matches the site's `max-w-[1180px]` page vocabulary; the
 * document centers itself within it.
 */
export function ClientReports({ page }: { page: ClientPage }) {
  // A client with a structured blueprint renders it INSTEAD of the authored
  // bodies: the sections are the same report, modelled rather than pasted, so
  // rendering both would show it twice. Clients without sections are unchanged.
  if (page.sections?.length) {
    return (
      <div className="w-full">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-end justify-between gap-4 px-6 pt-12 sm:px-8">
          <div>
            <p className="eyebrow">Private client page</p>
            <h1 className="type-h3-caps-light mt-3">{page.title}</h1>
          </div>
          <PrintButton />
        </div>
        <BlueprintDocument sections={page.sections} variant="portal" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-12 sm:px-8">
      <p className="eyebrow">Private client page</p>
      <h1 className="type-h3-caps-light mt-3">{page.title}</h1>
      {page.reports.map((report) => (
        <article key={report.id} id={`report-${report.id}`} className="mt-8">
          <h2 className="type-h4-caps">{report.title}</h2>
          <div
            className="mt-6 max-w-none space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80"
            dangerouslySetInnerHTML={{ __html: report.html }}
          />
        </article>
      ))}
    </div>
  );
}
