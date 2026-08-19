#!/usr/bin/env bash
# scripts/verify/acceptance/nav-ia.sh
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

# ── 3. nav-ia ──────────────────────────────────────────────────────────────
# AC-3.3: every page except Blueprint renders only the single top nav.
# AC-3.4: Blueprint renders the top nav PLUS its own in-page sub-nav.
#
# Counted on <nav> elements with a distinct identity, not on nested state
# attributes — Amendment 3 decision 2 recorded a selector that counted 8
# regions for 2 sections, and the same class of error would count a nav's
# children as navs.
surfaces_json="$(bun -e 'import {visitableSurfaces, BLUEPRINT_PATH} from "./src/lib/surfaces.ts"; console.log(JSON.stringify({s: visitableSurfaces(), b: BLUEPRINT_PATH}))')"
surface_paths="$(printf '%s' "$surfaces_json" | jq -r '.s[].path')"
blueprint_path="$(printf '%s' "$surfaces_json" | jq -r '.b')"
surface_n="$(printf '%s\n' "$surface_paths" | grep -c .)"
assert_ge "$surface_n" 5 "SURFACES yields pages to check (floor)"

while IFS= read -r p; do
  [ -n "$p" ] || continue
  body="$(body_of "$p")"
  navs="$(count_in_re "$body" '<nav\b')"
  if [ "$p" = "$blueprint_path" ]; then
    assert_ge "${navs:-0}" 2 "AC-3.4: $p renders the top nav plus its own sub-nav"
  else
    assert_eq "${navs:-0}" "1" "AC-3.3: $p renders exactly one nav"
  fi
done <<EOF
$surface_paths
EOF
pass "AC-3.3/AC-3.4: nav counts correct across $surface_n surfaces"
