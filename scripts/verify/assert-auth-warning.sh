#!/usr/bin/env bash
# scripts/verify/assert-auth-warning.sh — the auth diagnostic is server-only.
#
# `src/start.ts` sits in BOTH module graphs. In the browser build Vite replaces
# `process.env` with `{}`, so `authMiddlewareEnabled()` there is structurally
# false whatever the server is configured with. An unguarded module-level
# warning therefore fired on every page load of every deployment, and on
# 2026-09-16 it was read off a production console as "the portal is serving
# without sessions" — while that same deployment was answering
# `x-clerk-auth-status: signed-out`, a header only clerkMiddleware emits.
#
# A constant diagnostic about the wrong process is worse than no diagnostic:
# it costs an investigation every time someone opens devtools, and it trains
# people to ignore the one console line that would matter if it were true.
#
# Two content assertions, and BOTH are needed:
#
#   absent from everything served to a browser
#       — the fix. `import.meta.env.SSR` is a build-time literal, so the client
#         build removes the block and its message rather than skipping it.
#   present in the server output
#       — the anti-cheat. Deleting the warning outright also empties the
#         client output, and that "fix" silently costs the real diagnosis on
#         the one machine that can produce it. Without this half the gate
#         green-lights the regression it exists to prevent.
#
# The two halves partition $OUT: everything under public/ is browser-served,
# everything else is server. Scoping the client half to `public/assets` alone
# was wrong in the dangerous direction — a chunk emitted elsewhere under
# public/ would escape the client scan AND be counted as proof the server
# diagnostic survived, passing the gate twice over on the one shape it exists
# to catch.
#
# Usage:
#   bun run build && bash scripts/verify/assert-auth-warning.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

OUT="${BUILD_OUTPUT_DIR:-.output}"
if [ ! -d "$OUT" ]; then
  echo "FAIL[auth-warning]: no build output at $OUT/. Run \`bun run build\` first." >&2
  echo "  This gate reads the emitted bundles; with no build it would assert nothing" >&2
  echo "  and report success, which is the failure mode it exists to prevent." >&2
  exit 1
fi

CLIENT_DIR="$OUT/public"
STAMP="$OUT/nitro.json"

# ── freshness, before any content is read ──────────────────────────────────
#
# This is the assertion the whole detour was missing, and it is the one that
# matters most. A build output that is merely PRESENT looks exactly like
# evidence; a STALE one is evidence for a source tree that no longer exists.
#
# Reproduced here, both directions in one afternoon: the build does not empty
# `public/assets`, so a chunk from an earlier build stays on disk beside the
# current one. Reading it produced a confident wrong diagnosis — that
# `import.meta.env.SSR` "does not work in this build" — and a fix, a comment
# and a rewritten gate were all built on top of it. A clean `rm -rf .output`
# rebuild refuted the whole chain in forty seconds.
#
# So: nothing in the output may predate the build, and no source may postdate
# it. Absence is loud, staleness is silent, and silence is what needs a gate.
require_file "$STAMP" "auth-warning: the build stamp"

# `stat` has no portable mtime flag: GNU wants `-c %Y`, BSD wants `-f %m`.
# Probe with `-c` because its answer is unambiguous on both — GNU coreutils 9.7
# accepts it (exit 0, an epoch), BSD rejects it outright ("illegal option -- c",
# exit 1). Both measured, on debian:stable-slim and on macOS. This repo is
# developed on macOS and its CI runs Linux, so a gate that reads mtimes the
# non-portable way is a gate that only ever runs in one of the two places it is
# needed.
if stat -c %Y "$STAMP" >/dev/null 2>&1; then
  mtimes() { xargs -0 stat -c %Y; }
else
  mtimes() { xargs -0 stat -f %m; }
fi

stamp_mtime="$(printf '%s\0' "$STAMP" | mtimes)"

# How long a full build may take. Files older than the stamp by more than this
# were not emitted by it. Generous by an order of magnitude — the leftovers
# this catches are minutes to days old, and a real build here is under a
# minute — because the cost of a false FAIL is a rebuild and the cost of a
# false PASS is the bug above.
BUILD_WINDOW="${BUILD_WINDOW:-600}"

# `awk` for the minimum rather than `sort -n | head -1`: under `set -o
# pipefail`, head exiting after one line SIGPIPEs sort and fails the script on
# a large output tree.
oldest="$(find "$OUT" -type f -print0 | mtimes | awk 'NR==1||$1<m{m=$1}END{print m+0}')"
assert_ge "${oldest:-0}" 1 "auth-warning: the output has files with readable mtimes"

age="$((stamp_mtime - oldest))"
if [ "$age" -gt "$BUILD_WINDOW" ]; then
  echo "FAIL[auth-warning]: $OUT holds files ${age}s older than its own build stamp" >&2
  echo "  The build does not empty the output directory, so these are leftovers" >&2
  echo "  from an earlier build. Scanning them proves nothing about the current" >&2
  echo "  source — and a leftover carrying the old, unguarded warning would fail" >&2
  echo "  this gate for a defect that is already fixed, or hide one that is not." >&2
  echo "  Run: rm -rf $OUT && bun run build" >&2
  exit 1
fi

newer="$(find src -type f \( -name '*.ts' -o -name '*.tsx' \) -newer "$STAMP" | LC_ALL=C sort)"
newer_n="$(printf '%s\n' "$newer" | grep -c . || true)"
if [ "${newer_n:-0}" -ne 0 ]; then
  echo "FAIL[auth-warning]: $newer_n source file(s) are newer than $STAMP:" >&2
  printf '%s\n' "$newer" | sed 's/^/  /' >&2
  echo "  The output does not contain these changes. Rebuild before asserting." >&2
  exit 1
fi
pass "auth-warning: $OUT was built from the current source (stamp within ${age}s of its oldest file)"

WARNING='CLERK_SECRET_KEY is not set'

# RULE 4 conformance. Bundles carry NUL bytes; `LC_ALL=C grep -a` is what keeps
# a content scan reading bytes rather than deferring to a binary heuristic.
# Fixed-string `-F` because the message is a literal, not a pattern.
warning_files() { # warning_files <dir> -> paths containing the message
  LC_ALL=C grep -ralF -- "$WARNING" "$1" 2>/dev/null || true
}

# ── the client half: everything a browser can fetch ────────────────────────
[ -d "$CLIENT_DIR" ] || {
  echo "FAIL[auth-warning]: $CLIENT_DIR does not exist — the build emitted no client output" >&2
  exit 1
}

client_js="$(find "$CLIENT_DIR" -type f -name '*.js' | grep -c . || true)"
assert_ge "${client_js:-0}" 1 "auth-warning: the build emitted client JavaScript to scan"

client_hits="$(warning_files "$CLIENT_DIR" | grep -c . || true)"
if [ "${client_hits:-0}" -ne 0 ]; then
  echo "FAIL[auth-warning]: the missing-key warning survives in browser-served output:" >&2
  warning_files "$CLIENT_DIR" | sed 's/^/  /' >&2
  echo "  In the browser process.env is {}, so it fires on every load of every" >&2
  echo "  deployment and says nothing about the server. Guard the call site with" >&2
  echo "  \`import.meta.env.SSR\` so the client build removes the block." >&2
  exit 1
fi
pass "auth-warning: absent from all of $CLIENT_DIR ($client_js client script(s) scanned)"

# ── the server half: $OUT minus the client tree ────────────────────────────
server_hits="$(warning_files "$OUT" | grep -v "^$CLIENT_DIR/" | grep -c . || true)"
if [ "${server_hits:-0}" -eq 0 ]; then
  echo "FAIL[auth-warning]: the missing-key warning is nowhere in the server output" >&2
  echo "  Silencing the browser must not silence the server: the server is the only" >&2
  echo "  process whose answer to 'is CLERK_SECRET_KEY set?' is worth logging." >&2
  exit 1
fi
pass "auth-warning: still emitted from $server_hits server bundle(s) — the real diagnostic survives"
