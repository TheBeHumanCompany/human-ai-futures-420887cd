#!/usr/bin/env bash
# scripts/verify/acceptance/typography.sh
#
# One component's production assertions. Sourced by prod-acceptance.sh, which
# has ALREADY asserted the origin before this file runs — so `fetch_ok` and
# `body_of` below are talking to a host whose identity is established. Do not
# re-derive EXPECTED_HOST here, and do not read content before the driver has
# run; origin-before-content is the whole reason that gate exists.
#
# Owner: worker-2
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

# ── 4. typography-system ───────────────────────────────────────────────────
# AC-4.5: no bespoke inline clamp() survives on the two rebuilt pages.
for p in /the-new-human-era /be-human-ai; do
  body="$(body_of "$p")"
  inline_clamp="$(count_in_re "$body" 'style="[^"]*clamp\(')"
  assert_eq "${inline_clamp:-0}" "0" "AC-4.5: $p carries no inline clamp()"
done
