/**
 * Operator upload for Resend Templates (emails/ → api.resend.com/templates).
 *
 * usage: bun scripts/upload-email-templates.ts [--dry-run] [--no-publish] [--only <alias>]
 *
 * Renders each template in emails/_resend/manifest.ts with its {{{KEY}}}
 * placeholder props, verifies every placeholder is a declared variable (and
 * every declared variable is used), then creates-or-updates the template on
 * Resend by its stable alias and publishes it. Prints the alias → id mapping
 * and nothing else sensitive: the API key is read from the environment
 * (RESEND_API_KEY, auto-loaded from .env.local) and is never echoed.
 *
 * --dry-run    render + verify + write test-results/email-templates/<alias>.{html,txt}, no network
 * --no-publish create/update but leave the template as a draft
 * --only       restrict to one alias, e.g. --only magic-link
 *
 * Raw fetch, no SDK — the repo's no-SDK Resend idiom (src/lib/contact.ts,
 * src/lib/client-portal/magic-link-email.ts). Resend's {{{X}}} substitution is
 * raw/unescaped: whoever sends template variables must HTML-escape them.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createElement, type ReactElement } from "react";
import { render } from "react-email";

import { TEMPLATES, type AnyTemplateSpec } from "../emails/_resend/manifest";

const RESEND_ENDPOINT = "https://api.resend.com/templates";
/** A provider call that never returns must not hold the upload open forever. */
const SEND_TIMEOUT_MS = 10_000;

/** Resend rejects these variable names outright. */
const RESERVED_KEYS: readonly string[] = [
  "FIRST_NAME",
  "LAST_NAME",
  "EMAIL",
  "RESEND_UNSUBSCRIBE_URL",
  "contact",
  "this",
];
const MAX_VARIABLES = 50;

const PLACEHOLDER = /\{\{\{([A-Z0-9_]+)\}\}\}/g;

export function collectPlaceholders(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER)) {
    found.add(match[1]);
  }
  return found;
}

export async function renderTemplate(
  spec: AnyTemplateSpec,
): Promise<{ html: string; text: string }> {
  const element = createElement(
    spec.component,
    spec.resendProps as never,
  ) as unknown as ReactElement;
  return {
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}

/**
 * The upload gate: a placeholder present in html/text/subject but missing
 * from `variables` would ship to clients as literal braces; a declared
 * variable never used would dead-weight every send's payload.
 */
export function checkVariables(spec: AnyTemplateSpec, html: string, text: string): void {
  const reserved = spec.variables.filter((variable) => RESERVED_KEYS.includes(variable.key));
  if (reserved.length > 0) {
    throw new Error(
      `[${spec.alias}] reserved variable keys: ${reserved.map((v) => v.key).join(", ")}`,
    );
  }
  if (spec.variables.length > MAX_VARIABLES) {
    throw new Error(
      `[${spec.alias}] ${spec.variables.length} variables exceeds Resend's ${MAX_VARIABLES}`,
    );
  }

  const declared = new Set(spec.variables.map((variable) => variable.key));
  const used = collectPlaceholders(`${html}\n${text}\n${spec.subject}`);

  const undeclared = [...used].filter((key) => !declared.has(key));
  if (undeclared.length > 0) {
    throw new Error(
      `[${spec.alias}] placeholders used but not declared in variables: ${undeclared.join(", ")}`,
    );
  }
  const unused = [...declared].filter((key) => !used.has(key));
  if (unused.length > 0) {
    throw new Error(`[${spec.alias}] variables declared but never used: ${unused.join(", ")}`);
  }
}

function usage(): string {
  return [
    "usage: bun scripts/upload-email-templates.ts [--dry-run] [--no-publish] [--only <alias>]",
    "",
    "  --dry-run     render + verify, write test-results/email-templates/, no network",
    "  --no-publish  create/update but leave the template as a draft",
    "  --only        restrict to one alias, e.g. --only magic-link",
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

async function request(
  path: string,
  method: "POST" | "PATCH",
  apiKey: string,
  body?: unknown,
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetch(`${RESEND_ENDPOINT}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      payload = { message: text };
    }
    return { status: response.status, payload };
  } finally {
    clearTimeout(timeout);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(usage());
    return;
  }
  const dryRun = args.includes("--dry-run");
  const publish = !args.includes("--no-publish");
  const only = takeValue(args, "--only");
  const specs = only ? TEMPLATES.filter((spec) => spec.alias === only) : TEMPLATES;
  if (only && specs.length === 0) {
    throw new Error(`${usage()}\n\nunknown alias: ${only}`);
  }

  const apiKey = process.env["RESEND_API_KEY"];
  if (!dryRun && !apiKey) {
    throw new Error("[email] RESEND_API_KEY is not set");
  }

  const outDir = "test-results/email-templates";
  if (dryRun) {
    await mkdir(outDir, { recursive: true });
  }

  // Render + verify everything before any network call, so one bad template
  // cannot leave a half-uploaded set.
  const rendered: Array<{ spec: AnyTemplateSpec; html: string; text: string }> = [];
  for (const spec of specs) {
    const result = await renderTemplate(spec);
    checkVariables(spec, result.html, result.text);
    rendered.push({ spec, ...result });
  }

  for (const { spec, html, text } of rendered) {
    if (dryRun) {
      await writeFile(`${outDir}/${spec.alias}.html`, html);
      await writeFile(`${outDir}/${spec.alias}.txt`, text);
      const table = spec.variables
        .map(
          (variable) =>
            `    ${variable.key} (${variable.type}${variable.fallback_value === undefined ? "" : `, fallback: ${JSON.stringify(variable.fallback_value)}`})`,
        )
        .join("\n");
      console.log(
        `[dry-run] ${spec.alias}: ${html.length} bytes html, ${text.length} bytes text\n${table}`,
      );
      continue;
    }

    const body = {
      name: spec.name,
      alias: spec.alias,
      html,
      text,
      from: spec.from,
      subject: spec.subject,
      reply_to: spec.reply_to,
      variables: spec.variables,
    };

    // PATCH by alias. 2xx includes 201: Resend upserts on the alias path and
    // answers 201 when the alias did not exist yet. 404 (or a not_found body)
    // falls back to an explicit create.
    let status: string;
    let id: string | undefined;
    let attempt = await request(`/${spec.alias}`, "PATCH", apiKey!, body);
    if (attempt.status >= 200 && attempt.status < 300) {
      status = "updated";
      id = attempt.payload["id"] as string;
    } else if (
      attempt.status === 404 ||
      String(attempt.payload["name"] ?? "").includes("not_found")
    ) {
      attempt = await request("", "POST", apiKey!, body);
      if (attempt.status < 200 || attempt.status >= 300) {
        console.error(
          `[email] ${spec.alias} create ${attempt.status}: ${JSON.stringify(attempt.payload)}`,
        );
        process.exit(1);
      }
      status = "created";
      id = attempt.payload["id"] as string;
    } else {
      console.error(`[email] ${spec.alias} ${attempt.status}: ${JSON.stringify(attempt.payload)}`);
      process.exit(1);
    }

    let published = "draft";
    if (publish) {
      const published_ = await request(`/${id}/publish`, "POST", apiKey!);
      if (published_.status < 200 || published_.status >= 300) {
        console.error(
          `[email] ${spec.alias} publish ${published_.status}: ${JSON.stringify(published_.payload)}`,
        );
        process.exit(1);
      }
      published = "published";
    }

    console.log(`${spec.alias} → ${id} (${status}, ${published})`);
  }
}

if (import.meta.main) {
  await main();
}
