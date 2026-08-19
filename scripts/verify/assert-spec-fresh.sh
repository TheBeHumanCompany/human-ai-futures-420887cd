#!/usr/bin/env bash
# scripts/verify/assert-spec-fresh.sh — the tracked copies must not drift.
#
# ── The problem this closes ────────────────────────────────────────────────
#
# The spec and the consensus plan live under `.omc/`, which `.gitignore:27`
# ignores. A release gate that parses them works on the author's laptop and
# fails on the first CI clone, where those paths simply are not there — the
# same defect AC-X.7a names, applied to the spec rather than to an approval
# file. So both are committed under `docs/spec/` and the gates read only from
# there.
#
# That fix creates a second, quieter problem. A hand-maintained copy drifts.
# The live document gets a fifth amendment, nobody re-copies it, and from then
# on the gate validates against a stale spec while every human reads the
# current one — and it reports PASS the whole time, because the copy it is
# checking is internally consistent. Nothing about the green tells you the
# green is measuring last week's requirements.
#
# So: when the `.omc/` original is present, its SHA-256 must equal the tracked
# copy's. In a clean clone the original is absent, the check no-ops, and the
# tracked copy is authoritative — which is correct, because in that clone the
# tracked copy is the only document that exists.
#
# Refresh a stale copy with:  bash scripts/verify/assert-spec-fresh.sh --sync
#
# Usage:
#   bash scripts/verify/assert-spec-fresh.sh          # assert, exit 1 on drift
#   bash scripts/verify/assert-spec-fresh.sh --sync   # re-copy, then assert

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "assert-spec-fresh"
require_file docs/spec/SOURCES.json "the tracked-copy manifest"

SYNC=0
[ "${1:-}" = "--sync" ] && SYNC=1

pairs="$(jq -r '.sources[] | [.tracked, .origin] | @tsv' docs/spec/SOURCES.json)"
n="$(printf '%s\n' "$pairs" | grep -c .)"

# Non-vacuity floor FIRST. "No tracked copy has drifted" is trivially true of
# an empty manifest, which is what a mistyped jq filter produces.
assert_ge "$n" 1 "the manifest lists tracked copies to check"

checked=0
skipped=0
drifted=""

while IFS=$'\t' read -r tracked origin; do
  [ -n "$tracked" ] || continue

  require_file "$tracked" "the tracked copy $tracked exists"

  if [ ! -f "$origin" ]; then
    # A clean clone. The tracked copy is the only document there is, and it is
    # authoritative. This is the expected state in CI, not a degraded one.
    skipped=$((skipped + 1))
    echo "  n/a   $tracked (origin $origin absent — clean clone, tracked copy is authoritative)"
    continue
  fi

  if [ "$SYNC" -eq 1 ]; then
    cp "$origin" "$tracked"
  fi

  tracked_sha="$(sha256_of "$tracked")"
  origin_sha="$(sha256_of "$origin")"
  checked=$((checked + 1))

  if [ "$tracked_sha" != "$origin_sha" ]; then
    drifted="$drifted
  $tracked
    tracked  $tracked_sha
    origin   $origin_sha ($origin)"
  else
    echo "  ok    $tracked matches $origin"
  fi
done <<EOF
$pairs
EOF

if [ -n "$drifted" ]; then
  echo "" >&2
  echo "FAIL[spec drift]: a tracked copy no longer matches its .omc/ original:$drifted" >&2
  echo "" >&2
  echo "  The gates parse the TRACKED copy, so they are currently validating against a" >&2
  echo "  document nobody is reading. Refresh it and re-derive the inventory:" >&2
  echo "    bash scripts/verify/assert-spec-fresh.sh --sync" >&2
  echo "    bun run scripts/verify/ac-inventory.ts --sync-proofs" >&2
  echo "  Then review the proof-table diff — a new amendment may add or retire criteria." >&2
  exit 1
fi

# Both halves cannot be skipped in an environment that HAS the originals. If
# `.omc/` is present at all, at least one pair must have been compared —
# otherwise a path typo in SOURCES.json silently converts this gate into a
# no-op that still prints a reassuring summary.
if [ -d .omc ] && [ "$checked" -eq 0 ]; then
  echo "FAIL[spec drift]: .omc/ exists but no tracked copy was compared against it." >&2
  echo "  Every origin path in docs/spec/SOURCES.json is wrong, and this gate is a no-op." >&2
  exit 1
fi

pass "spec freshness: $checked tracked copy(ies) match their origin, $skipped not present locally"
