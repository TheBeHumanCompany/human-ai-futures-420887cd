# Clerk portal accounts — implementation notes (US-009)

Companion to `docs/client-portal-tokens.md` (US-001, magic links) and
`docs/billing-stripe.md` (US-010/011, checkout and unlock). This file is the
third leg of the funnel: what changes the moment a client pays.

## The funnel, and where this fits

1. Podcast guest → preliminary blueprint authored into the content store
   (US-001–008). The "Buy the full blueprint" action lives inside the report
   HTML (US-010).
2. The client pays on Stripe-hosted Checkout. The webhook unlocks the paid tab
   (US-011, unchanged) **and links the payer to a Clerk account**: the checkout
   email becomes a Clerk user (passwordless by design), its id lands in
   `client_paid_reports.clerk_user_id`, and the client receives an invitation
   email carrying the set-password link.
3. The client signs in (`/sign-in` on the portal host, or through the
   invitation) and opens `/portal` on `portal.thebehumancompany.ca`: the page
   reads their paid reports from Supabase through RLS keyed to their Clerk
   session token. For a locked (unpaid) engagement — which RLS deliberately
   cannot see — the page falls back to a service-role blueprint read gated on
   the Clerk session server-side (`src/lib/client-portal/portal-blueprint.ts`).
   The browser never learns a client id in either path.

Provisioning is best-effort at every layer: a Clerk outage costs the portal
linkage, never the paid unlock, and the magic link keeps working unchanged. The
webhook's upsert carries `clerk_user_id` **only when provisioning answered**
(omitted, never nulled), so `merge-duplicates` cannot erase a link an earlier
delivery made; any Stripe replay re-runs provisioning and fills what an outage
left out.

## Design decisions

### The webhook provisions; the portal only reads

Account creation happens exactly once, at payment, driven by the email Stripe
verified by charging it. `src/lib/billing/clerk-provision.ts` talks to the Clerk
Backend API over plain `fetch` (the no-SDK discipline the
Resend/Stripe/PostgREST paths already follow):

1. `GET /v1/users?email_address[]=<email>&limit=1` — an existing account is
   returned from the list read alone (replays cost one GET, mutate nothing, send
   nothing).
2. Otherwise `POST /v1/users` with `skip_password_required: true` and
   `skip_email_verification_required: true` — the email is payment-verified, and
   the invitation below is the credential path.
3. Then `POST /v1/invitations` (`notify: true`, `ignore_existing:
   true`) —
   best-effort, only on the create path: without it a passwordless account has
   no guided way to set a password. A refused invitation never nulls the
   linkage.

`identifier_taken` (422) re-lists rather than fails — a concurrent payment or an
accepted invitation can race the create. Every other failure answers `null`
without throwing; the webhook treats even a throwing seam as "linkage skipped
this delivery" and releases anyway.

### RLS: the policy owns access, the query owns render completeness

Migration `supabase/migrations/20260914000002_clerk_paid_reports_rls.sql` adds
the single policy the portal needs:

```sql
create policy client_paid_reports_clerk_read
  on public.client_paid_reports
  for select
  to authenticated
  using (auth.jwt()->>'sub' = clerk_user_id and unlocked = true);
```

`unlocked = true` lives in the policy, not the query, because operators stage
rows with `unlocked=false` BEFORE payment and the query layer is not a security
boundary. `client_portal_tokens` deliberately gets no authenticated policy:
token digests are server credentials with no user-facing value, and the magic
link stays service-role-only. The 001 anon denies remain the outer wall
(re-asserted in 002).

### The read client sends no identity of its own

`src/lib/client-portal/supabase-clerk.ts` is the authenticated-role counterpart
of `supabase-tokens.ts`: same transport discipline (plain fetch, no SDK,
status-only errors, injectable `fetchImpl`), but the Bearer is the caller's
Clerk session token and the `apikey` is the public anon key. The request carries
**no equality predicate** — which rows exist is RLS's call, and a client that
filtered for itself would be claiming an identity the database never granted.
Rows that survive RLS but lack a complete staged body (payment-before-staging)
are dropped in parsing rather than rendering half a tab — the US-011 both-halves
rule.

### The route guards inside the server function

`src/lib/client-portal/portal.ts` exports the loader twice, mirroring
`tokens.ts`: `loadPortalReports` (plain function over injected auth state — the
decision table runs under `bun test` without Clerk) and `fetchPortalPage`
(`createServerFn` wrapper the `/portal` loader awaits). `auth()` runs inside the
handler — the SDK-documented place; a bare TanStack loader also executes in the
browser on client navigation. Unsigned visitors are redirected to sign-in before
any data is fetched; a session without a readable token, a missing
configuration, or a denied read all throw, so a broken session never renders as
"no reports". An honest zero (a prospect who has not paid) is an empty state on
the page.

`/portal` is unlisted in `src/lib/surfaces.ts` like the auth routes (gates
cannot sign in), `noindex` is unconditional, and every private surface —
portal, profile, `/c/<token>`, sign-in — is served from
`portal.thebehumancompany.ca`, whose chrome carries exactly two controls
(Portal, Profile). The marketing header advertises no session UI at all: the
apex 308s portal paths to the portal host, so there is nothing to advertise.

### Reusing `SUPABASE_ANON_KEY`

Supabase's newer `sb_publishable_…` keys are the forward-looking name for the
same `apikey` role, but the legacy anon key remains fully supported and is
already in both `.env.local` and the probe docs — introducing a second variable
would add dashboard and hosting plumbing for zero functional change. The swap,
if ever wanted, is one line here.

## Environment contract

| Variable                    | Read by                                              | Where                                 |
| --------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `SUPABASE_URL`              | both Supabase tiers                                  | local + hosting                       |
| `SUPABASE_SERVICE_ROLE_KEY` | magic-link/paid reads, webhook upsert (bypasses RLS) | hosting only, never bundled           |
| `SUPABASE_ANON_KEY`         | portal read (`supabase-clerk.ts`), `apikey` header   | local + hosting (**newly site-read**) |
| `CLERK_SECRET_KEY`          | site auth + webhook provisioning                     | local + hosting                       |

## Setup checklist (one-time; dashboards + pushes)

1. **Clerk dashboard → Domains**: confirm the Frontend API domain of the dev
   instance is `loyal-ocelot-9246.clerk.accounts.dev` (the value already
   committed in `supabase/config.toml`).
2. **Clerk "Connect with Supabase"** (dashboard.clerk.com/setup/supabase):
   activate the integration. This adds `role: "authenticated"` to the instance's
   session tokens — **the single most failure-prone step**. Without that claim
   PostgREST maps every Clerk token to `anon`, and every portal read denies.
3. `supabase db push` — applies migration 002 to the linked project
   (`behuman-auth`).
4. `supabase config push` — applies `[auth.third_party.clerk]` from
   `config.toml` (dashboard equivalent: Authentication → Sign In / Providers →
   third-party auth → Clerk, same domain).
5. **Hosting (Cloudflare) env**: add `SUPABASE_ANON_KEY` alongside the existing
   variables — it was documented as unread by the site until this story, so
   assume it is missing there.
6. **Verify the claim** (probe 3 below): a minted token must carry both
   `sub: "user_…"` and `role: "authenticated"`. Expect up to ~30 minutes of JWKS
   propagation patience on first enable — denials right after step 4 are usually
   the cache, not the policy.

## RLS probes (record answers into Live evidence)

```bash
# 1. Anon still denies (the outer wall from 001/002):
curl -s "$SUPABASE_URL/rest/v1/client_paid_reports?select=client_id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
# → []

# 2. Mint a Clerk session token for a linked payer:
USER_ID=$(curl -s "https://api.clerk.com/v1/users?email_address[]=<payer-email>&limit=1" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" | jq -r '.data[0].id')
SESSION_ID=$(curl -s -X POST "https://api.clerk.com/v1/sessions" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}" | jq -r '.id')
CLERK_TOKEN=$(curl -s -X POST "https://api.clerk.com/v1/sessions/$SESSION_ID/tokens" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" | jq -r '.jwt')
echo "$CLERK_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '{sub, role}'
# → sub: "user_…", role: "authenticated"

# 3. Authenticated read — that user's unlocked rows only:
curl -s "$SUPABASE_URL/rest/v1/client_paid_reports?select=client_id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $CLERK_TOKEN"
# → the payer's rows; [] for any other minted user; never a mix
```

## Test-mode end-to-end

`bun run portal:checkout -- --client <id>` → pay with 4242… under
`stripe listen` → observe: the Stripe user created, the invitation email
delivered, `client_paid_reports.clerk_user_id` filled → accept the invitation,
set a password → `/portal` lists the paid report; the magic link still works
unchanged.

## Live evidence

Pending — append here after the checklist and probes run.
