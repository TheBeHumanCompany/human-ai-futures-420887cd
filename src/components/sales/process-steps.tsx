import { cn } from "@/lib/utils";

/**
 * Numbered steps in the hairline grid this site uses everywhere: a one-pixel
 * background showing through the gaps between opaque cells, rather than borders
 * on each cell, so interior rules never double up.
 */
export interface ProcessStep {
  /** Displayed as written — "01", "Step 1", whatever the copy says. */
  n: string;
  title: string;
  body: string;
}

export interface ProcessStepsProps {
  steps: readonly ProcessStep[];
  theme?: "ink" | "cream";
  /** Tailwind column classes, so the page decides 2-up vs 3-up vs 4-up. */
  columnsClassName?: string;
  className?: string;
}

export function ProcessSteps({
  steps,
  theme = "ink",
  columnsClassName = "sm:grid-cols-2 lg:grid-cols-4",
  className,
}: ProcessStepsProps) {
  if (steps.length === 0) return null;

  const ink = theme === "ink";

  return (
    <div
      className={cn(
        "grid gap-px",
        ink ? "bg-hairline" : "bg-hairline-dark",
        columnsClassName,
        className,
      )}
    >
      {steps.map((step) => (
        <div key={step.n} className={cn("p-8", ink ? "bg-background" : "bg-cream")}>
          <span className={cn("eyebrow", ink ? "text-lime" : "text-ink/40")}>{step.n}</span>
          <h3 className={cn("display mt-5 text-3xl", !ink && "text-ink")}>{step.title}</h3>
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed",
              ink ? "text-muted-foreground" : "text-ink/70",
            )}
          >
            {step.body}
          </p>
        </div>
      ))}
    </div>
  );
}
