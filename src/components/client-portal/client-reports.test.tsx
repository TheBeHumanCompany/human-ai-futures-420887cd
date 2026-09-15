import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ClientPage } from "@/lib/client-portal/tokens";

import { ClientReports } from "./client-reports";

/**
 * One link per client, every report stacked on the one page.
 *
 * Rendered server-side with `react-dom/server`, which needs no browser and
 * no new test framework: the stacked tree renders to static markup exactly
 * as the preview build server-renders it before hydration. There is no tab
 * state and no sidebar, so nothing here needs a browser: what is pinned is
 * that every report is present in store order with no navigation chrome.
 * The lookup layer (which reports resolve) is pinned in `tokens.test.ts`
 * and the paid append in `paid-reports.test.ts`.
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

describe("every report renders stacked in store order", () => {
  test("both report bodies are present, preliminary before follow-up", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    expect(html).toContain(MARKER_A);
    expect(html).toContain(MARKER_A2);
    expect(html.indexOf(MARKER_A)).toBeLessThan(html.indexOf(MARKER_A2));
  });

  test("each report keeps its heading and section anchor", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    expect(html).toContain("Preliminary Blueprint");
    expect(html).toContain("Follow-up Findings");
    expect(html).toContain('id="report-preliminary"');
    expect(html).toContain('id="report-follow-up"');
  });
});

describe("no navigation chrome", () => {
  test("no tabs, no sidebar, no collapse toggle", () => {
    const html = renderToStaticMarkup(<ClientReports page={PAGE} />);

    expect(html).not.toContain('role="tab"');
    expect(html).not.toContain("data-sidebar");
    expect(html).not.toContain("Toggle Sidebar");
    expect(html).not.toContain("Reports");
  });
});

describe("a single-report page renders the one report", () => {
  test("the report body paints with its anchor", () => {
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

    expect(html).toContain("BEACON-FIXTURE-MARKER-44d2c8");
    expect(html).toContain('id="report-report"');
    expect(html).not.toContain('role="tab"');
    expect(html).not.toContain("data-sidebar");
  });
});
