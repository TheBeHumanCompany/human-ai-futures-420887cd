import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/**
 * Frequently-asked questions over the existing Radix accordion.
 *
 * `type="single"` with `collapsible`: one answer open at a time, and the open
 * one can be closed again. A long FAQ where every panel can be open at once
 * turns into a wall of text and loses the scannability that is the whole point
 * of the pattern.
 *
 * Keyed by question rather than index so a reordered list does not leave the
 * open panel pointing at different content.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  items: readonly FaqItem[];
  theme?: "ink" | "cream";
  className?: string;
}

export function FaqAccordion({ items, theme = "cream", className }: FaqAccordionProps) {
  if (items.length === 0) return null;

  const ink = theme === "ink";

  return (
    <Accordion type="single" collapsible className={className}>
      {items.map((item) => (
        <AccordionItem
          key={item.question}
          value={item.question}
          className={ink ? "border-hairline" : "border-hairline-dark"}
        >
          <AccordionTrigger
            className={cn("display py-6 text-xl lg:text-2xl", ink ? "text-foreground" : "text-ink")}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              "max-w-2xl pb-6 text-sm leading-relaxed",
              ink ? "text-muted-foreground" : "text-ink/70",
            )}
          >
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
