#!/usr/bin/env bash
# scripts/verify/assert-assets.sh — AC-1.1 and AC-1.2, offline.
#
# AC-1.1  the fetched binary sits beside its pointer, unmodified
# AC-1.2  the run reports per asset, and names any failure by asset_id
#
# This is the ORIGINALS check. It never touches the network and never looks at
# a build manifest. The originals can never appear in the Vite build manifest —
# nothing imports them, so Vite never processes them — and that is correct, not
# a gap (S0.2, note N4). AC-1.6 checks *derivative* URLs on a live deploy;
# `prod-images.sh` owns that. The two never meet, and an implementer who
# "reconciles" them by importing 85 MB into the bundle has broken the site to
# satisfy a misreading.
#
# Usage: bash scripts/verify/assert-assets.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "assert-assets"
require_file src/assets/asset-recovery-manifest.json "the recovery manifest"
require_file .baseline/asset-recovery-report.json "the per-asset recovery report"

# Derived from the pointer glob, never a literal. The plan is explicit that 46
# is not to be hardcoded anywhere: a pointer added or removed must change what
# this gate expects, on its own.
pointers="$(find src/assets -name '*.asset.json' | grep -c .)"
assert_ge "$pointers" 40 "the pointer glob found pointers (floor — 0 would make this vacuous)"

manifest_n="$(jq 'length' src/assets/asset-recovery-manifest.json)"
report_n="$(jq 'length' .baseline/asset-recovery-report.json)"
assert_eq "$manifest_n" "$pointers" "AC-1.1: the manifest covers every pointer"
assert_eq "$report_n" "$pointers" "AC-1.2: the report names every pointer"

# AC-1.2: no silent skips. Any non-ok status is named with its asset_id.
failed="$(jq -r '[.[] | select(.status != "ok" and .status != "skipped-already-present")] | .[] | "\(.asset_id) \(.filename) \(.error // "no error recorded")"' .baseline/asset-recovery-report.json)"
if [ -n "$failed" ]; then
  echo "FAIL[AC-1.2]: assets could not be recovered:" >&2
  printf '  %s\n' "$failed" >&2
  exit 1
fi

# Every report entry must carry an asset_id, or "named, not skipped" is a claim
# the report cannot support.
unnamed="$(jq '[.[] | select(.asset_id == null or .asset_id == "")] | length' .baseline/asset-recovery-report.json)"
assert_eq "$unnamed" "0" "AC-1.2: every report entry carries its asset_id"

# AC-1.1: the bytes on disk are the bytes that were hashed. This is the whole
# claim — a manifest that can drift from the files beside it describes a
# fiction, and the restore drill would then verify that fiction.
bad=0
while IFS=$'\t' read -r filename sha bytes; do
  [ -n "$filename" ] || continue
  f="src/assets/$filename"
  if [ ! -f "$f" ]; then
    echo "  absent: $filename" >&2
    bad=$((bad + 1))
    continue
  fi
  got_sha="$(sha256_of "$f")"
  got_bytes="$(wc -c <"$f" | count)"
  if [ "$got_sha" != "$sha" ]; then
    echo "  hash mismatch: $filename got $got_sha want $sha" >&2
    bad=$((bad + 1))
  elif [ "$got_bytes" != "$bytes" ]; then
    echo "  size mismatch: $filename got $got_bytes want $bytes" >&2
    bad=$((bad + 1))
  fi
done <<EOF
$(jq -r '.[] | [.filename, .sha256, (.bytes|tostring)] | @tsv' src/assets/asset-recovery-manifest.json)
EOF
assert_eq "$bad" "0" "AC-1.1: every original is on disk at its recorded SHA-256 and byte length"

# The four archive portraits carry a host-independent second source, recovered
# as a blob from the reference branch. It is a JPEG re-encode of the same
# picture, so it MUST differ from the original — if these ever matched, one of
# the two reads is wrong and the "second source" is a copy of the first.
alts="$(jq '[.[] | select(.alt_source != null)] | length' src/assets/asset-recovery-manifest.json)"
assert_ge "$alts" 4 "the archive portraits carry an alt_source"
collisions="$(jq '[.[] | select(.alt_source != null and .alt_source.sha256 == .sha256)] | length' src/assets/asset-recovery-manifest.json)"
assert_eq "$collisions" "0" "each alt_source is a genuinely independent copy, not the same bytes"

total_bytes="$(jq '[.[].bytes] | add' src/assets/asset-recovery-manifest.json)"
pass "AC-1.1/AC-1.2: $manifest_n/$pointers originals verified ($total_bytes bytes), $alts with a second source, 0 failures"
