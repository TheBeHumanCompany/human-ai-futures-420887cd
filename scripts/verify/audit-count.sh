#!/usr/bin/env bash
# scripts/verify/audit-count.sh — RULE 2 audit.
#
# BSD `wc -l` pads its output with spaces; GNU `wc -l` does not. So
# `assert_eq $(grep … | wc -l) 0 "…"` passes on macOS by word-splitting
# accident, and the same line correctly quoted fails with
# `got '       0' want '0'`. Both spellings are wrong: one is accidentally
# right and the other is confusingly wrong, and neither is portable.
#
# `grep -c` never pads. Where `wc` is genuinely unavoidable, pipe it through
# `count()` from lib.sh, which strips whitespace.
#
# Usage: bash scripts/verify/audit-count.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

# lib.sh defines `count_lines`, which is the sanctioned wrapper and therefore
# contains the forbidden shape by construction. This file contains it in its
# own pattern. Both are excluded by exact path.
SELF="scripts/verify/audit-count.sh"
SANCTIONED="scripts/verify/lib.sh"

files="$(find scripts/verify -type f -name '*.sh' \
  | grep -v "^$SELF\$" | grep -v "^$SANCTIONED\$" | LC_ALL=C sort)"
n="$(printf '%s\n' "$files" | grep -c .)"
assert_ge "$n" 5 "the audit found scripts to audit"

# A bare `| wc -l` not immediately piped into `count`.
BARE_WC='\|[[:space:]]*wc[[:space:]]+-l'
PIPED_TO_COUNT='wc[[:space:]]+-l[[:space:]]*\|[[:space:]]*count'

offenders=""
while IFS= read -r file; do
  [ -n "$file" ] || continue
  hits="$(grep -nE "$BARE_WC" "$file" | grep -vE "$PIPED_TO_COUNT" || true)"
  if [ -n "$hits" ]; then
    offenders="$offenders
$file: $hits"
  fi
done <<EOF
$files
EOF

if [ -n "$offenders" ]; then
  echo "FAIL[rule 2]: bare \`| wc -l\` outside count(). BSD pads, GNU does not, so the" >&2
  echo "  same assertion passes unquoted and fails quoted, on the same machine." >&2
  echo "  Use \`grep -c\`, or pipe through \`count\`." >&2
  echo "$offenders" >&2
  exit 1
fi

pass "RULE 2: no bare \`| wc -l\` outside count() across $n scripts"
