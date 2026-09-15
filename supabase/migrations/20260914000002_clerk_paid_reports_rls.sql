-- Clerk-scoped paid-report reads (US-009).
--
-- Third-party auth: Supabase validates Clerk session tokens (JWKS) once
-- [auth.third_party.clerk] names the issuing domain, and maps tokens that
-- carry role=authenticated to this role. `sub` is the full Clerk user id
-- (`user_...`), written by fulfillment at payment time (clerk-provision.ts
-- resolves it from the payer email; the webhook upsert carries it only
-- when known, so a replay during a Clerk outage never clobbers a link).
--
-- unlocked=true belongs in the policy, not the query: operators stage
-- paid rows with unlocked=false BEFORE payment, and the query layer is
-- not a security boundary — a staged-but-unpaid row must be invisible to
-- the authenticated role even once its clerk_user_id is linked. The query
-- layer only enforces render completeness (rows with null/empty title or
-- html are dropped in parsing), mirroring the US-011 both-halves rule.
--
-- client_portal_tokens deliberately gets no policy here: magic links stay
-- service-role-only, unchanged from US-001. The anonymous denies from
-- migrations 000/001 remain the outer wall.
--
-- Apply like 001: `supabase db push` or this file in the SQL editor.

drop policy if exists client_paid_reports_clerk_read
  on public.client_paid_reports;
create policy client_paid_reports_clerk_read
  on public.client_paid_reports
  for select
  to authenticated
  using (auth.jwt()->>'sub' = clerk_user_id and unlocked = true);

revoke all on public.client_paid_reports from anon;

-- The RLS filter column. Small table, but an index keeps the policy a
-- lookup rather than a scan as clients accumulate.
create index if not exists client_paid_reports_clerk_user_id_idx
  on public.client_paid_reports (clerk_user_id);
