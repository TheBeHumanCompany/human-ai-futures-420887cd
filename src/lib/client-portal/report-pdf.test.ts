import { describe, expect, test } from "bun:test";

import { generateReportPdf, reportHtmlToTextLines } from "./report-pdf";

/**
 * PDF only on explicit request, generated from the same report HTML (US-006).
 *
 * The default send never attaches a PDF (pinned in `magic-link-email.test.ts`);
 * this module is the one action that produces one. The assertions below pin
 * that the file is a real PDF and that the fixture marker survives the
 * HTML-to-PDF trip verbatim, so text extraction finds it.
 */

const MARKER = "ACME-FIXTURE-MARKER-7f3a91";
const HTML = `<p>${MARKER} — preliminary findings for Acme Industrial.</p>`;

describe("report HTML to text", () => {
  test("tags are stripped and the marker survives", () => {
    const text = reportHtmlToTextLines(HTML).join("\n");
    expect(text).toContain(MARKER);
    expect(text).not.toContain("<p>");
  });
});

describe("the generated PDF", () => {
  const pdf = generateReportPdf({ title: "Acme Industrial — Preliminary Blueprint", html: HTML });
  const latin1 = Buffer.from(pdf).toString("latin1");

  test("it is a PDF file", () => {
    expect(latin1.startsWith("%PDF-")).toBe(true);
    expect(latin1.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  test("extracted text contains the fixture marker", () => {
    expect(latin1).toContain(MARKER);
  });

  test("it carries the report title", () => {
    expect(latin1).toContain("Acme Industrial");
  });

  test("it holds no HTML tags", () => {
    expect(latin1).not.toContain("<p>");
  });

  test("a long report paginates rather than truncating", () => {
    const long = Array.from({ length: 200 }, (_, i) => `<p>Line ${i} ${MARKER}</p>`).join("\n");
    const big = Buffer.from(generateReportPdf({ title: "Long report", html: long })).toString(
      "latin1",
    );
    expect(big).toContain("Line 199");
    expect(big).toContain(MARKER);
  });
});
