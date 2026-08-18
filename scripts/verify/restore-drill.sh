#!/usr/bin/env bash
# scripts/verify/restore-drill.sh — Phase 0 exit condition.
#
# Proves the backup can actually be restored. `ls | wc -l` is not a backup
# test: it counts files in a directory that is already on this machine, which
# is the one place the data is guaranteed to be. This restores into a CLEAN
# temp clone on a DIFFERENT path and asserts every SHA-256 matches the
# manifest, which is the only claim that means anything after the Lovable host
# goes dark.
#
# The expected count is derived from the manifest, never typed.
#
# Usage:
#   bash scripts/verify/restore-drill.sh                    # from the release asset
#   bash scripts/verify/restore-drill.sh --tar <path>       # from a local tar
#
# Environment:
#   RELEASE_TAG   GitHub release holding assets-raw-<sha>.tar

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "restore-drill"
require_file src/assets/asset-recovery-manifest.json "the recovery manifest exists"

TAR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tar)
      shift
      TAR="${1:-}"
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
  shift
done

expected="$(jq 'length' src/assets/asset-recovery-manifest.json)"
assert_ge "$expected" 40 "the manifest describes a realistic asset set"

# A different path, deliberately. Restoring beside the originals would let a
# path mistake silently verify the originals against themselves — the drill
# would pass with no backup in existence at all.
workdir="$(mktemp -d "${TMPDIR:-/tmp}/restore-drill-XXXXXX")"
trap 'rm -rf "$workdir"' EXIT
echo "restore drill working in $workdir (repo is $REPO_ROOT — deliberately not the same path)"

if [ -z "$TAR" ]; then
  require_cmd gh "restore-drill needs gh to download the release asset"
  : "${RELEASE_TAG:?RELEASE_TAG must name the GitHub release holding the asset tar}"
  ( cd "$workdir" && gh release download "$RELEASE_TAG" --pattern 'assets-raw-*.tar' )
  TAR="$(find "$workdir" -maxdepth 1 -name 'assets-raw-*.tar' | head -1)"
  [ -n "$TAR" ] || {
    echo "FAIL[restore]: no assets-raw-*.tar in release $RELEASE_TAG" >&2
    exit 1
  }
else
  case "$TAR" in
    /*) : ;;
    *) TAR="$REPO_ROOT/$TAR" ;;
  esac
  require_file "$TAR" "the tar to restore from"
fi

extract="$workdir/extracted"
mkdir -p "$extract"
tar -xf "$TAR" -C "$extract"

# The tar may hold the files at src/assets/... or flat; find them either way.
matched=0
missing=""
mismatched=""

while IFS=$'\t' read -r filename want_sha want_bytes; do
  [ -n "$filename" ] || continue
  found="$(find "$extract" -type f -name "$filename" | head -1)"
  if [ -z "$found" ]; then
    missing="$missing $filename"
    continue
  fi
  got_sha="$(sha256_of "$found")"
  got_bytes="$(wc -c <"$found" | count)"
  if [ "$got_sha" != "$want_sha" ] || [ "$got_bytes" != "$want_bytes" ]; then
    mismatched="$mismatched
  $filename: sha $got_sha (want $want_sha), $got_bytes bytes (want $want_bytes)"
    continue
  fi
  matched=$((matched + 1))
done <<EOF
$(jq -r '.[] | [.filename, .sha256, (.bytes|tostring)] | @tsv' src/assets/asset-recovery-manifest.json)
EOF

if [ -n "$missing" ]; then
  echo "FAIL[restore]: absent from the backup:$missing" >&2
  exit 1
fi
if [ -n "$mismatched" ]; then
  echo "FAIL[restore]: restored bytes do not match the manifest:$mismatched" >&2
  exit 1
fi

assert_eq "$matched" "$expected" "every manifest entry restored and hash-verified"
pass "restore drill: $matched/$expected assets restored from $(basename "$TAR") into a clean path, all SHA-256 verified"
