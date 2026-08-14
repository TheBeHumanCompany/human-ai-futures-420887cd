import { cn } from "@/lib/utils";

/**
 * A row of proof points — control counts, domain counts, turnaround.
 *
 * Data-gated per the spec's placeholder rule: an empty list renders nothing at
 * all rather than an empty band. The gate lives here rather than at each call
 * site so no page can forget it.
 */
export interface ProofStat {
  /** The number or short phrase carrying the weight: "72", "3 business days". */
  value: string;
  /** What it counts. */
  label: string;
}

export interface ProofBandProps {
  stats: readonly ProofStat[];
  /** Optional qualifier beneath the row — e.g. a positioning caveat. */
  footnote?: string;
  theme?: "ink" | "cream";
  className?: string;
}

export function ProofBand({ stats, footnote, theme = "ink", className }: ProofBandProps) {
  if (stats.length === 0) return null;

  const ink = theme === "ink";

  return (
    <div className={className}>
      <dl
        className={cn(
          "grid gap-px",
          ink ? "bg-hairline" : "bg-hairline-dark",
          stats.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        {stats.map((stat) => (
          <div key={stat.label} className={cn("p-8", ink ? "bg-background" : "bg-cream")}>
            <dt className={cn("eyebrow", ink ? "text-muted-foreground" : "text-ink/45")}>
              {stat.label}
            </dt>
            <dd className={cn("display mt-4 text-4xl lg:text-5xl", ink ? "text-lime" : "text-ink")}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {footnote && (
        <p
          className={cn(
            "mt-5 max-w-2xl text-xs leading-relaxed",
            ink ? "text-muted-foreground" : "text-ink/60",
          )}
        >
          {footnote}
        </p>
      )}
    </div>
  );
}
