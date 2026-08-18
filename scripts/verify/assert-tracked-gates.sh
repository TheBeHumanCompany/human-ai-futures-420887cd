#!/usr/bin/env bash
# scripts/verify/assert-tracked-gates.sh — AC-X.7a.
#
# "Every human-review artifact lives under tracked `.approvals/`, is
# schema-validated, and is bound to both the deployment URL and the commit SHA
# it approves. No release gate may depend on a gitignored path. A CI check
# asserts `git check-ignore` rejects nothing under `.approvals/`."
#
# ── Why this is a gate and not a convention ────────────────────────────────
#
# This exact defect appeared THREE times in this project's planning. Each time
# a release gate was written to block on a path under `.omc/` — which
# `.gitignore:27` ignores — so it worked on the author's machine and would have
# failed on the first CI clone, where the file simply is not there. Each time
# it was introduced by someone who believed the path was tracked. A convention
# that has been broken three times is not a convention.
#
# Usage: bash scripts/verify/assert-tracked-gates.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

# Every directory a release gate reads from.
GATE_INPUTS=".approvals .baseline docs docs/spec src/assets"

for dir in $GATE_INPUTS; do
  [ -e "$dir" ] || continue
  if git check-ignore -q "$dir" 2>/dev/null; then
    echo "FAIL[AC-X.7a]: '$dir' is gitignored, and release gates read from it." >&2
    echo "  CI clones the repo; an ignored path is not in the clone; the gate cannot run." >&2
    exit 1
  fi
done

# And per FILE, not just per directory — a directory can be tracked while a
# negated pattern excludes something inside it.
ignored=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  if git check-ignore -q "$f" 2>/dev/null; then
    ignored="$ignored $f"
  fi
done <<EOF
$(find .approvals .baseline docs -type f 2>/dev/null | LC_ALL=C sort)
EOF

if [ -n "$ignored" ]; then
  echo "FAIL[AC-X.7a]: these gate inputs are gitignored:$ignored" >&2
  exit 1
fi

checked="$(find .approvals .baseline docs -type f 2>/dev/null | grep -c . || true)"
# Non-vacuity floor. "Nothing under these paths is ignored" is trivially true
# when the paths are empty, which is the state this gate would be in if a
# `find` typo silently matched nothing.
assert_ge "${checked:-0}" 5 "AC-X.7a: there are gate inputs to check"

# Every approval that exists must validate. An approval file that is present
# but malformed is worse than an absent one: it looks like a cleared gate.
approvals="$(find .approvals -name '*.json' ! -name 'schema.json' 2>/dev/null | LC_ALL=C sort)"
n_approvals="$(printf '%s\n' "$approvals" | grep -c . || true)"
if [ "${n_approvals:-0}" -gt 0 ]; then
  while IFS= read -r a; do
    [ -n "$a" ] || continue
    bun run scripts/verify/validate-approval.ts "$a"
  done <<EOF
$approvals
EOF
fi

require_file .approvals/schema.json "the approval schema is tracked"
pass "AC-X.7a: $checked gate inputs tracked, none gitignored; $n_approvals approval(s) validated"
