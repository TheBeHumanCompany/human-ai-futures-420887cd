/**
 * Validates a human-review approval against `.approvals/schema.json`.
 *
 * A hand-rolled validator rather than a dependency: `bunfig.toml` enforces a
 * 24-hour `minimumReleaseAge` on new packages, and this schema is small,
 * closed (`additionalProperties: false`), and entirely under our control. The
 * cost of writing it is one file; the cost of a new dependency in a release
 * gate is a supply-chain surface on the path that decides what ships.
 *
 * Supports exactly the keywords `.approvals/schema.json` uses: type, required,
 * enum, pattern, minLength, additionalProperties, properties, items, allOf,
 * if/then. Anything else in a future schema is REPORTED AS UNSUPPORTED rather
 * than ignored — a validator that silently skips a constraint is worse than no
 * validator, because it produces a green.
 *
 * Usage: bun run scripts/verify/validate-approval.ts <approval.json> [schema.json]
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

type Schema = Record<string, unknown>;

const SUPPORTED = new Set([
  "$schema",
  "$id",
  "title",
  "description",
  "type",
  "required",
  "enum",
  "const",
  "pattern",
  "minLength",
  "format",
  "additionalProperties",
  "properties",
  "items",
  "allOf",
  "if",
  "then",
]);

const typeOf = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
};

function validate(value: unknown, schema: Schema, at: string, errors: string[]): void {
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED.has(keyword)) {
      errors.push(
        `${at}: schema uses unsupported keyword '${keyword}'. This validator would silently ` +
          `ignore it, so it refuses instead — a skipped constraint that reports success is worse ` +
          `than no validator at all. Add support for it in scripts/verify/validate-approval.ts.`,
      );
    }
  }

  if (typeof schema.type === "string") {
    const actual = typeOf(value);
    const ok =
      schema.type === "number"
        ? actual === "number" || actual === "integer"
        : actual === schema.type;
    if (!ok) {
      errors.push(`${at}: expected type ${schema.type}, got ${actual}`);
      return;
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value as never)) {
    errors.push(`${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }

  if ("const" in schema && value !== schema.const) {
    errors.push(`${at}: expected ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }

  if (typeof value === "string") {
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${at}: ${JSON.stringify(value)} does not match /${schema.pattern}/`);
    }
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push(`${at}: shorter than minLength ${schema.minLength}`);
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => validate(item, schema.items as Schema, `${at}[${i}]`, errors));
  }

  if (typeOf(value) === "object") {
    const obj = value as Record<string, unknown>;
    const props = (schema.properties ?? {}) as Record<string, Schema>;

    for (const key of (schema.required as string[] | undefined) ?? []) {
      if (!(key in obj)) errors.push(`${at}: missing required property '${key}'`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) errors.push(`${at}: unexpected property '${key}'`);
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj) validate(obj[key], sub, `${at}.${key}`, errors);
    }
  }

  for (const sub of (schema.allOf as Schema[] | undefined) ?? []) {
    if (sub.if && sub.then) {
      const conditional: string[] = [];
      validate(value, sub.if as Schema, at, conditional);
      if (conditional.length === 0) validate(value, sub.then as Schema, at, errors);
    } else {
      validate(value, sub, at, errors);
    }
  }
}

const approvalPath = process.argv[2];
const schemaPath = process.argv[3] ?? path.join(REPO_ROOT, ".approvals", "schema.json");

if (!approvalPath) {
  console.error("usage: bun run scripts/verify/validate-approval.ts <approval.json> [schema.json]");
  process.exit(2);
}
for (const p of [approvalPath, schemaPath]) {
  if (!existsSync(p)) {
    console.error(`FAIL[approval]: ${p} does not exist`);
    process.exit(1);
  }
}

const errors: string[] = [];
validate(
  JSON.parse(readFileSync(approvalPath, "utf8")),
  JSON.parse(readFileSync(schemaPath, "utf8")),
  path.basename(approvalPath),
  errors,
);

if (errors.length > 0) {
  console.error(`FAIL[approval]: ${approvalPath} does not validate:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `PASS[approval]: ${path.relative(REPO_ROOT, approvalPath)} validates against the schema`,
);
