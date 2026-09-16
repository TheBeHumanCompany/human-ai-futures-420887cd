import { MapleLeaf } from "@/components/maple-leaf";
import { INDIGENOUS_LINE } from "@/lib/brand";

/**
 * The portal shell's footer. The portal's interactive chrome is exactly the
 * two header controls, so this footer renders **no links at all** — the
 * Indigenous line is brand copy rendered from `INDIGENOUS_LINE` with the
 * maple leaf as its sibling, and the copyright is plain text.
 */
export function PortalFooter() {
  return (
    <footer className="section-ink border-t border-border">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <p
          data-brand="indigenous-line"
          className="inline-flex items-center gap-2 text-sm text-foreground/80"
        >
          <MapleLeaf className="h-4 w-4 shrink-0 text-lime" />
          <span>{INDIGENOUS_LINE}</span>
        </p>
        <p className="mt-6 text-sm text-muted-foreground">© 2026 The Be Human Company</p>
      </div>
    </footer>
  );
}
