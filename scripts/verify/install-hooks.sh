#!/usr/bin/env bash
# scripts/verify/install-hooks.sh — installs the pre-push delta gate.
#
# `AGENTS.md:8-9` asks that the connected branch stay "in a working state", and
# this branch deliberately carries an inherited-red baseline. The synthesis
# (BRANCH-STATUS.md) is that "working state" means NO NEW BREAKAGE — and this
# hook is what turns that from a promise into a mechanism.
#
# Hooks are per-clone and are not carried by git, so this has to be run once in
# each working copy. It is intentionally not run automatically: silently
# installing something that blocks pushes is not a thing to do to someone's
# clone without asking.
#
# Usage:
#   bash scripts/verify/install-hooks.sh            # install
#   bash scripts/verify/install-hooks.sh --check    # verify installed, exit 1 if not

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

HOOK_DIR="$(git rev-parse --git-path hooks)"
HOOK="$HOOK_DIR/pre-push"
MARKER="thebehumancompany delta gate"

if [ "${1:-}" = "--check" ]; then
  require_file "$HOOK" "the pre-push hook is installed"
  body="$(cat "$HOOK")"
  assert_contains "$body" "$MARKER" "the pre-push hook is ours"
  [ -x "$HOOK" ] || {
    echo "FAIL[hook]: $HOOK exists but is not executable" >&2
    exit 1
  }
  pass "pre-push delta gate installed at $HOOK"
  exit 0
fi

mkdir -p "$HOOK_DIR"

if [ -e "$HOOK" ] && ! grep -q "$MARKER" "$HOOK"; then
  # Never clobber someone else's hook. A pre-push hook can be doing anything,
  # and overwriting one silently is how a team loses a check it relied on.
  echo "FAIL[hook]: $HOOK already exists and is not ours." >&2
  echo "  Add this line to it by hand instead:" >&2
  echo "    bash scripts/verify/delta.sh   # $MARKER" >&2
  exit 1
fi

cat >"$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
# thebehumancompany delta gate — installed by scripts/verify/install-hooks.sh
#
# Refuses a push that regresses past the pinned baseline in .baseline/.
# See BRANCH-STATUS.md for why the baseline is red on purpose.
#
# Escape hatch, for when the baseline itself legitimately moved:
#   SKIP_DELTA_GATE=1 git push        (say why in the commit message)
set -Eeuo pipefail

if [ "${SKIP_DELTA_GATE:-0}" = "1" ]; then
  echo "pre-push: delta gate skipped by SKIP_DELTA_GATE=1" >&2
  exit 0
fi

root="$(git rev-parse --show-toplevel)"
if [ ! -f "$root/scripts/verify/delta.sh" ]; then
  echo "pre-push: scripts/verify/delta.sh not found; nothing to check" >&2
  exit 0
fi

echo "pre-push: checking for new breakage against .baseline/ …" >&2
bash "$root/scripts/verify/delta.sh"
HOOKEOF

chmod +x "$HOOK"
pass "installed the pre-push delta gate at $HOOK"
echo "  Bypass for a reviewed baseline move: SKIP_DELTA_GATE=1 git push"
