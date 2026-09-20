import { Link } from "@tanstack/react-router";

/**
 * The portal's entire chrome vocabulary: exactly two controls.
 *
 * The portal must be unmistakably a different place from the marketing
 * homepage, so its header carries nothing else — no marketing nav, no
 * account button, no home link. `PORTAL_CONTROLS` is exported so tests can
 * pin the count and the labels without rendering (a TanStack `Link` needs a
 * router, so SSR markup of this component throws outside one).
 */
export const PORTAL_CONTROLS = [
  { label: "Portal", to: "/portal" },
  { label: "Profile", to: "/profile/$" },
] as const;

const PORTAL_CONTROL_CLASSES: Record<string, string> = {
  Portal:
    "eyebrow inline-flex items-center rounded-full border border-lime px-5 py-2 text-lime transition-colors duration-200 hover:bg-lime hover:text-ink",
  Profile:
    "eyebrow inline-flex items-center px-3 py-2 text-muted-foreground transition-colors duration-200 hover:text-foreground",
};

const controlTestId: Record<string, string> = {
  Portal: "portal-nav-portal",
  Profile: "portal-nav-profile",
};

/**
 * The portal shell's header. The brand mark is deliberately a `<span>`, not
 * the site's `Wordmark`: a `Wordmark` is a `<Link to="/">`, which on the
 * portal host would be a client-side navigation into marketing — and a
 * third control.
 */
export function PortalHeader() {
  return (
    <header data-print="hide" className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <span className="type-wordmark text-foreground">THE BE HUMAN COMPANY</span>
        <nav aria-label="Primary" className="flex items-center gap-3">
          {PORTAL_CONTROLS.map((control) => (
            <Link
              key={control.to}
              to={control.to}
              params={control.to === "/profile/$" ? { _splat: "" } : undefined}
              data-nav-item={control.label}
              data-testid={controlTestId[control.label]}
              className={PORTAL_CONTROL_CLASSES[control.label]}
            >
              {control.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
