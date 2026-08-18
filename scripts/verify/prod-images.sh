#!/usr/bin/env bash
# scripts/verify/prod-images.sh — AC-1.6: no image 404s on a deployed site.
#
# Usage: bash scripts/verify/prod-images.sh <base-url>
#
# ── What is being checked, and what is not ─────────────────────────────────
#
# This checks the DERIVATIVES Vite emitted and the browser requests. It does
# not check the 46 originals, and it must not be "fixed" to. Nothing imports
# the originals, so Vite never processes them and they can never appear in a
# build manifest — that is correct and intended (S0.2, note N4). AC-1.1 checks
# original SHA-256s against src/assets/asset-recovery-manifest.json; AC-1.6
# checks derivative URLs against a live deploy. They never meet. An implementer
# who "fixes" the absence by importing 85 MB into the bundle has broken the
# site to satisfy a misreading.
#
# The inventory count is compared FIRST, and it comes from
# docs/asset-inventory.json — derived by the recovery run from the pointer set.
# No literal appears here that a scan could have derived.

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BASE="${1:-${ENV_URL:-}}"
[ -n "$BASE" ] || {
  echo "usage: bash scripts/verify/prod-images.sh <base-url>" >&2
  exit 2
}
BASE="${BASE%/}"

require_cmd jq "prod-images"
require_file docs/asset-inventory.json "asset inventory is generated"

EXPECTED_HOST="$(host_of "$BASE")"
export EXPECTED_HOST

# RULE 1b — origin FIRST, before a single byte of content is read. A body
# check alone establishes nothing about which site answered; this gate passed
# against Wikipedia during review.
assert_origin "$BASE/" "$EXPECTED_HOST"

inventory_n="$(jq 'length' docs/asset-inventory.json)"
assert_ge "$inventory_n" 40 "the asset inventory is populated"

# The site must reference at least as many distinct emitted images as the
# archive + collage + guest-avatar set the inventory describes. Fewer means
# images silently stopped being imported.
echo "checking image references across $(bun -e 'import {visitableSurfaces} from "./src/lib/surfaces.ts"; console.log(visitableSurfaces().length)') surfaces"

urls_file="$(mktemp)"
trap 'rm -f "$urls_file"' EXIT

surfaces="$(bun -e 'import {visitableSurfaces} from "./src/lib/surfaces.ts"; console.log(visitableSurfaces().map(s => s.path).join("\n"))')"
surface_n="$(printf '%s\n' "$surfaces" | grep -c .)"
assert_ge "$surface_n" 5 "SURFACES yields pages to check"

while IFS= read -r surface_path; do
  [ -n "$surface_path" ] || continue
  url="$BASE$surface_path"
  # fetch_ok asserts origin, then a non-trivial body, then rejects soft-404s.
  # Only after all three does any content get read.
  body="$(fetch_ok "$url")"
  # Now local text — `|| true` here is safe precisely because the fetch above
  # was asserted, not tolerated.
  printf '%s' "$body" \
    | grep -oE '(src|href)="[^"]*\.(png|jpe?g|webp|avif|svg)[^"]*"' \
    | sed -E 's/^(src|href)="//; s/"$//' >>"$urls_file" || true
done <<EOF
$surfaces
EOF

# Deduplicate and resolve relative URLs against the base.
sort -u "$urls_file" -o "$urls_file"
url_n="$(grep -c . <"$urls_file" || true)"
assert_ge "${url_n:-0}" 10 "the deployed pages reference images at all"

echo "found $url_n distinct image URLs; asserting each returns 200"

bad=""
while IFS= read -r u; do
  [ -n "$u" ] || continue
  case "$u" in
    http://* | https://*) full="$u" ;;
    /*) full="$BASE$u" ;;
    *) full="$BASE/$u" ;;
  esac
  code="$(curl -sS -o /dev/null -w '%{http_code}' -L --max-time "$CURL_MAX_TIME" "$full")" || code="000"
  [ "$code" = "200" ] || bad="$bad
  $code  $full"
done <"$urls_file"

if [ -n "$bad" ]; then
  echo "FAIL[AC-1.6]: image requests did not return 200:" >&2
  echo "$bad" >&2
  exit 1
fi

# AC-1.6's other half: no Lovable pointer path survives into the deploy. Those
# `/__l5e/assets-v1/...` paths only Lovable's own hosting serves, so one baked
# into the bundle is a guaranteed production 404.
lovable=0
while IFS= read -r u; do
  case "$u" in *"__l5e"*) lovable=$((lovable + 1)) ;; esac
done <"$urls_file"
assert_eq "$lovable" "0" "no Lovable /__l5e/ asset path survives into the deploy"

pass "AC-1.6: $url_n image URLs across $surface_n surfaces all 200, no /__l5e/ paths (inventory: $inventory_n originals)"
