#!/usr/bin/env bash
# scripts/verify/prod-acceptance.sh — per-component acceptance against a deploy.
#
# Usage: bash scripts/verify/prod-acceptance.sh <base-url>
#
# ── Why this file is written the way it is ─────────────────────────────────
#
# An earlier version of this gate was run against Wikipedia and PASSED. It
# fetched a large page and asserted the body contained no `__l5e` substring.
# Wikipedia is a large page containing no `__l5e` substring. That gate
# established neither identity nor correctness, and a production check that
# green-lights Wikipedia is not a production check.
#
# Two consequences, both structural:
#
#   1. ORIGIN IS ASSERTED FIRST, before any content is read, on every surface.
#      Identity is proven by the effective URL's host, never by page content —
#      because correct content copied onto a disallowed host is exactly the
#      case a content-only gate cannot catch.
#   2. Every assertion is POSITIVE and specific. "The body does not contain X"
#      is satisfied by every page on the internet that is not this site.
#      Each component asserts something that only this site's correct output
#      contains.
#
# `scripts/verify/acceptance-faults.test.ts` runs this script against seeded
# fixtures and asserts it FAILS on each. A gate that has never been observed
# failing is a gate of unknown strength.

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BASE="${1:-${ENV_URL:-}}"
[ -n "$BASE" ] || {
  echo "usage: bash scripts/verify/prod-acceptance.sh <base-url>" >&2
  exit 2
}
BASE="${BASE%/}"

require_cmd jq "prod-acceptance"
require_cmd bun "prod-acceptance"

# Derived from the base URL by default. An explicit EXPECTED_HOST is honoured
# so the fault-injection suite can point the gate at a local fixture while
# telling it to expect the production host — which is how the "correct DOM,
# wrong origin" case is exercised. Getting this wrong in the other direction is
# safe: assert_origin fails loudly rather than passing.
EXPECTED_HOST="${EXPECTED_HOST:-$(host_of "$BASE")}"
export EXPECTED_HOST

# ── 0. Identity, before anything else ──────────────────────────────────────
assert_origin "$BASE/" "$EXPECTED_HOST"
pass "origin: $BASE resolves to $EXPECTED_HOST"

# ── 1. asset-pipeline ──────────────────────────────────────────────────────
home="$(fetch_ok "$BASE/")"
lovable_paths="$(printf '%s' "$home" | grep -c '__l5e' || true)"
assert_eq "${lovable_paths:-0}" "0" "AC-1.6: no Lovable pointer path on the homepage"
img_count="$(printf '%s' "$home" | grep -oE '<img[^>]+src="[^"]+"' | grep -c . || true)"
assert_ge "${img_count:-0}" 3 "AC-1.6: the homepage renders images (floor, so 'no 404s' is not vacuous)"

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
  body="$(fetch_ok "$BASE$p")"
  navs="$(printf '%s' "$body" | grep -oE '<nav\b' | grep -c . || true)"
  if [ "$p" = "$blueprint_path" ]; then
    assert_ge "${navs:-0}" 2 "AC-3.4: $p renders the top nav plus its own sub-nav"
  else
    assert_eq "${navs:-0}" "1" "AC-3.3: $p renders exactly one nav"
  fi
done <<EOF
$surface_paths
EOF
pass "AC-3.3/AC-3.4: nav counts correct across $surface_n surfaces"

# ── 4. typography-system ───────────────────────────────────────────────────
# AC-4.5: no bespoke inline clamp() survives on the two rebuilt pages.
for p in /the-new-human-era /be-human-ai; do
  body="$(fetch_ok "$BASE$p")"
  inline_clamp="$(printf '%s' "$body" | grep -oE 'style="[^"]*clamp\(' | grep -c . || true)"
  assert_eq "${inline_clamp:-0}" "0" "AC-4.5: $p carries no inline clamp()"
done

# ── 5. new-human-era ───────────────────────────────────────────────────────
nhe="$(fetch_ok "$BASE/the-new-human-era")"
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

# ── 6. blueprint-page ──────────────────────────────────────────────────────
bp="$(fetch_ok "$BASE/be-human-ai")"
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
  # AC-6.9c: count uniquely identified section containers, not nested state
  # attributes — the superseded selector counted 8 for 2 sections.
  expected_collapsed="$(jq '[.sections[] | select(.tier == 2)] | length' docs/blueprint-sections.json)"
  assert_ge "$expected_collapsed" 1 "AC-6.9c: the fixture declares collapsed sections"
  details="$(printf '%s' "$bp" | grep -oE '<details\b' | grep -c . || true)"
  assert_eq "${details:-0}" "$expected_collapsed" "AC-6.9b/c: exactly the tier-2 sections are collapsed"
  summaries="$(printf '%s' "$bp" | grep -oE '<summary\b' | grep -c . || true)"
  assert_eq "${summaries:-0}" "${details:-0}" "AC-6.9c: every <details> has exactly one <summary>"

  # The superseded mechanism must be gone: Radix's state attribute is what the
  # old gate miscounted, so its presence means the accordion came back.
  radix="$(printf '%s' "$bp" | grep -c 'data-state="\(open\|closed\)"' || true)"
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

# ── 7. human-archive ───────────────────────────────────────────────────────
archive="$(fetch_ok "$BASE/the-human-archive")"
for name in ADEWOLF BELLA ANTON ARLINA; do
  assert_contains "$archive" "$name" "AC-7.1: $name is in the archive"
done
archive_imgs="$(printf '%s' "$archive" | grep -oE '<img[^>]+src="[^"]+"' | grep -c . || true)"
assert_ge "${archive_imgs:-0}" 4 "AC-7.2/7.3: four portraits render from committed binaries"

pass "prod-acceptance: all component assertions passed against $EXPECTED_HOST"
