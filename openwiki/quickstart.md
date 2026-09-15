---
type: quickstart routing guide
title: Quickstart
description: Start here to find the minimum pages for understanding the app, running it, testing it, and changing it safely.
tags: [quickstart, routing, operations, testing, workflows]
verified:
  - by: openwiki/0.4.3
    at: 2026-09-15T05:01:30.389Z
sources:
  - id: openwiki-source-e3378b150c91cdaa8406ac6c
    resource: repo://e2e/client-portal.spec.ts
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-dce0aba8e5efcd95b55cc0e1
    resource: repo://src/lib/client-portal/publish.ts
  - id: openwiki-source-2329b09061479e57522374ce
    resource: repo://src/lib/client-portal/supabase-tokens.ts
  - id: openwiki-source-c30fd38a377c1dc77c251622
    resource: repo://src/lib/client-portal/token-admin.ts
  - id: openwiki-source-39cc8306bf77ca7f854898e1
    resource: repo://src/lib/client-portal/tokens.ts
  - id: openwiki-source-2baefd92798f2166fb4f3250
    resource: repo://src/lib/surfaces.ts
  - id: openwiki-source-8409418e8d332431bc853dce
    resource: repo://src/router.tsx
  - id: openwiki-source-bd84b9294f094107084ae6ed
    resource: repo://src/routes/portal.tsx
  - id: openwiki-source-42154ebcaff3439ca9d71a80
    resource: repo://src/routes/README.md
  - id: openwiki-source-d9b845a7425932c3767a237e
    resource: repo://src/server.ts
  - id: openwiki-source-b2cea9e1a3fa57403df73b71
    resource: repo://src/start.ts
  - id: openwiki-source-d81538d8891efe37053aeccb
    resource: repo://supabase/config.toml
  - id: openwiki-source-cac95cc5131a7860652c003f
    resource: repo://supabase/migrations/20260914000000_client_portal_tokens.sql
generated: { by: "openwiki/0.4.3", at: "2026-09-15T05:01:30.389Z" }
---

# Quickstart

Use this page as the shortest path into the repository. It does not explain every subsystem; it routes you to the pages that do.

## Read first

- [System Map](/openwiki/architecture/system-map.md) — runtime entrypoints, request flow, and the major app boundaries.
- [Content Model and Public Surfaces](/openwiki/concepts/content-and-surfaces.md) — the public pages, shared content primitives, and how the site maps to user journeys.
- [Configuration and Environment](/openwiki/operations/configuration-and-env.md) — required env vars, local assumptions, and operational knobs that affect safe changes.
- [Test Strategy](/openwiki/testing/test-strategy.md) — the test layers and the boundaries each suite protects.
- [Feature Change Workflow](/openwiki/workflows/feature-change.md) — the safe path for changing routes, shared libraries, config, and tests.

## When you are working on specific domains

### Runtime, startup, and deployments

Read [Release and Runtime Operations](/openwiki/operations/release-and-runtime.md) when you need to:

- run the app locally,
- build or preview a production bundle,
- understand the worker/server entrypoints,
- debug request handling or auth middleware order.

### Content, homepage, and editorial pages

Read [Content Model and Public Surfaces](/openwiki/concepts/content-and-surfaces.md) and, when changing marketing copy or page structure, [Marketing and Content Change Workflow](/openwiki/workflows/marketing-and-content-change.md).

### Portal access, payments, and private links

Read [Stripe and Portal Access](/openwiki/integrations/stripe-and-portal-access.md) for checkout, webhook, token issuance, and portal authorization boundaries.

### Content integrations

Read the integration pages that match the system you are touching:

- [Podbean Podcast Sync](/openwiki/integrations/podbean-podcast-sync.md)
- [Sanity and Content Models](/openwiki/integrations/sanity-and-content-models.md)

## Minimum commands to know

These are the repository commands that matter most for day-to-day work:

```bash
bun run dev
bun run build
bun run lint
bun run test
bun run e2e
```

The full script set lives in `package.json`; use the workflow and testing pages above to decide which command matters for a change.

## What to change first

If your task touches routing, shared rendering, or content surfaces, start with the system map and the content model pages before editing code. If it touches private portal behavior, read the Stripe and Portal Access page first, then the test strategy page, then the feature-change workflow.

## Safe change checklist

1. Identify the runtime domain you are changing.
2. Read the matching concept, operations, or integration page.
3. Check the focused tests that cover that boundary.
4. Make the code change.
5. Run the narrow validation path for that domain before broader checks.

If you are unsure where a change belongs, use the system map first; it is the best orientation page for this repository.
