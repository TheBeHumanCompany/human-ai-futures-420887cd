#!/usr/bin/env bash
# scripts/verify/acceptance/asset-pipeline.sh
#
# One component's production assertions. Sourced by prod-acceptance.sh, which
# has ALREADY asserted the origin before this file runs — so `fetch_ok` and
# `body_of` below are talking to a host whose identity is established. Do not
# re-derive EXPECTED_HOST here, and do not read content before the driver has
# run; origin-before-content is the whole reason that gate exists.
#
# Owner: worker-1 (harness)
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

# ── 1. asset-pipeline ──────────────────────────────────────────────────────
home="$(body_of /)"
lovable_paths="$(count_in "$home" '__l5e')"
assert_eq "${lovable_paths:-0}" "0" "AC-1.6: no Lovable pointer path on the homepage"
img_count="$(count_in_re "$home" '<img[^>]+src="[^"]+"')"
assert_ge "${img_count:-0}" 3 "AC-1.6: the homepage renders images (floor, so 'no 404s' is not vacuous)"
