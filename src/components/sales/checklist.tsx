import { cn } from "@/lib/utils";

/**
 * A tick list. The source copy uses these for "what you'll receive", the
 * qualifying "we work best with" list, and the sovereignty questions.
 *
 * The check glyph is decorative and hidden from assistive tech: a screen reader
 * announcing "check mark" before every item adds nothing that the list semantics
 * do not already convey.
 */
export interface ChecklistProps {
  items: readonly string[];
  /** Which surface this sits on. The page composes the alternating rhythm. */
  theme?: "ink" | "cream";
  className?: string;
}

export function Checklist({ items, theme = "ink", className }: ChecklistProps) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="text-lime">
            ✓
          </span>
          <span
            className={cn(
              "text-sm leading-relaxed",
              theme === "ink" ? "text-muted-foreground" : "text-ink/70",
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
