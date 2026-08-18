#!/usr/bin/env bash
# scripts/verify/e2e.sh — the browser suite, with an honest preflight.
#
# `"e2e": "playwright test"` fails in three different ways that all look alike
# from a CI log, and one of them is a false green:
#
#   · playwright not installed        -> "command not found", exit 127
#   · browsers not downloaded         -> a launch error deep in the run
#   · testDir empty or missing        -> **exit 0, "no tests found"**
#
# The third is the dangerous one. A Phase 8 gate that runs `bun run e2e` and
# checks the exit code would read "no tests found" as a passing browser suite,
# which is the same false-green shape as the two fault-injection suites that
# sat under `scripts/` and were never executed at all.
#
# So each condition is checked, named, and exits non-zero — and the discovered
# spec count is asserted against a floor before the run is trusted.
#
# Usage: bun run e2e            (package.json)
#        bash scripts/verify/e2e.sh [-- playwright args]

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_file playwright.config.ts "the Playwright config"

# ── the spec set is non-empty ──────────────────────────────────────────────
specs="$(find e2e -type f -name '*.spec.ts' 2>/dev/null | LC_ALL=C sort || true)"
spec_n="$(printf '%s\n' "$specs" | grep -c . || true)"
if [ "${spec_n:-0}" -eq 0 ]; then
  echo "FAIL[e2e]: no *.spec.ts under e2e/." >&2
  echo "  Playwright exits 0 when it finds no tests, so this would otherwise report a" >&2
  echo "  passing browser suite having run nothing at all." >&2
  exit 1
fi
assert_ge "$spec_n" 2 "e2e: the browser suite has specs to run"

# The no-JS project is what proves AC-6.9b, and it is matched by filename
# (`testMatch: /.*no-js\.spec\.ts/`). If that file is renamed, the project
# silently matches nothing and Playwright still exits 0.
require_file e2e/no-js.spec.ts "e2e: the JS-disabled spec AC-6.9b depends on"

# ── the runner is present ──────────────────────────────────────────────────
if ! [ -d node_modules/@playwright/test ]; then
  echo "FAIL[e2e]: @playwright/test is not installed." >&2
  echo "" >&2
  echo "  bun add -d @playwright/test playwright" >&2
  echo "  bunx playwright install chromium" >&2
  echo "" >&2
  echo "  Both are needed: the first is the runner, the second downloads the browser." >&2
  echo "  Installing the package without the browser fails at launch, not at startup." >&2
  exit 1
fi

# ── the browser binary is present ──────────────────────────────────────────
if ! bunx playwright --version >/dev/null 2>&1; then
  echo "FAIL[e2e]: the playwright CLI is installed but not runnable." >&2
  exit 1
fi

echo "e2e: $spec_n spec file(s), running against ${E2E_BASE_URL:-http://localhost:3000}"
exec bunx playwright test "$@"
