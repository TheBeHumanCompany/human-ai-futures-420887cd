import { useEffect, useState } from "react";

/**
 * The Blueprint's "on this page" index.
 *
 * Desktop: a document-index rail pinned to the left edge of the content area.
 * Collapsed it shows only hairline ticks; on hover/focus it expands to reveal
 * the section names. The active section carries a thin lime marker.
 *
 * Mobile: a native <details> collapsible, so it works with JavaScript off.
 */
export type PageNavItem = { id: string; label: string };

export function BlueprintPageNav({ items }: { items: readonly PageNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="On this page"
        className="group pointer-events-auto fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <div className="border-y border-r border-border bg-background/92 py-5 pl-3 pr-4 backdrop-blur transition-[padding] duration-300 group-hover:pr-6 group-focus-within:pr-6">
          <p className="eyebrow mb-4 hidden text-muted-foreground group-hover:block group-focus-within:block">
            On this page
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-3 py-1 outline-none"
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span
                      aria-hidden
                      className={`h-px shrink-0 transition-all duration-300 ${
                        isActive ? "w-5 bg-lime" : "w-3 bg-border"
                      }`}
                    />
                    <span
                      className={`hidden max-w-[15rem] text-[0.6875rem] uppercase leading-tight tracking-[0.14em] transition-colors group-hover:block group-focus-within:block ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile collapsible */}
      <details className="section-ink border-b border-border lg:hidden">
        <summary className="eyebrow flex cursor-pointer items-center justify-between px-5 py-4 text-muted-foreground">
          <span>On this page</span>
          <span aria-hidden>&darr;</span>
        </summary>
        <ul className="border-t border-border px-5 pb-5 pt-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block py-2 text-[0.75rem] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
