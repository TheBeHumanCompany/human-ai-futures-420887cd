#!/usr/bin/env bash
# scripts/verify/acceptance/blueprint.sh
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

# ── 6. blueprint-page ──────────────────────────────────────────────────────
bp="$(body_of /be-human-ai)"
if [ -f docs/blueprint-sections.json ]; then
  # AC-6.2: all 16 sections present, in PDF order. Ordered, not just present —
  # a set check passes on a scrambled page.
  #
  # Both the section list AND the expected collapsed count are read from the
  # fixture. Amendment 2 decision 2 approved tiering as "3 summary cards / 7
  # collapsed / 6 visible" and the shipped fixture is 2/7/7; that split is
  # Phase 6's to decide, and a gate carrying its own copy of the numbers would
  # either contradict the page or have to be edited every time the editorial
  # call moved. What the gate holds it to is the invariant: every section in
  # the DOM, in order, and exactly the tier-2 ones collapsed.
  ids="$(jq -r '.sections[].id' docs/blueprint-sections.json)"
  id_n="$(printf '%s\n' "$ids" | grep -c .)"
  assert_eq "$id_n" "16" "AC-6.2: the fixture declares 16 sections"

  prev_pos=-1
  while IFS= read -r id; do
    [ -n "$id" ] || continue
    assert_contains "$bp" "id=\"$id\"" "AC-6.2: section '$id' is in the DOM"
    # Ordering: each id's byte offset must exceed the previous one's.
    pos="$(printf '%s' "$bp" | grep -bo "id=\"$id\"" | head -1 | cut -d: -f1)"
    assert_ge "$pos" "$((prev_pos + 1))" "AC-6.2: section '$id' appears after the one before it"
    prev_pos="$pos"
  done <<EOF
$ids
EOF

  # AC-6.9b: collapsed sections are native <details>, openable with JS off.
  # AC-6.9c counts UNIQUELY IDENTIFIED SECTION CONTAINERS, not every disclosure
  # on the page.
  #
  # The Blueprint nests <details> inside sections — the FAQ alone contributes
  # nine — so a bare `<details` count reads 24 against 7 tier-2 sections and
  # fails for entirely the wrong reason. `blueprint.tsx` marks section-level
  # ones with `data-section-id` and deliberately leaves nested ones without it,
  # which is exactly the distinction this criterion was written to force after
  # the superseded selector counted 8 regions for 2 sections.
  expected_collapsed="$(jq '[.sections[] | select(.tier == 2)] | length' docs/blueprint-sections.json)"
  assert_ge "$expected_collapsed" 1 "AC-6.9c: the fixture declares collapsed sections"
  details="$(count_in_re "$bp" '<details[^>]*data-section-id')"
  assert_eq "$details" "$expected_collapsed" "AC-6.9b/c: exactly the tier-2 sections are collapsed"
  # Every disclosure on the page, nested ones included, must be a real
  # <details>/<summary> pair. This is the count that should include the nested
  # nine — they are the ones the FAQ depends on working without JavaScript.
  all_details="$(count_in_re "$bp" '<details')"
  summaries="$(count_in_re "$bp" '<summary')"
  assert_ge "$all_details" "$details" "AC-6.9c: nested disclosures are counted separately from sections"
  assert_eq "$summaries" "$all_details" "AC-6.9c: every <details> has exactly one <summary>"

  # The superseded mechanism must be gone: Radix's state attribute is what the
  # old gate miscounted, so its presence means the accordion came back.
  radix="$(count_in "$bp" 'data-state="\(open\|closed\)"')"
  assert_eq "${radix:-0}" "0" "AC-6.9b: no scripted accordion survives"

  # AC-6.9c/d floor: a <details> present but empty passes a count and fails the
  # thing the count stands for.
  assert_ge "${#bp}" 20000 "AC-6.9d: the Blueprint page carries real prose, not just section shells"
  pass "AC-6.2/AC-6.9b/AC-6.9c: $id_n sections present and ordered, $details collapsed as declared"
else
  echo "SKIP[AC-6.2]: docs/blueprint-sections.json does not exist yet (Phase 6, S6.0)" >&2
fi

assert_contains "$bp" "795" "AC-6.3: the founding rate renders"
assert_contains "$bp" "1,500" "AC-6.3: the future rate renders"
assert_contains "$bp" "3 business days" "AC-6.3: the turnaround renders"

# AC-6.11a: sovereignty copy describes practices and asserts no domain
# definition — no compliance guarantee, no certification claim (controls.yaml:5).
for claim in "guarantees compliance" "certified compliant" "ensures compliance" "fully compliant"; do
  assert_not_contains "$bp" "$claim" "AC-6.11a: no compliance-guarantee claim ('$claim')"
done
