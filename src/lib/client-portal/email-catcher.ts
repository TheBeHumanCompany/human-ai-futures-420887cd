/**
 * The email-catcher contract, defined once for both sides of the funnel tier.
 *
 * When `FUNNEL_EMAIL_CATCHER_DIR` is set, `deliverMagicLinkEmail` writes the
 * exact Resend send body it would have delivered to this directory instead of
 * opening a connection — the deterministic tier captures the send locally, so
 * no real email leaves (plan Must-NOT-Have). The funnel poller
 * (`e2e/funnel/helpers.ts`) reads these files back and extracts the magic
 * link. Because the seam writes and the poller reads, the payload schema
 * below is the single spelling both sides share, and every read parses it —
 * a malformed capture fails loudly, naming the file.
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** The directory override: set in the server process by the funnel preflight. */
export const CATCHER_DIR_ENV = "FUNNEL_EMAIL_CATCHER_DIR";

/** The send body, byte-for-byte what the Resend API would have received. */
export interface EmailCatcherBody {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
}

/** One intercepted send: the body plus the envelope the poller asserts on. */
export interface EmailCatcherPayload {
  capturedAt: string;
  endpoint: string;
  body: EmailCatcherBody;
}

const FILE_PREFIX = "send-";
const FILE_SUFFIX = ".json";

/** Millisecond-stamped and uniqued, so lexical order is arrival order. */
export function catcherFileName(now: Date = new Date()): string {
  return `${FILE_PREFIX}${now.getTime()}-${crypto.randomUUID()}${FILE_SUFFIX}`;
}

function requireString(source: Record<string, unknown>, field: string): string {
  const value = source[field];
  if (typeof value !== "string") {
    throw new Error(`email-catcher: field "${field}" must be a string`);
  }
  return value;
}

function requireStringArray(source: Record<string, unknown>, field: string): string[] {
  const value = source[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`email-catcher: field "${field}" must be an array of strings`);
  }
  return value;
}

/**
 * Parse one capture from its file text. Every malformation throws with the
 * file path attached — a silently skipped capture would read as a passing
 * funnel tier that never received its link.
 */
export function parseCatcherPayload(text: string, filePath: string): EmailCatcherPayload {
  const fail = (detail: string): Error =>
    new Error(`email-catcher: ${filePath} is not a valid capture: ${detail}`);
  let source: unknown;
  try {
    source = JSON.parse(text);
  } catch {
    throw fail("not parseable JSON");
  }
  if (source == null || typeof source !== "object" || Array.isArray(source)) {
    throw fail("expected a JSON object");
  }
  const record = source as Record<string, unknown>;
  try {
    const capturedAt = requireString(record, "capturedAt");
    const endpoint = requireString(record, "endpoint");
    const body = record.body;
    if (body == null || typeof body !== "object" || Array.isArray(body)) {
      throw new Error('expected a "body" object');
    }
    const bodyRecord = body as Record<string, unknown>;
    return {
      capturedAt,
      endpoint,
      body: {
        from: requireString(bodyRecord, "from"),
        to: requireStringArray(bodyRecord, "to"),
        reply_to: requireString(bodyRecord, "reply_to"),
        subject: requireString(bodyRecord, "subject"),
        html: requireString(bodyRecord, "html"),
        text: requireString(bodyRecord, "text"),
      },
    };
  } catch (error) {
    throw fail(error instanceof Error ? error.message : String(error));
  }
}

/** Write one capture. Creates the directory; returns the file written. */
export async function writeCatcherPayload(
  dir: string,
  endpoint: string,
  body: EmailCatcherBody,
  now: Date = new Date(),
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, catcherFileName(now));
  const payload: EmailCatcherPayload = {
    capturedAt: now.toISOString(),
    endpoint,
    body,
  };
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

/**
 * The newest capture in the directory, or null when nothing has been
 * intercepted yet. A malformed file throws with its path — the poller
 * surfaces it, it never skips ahead.
 */
export async function readLatestCatcherPayload(dir: string): Promise<EmailCatcherPayload | null> {
  const names = (await readdir(dir))
    .filter((name) => name.startsWith(FILE_PREFIX) && name.endsWith(FILE_SUFFIX))
    .sort()
    .reverse();
  if (names.length === 0) return null;
  const file = path.join(dir, names[0]!);
  return parseCatcherPayload(await readFile(file, "utf8"), file);
}
