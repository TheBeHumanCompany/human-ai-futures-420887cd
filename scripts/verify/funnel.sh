#!/usr/bin/env bash
set -Eeuo pipefail

VERIFY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$VERIFY_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# The webhook forward target must be the port the browser suite's dev server
# actually binds, which playwright.config.ts takes from e2e-config.json
# (--strictPort). A literal here drifted from that file: the default said 3000
# while the suite served 5180, so `stripe listen` forwarded every event into a
# dead port — S3 then failed as "unlock never flipped", which reads like a
# broken webhook rather than a wrong port, and the suite only passed for
# whoever exported PORT by hand. One definition, read from the same file.
PORT="${PORT:-$(bun -e 'const c = await Bun.file("scripts/verify/e2e-config.json").json(); process.stdout.write(new URL(c.defaultBaseUrl).port || "5180")')}"
FORWARD_TO="localhost:${PORT}/api/stripe-webhook"
LISTENER_PID=""
LISTENER_LOG=""
EMAIL_CATCHER_CREATED=""

mask() {
  case "${1:-}" in
    sk_test_*) printf 'sk_test_***' ;;
    whsec_*) printf 'whsec_***' ;;
    pk_test_*) printf 'pk_test_***' ;;
    sb_secret_*) printf 'sb_secret_***' ;;
    sb_publishable_*) printf 'sb_publishable_***' ;;
    eyJ*) printf 'eyJ***' ;;
    sk_*) printf 'sk_***' ;;
    *) printf '%s' "${1:-<unset>}" ;;
  esac
}

fail() {
  printf 'FAIL[funnel]: %s\n' "$1" >&2
  exit 1
}

require_var() {
  local name="$1"
  [ -n "${!name:-}" ] || fail "$name is required"
  printf 'PASS[funnel env]: %s=%s\n' "$name" "$(mask "${!name}")"
}

assert_live_gate() {
  case "${FUNNEL_LIVE:-}" in
    "") ;;
    1) printf 'PASS[funnel gate]: FUNNEL_LIVE=1 permits the live validation and email delivery tier\n' ;;
    *) fail 'FUNNEL_LIVE must be exactly 1 when set' ;;
  esac

  if [ "${GTM_RUN_LIVE:-}" = 1 ] && [ "${FUNNEL_LIVE:-}" != 1 ]; then
    fail 'GTM_RUN_LIVE=1 requires FUNNEL_LIVE=1'
  fi
}

run_live_checks() {
  # Same resolution S1 uses (e2e/funnel/s1-validate-publish.spec.ts:30): the
  # sibling checkout. The previous default named a throwaway worktree that no
  # longer exists, so FUNNEL_LIVE=1 failed in preflight on the path rather
  # than on anything about the live tier.
  local podcasts_dir="${FUNNEL_PODCASTS_DIR:-$REPO_ROOT/../podcasts}"

  command -v uv >/dev/null 2>&1 || fail "required command 'uv' is not on PATH for the live tier"
  [ -d "$podcasts_dir" ] || fail "FUNNEL_PODCASTS_DIR does not exist: $podcasts_dir"
  [ -n "${RESEND_API_KEY:-}" ] || fail 'RESEND_API_KEY is required for FUNNEL_LIVE=1'

  printf 'funnel: running live gtm validate against the LangGraph server\n'
  (
    cd "$podcasts_dir"
    GTM_RUN_LIVE=1 uv run --frozen python scripts/funnel_stage1.py
  )

  printf 'funnel: sending one live Resend magic-link email to FUNNEL_TEST_EMAIL\n'
  env -u FUNNEL_EMAIL_CATCHER_DIR bun -e '
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const { pathToFileURL } = await import("node:url");

    const storePath = process.env.FUNNEL_STORE_PATH;
    if (!storePath) throw new Error("FUNNEL_STORE_PATH is required");
    const clients = JSON.parse(await readFile(storePath, "utf8"));
    const client = clients.find((entry) => entry?.id === "funnel-fixture");
    if (!client?.token || !client?.name) throw new Error("funnel fixture client is invalid");

    const moduleUrl = pathToFileURL(
      resolve("src/lib/client-portal/magic-link-email.ts"),
    ).href;
    const { CLIENT_PORTAL_ORIGIN, deliverMagicLinkEmail } = await import(moduleUrl);
    const result = await deliverMagicLinkEmail({
      clientName: client.name,
      to: process.env.FUNNEL_TEST_EMAIL ?? "",
      clientUrl: `${CLIENT_PORTAL_ORIGIN}/c/${client.token}`,
    });
    if (!result.ok) throw new Error(result.message ?? "live Resend delivery failed");
  '
  printf 'PASS[funnel live]: Resend accepted one magic-link email\n'
}

cleanup() {
  if [ -n "$LISTENER_PID" ] && kill -0 "$LISTENER_PID" 2>/dev/null; then
    kill "$LISTENER_PID" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      kill -0 "$LISTENER_PID" 2>/dev/null || break
      sleep 0.2
    done
    kill -9 "$LISTENER_PID" 2>/dev/null || true
    wait "$LISTENER_PID" 2>/dev/null || true
  fi
  if [ -n "$EMAIL_CATCHER_CREATED" ]; then
    rm -rf -- "$EMAIL_CATCHER_CREATED"
  fi
  if [ -n "$LISTENER_PID" ]; then
    printf 'funnel: stripe listener teardown complete\n'
  fi
  if [ -n "$LISTENER_LOG" ] && [ -f "$LISTENER_LOG" ]; then
    # The delivery lines are S3/F3 evidence: Playwright wipes test-results at
    # startup, so the live log lives outside it and is copied in at teardown.
    mkdir -p -- "$REPO_ROOT/test-results/funnel"
    cp -f -- "$LISTENER_LOG" "$REPO_ROOT/test-results/funnel/stripe-listener.log" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

printf 'funnel: preflight (PORT=%s, forward-to=%s)\n' "$PORT" "$FORWARD_TO"
assert_live_gate
require_var FUNNEL_STORE_PATH
require_var FUNNEL_RUN_ID
require_var FUNNEL_TEST_EMAIL
require_var SUPABASE_URL
require_var SUPABASE_SERVICE_ROLE_KEY
require_var SUPABASE_ANON_KEY
require_var VITE_CLERK_PUBLISHABLE_KEY
require_var CLERK_SECRET_KEY
require_var STRIPE_AUDIT_PRICE_ID
require_var STRIPE_SECRET_KEY

case "$STRIPE_SECRET_KEY" in
  sk_test_*) printf 'PASS[funnel env]: STRIPE_SECRET_KEY is TEST mode (%s)\n' "$(mask "$STRIPE_SECRET_KEY")" ;;
  sk_live_*) fail 'STRIPE_SECRET_KEY must not be a live-mode key (sk_live_*)' ;;
  *) fail 'STRIPE_SECRET_KEY must start with sk_test_' ;;
esac

if [ -n "${FUNNEL_EMAIL_CATCHER_DIR:-}" ]; then
  mkdir -p -- "$FUNNEL_EMAIL_CATCHER_DIR"
else
  FUNNEL_EMAIL_CATCHER_DIR="$(mktemp -d "${TMPDIR:-/tmp}/funnel-email.XXXXXX")"
  EMAIL_CATCHER_CREATED="$FUNNEL_EMAIL_CATCHER_DIR"
fi
export FUNNEL_EMAIL_CATCHER_DIR
printf 'PASS[funnel env]: FUNNEL_EMAIL_CATCHER_DIR set (path masked)\n'

if [ "${FUNNEL_PREFLIGHT_DRY:-}" = 1 ]; then
  printf '%s\n' \
    'DRY[funnel]: would start one TEST-mode stripe listener' \
    "DRY[funnel]: stripe listen --forward-to $FORWARD_TO" \
    'DRY[funnel]: export its whsec_*** as STRIPE_WEBHOOK_SECRET' \
    'DRY[funnel]: wait up to 10s for the listener listening line' \
    'DRY[funnel]: run bunx playwright test --project=funnel'
  exit 0
fi

command -v stripe >/dev/null 2>&1 || fail "required command 'stripe' is not on PATH"
# Live log OUTSIDE test-results: Playwright deletes that tree at startup while
# the listener is still running; teardown copies the finished log back in as
# evidence. S3 polls the live path exported below.
LISTENER_LOG="${TMPDIR:-/tmp}/funnel-stripe-listener.log"
: > "$LISTENER_LOG"
export FUNNEL_STRIPE_LISTENER_LOG="$LISTENER_LOG"
stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to "$FORWARD_TO" >"$LISTENER_LOG" 2>&1 &
LISTENER_PID=$!

secret=""
ready=0
# 15s window: the real CLI's cold start includes a version check before its
# readiness line ("Ready! ..." on stripe-cli 1.50.11; the stand-in todo 4
# exercised printed "listening", which the real binary never says).
for _ in $(seq 1 60); do
  if [ -z "$secret" ]; then
    secret="$(LC_ALL=C grep -Eo 'whsec_[A-Za-z0-9_-]+' "$LISTENER_LOG" | LC_ALL=C awk 'NR == 1 { print; exit }' || true)"
  fi
  if LC_ALL=C grep -qiE 'ready!|listening' "$LISTENER_LOG"; then
    ready=1
  fi
  [ "$ready" -eq 1 ] && [ -n "$secret" ] && break
  kill -0 "$LISTENER_PID" 2>/dev/null || break
  sleep 0.25
done

[ "$ready" -eq 1 ] || fail 'stripe listener did not report readiness within 15s'
[ -n "$secret" ] || fail 'stripe listener did not provide a webhook signing secret'
case "$secret" in
  whsec_*) : ;;
  *) fail 'stripe listener returned an invalid webhook signing secret' ;;
esac
export STRIPE_WEBHOOK_SECRET="$secret"
printf 'PASS[funnel listener]: TEST-mode listener ready, secret=%s\n' "$(mask "$secret")"
# The audit return_url must land on the dev server this suite drives, not
# the production origin the billing module defaults to.
export AUDIT_ORIGIN="${AUDIT_ORIGIN:-http://localhost:${PORT}}"
# Seed EXACTLY once per run, here: each spec file gets a fresh worker process,
# so a spec-side seed would reset the tier mid-run (wiping S3's webhook
# unlock between stages). The specs only VERIFY the tier is present.
bun scripts/verify/funnel-reset.ts
bun scripts/verify/funnel-seed.ts
# Registers the funnel project in EVERY process that imports the config —
# workers re-import it with their own argv, so the flag alone cannot carry
# the registration (see playwright.config.ts).
export FUNNEL_PW_PROJECT=1
bunx playwright test --project=funnel

if [ "${FUNNEL_LIVE:-}" = 1 ]; then
  run_live_checks
fi
