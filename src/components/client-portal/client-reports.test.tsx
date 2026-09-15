import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ClientPage } from "@/lib/client-portal/tokens";

import { ClientReports } from "./client-reports";

/**
 * US-003 — one link per client, many reports in sidebar tabs.
 *
 * Rendered server-side with `react-dom/server`, which needs no browser and
 * no new test framework: the sidebar/disclosure/tabs tree renders to static
 * markup exactly as the preview build server-renders it before hydration.
 * Tab *clicks* need a browser and are pinned in `e2e/client-portal.spec.ts`;
 * what is pinned here is everything a click depends on: both reports wired
 * to one page, exactly one tab selected, and a collapse toggle that leaves
 * the navigation in the tree.
 */

const MARKER_A = "ACME-FIXTURE-MARKER-7f3a91";
const MARKER_A2 = "ACME-FIXTURE-MARKER-02c4e8";

const PAGE: ClientPage = {
  id: "acme-industrial",
  name: "Acme Industrial",
  title: "Acme Industrial — Preliminary Blueprint",
  html: `<p>${MARKER_A} — preliminary findings for Acme Industrial.</p>\n<p>${MARKER_A2} — follow-up findings for Acme Industrial.</p>`,
  reports: [
    {
      id: "preliminary",
      title: "Preliminary Blueprint",
      html: `<p>${MARKER_A} — preliminary findings for Acme Industrial.</p>`,
    },
    {
      id: "follow-up",
      title: "Follow-up Findings",
      html: `<p>${MARKER_A2} — follow-up findings for Acme Industrial.</p>`,
    },
  ],
};

const countOf = (html: string, needle: string) => html.split(needle).length - 1;

describe("first paint selects the first report", () => {
  test("the first report body renders and the second waits for its tab", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    // Inactive panels unmount — that is what makes a tab click observable —
    // so the second marker is absent until its tab is selected.
    expect(html).toContain(MARKER_A);
    expect(html).not.toContain(MARKER_A2);
  });

  test("both reports are listed in both navigations with one tab selected", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    // The tab bar above the report and the sidebar menu each name both
    // reports; the selected tab and its panel are the two active states.
    expect(countOf(html, 'role="tab"')).toBe(2);
    expect(countOf(html, 'data-sidebar="menu-button"')).toBe(2);
    expect(countOf(html, 'data-state="active"')).toBe(2);
  });

  test("the collapse toggle and the report disclosure render", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    expect(html).toContain('data-sidebar="trigger"');
    expect(html).toContain("Reports");
  });
});

describe("defaultReportId — the value-to-panel linkage in both directions", () => {
  test("naming the second report paints its body instead", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} defaultReportId="follow-up" />);

    expect(html).toContain(MARKER_A2);
    expect(html).not.toContain(MARKER_A);
    expect(countOf(html, 'data-state="active"')).toBe(2);
  });

  test("naming no report falls back to the first", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} defaultReportId="no-such-report" />);

    expect(html).toContain(MARKER_A);
    expect(html).not.toContain(MARKER_A2);
  });
});

describe("a single-report page renders the same shell with one tab", () => {
  test("one tab, one sidebar entry, the report painted", () => {
    const single: ClientPage = {
      id: "beacon-health",
      name: "Beacon Health",
      title: "Beacon Health — Preliminary Blueprint",
      html: "<p>BEACON-FIXTURE-MARKER-44d2c8 — preliminary findings.</p>",
      reports: [
        {
          id: "report",
          title: "Beacon Health — Preliminary Blueprint",
          html: "<p>BEACON-FIXTURE-MARKER-44d2c8 — preliminary findings.</p>",
        },
      ],
    };
    const html = renderToStaticMarkup(<ClientReports page={single} />);

    expect(countOf(html, 'role="tab"')).toBe(1);
    expect(countOf(html, 'data-sidebar="menu-button"')).toBe(1);
    expect(html).toContain("BEACON-FIXTURE-MARKER-44d2c8");
    expect(html).toContain('data-sidebar="trigger"');
  });
});
