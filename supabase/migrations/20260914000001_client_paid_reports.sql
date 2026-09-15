-- Paid-report gate for Stripe fulfillment (US-011).
--
-- Why a table and not the content store: fulfillment runs on Cloudflare
-- Workers, which have no filesystem to write `content/clients.json` back to.
-- The operator stages paid content here (dashboard SQL insert) with
-- unlocked=false; the webhook flips unlocked=true on payment. The read path
-- renders the paid tab only when a row exists with unlocked=true AND a
-- non-empty title and html — so payment-before-staging and
-- staging-before-payment both resolve to the safe visible state (nothing new
-- appears until both halves exist), never to a half-rendered tab.
--
-- Apply like 001: `supabase db push` or this file in the SQL editor. RLS
-- ships in the same migration: never readable without the policies below.

create table if not exists public.client_paid_reports (
  -- Same handle as client_portal_tokens.client_id and content store `id`.
  client_id text primary key,
  -- Staged by the operator. Nullable so fulfillment can record a payment
  -- before content exists; the read path requires both non-empty.
  title text null,
  html text null,
  -- False until the webhook observes a paid session. No lifetime column, no
  -- expiry job: release is an event, not a clock (same decision as 001).
  unlocked boolean not null default false,
  unlocked_at timestamptz null,
  -- Stripe mapping for the audit trail (US-011). clerk_user_id is reserved
  -- for US-009 and stays null until then.
  stripe_customer_id text null,
  stripe_session_id text null,
  clerk_user_id text null
);

comment on table public.client_paid_reports is
  'US-011 Stripe-fulfilled paid reports. Content staged by operator, released by webhook.';

alter table public.client_paid_reports enable row level security;

drop policy if exists client_paid_reports_deny_anon on public.client_paid_reports;
create policy client_paid_reports_deny_anon
  on public.client_paid_reports
  for all
  to anon
  using (false)
  with check (false);

revoke all on public.client_paid_reports from anon;
