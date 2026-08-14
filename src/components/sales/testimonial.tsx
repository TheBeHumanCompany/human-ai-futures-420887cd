import { cn } from "@/lib/utils";

/**
 * A client quote with optional headshot, logo, and video.
 *
 * **Every field is optional and the whole thing renders `null` without a quote.**
 * The source copy marks the testimonial slots as unfilled placeholders, and no
 * approved quote, headshot, or logo exists yet. Rendering a labelled grey box
 * on a live sales page would be worse than rendering nothing, and inventing a
 * quote would be worse than both. So the section simply is not there until real
 * content arrives, at which point it appears with no code change.
 *
 * The gate is here rather than at the call site so a page cannot forget it.
 */
export interface TestimonialProps {
  /** Without this, nothing renders. */
  quote?: string | null;
  author?: string | null;
  role?: string | null;
  organization?: string | null;
  headshotUrl?: string | null;
  logoUrl?: string | null;
  videoUrl?: string | null;
  theme?: "ink" | "cream";
  className?: string;
}

export function Testimonial({
  quote,
  author,
  role,
  organization,
  headshotUrl,
  logoUrl,
  videoUrl,
  theme = "cream",
  className,
}: TestimonialProps) {
  if (!quote) return null;

  const ink = theme === "ink";
  const attribution = [author, role, organization].filter(Boolean).join(" · ");

  return (
    <figure className={cn("flex flex-col gap-8 sm:flex-row sm:items-start", className)}>
      {headshotUrl && (
        <img
          src={headshotUrl}
          alt={author ? `${author}, ${organization ?? ""}`.trim() : ""}
          loading="lazy"
          className="aspect-square w-32 shrink-0 object-cover sm:w-40"
        />
      )}

      <div className="min-w-0">
        <blockquote
          className={cn(
            "display text-2xl leading-tight lg:text-3xl",
            ink ? "text-foreground" : "text-ink",
          )}
        >
          {quote}
        </blockquote>

        {attribution && (
          <figcaption className={cn("eyebrow mt-6", ink ? "text-muted-foreground" : "text-ink/55")}>
            {attribution}
          </figcaption>
        )}

        {logoUrl && (
          <img
            src={logoUrl}
            alt={organization ?? ""}
            loading="lazy"
            className="mt-6 h-8 w-auto object-contain"
          />
        )}

        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "eyebrow link-underline mt-6 inline-block",
              ink ? "text-lime" : "text-ink",
            )}
          >
            Play video <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </figure>
  );
}
