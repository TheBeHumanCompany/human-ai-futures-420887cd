#!/usr/bin/env bash
# scripts/verify/audit-coverage.sh — every test file is actually executed.
#
# ── The failure this exists for ────────────────────────────────────────────
#
# The Phase 8 gate ran `bun test src/`. Two fault-injection suites —
# `scripts/recover-assets.test.ts` and `scripts/verify/acceptance-faults.test.ts`
# — live under `scripts/`. They would have sat there permanently unexecuted:
# present in the tree, counted in review as coverage, proving nothing. The one
# suite whose entire job is to prove the production gate can fail was itself
# never run.
#
# That is the worst shape a false green takes, because it is invisible from
# both ends. The test file exists, so nobody writes it again. The suite passes,
# so nobody looks. Nothing in a normal run mentions the file at all.
#
# So the rule is mechanical now: every `*.test.ts` in this repo must be
# executed by one of the declared test commands, and adding a test somewhere
# new fails this gate until a command covers it.
#
# Usage: bash scripts/verify/audit-coverage.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "audit-coverage"

# The roots the declared test commands actually walk. Read from package.json so
# this cannot drift from the commands themselves: a `test:*` script that stops
# covering a directory changes what this gate expects, on its own.
#
# `studio` is excluded by the same reasoning eslint.config.js uses — it is a
# separate project with its own runner and config.
declared="$(jq -r '.scripts | to_entries[] | select(.key | startswith("test")) | .value' package.json)"
roots="$(printf '%s\n' "$declared" \
  | grep -oE 'bun test [^ ]+' \
  | sed -E 's/^bun test //' \
  | sed -E 's#/$##' \
  | LC_ALL=C sort -u)"
root_n="$(printf '%s\n' "$roots" | grep -c .)"

# Non-vacuity floor FIRST. With no roots parsed, "no test is uncovered" is true
# only because nothing was compared.
assert_ge "$root_n" 1 "package.json declares at least one 'bun test <root>' command"
echo "declared test roots: $(printf '%s' "$roots" | tr '\n' ' ')"

# Every test file in the repo. `.omx`, `.omc` and `.codex` are agent-tooling
# runtime state carrying vendored fixtures that are not this project's tests —
# the same directories eslint.config.js ignores, for the same reason.
tests="$(find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  ! -path './node_modules/*' ! -path './studio/*' \
  ! -path './.omx/*' ! -path './.omc/*' ! -path './.codex/*' \
  ! -path './dist/*' ! -path './.output/*' \
  | sed 's#^\./##' | LC_ALL=C sort)"
test_n="$(printf '%s\n' "$tests" | grep -c .)"
assert_ge "$test_n" 20 "the repo has a realistic number of test files"

uncovered=""
while IFS= read -r t; do
  [ -n "$t" ] || continue
  covered=0
  while IFS= read -r root; do
    [ -n "$root" ] || continue
    case "$t" in
      "$root"/*) covered=1 ;;
    esac
  done <<INNER
$roots
INNER
  [ "$covered" -eq 1 ] || uncovered="$uncovered
  $t"
done <<EOF
$tests
EOF

if [ -n "$uncovered" ]; then
  echo "FAIL[coverage]: these test files are executed by NO declared test command:$uncovered" >&2
  echo "" >&2
  echo "  They exist, they look like coverage in review, and they prove nothing." >&2
  echo "  Add a root to a 'test:*' script in package.json, or move the file under one." >&2
  exit 1
fi

# The other direction: a declared root that matches no test file is a command
# that silently passes over nothing. `bun test` exits 0 when it finds no files,
# so a typo'd root reads as a clean suite forever.
empty=""
while IFS= read -r root; do
  [ -n "$root" ] || continue
  hits=0
  while IFS= read -r t; do
    case "$t" in
      "$root"/*) hits=$((hits + 1)) ;;
    esac
  done <<INNER
$tests
INNER
  [ "$hits" -gt 0 ] || empty="$empty $root"
done <<EOF
$roots
EOF

if [ -n "$empty" ]; then
  echo "FAIL[coverage]: these declared test roots match no test file:$empty" >&2
  echo "  \`bun test\` exits 0 on an empty file set, so this command passes over nothing." >&2
  exit 1
fi

# Both fault-injection suites must be among the covered set, by exact path.
# They are the two the gate actually missed, and a generic rule that stopped
# covering them specifically would be a regression of the original bug.
for critical in scripts/recover-assets.test.ts scripts/verify/acceptance-faults.test.ts; do
  require_file "$critical" "the fault-injection suite $critical exists"
  found="$(printf '%s\n' "$tests" | grep -cx "$critical" || true)"
  assert_eq "${found:-0}" "1" "coverage: $critical is in the executed set"
done

pass "coverage: all $test_n test files executed by $root_n declared root(s)"
