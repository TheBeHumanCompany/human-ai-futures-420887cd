---
type: operations reference
title: Configuration and Environment
description: Operational configuration for the app's server boundary, external integrations, and local test/runtime modes. Lists required environment variables, safe defaults, and failure behavior when configuration is absent or partial.
tags: [configuration, environment, operations, runtime, integrations]
verified:
  - by: openwiki/0.4.3
    at: 2026-09-15T05:01:30.389Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-3861fe8ff3f55a088b3b388b
    resource: repo://src/lib/billing/audit-checkout.test.ts
  - id: openwiki-source-006aebc0602855c35196094e
    resource: repo://src/lib/billing/audit-checkout.ts
  - id: openwiki-source-1308551fde52c297f50494eb
    resource: repo://src/lib/billing/stripe-client.test.ts
  - id: openwiki-source-618f1320796ab27f75edc7eb
    resource: repo://src/lib/billing/stripe-client.ts
  - id: openwiki-source-589a696e1b678e41d64404de
    resource: repo://src/lib/billing/stripe-webhooks.test.ts
  - id: openwiki-source-1cb5d9e915e5f3fb18d0cff1
    resource: repo://src/lib/billing/stripe-webhooks.ts
  - id: openwiki-source-b72e8f968061ec184279890d
    resource: repo://src/lib/client-portal/portal.ts
  - id: openwiki-source-a01ac9168371da514d2753cf
    resource: repo://src/lib/client-portal/supabase-clerk.test.ts
  - id: openwiki-source-776493a7df2c7d8a9658ef1c
    resource: repo://src/lib/client-portal/supabase-clerk.ts
  - id: openwiki-source-c7d81da5b53dad9a4569c3d4
    resource: repo://src/lib/client-portal/supabase-tokens.test.ts
  - id: openwiki-source-2329b09061479e57522374ce
    resource: repo://src/lib/client-portal/supabase-tokens.ts
  - id: openwiki-source-064c9fddb1556ee652eb7b97
    resource: repo://src/lib/podbean/feed.live.test.ts
  - id: openwiki-source-5cc9f26184dd87d0dc6e2f1c
    resource: repo://src/lib/podcast/doc-id.test.ts
  - id: openwiki-source-7badd0f0d9f40c4976b93a26
    resource: repo://src/lib/podcast/slug.test.ts
  - id: openwiki-source-e8813aa26c0c957e5e57c858
    resource: repo://src/lib/sanity/config.ts
  - id: openwiki-source-37828bba849c283b55dc431d
    resource: repo://src/start.test.ts
  - id: openwiki-source-b2cea9e1a3fa57403df73b71
    resource: repo://src/start.ts
  - id: openwiki-source-d81538d8891efe37053aeccb
    resource: repo://supabase/config.toml
generated: { by: "openwiki/0.4.3", at: "2026-09-15T05:01:30.389Z" }
---

# Configuration and Environment

This page documents the operational knobs that matter for safe changes: which values are required, which are optional local overrides, and what the code does when configuration is missing or partial. The repository is intentionally conservative about environment use. Some services are compiled into constants because changing them per deploy would be unsafe; other integrations fail closed when a key is absent rather than attempting a degraded request.

## Configuration model

The app separates configuration into three broad classes:

1. **Compile-time constants** for values that must not vary per deploy, such as the canonical site origin and Sanity project metadata.
2. **Required runtime secrets or endpoints** for third-party integrations that must be present before a feature can run.
3. **Optional local-only overrides** for development, testing, and live-network suites.

The practical rule is simple: if a value would change the meaning of permanent URLs, public reads, or protected server actions, it is pinned in source or treated as required environment.

## Required configuration

### Stripe billing

The Stripe billing path is server-only and uses direct REST calls rather than an SDK. `STRIPE_SECRET_KEY` is required for checkout session creation, webhook fulfillment, and the operator scripts that create audit checkouts. If the key is missing, the billing helpers fail before any request is made.

The checkout flow also depends on a price id supplied by environment. The amount lives in Stripe, not in code, and webhook handling depends on `STRIPE_WEBHOOK_SECRET` to verify events. Without that secret, the webhook route returns an error instead of accepting unverified payloads.

Relevant environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_AUDIT_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Safe defaults and failure mode:

- Secretless billing does not partially work; it throws loudly.
- The publishable key is client-safe but currently unused by the runtime.
- Webhook processing should be treated as unavailable until verification is configured.

### Clerk auth and paywall

Auth is conditionally enabled by the presence of `CLERK_SECRET_KEY`. When the key exists, the Clerk middleware is installed so `auth()` works in server functions and route guards. When it is absent, the site serves without sessions rather than failing the whole app, and the startup code logs that sessions are disabled.

The Clerk client-side URLs are route paths, not deploy-specific URLs:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_SIGN_IN_URL`
- `VITE_CLERK_SIGN_UP_URL`
- `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

Important runtime behavior:

- Missing `CLERK_SECRET_KEY` disables the auth layer, which keeps public pages alive.
- A present `VITE_CLERK_PUBLISHABLE_KEY` is baked into the client bundle at build time, so production key changes require redeploy.
- The sign-in and sign-up URLs stay stable across environments.

### Supabase client-portal storage

The portal uses Supabase in two different ways, both server-side:

- The token lookup tier uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- The Clerk-scoped report read path uses `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

Both configuration readers return `null` when either half is missing. That is intentional: half-configured portal reads must never run.

Relevant environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Safe defaults and failure mode:

- `SUPABASE_URL` is trimmed and normalized to remove trailing slashes.
- The service-role key is secret and must never reach the browser.
- The anon key is public by construction, but it still must be present because the read path refuses to run on partial config.

### Sanity write access

Sanity content reads use constants in `src/lib/sanity/config.ts`; no credential is needed for public reads. The only Sanity secret in the environment is `SANITY_WRITE_TOKEN`, used by seeding and publish scripts only.

Relevant environment variables:

- `SANITY_WRITE_TOKEN`

Safe defaults and failure mode:

- Public reads do not need Authorization headers.
- The write token must stay out of the repo, client bundle, and deployed request path.
- If the token is absent, the read path is unaffected; only write-oriented scripts fail.

## Optional local-only overrides

### Live-network test gate

`RUN_LIVE_TESTS` is a switch for suites that talk to external services. When unset, those suites are skipped. When set to any non-empty value, the live tests run.

Use cases:

- Local verification against real PodBean, Sanity, or other external dependencies.
- Nightly or manual environment runs where external uptime is acceptable.

Safe default:

- Leave it unset in pull-request and routine local runs to avoid making external service availability part of the gate.

### Local Supabase and auth settings

`supabase/config.toml` defines local Supabase defaults for ports, schema exposure, and auth behavior. These settings support local development and do not represent app secrets.

Notable local defaults:

- API port `54321`
- Database port `54322`
- Studio port `54323`
- Local SMTP port `54324`
- Database major version `17`
- Auth site URL `http://127.0.0.1:3000`
- Additional redirect URL `https://127.0.0.1:3000`

The local file also enables migrations, seed loading, realtime, storage, and auth by default for development parity.

## Operational failure modes to expect

The code prefers loud failure over silent partial behavior. That shows up in several places:

- Stripe helpers throw if `STRIPE_SECRET_KEY` is absent instead of creating unauthenticated requests.
- The portal read path throws when the Clerk session has no token, when Supabase config is incomplete, or when the remote read fails.
- The auth layer is omitted entirely when `CLERK_SECRET_KEY` is missing, preserving public availability.
- Sanity public reads do not fail because of missing credentials, because there are no credentials on the read path.

This means a successful local boot does not guarantee every feature is enabled. Each integration should be checked against its own configuration contract.

## Runtime and build assumptions

- The application targets Cloudflare Workers via Nitro's `cloudflare-module` preset, so server integrations use Web-compatible primitives such as `fetch` and `crypto.subtle`.
- Stripe transport uses raw HTTP requests with an explicit `Stripe-Version` header for the preview-managed payments flow.
- Dynamic `import()` is used in some server-only paths to keep secret-naming modules out of generic route traversal.
- `VITE_` variables are build-time client inputs; changing them in production without redeploying will not update the client bundle.

## How to change configuration safely

When adding or modifying config:

1. Decide whether the value is a constant, a required secret, or a local-only override.
2. If it is required, make the reader return `null` or throw before any outbound request is made.
3. If it affects public URLs or canonical content, prefer a source constant over environment variability.
4. Update the corresponding tests so the missing, partial, and success branches stay pinned.
5. Keep secrets server-side only and verify they are not read by route components or client bundles.

## Focused tests that matter

The repository already pins the key environment contracts with tests:

- `src/start.test.ts` checks that missing Clerk config disables auth instead of crashing public pages.
- `src/lib/billing/stripe-client.test.ts` verifies Stripe config detection and the required preview transport headers.
- `src/lib/billing/audit-checkout.test.ts` verifies checkout creation fails closed without a secret key or a returned URL.
- `src/lib/client-portal/supabase-clerk.test.ts` verifies the Clerk-scoped portal read requires complete config and uses RLS without client equality filters.
- `src/lib/client-portal/supabase-tokens.test.ts` verifies the service-role token lookup requires full config and sends only the hashed token to PostgREST.
- `src/lib/billing/stripe-webhooks.test.ts` verifies the release path keeps secret-bearing dependencies server-side and handles missing configuration safely.

## Summary table

| Area | Required values | Optional values | Default failure behavior |
| --- | --- | --- | --- |
| Stripe checkout and webhooks | `STRIPE_SECRET_KEY`, `STRIPE_AUDIT_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | `STRIPE_PUBLISHABLE_KEY` | Fail closed with an error |
| Clerk auth | `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` | Clerk route URLs and fallback URLs | No sessions when secret is absent |
| Supabase portal reads | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | none | Return `null` or throw before fetch |
| Sanity writes | `SANITY_WRITE_TOKEN` | none | Public reads unaffected; writes fail |
| Live tests | `RUN_LIVE_TESTS` | none | Suites skipped when unset |
