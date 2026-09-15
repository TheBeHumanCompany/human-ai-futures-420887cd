/**
 * Pastes report HTML onto a client's page (US-005).
 *
 * The one publish path: pasted HTML plus a client identifier goes live on
 * that client's page without hand-editing site code. It writes to the
 * content store ONLY (`content/clients.json`, overridable with `--store` for
 * fixture runs against a copy) — never to `src/routes`, `src/components`,
 * or `src/lib` — and never touches the client's token, so the URL is stable
 * across publishes and edits.
 *
 * Run with:
 *   bun scripts/publish-client-report.ts --client acme-industrial \
 *     --report q3-review --title "Q3 Review" --html-file ./report.html
 *   bun scripts/publish-client-report.ts --client beacon-health \
 *     --title "Beacon Health — Preliminary Blueprint" --html "<p>…</p>"
 *   bun run portal:publish -- --client acme-industrial --report q3-review \
 *     --title "Q3 Review" --html-file ./report.html
 *
 * `--report` defaults to `report` (the legacy singleton a record without a
 * `reports` list renders under). Exactly one of `--html` / `--html-file` is
 * required. `--dry-run` plans the change and writes nothing.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  LEGACY_REPORT_ID,
  publishReportToFile,
  publishReportToStore,
} from "../src/lib/client-portal/publish";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STORE = path.join(REPO_ROOT, "content", "clients.json");

interface Options {
  clientId: string;
  reportId: string;
  title: string;
  html?: string;
  htmlFile?: string;
  store: string;
  dryRun: boolean;
}

function usage(): string {
  return [
    "usage: bun scripts/publish-client-report.ts --client <id> --title <title>",
    "         [--report <report-id>] (--html <html> | --html-file <path>)",
    "         [--store <path>] [--dry-run]",
    "",
    "  --client    existing client id in the content store (e.g. acme-industrial)",
    "  --report    report handle within the page (default: report); a new id",
    "              appends a report, a known id updates it in place",
    "  --title     report title shown in the sidebar and above the body",
    "  --html      report body as authored HTML",
    "  --html-file path to a file holding the report body",
    `  --store     content-store path (default: ${path.relative(process.cwd(), DEFAULT_STORE)})`,
    "  --dry-run   plan the change without writing",
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

function parseArgs(argv: string[]): Options {
  const clientId = takeValue(argv, "--client");
  const title = takeValue(argv, "--title");
  const html = takeValue(argv, "--html");
  const htmlFile = takeValue(argv, "--html-file");
  const store = takeValue(argv, "--store") ?? DEFAULT_STORE;

  if (!clientId || !title || (!html && !htmlFile) || (html && htmlFile)) {
    throw new Error(usage());
  }
  return {
    clientId,
    reportId: takeValue(argv, "--report") ?? LEGACY_REPORT_ID,
    title,
    html,
    htmlFile,
    store,
    dryRun: argv.includes("--dry-run"),
  };
}

async function tokenOf(storePath: string, clientId: string): Promise<string | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(storePath, "utf8"));
    if (!Array.isArray(parsed)) return null;
    const record = (parsed as Array<Record<string, unknown>>).find(
      (entry) => entry.id === clientId,
    );
    return typeof record?.token === "string" ? record.token : null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  let options: Options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  let html = options.html;
  if (options.htmlFile) {
    try {
      html = await readFile(path.resolve(options.htmlFile), "utf8");
    } catch {
      console.error(`[client-portal] cannot read --html-file ${options.htmlFile}`);
      process.exitCode = 1;
      return;
    }
  }

  const input = {
    clientId: options.clientId,
    reportId: options.reportId,
    title: options.title,
    html: html!,
  };

  if (options.dryRun) {
    let raw: string;
    try {
      raw = await readFile(options.store, "utf8");
    } catch {
      console.error(`[client-portal] cannot read the content store at ${options.store}`);
      process.exitCode = 1;
      return;
    }
    try {
      const { created } = publishReportToStore(JSON.parse(raw), input);
      console.log(
        `[client-portal] dry run: would ${created ? "append" : "update"} report ${JSON.stringify(options.reportId)} on client ${JSON.stringify(options.clientId)} in ${options.store} (token untouched)`,
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
    return;
  }

  const before = await tokenOf(options.store, options.clientId);
  try {
    const result = await publishReportToFile(options.store, input, { readFile, writeFile });
    const after = await tokenOf(options.store, options.clientId);
    console.log(
      `[client-portal] ${result.created ? "appended" : "updated"} report ${JSON.stringify(result.reportId)} on client ${JSON.stringify(result.clientId)} in ${options.store}`,
    );
    console.log(
      `[client-portal] token unchanged: ${before !== null && before === after ? "yes" : "NO — investigate"}`,
    );
    if (before === null || before !== after) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await main();
