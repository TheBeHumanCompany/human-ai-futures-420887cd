#!/usr/bin/env bash
# scripts/verify/ac-suite.sh — THE RELEASE-GATE ENTRY POINT.
#
# Runs every live acceptance criterion's proof, in id order, and exits non-zero
# naming the FIRST failure. Calls ac-bijection.sh first, so it can never run a
# proof set that has drifted from the spec.
#
# ── The failure this file exists to prevent ────────────────────────────────
#
# Through eight planning iterations the plan called this script from the Phase 8
# gate and never created it. `bash scripts/verify/ac-suite.sh` on a missing file
# exits 127, which a release script that does not check exit codes reads as
# "ran fine". Phase 8 would have halted here, or worse, waved through.
#
# ── "Not written yet" is not "passing" ─────────────────────────────────────
#
# Rows arrive with `proof: null` and the owning phase fills them in. In default
# mode a null proof is reported as PENDING and skipped, so the suite is useful
# from Phase 0 onward. In `--release` mode a null proof is a FAILURE. That is
# the whole safety property: a criterion nobody got round to proving cannot be
# mistaken for a criterion that passed, and the release gate is the place where
# that distinction has to bite.
#
# Usage:
#   bash scripts/verify/ac-suite.sh                  # run what exists, report pending
#   bash scripts/verify/ac-suite.sh --release        # every live AC must have a passing proof
#   bash scripts/verify/ac-suite.sh --only AC-1.1    # one criterion, for iterating
#
# Environment:
#   ENV_URL   base URL the proofs run against, exported to every proof command
#             as $ENV_URL. Defaults to the production domain.

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "ac-suite"

RELEASE=0
ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --release) RELEASE=1 ;;
    --only)
      shift
      ONLY="${1:-}"
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
  shift
done

export ENV_URL="${ENV_URL:-https://www.thebehumancompany.ca}"
export EXPECTED_HOST="${EXPECTED_HOST:-$(host_of "$ENV_URL")}"

# Bijection FIRST. Running proofs against a drifted table is how a suite
# reports a full green over the wrong set of criteria.
bash scripts/verify/ac-bijection.sh

echo ""
echo "ac-suite: proving live acceptance criteria against $ENV_URL"
echo ""

total=0
passed=0
pending=0
pending_ids=""

# Read rows as tab-separated id/proof so a proof containing spaces survives.
# Process substitution rather than a pipe: a `while` loop on the right of a
# pipe runs in a subshell, and every counter incremented in it would be
# discarded at the end — the loop would report 0 passed no matter what ran.
while IFS=$'\t' read -r id proof; do
  [ -n "$id" ] || continue
  if [ -n "$ONLY" ] && [ "$id" != "$ONLY" ]; then continue; fi
  total=$((total + 1))

  if [ "$proof" = "null" ] || [ -z "$proof" ]; then
    if [ "$RELEASE" -eq 1 ]; then
      echo "FAIL[$id]: no proof defined. In release mode an unproven criterion is a failure," >&2
      echo "  not a skip — otherwise 'nobody wrote this check' and 'this check passed' look the same." >&2
      exit 1
    fi
    pending=$((pending + 1))
    pending_ids="$pending_ids $id"
    printf '  PEND  %-10s (no proof yet)\n' "$id"
    continue
  fi

  printf '  ....  %-10s %s\n' "$id" "$proof"
  if ! ( eval "$proof" ) >/tmp/ac-suite-$$.log 2>&1; then
    echo "" >&2
    echo "FAIL[$id]: proof exited non-zero." >&2
    echo "  command: $proof" >&2
    echo "  --- output ---" >&2
    sed 's/^/  /' /tmp/ac-suite-$$.log >&2
    rm -f /tmp/ac-suite-$$.log
    exit 1
  fi
  rm -f /tmp/ac-suite-$$.log
  passed=$((passed + 1))
  printf '  PASS  %-10s\n' "$id"
done < <(jq -r '.rows[] | [.id, (.proof // "null")] | @tsv' docs/ac-proof-table.json)

echo ""
if [ -n "$ONLY" ]; then
  assert_ge "$total" 1 "--only '$ONLY' matched a criterion"
fi

if [ "$RELEASE" -eq 1 ]; then
  assert_eq "$pending" 0 "no criterion is unproven at release"
  assert_eq "$passed" "$total" "every live criterion passed"
  pass "ac-suite --release: $passed/$total live criteria proven against $ENV_URL"
else
  echo "ac-suite: $passed passed, $pending pending of $total live criteria"
  [ "$pending" -eq 0 ] || echo "  pending:$pending_ids"
  echo "  (this is NOT a release gate — run with --release for that)"
fi
