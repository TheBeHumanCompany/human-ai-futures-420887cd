/**
 * Native, brand-aligned rendering of the illustrative Key Findings Report
 * and AI Opportunity Recommendations documents. Content mirrors the original
 * report mockups; no new findings or figures are introduced.
 */
const PILLARS = ["Operational Opportunities", "Efficiency & Automation", "Revenue Growth", "Risk & Governance"];
const AREAS: Array<[string, number]> = [
  ["Operations", 28],
  ["Marketing", 20],
  ["IT / Data", 17],
  ["People", 10],
  ["Sales", 10],
];
const RECS = ["Workflow Automation", "Customer Experience", "Data & Knowledge Systems", "Revenue & Growth", "Governance & Compliance"];

function Cover() {
  return (
    <div className="flex w-full flex-col md:min-h-[34rem] bg-cream p-6 text-ink sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-ink/15 pb-4">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">The Be Human Company</p>
        <p className="text-right font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-ink/60">AI Readiness Assessment</p>
      </div>
      <span className="mt-8 block h-[3px] w-10 bg-lime" />
      <h5 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.01em]">Key Findings<br />Report</h5>
      <p className="mt-5 max-w-[24ch] font-sans text-sm leading-snug text-ink/75">AI opportunities, readiness, and a 30-60-90 roadmap for your business.</p>
      <ul className="mt-10 md:mt-auto grid grid-cols-2 border-t border-ink/15">
        {PILLARS.map((p, i) => (
          <li key={p} className={`flex items-start gap-2 py-3 font-sans text-[11px] font-semibold leading-tight ${i % 2 ? "pl-3" : "border-r border-ink/15 pr-3"} ${i < 2 ? "border-b border-ink/15" : ""}`}>
            <span className="mt-[3px] block size-1.5 shrink-0 bg-lime" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Recommendations() {
  return (
    <div className="w-full bg-cream p-6 text-ink sm:p-8">
      <div className="flex items-center justify-between border-b border-ink/15 pb-4">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Key Findings Report</p>
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-ink/60">Section 03</p>
      </div>
      <h5 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-bold uppercase leading-[0.95]">AI Opportunity<br />Recommendations</h5>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55">Opportunity by area</p>
          <ul className="mt-3 space-y-2.5">
            {AREAS.map(([a, v], i) => (
              <li key={a}>
                <div className="flex justify-between font-sans text-xs font-medium"><span>{a}</span><span className="font-semibold tabular-nums">{v}%</span></div>
                <div className="mt-1 h-1.5 bg-ink/10"><div className={`h-full ${i === 0 ? "bg-lime" : "bg-ink"}`} style={{ width: `${(v / 28) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55">Recommended priorities</p>
          <ol className="mt-2">
            {RECS.map((r, i) => (
              <li key={r} className="flex items-baseline gap-3 border-b border-ink/15 py-2 font-sans text-xs font-semibold last:border-b-0">
                <span className="font-display text-[10px] text-ink/45 tabular-nums">{String(i + 1).padStart(2, "0")}</span>{r}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function ReportShowcase() {
  return (
    <div className="relative md:pb-8">
      <div className="relative w-[90%] ring-1 ring-ink/10 md:w-[44%]" role="img" aria-label="Illustrative Key Findings Report cover">
        <Cover />
      </div>
      <div className="relative -mt-4 ml-auto w-[92%] shadow-[0_20px_40px_-24px_rgb(0_0_0/0.6)] ring-1 ring-ink/10 md:absolute md:right-0 md:mt-0 md:bottom-[-2rem] md:w-[60%]" role="img" aria-label="Illustrative AI opportunity recommendations">
        <Recommendations />
      </div>
    </div>
  );
}
