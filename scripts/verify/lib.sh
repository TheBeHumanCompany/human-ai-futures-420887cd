#!/usr/bin/env bash
# scripts/verify/lib.sh — the assertion library every gate script sources.
#
# Three rules, each written after a real false-green was reproduced during
# planning. They are not style preferences; each one is a bug that shipped a
# passing gate against a broken world.
#
#   RULE 1  `|| true` may NEVER wrap a network call.
#   RULE 1b ORIGIN FIRST — assert which host answered before reading a body.
#   RULE 2  counts are normalized — BSD `wc -l` pads, GNU does not.
#   RULE 3  every assertion names what it proves and exits non-zero.
#
# Usage:  . "$(dirname "$0")/lib.sh"
#
# shellcheck shell=bash

set -Eeuo pipefail

# Where the repo root is, regardless of the caller's cwd. Every path in every
# gate script is resolved against this, so gates behave identically whether
# they are run from the repo root, from scripts/verify/, or from CI.
VERIFY_LIB_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$VERIFY_LIB_DIR/../.." && pwd)"
export REPO_ROOT

# ---------------------------------------------------------------------------
# RULE 3 — assertions. Each takes a `what` label naming what it proves, prints
# a machine-greppable FAIL[...] line on stderr, and exits non-zero.
#
# These call `exit`, not `return`. That is deliberate: a gate that keeps going
# after a failed assertion is a gate that reports the LAST failure instead of
# the FIRST, and the first is the one with the diagnosis in it. The cost is
# that an assertion inside a `$(...)` substitution only kills the subshell, so
# never call these from inside a command substitution — assign first, assert
# after. Every call site in this tree follows that shape.
# ---------------------------------------------------------------------------

assert_eq() { # assert_eq <got> <want> <what>
  [ "$1" = "$2" ] || {
    echo "FAIL[$3]: got '$1' want '$2'" >&2
    exit 1
  }
}

assert_ne() { # assert_ne <got> <not-want> <what>
  [ "$1" != "$2" ] || {
    echo "FAIL[$3]: got '$1', which is exactly what it must not be" >&2
    exit 1
  }
}

assert_ge() { # assert_ge <got> <floor> <what>
  [ "$1" -ge "$2" ] || {
    echo "FAIL[$3]: got '$1' want >= '$2'" >&2
    exit 1
  }
}

assert_le() { # assert_le <got> <ceiling> <what>
  [ "$1" -le "$2" ] || {
    echo "FAIL[$3]: got '$1' want <= '$2'" >&2
    exit 1
  }
}

assert_contains() { # assert_contains <haystack> <needle> <what>
  case "$1" in
    *"$2"*) : ;;
    *)
      echo "FAIL[$3]: substring '$2' not present (haystack ${#1} bytes)" >&2
      exit 1
      ;;
  esac
}

assert_not_contains() { # assert_not_contains <haystack> <needle> <what>
  case "$1" in
    *"$2"*)
      echo "FAIL[$3]: substring '$2' IS present and must not be" >&2
      exit 1
      ;;
    *) : ;;
  esac
}

require_file() { # require_file <path> <what>
  [ -f "$1" ] || {
    echo "FAIL[$2]: required file '$1' does not exist" >&2
    exit 1
  }
}

require_cmd() { # require_cmd <binary> <what>
  command -v "$1" >/dev/null 2>&1 || {
    echo "FAIL[$2]: required command '$1' is not on PATH" >&2
    exit 1
  }
}

pass() { # pass <what>  — positive evidence, so a green run is readable
  echo "PASS[$1]"
}

# ---------------------------------------------------------------------------
# RULE 2 — normalized counting.
#
# `wc -l` pads its output on BSD/macOS and does not on GNU. An unquoted
# `$(... | wc -l)` passes by word-splitting accident; the same expression
# quoted fails with `got '       0' want '0'`. Both spellings are wrong. Pipe
# through `count` (or, better, use `grep -c`, which never pads).
# ---------------------------------------------------------------------------

count() { tr -d '[:space:]'; }

# count_lines <<< "$text" — the safe replacement for `| wc -l`. Returns 0 for
# empty input, which `wc -l` also does but `grep -c ''` does not.
count_lines() {
  local n
  n="$(wc -l | count)"
  printf '%s' "${n:-0}"
}

# count_matches <pattern> — grep -c that returns 0 instead of exiting 1 on no
# match. Safe ONLY on local text; never feed it a live curl (see RULE 1).
count_matches() {
  local n
  n="$(grep -c -- "$1" || true)"
  printf '%s' "${n:-0}"
}

# ---------------------------------------------------------------------------
# RULE 1 / 1b — network.
#
# `curl -fsSL … | grep -c X || true` returns the string "0" when the site is
# DOWN, so `assert_eq "$(…)" 0 "no bad thing"` greens against a dead origin.
# Reproduced during planning. The fix has two halves and both are mandatory:
#
#   1. the fetch itself must be asserted (curl -f, no `|| true`), and
#   2. the ORIGIN must be asserted before any content is read — a body check
#      alone establishes nothing about WHICH site answered. This gate passed
#      against Wikipedia twice during review (246,246 bytes, no `__l5e`).
#
# Once a body has been captured and proven non-trivial by `fetch_ok`, `|| true`
# on a grep over that captured *local* string is fine — the pipeline is text at
# that point, not a network call. That is the only permitted use.
# ---------------------------------------------------------------------------

CURL_MAX_TIME="${CURL_MAX_TIME:-30}"

host_of() { # host_of <url> -> hostname
  printf '%s' "$1" | sed -E 's#^https?://([^/@]*@)?([^/:]+).*#\2#'
}

fetch() { # fetch <url> -> body on stdout; aborts on any HTTP/transport failure
  curl -fsSL --max-time "$CURL_MAX_TIME" "$1"
}

http_status() { # http_status <url> -> final status code after redirects
  curl -sS -o /dev/null -w '%{http_code}' -L --max-time "$CURL_MAX_TIME" "$1"
}

# RULE 1b. Assert the final effective URL's host BEFORE reading any content.
assert_origin() { # assert_origin <url> <expected-host>
  local eff host
  # -f so a 4xx/5xx is a transport failure here, not a silently empty string.
  eff="$(curl -fsSL -o /dev/null -w '%{url_effective}' --max-time "$CURL_MAX_TIME" "$1")" || {
    echo "FAIL[origin of $1]: request failed before an effective URL could be read" >&2
    exit 1
  }
  host="$(host_of "$eff")"
  assert_eq "$host" "$2" "origin of $1 (effective: $eff)"
}

# The floor below which a "page" is not a page. A redirect stub, an error
# envelope and an empty 200 all sit under it; every real route on this site
# sits far above it.
BODY_FLOOR="${BODY_FLOOR:-10000}"

fetch_ok() { # fetch_ok <url> -> body; origin-asserted, then floor-asserted
  : "${EXPECTED_HOST:?EXPECTED_HOST must be set before fetch_ok — RULE 1b}"
  assert_origin "$1" "$EXPECTED_HOST"
  local body
  body="$(fetch "$1")" || {
    echo "FAIL[fetch $1]: request failed after origin check" >&2
    exit 1
  }
  assert_ge "${#body}" "$BODY_FLOOR" "non-trivial HTML from $1"
  # A 200 that says "not found" is a soft-404, not a page.
  local lower
  lower="$(printf '%s' "$body" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *"<title>404"* | *"page not found"* | *"not_found"*)
      echo "FAIL[soft-404 $1]: 200 status with a not-found body" >&2
      exit 1
      ;;
  esac
  printf '%s' "$body"
}

# head_ok <url> <what> — asserts a URL answers 200 after redirects. Used for
# outbound links (social, booking) where we do not own the origin and so
# cannot assert a host, but CAN assert the link is not dead.
head_ok() {
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' -L -A "$USER_AGENT" \
    --max-time "$CURL_MAX_TIME" "$1")" || {
    echo "FAIL[$2]: request to $1 failed at the transport layer" >&2
    exit 1
  }
  assert_eq "$code" "200" "$2 ($1)"
}

# Some public sites 403 a bare curl. Identify honestly rather than pretending
# to be a browser we are not; this string is a real, contactable UA.
USER_AGENT="${USER_AGENT:-thebehumancompany-release-gate/1.0 (+https://www.thebehumancompany.ca)}"

# ---------------------------------------------------------------------------
# Source-file enumeration.
#
# Forbidden-token scans MUST route through this, not through a bare recursive
# grep over src/. Two reasons, both load-bearing:
#
#   1. Test files legitimately contain the tokens the scans forbid — a test
#      asserting "no route file calls fetch()" contains the string "fetch(".
#      A bare `grep -r … src` matches the test that enforces the rule and the
#      rule can then never pass. `src/lib/layering.test.ts` is exactly this
#      case: it walks all of src/ and filters tests back out per rule.
#   2. Generated files (routeTree.gen.ts) are not authored source.
# ---------------------------------------------------------------------------

GENERATED_FILES_RE='(^|/)routeTree\.gen\.ts$'

src_non_test_files() { # -> newline-separated paths, relative to REPO_ROOT
  (
    cd "$REPO_ROOT" || exit 1
    find src -type f \( -name '*.ts' -o -name '*.tsx' \) \
      ! -name '*.test.ts' ! -name '*.test.tsx' \
      | grep -Ev "$GENERATED_FILES_RE" \
      | LC_ALL=C sort
  )
}

src_test_files() {
  (
    cd "$REPO_ROOT" || exit 1
    find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) | LC_ALL=C sort
  )
}

# scan_src_non_test <extended-regex> <what> — greps the non-test source set and
# prints `path:line:text` for each hit. Enforces a non-vacuity floor first: a
# scan over an empty file list proves nothing, so the file list is asserted
# before the pattern is.
scan_src_non_test() {
  local files n
  files="$(src_non_test_files)"
  n="$(printf '%s\n' "$files" | grep -c . || true)"
  assert_ge "${n:-0}" 30 "non-test source walk found files (scan: $2)"
  printf '%s\n' "$files" | (
    cd "$REPO_ROOT" || exit 1
    xargs grep -nE -- "$1" 2>/dev/null || true
  )
}

# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------

sha256_of() { # sha256_of <file> -> bare hex digest, no filename, no padding
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

json() { # json <jq-filter> <file>  — jq with a hard requirement on jq existing
  require_cmd jq "json()"
  jq -r "$1" "$2"
}
