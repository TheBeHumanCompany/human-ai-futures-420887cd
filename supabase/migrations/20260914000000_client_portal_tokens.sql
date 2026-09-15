-- Client portal magic-link tokens (US-001).
--
-- One long-lived row per client. The URL carries an opaque token; only its
-- SHA-256 hex digest is stored here, so a read of this table never yields a
-- working link. A link ends by revocation (revoked_at), never by a clock:
-- there is deliberately no lifetime column on this table and no job or cron
-- touching it, so code inspection can pin "long-lived" here rather than
-- trusting a comment.
--
-- Report bodies are NOT here. They stay in the content store
-- (content/clients.json), keyed by the same client_id the lookup below
-- resolves. The publisher flow (US-005) therefore keeps touching the content
-- store only; this table changes only when links are issued or revoked
-- (US-008).
--
-- Apply with the Supabase CLI (`supabase db push`) or by running this file
-- in the project's SQL editor. Either way RLS ships in the same migration
-- as the table: the table is never readable without the policies below.

create table if not exists public.client_portal_tokens (
  -- Stable handle shared with the content store (content/clients.json `id`).
  -- One row per client: re-issue overwrites the digest on the same row, so
  -- the client's URL keeps working while the old value stops (US-007/008).
  client_id text primary key,
  -- SHA-256 hex digest (64 lowercase hex chars) of the opaque URL token.
  -- The CHECK pins the digest shape at the store: anything that is not a
  -- full digest cannot be inserted, so a truncated or plaintext value fails
  -- loudly instead of silently never matching.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- Null while the link works. Set to now() to revoke: the lookup treats any
  -- non-null value as denied, and the row is kept (not deleted) so the
  -- denial is auditable.
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.client_portal_tokens is
  'US-001 magic-link digests, one row per client. Raw tokens never stored.';
comment on column public.client_portal_tokens.token_hash is
  'SHA-256 hex of the opaque token in the client URL.';
comment on column public.client_portal_tokens.revoked_at is
  'Null while the link works; set to revoke. No lifetime column exists by decision.';

alter table public.client_portal_tokens enable row level security;

-- Anonymous reads are denied explicitly, in both directions, so the denial
-- survives a future GRANT: even if some later migration grants select to
-- anon, RLS still has no permissive policy for it and every read fails.
drop policy if exists client_portal_tokens_deny_anon on public.client_portal_tokens;
create policy client_portal_tokens_deny_anon
  on public.client_portal_tokens
  for all
  to anon
  using (false)
  with check (false);

-- No GRANT to anon on this table, so the default (no access) holds even
-- before RLS is considered. The server-side lookup authenticates with the
-- service-role key, which bypasses RLS by default — that key lives in the
-- deploy environment only and must never reach the client bundle.
revoke all on public.client_portal_tokens from anon;
