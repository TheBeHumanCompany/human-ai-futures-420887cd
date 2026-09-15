---
type: test strategy
title: Test Strategy
description: Explains the repository's test layers, what each suite proves, and where regression coverage is concentrated for routes, podcast data, client portal flows, end-to-end behavior, and release gates.
tags: [testing, quality-assurance, regression-coverage, playwright, bun]
verified:
  - by: openwiki/0.4.3
    at: 2026-09-15T05:01:30.389Z
sources:
  - id: openwiki-source-e3378b150c91cdaa8406ac6c
    resource: repo://e2e/client-portal.spec.ts
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-5e753d9d77984cb67aae1517
    resource: repo://playwright.config.ts
  - id: openwiki-source-7427284ab427e3804fb0b159
    resource: repo://scripts/verify/ac-suite.sh
  - id: openwiki-source-92257bf53436d3322302c8ea
    resource: repo://scripts/verify/assert-spec-fresh.sh
  - id: openwiki-source-c5c762424c404e973c70aa17
    resource: repo://scripts/verify/e2e.sh
  - id: openwiki-source-9c5805c3b014d9f4e4083dc4
    resource: repo://scripts/verify/prod-acceptance.sh
  - id: openwiki-source-b5cd3e5a4cfc6f0f6d2eca54
    resource: repo://src/lib/podcast/route-contract.test.ts
  - id: openwiki-source-39a36ed7f6d5a4c50282ac28
    resource: repo://src/lib/route-shape.test.ts
  - id: openwiki-source-c5d00b07dd89beca3e767d77
    resource: repo://src/routes/index.test.ts
  - id: openwiki-source-9ec57ea6dad1bc91d28b78e7
    resource: repo://src/routes/podcast_.%24slug.test.ts
  - id: openwiki-source-8416cf2a3d03681ecd3f0803
    resource: repo://src/routes/podcast.test.ts
generated: { by: "openwiki/0.4.3", at: "2026-09-15T05:01:30.389Z" }
---

# Test Strategy

This repository uses several test layers so that different kinds of regressions fail at the right boundary. The overall pattern is intentional: fast source-level tests protect invariants and control flow, browser tests protect user-visible behavior, and shell verification scripts protect release gates, environment wiring, and cross-checks that are easy to accidentally bypass.

The most important concentration of coverage is around routes, podcast content, and release validation. Those areas have the highest risk of silent failure because a route can still compile while no longer matching the public surface, a content loader can degrade in a way that looks like a normal empty state, and a validation script can report success while checking the wrong thing.

## Test layers

### Unit and structural tests in `src/**/*.test.ts`

The `src/**/*.test.ts` suites are the main regression net for code that can be verified without a browser. They assert data shaping, route contracts, projection maps, service boundaries, and invariants that are easy to express as pure checks or source inspection.

That layer is where this repository protects the most failure-prone implementation seams:

- route shape and route-tree alignment
- podcast loader behavior and degraded-state handling
- client portal token and publish flows
- Sanity schema, transport, and projection expectations
- Podbean parsing, filtering, normalisation, and snapshot behavior
- billing and Stripe integration behavior

Because these tests are cheap to run and focused on one subsystem at a time, they are the primary place where regression coverage is concentrated. They catch changes that would otherwise only show up in the browser or in production, especially when the failure mode is structural rather than visual.

Representative examples include `src/lib/route-shape.test.ts`, which guards the generated route tree against drift in ids, public paths, and nav destinations, and `src/lib/podcast/route-contract.test.ts`, which pins the difference between "degraded", "not found", and "found" episode states.

### Component tests in `src/**/*.test.tsx`

The `.test.tsx` suite covers rendered UI pieces where markup, link structure, and stateful presentation matter but a full browser is not required. These tests are used sparingly and mostly around surfaces whose correctness depends on how content is composed in the DOM.

A representative example is `src/components/client-portal/client-reports.test.tsx`, which checks that the client reports surface renders the right stacked content and does not add navigation chrome that would change the delivered portal experience.

### Browser end-to-end tests in `e2e/*.spec.ts`

The Playwright suite verifies the real application in a browser, with viewport coverage and a dedicated no-JavaScript project. This layer is the one that proves the site works as a shipped experience, not just as data or markup.

The browser suite is especially important for:

- accessibility and interaction behavior that depends on a real browser engine
- responsive layout across representative viewports
- pages whose behavior changes when JavaScript is disabled
- integration of navigation, routes, and rendered content as users actually see them

The configuration in `playwright.config.ts` defines three browser viewports plus a `no-js` project. The `no-js` project exists to prove behavior that only matters when JavaScript is off, and the config binds it specifically to `e2e/no-js.spec.ts` through `testMatch`. That makes the no-JavaScript check a dedicated regression boundary rather than a general browser test that could be weakened accidentally.

The browser entrypoint also reads its base URL from the shared e2e config and only starts a local web server when the target is localhost. That prevents a local dev server from being spawned when a remote or deployed URL is under test.

Representative browser coverage includes:

- `e2e/chrome-and-nav.spec.ts` for chrome, navigation, and interaction behavior
- `e2e/client-portal.spec.ts` for portal delivery in a browser
- `e2e/no-js.spec.ts` for JavaScript-disabled behavior
- `e2e/surfaces.spec.ts` for content and surface-level rendering
- `e2e/typography.spec.ts` for responsive type and layout behavior
- `e2e/video-facades.spec.ts` for media facade behavior

### Verification scripts in `scripts/verify/*.sh`

The shell verification scripts protect repository-level and release-level invariants that are not well represented by unit tests alone. They are not a substitute for application tests; they are the guardrails around how the suite is invoked and trusted.

The most important scripts are:

- `scripts/verify/e2e.sh`, which prevents a false-green browser run by checking that Playwright is installed, the browser is runnable, the spec set is non-empty, and the dedicated no-JS spec still exists.
- `scripts/verify/ac-suite.sh`, which is the release-gate entrypoint for acceptance criteria proofs and fails in release mode if any live criterion lacks a proof.
- `scripts/verify/assert-spec-fresh.sh`, which ensures the tracked spec copies do not drift from their `.omc/` originals.
- `scripts/verify/prod-acceptance.sh`, which asserts origin first and then runs component-specific acceptance checks against the expected host.

These scripts protect the boundaries where a green result can be misleading: an empty test directory, a stale spec copy, a missing release proof, or a check pointed at the wrong host.

## What each layer proves

The layers are intentionally overlapping, but not redundant.

- Source-level tests prove internal invariants, contract shape, and failure semantics.
- Component tests prove rendered composition where structure matters.
- Playwright proves the site behaves correctly in a browser, with and without JavaScript, at representative sizes.
- Verification scripts prove the suite is being run against the right files, the right host, and the right release rules.

The combination matters more than any single suite. For example, route tests can prove that the generated route tree still matches the declared public surfaces, while browser tests prove that those surfaces actually render and work. Likewise, the podcast route tests can distinguish degraded, not-found, and healthy states, while the acceptance scripts ensure those guarantees are still part of the release gate.

## Failure boundaries and regression focus

The repository pays special attention to failure modes that are easy to miss:

- A route rename that leaves a public URL broken but does not fail type-checking.
- A loader that converts an outage into a fake 200 or 404.
- A browser suite that appears green because no tests were discovered.
- A dedicated no-JS behavior change that would never be exercised in a default browser project.
- A production acceptance script that validates the wrong host or the wrong manifest.

Those are the boundaries where this test strategy is most defensive. The goal is not simply to have many tests; it is to ensure that the tests fail in the same place the user-facing regression would fail, and to keep the release gate from being satisfied by a vacuous or drifted check.
