#!/usr/bin/env bash
# scripts/verify/audit-or-true.sh — RULE 1 audit.
#
# `curl -fsSL "$URL" | grep -c X || true` returns the string "0" when the site
# is DOWN. `assert_eq "$(...)" 0 "no bad thing"` then passes against a dead
# origin. This was reproduced during planning, twice, in two different
# rewrites of the same check.
#
# So: no `|| true` may share a line — or a pipeline — with a network call.
# `|| true` on LOCAL text is fine and is used deliberately in this tree (a
# `grep -c` over a body already captured and floor-asserted by `fetch_ok` is
# local text by then, not a network call).
#
# Usage: bash scripts/verify/audit-or-true.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

# This file necessarily contains the strings it forbids — they are in the
# patterns and in this comment. Excluding it by exact path, not by a loose
# pattern, so widening the exemption means editing this line.
SELF="scripts/verify/audit-or-true.sh"

files="$(find scripts/verify -type f -name '*.sh' | grep -v "^$SELF\$" | LC_ALL=C sort)"
n="$(printf '%s\n' "$files" | grep -c .)"

# Non-vacuity floor FIRST. "No script violates rule 1" is trivially true when
# the file list is empty, which is exactly what a typo'd `find` produces.
assert_ge "$n" 5 "the audit found scripts to audit"

# A network call is curl or wget. The forbidden shape is one of those and a
# `|| true` in the same pipeline, i.e. on the same logical line.
NETWORK='(curl|wget)'
TOLERATE='\|\|[[:space:]]*true'

offenders=""
while IFS= read -r file; do
  [ -n "$file" ] || continue
  # Join backslash-continued lines first, so a `curl … \` newline `| grep …
  # || true` split across three physical lines is still seen as one pipeline.
  #
  # Whole-line comments are dropped before matching, because the rule is
  # documented in prose — in lib.sh and in this file — and prose describing the
  # forbidden shape is not the forbidden shape. Trailing comments are NOT
  # stripped: that direction only ever produces a false positive, which is
  # visible and cheap, whereas stripping them could hide a real offender behind
  # a `#` on the same line.
  hits="$(sed -e ':a' -e '/\\$/{N;s/\\\n//;ta' -e '}' "$file" \
    | grep -vE '^[[:space:]]*#' \
    | grep -nE "$NETWORK" | grep -E "$TOLERATE" || true)"
  if [ -n "$hits" ]; then
    offenders="$offenders
$file: $hits"
  fi
done <<EOF
$files
EOF

if [ -n "$offenders" ]; then
  echo "FAIL[rule 1]: \`|| true\` wraps a network call. On a dead origin these return" >&2
  echo "  '0' and every downstream assertion greens against a site that is not there." >&2
  echo "  Capture the body, assert the fetch succeeded, THEN assert the content." >&2
  echo "$offenders" >&2
  exit 1
fi

pass "RULE 1: no \`|| true\` on a network call across $n scripts"
