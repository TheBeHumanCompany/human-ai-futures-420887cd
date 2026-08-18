#!/usr/bin/env bash
# scripts/verify/assert-provenance.sh — AC-X.1.
#
# "Branch is cut from `main@a6a377a`; `git log` shows no commit originating
# from `feat/podbean-rss-integration`."
#
# That branch is REFERENCE-ONLY. Reading blobs out of it is explicitly
# permitted and is done — the four archive portraits carry a second source
# recovered with `git show <ref>:<path>`. Reading a blob touches no ref,
# creates no commit, and leaves `git cherry` output unchanged. Merging,
# rebasing or cherry-picking it is what this gate forbids.
#
# Usage: bash scripts/verify/assert-provenance.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

BASE_COMMIT="${BASE_COMMIT:-a6a377a}"
REF_BRANCH="${REF_BRANCH:-origin/feat/podbean-rss-integration}"

git merge-base --is-ancestor "$BASE_COMMIT" HEAD || {
  echo "FAIL[AC-X.1]: $BASE_COMMIT is not an ancestor of HEAD." >&2
  echo "  The branch was not cut from main@$BASE_COMMIT, or history has been rewritten." >&2
  exit 1
}

git rev-parse --verify --quiet "$REF_BRANCH" >/dev/null || {
  echo "FAIL[AC-X.1]: $REF_BRANCH is not available. Run 'git fetch origin' — this gate cannot" >&2
  echo "  prove the absence of cherry-picks from a branch it cannot see, and reporting success" >&2
  echo "  on a missing ref is exactly the vacuous green the floor below exists to prevent." >&2
  exit 1
}

# `git cherry -v <upstream> <head>` prefixes each commit with `-` when its
# change is already upstream (i.e. it came from there) and `+` when it is not.
picks="$(git cherry -v "$REF_BRANCH" HEAD | grep -c '^-' || true)"
total="$(git cherry -v "$REF_BRANCH" HEAD | grep -c '^[+-]' || true)"

# The floor, FIRST. `grep -c '^-'` returns 0 both when nothing was
# cherry-picked and when `git cherry` emitted nothing at all — a mistyped ref,
# an empty range. Without this line the strongest assertion here is also the
# easiest to fake.
assert_ge "${total:-0}" 1 "AC-X.1: git cherry produced output (0 picks is otherwise vacuous)"
assert_eq "${picks:-0}" "0" "AC-X.1: no commit originates from $REF_BRANCH"

# History-preservation: the base commit must still be reachable and unmodified.
# `AGENTS.md:1-10` forbids rewriting published history because it destroys the
# user's Lovable project history, and a rewrite is not otherwise detectable
# from inside the branch.
actual_base="$(git rev-parse "$BASE_COMMIT")"
assert_ge "${#actual_base}" 40 "AC-X.1: the base commit resolves"

pass "AC-X.1: HEAD descends from $BASE_COMMIT; 0 of $total commits originate from $REF_BRANCH"
