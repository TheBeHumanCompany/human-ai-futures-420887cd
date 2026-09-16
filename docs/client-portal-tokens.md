# Client portal tokens — implementation notes (US-001)

Per-client long-lived token URLs grant exactly that client's page, with no
password step. This file is the record later stories build on: the route
pattern and this file are the two US-001 artifacts other stories depend on,
so both stay stable.

## Branch and build

- Branch: `main` (the Lovable-connected branch). No history rewrites.
- Build command: `bun run build`. Exits 0; observed 2026-09-14, re-observed
  after the Supabase-tier edit in this story (same date).
- `git log --oneline origin/main..HEAD` is empty: this story leaves its
  changes uncommitted for review. Nothing pushed, nothing force-pushed.

## Token scheme

- **Format:** 32 random bytes, base64url, 43 characters, matched by
  `TOKEN_FORMAT = /^[A-Za-z0-9_-]{32,}$/` in
  `src/lib/client-portal/tokens.ts`. The floor rejects short placeholders
  and path-shaped input before any comparison runs. The URL carries the
  opaque token; only its SHA-256 hex digest ever leaves the server toward
  Postgres (`hashToken` in `src/lib/client-portal/supabase-tokens.ts`,
  WebCrypto `crypto.subtle` so it runs on Cloudflare Workers with no compat
  flag; `sha256("abc") =
  ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`
  pinned in tests).
- **Storage location (two tiers):** canonical is the Supabase Postgres table
  `public.client_portal_tokens` (see schema and migration below). Report
  bodies stay in `content/clients.json` — the content-store path, an array
  of `{ id, name, token, title, html }` records keyed by the same
  `client_id`. Deliberately outside the site code paths (`src/routes`,
  `src/components`, `src/lib`), so later content flows touch the store only.
  Token values are fixture-only and are not repeated in this file. When
  Supabase is configured the digest resolves to a `client_id` and the page
  is read from the content store by that id; unconfigured (local dev,
  tests), the lookup compares against the fixture store directly.
- **Tokens-table schema plus migration file:**
  `supabase/migrations/20260914000000_client_portal_tokens.sql` (apply with
  `supabase db push` or the project SQL editor; RLS ships in the same file,
  never after):
  `client_id text primary key` (one row per client; re-issue overwrites the
  digest on the same row), `token_hash text not null unique check
  (token_hash ~ '^[0-9a-f]{64}$')`, `revoked_at timestamptz null` (null
  while the link works; any non-null value denies), `created_at timestamptz
  not null default now()`. Deliberately NO lifetime column: links end by
  revocation only (pinned by migration-inspection tests asserting no
  `expir*` in the migration or the lookup sources).
- **RLS policies:** `alter table ... enable row level security`, plus an
  explicit deny — `create policy client_portal_tokens_deny_anon ... for all
  to anon using (false) with check (false)` — so the denial survives a
  future GRANT, and `revoke all ... from anon`. The server-side lookup
  authenticates with the service-role key, which bypasses RLS by default.
- **Lookup path:** `src/routes/c.$token.tsx` loader calls the
  `fetchClientPageByToken` server function from
  `src/lib/client-portal/tokens.ts`, which runs the plain
  `fetchClientPageByTokenFn` and returns the client's page WITHOUT the token
  field. Configured, the function hashes the token and resolves the digest
  through `lookupClientTokenRow` in
  `src/lib/client-portal/supabase-tokens.ts` (plain PostgREST `fetch`, the
  `lib/contact.ts` no-SDK idiom; 10s timeout; transport failure denies
  rather than falling back to the raw-token store). The Supabase module is
  loaded through a dynamic `import()` inside that function — the same trick
  the JSON store uses — because it names the service-role env var and a
  static import would hand that string to every bundler walking the route.
  The loader runs in the browser on client-side navigation, so reading any
  store directly in the loader would ship every client's token in the client
  bundle — the server function is what keeps both tiers server-side.
  Verified: `grep` for both fixture token values over `.output/public/`
  (client assets from `bun run build`) returns zero matches, and `grep` for
  `SUPABASE_SERVICE_ROLE_KEY` over `.output/public/` returns zero matches;
  the env name occurs only in one server chunk
  (`.output/server/_ssr/supabase-tokens-*.mjs`).
- **Denial:** unknown and malformed tokens both resolve to `null` and the
  route throws `notFound()`. Observed against local dev server
  (`bunx vite dev --port 5200`, same router and loader code as the build,
  re-observed after the Supabase-tier edit with no credentials set, i.e.
  the fixture tier): valid token answers 200 with that client's markers
  (Acme page carries `ACME-FIXTURE-MARKER-7f3a91` and
  `ACME-FIXTURE-MARKER-02c4e8`, zero `BEACON-FIXTURE-MARKER`; Beacon page
  carries `BEACON-FIXTURE-MARKER-44d2c8`, zero `ACME-FIXTURE-MARKER`);
  unknown 43-character token answers 404 with "This link is not valid" and
  zero markers; `/c/` (missing token) answers 307 to `/c`, which answers
  404 — framework trailing-slash normalization, final status denied in all
  cases. Unknown and malformed are deliberately indistinguishable (one 404),
  so format errors cannot be used as a validity oracle for guessing tokens.

## Supabase credentials — the blocker and exactly what is needed

No Supabase credentials exist in this environment (`printenv` shows no
`SUPABASE_*`; no `.env.local`; the repo has no prior Supabase usage), so
everything above the live database is implemented — migration, RLS, lookup,
tests — and the two live checks are still open:

1. `supabase db push` (or the SQL-editor run of the migration), then seed
   one row per client with the digest, never the token:
   `insert into public.client_portal_tokens (client_id, token_hash) values
   ('acme-industrial',
   '1f63748a077b5f4d5be1218a9395c8618c9d5b7ff92c145d46836078315b695e')`
   (digest corroborated two ways: Python `hashlib` and Bun WebCrypto).
   Beacon digest:
   `a89d2cc3d2256f82f7461fccaebc170c0ed9d2fe6a44d5abac985b4d485cae5a`.
   Mint real links with 32 random bytes base64url and store only the digest.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
   (gitignored via `.env*`) AND in the hosting provider's environment;
   placeholders documented in `.env.example`. The service-role key must
   never be committed and never reach the client bundle (pinned by the
   build grep above on every build).
3. Live anon-key probe (the one check reported, not assumed): with
   `SUPABASE_ANON_KEY`, `GET
   $SUPABASE_URL/rest/v1/client_portal_tokens?select=client_id` with
   `apikey` + `Authorization: Bearer $SUPABASE_ANON_KEY` must return no
   rows (RLS deny). Until that probe runs green, the RLS evidence is the
   policy-file inspection plus the migration tests, not a live database.

## Route pattern (stable contract)

- Client pages live at `/c/$token`, route file `src/routes/c.$token.tsx`,
  mounted off the root (no `c.tsx` leaf to nest under, so no underscore
  escape is needed — unlike `podcast_.$slug.tsx`). Later stories add page
  furniture inside this route's component; the URL shape does not change.
- Declared surface: `{ path: "/c/$token", kind: "dynamic" }` in
  `src/lib/surfaces.ts` with no sample slug, so gates and the sitemap skip
  token URLs rather than visiting or advertising them.

## Hosting target

- Target: **Cloudflare Workers** via the nitro `cloudflare-module` preset
  (the default noted in `vite.config.ts`). Evidence from the story's own
  build: `.output/nitro.json` written by `bun run build` records
  `"preset": "cloudflare-module"`, and the build generates
  `.output/server/wrangler.json`. No separate deploy log exists in the repo;
  the in-repo references (`src/lib/contact.ts`, `src/lib/sanity/http.ts`)
  agree on the same target. Re-observed after this story's Supabase-tier
  edit (`bun run build`, 2026-09-14): preset still `cloudflare-module`,
  `wrangler.json` still generated — no deploy performed, so deploy-log
  evidence remains open alongside the credentials above.

## Added files (this story only)

- `src/routes/c.$token.tsx` — client route.
- `src/routes/c.$token.test.ts` — route tests (options, head, server-only
  store read, no-gate assertions).
- `src/lib/client-portal/tokens.ts` — token types, format, lookup, store
  read, server function, plus the Supabase tier (`fetchClientPageByTokenFn`
  hashes and resolves by `client_id` when configured, fixture store
  otherwise; outages deny, never fall back).
- `src/lib/client-portal/tokens.test.ts` — lookup, isolation, and denial
  tests against the real store file.
- `src/lib/client-portal/supabase-tokens.ts` — `hashToken` (SHA-256 hex),
  `supabaseConfigFromEnv`, `lookupClientTokenRow` (service-role PostgREST
  read; anon key never used). Server-only via dynamic import; see above.
- `src/lib/client-portal/supabase-tokens.test.ts` — config, digest vector,
  stubbed PostgREST read, Supabase-tier resolution/revocation/fail-closed,
  and migration-file inspection (table, RLS, no lifetime) — all offline.
- `supabase/migrations/20260914000000_client_portal_tokens.sql` — table,
  digest CHECK, `revoked_at`, RLS with explicit anon deny. No seed data:
  issue digests per the runbook above.
- `content/clients.json` — token store with the two fixture clients (report
  bodies; the Supabase tier reads pages from here by `client_id`).
- `docs/client-portal-tokens.md` — this file.

Edited (not added): `src/lib/surfaces.ts` (one dynamic entry — required by
`route-shape.test.ts`, which demands declared surfaces equal the generated
router), `src/routeTree.gen.ts` (generated; purely additive `/c/$token`
entries), `tsconfig.json` (`resolveJsonModule`, so the server-only reader
can import the JSON store with types; plus the `*.test.tsx` exclude so the
test-only component file stays out of `tsc`, matching the existing comment
intent — the only `tsc` error in the tree was that pre-existing gap),
`.env.example` (Supabase placeholder block, values empty — documentation,
not credentials).

No sidebar, avatar, publisher, email, or PDF files are added here; those
belong to their own stories.

## US-002 — private by default (no index, no listing, anonymous denied)

Branch and build: same `main`, same `bun run build`, exits 0 (observed
2026-09-14, after this story's edit). Changes uncommitted for review;
nothing pushed, nothing force-pushed. `robots.txt` deliberately untouched:
a `Disallow: /c/` would stop crawlers from ever seeing the `noindex`
below, which is the opposite of the intent. Pinned by
`src/routes/c.$token.test.ts` ("no Disallow rule covers a client URL"),
so a future rule hiding `/c/` turns that row red instead of silently
nullifying the directive.

- **Noindex directive:** `src/routes/c.$token.tsx` `head()` emits
  `{ name: "robots", content: "noindex" }` on BOTH branches (resolved page
  and denied page — the denial is not content either), mirroring the
  not-found branch of `podcast_.$slug.tsx`. A `headers()` option emits
  `X-Robots-Tag: noindex` unconditionally, so a crawler that never parses
  the head still sees the denial. Observed against local dev server
  (`bunx vite dev --port 5199`, same router/loader/head code as the
  build): valid token answers 200 with the client's marker, served HTML
  contains `<meta name="robots" content="noindex"/>`, response header
  `x-robots-tag: noindex`; forged 43-char token answers 404 with
  `<meta name="robots" content="noindex"/>`, "This link is not valid",
  and zero fixture markers; `/c/` (missing token) answers 307, following
  to a final 404 — denied in all cases, matching the US-001 denial.
- **Public-surface exclusion:** sitemap handler reads `sitemapSurfaces()`,
  which excludes every `dynamic` surface — `/c/$token` has no `sitemap`
  hints, so no token URL is advertised (pinned by
  `src/routes/c.$token.test.ts`: `sitemapSurfaces()` and
  `visitableSurfaces()` contain no `/c/` path). No listing links to a
  client URL: `grep` for `"/c/` over `src/` matches only the portal files
  themselves, and only `tokens.ts` imports `content/clients.json`, so no
  listing, page, or component can render a token. Bundle manifest:
  `grep -r -l <tokenA>` and `<tokenB>` over `.output/public/` (client
  bundles, assets, manifest) each return 0; the values occur only in one
  server chunk (`.output/server/_ssr/clients-*.mjs`). The `/c/$token`
  route PATTERN in the client bundle is expected and allowed — the
  criterion forbids token values, not the pattern.
- **Anonymous denied:** missing token and forged token are non-200 (307
  to a final 404, and direct 404), per the curl evidence above.
- **Added files (unchanged by this story — no new files):**
  `src/routes/c.$token.tsx`, `src/routes/c.$token.test.ts`,
  `src/lib/client-portal/tokens.ts`, `src/lib/client-portal/tokens.test.ts`,
  `content/clients.json`, `docs/client-portal-tokens.md` — i.e. only
  client-route, token, and store/notes files. No sidebar, avatar,
  publisher, email-block, or PDF files; no search/billing/notify entry
  points: `grep -rniE "search|billing|notif" src/routes/c.$token.tsx
  src/lib/client-portal/tokens.ts content/clients.json` returns zero
  matches (exit 1). The test file names those terms only inside
  absence assertions (`not.toMatch`), the repo's established idiom for
  negative guards (cf. US-001's "no login step" rows in the same file).

## US-004 — avatar on the client page (this story)

- `src/routes/c.$token.tsx` imports `Avatar, AvatarFallback` from the
  shadcn primitive (`@/components/ui/avatar`) and renders an exported
  `ClientAvatar` (single initial from the resolved page's own name,
  `bg-ink text-cream` fill per the be-human-design brand tokens `--ink` /
  `--cream`) beside the client name on the resolved page branch only.
  The denial branch (`ClientLinkDenied`) renders no avatar and names no
  client. No other file touched: the report shell, token lookup, store,
  and migration are unchanged.
- Observed against local dev server (`bunx vite dev --port 5201`, same
  router and loader code as the build): valid Acme token answers 200,
  served HTML carries the avatar fallback
  (`<span ... bg-ink text-cream ...>A</span>`, dev `data-tsd-source`
  pointing at `c.$token.tsx`) plus the client's markers; forged 43-char
  token answers 404 with "This link is not valid" and zero matches for
  `Avatar|Acme|Beacon`. Pinned offline in `src/routes/c.$token.test.ts`
  (US-004 block: ui-layer import, page-branch wiring, static render of
  the initial and brand fill plus the blank-name fallback, denial-branch
  silence).
- Added files (unchanged by this story — no new files): same list as
  US-002/US-003. The avatar ships inside the existing client-route file,
  which the US-002 exclusion criterion already permits
  (sidebar/avatar category).

## US-005 — paste-HTML publisher flow (this story)

- **Command:** `bun run portal:publish -- --client <id> --report
  <report-id> --title <title> (--html <html> | --html-file <path>)
  [--store <path>] [--dry-run]` (`portal:publish` in `package.json` runs
  `scripts/publish-client-report.ts`, a thin argv wrapper over
  `publishReportToStore` / `publishReportToFile` in
  `src/lib/client-portal/publish.ts`). `--report` defaults to `report`, the
  singleton id a record without a `reports` list renders under. A new report
  id appends the report last; a known id updates its title/HTML in place.
  `--dry-run` plans without writing; `--store` overrides the store path
  (default `content/clients.json`, resolved from the repo root) for fixture
  runs against a copy. `--html` and `--html-file` are mutually exclusive
  and exactly one is required; an unknown `--client` fails naming the known
  ids. The CLI prints `appended|updated` plus `token unchanged: yes` (it
  compares the client's token before and after, printing only the boolean —
  token values never reach stdout, logs, or this file).
- **Content-store path:** `content/clients.json` — the only path a publish
  run ever writes (the file layer takes the store path as its one write
  target; pinned by `publish.test.ts` counting a scratch directory before
  and after). No publish path touches `src/routes`, `src/components`, or
  `src/lib`: the tracked `git status --porcelain` before and after the
  fixture run below is byte-identical (`diff` empty), and the store `diff`
  is purely the appended report block. The client's `id`, `name`, and
  `token` are never written — publishing cannot rotate the link, so the
  URL is stable across publishes and edits. A record whose `reports` key
  is present but unrenderable is refused, not rewritten, so the tool can
  never silently drop entries it does not understand.
- **Fixture run (observed 2026-09-14, local dev server, fixture tier):**
  `bun run portal:publish -- --client acme-industrial --report
  publisher-fixture --title "Publisher Fixture" --html
  '<p>PUBLISHER-FIXTURE-ALPHA-9c41d7 — pasted report HTML.</p>'` answered
  `appended report "publisher-fixture" on client "acme-industrial"` and
  `token unchanged: yes` (exit 0). `curl` against `bunx vite dev --port
  5221` at `/c/$TOKEN` (token read from the store into a shell variable,
  never pasted): **200**, served HTML contains
  `PUBLISHER-FIXTURE-ALPHA-9c41d7` (grep count 1) and the `Publisher
  Fixture` tab title, zero `BEACON-FIXTURE-MARKER-44d2c8`; a forged
  43-character token answers **404**. Re-run with edited HTML
  (`PUBLISHER-FIXTURE-BRAVO-51e80c`) answered `updated report
  "publisher-fixture"` and `token unchanged: yes` (exit 0); fresh server
  (`--port 5222`) serves **200** with `PUBLISHER-FIXTURE-BRAVO-51e80c`
  present (count 1) and `PUBLISHER-FIXTURE-ALPHA-9c41d7` absent (count 0),
  and the store still lists exactly
  `preliminary,follow-up,publisher-fixture` — the edit landed in place,
  no duplicate, no new URL. Token digests (SHA-256, first 16 hex) are
  `acme-industrial 1f63748a077b5f4d`, `beacon-health a89d2cc3d2256f82`
  before, between, and after both runs — unchanged.
- **Cleanup:** the fixture report was removed after verification by
  restoring the pre-run bytes (`cmp` confirms byte-identical; `git status
  --porcelain` matches the pre-run baseline exactly), so the US-001/US-003
  fixture contract (two clients, Acme's two reports) stays green. The
  run's evidence is the transcript above, not residue in the store.
- **Supabase tier:** report bodies stay in `content/clients.json` in both
  tiers — the configured lookup resolves the digest to a `client_id` and
  reads the page from the store by that id — so publishing works
  unchanged once credentials land. The token table is never written by a
  publish (no rotation, no re-issue).
- **Added files (this story only):**
  `src/lib/client-portal/publish.ts` (pure upsert + one-path file write),
  `src/lib/client-portal/publish.test.ts` (12 rows: append, in-place
  update, legacy update/migrate, refusals, single-path write, lookup
  resolution, token stability), `scripts/publish-client-report.ts` (the
  CLI). Edited (not added): `package.json` (one `portal:publish` script
  entry). No route, component, store-shape, migration, or template file
  touched; no search/billing/notify entry points:
  `grep -rniE "search|billing|notif" src/lib/client-portal/publish.ts
  scripts/publish-client-report.ts` returns zero matches (exit 1).

## Deferred to later stories

- `noindex` / exclusion headers on client pages (US-002 owns indexing).
- Multi-report sidebar tabs inside this route (US-003).
- Tier changes on the same token (US-007); token revoke and re-issue
  (US-008). Rotation values longer than 43 characters already pass the
  format check.

## US-006 — HTML by default, PDF only on request (this story)

- **Default send is the HTML link only:**
  `src/lib/client-portal/magic-link-email.ts` composes and delivers the
  magic-link email through the existing Resend path (same
  `https://api.resend.com/emails` POST, same no-SDK `fetch` idiom, same
  `website@updates.thebehumancompany.ca` sender as `src/lib/contact.ts`,
  which is untouched). The payload has no `attachments` field by
  construction — pinned by `magic-link-email.test.ts` both structurally
  (`not.toHaveProperty("attachments")`) and on the wire (fixture send
  body contains no `attachments`, no `%PDF`, no `.pdf`). There is
  deliberately no `createServerFn` wrapper: no browser-facing form may
  trigger a link send (an anonymous mail-the-link endpoint is a spam
  oracle), so the caller is operator tooling holding `RESEND_API_KEY`.
- **Fixture send (observed 2026-09-14):** `bun /tmp/us006-fixture-send.ts`
  (stub fetch capturing the Resend body for Acme) answered
  `{"ok":true}`; `/tmp/us006-fixture-send.json` keys are exactly
  `from, html, reply_to, subject, text, to`, both bodies carry
  `https://thebehumancompany.ca/c/<token>`, zero `www.`, zero PDF bytes,
  sender `The Be Human Company <website@updates.thebehumancompany.ca>`.
- **PDF on explicit request only:** `src/lib/client-portal/report-pdf.ts`
  (`generateReportPdf`, zero new dependencies — a minimal PDF 1.4 writer
  over base-14 Helvetica; report HTML is operator-pasted, so
  tag-stripping is formatting, not sanitising) plus the action
  `scripts/generate-client-pdf.ts` (`portal:pdf` in `package.json`:
  `--client` plus optional `--report` defaulting to the client's first
  report, `--out`, `--store`). Fixture run (observed 2026-09-14):
  `bun run portal:pdf -- --client acme-industrial --report preliminary
  --out /tmp/us006-acme-preliminary.pdf` wrote 735 bytes;
  `strings` finds `ACME-FIXTURE-MARKER-7f3a91` (count 1), header
  `%PDF-1.4`, zero `www.`. Nothing is mailed by this path.
- **Template block:** `templates/Priliminary Blueprint HTML Email.html`
  (podcasts workspace) gains a `<!-- Magic link (US-006) -->` block
  after the CTA in the file's own escaped-string idiom, with
  `{{CLIENT_PORTAL_URL}}` button plus paste-fallback lines. Copy is
  placeholder marked `[TBD final copy]` in both the block and the
  composed email — final copy stays TBD per spec locked decision 9.
  Decoded-template grep: `www.thebehumancompany.ca` count 0,
  `https://thebehumancompany.ca/` count 4 (3 canonicalised links plus
  the block comment), `{{CLIENT_PORTAL_URL}}` count 4, zero
  `attachment`, zero `.pdf`. The embedded JSON still parses
  (`json.loads` of the template string OK).
- **Portal-host canonical:** every client link the send path
  builds comes from `clientUrlForToken` (`CLIENT_PORTAL_ORIGIN = PORTAL_ORIGIN`,
  i.e. `https://portal.thebehumancompany.ca` — the host that serves
  `/c/<token>`), and a URL outside that origin's `/c/` prefix is refused
  before any provider call (pinned in tests). The apex 308s `/c/*` to the
  portal host, so already-sent apex links keep working.
- **Second template disposition — deferred with reason:**
  `templates/Strategic Intelligence Blueprint TEMPLATE.dc.html` is
  untouched. It is the paid-tier send design (one `www` link, Design
  Capitol export), while the US-006 default send travels only through
  the preliminary template; touching it here would widen the diff beyond
  the default path. Its magic-link block plus apex fix belong to the
  story that sends it (paid-tier delivery, US-007 context).
- **Added files (this story only):**
  `src/lib/client-portal/magic-link-email.ts`,
  `src/lib/client-portal/magic-link-email.test.ts`,
  `src/lib/client-portal/report-pdf.ts`,
  `src/lib/client-portal/report-pdf.test.ts`,
  `scripts/generate-client-pdf.ts`. Edited (not added): `package.json`
  (one `portal:pdf` script entry), `docs/client-portal-tokens.md` (this
  section), plus the preliminary template block above. No route,
  component, store-shape, migration, sidebar, avatar, or publisher file
  touched; no search/billing/notify entry points.
- **Credentials (unchanged blockers):** no `SUPABASE_*` in this
  environment (same gap as US-001 — migration/RLS/tests carry the
  story). Additionally, no live Resend send was performed: delivery is
  proven to the stubbed provider boundary only; the first real send
  needs `RESEND_API_KEY` in the operator environment.

## US-007 — same link before and after pay (this story)

- **Tier-upgrade locator:** `publishReportToStore` in
  `src/lib/client-portal/publish.ts`, driven by the operator CLI
  `scripts/publish-client-report.ts` (`bun run portal:publish -- --client
  <id> --report <report-id> --title <title> (--html | --html-file)`).
  A tier upgrade is a publish, not a re-issue: the paid tier is one more
  report appended to the same client record (convention: report id
  `paid`), and the page serves every report under the one token. There
  is deliberately no upgrade-specific code path — a separate path would
  be a second place that could rotate or re-issue the link.
- **No rotation, by inspection:** the locator writes reports only. The
  client's `id`, `name`, and `token` are never assigned — `grep -n token
  src/lib/client-portal/publish.ts` matches the import and comments
  alone — and the CLI compares the token before and after, printing
  `token unchanged: yes` (token values never reach stdout, logs, or this
  file). Pinned in `src/lib/client-portal/tier-upgrade.test.ts` (new
  this story): a source-inspection row asserts `publish.ts` contains no
  `.token =` assignment, so any future rotation step turns that row red
  instead of landing silently.
- **Fixture run (observed 2026-09-15, local dev server, fixture tier):**
  `bun run portal:publish -- --client beacon-health --report paid
  --title "Beacon Health — Paid Report" --html
  '<p>TIER-UPGRADE-FIXTURE-PAID-3b7e21 — paid findings for Beacon
  Health.</p>'` answered `appended report "paid" on client
  "beacon-health"` and `token unchanged: yes` (exit 0). `curl` against
  `bunx vite dev --port 5231` at `/c/$TOKEN` (token read from the store
  into a shell variable, never pasted): **200**, served HTML contains
  `BEACON-FIXTURE-MARKER-44d2c8` (count 1) and
  `TIER-UPGRADE-FIXTURE-PAID-3b7e21` (count 1), zero
  `ACME-FIXTURE-MARKER`. The preliminary body was already on the page,
  so the original token now serves both tiers with no re-issue.
- **Cleanup:** the fixture paid report was removed after verification by
  restoring the pre-run bytes (`cmp` confirms byte-identical; `git
  status --porcelain` matches the pre-run baseline exactly), so the
  US-001/US-003 fixture contract stays green. The run's evidence is the
  transcript above, not residue in the store.
- **Supabase tier:** unchanged — report bodies stay in
  `content/clients.json` in both tiers and the token table is never
  written by a publish (no rotation, no re-issue), so the upgrade path
  works identically once credentials land.
- **Added files (this story only):**
  `src/lib/client-portal/tier-upgrade.test.ts` (preliminary-then-paid
  flow through the real token lookup plus the no-rotation inspection
  row). Edited (not added): `docs/client-portal-tokens.md` (this
  section). No route, component, store-shape, migration, publisher,
  email, or PDF file touched; no search/billing/notify entry points.

## US-008 — revoke and re-issue, links live until revoked (this story)

- **Long-lived property:** there is no `exp` claim, no lifetime column,
  and no expiry job or cron anywhere on the token path. The migration
  carries `revoked_at` and nothing else that could end a link (pinned by
  the no-`expir` migration row); the lookup enforces no clock (pinned by
  the no-`expir` lookup row, now extended to the new admin module); the
  only ends and renewals a link has are the two writes below. Stated
  time gap for the repeat check: Beacon's untouched token served **200**
  at `T0=2026-09-15T00:08:54Z` and again at `T1=2026-09-15T00:12:29Z`
  (~3.5 minutes later, with two store rotations and two server restarts
  in between). No clock means any gap qualifies; this is the observed
  one.
- **Actions:** `bun run portal:tokens -- revoke --client <id>` kills the
  link; `bun run portal:tokens -- reissue --client <id>` renews it and
  prints the new apex URL for the operator to send
  (`scripts/manage-client-token.ts`, a thin argv wrapper over
  `mintToken` / `rotateClientToken` /
  `revokeClientTokenRow` / `reissueClientTokenRow` in
  `src/lib/client-portal/token-admin.ts`, `--store` overridable for
  fixture runs against a copy). Stdout discipline, pinned by
  observation below: revoke prints no token or URL at all; re-issue
  prints only the new URL; neither action ever prints the old token.
  Unconfigured, both actions rotate the fixture store value to a freshly
  minted 43-character base64url token (revoke discards the replacement
  undisclosed). Configured, revoke PATCHes `revoked_at` on the client's
  row (zero matched rows means nothing was live — old tokens already
  deny) and re-issue overwrites the digest and clears `revoked_at` on
  the same row, inserting the row when the client was never seeded. Only
  digests reach Postgres: the re-issue write refuses a raw token before
  any request (pinned in tests), and a provider refusal throws so the
  operator sees it instead of assuming the old link is dead.
- **Fixture run (observed 2026-09-15, local dev server, fixture tier —
  tokens read from the store into shell variables, never pasted):**
  baseline at `/c/$TOKEN` on `bunx vite dev --port 5241`: Acme **200**
  (`ACME-FIXTURE-MARKER-7f3a91` count 1, zero `BEACON-FIXTURE-MARKER`),
  Beacon **200** (marker count 1, zero `ACME-FIXTURE-MARKER`).
  `bun run portal:tokens -- revoke --client acme-industrial` answered
  `revoked token for "acme-industrial"` and printed no token or URL
  (exit 0); fresh server (`--port 5242`): old Acme token **404** with
  "This link is not valid" and zero `ACME-FIXTURE-MARKER`, Beacon still
  **200** with its marker and zero Acme markers (per-client scope).
  `bun run portal:tokens -- reissue --client acme-industrial` answered
  `re-issued` plus the new apex link only (exit 0); fresh server
  (`--port 5243`): old Acme token still **404** (zero markers, denial
  text count 1), new Acme token **200** carrying both Acme markers
  (`7f3a91` count 1, `02c4e8` count 1, zero `BEACON-FIXTURE-MARKER`),
  Beacon repeat **200** at T1 above. Denial throughout is the US-001
  404, so revoked and unknown links stay indistinguishable.
- **Cleanup:** the store was restored from the pre-run backup after
  verification (`cmp` confirms byte-identical; `git status --porcelain`
  matches the pre-run baseline plus this story's own new files), so the
  US-001/US-003 fixture contract stays green. The run's evidence is the
  transcript above, not residue in the store.
- **Supabase tier, live status (changed since US-001):** `.env.local`
  (gitignored) now holds `SUPABASE_URL` and `SUPABASE_ANON_KEY`, but
  `SUPABASE_SERVICE_ROLE_KEY` is still empty — so the configured-tier
  live lookup stays blocked. New evidence from this story, read-only:
  an anon-key probe of the live project answers `PGRST205 ... Could
  not find the table 'public.client_portal_tokens' in the schema
  cache` (HTTP 404, zero rows in any case) — the REST API is reachable
  but the migration has not been applied there yet. Exactly what is
  still needed: run `supabase db push` (or the SQL-editor run of
  `supabase/migrations/20260914000000_client_portal_tokens.sql`), seed
  one digest row per client per the US-001 runbook, set
  `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and the hosting
  environment, then re-run the anon probe (must return no rows) plus
  one revoke/re-issue round through `portal:tokens` against the live
  project.
- **Build:** same `main`, same `bun run build`, exits 0 (observed
  2026-09-15, after this story's edit); nitro preset still
  `cloudflare-module`. The new admin module reaches no route, so the
  client bundle is unchanged: `grep` for `SUPABASE_SERVICE_ROLE_KEY`
  and for `token-admin` over `.output/public/` each return 0. Changes
  uncommitted for review; nothing pushed, nothing force-pushed.
- **Added files (this story only):**
  `src/lib/client-portal/token-admin.ts` (mint, pure rotation,
  Supabase revoke/re-issue writes),
  `src/lib/client-portal/token-admin.test.ts` (16 rows: mint, rotation
  purity and refusals, revoke and re-issue flows through the real
  lookup on scratch stores, repeat-resolution plus no-clock
  inspection, stubbed Supabase writes including the insert fallback),
  `scripts/manage-client-token.ts` (the `revoke`/`reissue` CLI).
  Edited (not added): `package.json` (one `portal:tokens` script
  entry), `docs/client-portal-tokens.md` (this section). No route,
  component, store-shape, migration, sidebar, avatar, publisher, email,
  or PDF file touched; no search/billing/notify entry points:
  `grep -rniE "billing|notif"
  src/lib/client-portal/token-admin.ts
  scripts/manage-client-token.ts` returns zero matches (exit 1), and
  `grep -rni "search"` over the same files matches only `searchParams`
  — the URL query API used to build the PostgREST selectors, the same
  call the pre-existing Supabase lookup makes — not a search feature.

## US-live: voes-and-co first delivery (2026-09-15)

- Store record added (`voes-and-co` / "Voes and Co", random 64-hex placeholder
  token inert under the Supabase tier); preliminary report published from the
  headless-unpacked bundle (scripts/chrome stripped, 12 style blocks kept);
  publisher-created empty legacy `report` tab removed (single `preliminary` tab).
- Live link minted via `portal:tokens -- reissue` (digest row in
  `client_portal_tokens`); served page verified 200 with report content,
  zero fixture-marker leakage, `x-robots-tag: noindex` present. Token value
  lives only in the operator's handoff, never in this file.
