/**
 * Operator export for the preliminary blueprint — the same document the
 * portal serves, as one self-contained file.
 *
 * usage: bun scripts/export-blueprint.ts (--rows <file> | --client <id>) [--unlocked]
 *          [--out <file>] [--pdf <file>] [--paper Letter|A4]
 *          [--allow-fallback-fonts] [--dry-run]
 *
 *   --rows                  section rows JSON (`gtm blueprint --rows` output, or a fixture)
 *   --client                published client id; reads rows from Supabase
 *   --unlocked              render final sections unlocked (default: the preliminary)
 *   --out                   HTML destination (default: test-results/blueprint/<id>.html)
 *   --pdf                   also print the HTML to this PDF with Playwright Chromium
 *   --paper                 Letter (default) or A4
 *   --allow-fallback-fonts  print even when Oswald/Work Sans did not load
 *   --dry-run               render and validate into test-results/blueprint/, no PDF
 *
 * Shaped after `scripts/upload-email-templates.ts`: validate everything before
 * anything is written, name the offending row when refusing, echo no secrets.
 *
 * WHY THE STYLESHEET IS COMPILED RATHER THAN COPIED. The export's whole claim
 * is that it looks exactly like `/c/<token>`. A hand-maintained CSS file beside
 * it would be true on the day it was written and quietly false afterwards, and
 * the failure mode is a client opening an attachment that does not match their
 * portal. Compiling `src/styles.css` through Tailwind's own compiler, scanned
 * over the sources `@source "../src"` names, is the same input the Vite build
 * uses — so there is one stylesheet, not two.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

import { RENDERED_BLOCK_TYPES } from "../src/components/client-portal/blueprint/blocks";
import {
  BlueprintDocument,
  documentLineOf,
  titleOf,
} from "../src/components/client-portal/blueprint/blueprint-document";
import {
  applyTier,
  parseSections,
  type BlueprintSection,
} from "../src/lib/client-portal/blueprint-schema";
import { fetchBlueprintSections } from "../src/lib/client-portal/blueprint-store";
import { FONT_LINKS, REQUIRED_FONT_SPECIFIERS } from "../src/lib/fonts";
import { supabaseConfigFromEnv } from "../src/lib/client-portal/supabase-tokens";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "test-results", "blueprint");

export type Paper = "Letter" | "A4";

export interface ExportOptions {
  unlocked?: boolean;
  paper?: Paper;
}

function usage(): string {
  return [
    "usage: bun scripts/export-blueprint.ts (--rows <file> | --client <id>) [--unlocked]",
    "         [--out <file>] [--pdf <file>] [--paper Letter|A4]",
    "         [--allow-fallback-fonts] [--dry-run]",
    "",
    "  --rows                  section rows JSON (gtm blueprint --rows output, or a fixture)",
    "  --client                published client id; reads rows from Supabase",
    "  --unlocked              render final sections unlocked (default: the preliminary)",
    "  --out                   HTML destination (default: test-results/blueprint/<id>.html)",
    "  --pdf                   also print the HTML to this PDF with Playwright Chromium",
    "  --paper                 Letter (default) or A4",
    "  --allow-fallback-fonts  print even when Oswald/Work Sans did not load",
    "  --dry-run               render and validate into test-results/blueprint/, no PDF",
  ].join("\n");
}

function takeValue(args: string[], flag: string): string | undefined {
  const at = args.indexOf(flag);
  if (at === -1) return undefined;
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} needs a value`);
  }
  return value;
}

/**
 * The readability gate, run before a single byte is written.
 *
 * `parseBlocks` deliberately keeps a block it does not recognise, because a
 * live page must not break on a row from a newer generator. An export has the
 * opposite obligation: it is emailed, read once, and never reconciled against
 * the portal, so a dropped block is a hole nobody notices. Refuse, and name
 * the row.
 */
export function checkExportable(sections: readonly BlueprintSection[]): void {
  const heroes = sections.filter((section) => section.band === "hero");
  if (heroes.length !== 1) {
    throw new Error(
      `[blueprint] expected exactly one hero row, found ${heroes.length}: a blueprint with no masthead is not a document`,
    );
  }
  if (titleOf(sections) === null) {
    throw new Error(
      `[blueprint] the hero row ${heroes[0]!.sectionKey} carries no title block — see KNOWN_BANDS in blueprint-schema.ts`,
    );
  }

  const offenders = sections.flatMap((section) =>
    (section.blocks ?? [])
      .filter((block) => !RENDERED_BLOCK_TYPES.has(block.type))
      .map((block) => `${section.sectionKey}: ${block.type}`),
  );
  if (offenders.length > 0) {
    throw new Error(
      `[blueprint] no renderer for ${offenders.length} block(s): ${offenders.join(", ")}`,
    );
  }
}

/** The app's own stylesheet, compiled over the app's own sources. */
export async function compileStylesheet(): Promise<string> {
  const entry = path.join(REPO_ROOT, "src", "styles.css");
  const css = await readFile(entry, "utf8");
  const compiler = await compile(css, {
    base: path.join(REPO_ROOT, "src"),
    onDependency() {},
  });
  const candidates = new Scanner({ sources: compiler.sources }).scan();
  return compiler.build(candidates);
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character,
  );

const fontLinkTags = () =>
  FONT_LINKS.map((link) => {
    const crossOrigin = link.crossOrigin ? ` crossorigin="${link.crossOrigin}"` : "";
    return `<link rel="${link.rel}" href="${escapeHtml(link.href)}"${crossOrigin}>`;
  }).join("\n");

/**
 * Renders the rows to one standalone HTML document.
 *
 * No `<script>`: the file is a document, not an app, and it is opened from
 * disk and from mail clients where script would be the first thing stripped
 * anyway. `renderToStaticMarkup` rather than react-email's `render` — that one
 * applies email-only transforms (inlining, table wrapping) this page must not
 * have, because the portal does not have them either.
 */
export async function renderSections(
  sections: readonly BlueprintSection[],
): Promise<{ html: string; stylesheet: string }> {
  checkExportable(sections);

  const title = titleOf(sections)!;
  const stylesheet = await compileStylesheet();
  const markup = renderToStaticMarkup(
    createElement(BlueprintDocument, { sections, variant: "export" }) as ReactElement,
  );

  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(documentLineOf(title))}</title>`,
    fontLinkTags(),
    `<style>\n${stylesheet}\n</style>`,
    "</head>",
    "<body>",
    markup,
    "</body>",
    "</html>",
    "",
  ].join("\n");

  return { html, stylesheet };
}

/** Raw section rows — a `gtm blueprint --rows` file, or a fixture. */
export async function renderBlueprint(
  rows: unknown,
  options: ExportOptions = {},
): Promise<{ html: string; sections: BlueprintSection[]; stylesheet: string }> {
  const sections = applyTier(parseSections(rows), options.unlocked ?? false);
  return { ...(await renderSections(sections)), sections };
}

async function readRows(rowsFile: string): Promise<unknown> {
  return JSON.parse(await readFile(rowsFile, "utf8")) as unknown;
}

/** `…/blueprint-rows.birch-bark-coffee.json` → `birch-bark-coffee`. */
const idFromRowsPath = (rowsFile: string) =>
  path
    .basename(rowsFile)
    .replace(/\.json$/, "")
    .replace(/^blueprint-rows\./, "");

async function printPdf(
  html: string,
  pdfPath: string,
  paper: Paper,
  allowFallbackFonts: boolean,
): Promise<void> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("[blueprint] playwright is not installed: bun add -d playwright");
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.error("[blueprint] no Chromium for Playwright: bunx playwright install chromium");
    process.exit(1);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // The font probe `podcasts/src/podcasts/gtm_pdf.py` makes, and for the
    // same reason: a blocked or slow Google Fonts request does not fail, it
    // silently substitutes, and the PDF that lands in a client's inbox is the
    // blueprint set in Helvetica. Make it loud.
    const missing = await page.evaluate(
      (specifiers: string[]) => specifiers.filter((s) => !document.fonts.check(s)),
      [...REQUIRED_FONT_SPECIFIERS],
    );
    if (missing.length > 0 && !allowFallbackFonts) {
      throw new Error(
        `[blueprint] fonts did not load: ${missing.join(", ")} — check network access to fonts.googleapis.com, or pass --allow-fallback-fonts`,
      );
    }
    if (missing.length > 0) {
      console.warn(`[blueprint] printing with fallback fonts: ${missing.join(", ")}`);
    }

    await page.pdf({
      path: pdfPath,
      format: paper,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(usage());
    return;
  }

  const rowsFile = takeValue(args, "--rows");
  const clientId = takeValue(args, "--client");
  if ((rowsFile === undefined) === (clientId === undefined)) {
    throw new Error(`${usage()}\n\nexactly one of --rows or --client is required`);
  }

  const paper = (takeValue(args, "--paper") ?? "Letter") as Paper;
  if (paper !== "Letter" && paper !== "A4") {
    throw new Error(`${usage()}\n\nunknown paper: ${paper}`);
  }
  const unlocked = args.includes("--unlocked");
  const dryRun = args.includes("--dry-run");
  const allowFallbackFonts = args.includes("--allow-fallback-fonts");

  let sections: readonly BlueprintSection[];
  let id: string;
  if (rowsFile !== undefined) {
    sections = applyTier(parseSections(await readRows(rowsFile)), unlocked);
    id = idFromRowsPath(rowsFile);
  } else {
    const config = supabaseConfigFromEnv();
    if (config === null) {
      throw new Error(
        "[blueprint] --client needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment",
      );
    }
    // The store parses and applies the tier itself — the same call the portal
    // makes, so the export cannot disagree with the page about what is locked.
    sections = await fetchBlueprintSections(clientId!, unlocked, config);
    id = clientId!;
  }

  const { html } = await renderSections(sections);

  const out = takeValue(args, "--out") ?? path.join(OUT_DIR, `${id}.html`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, html);
  console.log(
    `${id}: ${sections.length} sections, ${html.length} bytes → ${path.relative(process.cwd(), out)}`,
  );

  const pdf = takeValue(args, "--pdf");
  if (pdf === undefined || dryRun) return;
  await mkdir(path.dirname(path.resolve(pdf)), { recursive: true });
  await printPdf(html, pdf, paper, allowFallbackFonts);
  console.log(`${id}: ${paper} → ${path.relative(process.cwd(), path.resolve(pdf))}`);
}

if (import.meta.main) {
  await main();
}
