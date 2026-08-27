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
# Amended 2026-08-26 (Sid: the archive is back). `/the-human-archive` was
# restored to the pre-deferral grid design (Amendment 8), now rendering the
# four VIDEO entries — LUCY, FARID, ABDI, MARISSA — with hover-to-play embeds
# and a playlist CTA. The homepage section still renders the ORIGINAL four
# (ADEWOLF, BELLA, ANTON, ARLINA) untouched, so AC-7.1 and AC-7.2/7.3 stay
# where the 2026-08-19 deferral put them: on the homepage. The page's own
# assertions are the deferral's inverse — the restore is a decision, and a
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
for name in LUCY FARID ABDI MARISSA; do
  assert_contains "$archive" "$name" "AC-7.4a: $name is in the restored video grid"
done
for stem in archive-video-lucy archive-video-farid archive-video-abdi archive-video-marissa; do
  n="$(count_in_re "$archive" "$stem")"
  assert_ge "${n:-0}" 1 "AC-7.4a: $stem still renders from a committed binary"
done
assert_contains "$archive" "Watch the Human Archives" \
  "AC-7.5a: the playlist CTA carries its exact label"
assert_contains "$archive" "PLdA-mx7SlQ_A" \
  "AC-7.5a: the playlist CTA points at the verified playlist"
assert_not_contains "$archive" "To be released soon" \
  "AC-7.5a: the restored page carries no deferral wording"
pass "AC-7.x: four entries render on the homepage; /the-human-archive carries the restored video grid"
