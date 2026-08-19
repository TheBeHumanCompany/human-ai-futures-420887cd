#!/usr/bin/env bash
# scripts/verify/acceptance/new-human-era.sh
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

# ── 5. new-human-era ───────────────────────────────────────────────────────
nhe="$(body_of /the-new-human-era)"
if [ -f docs/principles.json ]; then
  # AC-5.4b: the six principles render period-free, from ONE shared fixture
  # consumed by implementation and proof alike. Reading the fixture is what
  # makes that "one fixture" claim true rather than asserted.
  while IFS= read -r principle; do
    [ -n "$principle" ] || continue
    assert_contains "$nhe" "$principle" "AC-5.4b: principle '$principle' renders"
    assert_not_contains "$nhe" "$principle." "AC-5.9a: '$principle' has no trailing period"
  done <<EOF
$(jq -r '.[]' docs/principles.json)
EOF
  n_principles="$(jq 'length' docs/principles.json)"
  assert_eq "$n_principles" "6" "AC-5.4b: the fixture holds six principles"
  pass "AC-5.4b/AC-5.9a: six principles render, period-free, from the shared fixture"
else
  echo "SKIP[AC-5.4b]: docs/principles.json does not exist yet (Phase 5)" >&2
fi
assert_not_contains "$nhe" "Presence is the new luxury" "AC-5.5: the superseded PRINCIPLES copy is gone"
assert_not_contains "$nhe" "[HUMAN ARCHIVE QUOTE" "AC-5.6: no quote placeholder survives"
