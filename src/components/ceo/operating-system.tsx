import { BookOpen, Layers, Share2, CalendarDays, Target, LayoutGrid, Lock, ShieldCheck, Users, Check, User, Clock } from "lucide-react";
import type { ReactNode } from "react";

const brain = [
  [BookOpen, "Projects", "Brand voice and story", "12 files"],
  [Layers, "Skills", "Offers and pricing", "6 files"],
  [Share2, "Connectors", "Podcast archive", "150+ eps"],
  [CalendarDays, "Scheduled", "Client case studies", "9 files"],
  [Target, "Strategy", "Strategy and goals", "4 files"],
  [LayoutGrid, "Operating playbooks", "", "18 files"],
] as const;

const flow = [
  ["Podcast recorded", "Done"],
  ["Transcript and show notes", "Done"],
  ["10 content pieces drafted", "Done"],
] as const;

function Node({ children, human }: { children: ReactNode; human?: boolean }) {
  return (
    <div className={`border px-3 py-2 text-center text-sm ${human ? "border-lime bg-lime font-display font-bold uppercase tracking-[0.12em] text-ink" : "border-cream/25 text-cream"}`}>
      {children}
    </div>
  );
}
function Chip({ children }: { children: ReactNode }) {
  return <span className="border border-cream/20 px-2.5 py-1 text-xs text-cream/80">{children}</span>;
}
const Line = () => <div className="mx-auto h-4 w-px bg-cream/25" />;

function Column({ n, title, guard, GuardIcon, children }: { n: string; title: string; guard: string; GuardIcon: typeof Lock; children: ReactNode }) {
  return (
    <div className="flex flex-col border-t border-cream/15 pt-8 lg:border-t-0 lg:pt-0">
      <p className="font-display text-4xl font-bold leading-none text-lime">{n}</p>
      <h3 className="mt-3 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold uppercase leading-none text-cream">{title}</h3>
      <div className="mt-4 h-0.5 w-12 bg-lime" />
      <div className="mt-8 flex-1">{children}</div>
      <div className="mt-8 flex items-start gap-4 border-t border-lime/40 pt-6">
        <GuardIcon className="mt-0.5 size-6 shrink-0 text-lime" strokeWidth={1.5} />
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-lime">Guardrail</p>
          <p className="mt-1 text-base text-cream/85">{guard}</p>
        </div>
      </div>
    </div>
  );
}

export function OperatingSystem() {
  return (
    <div className="grid gap-12 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-cream/15 [&>*]:lg:px-8 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0">
      <Column n="01" title="The Company Brain" guard="Permissions set for every agent" GuardIcon={Lock}>
        <ul className="divide-y divide-cream/10">
          {brain.map(([Icon, name, desc, count]) => (
            <li key={name} className="flex items-center gap-4 py-3">
              <Icon className="size-5 shrink-0 text-cream/60" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-cream">{name}</p>
                {desc && <p className="text-sm text-cream/60">{desc}</p>}
              </div>
              <span className="shrink-0 text-sm text-cream/70">{count}</span>
            </li>
          ))}
        </ul>
      </Column>

      <Column n="02" title="The Agent Workforce" guard="Every agent has a defined role and limits" GuardIcon={ShieldCheck}>
        <div className="mx-auto max-w-sm">
          <Node human>Shane, human lead</Node>
          <Line />
          <div className="mx-auto w-3/4"><Node>Chief of staff agent</Node></div>
          <Line />
          <div className="grid grid-cols-2 gap-3">
            {[["Research lead", "Sales lead", ["Clips", "Captions", "Prospect research"]], ["Content lead", "Operations lead", ["Blog", "Email", "Reports"]]].map(([a, b, chips]) => (
              <div key={a as string} className="space-y-2">
                <Node>{a}</Node>
                <Node>{b}</Node>
                <div className="mx-auto h-3 w-px bg-cream/25" />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {(chips as string[]).map((c) => <Chip key={c}>{c}</Chip>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Column>

      <Column n="03" title="A Live Workflow" guard="Nothing publishes without a human sign-off" GuardIcon={Users}>
        <ul className="space-y-2">
          {flow.map(([t, s]) => (
            <li key={t} className="flex items-center gap-3 border border-cream/15 px-4 py-3">
              <Check className="size-4 shrink-0 text-lime" />
              <span className="flex-1 text-cream">{t}</span>
              <span className="text-sm font-semibold text-lime">{s}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 bg-lime px-4 py-3 text-ink">
            <User className="size-4 shrink-0" />
            <span className="flex-1 font-semibold">Human review and approval</span>
            <span className="text-sm italic">Waiting on you</span>
          </li>
          <li className="flex items-center gap-3 border border-cream/15 px-4 py-3">
            <Clock className="size-4 shrink-0 text-cream/60" />
            <span className="flex-1 text-cream">Scheduled and published</span>
            <span className="text-sm font-semibold text-cream">Next</span>
          </li>
        </ul>
        <p className="mt-6 text-sm italic text-cream/70">15 to 20 interviews a week, about 10 pieces each.</p>
      </Column>
    </div>
  );
}
