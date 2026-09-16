# Podcast → Blueprint → Payment → Portal: test + demo runbook

The workflow end to end, what is automated, what a human does, and the exact
commands to prove it live in front of the team.

Two repositories, one chain:

- `podcasts/` — research and blueprint generation (Python, LangGraph, `uv`).
- `human-ai-futures-420887cd/` — website, gated blueprint page, payment, portal
  (TanStack Start, Bun, Playwright).

The boundary between them is the **human sign-off** on the preliminary
blueprint. Everything before it is the research pipeline; everything after it is
the funnel this suite covers.

---

## 1. The chain, and who owns each link

| #   | Step                         | Owner     | Command / surface                     | Evidence                                                          |
| --- | ---------------------------- | --------- | ------------------------------------- | ----------------------------------------------------------------- |
| 1   | Guest + company arrive       | human     | hand-authored brief                   | `podcasts/briefs/vos-and-co.client.md`                            |
| 2   | Initial research package     | pipeline  | `gtm run --mode client --brief … `    | `.md` + `.json` + `.sources.json` triplet                         |
| 3   | Shane records the podcast    | human     | —                                     | —                                                                 |
| 4   | Transcript staged            | human     | `Speaker \| MM:SS` format gate        | `podcasts/transcripts/vos-and-co-desiree-dupuis.txt`              |
| 5   | Evidence extraction          | pipeline  | `gtm notes --transcript … `           | `transcripts/notes/…notes.md` (E### / V### registers)             |
| 6   | Preliminary blueprint draft  | pipeline  | `gtm draft --transcript … --notes … ` | `packages/vos-and-co/blueprint-draft-5.md` (11 fixed sections)    |
| 7   | **SIGN-OFF GATE**            | **human** | human edits the draft in place        | `packages/*/review-notes-*.md`                                    |
| 8   | Advisory validation          | pipeline  | `gtm validate --package … `           | `*.validation.md` (verified / discrepancy / unverifiable / stale) |
| 9   | Blueprint HTML               | pipeline  | `gtm blueprint <draft>.md`            | `packages/*/blueprint/index.html` (deterministic, no model)       |
| 10  | Publish to the portal        | operator  | `bun run portal:publish`              | row in `content/clients.json`                                     |
| 11  | Magic-link email             | operator  | `deliverMagicLinkEmail` (Resend)      | captured JSON or a real send                                      |
| 12  | Gated blueprint page         | app       | `/c/<token>`                          | prelims open, finals title+teaser only                            |
| 13  | Payment                      | app       | Stripe Payment Element                | `checkout.session.completed` → `[200]`                            |
| 14  | Account creation             | app       | Stripe webhook → Clerk                | `client_paid_reports.unlocked = true`                             |
| 15  | Portal + document checklist  | app       | `/portal`                             | avatar, one question per final section                            |
| 16  | Upload → thank-you → booking | app       | `/portal`                             | Cal.com CTA                                                       |

Step 8 is **advisory only** — it never edits the package, and the system never
sends. The human always decides.

---

## 2. Test it (do this before the demo)

One command runs the whole post-sign-off funnel: 13 tests, 5 stages, real
Supabase, real Clerk dev instance, real Stripe TEST mode, real webhook delivery.

```bash
cd human-ai-futures-420887cd
set -a; source .env.local; set +a
export FUNNEL_STORE_PATH=e2e/funnel/fixtures/clients.json
export FUNNEL_RUN_ID="demo-$(git rev-parse --short HEAD)"
export FUNNEL_TEST_EMAIL=funnel-test@example.com
export FUNNEL_EMAIL_CATCHER_DIR=test-results/funnel/email-catcher   # keeps the captured email
bun run test:funnel
```

Expect `13 passed` in roughly 2–3 minutes.

`FUNNEL_EMAIL_CATCHER_DIR` is worth setting explicitly: left unset, `funnel.sh`
creates a temp directory and deletes it at teardown, so the captured
magic-link email — the most demo-relevant artifact in the run — disappears
before you can open it.

What the runner does before Playwright starts (`scripts/verify/funnel.sh`):

1. asserts every required variable is present and that the Stripe key is
   `sk_test_` (a live key is refused outright);
2. starts one `stripe listen`, forwarding to the port the browser suite serves,
   and exports the minted `whsec_…`;
3. resets and reseeds the fixture tier exactly once per run;
4. registers the `funnel` Playwright project and runs it serially.

Nothing in the deterministic tier sends an email or charges a real card.

### Optional live tier

```bash
export FUNNEL_LIVE=1        # one real Resend delivery to FUNNEL_TEST_EMAIL
export GTM_RUN_LIVE=1       # real `gtm validate` against a running LangGraph server
bun run test:funnel:live
```

`GTM_RUN_LIVE=1` requires `FUNNEL_LIVE=1` and a LangGraph server already up
(`uv run --frozen langgraph dev --host 127.0.0.1 --port 2024`). Skip this tier
for the demo unless the team specifically wants to watch a real email land.

---

## 3. Demo it

### Act 1 — upstream, from artifacts (5 min, no models run)

Nothing here needs to execute live; the artifacts are the story, and a live
`gtm draft` costs money and minutes.

1. `podcasts/briefs/vos-and-co.client.md` — the input: a name and a company.
2. `podcasts/transcripts/vos-and-co-desiree-dupuis.txt` — what Shane came back with.
3. `podcasts/transcripts/notes/vos-and-co-desiree-dupuis.notes.md` — evidence
   extraction. Show an `E###` entry and its `V###` flag: every later claim
   traces to a line of transcript.
4. `podcasts/packages/vos-and-co/blueprint-draft-5.md` — the preliminary
   blueprint, 11 fixed sections.
5. `podcasts/packages/vos-and-co/review-notes-5.md` — the sign-off record, and
   the honest state: **draft 5 has not been validated yet.**

If someone asks to see the pipeline actually run, use the offline fixture —
deterministic, no network, no keys:

```bash
cd podcasts && uv run --frozen python scripts/funnel_stage1.py
```

It prints the `{package, verdictPath, blueprintHtml}` handoff the website suite
consumes.

### Act 2 — the funnel, live in a browser (10 min)

Run the suite in headed mode so the team watches it happen:

```bash
cd human-ai-futures-420887cd
# … same exports as section 2 …
PWDEBUG=0 bunx playwright test --project=funnel --headed
```

(Set `FUNNEL_PW_PROJECT=1` and run `stripe listen --forward-to
localhost:5180/api/stripe-webhook` yourself if you drive Playwright directly
instead of through `funnel.sh`.)

Narrate against the five stages:

- **S1 — publish.** `portal:publish` pastes the report; `/c/<token>` serves it.
  Also show the failure case: a missing input fails with the named path.
- **S2 — email.** Open the captured JSON in
  `test-results/funnel/email-catcher/`. With `RESEND_TEMPLATE_ID_MAGIC_LINK`
  set (it is, in `.env.local`) the send is a Resend Template call, so the link
  is at `body.template.variables.PORTAL_URL` — not in an HTML body. It carries
  the production apex origin by contract; swap the host for `localhost:5180` to
  follow it locally, which is exactly what the suite does. The page shows
  preliminary sections in full and finals reduced to title + teaser. Then paste
  a wrong token: 404, content-free.
- **S3 — payment.** Pay with `4000 0000 0000 9995` first — inline decline, and
  the database stays locked. Then `4242 4242 4242 4242` — watch
  `checkout.session.completed → [200]` land in
  `test-results/funnel/stripe-listener.log` and the row flip to `unlocked`.
- **S4 — account.** Signed out, `/portal` redirects to sign-in. Sign in as the
  fixture account: company identity and the paid report are visible.
- **S5 — checklist.** Upload a `.exe`: refused inline, and the storage bucket is
  verified empty afterwards. Upload the PDF: confirmation, then the thank-you
  surface with the 24-hour promise and the Cal.com CTA.

### Act 3 — what the tests actually guarantee

Worth saying out loud, because it is the difference between a demo and a proof:

- the webhook counts only when Stripe returns `[200]` **and** the database flip
  is observed by a separate service-role read;
- a declined card must leave the row locked, or S3 fails;
- an invalid token must 404, or S2 fails;
- a rejected upload must leave the bucket empty, or S5 fails;
- body copy on a dark band must not be painted in the dark foreground, or S2
  fails (see section 5).

---

## 4. Known gaps — disclose these

The funnel is real and green. These parts are not built yet, and the demo
should not imply otherwise.

1. **No producer for the gated blueprint sections.** The tiered
   `client_blueprint_sections` rows are written only by the test seed. Nothing
   converts a signed-off blueprint into preliminary/final sections yet — the
   schema, paywall, and renderer are done; the ingestion is not.
2. **The top-2-highlights email is not wired.** The template exists, uploads,
   and has `FINDING_1_TITLE`/`FINDING_2_TITLE` variables, but no code selects
   the two findings or sends it. Today the funnel sends the plain magic link.
3. **No client email on the client record.** Checkout uses `FUNNEL_TEST_EMAIL`
   as the payer; a real client would get a 400 until email lands on the record.
4. **The checklist is deterministic, not generative** — one question per final
   section from a fixed template — and a single upload is not linked to a
   specific question, so there is no per-question completion state.
5. **Booking is a static Cal.com link.** No embed, no API, no booking event
   consumed.
6. **Avatars are initials**, not Clerk profile images, on both surfaces.
7. **Webhook → Clerk linkage is not proven end-to-end.** S3 patches
   `clerk_user_id` directly after payment; provisioning itself is best-effort
   and never gates the unlock.
8. **`/audit/cancelled` is implemented but never exercised** by the funnel.
9. **Magic links do not expire.** The token is the credential and ends only by
   revocation (`bun run portal:tokens -- revoke --client <id>`).
10. **The email greets the company as if it were a person.** The magic-link
    template's `RECIPIENT_FIRST_NAME` is filled with the first word of the
    _company_ name (`magic-link-email.ts:131`), because no person's name exists
    on the client record. The fixture renders "Hi The,"; a real client named
    "Voes and Co" would render "Hi Voes,". Left unfixed deliberately — guessing
    a human first name out of a company name has no correct answer. It needs a
    contact name on the client record, the same missing field as gap 3, and
    that is a data-model change rather than a copy tweak. **Do not send a real
    magic-link email to a real prospect until this is fixed.**

---

## 5. Fixed while preparing this runbook

Three defects, all found by walking the chain rather than by reading it.

1. **`funnel.sh` forwarded webhooks to the wrong port.** `PORT` defaulted to
   `3000` while the browser suite's dev server binds `5180`
   (`scripts/verify/e2e-config.json`, bound with `--strictPort`). Every Stripe
   event went into a dead port, so S3 failed as "unlock never flipped" — which
   reads like a broken webhook, not a wrong port. The suite only passed for
   whoever exported `PORT` by hand. `PORT` is now derived from the same config
   the Playwright project reads.
2. **The live tier pointed at a deleted worktree.** `FUNNEL_LIVE=1` failed in
   preflight on a `podcasts-wt/e2e-smoke-blueprint-funnel-w1` path that no
   longer exists; it now resolves the sibling `podcasts/` checkout, the same
   way S1 already did.
3. **Half the blueprint was invisible.** Every block renderer hardcoded
   `text-ink/*`, but section bands alternate cream and ink and `--ink` is
   near-black — so body copy on every odd-indexed band painted black on black.
   The fixture's second section seeded a prose block and screenshotted as a bare
   title. A real 11-section blueprint would have lost half its content **with
   every test green**, because the text was in the DOM and only the paint was
   wrong. Block text and hairlines now inherit the band's own foreground, and a
   computed-style assertion in S2 fails if that regresses.
