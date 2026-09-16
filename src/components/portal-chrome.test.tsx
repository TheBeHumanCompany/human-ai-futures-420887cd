import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { INDIGENOUS_LINE } from "@/lib/brand";
import { NAV } from "@/lib/nav";

import { PortalFooter } from "./portal-footer";
import { PORTAL_CONTROLS } from "./portal-header";

/**
 * The portal chrome's vocabulary, pinned without a router: the two controls
 * are exactly Portal and Profile (never any of the seven marketing nav
 * labels), and the footer carries the Indigenous line with zero links — the
 * portal's interactive chrome is exactly the two header controls.
 *
 * `PortalHeader` is deliberately NOT rendered here: a TanStack `Link` calls
 * `useRouter()` and would throw outside a router context. The rendered
 * control count is asserted in `e2e/funnel/s4-portal-account.spec.ts` on
 * the real page instead; this file pins the contract the markup is built
 * from.
 */

describe("PORTAL_CONTROLS — exactly two controls", () => {
  test("the exported vocabulary is exactly Portal and Profile", () => {
    expect(PORTAL_CONTROLS).toEqual([
      { label: "Portal", to: "/portal" },
      { label: "Profile", to: "/profile/$" },
    ]);
  });

  test("none of the marketing nav labels leaks into the portal chrome", () => {
    const marketingLabels = NAV.map((item) => item.label);
    for (const control of PORTAL_CONTROLS) {
      expect(marketingLabels).not.toContain(control.label);
    }
  });

  test("the header source builds its links from the one vocabulary", () => {
    // Rendered count is a browser assertion (s4); here: both controls carry
    // their stable testids via the lookup table, and the links are built
    // from the one exported vocabulary.
    const source = readFileSync(new URL("./portal-header.tsx", import.meta.url).pathname, "utf8");
    expect(source).toContain("PORTAL_CONTROLS.map");
    expect(source).toContain('"portal-nav-portal"');
    expect(source).toContain('"portal-nav-profile"');
  });
});

describe("PortalFooter — brand copy, zero links", () => {
  const html = renderToStaticMarkup(createElement(PortalFooter));

  test("carries the Indigenous line from the brand constant", () => {
    expect(html).toContain(INDIGENOUS_LINE);
    expect(html).toContain('data-brand="indigenous-line"');
  });

  test("renders zero anchor elements — no links at all", () => {
    expect(html.match(/<a[\s>]/g) ?? []).toHaveLength(0);
  });

  test("carries the copyright as plain text", () => {
    expect(html).toContain("© 2026 The Be Human Company");
  });
});
