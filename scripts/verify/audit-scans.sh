#!/usr/bin/env bash
# scripts/verify/audit-scans.sh — forbidden-token scans must be scoped.
#
# ── The self-match trap ────────────────────────────────────────────────────
#
# A "no source file contains X" rule is enforced by a scan for X. If that scan
# walks all of `src/`, it walks the test that enforces the rule — and that test
# contains X, because X is the thing it asserts about. The rule then matches
# itself and can NEVER pass, no matter how clean the source is.
#
# `src/lib/layering.test.ts` is exactly this case, and it gets it right: it
# walks all of `src/` into `srcFiles` and then filters tests back out into
# `srcNonTestFiles` (layering.test.ts:82-83), because a `*.test.ts` fixture
# legitimately constructs a literal `_type: "slugLock"` object and legitimately
# imports groq-js. Only shipped, non-test modules are "a module" for those
# rules.
#
# This audit asserts that discipline holds — in the shell gates and in the
# tests — and it obeys its own rule: it scopes its own scan, and it excludes
# itself by exact path, because a file whose whole job is to contain the
# forbidden pattern would otherwise be its own first offender.
#
# Usage: bash scripts/verify/audit-scans.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

SELF="scripts/verify/audit-scans.sh"

# ── 1. No shell gate enumerates source by a bare recursive grep over src/ ───
#
# The pattern is assembled from fragments rather than written out, so this
# file does not contain the literal it forbids even before the path exclusion
# applies. Belt and braces: the two defences fail independently.
RECURSIVE='grep[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)'
OVER_SRC='[[:space:]](\./)?src(/|[[:space:]]|$)'

sh_files="$(find scripts/verify -type f -name '*.sh' | grep -v "^$SELF\$" | LC_ALL=C sort)"
sh_n="$(printf '%s\n' "$sh_files" | grep -c .)"
assert_ge "$sh_n" 5 "the audit found shell gates to audit"

offenders=""
while IFS= read -r file; do
  [ -n "$file" ] || continue
  hits="$(grep -nE "$RECURSIVE" "$file" | grep -E "$OVER_SRC" || true)"
  if [ -n "$hits" ]; then
    offenders="$offenders
$file: $hits"
  fi
done <<EOF
$sh_files
EOF

if [ -n "$offenders" ]; then
  echo "FAIL[scan scoping]: a gate enumerates source with a bare recursive grep over src/." >&2
  echo "  That walks the tests too, so any rule whose forbidden token appears in the test" >&2
  echo "  that enforces it matches itself and can never pass. Route through" >&2
  echo "  \`src_non_test_files\` / \`scan_src_non_test\` in lib.sh." >&2
  echo "$offenders" >&2
  exit 1
fi

# ── 2. Every test that walks src/ filters tests back out ───────────────────
#
# The shell half above is not enough: most forbidden-token scans in this repo
# live in `*.test.ts`, not in gates. A test that walks src/ and does not
# exclude test files is the self-match trap in its most common form.
walkers="$(grep -lE 'readdirSync|walk\(' src/lib/*.test.ts 2>/dev/null | LC_ALL=C sort || true)"
walk_n="$(printf '%s\n' "$walkers" | grep -c . || true)"
assert_ge "${walk_n:-0}" 1 "at least one source-walking test exists to audit"

unscoped=""
while IFS= read -r file; do
  [ -n "$file" ] || continue
  # It must name a test-file filter somewhere. `isTestFile` is the name this
  # repo uses; `srcNonTestFiles` is the derived list. Either is evidence the
  # walk is scoped; neither is evidence it is not.
  if ! grep -qE 'isTestFile|srcNonTestFiles|\.test\.tsx\?' "$file"; then
    unscoped="$unscoped $file"
  fi
done <<EOF
$walkers
EOF

if [ -n "$unscoped" ]; then
  echo "FAIL[scan scoping]: these tests walk src/ without filtering test files out:" >&2
  echo " $unscoped" >&2
  echo "  A forbidden-token rule enforced by an unscoped walk matches the test that" >&2
  echo "  states it. See src/lib/layering.test.ts:82-83 for the shape that works." >&2
  exit 1
fi

# ── 3. lib.sh's own helper is scoped ───────────────────────────────────────
#
# Everything above routes through `src_non_test_files`. If that helper stopped
# excluding tests, all of it would keep passing while proving nothing.
helper="$(sed -n '/^src_non_test_files()/,/^}/p' scripts/verify/lib.sh)"
assert_contains "$helper" "! -name '*.test.ts'" "src_non_test_files excludes .test.ts"
assert_contains "$helper" "! -name '*.test.tsx'" "src_non_test_files excludes .test.tsx"

# And that it actually returns files — a scoped helper that returns nothing
# makes every scan built on it vacuous.
found="$(src_non_test_files | grep -c .)"
assert_ge "$found" 30 "src_non_test_files returns a realistic file set"

# The exclusion must be real, not just present in the text: the returned set
# must contain no test file at all.
leaked="$(src_non_test_files | grep -c '\.test\.tsx\?$' || true)"
assert_eq "${leaked:-0}" "0" "src_non_test_files leaks no test files"

pass "scan scoping: $sh_n gates and $walk_n source-walking tests are scoped; $found non-test source files"
