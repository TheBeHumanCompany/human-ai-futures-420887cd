#!/usr/bin/env bash
# scripts/verify/assert-asset-imports.sh — AC-1.3, AC-1.4, AC-1.5.
#
# ── The bug this closes ────────────────────────────────────────────────────
#
# This is the failure the user reported first, before any of the restructuring.
#
# A `*.asset.json` pointer is not an image. It is a small JSON object whose
# `url` field is `/__l5e/assets-v1/<id>/<file>` — a path that ONLY Lovable's
# own hosting serves. Source code that imported the pointer and used `.url`
# baked that bare path into both the client and SSR bundles. Nothing rewrites
# it at build time, the dev-side proxy is a no-op unless LOVABLE_PREVIEW_HOST
# is set, and so every one of those images 404'd in production while rendering
# perfectly in a *.lovable.app preview.
#
# The fix is to import the real file, so Vite fingerprints and emits it like
# every other asset. That is AC-1.5. AC-1.3 and AC-1.4 are what stop it coming
# back: no source file may reference a pointer, and no pointer file may exist
# for one to reference.
#
# Usage: bash scripts/verify/assert-asset-imports.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "assert-asset-imports"

# ── AC-1.3 — no source file references a pointer ───────────────────────────
#
# Scoped to non-test files: a test asserting "no file imports a pointer"
# contains the string it forbids, and an unscoped scan would match the test
# that enforces the rule and could never pass.
offenders="$(scan_src_non_test '\.asset\.json' 'AC-1.3 pointer imports' || true)"
offender_n="$(printf '%s' "$offenders" | grep -c . || true)"
if [ "${offender_n:-0}" -ne 0 ]; then
  echo "FAIL[AC-1.3]: source files still reference *.asset.json pointers:" >&2
  printf '%s\n' "$offenders" | sed 's/^/  /' >&2
  echo "" >&2
  echo "  A pointer's url is /__l5e/assets-v1/... which only Lovable's hosting serves." >&2
  echo "  Import the real file instead so Vite fingerprints and emits it." >&2
  exit 1
fi
pass "AC-1.3: no non-test source file references a *.asset.json pointer"

# ── AC-1.4 — the pointer files are gone ────────────────────────────────────
remaining="$(find src/assets -name '*.asset.json' 2>/dev/null | grep -c . || true)"
assert_eq "${remaining:-0}" "0" "AC-1.4: every *.asset.json pointer file is deleted"

# Deleting them must not have destroyed the recovery path. The archive is what
# makes re-recovery possible if a binary is ever lost, and a Phase 1 that
# closed the 404 bug while silently discarding that would be a bad trade
# nothing else would report.
require_file docs/asset-pointers.json "AC-1.4: the pointers are archived, not destroyed"
archived="$(jq '.pointers | length' docs/asset-pointers.json)"
assert_ge "$archived" 40 "AC-1.4: the archive holds the pointer set"

recovered_n="$(jq '[.[] | select(.source != "supplied")] | length' src/assets/asset-recovery-manifest.json)"
assert_eq "$archived" "$recovered_n" "AC-1.4: the archive covers every recovered asset"

# Every archived pointer must name a binary that is actually on disk —
# otherwise the archive describes a recovery that would fail.
missing=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  [ -f "src/assets/$f" ] || missing="$missing $f"
done <<EOF
$(jq -r '.pointers[] | ._target_filename // .original_filename' docs/asset-pointers.json)
EOF
assert_eq "$missing" "" "AC-1.4: every archived pointer's binary is present (missing:${missing:-none})"

pass "AC-1.4: $archived pointer files deleted, archived verbatim, every binary present"

# ── AC-1.5 — the named files import images as files ────────────────────────
#
# Named explicitly by the criterion. Checked by path rather than by a general
# scan so that deleting one of them cannot make this pass.
for f in src/lib/content.ts src/lib/podcast/imagery.ts src/routes/index.tsx; do
  require_file "$f" "AC-1.5: $f exists"
  imports="$(grep -cE 'from "@/assets/' "$f" || true)"
  assert_ge "${imports:-0}" 1 "AC-1.5: $f imports at least one asset"
  json_imports="$(grep -cE 'from "@/assets/[^"]*\.asset\.json"' "$f" || true)"
  assert_eq "${json_imports:-0}" "0" "AC-1.5: $f imports images as files, not JSON"
done

# The dereference that made a pointer usable must be gone everywhere. A
# leftover `X.url` on a Vite image import is a type error today, but it is also
# the exact shape the bug took, so it is asserted rather than left to tsc.
url_derefs="$(scan_src_non_test '^import [A-Za-z0-9_]+ from "@/assets/' 'asset imports' | grep -c . || true)"
assert_ge "${url_derefs:-0}" 40 "AC-1.5: the asset imports are present to check"

pass "AC-1.5: content.ts, imagery.ts and index.tsx import images as files"
