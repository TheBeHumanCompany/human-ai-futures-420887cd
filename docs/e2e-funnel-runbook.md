# Funnel smoke suite runbook

How to run the five-stage end-to-end funnel suite, what it needs, and what to do
when it fails. Entry points: `bun run test:funnel` (deterministic) and
`bun run test:funnel:live` (gated live tier). The suite is serial (one worker),
runs against the local dev server, Stripe TEST mode, a dev Supabase project, and
a Clerk dev instance. No live money, no real customers.

## What the suite covers

Five stage specs live in `e2e/funnel/`, driven by `scripts/verify/funnel.sh`
against the seeded fixture tier (client `funnel-fixture`, "The Funnel Fixture
Co"):

1. **S1 validate/publish.** The podcasts runner chain produces verdict and
   blueprint artifacts, `portal:publish` pastes the fixture report onto the
   client's page, and the prospect URL serves it. The failure case proves the
   runner refuses missing fixture inputs instead of faking a pass.
2. **S2 email/prospect.** The summary email goes through the real compose and
   capture seam, the magic link is read back from the email-catcher directory,
   and following it locally opens the prospect page: preliminary sections open,
   finals stay locked to title and teaser. The failure case proves an invalid
   token is a 404 denial.
3. **S3 checkout/pay.** A declined card shows the inline error and unlocks
   nothing; card 4242 pays inside the embedded Payment Element, the
   `checkout.session.completed` delivery is confirmed in the listener log, and
   the seeded paid-report row unlocks.
4. **S4 portal account.** A signed-out visit to `/portal` is sent to sign-in,
   and the fixture account signs in to a portal showing the company avatar,
   company name, and the webhook-unlocked paid report.
5. **S5 upload/thank-you.** The intake questions derived from the final sections
   accept a fixture upload, confirm the stored object, and render the thank-you
   with the booking link.

Current green set: S1, S2, and S3 fully green, plus S4's signed-out redirect
case. S4's sign-in test and both S5 tests are gated on the Clerk dev instance's
device-verification setting (see Troubleshooting).

## Prerequisites

- Bun, with `~/.bun/bin` on PATH (the suite's bun scripts and the dev server).
- uv, with `~/.local/bin` on PATH (S1 shells out to it in the podcasts
  worktree).
- Stripe CLI (`brew install stripe/stripe-cli/stripe`). The preflight refuses to
  run without it.
- Playwright browsers, the same cache the existing e2e suites use.

Run everything from the website worktree root.

## Environment variables

Every value comes from your shell or `.env.local`; nothing is committed.
`.env.local` already carries the Supabase trio and the keys:

```bash
set -a; source .env.local; set +a
```

The contract lives in `scripts/verify/funnel.env.example`. Secret values are
masked to their prefix in every funnel log.

| Variable                     | Required             | What it is                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FUNNEL_STORE_PATH`          | yes                  | Path to the isolated client store the funnel run reads instead of `content/clients.json`. Absolute, or relative to the repo root. Use `e2e/funnel/fixtures/clients.json`. The app seam has no default: unset means the app reads `content/clients.json` exactly as before.                                   |
| `FUNNEL_RUN_ID`              | yes                  | Run-scope stamp, one value per run, `fw1-<short-sha>`. Required by seed and reset; every funnel log line carries it and each seeded section body records it, so a run's rows are auditable.                                                                                                                  |
| `FUNNEL_TEST_EMAIL`          | yes                  | The controlled inbox for stage 4 sign-in. Must be a routable-format address: Clerk rejects reserved TLDs like `.test` ("Identifier is invalid"). The dev instance never mails real users.                                                                                                                    |
| `FUNNEL_EMAIL_CATCHER_DIR`   | no                   | Where the dev server's intercepted Resend send bodies are written in the deterministic tier. Leave unset: funnel.sh creates a temp directory and removes it at teardown. Unset outside the suite means real Resend sends.                                                                                    |
| `FUNNEL_LIVE`                | no                   | Live-tier gate. Must be exactly `1` when set. Permits the real `gtm validate` run and one real Resend delivery.                                                                                                                                                                                              |
| `GTM_RUN_LIVE`               | no                   | Set to `1` to run the real `gtm validate` against the LangGraph server. Requires `FUNNEL_LIVE=1`; the preflight fails the combination otherwise.                                                                                                                                                             |
| `SUPABASE_URL`               | yes                  | Dev project REST base, no trailing slash.                                                                                                                                                                                                                                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`  | yes                  | Service-role key, seed and reset writes only. Bypasses RLS. Never logged, never bundled, never committed.                                                                                                                                                                                                    |
| `SUPABASE_ANON_KEY`          | yes                  | Public anon key. The seed uses it to prove anonymous reads of the upload bucket are denied.                                                                                                                                                                                                                  |
| `VITE_CLERK_PUBLISHABLE_KEY` | yes                  | Clerk dev instance publishable key.                                                                                                                                                                                                                                                                          |
| `CLERK_SECRET_KEY`           | yes                  | Clerk dev instance secret key (fixture-account provisioning).                                                                                                                                                                                                                                                |
| `STRIPE_SECRET_KEY`          | yes                  | TEST-mode secret key. The preflight asserts the `sk_test_` prefix and rejects `sk_live_`.                                                                                                                                                                                                                    |
| `STRIPE_AUDIT_PRICE_ID`      | yes                  | The audit price the funnel checkout buys. Provenance: a persistent TEST-mode price created ONCE (Stripe dashboard, or `stripe prices create` with the test key) and reused by every run. The preflight asserts its presence; it is never created per-run.                                                    |
| `AUDIT_ORIGIN`               | local runs           | Return-URL origin for the elements checkout (`src/lib/billing/audit-checkout.ts`). Unset, the module uses the production apex and behaves byte-identically. Local funnel runs set it to the dev origin so payment returns land on the local receipt route, not production.                                   |
| `STRIPE_PUBLISHABLE_KEY`     | yes, in `.env.local` | Server-side key the checkout panel arms with (`src/lib/checkout/audit-checkout-client.ts`). Not asserted by the preflight, but without it the panel degrades to "unavailable" and S3 cannot run. Documented in the repo `.env.example`.                                                                      |
| `PORT`                       | yes, for funnel runs | The app port funnel.sh forwards webhooks to (`localhost:$PORT/api/stripe-webhook`). Defaults to 3000, but the browser suite points at `http://localhost:5180` (`scripts/verify/e2e-config.json`) and the nightly pins 5180. Export `PORT=5180` so the forward target is the server the suite actually tests. |

### Set by funnel.sh, not by you

- `STRIPE_WEBHOOK_SECRET`: exported from the listener the script starts, so
  webhook signatures always match inside the suite.
- `FUNNEL_PW_PROJECT=1`: registers the funnel project in Playwright worker
  processes (`playwright.config.ts` keys registration on it).
- `FUNNEL_STRIPE_LISTENER_LOG`: the live listener log path outside
  `test-results/`, copied into `test-results/funnel/stripe-listener.log` at
  teardown.

### Live-tier only

- `RESEND_API_KEY`: required for the one real magic-link delivery.
- `FUNNEL_PODCASTS_DIR`: the podcasts worktree (default
  `/Users/siddicky/Projects/BeHuman_Company/podcasts-wt/e2e-smoke-blueprint-funnel-w1`).

### Selector overrides (troubleshooting escape hatches)

`FUNNEL_STRIPE_FRAME_SELECTOR`, `FUNNEL_CLERK_DEV_CODE`,
`FUNNEL_CLERK_TEST_PASSWORD`, `FUNNEL_CLERK_CONTINUE_SELECTOR` (all in
`e2e/funnel/helpers.ts`), plus `E2E_BASE_URL` to move the whole suite to another
origin.

## Local run (deterministic tier)

```bash
set -a; source .env.local; set +a
export FUNNEL_RUN_ID=fw1-$(git rev-parse --short HEAD)
export FUNNEL_TEST_EMAIL=funnel-test@example.com
export FUNNEL_STORE_PATH=e2e/funnel/fixtures/clients.json
export PORT=5180
export AUDIT_ORIGIN=http://localhost:5180
bun run test:funnel
```

What happens, in order:

1. **Preflight** (`scripts/verify/funnel.sh`): checks the live gates, requires
   every variable in the table above, asserts `STRIPE_SECRET_KEY` starts with
   `sk_test_`, and provisions the email-catcher directory (temp dir when unset).
2. **Listener**: starts
   `stripe listen --api-key $STRIPE_SECRET_KEY
   --forward-to localhost:$PORT/api/stripe-webhook`,
   waits up to 15s for the readiness line (the real CLI prints `Ready!`), and
   exports the minted `whsec_` value as `STRIPE_WEBHOOK_SECRET`.
3. **Suite**: `bunx playwright test --project=funnel`. Playwright starts the dev
   server on the base-URL port with `--strictPort` (reuses an already running
   one outside CI). Suite setup resets, then seeds, then provisions the fixture
   Clerk account, exactly once per run.
4. **Evidence**: per-stage screenshots and failure traces under
   `test-results/funnel/`, plus `stripe-listener.log` copied in at teardown.

### Dry run

```bash
FUNNEL_PREFLIGHT_DRY=1 bun run test:funnel
```

Runs the full preflight, prints what the listener and suite steps would do, and
exits 0 without starting anything.

## Live tier

```bash
bun run test:funnel:live
```

`test:funnel:live` is `funnel.sh` with `FUNNEL_LIVE=1` (package.json). The
preflight announces the gate, the deterministic suite runs as above, and only
then the live checks run:

1. **Real `gtm validate`.** The script runs
   `GTM_RUN_LIVE=1 uv run --frozen
   python scripts/funnel_stage1.py` in the
   podcasts worktree. The LangGraph server must already be running; the runner
   never starts it. Start it in a second terminal (podcasts worktree root):

   ```bash
   uv run --frozen langgraph dev --host 127.0.0.1 --port 2024 --no-reload --no-browser
   ```

2. **One real email.** The catcher is bypassed for exactly one send: the
   production magic-link module delivers to `FUNNEL_TEST_EMAIL` through Resend.
   Requires `RESEND_API_KEY`.

`GTM_RUN_LIVE=1` without `FUNNEL_LIVE=1` fails the preflight.

## Nightly

`.github/workflows/funnel-nightly.yml` runs the deterministic tier on a 07:00
UTC cron and via manual dispatch, with a canceling concurrency group. PR CI
stays untouched.

Configure these repository secrets (exact names):

- `STRIPE_SECRET_KEY` (TEST mode)
- `STRIPE_AUDIT_PRICE_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `FUNNEL_TEST_EMAIL`

The workflow sets `PORT=5180`, `FUNNEL_STORE_PATH`, and
`FUNNEL_RUN_ID=nightly-<run_id>` itself. `STRIPE_WEBHOOK_SECRET` is deliberately
not a secret: the listener minted inside the run produces it. The real GTM and
Resend checks stay local, behind `FUNNEL_LIVE=1`.

Sandbox variant: to isolate nightly runs from shared TEST data, run
`stripe sandbox create` and point the same TEST-mode secrets at that sandbox.
This is documented in workflow comments only; there is deliberately no second
workflow.

## Reset and cleanup

`scripts/verify/funnel-reset.ts` deletes every row with `client_id`
`funnel-fixture` from `client_blueprint_sections`, `client_paid_reports`, and
`client_portal_tokens`, plus every object under the `funnel-fixture/` prefix in
the `client-uploads` storage bucket. It then proves zero leftovers by query; a
project that was never seeded is a successful no-op (exit 0).

The suite runs reset, then seed, once per run (`e2e/funnel/suite-setup.ts`), so
reruns converge on the same state. Manual reset between sessions:

```bash
set -a; source .env.local; set +a
FUNNEL_RUN_ID=fw1-$(git rev-parse --short HEAD) bun scripts/verify/funnel-reset.ts
```

Run scoping: `FUNNEL_RUN_ID` is required for seed and reset. It is stamped in
every funnel log line and recorded in each seeded section body, so a run's rows
are auditable after the fact. The upload bucket name `client-uploads` is a code
constant (`scripts/verify/funnel-db.ts`), not an env variable; the seed creates
it when absent (private) and verifies with the anon key that anonymous reads are
denied.

## Troubleshooting

### Webhook signature: stale whsec versus the listener's secret

Every `stripe listen` run mints a new `whsec_` secret. Inside the suite this
never mismatches: funnel.sh exports the current listener's secret and the dev
server it starts inherits it. The mismatch happens when you drive the funnel
against a dev server you started yourself: that server keeps whatever
`STRIPE_WEBHOOK_SECRET` sits in `.env.local`, which is usually a dead listener's
secret. The webhook then rejects the signature and the unlock never flips while
S3 polls. Remove the stale value from `.env.local` before such a run. The same
failure shape occurs when the secret was minted against a different Stripe mode
than the `sk_test_` key in use.

### Clerk sign-in on the dev instance (device verification is the gate)

Empirical outcome on this dev instance (pinned 2026-09-16):

- The universal dev code `424242` is accepted for email-code steps but is
  REJECTED at the client-trust (device verification) step with "Incorrect code".
  That step's code is not the universal one.
- The instance also requires a password at user creation: a passwordless create
  answers `422 form_data_missing`. Before the fix in todo 19 (commit f2900a3),
  the webhook provisioned nothing and sign-in answered "Couldn't find your
  account". The webhook now retries the create once with a generated throwaway
  password, and the suite additionally provisions the fixture account at seed
  time with a known test-only password (constant in `e2e/funnel/helpers.ts`).
- Session fallbacks that skip the UI do not work here: creating a session via
  the Backend API answers 404 (endpoint removed), and a sign-in token passed as
  `?token=` is never consumed by clerk-js in this app.

Bottom line: with device verification enabled for the dev instance, S4's sign-in
test and both S5 tests cannot complete fully unattended. Disable
client-trust/device verification for that instance in the Clerk Dashboard to
unblock them. The suite asserts the existing sign-in flow; it does not build
around the gate.

### Stripe Payment Element frame selectors

Pinned selector: `iframe[src*="elements-inner-payment"]`. The Payment Element
mounts TWO frames that both carry `title="Secure payment input frame"`; the card
fields live in the `elements-inner-payment` frame and the other (easel) frame
draws appearance chrome. The title arm and the fallback
`iframe[name*="__privateStripeFrame"]` both match both frames, so they are
ambiguous probes only. If Stripe renames the src, override
`FUNNEL_STRIPE_FRAME_SELECTOR` instead of editing the helper.

Also pinned: payment methods render collapsed, so the spec clicks "Card" inside
the frame before filling. This account shows NO postal input (the Canada
configuration collects it in-card), so `fillStripeCard` fills the postal field
only when the field exists.

### Vite cold start eats the first minute

The run's first checkout init POST pays the cold route compile. The suite
budgets for it: a 240s per-stage timeout, three 25s click windows, a 60s wait
for the `/audit/success` redirect, and 45s poll ceilings for webhook delivery.
Timeouts on the first run after the server boots are usually the compile, not
the checkout. Playwright binds the port with `--strictPort`, so a busy port
fails loudly instead of hanging for two minutes.

### Other sharp edges

- A `.test` email domain fails at Clerk's identifier step. Use a routable-format
  `FUNNEL_TEST_EMAIL`.
- The Stripe CLI's cold start includes a version check and it prints `Ready!`,
  never `listening`; funnel.sh greps both within a 15s window.
- Magic links carry the production apex origin by contract; the suite follows
  them on the dev server. Do not repoint the email seam at localhost.

## Spec versus implementation: the G7 delta

The original spec assumed the payer would be "auto logged-in" after payment.
That behavior is NOT built. The suite asserts the EXISTING
invitation/set-password sign-in flow instead: payment provisions the account and
unlocks the report, and the portal is reached through the normal Clerk sign-in.
This is a recorded spec-versus-implementation delta, not a missing test.

## Evidence layout

After a run, `test-results/funnel/` holds one screenshot directory per stage
(`s1-validate-publish`, `s2-email-prospect`, `s3-checkout-pay`,
`s4-portal-account`, `s5-upload-thankyou`), traces for failures, and
`stripe-listener.log`. The listener log is written outside `test-results/` while
running, because Playwright wipes that tree at startup, and copied in at
teardown.
