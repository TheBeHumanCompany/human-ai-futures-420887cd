import { cn } from "@/lib/utils";
import { Checklist } from "./checklist";

/**
 * The priced offer: founding rate, future rate, what is included, turnaround,
 * and the booking call to action.
 *
 * Prices arrive as pre-formatted strings rather than numbers with a currency
 * prop. They are approved marketing copy and must render exactly as written —
 * a formatter that decided to emit "CA$795.00" or "$795" would be silently
 * rewriting a commercial claim.
 */
export interface OfferCardProps {
  /** Small label above the price, e.g. the rate's name. */
  eyebrow?: string;
  /** Pre-formatted, rendered verbatim. */
  price: string;
  /** Qualifier beneath the price. */
  priceNote?: string;
  /** Pre-formatted comparison rate, rendered verbatim. */
  compareAtPrice?: string;
  compareAtNote?: string;
  turnaround?: string;
  turnaroundNote?: string;
  inclusionsLabel?: string;
  inclusions?: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  /** Fine print under the CTA — no-contract terms, credit toward implementation. */
  terms?: string;
  theme?: "ink" | "cream";
  className?: string;
}

export function OfferCard({
  eyebrow,
  price,
  priceNote,
  compareAtPrice,
  compareAtNote,
  turnaround,
  turnaroundNote,
  inclusionsLabel,
  inclusions = [],
  ctaLabel,
  ctaHref,
  terms,
  theme = "ink",
  className,
}: OfferCardProps) {
  const ink = theme === "ink";

  return (
    <div
      className={cn(
        "border p-8 lg:p-12",
        ink ? "border-hairline bg-card" : "border-hairline-dark bg-cream",
        className,
      )}
    >
      {eyebrow && <p className={cn("eyebrow", ink ? "text-lime" : "text-ink/45")}>{eyebrow}</p>}

      <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-6">
        <div>
          <p className={cn("display text-6xl lg:text-7xl", !ink && "text-ink")}>{price}</p>
          {priceNote && (
            <p className={cn("eyebrow mt-3", ink ? "text-muted-foreground" : "text-ink/55")}>
              {priceNote}
            </p>
          )}
        </div>

        {turnaround && (
          <div>
            <p className={cn("display text-3xl lg:text-4xl", !ink && "text-ink")}>{turnaround}</p>
            {turnaroundNote && (
              <p className={cn("eyebrow mt-3", ink ? "text-muted-foreground" : "text-ink/55")}>
                {turnaroundNote}
              </p>
            )}
          </div>
        )}

        {compareAtPrice && (
          <div>
            <p
              className={cn(
                "display text-3xl lg:text-4xl",
                ink ? "text-muted-foreground" : "text-ink/50",
              )}
            >
              {compareAtPrice}
            </p>
            {compareAtNote && (
              <p className={cn("eyebrow mt-3", ink ? "text-muted-foreground" : "text-ink/55")}>
                {compareAtNote}
              </p>
            )}
          </div>
        )}
      </div>

      {inclusions.length > 0 && (
        <div
          className={cn("mt-10 border-t pt-8", ink ? "border-hairline" : "border-hairline-dark")}
        >
          {inclusionsLabel && (
            <p className={cn("eyebrow", ink ? "text-muted-foreground" : "text-ink/45")}>
              {inclusionsLabel}
            </p>
          )}
          <Checklist items={inclusions} theme={theme} className="mt-5" />
        </div>
      )}

      <a
        href={ctaHref}
        className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
      >
        {ctaLabel} <span aria-hidden>→</span>
      </a>

      {terms && (
        <p
          className={cn(
            "mt-5 max-w-md text-xs leading-relaxed",
            ink ? "text-muted-foreground" : "text-ink/60",
          )}
        >
          {terms}
        </p>
      )}
    </div>
  );
}
