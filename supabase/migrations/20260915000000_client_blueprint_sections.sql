-- The blueprint as section rows, not a document blob.
--
-- WHY ROWS. The preliminary blueprint EXPANDS into the final one: the same
-- report grows from four topics to eight, and a superficial section is later
-- replaced by a deep one. A single `html` column cannot express that — adding a
-- section means rewriting the whole body, and there is nowhere to hang a
-- per-section paywall. One row per (client, section) makes "publish four more
-- sections" an insert of four rows that touches nothing already published.
--
-- section_key is FREE TEXT, deliberately not an enum. An enum is a migration
-- every time a new topic is named, on a vocabulary that is still being
-- discovered — the preliminary has been produced three times and already has
-- two disagreeing section models (gtm_blueprint.py's fixed eleven vs. the nine
-- narrative bands that actually shipped). The uniqueness constraint, not a type,
-- is what keeps the set coherent.
--
-- body is jsonb and is NOT shape-checked here. The typed spine (findings,
-- opportunities, unknowns, sources) is versioned alongside
-- podcasts/schemas/research-report.v1.json and validated in the app. A CHECK
-- constraint on JSON shape would mean a migration per schema tweak, on the part
-- of the schema that will change weekly.
--
-- Apply like the others: `supabase db push`, or this file in the SQL editor.

create table if not exists public.client_blueprint_sections (
  id                    uuid primary key default gen_random_uuid(),
  client_id             text        not null,
  section_key           text        not null,
  ordinal               int         not null,
  tier                  text        not null check (tier in ('preliminary', 'final')),
  status                text        not null default 'draft'
                                    check (status in ('draft', 'published')),
  -- A final-tier section that replaces a shallower preliminary one. Null for
  -- sections that simply add. Kept as a link rather than a delete so the
  -- supersession is legible after the fact.
  supersedes_section_id uuid        null references public.client_blueprint_sections(id)
                                    on delete set null,
  title                 text        not null,
  -- Shown in place of the body when the tier is locked. This is the upsell copy:
  -- the client sees the titles of what they are not getting.
  teaser                text        null,
  band                  text        not null,
  body                  jsonb       not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (client_id, section_key)
);

create index if not exists client_blueprint_sections_client_idx
  on public.client_blueprint_sections (client_id, tier, ordinal);

alter table public.client_blueprint_sections enable row level security;

-- The outer wall, matching migrations 000 and 001: anonymous gets nothing, and
-- the explicit deny survives a future GRANT rather than relying on the absence
-- of a policy.
drop policy if exists client_blueprint_sections_deny_anon
  on public.client_blueprint_sections;
create policy client_blueprint_sections_deny_anon
  on public.client_blueprint_sections
  for all
  to anon
  using (false)
  with check (false);

revoke all on public.client_blueprint_sections from anon;

-- The paywall, in the policy rather than in the query.
--
-- Same principle migration 000002 states for client_paid_reports: the query
-- layer is not a security boundary. A `final` section is staged (status=draft,
-- or published-but-unpaid) BEFORE the client pays, so it must be invisible to
-- the authenticated role until unlocked=true on their paid-report row — not
-- merely absent from the SELECT the app happens to write today.
--
-- Preliminary sections are readable by the owning client as soon as they are
-- published, paid or not: that is the free half of the funnel.
--
-- NOTE the scope of this policy. It governs the Clerk-authenticated /portal
-- path only. The magic-link path (/c/<token>) reads with the service-role key,
-- which bypasses RLS by design (US-001), so ITS gating must be enforced in the
-- application at a single chokepoint. See fetchClientPageByTokenFn.
drop policy if exists client_blueprint_sections_clerk_read
  on public.client_blueprint_sections;
create policy client_blueprint_sections_clerk_read
  on public.client_blueprint_sections
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.client_paid_reports paid
      where paid.client_id = client_blueprint_sections.client_id
        and paid.clerk_user_id = auth.jwt()->>'sub'
        and (client_blueprint_sections.tier = 'preliminary' or paid.unlocked = true)
    )
  );
