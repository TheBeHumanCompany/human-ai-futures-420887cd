/**
 * Generates a client report PDF on explicit request (US-006).
 *
 * The default send is the HTML magic link only and never attaches a PDF.
 * This is the one action that produces one: it reads the same report HTML
 * the portal serves (from `content/clients.json`) and writes a PDF file.
 * Nothing is mailed here — the operator sends the file, or it stays local.
 *
 * Run with:
 *   bun scripts/generate-client-pdf.ts --client acme-industrial \
 *     --report preliminary --out ./acme-preliminary.pdf
 *   bun run portal:pdf -- --client acme-industrial --out ./acme-preliminary.pdf
 *
 * `--report` defaults to the client's first report. `--out` defaults to
 * `<client>-<report>.pdf` in the current directory.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { generateReportPdf } from "../src/lib/client-portal/report-pdf";
import { reportsOf, type ClientRecord } from "../src/lib/client-portal/tokens";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STORE = path.join(REPO_ROOT, "content", "clients.json");

interface Options {
  clientId: string;
  reportId?: string;
  store: string;
  out?: string;
}

function usage(): string {
  return [
    "usage: bun scripts/generate-client-pdf.ts --client <id>",
    "         [--report <report-id>] [--out <path>] [--store <path>]",
    "",
    "  --client    existing client id in the content store (e.g. acme-industrial)",
    "  --report    report handle within the page (default: the client's first report)",
    "  --out       output PDF path (default: <client>-<report>.pdf here)",
    `  --store     content-store path (default: ${path.relative(process.cwd(), DEFAULT_STORE)})`,
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

function isClientRecord(value: unknown): value is ClientRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === "string"
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const clientId = takeValue(argv, "--client");
  if (!clientId) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  const options: Options = {
    clientId,
    reportId: takeValue(argv, "--report"),
    store: takeValue(argv, "--store") ?? DEFAULT_STORE,
    out: takeValue(argv, "--out"),
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(options.store, "utf8"));
  } catch {
    console.error(`[client-portal] cannot read the content store at ${options.store}`);
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(parsed)) {
    console.error(`[client-portal] the content store at ${options.store} is not a client list`);
    process.exitCode = 1;
    return;
  }
  const record = (parsed as unknown[]).filter(isClientRecord).find(
    (entry) => entry.id === options.clientId,
  );
  if (!record) {
    const known = (parsed as unknown[])
      .filter(isClientRecord)
      .map((entry) => entry.id)
      .join(", ");
    console.error(
      `[client-portal] unknown client ${JSON.stringify(options.clientId)}${known ? ` (known: ${known})` : ""}`,
    );
    process.exitCode = 1;
    return;
  }

  const reports = reportsOf(record);
  const report = options.reportId
    ? reports.find((entry) => entry.id === options.reportId)
    : reports[0];
  if (!report) {
    console.error(
      `[client-portal] unknown report ${JSON.stringify(options.reportId)} on client ${JSON.stringify(options.clientId)} (known: ${reports.map((entry) => entry.id).join(", ")})`,
    );
    process.exitCode = 1;
    return;
  }

  const pdf = generateReportPdf({ title: report.title, html: report.html });
  const outPath = options.out ?? path.resolve(`${options.clientId}-${report.id}.pdf`);
  await writeFile(outPath, pdf);
  console.log(
    `[client-portal] wrote report ${JSON.stringify(report.id)} for client ${JSON.stringify(options.clientId)} to ${outPath} (${pdf.length} bytes, HTML default untouched)`,
  );
}

await main();
