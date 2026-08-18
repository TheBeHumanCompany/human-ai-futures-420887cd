#!/usr/bin/env bash
# scripts/verify/delta.sh — "no NEW breakage" gate.
#
# `main@a6a377a` is inherited red (2 failing tests, 33 eslint errors). S0.4
# pins that instead of fixing it, because a tree-wide `eslint --fix` at branch
# time would hold a whitespace diff open across bot-authored files for the
# branch's whole life, against a bot that reverts. The fix lands in Phase 7.
#
# So "keep the branch in a working state" (AGENTS.md:8-9) is read here as *no
# new breakage*, and this script is what makes that mechanical rather than
# asserted. It also runs as a pre-push hook (see scripts/verify/install-hooks.sh),
# so the branch provably never regresses past the baseline.
#
# Usage: bash scripts/verify/delta.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_file .baseline/eslint.json "eslint baseline is pinned"
require_file .baseline/failing-tests.json "failing-test baseline is pinned"
require_cmd bun "delta gate needs bun"

bun run scripts/verify/baseline.ts --check
