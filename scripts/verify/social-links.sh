#!/usr/bin/env bash
# scripts/verify/social-links.sh — AC-2.3b / AC-2.3c / AC-2.3d.
#
# ── The count is NOT written here, and that is the point ───────────────────
#
# This number has changed three times in three days:
#
#   plan S0.4c    "asserts exactly six found and all 200"
#   Amendment 4   exactly THREE — LinkedIn, Instagram, YouTube; TikTok and
#                 Snapchat removed, no account exists for either
#   Amendment 5   exactly FOUR — `social-section.tsx` turned out to ship SEVEN
#                 platforms, Facebook and X on top of the five anyone knew
#                 about, so "exactly three" would have silently dropped both.
#                 User kept X, dropped Facebook.
#
# Every one of those revisions would have required editing this script if the
# count lived in it. It does not: the list is read from `SOCIAL_LINKS` in
# `src/lib/brand.ts`, which is the same constant the footer renders from. A
# fifth revision changes one array and this gate follows it.
#
# That is also what makes AC-2.3b provable rather than asserted. "These live in
# one shared constant module; no call site inlines a social URL" cannot be
# demonstrated by a gate holding its own second copy of the URLs.
#
# Usage: bash scripts/verify/social-links.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BRAND="src/lib/brand.ts"
if [ ! -f "$BRAND" ]; then
  echo "FAIL[AC-2.3b]: $BRAND does not exist. The social URLs, INDIGENOUS_LINE and the booking" >&2
  echo "  constants live in one shared module (S3.2); no call site inlines a social URL. This" >&2
  echo "  gate reads that module rather than duplicating its contents, so it cannot run before" >&2
  echo "  the module lands. Expected to fail until Phase 3." >&2
  exit 1
fi

require_cmd bun "social-links"

# Derived, not typed.
urls="$(bun -e 'import {SOCIAL_LINKS} from "./src/lib/brand.ts"; console.log(SOCIAL_LINKS.map(s => `${s.name}\t${s.href}`).join("\n"))')"
n="$(printf '%s\n' "$urls" | grep -c .)"

# Non-vacuity floor, FIRST. "Every social link is 200" is true of an empty list.
assert_ge "$n" 1 "SOCIAL_LINKS is populated"

# ── every entry is a real https URL ────────────────────────────────────────
#
# `href="#"` is the exact defect AC-2.3 was written about, and it would sail
# past a 200 check by never being requested at all.
placeholders=""
while IFS=$'\t' read -r name href; do
  [ -n "$name" ] || continue
  case "$href" in
    https://*) : ;;
    *) placeholders="$placeholders $name=$href" ;;
  esac
done <<EOF
$urls
EOF
assert_eq "$placeholders" "" "AC-2.3c: every social href is an https:// URL, none is a '#' placeholder (bad:${placeholders:-none})"

# ── removed platforms stay removed ─────────────────────────────────────────
#
# Amendment 4 removed TikTok and Snapchat; Amendment 5 removed Facebook. X is
# RETAINED and must not appear here — dropping it would be the same silent
# deletion Amendment 5 exists to have caught. Orphaned icon components go too:
# a `FacebookIcon` nobody renders is dead code that reads as an intent to
# restore the link.
REMOVED="TikTok Snapchat Facebook"

for gone in $REMOVED; do
  hits="$(printf '%s\n' "$urls" | grep -ci "$gone" || true)"
  assert_eq "${hits:-0}" "0" "AC-2.3d: '$gone' is absent from SOCIAL_LINKS"
done

# In shipped source too, not just in the constant — including the icon
# components. Scoped to non-test files: a test asserting "no Facebook" contains
# the string "Facebook", and an unscoped scan would match the test that
# enforces the rule and could never pass.
removed_re="$(printf '%s' "$REMOVED" | tr ' ' '|')"
offenders="$(scan_src_non_test "($removed_re)" 'removed social platforms' || true)"
offender_n="$(printf '%s' "$offenders" | grep -c . || true)"
if [ "${offender_n:-0}" -ne 0 ]; then
  echo "FAIL[AC-2.3d]: removed platforms still referenced in shipped source:" >&2
  printf '%s\n' "$offenders" | sed 's/^/  /' >&2
  exit 1
fi

# The retained platform must actually still be there. Without this, deleting X
# along with the others would pass every assertion above.
retained="$(printf '%s\n' "$urls" | grep -c '^X	' || true)"
assert_eq "${retained:-0}" "1" "AC-2.3d: X is RETAINED, not removed with the others"

# ── every link resolves ────────────────────────────────────────────────────
echo "checking $n social URLs"
while IFS=$'\t' read -r name href; do
  [ -n "$name" ] || continue
  # Third-party origins we do not control, so identity cannot be asserted the
  # way it is for our own deploy. What can be asserted is that the link is not
  # dead — and it is asserted, not tolerated: head_ok exits non-zero on a
  # transport failure rather than reporting 000 and moving on.
  head_ok "$href" "AC-2.3b: $name resolves"
done <<EOF
$urls
EOF

pass "AC-2.3b/c/d: $n social links (derived from SOCIAL_LINKS), all https, all 200; TikTok/Snapchat/Facebook absent, X retained"
