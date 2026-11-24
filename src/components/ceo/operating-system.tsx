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
const VLine = ({ h = "h-4" }: { h?: string }) => <div className={`mx-auto ${h} w-px bg-cream/30`} />;

function Column({ n, title, guard, GuardIcon, children }: { n: string; title: string; guard: string; GuardIcon: typeof Lock; children: ReactNode }) {
  return (
    <div className="flex flex-col border border-cream/15">
      <div className="px-6 pt-6">
        <p className="font-display text-3xl font-bold leading-none text-lime">{n}</p>
        <h3 className="mt-2 font-display text-[clamp(1.6rem,2.2vw,2.25rem)] font-bold uppercase leading-none text-cream">{title}</h3>
        <div className="mt-3 h-0.5 w-10 bg-lime" />
      </div>
      <div className="flex-1 px-6 py-6">{children}</div>
      <div className="flex items-start gap-3 border-t border-cream/15 bg-cream/[0.03] px-6 py-4">
        <GuardIcon className="mt-0.5 size-5 shrink-0 text-lime" strokeWidth={1.5} />
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-lime">Guardrail</p>
          <p className="mt-0.5 text-sm text-cream/85">{guard}</p>
        </div>
      </div>
    </div>
  );
}

export function OperatingSystem() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Column n="01" title="The Company Brain" guard="Permissions set for every agent" GuardIcon={Lock}>
        <div className="border border-cream/15">
          <div className="flex items-center justify-between border-b border-cream/15 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-cream/50">
            <span>Knowledge</span><span>Files</span>
          </div>
          <ul className="divide-y divide-cream/10">
            {brain.map(([Icon, name, desc, count]) => (
              <li key={name} className="flex items-center gap-3 px-4 py-2.5">
                <Icon className="size-4 shrink-0 text-lime" strokeWidth={1.5} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-sm font-semibold text-cream">{name}</p>
                  {desc && <p className="text-xs text-cream/60">{desc}</p>}
                </div>
                <span className="shrink-0 text-xs tabular-nums text-cream/70">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </Column>

      <Column n="02" title="The Agent Workforce" guard="Every agent has a defined role and limits" GuardIcon={ShieldCheck}>
        <div className="mx-auto max-w-sm">
          <Node human>Shane, human lead</Node>
          <VLine />
          <div className="mx-auto w-3/4"><Node>Chief of staff agent</Node></div>
          <VLine />
          <div className="mx-auto h-px w-1/2 bg-cream/30" />
          <div className="grid grid-cols-2 gap-3">
            {[["Research lead", "Sales lead", ["Clips", "Captions", "Prospect research"]], ["Content lead", "Operations lead", ["Blog", "Email", "Reports"]]].map(([a, b, chips]) => (
              <div key={a as string}>
                <VLine h="h-3" />
                <Node>{a}</Node>
                <VLine h="h-2" />
                <Node>{b}</Node>
                <VLine h="h-3" />
                <div className="flex flex-wrap justify-center gap-1.5 border-t border-cream/30 pt-3">
                  {(chips as string[]).map((c) => <Chip key={c}>{c}</Chip>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Column>

      <Column n="03" title="A Live Workflow" guard="Nothing publishes without a human sign-off" GuardIcon={Users}>
        <ol className="relative">
          <span className="absolute bottom-4 left-[15px] top-4 w-px bg-cream/30" aria-hidden />
          {[...flow.map(([t, st]) => ({ t, st, kind: "done" as const })), { t: "Human review and approval", st: "Waiting on you", kind: "human" as const }, { t: "Scheduled and published", st: "Next", kind: "next" as const }].map(({ t, st, kind }) => (
            <li key={t} className="relative flex items-center gap-3 py-1.5">
              <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center border ${kind === "human" ? "border-lime bg-lime text-ink" : kind === "done" ? "border-lime/60 bg-background text-lime" : "border-cream/30 bg-background text-cream/60"}`}>
                {kind === "done" ? <Check className="size-4" /> : kind === "human" ? <User className="size-4" /> : <Clock className="size-4" />}
              </span>
              <div className={`flex flex-1 items-center justify-between gap-3 px-3 py-2 ${kind === "human" ? "bg-lime text-ink" : "border border-cream/15"}`}>
                <span className={`text-sm ${kind === "human" ? "font-semibold" : "text-cream"}`}>{t}</span>
                <span className={`shrink-0 text-xs ${kind === "human" ? "italic" : kind === "done" ? "font-semibold text-lime" : "font-semibold text-cream"}`}>{st}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm italic text-cream/70">15 to 20 interviews a week, about 10 pieces each.</p>
      </Column>
    </div>
  );
}
