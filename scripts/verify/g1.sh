#!/usr/bin/env bash
# scripts/verify/g1.sh — the typography gate's artifact check.
#
# ── What Amendment 4 changed, and what it did not ──────────────────────────
#
# AC-4.4b clears G1 IN ADVANCE ("Typography good to go"), so Phases 4, 5 and 6
# are unblocked and do not wait on a sign-off round. That removes the BLOCKING
# behaviour. It does not remove the artifact: the amendment states in the same
# breath that the specimen is still built, and that .approvals/typography.json
# still records scale_sha256 "so the 'approved one scale, shipped another'
# check survives".
#
# This script is that surviving check. It asserts the approval exists,
# validates, and still describes the scale that is actually in the tree.
#
# The accepted risk is recorded in the amendment: approving before the specimen
# exists removes the protection AC-4.4 was written for — a wrong scale reaching
# all 47 call sites unseen. The mitigation is that the scale is one file to
# change, and this gate is what notices when it changes after approval.
#
# Usage: bash scripts/verify/g1.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "g1"
APPROVAL=".approvals/typography.json"

# AC-X.7a: no release gate may depend on a gitignored path. Asserted, not
# assumed — this is the third time the same defect appeared in this project,
# and each time it was introduced by someone who believed the path was tracked.
if git check-ignore -q "$APPROVAL" 2>/dev/null; then
  echo "FAIL[AC-X.7a]: $APPROVAL is gitignored. A release gate blocking on a path that CI" >&2
  echo "  never clones is a gate that cannot run. Move it under tracked .approvals/." >&2
  exit 1
fi
if git check-ignore -q .approvals 2>/dev/null; then
  echo "FAIL[AC-X.7a]: .approvals/ itself is gitignored." >&2
  exit 1
fi

require_file "$APPROVAL" "the typography approval exists"
require_file ".approvals/schema.json" "the approval schema exists"

# ── schema validation ──────────────────────────────────────────────────────
bun run scripts/verify/validate-approval.ts "$APPROVAL"

gate="$(jq -r '.gate' "$APPROVAL")"
assert_eq "$gate" "typography" "the approval records the typography gate"

verdict="$(jq -r '.verdict' "$APPROVAL")"
case "$verdict" in
  approved | approved-with-changes) : ;;
  *)
    echo "FAIL[G1]: verdict is '$verdict'" >&2
    exit 1
    ;;
esac

# ── the scale hash still describes the shipped scale ───────────────────────
#
# This is the whole point of the gate. Approving one scale and shipping another
# must fail, and it can only fail if the approved hash is re-computed here from
# the tree rather than trusted from the file.
approved_sha="$(jq -r '.evidence.scale_sha256' "$APPROVAL")"
assert_eq "${#approved_sha}" "64" "the approval records a SHA-256 of the scale block"

require_file src/styles.css "the stylesheet exists"
scale_block="$(awk '/@layer .*type-scale|\/\* TYPE SCALE START \*\//,/\/\* TYPE SCALE END \*\//' src/styles.css)"
block_len="${#scale_block}"
assert_ge "$block_len" 200 "the type-scale block is delimited and non-trivial in src/styles.css"

current_sha="$(printf '%s' "$scale_block" | if command -v shasum >/dev/null 2>&1; then shasum -a 256; else sha256sum; fi | awk '{print $1}')"
assert_eq "$current_sha" "$approved_sha" "the shipped type scale is the one that was approved"

# ── typography commits post-date the approval ──────────────────────────────
#
# An approval that predates the work it approves approves nothing. Asserted
# against the actual commit dates on the files the reviewer was shown.
timestamp="$(jq -r '.timestamp' "$APPROVAL")"
approved_epoch="$(date -j -f '%Y-%m-%dT%H:%M:%S' "${timestamp%%.*}" '+%s' 2>/dev/null \
  || date -d "$timestamp" '+%s')"

reviewed="$(jq -r '.evidence.reviewed_paths // ["src/styles.css"] | .[]' "$APPROVAL")"
reviewed_n="$(printf '%s\n' "$reviewed" | grep -c .)"
assert_ge "$reviewed_n" 1 "the approval names at least one reviewed path"

stale=""
while IFS= read -r p; do
  [ -n "$p" ] || continue
  [ -e "$p" ] || continue
  last="$(git log -1 --format=%ct -- "$p")"
  [ -n "$last" ] || continue
  # A commit LATER than the approval means the approved artifact moved after
  # it was judged. That is the failure this check exists for.
  if [ "$last" -gt "$approved_epoch" ]; then
    stale="$stale
  $p last changed $(git log -1 --format=%cI -- "$p"), after the approval at $timestamp"
  fi
done <<EOF
$reviewed
EOF

if [ -n "$stale" ]; then
  echo "FAIL[G1]: reviewed paths changed after the approval was recorded:$stale" >&2
  echo "  Re-review, or re-record the approval against the current deployment and SHA." >&2
  exit 1
fi

commit_sha="$(jq -r '.commit_sha' "$APPROVAL")"
if ! git merge-base --is-ancestor "$commit_sha" HEAD 2>/dev/null; then
  echo "FAIL[G1]: the approved commit $commit_sha is not an ancestor of HEAD." >&2
  echo "  The approval describes a deployment that is not on this branch's history." >&2
  exit 1
fi

pass "G1: typography approved by $(jq -r '.reviewer' "$APPROVAL") at $timestamp; shipped scale hash matches"
