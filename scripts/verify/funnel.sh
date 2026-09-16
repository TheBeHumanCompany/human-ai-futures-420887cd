#!/usr/bin/env bash
set -Eeuo pipefail

VERIFY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$VERIFY_DIR/../.." && pwd)"
cd "$REPO_ROOT"

PORT="${PORT:-3000}"
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
  if [ -n "$LISTENER_LOG" ]; then
    rm -f -- "$LISTENER_LOG"
  fi
  if [ -n "$LISTENER_PID" ]; then
    printf 'funnel: stripe listener teardown complete\n'
  fi
}
trap cleanup EXIT INT TERM

printf 'funnel: preflight (PORT=%s, forward-to=%s)\n' "$PORT" "$FORWARD_TO"
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
LISTENER_LOG="$(mktemp "${TMPDIR:-/tmp}/funnel-stripe.XXXXXX")"
stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to "$FORWARD_TO" >"$LISTENER_LOG" 2>&1 &
LISTENER_PID=$!

secret=""
ready=0
for _ in $(seq 1 40); do
  if [ -z "$secret" ]; then
    secret="$(LC_ALL=C grep -Eo 'whsec_[A-Za-z0-9_-]+' "$LISTENER_LOG" | LC_ALL=C awk 'NR == 1 { print; exit }' || true)"
  fi
  if LC_ALL=C grep -qi 'listening' "$LISTENER_LOG"; then
    ready=1
  fi
  [ "$ready" -eq 1 ] && [ -n "$secret" ] && break
  kill -0 "$LISTENER_PID" 2>/dev/null || break
  sleep 0.25
done

[ "$ready" -eq 1 ] || fail 'stripe listener did not report listening within 10s'
[ -n "$secret" ] || fail 'stripe listener did not provide a webhook signing secret'
case "$secret" in
  whsec_*) : ;;
  *) fail 'stripe listener returned an invalid webhook signing secret' ;;
esac
export STRIPE_WEBHOOK_SECRET="$secret"
printf 'PASS[funnel listener]: TEST-mode listener ready, secret=%s\n' "$(mask "$secret")"
bunx playwright test --project=funnel
