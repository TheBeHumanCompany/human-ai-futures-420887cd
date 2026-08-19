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
#   1. ORIGIN IS ASSERTED FIRST, before any content is read, by this driver —
#      once, for the whole run. Identity is proven by the effective URL's host,
#      never by page content, because correct content copied onto a disallowed
#      host is exactly the case a content-only gate cannot catch.
#   2. Every assertion is POSITIVE and specific. "The body does not contain X"
#      is satisfied by every page on the internet that is not this site.
#
# ── Why the components are separate files ──────────────────────────────────
#
# AC-X.5 needs one assertion per component, and the components are owned by
# different people. A single script would mean three of us editing one file for
# the rest of the project. Each component's assertions now live in
# `acceptance/<component>.sh`, owned by whoever built that surface — they know
# the ids, the fixtures and the failure modes; I know the gate rules.
#
# The driver keeps what must stay central: the origin check, the fetch cache,
# and the ORDER (identity before content, always).
#
# `scripts/verify/acceptance-faults.test.ts` runs this whole thing against
# seeded fixtures and asserts it FAILS on each. A gate that has never been
# observed failing is a gate of unknown strength.

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BASE="${1:-${ENV_URL:-}}"
[ -n "$BASE" ] || {
  echo "usage: bash scripts/verify/prod-acceptance.sh <base-url>" >&2
  exit 2
}
BASE="${BASE%/}"
export BASE

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

# ── the fetch cache ────────────────────────────────────────────────────────
#
# Splitting the components into separate files must not multiply the request
# count — several of them legitimately read the same page. `body_of` fetches a
# surface once per run and memoizes it.
#
# It is `fetch_ok` underneath, so every first read of a surface is still
# origin-asserted, floor-asserted and soft-404-rejected. The cache changes how
# often we ask, never what we accept.
BODY_CACHE="$(mktemp -d "${TMPDIR:-/tmp}/prod-acceptance-XXXXXX")"
trap 'rm -rf "$BODY_CACHE"' EXIT

body_of() { # body_of <path> -> body on stdout
  local key file
  key="$(printf '%s' "$1" | tr -c 'A-Za-z0-9' '_')"
  file="$BODY_CACHE/$key"
  if [ ! -f "$file" ]; then
    fetch_ok "$BASE$1" >"$file"
  fi
  cat "$file"
}
export -f body_of 2>/dev/null || true

# ── components, in order ───────────────────────────────────────────────────
#
# Enumerated from the directory rather than listed here, so adding a component
# file is enough to have it run — and a component whose file is deleted stops
# being silently unproven.
COMPONENT_DIR="$VERIFY_LIB_DIR/acceptance"
[ -d "$COMPONENT_DIR" ] || {
  echo "FAIL[prod-acceptance]: no acceptance/ directory at $COMPONENT_DIR" >&2
  exit 1
}

components="$(find "$COMPONENT_DIR" -type f -name '*.sh' | LC_ALL=C sort)"
component_n="$(printf '%s\n' "$components" | grep -c . || true)"

# An EXACT manifest, not a floor.
#
# This was `assert_ge 5` against seven existing components, and review defeated
# it in one move: delete `human-archive.sh` and `typography.sh`, and the gate
# still reported success over the remaining five. A floor cannot tell "we have
# not written the last two yet" apart from "two proofs disappeared", and the
# second is exactly what a release gate exists to catch.
#
# Adding a component means adding its name here. That is the point: a new proof
# is a deliberate act, and so is retiring one.
REQUIRED_COMPONENTS="asset-pipeline blueprint human-archive nav-ia new-human-era site-chrome typography"

missing=""
for required in $REQUIRED_COMPONENTS; do
  [ -f "$COMPONENT_DIR/$required.sh" ] || missing="$missing $required"
done
assert_eq "${missing# }" "" "prod-acceptance: every required component is present (missing:${missing:- none})"

required_n="$(printf '%s\n' $REQUIRED_COMPONENTS | grep -c .)"
assert_eq "${component_n:-0}" "$required_n" \
  "prod-acceptance: exactly the required components run (found $component_n, manifest $required_n)"

while IFS= read -r component; do
  [ -n "$component" ] || continue
  # shellcheck source=/dev/null
  . "$component"
done <<EOF
$components
EOF

pass "prod-acceptance: $component_n component(s) asserted against $EXPECTED_HOST"
