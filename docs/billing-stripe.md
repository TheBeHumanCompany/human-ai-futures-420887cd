# Stripe one-time billing (US-010/011)

Audit-fee Checkout plus webhook fulfillment onto the client's existing magic
link. Test mode throughout; nothing here touches live money.

## How money becomes reports

1. Operator: `bun run portal:checkout -- --client <id>` prints a Checkout URL.
   The URL goes beside the portal link in the magic-link email (US-006).
2. Client pays on Stripe-hosted Checkout (managed payments preview).
3. `POST /api/stripe-webhook` verifies the signature, and on a paid
   `checkout.session.completed` / `async_payment_succeeded` sets
   `client_paid_reports.unlocked=true` for `metadata.client_id`, recording the
   Stripe customer and session ids.
4. The client's next page load appends the `paid` tab — same token, no re-issue
   (US-007 holds). The success page fulfills nothing; it is a receipt.

## Content staging (operator, per client)

Paid HTML is staged BEFORE it can render, independent of payment:

```sql
insert into client_paid_reports (client_id, title, html, unlocked)
values ('acme-industrial', 'Acme paid report', '<p>…</p>', false);
```

Payment-before-staging records the unlock with null content (nothing new
renders); staging-before-payment renders nothing until the webhook flips the
flag. Either order is safe; a hand-published store `paid` report (US-007 manual
path) wins over this row and is never duplicated.

## Setup checklist

- [ ] Apply `supabase/migrations/20260914000001_client_paid_reports.sql`
      (dashboard SQL editor or `supabase db push`).
- [ ] Create the real audit-fee Product + Price in test mode; set
      `STRIPE_AUDIT_PRICE_ID`. Amount lives in Stripe, never in code.
- [ ] Dev webhooks:
      `stripe listen --forward-to localhost:PORT/api/stripe-webhook`, put its
      secret in `STRIPE_WEBHOOK_SECRET`. Prod: dashboard webhook + signing
      secret in hosting env.
- [ ] Test card `4242 4242 4242 4242`, any future expiry, any CVC.
- [ ] Monitor fulfillment in Stripe Dashboard → Developers → Webhooks (delivery
      log) on failures; poison events return 200 with a logged reason rather
      than retry-looping.

## Blueprint deviations (all deliberate)

- CAD, not USD; product is the audit engagement, not the blueprint's placeholder
  e-book. Amount TBD by fee decision.
- `integration_identifier: portal-audit-<8 letters>` added per PRD US-010
  (accepted alongside the preview params, verified live).
- No `payment_method_types` (dynamic methods; Interac appears for CA buyers).
- No SDK: direct REST over fetch (Workers-safe, exact preview header), mirroring
  the Resend path. No `stripe` npm dependency.
- `stripe-version: 2026-02-25.preview` isolated to one constant. It is a
  preview: if Stripe withdraws it, drop the header and `managed_payments` for
  standard Checkout. Revisit before going live.
- Tax code `txcd_10103100` is the blueprint's value, used verbatim — not
  independently verified against the canonical list. `automatic_tax` arrives
  enabled under managed payments; confirm registration behavior with the tax
  advisor before live (see reports/stripe-integration-plan.md).
- Clerk linkage shipped (US-009): `docs/clerk-portal.md` — the webhook
  provisions the payer's Clerk account from the checkout email and fills
  `clerk_user_id` (omitted, never nulled, when provisioning cannot run).

## Live evidence (test mode)

- 2026-09-14, preview header `2026-02-25.preview`: product `prod_VGHGChdZJr38r0`
  ("AI Adoption Audit (TEST)") + price `price_1UFkhXL8qhzflI9NQSncM3YW` ($1.00
  CAD TEST placeholders) created; `tax_code: txcd_10103100` accepted verbatim.
- 2026-09-14: `bun run portal:checkout -- --client acme-industrial` (repo code
  path, TEST price) returned live session
  `cs_test_a1DDScyC5J5NaDNFFuVl4HRQgxXDmaTc5nH2VBtN6SEQ7iDVyq5NWLXY0x` with
  `integration_identifier` accepted and `automatic_tax.enabled: true` under
  managed payments. A second probe session `cs_test_a1Z1...` (curl) confirmed
  the same.
- Unit: 27 new tests pass (transport, params, HMAC round-trip, routing, release
  shape, paid-tab matrix). Portal scope 116 pass. Full suite 856 pass; only
  failures are the 2 pre-existing podcast-grid tests, proven failing on the
  stashed clean base. tsc (root + scripts), eslint, and `bun run build` (nitro
  cloudflare-module) clean. Bundle greps: `STRIPE_SECRET_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, and the test secret value all return zero matches
  in `.output/public/` (value also absent from `.output/server/`).
- Still open, all recorded as blockers not assumptions: real audit-fee
  Product/Price + fee amount; `STRIPE_WEBHOOK_SECRET` via `stripe listen`;
  manual 4242 click-through of a live session URL.
- 2026-09-15, full fulfillment loop observed live (test mode): `db push` applied
  both migrations; anon probes on both tables answer 42501 permission-denied
  (RLS + revoke hold), service reads `[]`; seeded live token for acme-industrial
  via `portal:tokens -- reissue`; staged locked paid content
  (`LOOP-PROBE-PAID-77aa10`); signed `checkout.session.completed` (paid,
  `cs_test_loop`) POSTed to local `/api/stripe-webhook` → 200 `released`; row
  read back unlocked with staged title intact plus
  `cus_test_loop`/`cs_test_loop`; same magic link served 200 with preliminary +
  paid tab, zero beacon leak; old link revoked → 404. Cleanup: token revoked,
  probe paid row deleted (paid table `[]`), TEST price archived + product
  deactivated (`prod_VGHGChdZJr38r0`, undeletable-by-API while prices exist —
  dashboard delete if it bothers you), `STRIPE_AUDIT_PRICE_ID` emptied.
- Operator sequencing (locked): the Stripe link lives INSIDE the preliminary
  blueprint HTML — run `portal:checkout`, embed the URL in the report HTML, then
  `portal:publish`. No on-page pay button exists or is needed for the loop.
- FINDING (2026-09-15, elements-mode empirical probes, full record
  `test-results/elements-contract.md` — version pin): the pinned preview header
  `2026-02-25.preview` rejects `ui_mode=elements` (Stripe names
  `2026-03-25.dahlia` as the minimum); elements sessions use `2026-08-26.dahlia`
  via a per-call header override and 200 with a `client_secret`. The preview
  header still governs all link-mode calls.
- FINDING (2026-09-15, same probes — managed_payments):
  `managed_payments[
  enabled]=true` is rejected with elements on every header
  tried (Managed Payments only supports hosted/embedded ui_modes), and the
  account has it default-on, so elements sessions must send
  `managed_payments[enabled]=false` explicitly. It stays on the operator
  link-mode flow. Elements sessions currently carry
  `automatic_tax.enabled=false` — test mode rejects explicit automatic tax
  pending a dashboard head-office address; revisit before live.
