#!/usr/bin/env bash
# scripts/verify/phase0-exit.sh — the Phase 0 exit condition, as one command.
#
# Every assertion below is derived. There is no "46" in this file, no "63", no
# count anybody typed: the manifest is compared against the pointer glob, the
# recovery report against itself, the baseline against the tree.
#
# Usage:
#   bash scripts/verify/phase0-exit.sh              # everything runnable locally
#   bash scripts/verify/phase0-exit.sh --with-drill # + the restore drill (needs the release asset)

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "phase0-exit"
require_cmd git "phase0-exit"

WITH_DRILL=0
[ "${1:-}" = "--with-drill" ] && WITH_DRILL=1

# ── 1. Provenance: cut from main@a6a377a, nothing from the reference branch ──
#
# AC-X.1. `git cherry` lists commits by patch-id; a `-` prefix means "this
# commit's change is already upstream", i.e. it came from there.
git merge-base --is-ancestor a6a377a HEAD || {
  echo "FAIL[AC-X.1]: a6a377a is not an ancestor of HEAD — the branch was not cut from main@a6a377a" >&2
  exit 1
}
pass "AC-X.1: HEAD descends from main@a6a377a"

REF_BRANCH="origin/feat/podbean-rss-integration"
if git rev-parse --verify --quiet "$REF_BRANCH" >/dev/null; then
  picks="$(git cherry -v "$REF_BRANCH" HEAD | grep -c '^-' || true)"
  assert_eq "${picks:-0}" "0" "AC-X.1: no commit originates from $REF_BRANCH"
  # The floor. `grep -c '^-'` returns 0 both when nothing was cherry-picked and
  # when `git cherry` produced no output at all — a mistyped ref, say. Without
  # this line the strongest assertion in the file is also the easiest to fake.
  total="$(git cherry -v "$REF_BRANCH" HEAD | grep -c '^[+-]' || true)"
  assert_ge "${total:-0}" 1 "AC-X.1: git cherry produced output (0 picks is otherwise vacuous)"
  pass "AC-X.1: 0 of $total commits originate from $REF_BRANCH"
else
  echo "SKIP[AC-X.1]: $REF_BRANCH is not fetched; cannot check for cherry-picks" >&2
fi

# ── 2. Assets: every pointer recovered, integrity-checked, none skipped ─────
require_file src/assets/asset-recovery-manifest.json "the recovery manifest"
require_file .baseline/asset-recovery-report.json "the per-asset recovery report"
require_file docs/asset-inventory.json "the derived asset inventory"

failures="$(jq '[.[] | select(.status != "ok" and .status != "skipped-already-present")] | length' .baseline/asset-recovery-report.json)"
assert_eq "$failures" "0" "AC-1.2: no asset failed recovery"

pointers="$(find src/assets -name '*.asset.json' | grep -c .)"
manifest_n="$(jq 'length' src/assets/asset-recovery-manifest.json)"
report_n="$(jq 'length' .baseline/asset-recovery-report.json)"
assert_ge "$pointers" 40 "the pointer glob found pointers (floor)"
assert_eq "$manifest_n" "$pointers" "AC-1.1: the manifest covers every pointer"
assert_eq "$report_n" "$pointers" "AC-1.2: the report names every pointer"

# The manifest must describe files that are actually there, at those hashes.
# Without this the restore drill verifies a fiction.
missing=0
while IFS=$'\t' read -r filename sha; do
  [ -n "$filename" ] || continue
  f="src/assets/$filename"
  if [ ! -f "$f" ]; then
    echo "  absent: $filename" >&2
    missing=$((missing + 1))
    continue
  fi
  got="$(sha256_of "$f")"
  if [ "$got" != "$sha" ]; then
    echo "  hash mismatch: $filename got $got want $sha" >&2
    missing=$((missing + 1))
  fi
done <<EOF
$(jq -r '.[] | [.filename, .sha256] | @tsv' src/assets/asset-recovery-manifest.json)
EOF
assert_eq "$missing" "0" "AC-1.1: every manifest entry is on disk at its recorded SHA-256"
pass "AC-1.1/AC-1.2: $manifest_n/$pointers originals present and hash-verified"

# The four archive portraits carry a host-independent second source.
alts="$(jq '[.[] | select(.alt_source != null)] | length' src/assets/asset-recovery-manifest.json)"
assert_ge "$alts" 4 "the four archive portraits carry an alt_source"

# ── 3. The pinned baseline exists and the tree has not regressed past it ────
require_file .baseline/eslint.json "the eslint baseline"
require_file .baseline/failing-tests.json "the failing-test baseline"
require_file BRANCH-STATUS.md "the inherited-red intent is recorded, not implied"

# Recorded by assertion identity, not just by name — the whole point of S0.4.
identified="$(jq '[.failing[] | select((.assertions | length) > 0)] | length' .baseline/failing-tests.json)"
pinned="$(jq '.failing | length' .baseline/failing-tests.json)"
assert_eq "$identified" "$pinned" "S0.4: every pinned failure records its asserted literals"

bash scripts/verify/delta.sh

# ── 4. The harness itself ──────────────────────────────────────────────────
bash scripts/verify/audit-or-true.sh
bash scripts/verify/audit-count.sh
bash scripts/verify/audit-scans.sh
bash scripts/verify/audit-coverage.sh
bash scripts/verify/assert-spec-fresh.sh
bash scripts/verify/ac-bijection.sh

require_file docs/type-inventory.md "S0.6: the type inventory — the only source of the type counts"
require_file .approvals/schema.json "the approval schema"

# AC-X.7a: nothing a release gate depends on may be gitignored. Asserted, not
# assumed — this defect appeared three times in this project's planning, each
# time introduced by someone who believed the path was tracked.
for p in .approvals .baseline docs docs/spec; do
  if git check-ignore -q "$p" 2>/dev/null; then
    echo "FAIL[AC-X.7a]: $p is gitignored, and release gates read from it" >&2
    exit 1
  fi
done
pass "AC-X.7a: no gate input is gitignored"

# Every script the plan invokes must exist. Missing files exit 127, which a
# runner that does not check exit codes reads as success.
for s in lib.sh ac-suite.sh ac-bijection.sh ac-inventory.ts audit-scans.sh audit-or-true.sh \
  audit-count.sh audit-coverage.sh delta.sh g1.sh restore-drill.sh social-links.sh \
  prod-images.sh prod-acceptance.sh acceptance-faults.test.ts visual-diff.ts baseline.ts \
  validate-approval.ts install-hooks.sh viewports.ts e2e.sh phase0-exit.sh \
  assert-assets.sh assert-provenance.sh assert-tracked-gates.sh assert-spec-fresh.sh; do
  require_file "scripts/verify/$s" "S0.4c: scripts/verify/$s exists"
done
for s in recover-assets.ts recover-assets.test.ts type-inventory.ts; do
  require_file "scripts/$s" "S0.4c: scripts/$s exists"
done
require_file playwright.config.ts "S0.4c: playwright.config.ts exists"
require_file src/lib/surfaces.ts "S0.4c: src/lib/surfaces.ts exists"
require_file e2e/no-js.spec.ts "S0.4c: the JS-disabled spec AC-6.9b depends on"
require_file docs/spec/SOURCES.json "S0.4c: the tracked-copy manifest"
pass "S0.4c: every artifact the plan invokes exists"

# ── 5. The fault-injection suites actually run and pass ────────────────────
bun test scripts/

# ── 6. The restore drill, when the release asset is available ──────────────
if [ "$WITH_DRILL" -eq 1 ]; then
  bash scripts/verify/restore-drill.sh
else
  echo "SKIP[restore drill]: re-run with --with-drill once the release asset is uploaded" >&2
fi

echo ""
pass "PHASE 0 EXIT: branch provenance, $manifest_n assets, pinned baseline, and the harness all verified"
