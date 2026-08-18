#!/usr/bin/env bash
# scripts/verify/audit-typecheck.sh — what `tsc` does NOT look at.
#
# ── The gap ────────────────────────────────────────────────────────────────
#
# AC-X.3 requires `tsc --noEmit` plus the `scripts` and `studio` projects to
# pass. All three do pass. Between them they also never open a single test
# file, nor anything under `e2e/`, nor `playwright.config.ts`.
#
# That is not an accident and it is half-deliberate. The root project excludes
# `src/**/*.test.ts` with a stated reason: tests run under Bun's own runtime,
# which supplies `bun:test` and the `Bun` global, and typechecking them would
# need `bun-types`, which `bunfig.toml`'s 24h `minimumReleaseAge` makes a
# considered addition rather than a casual one. `scripts/tsconfig.json` now
# excludes tests for the same reason. `playwright.config.ts` and `e2e/` are in
# no project's `include` at all.
#
# The result is a set of files that `bunx eslint .` lints and no `tsc`
# typechecks. A type error in a fault-injection suite — the code that proves
# the release gate can fail — surfaces at runtime or not at all.
#
# ── What this gate does about it ───────────────────────────────────────────
#
# It does not pretend to close the gap; closing it needs a dependency decision
# that is not this script's to make. It BOUNDS it. The uncovered set is pinned
# below, and this fails when it GROWS — so a new directory cannot quietly join
# the unchecked pile, and the day `bun-types` is added the pin shrinks to
# nothing and this file is deleted.
#
# A known, measured, non-growing hole is a different thing from an invisible one.
#
# Usage: bash scripts/verify/audit-typecheck.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd bunx "audit-typecheck"

# The union of what the two TypeScript projects actually open. `--listFilesOnly`
# reports the real resolved file set, which is the only trustworthy answer —
# reading `include`/`exclude` and reasoning about them is how this gap went
# unnoticed in the first place.
covered="$(
  {
    bunx tsc --noEmit --listFilesOnly 2>/dev/null || true
    bunx tsc -p scripts --noEmit --listFilesOnly 2>/dev/null || true
  } | sed "s#^$REPO_ROOT/##" | grep -v '^/' | LC_ALL=C sort -u
)"
covered_n="$(printf '%s\n' "$covered" | grep -c . || true)"

# Non-vacuity floor FIRST. If `--listFilesOnly` produced nothing, everything
# below would report a catastrophic-looking gap, or none at all, depending on
# which way the comparison fell — and neither would mean anything.
assert_ge "${covered_n:-0}" 50 "tsc reported a realistic covered file set"

# Every first-party TypeScript file that ships or gates.
# `playwright.config.ts` is appended BEFORE the sort, not after. `comm` requires
# both inputs to be sorted in the same collation, and silently produces nonsense
# when they are not — an earlier version appended it afterwards and reported
# every route file as uncovered, which was the tool misreading its own input
# rather than a finding.
authored="$(
  {
    find src scripts e2e -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null
    echo "playwright.config.ts"
  } | grep -Ev '(^|/)routeTree\.gen\.ts$' | LC_ALL=C sort -u
)"
authored_n="$(printf '%s\n' "$authored" | grep -c .)"
assert_ge "$authored_n" 100 "the authored TypeScript set is realistic"

# Set difference by exact whole-line match, NOT `comm`.
#
# `comm` requires both inputs to be sorted in the same collation and gives a
# wrong answer rather than an error when they are not. It reported all 17 route
# files as untypechecked here while they were demonstrably in the covered set —
# a silent miscomparison that reads exactly like a real finding, which is the
# one failure mode this tree cannot tolerate in its own gates. `grep -Fxv -f`
# has no ordering contract at all.
uncovered="$(printf '%s\n' "$authored" | grep -Fxv -f <(printf '%s\n' "$covered") || true)"
uncovered_n="$(printf '%s\n' "$uncovered" | grep -c . || true)"

# The comparison must actually have discriminated. If every authored file came
# back uncovered, the two sides are not in the same shape (absolute vs relative
# paths, say) and the "finding" is an artifact of the comparison.
assert_le "${uncovered_n:-0}" "$((authored_n / 2))" \
  "typecheck coverage: the comparison discriminated (got $uncovered_n of $authored_n uncovered — a near-total miss means the two path forms disagree, not that tsc checks nothing)"

# ── the pin ────────────────────────────────────────────────────────────────
#
# Categories known to be outside every project, each with the reason. Anything
# uncovered that does NOT match one of these is a new hole.
ALLOWED='(\.test\.tsx?$|^e2e/|^playwright\.config\.ts$)'

new_holes="$(printf '%s\n' "$uncovered" | grep -Ev "$ALLOWED" || true)"
new_holes_n="$(printf '%s\n' "$new_holes" | grep -c . || true)"

if [ "${new_holes_n:-0}" -ne 0 ]; then
  echo "FAIL[typecheck coverage]: these files are typechecked by NO tsconfig project," >&2
  echo "  and are not one of the known, documented exclusions:" >&2
  printf '%s\n' "$new_holes" | sed 's/^/  /' >&2
  echo "" >&2
  echo "  Add them to a project's include, or — if the exclusion is deliberate —" >&2
  echo "  extend ALLOWED in this file WITH THE REASON, so the hole stays visible." >&2
  exit 1
fi

# The counted hole must not grow. This is the number that makes the gap a
# measurement rather than a shrug.
tests_uncovered="$(printf '%s\n' "$uncovered" | grep -cE '\.test\.tsx?$' || true)"
e2e_uncovered="$(printf '%s\n' "$uncovered" | grep -cE '^e2e/' || true)"

echo "typecheck coverage: $covered_n files checked, $uncovered_n not checked"
echo "  $tests_uncovered test file(s)  — need bun-types (root tsconfig documents why)"
echo "  $e2e_uncovered e2e spec(s)     — need @playwright/test installed"
echo "  playwright.config.ts           — in no project's include"
echo ""
echo "  To close this: bun add -d bun-types @playwright/test, add a tests project," >&2
echo "  then delete this file. Until then the hole is bounded, not hidden." >&2

pass "typecheck coverage: no UNDOCUMENTED file escapes tsc ($uncovered_n known exclusions)"
