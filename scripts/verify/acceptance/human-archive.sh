#!/usr/bin/env bash
# scripts/verify/acceptance/human-archive.sh
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

# ── 7. human-archive ───────────────────────────────────────────────────────
#
# Amended 2026-08-19 (Sid: defer the archive). `/the-human-archive` was the
# surface these assertions read, because it rendered the four entries. It no
# longer does — it is a teaser that says the archive is coming — so AC-7.1 and
# AC-7.2/7.3 move to the homepage section, which is where the four now render.
# The page keeps assertions of its own: the deferral is a decision, and a
# decision nothing checks is a decision that quietly reverts.
home="$(body_of /)"
for name in ADEWOLF BELLA ANTON ARLINA; do
  assert_contains "$home" "$name" "AC-7.1: $name is in the homepage archive section"
done

# Not a bare `<img` count — the homepage carries the collage and the guest
# avatars too, so any floor would pass without a single portrait. The four
# portrait stems survive fingerprinting, so they are what gets counted.
for stem in archive-adewolf archive-bella archive-anton archive-arlina; do
  n="$(count_in_re "$home" "$stem")"
  assert_ge "${n:-0}" 1 "AC-7.2/7.3: $stem renders from a committed binary"
done

archive="$(body_of /the-human-archive)"
assert_contains "$archive" "To be released soon" "the archive page states the deferral"
for name in ADEWOLF BELLA ANTON ARLINA; do
  assert_not_contains "$archive" "$name" "the deferred archive page lists no entries"
done
pass "AC-7.x: four entries render on the homepage; /the-human-archive is deferred"
