#!/usr/bin/env bash
# scripts/verify/social-links.sh — AC-2.3b / AC-2.3c.
#
# ── The count is THREE, not six ────────────────────────────────────────────
#
# The plan's S0.4c manifest describes this script as "HEADs all six footer
# social URLs; asserts exactly six found and all 200". That predates Amendment
# 4 (2026-08-18), which resolved the question and reduced the set:
#
#   LinkedIn   https://www.linkedin.com/company/the-be-human-company/   200
#   Instagram  https://www.instagram.com/thebehumancompany/             200
#   YouTube    https://www.youtube.com/@shanejeremyjames                200
#
# TikTok and Snapchat are REMOVED — no account exists for either, verified
# against production, staging, the Lovable preview, both repos and the PodBean
# feed. The user's decision was to remove rather than link. AC-2.3c requires
# exactly three entries and the deletion of now-unused icon components.
#
# The expected count is therefore derived from `SOCIAL` in src/lib/brand.ts,
# not typed here — if the constant grows a fourth platform this gate checks
# four, and if it drops to two it checks two. What it will not do is agree with
# a number somebody remembered.
#
# Usage: bash scripts/verify/social-links.sh [base-url]

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BRAND="src/lib/brand.ts"
if [ ! -f "$BRAND" ]; then
  echo "FAIL[AC-2.3b]: $BRAND does not exist. The three social URLs, INDIGENOUS_LINE and the" >&2
  echo "  booking constants live in one shared module (S3.2); no call site inlines a social URL." >&2
  echo "  This gate reads that module rather than duplicating its contents, so it cannot run" >&2
  echo "  before the module lands. It is expected to fail until Phase 3." >&2
  exit 1
fi

require_cmd jq "social-links"

# Derived, not typed. Reading the shipped constant is what makes "no call site
# inlines a social URL" checkable rather than asserted.
urls="$(bun -e 'import {SOCIAL} from "./src/lib/brand.ts"; console.log(SOCIAL.map(s => s.href).join("\n"))')"
n="$(printf '%s\n' "$urls" | grep -c .)"

# Non-vacuity floor before anything else: "every social link is 200" is true of
# an empty list.
assert_ge "$n" 1 "SOCIAL is populated"

# Every entry must be a real https URL. `href="#"` is the defect AC-2.3 was
# written about and it would otherwise sail past a 200 check by never being
# requested.
placeholders=0
while IFS= read -r u; do
  [ -n "$u" ] || continue
  case "$u" in
    https://*) : ;;
    *) placeholders=$((placeholders + 1)) ;;
  esac
done <<EOF
$urls
EOF
assert_eq "$placeholders" "0" "AC-2.3c: every social href is an https:// URL, none is a '#' placeholder"

# Removed platforms must be gone from the constant AND from the components.
for gone in tiktok snapchat TikTok Snapchat; do
  hits="$(printf '%s\n' "$urls" | grep -ci "$gone" || true)"
  assert_eq "${hits:-0}" "0" "AC-2.3c: '$gone' is absent from SOCIAL"
done
component_hits="$(scan_src_non_test '(TikTok|Snapchat|tiktok|snapchat)' 'removed social platforms' | grep -c . || true)"
assert_eq "${component_hits:-0}" "0" "AC-2.3c: no TikTok/Snapchat reference survives in non-test source"

echo "checking $n social URLs"
while IFS= read -r u; do
  [ -n "$u" ] || continue
  # These are third-party origins we do not control, so identity cannot be
  # asserted the way it is for our own deploy. What CAN be asserted is that the
  # link is not dead — and it is asserted, not tolerated: head_ok exits
  # non-zero on a transport failure rather than reporting 000 and moving on.
  head_ok "$u" "AC-2.3b: social link resolves"
done <<EOF
$urls
EOF

pass "AC-2.3b/AC-2.3c: $n social links, all https, all 200, no TikTok/Snapchat"
