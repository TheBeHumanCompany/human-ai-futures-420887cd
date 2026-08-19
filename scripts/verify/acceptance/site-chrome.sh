#!/usr/bin/env bash
# scripts/verify/acceptance/site-chrome.sh
#
# One component's production assertions. Sourced by prod-acceptance.sh, which
# has ALREADY asserted the origin before this file runs — so `fetch_ok` and
# `body_of` below are talking to a host whose identity is established. Do not
# re-derive EXPECTED_HOST here, and do not read content before the driver has
# run; origin-before-content is the whole reason that gate exists.
#
# Owner: worker-3
#
# Available from lib.sh and the driver:
#   body_of <path>   fetch a surface once, memoized for this run
#   fetch_ok <url>   origin-asserted, floor-asserted, soft-404-rejecting fetch
#   assert_eq / assert_ge / assert_contains / assert_not_contains / pass
#
# Rules that are not negotiable here:
#   · never `|| true` on a network call — it returns "0" on a dead origin
#   · derive counts from a shipped constant or fixture, never a typed literal
#   · assert a non-vacuity floor BEFORE asserting anything about contents
#   · every assertion names the AC it proves, so a failure is self-locating
#
# shellcheck shell=bash

home="$(body_of /)"
# ── 2. site-chrome ─────────────────────────────────────────────────────────
# The Indigenous line is one canonical string, shared by implementation and
# proof through src/lib/brand.ts. Neither side may hardcode it independently —
# that is AC-2.8b, and it is why this reads the constant instead of quoting it.
if [ -f src/lib/brand.ts ]; then
  indigenous="$(bun -e 'import {INDIGENOUS_LINE} from "./src/lib/brand.ts"; process.stdout.write(INDIGENOUS_LINE)')"
  assert_ge "${#indigenous}" 10 "AC-2.8b: INDIGENOUS_LINE is a real string"
  assert_contains "$home" "$indigenous" "AC-2.1b: the footer renders the canonical Indigenous line"
  # AC-2.8b: the maple leaf sits immediately beside that string. Checked on the
  # rendered proximity, not on the leaf existing somewhere on the page.
  near="$(printf '%s' "$home" | grep -o ".\{0,80\}$indigenous" || true)"
  assert_contains "$near" "🍁" "AC-2.8b: a maple leaf sits beside the Indigenous line"
  pass "AC-2.1b/AC-2.8b: the canonical Indigenous line renders with its maple leaf"
else
  echo "SKIP[AC-2.1b]: src/lib/brand.ts does not exist yet (Phase 3, S3.2)" >&2
fi

assert_not_contains "$home" "Sydney · London · New York" "AC-2.2: the fictitious office list is gone"
assert_not_contains "$home" "calendly" "AC-2.5: no Calendly reference"
assert_not_contains "$home" "Calendly" "AC-2.5: no Calendly reference (capitalised)"
