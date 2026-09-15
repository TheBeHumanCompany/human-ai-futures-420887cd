import { readFile, writeFile } from "node:fs/promises";

import { reportsOf, type ClientRecord, type ClientReport } from "./tokens";

/**
 * Paste-HTML publisher for the private client portal (US-005).
 *
 * The author pastes report HTML plus a client identifier; this makes it live
 * on that client's page. It writes to the content store ONLY
 * (`content/clients.json`) — never to site code paths (`src/routes`,
 * `src/components`, `src/lib`) — so a publish run is data, not a deploy.
 *
 * Two shapes, decided by the record already in the store:
 * - a record carrying a usable `reports` list gets an upsert into that list
 *   (matching id updates in place, a new id appends last);
 * - a legacy record with no `reports` key keeps its shape when the default
 *   report id is published (its `title`/`html` update in place), and migrates
 *   to a list — legacy body first, new report appended — when a new report
 *   id arrives, so the old body is never lost.
 *
 * The client's `id`, `name`, and `token` are never touched: publishing and
 * editing reports must not rotate the link (US-007 owns tier changes on the
 * same token; US-008 owns revoke/re-issue). A record whose `reports` key is
 * present but unusable is refused outright rather than rewritten — dropping
 * entries the publisher does not understand would be silent data loss, and
 * the store is pinned well-formed by tests, so that branch stays unreachable
 * in practice.
 */

export interface PublishReportInput {
  /** Stable client handle, e.g. `acme-industrial`. Must already exist. */
  clientId: string;
  /** Report handle within the client's page; doubles as the tab value. */
  reportId: string;
  /** Report title rendered in the sidebar and above the report body. */
  title: string;
  /** The report body, as authored HTML, stored verbatim (trusted author). */
  html: string;
}

export interface PublishReportResult {
  clientId: string;
  reportId: string;
  /** True when a report was appended, false when an existing one updated. */
  created: boolean;
}

/** The singleton id a legacy record (no `reports` list) renders under. */
export const LEGACY_REPORT_ID = "report";

/** Report ids travel in tab values and URLs: keep them slug-shaped. */
const REPORT_ID_FORMAT = /^[A-Za-z0-9_-]+$/;

function isReportLike(value: unknown): value is ClientReport {
  if (typeof value !== "object" || value === null) return false;
  const report = value as Record<string, unknown>;
  return (
    typeof report.id === "string" &&
    report.id.length > 0 &&
    typeof report.title === "string" &&
    typeof report.html === "string"
  );
}

/**
 * A list the page can actually render as tabs: non-empty, well-shaped, and
 * with unique ids (two tabs sharing a value activate together — see
 * `reportsOf` in `tokens.ts`, which applies the same rule on the read path).
 */
function isUsableReportList(value: unknown): value is ClientReport[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (!value.every(isReportLike)) return false;
  return new Set(value.map((report) => report.id)).size === value.length;
}

function fail(message: string): never {
  throw new Error(`[client-portal] ${message}`);
}

function checkInput(input: PublishReportInput): void {
  if (typeof input.clientId !== "string" || input.clientId.length === 0) {
    fail("expected a non-empty --client id");
  }
  if (typeof input.reportId !== "string" || !REPORT_ID_FORMAT.test(input.reportId)) {
    fail(
      `expected --report to be slug-shaped (letters, digits, -, _), received ${JSON.stringify(input.reportId)}`,
    );
  }
  if (typeof input.title !== "string" || input.title.length === 0) {
    fail("expected a non-empty --title");
  }
  if (typeof input.html !== "string" || input.html.length === 0) {
    fail("expected non-empty report HTML from --html or --html-file");
  }
}

/**
 * Upserts one report into a store, returning the new store. Pure: the input
 * array and its records are never mutated, so callers can diff or discard.
 */
export function publishReportToStore(
  clients: readonly ClientRecord[],
  input: PublishReportInput,
): { clients: ClientRecord[]; created: boolean } {
  checkInput(input);

  const index = clients.findIndex(
    (candidate) => typeof candidate?.id === "string" && candidate.id === input.clientId,
  );
  if (index === -1) {
    const known = clients
      .map((candidate) => (typeof candidate?.id === "string" ? candidate.id : null))
      .filter((id): id is string => id !== null);
    fail(
      `unknown client ${JSON.stringify(input.clientId)}` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : " (the store holds no clients)"),
    );
  }
  const record = clients[index]!;
  if (typeof record.title !== "string" || typeof record.html !== "string") {
    fail(`client ${JSON.stringify(input.clientId)} has no usable title/html to publish beside`);
  }

  const entry: ClientReport = { id: input.reportId, title: input.title, html: input.html };

  if (isUsableReportList(record.reports)) {
    const at = record.reports.findIndex((report) => report.id === input.reportId);
    const reports =
      at === -1
        ? [...record.reports, entry]
        : record.reports.map((report, i) => (i === at ? entry : report));
    return {
      clients: clients.map((candidate, i) => (i === index ? { ...record, reports } : candidate)),
      created: at === -1,
    };
  }

  if (record.reports !== undefined) {
    // Present but unusable (empty, malformed, or repeated ids): refuse rather
    // than rewrite entries this tool does not understand.
    fail(
      `client ${JSON.stringify(input.clientId)} has a reports list the page cannot render — fix it by hand before publishing`,
    );
  }

  if (input.reportId === LEGACY_REPORT_ID) {
    return {
      clients: clients.map((candidate, i) =>
        i === index ? { ...record, title: input.title, html: input.html } : candidate,
      ),
      created: false,
    };
  }

  // A second report on a legacy record: the old body becomes the first tab so
  // nothing the client already saw disappears.
  const [legacy] = reportsOf(record);
  return {
    clients: clients.map((candidate, i) =>
      i === index
        ? {
            ...record,
            reports: [{ id: legacy!.id, title: legacy!.title, html: legacy!.html }, entry],
          }
        : candidate,
    ),
    created: true,
  };
}

/**
 * Publishes one report into the store file at `storePath` — the only path
 * this tool ever writes. Reads the file, upserts, and writes it back with
 * the store's own formatting (2-space indent, trailing newline).
 */
export async function publishReportToFile(
  storePath: string,
  input: PublishReportInput,
  io: { readFile?: typeof readFile; writeFile?: typeof writeFile } = {},
): Promise<PublishReportResult> {
  const read = io.readFile ?? readFile;
  const write = io.writeFile ?? writeFile;

  let raw: string;
  try {
    raw = await read(storePath, "utf8");
  } catch {
    fail(`cannot read the content store at ${storePath}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw!);
  } catch {
    fail(`the content store at ${storePath} is not valid JSON — leaving it untouched`);
  }
  if (!Array.isArray(parsed)) {
    fail(`the content store at ${storePath} is not a client list — leaving it untouched`);
  }

  const { clients, created } = publishReportToStore(parsed as ClientRecord[], input);
  await write(storePath, `${JSON.stringify(clients, null, 2)}\n`, "utf8");
  return { clientId: input.clientId, reportId: input.reportId, created };
}
