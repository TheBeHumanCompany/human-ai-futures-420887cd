/**
 * PDF on request for the private client portal (US-006).
 *
 * The default send is the HTML magic link only (`magic-link-email.ts` has no
 * attachment step). This module is the explicit on-request action: it renders
 * the same report HTML to a PDF file, generated locally with zero new
 * dependencies — a minimal PDF 1.4 writer over the standard Helvetica face,
 * so there is no headless browser, no font download, and nothing platform
 * decision beyond the code below. Report HTML is author-trusted (it is pasted
 * by the operator through `portal:publish`), so tag-stripping here is
 * formatting, not sanitising.
 */

export interface ReportPdfInput {
  /** Report title rendered as the document heading. */
  title: string;
  /** The report body, as authored HTML — the same HTML the portal serves. */
  html: string;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 72;
const BODY_SIZE = 12;
const HEADING_SIZE = 18;
const LEADING = 15;
const MAX_BODY_LINES_PER_PAGE = 44;
const MAX_CHARS_PER_LINE = 88;

/** Punctuation the WinAnsi base font cannot spell, mapped to ASCII. */
const WINANSI_FALLBACKS: Record<string, string> = {
  "—": "-",
  "–": "-",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "…": "...",
  " ": " ",
};

/**
 * Report HTML to plain text lines: block tags become line breaks, all other
 * tags are dropped, entities are decoded, and long lines wrap on words.
 */
export function reportHtmlToTextLines(html: string): string[] {
  const withBreaks = html
    .replace(/<\s*(br|p|div|h[1-6]|li|tr|section|article)[^>]*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|tr|section|article)[^>]*>/gi, "\n");
  const stripped = withBreaks
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&rarr;|&#8594;/g, "->")
    .replace(/&[a-z]+;|&#[0-9]+;/gi, "");
  const lines: string[] = [];
  for (const raw of stripped.split("\n")) {
    const words = raw.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const next = current.length === 0 ? word : `${current} ${word}`;
      if (next.length > MAX_CHARS_PER_LINE && current.length > 0) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    lines.push(current);
  }
  return lines;
}

/** One text line to a PDF literal string in the WinAnsi-compatible subset. */
function toPdfLiteral(line: string): string {
  let out = "";
  for (const char of line) {
    const mapped = WINANSI_FALLBACKS[char] ?? char;
    // The base-14 fonts spell latin-1 directly; anything outside it (emoji,
    // CJK, symbols) becomes a question mark rather than a corrupt byte.
    const code = mapped.length === 1 ? mapped.codePointAt(0)! : 63;
    if (mapped.length !== 1 || code > 255) {
      out += "?";
    } else if (char === "(" || char === ")" || char === "\\") {
      out += `\\${char}`;
    } else {
      out += mapped;
    }
  }
  return `(${out})`;
}

/**
 * The report as a PDF file's bytes. One document, Helvetica throughout, the
 * title as an 18pt heading on page one and the body at 12pt below it. The
 * fixture marker strings survive verbatim (ASCII hyphens and digits), so
 * text extraction of the file contains them.
 */
export function generateReportPdf(input: ReportPdfInput): Uint8Array {
  const titleLines = reportHtmlToTextLines(`<p>${input.title}</p>`).filter(
    (line) => line.length > 0,
  );
  const bodyLines = reportHtmlToTextLines(input.html);

  // Paginate: the title block rides on page one only.
  const pages: Array<{ size: number; lines: string[]; heading: boolean }> = [];
  let rest = bodyLines;
  let first = true;
  while (rest.length > 0 || first) {
    const budget = first
      ? MAX_BODY_LINES_PER_PAGE - titleLines.length - 1
      : MAX_BODY_LINES_PER_PAGE;
    const chunk = rest.slice(0, Math.max(budget, 0));
    rest = rest.slice(chunk.length);
    pages.push({ size: first ? HEADING_SIZE : BODY_SIZE, lines: chunk, heading: first });
    first = false;
    if (pages.length > 200) break;
  }

  const objects: string[] = [];
  const contentIndices: number[] = [];
  const pageIndices: number[] = [];

  // Object 1: catalog. Object 2: pages (kids filled in below).
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("__PAGES__");

  const fontIndex = 3;
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (const page of pages) {
    const ops: string[] = ["BT"];
    let y = PAGE_HEIGHT - MARGIN;
    if (page.heading) {
      for (const line of titleLines) {
        ops.push(`/F1 ${HEADING_SIZE} Tf 1 0 0 1 ${MARGIN} ${y} Tm ${toPdfLiteral(line)} Tj`);
        y -= HEADING_SIZE + 6;
      }
      y -= 6;
    }
    ops.push(`/F1 ${BODY_SIZE} Tf ${LEADING} TL`);
    ops.push(`1 0 0 1 ${MARGIN} ${y} Tm`);
    for (const line of page.lines) {
      ops.push(`${toPdfLiteral(line)} Tj T*`);
    }
    // A blank report still emits a valid text block.
    if (page.lines.length === 0) ops.push(`${toPdfLiteral("")} Tj T*`);
    ops.push("ET");
    const stream = ops.join("\n");
    contentIndices.push(objects.length + 1);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIndices.push(objects.length + 1);
    const contentRef = contentIndices[contentIndices.length - 1];
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontIndex} 0 R >> >> /Contents ${contentRef} 0 R >>`,
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageIndices.map((i) => `${i} 0 R`).join(" ")}] /Count ${pageIndices.length} >>`;

  const pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  // Offsets count bytes; every emitted char is latin-1, one byte each.
  const encoder = (s: string) =>
    Array.from(s)
      .map((ch) => {
        const code = ch.codePointAt(0)!;
        return code <= 255 ? String.fromCharCode(code) : "?";
      })
      .join("");
  let latin1 = encoder(pdf);
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(latin1.length);
    latin1 += `${i + 1} 0 obj\n${encoder(objects[i])}\nendobj\n`;
  }
  const xrefAt = latin1.length;
  latin1 += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    latin1 += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  latin1 += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return Uint8Array.from(Array.from(latin1).map((ch) => ch.charCodeAt(0)));
}
