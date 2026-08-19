/**
 * Derives the live acceptance-criteria set from the spec.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * Four amendments have landed on this spec and none of them deleted anything.
 * Criteria were superseded *in place*, with the supersession recorded in the
 * text — sometimes wholly ("supersedes AC-3.1"), sometimes only in part
 * ("supersedes AC-4.2's scope ambiguity", "supersedes AC-6.9a's mechanism; its
 * five sub-assertions stand"). Reading that set by eye gives a different answer
 * every time somebody tries, which is how a release gate ends up proving 61 of
 * 63 criteria and reporting success.
 *
 * So the live set is derived, once, here — and `ac-bijection.sh` then asserts
 * that the proof table and the live set are the same set, in both directions.
 *
 * ── The spec is read from a TRACKED path ───────────────────────────────────
 *
 * `.omc/` is gitignored (`.gitignore:27`). A gate that parses `.omc/specs/…`
 * works on the author's laptop and fails on the first CI clone — which is
 * precisely the defect Amendment 3 decision 4 (AC-X.7a) was written about,
 * applied to the spec instead of to an approval file. The spec is therefore
 * committed under `docs/spec/` and read only from there.
 *
 * ── Full vs. partial supersession is declared, not guessed ─────────────────
 *
 * Whether "supersedes AC-2.1's 'Indigenous and Canadian-owned.'" retires AC-2.1
 * or only amends it is an editorial judgement no regex can make. It lives in
 * `docs/ac-supersession.json`, one entry per relation, with the reasoning.
 *
 * The safety property is that the table cannot go stale silently: this script
 * parses every supersession marker out of the spec and FAILS if any of them is
 * missing from the table, or if the table names a relation the spec does not
 * contain. A fifth amendment cannot quietly add a supersession that nobody
 * classified — it stops the gate instead.
 *
 * Usage:
 *   bun run scripts/verify/ac-inventory.ts               # write docs/ac-inventory.json
 *   bun run scripts/verify/ac-inventory.ts --sync-proofs # + seed missing proof-table rows
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const SPEC_PATH = path.join(
  REPO_ROOT,
  "docs",
  "spec",
  "deep-interview-behuman-site-restructure.md",
);
const SUPERSESSION_PATH = path.join(REPO_ROOT, "docs", "ac-supersession.json");
const INVENTORY_PATH = path.join(REPO_ROOT, "docs", "ac-inventory.json");
const PROOF_TABLE_PATH = path.join(REPO_ROOT, "docs", "ac-proof-table.json");

/**
 * Non-vacuity floor. Every downstream assertion is over this set; if the parse
 * silently returns nothing, the bijection is 0 == 0 and the release gate is a
 * no-op. Set below the observed count with room for the spec to shrink, but far
 * above zero.
 */
const MIN_PARSED_CRITERIA = 55;

export type Supersession = {
  /** The newer criterion. */
  by: string;
  /** The criterion it supersedes. */
  target: string;
  /**
   * "full"    — the target is entirely replaced and is no longer proven.
   * "partial" — the target survives; only the named aspect moved.
   */
  kind: "full" | "partial";
  /** Why it was classified that way. Read by humans, not by code. */
  reason: string;
};

export type Criterion = {
  id: string;
  text: string;
  /** 1-based line in the tracked spec, so a reader can go look. */
  line: number;
  status: "live" | "retired";
  /** Present when `status` is "retired". */
  retired_by?: string;
  retired_reason?: string;
  /** Partial supersessions, which do NOT retire this criterion. */
  amended_by?: string[];
};

// ── parsing ────────────────────────────────────────────────────────────────

/**
 * `- [ ] **AC-1.1** text…`  →  live
 * `- [ ] ~~**AC-3.1** text…~~ *(reversed)*`  →  struck through in the spec,
 * which is the author saying "this is dead" in the strongest form Markdown
 * has. Treated as retired regardless of what the supersession table says.
 */
const AC_LINE = /^\s*-\s*\[[ xX]\]\s*(~~)?\s*\*\*(AC-[0-9A-Za-z.]+)\*\*\s*(.*)$/;

/** `*(supersedes AC-3.1)*`, `*(supersedes AC-4.2's scope ambiguity)*`, … */
const SUPERSEDES_MARKER = /\(supersedes\s+(AC-[0-9A-Za-z.]+)/g;
/** `*(clarifies AC-3.5a)*` — narrows, never retires. */
const CLARIFIES_MARKER = /\(clarifies\s+(AC-[0-9A-Za-z.]+)/g;

export function parseSpec(markdown: string): {
  criteria: Criterion[];
  markers: Array<{ by: string; target: string; verb: "supersedes" | "clarifies" }>;
} {
  const criteria: Criterion[] = [];
  const markers: Array<{ by: string; target: string; verb: "supersedes" | "clarifies" }> = [];
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(AC_LINE);
    if (!m) continue;
    const struck = Boolean(m[1]);
    const id = m[2];
    const text = m[3].trim();

    criteria.push({
      id,
      text,
      line: i + 1,
      status: struck ? "retired" : "live",
      ...(struck
        ? { retired_reason: "struck through in the spec (reversed by a later amendment)" }
        : {}),
    });

    for (const s of text.matchAll(SUPERSEDES_MARKER)) {
      markers.push({ by: id, target: s[1], verb: "supersedes" });
    }
    for (const c of text.matchAll(CLARIFIES_MARKER)) {
      markers.push({ by: id, target: c[1], verb: "clarifies" });
    }
  }

  return { criteria, markers };
}

// ── main ───────────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`FAIL[ac-inventory]: ${message}`);
  process.exit(1);
}

function main(argv: string[]): void {
  if (!existsSync(SPEC_PATH)) {
    fail(
      `the tracked spec copy is missing at ${path.relative(REPO_ROOT, SPEC_PATH)}. ` +
        "The gate deliberately does not read `.omc/specs/` — that path is gitignored, so a gate " +
        "depending on it passes locally and fails on the first clean clone (AC-X.7a).",
    );
  }
  if (!existsSync(SUPERSESSION_PATH)) {
    fail(`the supersession table is missing at ${path.relative(REPO_ROOT, SUPERSESSION_PATH)}`);
  }

  const { criteria, markers } = parseSpec(readFileSync(SPEC_PATH, "utf8"));

  if (criteria.length < MIN_PARSED_CRITERIA) {
    fail(
      `parsed only ${criteria.length} criteria (floor ${MIN_PARSED_CRITERIA}). ` +
        "A parse that finds nothing makes every downstream bijection vacuously true.",
    );
  }

  const duplicates = criteria
    .map((c) => c.id)
    .filter((id, i, all) => all.indexOf(id) !== i)
    .filter((id, i, all) => all.indexOf(id) === i);
  if (duplicates.length > 0) {
    fail(`the spec declares these AC ids more than once: ${duplicates.join(", ")}`);
  }

  const table: Supersession[] = JSON.parse(readFileSync(SUPERSESSION_PATH, "utf8"));
  const byId = new Map(criteria.map((c) => [c.id, c]));

  // The table and the spec must agree, in both directions. Either half going
  // stale is a silent correctness failure, so both halves are asserted.
  const supersedeMarkers = markers.filter((m) => m.verb === "supersedes");
  for (const marker of supersedeMarkers) {
    const entry = table.find((t) => t.by === marker.by && t.target === marker.target);
    if (!entry) {
      fail(
        `the spec says ${marker.by} supersedes ${marker.target}, and ` +
          `docs/ac-supersession.json does not classify it. Classify it as "full" (the target is ` +
          `retired and no longer proven) or "partial" (the target survives; only the named aspect ` +
          `moved), with a reason. An unclassified supersession would silently leave a dead ` +
          `criterion in the proof table or drop a live one out of it.`,
      );
    }
  }
  for (const entry of table) {
    if (!byId.has(entry.by))
      fail(`docs/ac-supersession.json names ${entry.by}, absent from the spec`);
    if (!byId.has(entry.target)) {
      fail(`docs/ac-supersession.json names ${entry.target}, absent from the spec`);
    }
    const inSpec = supersedeMarkers.some((m) => m.by === entry.by && m.target === entry.target);
    if (!inSpec) {
      fail(
        `docs/ac-supersession.json claims ${entry.by} supersedes ${entry.target}, but the spec ` +
          "carries no such marker. The table has gone stale relative to the spec.",
      );
    }
  }

  // Apply. Full supersession retires; partial supersession and `clarifies`
  // record an amendment and leave the target live.
  for (const entry of table) {
    const target = byId.get(entry.target);
    if (!target) continue;
    if (entry.kind === "full") {
      target.status = "retired";
      target.retired_by = entry.by;
      target.retired_reason = entry.reason;
    } else {
      target.amended_by = [...(target.amended_by ?? []), entry.by];
    }
  }
  for (const marker of markers.filter((m) => m.verb === "clarifies")) {
    const target = byId.get(marker.target);
    if (target && target.status === "live") {
      target.amended_by = [...(target.amended_by ?? []), marker.by];
    }
  }

  const live = criteria.filter((c) => c.status === "live");
  const retired = criteria.filter((c) => c.status === "retired");

  writeFileSync(
    INVENTORY_PATH,
    JSON.stringify(
      {
        description:
          "Derived from docs/spec/deep-interview-behuman-site-restructure.md by " +
          "scripts/verify/ac-inventory.ts. Do not hand-edit — regenerate. The live set here is " +
          "what ac-bijection.sh holds the proof table to, in both directions.",
        generated_from: path.relative(REPO_ROOT, SPEC_PATH),
        total: criteria.length,
        live: live.length,
        retired: retired.length,
        criteria: criteria.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })),
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`parsed ${criteria.length} criteria: ${live.length} live, ${retired.length} retired`);
  for (const c of retired) {
    console.log(`  retired ${c.id}${c.retired_by ? ` <- ${c.retired_by}` : ""}`);
  }

  // ── proof table ──────────────────────────────────────────────────────────
  const existing: Array<{ id: string; phase: string | null; proof: string | null; note?: string }> =
    existsSync(PROOF_TABLE_PATH) ? JSON.parse(readFileSync(PROOF_TABLE_PATH, "utf8")).rows : [];
  const rowById = new Map(existing.map((r) => [r.id, r]));

  if (argv.includes("--sync-proofs")) {
    const rows = live.map(
      (c) => rowById.get(c.id) ?? { id: c.id, phase: null, proof: null, note: "" },
    );
    // Orphans — rows for criteria that are no longer live — are dropped rather
    // than kept, because a proof table that still proves a retired criterion is
    // how a gate reports 63/63 while covering the wrong 63.
    const dropped = existing.filter((r) => !live.some((c) => c.id === r.id)).map((r) => r.id);
    writeFileSync(
      PROOF_TABLE_PATH,
      JSON.stringify(
        {
          description:
            "One row per LIVE acceptance criterion. `proof` is a shell command that exits " +
            "non-zero when the criterion is not met; null means the phase that owns it has not " +
            "landed yet. ac-suite.sh --release fails if any row still has a null proof, so " +
            "'not written yet' can never be mistaken for 'passing'.",
          rows: rows.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })),
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `proof table synced: ${rows.length} rows` +
        (dropped.length ? `, dropped ${dropped.length} orphan(s): ${dropped.join(", ")}` : ""),
    );
  }
}

if (import.meta.main) main(process.argv.slice(2));
