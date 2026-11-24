/**
 * Native, brand-aligned rendering of the illustrative Key Findings Report
 * and AI Opportunity Recommendations documents. All figures are sample
 * values for illustration only — not client data or guaranteed outcomes.
 */
const READINESS: Array<[string, number]> = [
  ["Strategy & leadership", 3.5],
  ["Data & knowledge", 2.5],
  ["Process maturity", 3],
  ["People & skills", 2],
  ["Technology stack", 3.5],
];
const FINDINGS: Array<[string, string]> = [
  ["Operational opportunities", "Repeat admin work across scheduling, quoting and reporting consumes senior time."],
  ["Efficiency & automation", "Five recurring workflows are strong candidates for agent-assisted automation."],
  ["Revenue growth", "Faster follow-up and content systems can lift lead conversion and retention."],
  ["Risk & governance", "No AI-use policy yet; sensitive data handling needs clear human sign-off."],
];
const AREAS: Array<[string, number]> = [
  ["Operations", 28],
  ["Marketing", 20],
  ["IT / Data", 17],
  ["Finance", 15],
  ["People", 10],
  ["Sales", 10],
];
const IMPACT: Array<[string, number]> = [
  ["Q1", 18], ["Q2", 38], ["Q3", 62], ["Q4", 85],
];
const RECS: Array<[string, string]> = [
  ["Workflow automation", "High"],
  ["Customer experience", "High"],
  ["Data & knowledge systems", "Med"],
  ["Revenue & growth", "Med"],
  ["Governance & compliance", "Ongoing"],
];
const ROADMAP: Array<[string, string]> = [
  ["30 days", "Policy, quick wins, team onboarding"],
  ["60 days", "Automate top workflows, build knowledge base"],
  ["90 days", "Scale agents, measure ROI, refine"],
];
const METRICS: Array<[string, string]> = [
  ["12–18 hrs", "Est. time saved / week"],
  ["$85K", "Est. annual cost savings"],
  ["+22%", "Potential productivity gain"],
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55">{children}</p>
);
const Tag = () => (
  <span className="border border-ink/25 px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/60">Illustrative</span>
);

function Header({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/15 pb-4">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">{left}</p>
      <p className="text-right font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-ink/60">{right}</p>
    </div>
  );
}

function KeyFindings() {
  return (
    <div className="w-full bg-cream p-6 text-ink sm:p-8">
      <Header left="The Be Human Company" right="AI Readiness Assessment" />
      <span className="mt-6 block h-[3px] w-10 bg-lime" />
      <h5 className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold uppercase leading-[0.92] tracking-[-0.01em]">Key Findings<br />Report</h5>

      <div className="mt-6 border-t border-ink/15 pt-4">
        <Eyebrow>Executive summary</Eyebrow>
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-ink/80">A well-run business with strong leadership buy-in, held back by manual processes and scattered knowledge. The fastest returns sit in operations and follow-up.</p>
      </div>

      <div className="mt-5 border-t border-ink/15 pt-4">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Business & AI readiness</Eyebrow>
          <span className="font-display text-sm font-bold tabular-nums">2.9 / 5 <Tag /></span>
        </div>
        <ul className="mt-3 space-y-2">
          {READINESS.map(([a, v]) => (
            <li key={a} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 font-sans text-xs font-medium">
              <span>{a}</span><span className="tabular-nums text-ink/60">{v.toFixed(1)}</span>
              <div className="col-span-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`h-1.5 flex-1 ${n <= v ? "bg-ink" : n - 0.5 === v ? "bg-ink/45" : "bg-ink/10"}`} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-ink/15">
        {FINDINGS.map(([t, d]) => (
          <div key={t} className="border-b border-ink/15 py-3 last:border-b-0">
            <p className="flex items-center gap-2 font-sans text-xs font-semibold"><span className="block size-1.5 shrink-0 bg-lime" />{t}</p>
            <p className="mt-1 pl-3.5 font-sans text-xs leading-relaxed text-ink/70">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Donut() {
  const r = 36, c = 2 * Math.PI * r;
  let acc = 0;
  const shades = ["var(--color-lime)", "var(--color-ink)", "color-mix(in oklab, var(--color-ink) 70%, transparent)", "color-mix(in oklab, var(--color-ink) 50%, transparent)", "color-mix(in oklab, var(--color-ink) 32%, transparent)", "color-mix(in oklab, var(--color-ink) 18%, transparent)"];
  return (
    <svg viewBox="0 0 100 100" className="size-20 shrink-0 -rotate-90 sm:size-28" aria-hidden>
      {AREAS.map(([a, v], i) => {
        const len = (v / 100) * c;
        const el = <circle key={a} cx="50" cy="50" r={r} fill="none" strokeWidth="16" stroke={shades[i]} strokeDasharray={`${len - 0.8} ${c}`} strokeDashoffset={-acc} />;
        acc += len;
        return el;
      })}
    </svg>
  );
}

function Recommendations() {
  const shades = ["bg-lime", "bg-ink", "bg-ink/70", "bg-ink/50", "bg-ink/30", "bg-ink/20"];
  return (
    <div className="w-full bg-cream p-6 text-ink sm:p-8">
      <Header left="Key Findings Report" right="Section 03" />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <h5 className="font-display text-[clamp(1.5rem,2.4vw,2.125rem)] font-bold uppercase leading-[0.95]">AI Opportunity<br />Recommendations</h5>
        <Tag />
      </div>

      <div className="mt-6 grid gap-6 border-t border-ink/15 pt-5 sm:grid-cols-2 sm:gap-8">
        <div>
          <Eyebrow>Opportunity by business area</Eyebrow>
          <div className="mt-3 flex items-center gap-4">
            <Donut />
            <ul className="space-y-1.5">
              {AREAS.map(([a, v], i) => (
                <li key={a} className="flex items-center gap-2 font-sans text-xs font-medium">
                  <span className={`block size-2 shrink-0 ${shades[i]}`} />{a}<span className="ml-auto pl-2 font-semibold tabular-nums">{v}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <Eyebrow>Projected impact (index)</Eyebrow>
          <div className="mt-3 flex h-28 items-end gap-3 border-b border-ink/25">
            {IMPACT.map(([q, v], i) => (
              <div key={q} className="flex h-full flex-1 flex-col justify-end">
                <span className="mb-1 text-center font-sans text-[10px] font-semibold tabular-nums">{v}</span>
                <div className={i === IMPACT.length - 1 ? "bg-lime" : "bg-ink"} style={{ height: `${v}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-3">{IMPACT.map(([q]) => <span key={q} className="flex-1 text-center font-sans text-[10px] text-ink/55">{q}</span>)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-ink/15 pt-5 sm:grid-cols-2 sm:gap-8">
        <div>
          <Eyebrow>Prioritized recommendations</Eyebrow>
          <ol className="mt-2">
            {RECS.map(([r, p], i) => (
              <li key={r} className="flex items-baseline gap-3 border-b border-ink/15 py-2 font-sans text-xs font-semibold last:border-b-0">
                <span className="font-display text-[10px] text-ink/45 tabular-nums">{String(i + 1).padStart(2, "0")}</span>{r}
                <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.08em] text-ink/55">{p}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Eyebrow>30 / 60 / 90-day roadmap</Eyebrow>
          <ol className="mt-3 space-y-3 border-l border-ink/20 pl-4">
            {ROADMAP.map(([d, t], i) => (
              <li key={d} className="relative">
                <span className={`absolute -left-[19.5px] top-1 block size-2 ${i === 0 ? "bg-lime" : "bg-ink"}`} />
                <p className="font-display text-xs font-bold uppercase tracking-[0.08em]">{d}</p>
                <p className="font-sans text-xs leading-snug text-ink/70">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 border-t border-ink/15 sm:grid-cols-3">
        {METRICS.map(([v, l], i) => (
          <div key={l} className={`py-4 sm:px-4 ${i ? "border-t border-ink/15 sm:border-l sm:border-t-0" : "sm:pl-0"}`}>
            <dd className="font-display text-2xl font-bold tabular-nums">{v}</dd>
            <dt className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60">{l}*</dt>
          </div>
        ))}
      </dl>
      <p className="border-t border-ink/15 pt-3 font-sans text-[10px] leading-relaxed text-ink/55">*Sample figures for illustration only. Not actual client results or guaranteed outcomes.</p>
    </div>
  );
}

export function ReportShowcase() {
  return (
    <div className="relative grid gap-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
      <div className="relative w-[94%] ring-1 ring-ink/10 lg:w-full" role="img" aria-label="Illustrative Key Findings Report">
        <KeyFindings />
      </div>
      <div className="relative z-10 -mt-3 ml-auto w-[94%] shadow-[0_20px_40px_-24px_rgb(0_0_0/0.6)] ring-1 ring-ink/10 lg:-ml-6 lg:mt-16 lg:w-[calc(100%+1.5rem)]" role="img" aria-label="Illustrative AI Opportunity Recommendations">
        <Recommendations />
      </div>
    </div>
  );
}
