#!/usr/bin/env bash
# scripts/verify/ac-bijection.sh
#
# The spec's live AC set and the proof table must be the SAME SET — every live
# criterion proven exactly once, and no row proving something that is no longer
# live. Both directions, because each has its own way of going wrong:
#
#   live \ rows   a criterion nobody proves. The gate reports success over a
#                 subset and the missing one is discovered in production.
#   rows \ live   a row proving a retired criterion. The count looks right —
#                 "63/63" — while covering the wrong 63.
#
# Neither side is a literal. The live set is derived from the tracked spec by
# ac-inventory.ts; the rows are derived from the live set by `--sync-proofs`.
# The number this prints is an output, not an input: do not "fix" a mismatch by
# editing the expected count.
#
# Usage: bash scripts/verify/ac-bijection.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "ac-bijection"
require_cmd bun "ac-bijection"

# Regenerate first. A bijection asserted against a stale inventory proves that
# two stale files agree with each other.
bun run scripts/verify/ac-inventory.ts >/dev/null

require_file docs/ac-inventory.json "AC inventory is generated"
require_file docs/ac-proof-table.json "AC proof table exists"

live_ids="$(jq -r '.criteria[] | select(.status == "live") | .id' docs/ac-inventory.json | LC_ALL=C sort)"
row_ids="$(jq -r '.rows[].id' docs/ac-proof-table.json | LC_ALL=C sort)"

live_n="$(printf '%s\n' "$live_ids" | grep -c .)"
row_n="$(printf '%s\n' "$row_ids" | grep -c .)"

# Non-vacuity floor, FIRST. Every assertion below is a set comparison, and the
# empty set is equal to itself. Without this line an inventory that parsed
# nothing would pass the whole gate.
assert_ge "$live_n" 55 "the live AC set is populated (a bijection over nothing proves nothing)"

# Uniqueness on both sides. `sort -u` silently absorbs a duplicate id, so the
# comparison below would pass while one criterion was proven twice and another
# not at all.
live_u="$(printf '%s\n' "$live_ids" | LC_ALL=C sort -u | grep -c .)"
row_u="$(printf '%s\n' "$row_ids" | LC_ALL=C sort -u | grep -c .)"
assert_eq "$live_u" "$live_n" "live AC ids are unique"
assert_eq "$row_u" "$row_n" "proof-table ids are unique"

missing="$(comm -23 <(printf '%s\n' "$live_ids") <(printf '%s\n' "$row_ids") | tr '\n' ' ' | sed 's/ *$//')"
orphan="$(comm -13 <(printf '%s\n' "$live_ids") <(printf '%s\n' "$row_ids") | tr '\n' ' ' | sed 's/ *$//')"

assert_eq "$missing" "" "every live criterion has a proof row (unproven: ${missing:-none})"
assert_eq "$orphan" "" "no proof row survives its criterion (orphaned: ${orphan:-none})"
assert_eq "$row_n" "$live_n" "row count equals live count"

total="$(jq -r '.total' docs/ac-inventory.json)"
retired="$(jq -r '.retired' docs/ac-inventory.json)"
pass "AC bijection: $live_n/$live_n live criteria proven exactly once ($total in spec, $retired retired)"
