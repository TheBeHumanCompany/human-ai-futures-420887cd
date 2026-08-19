#!/usr/bin/env bash
# scripts/verify/assert-build-assets.sh — AC-1.6, at build time.
#
# AC-1.6 is finally settled against production ("no image request returns
# 404"), and `prod-images.sh` does that. But production is the last place you
# want to discover it, and the build output already carries the whole answer:
# either Vite fingerprinted and emitted a file for each imported image, or it
# did not.
#
# What this asserts, and why each half is needed:
#
#   every previously-Lovable-only asset has an emitted file
#       — the positive half. If an import is dropped, Vite stops emitting it
#         and the page renders a broken image with no error anywhere.
#   no `__l5e` string survives anywhere in the output
#       — the negative half. That path is served only by Lovable's own hosting,
#         so one baked into the bundle is a guaranteed production 404. This is
#         the literal bug the user reported first.
#
# Neither half implies the other: a build can emit all 46 files and still carry
# a stale `__l5e` string in a component that was never migrated.
#
# Usage:
#   bun run build && bash scripts/verify/assert-build-assets.sh

. "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

require_cmd jq "assert-build-assets"

OUT="${BUILD_OUTPUT_DIR:-.output}"
if [ ! -d "$OUT" ]; then
  echo "FAIL[AC-1.6]: no build output at $OUT/. Run \`bun run build\` first." >&2
  echo "  This gate reads the emitted files; with no build it would assert nothing" >&2
  echo "  and report success, which is the failure mode it exists to prevent." >&2
  exit 1
fi

require_file docs/asset-pointers.json "the archived pointer set"

emitted_dir="$OUT/public/assets"
[ -d "$emitted_dir" ] || {
  echo "FAIL[AC-1.6]: $emitted_dir does not exist — the build emitted no assets at all" >&2
  exit 1
}

emitted_n="$(find "$emitted_dir" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.avif' \) | grep -c . || true)"
assert_ge "${emitted_n:-0}" 40 "AC-1.6: the build emitted a realistic number of images"

# ── every recovered asset has an emitted, fingerprinted file ───────────────
#
# Vite emits `<stem>-<hash>.<ext>`. The count is derived from the archive, so
# no literal appears here that a scan could have produced.
missing=""
checked=0
while IFS= read -r target; do
  [ -n "$target" ] || continue
  stem="${target%.*}"
  found="$(find "$emitted_dir" -type f -name "${stem}-*" | head -1)"
  checked=$((checked + 1))
  [ -n "$found" ] || missing="$missing $target"
done <<EOF
$(jq -r '.pointers[] | ._target_filename // .original_filename' docs/asset-pointers.json)
EOF

assert_ge "$checked" 40 "AC-1.6: the archive yielded assets to check"

if [ -n "$missing" ]; then
  echo "FAIL[AC-1.6]: these assets were not emitted by the build:$missing" >&2
  echo "  Nothing imports them, so Vite never processed them, so they 404 in production." >&2
  exit 1
fi
pass "AC-1.6: all $checked recovered assets emitted as fingerprinted files ($emitted_n images total)"

# ── no Lovable pointer path survives ───────────────────────────────────────
#
# `grep -rl` over local build output, not a network call, so `|| true` is safe
# here — and the floor above already proved the output is real.
lovable="$(grep -rl '__l5e' "$OUT" 2>/dev/null | grep -c . || true)"
if [ "${lovable:-0}" -ne 0 ]; then
  echo "FAIL[AC-1.6]: /__l5e/ asset paths survive in the build output:" >&2
  grep -rl '__l5e' "$OUT" 2>/dev/null | sed 's/^/  /' >&2
  echo "  Only Lovable's own hosting serves that path. Every one of these 404s in production." >&2
  exit 1
fi
pass "AC-1.6: no /__l5e/ path survives anywhere in $OUT"
