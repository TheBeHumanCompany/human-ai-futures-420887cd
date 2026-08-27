# Deep Interview Spec: The Be Human Company — Site Restructure & Bug Fix Pass

## Metadata
- Interview ID: `di-behuman-site-restructure-2026-08-17`
- Rounds: 9 (+ Round 0 topology gate)
- Final Ambiguity Score: **6.5%**
- Type: brownfield
- Generated: 2026-08-17
- Threshold: 0.1
- Threshold Source: `/Users/siddicky/.claude/settings.json`
- Initial Context Summarized: no (original brief fit budget; two source PDFs read in full)
- Status: **PASSED**
- Repo: `human-ai-futures-420887cd` (git@github.com:TheBeHumanCompany/human-ai-futures-420887cd)
- Base commit: `main@a6a377a` ("Update site info for publish", 2026-08-17 21:00:56 UTC)

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.35 | 0.333 |
| Constraint Clarity | 0.95 | 0.25 | 0.238 |
| Success Criteria | 0.90 | 0.25 | 0.225 |
| Context Clarity | 0.95 | 0.15 | 0.143 |
| **Total Clarity** | | | **0.935** |
| **Ambiguity** | | | **0.065** |

## Topology

Confirmed at Round 0. Seven active components, zero deferrals.

| # | Component | Status | Description | Coverage |
|---|-----------|--------|-------------|----------|
| 1 | `asset-pipeline` | active | De-Lovable all 47 `.asset.json` pointers | AC-1.1 → AC-1.6 |
| 2 | `site-chrome` | active | Indigenous-led footer + cal.com booking wiring | AC-2.1 → AC-2.6 |
| 3 | `nav-ia` | active | Single flat top nav; Blueprint keeps its own sub-nav | AC-3.1 → AC-3.4 |
| 4 | `typography-system` | active | H1–H4 scale on Oswald / Work Sans | AC-4.1 → AC-4.5 |
| 5 | `new-human-era` | active | Rebuild `/the-new-human-era` from manifesto PDF | AC-5.1 → AC-5.7 |
| 6 | `blueprint-page` | active | Rebuild `/be-human-ai` from sales PDF v4 + controls.yaml | AC-6.1 → AC-6.8 |
| 7 | `human-archive` | active | Fix the four archive portraits | AC-7.1 → AC-7.3 |

## Goal

Cut a fresh branch from `main@a6a377a` and ship seven components to **production on Vercel**: repair the site-wide broken-image failure caused by Lovable asset pointers, replace the footer with the Indigenous-led version, wire every booking CTA to cal.com, flatten the navigation, establish a real H1–H4 typographic scale, and rebuild The New Human Era and the Be Human AI Blueprint pages from their approved source documents.

## Constraints

- **Source of truth is `main`.** Work branches from `main@a6a377a`. `feat/podbean-rss-integration` is **reference-only** — its 24 commits may be read for diagnosis and binary recovery, but **no commit from it is merged, rebased, or cherry-picked**. (User reaffirmed after being shown that the branch already implements components 1, 2, 3 and 6.)
- **Deploy target:** Vercel project `human-ai-futures-420887cd` (`prj_Zea77SyZVM7fiu9hr2zYi85Hf0jg`, `team_jdRpuzTRAuhpD7wqZrDdcwc7`).
- **Stack is fixed:** TanStack Start (React + TS), Vite/Nitro, Bun, Tailwind v4 (`@utility`), shadcn/ui, Sanity (`studio/`), PodBean RSS. No WordPress migration — ruled out on the 2026-08-17 call (TS/React vs PHP; security surface).
- **Fonts are already correct** and must not be changed: `styles.css:44-45` — `--font-display: "Oswald", "Arial Narrow"`, `--font-sans: "Work Sans"`, `--font-hand: "Caveat"`.
- **Blueprint content must be grounded in the real product**, not sales copy alone: `../thebehumancompany/framework/controls.yaml` (single source of truth) plus `framework/checklists/{cybersecurity,privacy_data,transparency_audit}.md`.
- **Typography requires sign-off before rollout** — a specimen page is approved by the user before the scale is applied to any page.
- **Archive stays at four entries** this pass. No CMS migration, no ingestion pipeline. *(partially superseded 2026-08-26 — see Amendment 8: the `/the-human-archive` page now ships four NEW video people; the `ARCHIVE` const itself stays four, and the CMS/ingestion non-goals stand)*
- **Booking URLs are fixed values:**
  - 15-min: `https://cal.com/the-be-human-company/15min`
  - 30-min: `https://cal.com/the-be-human-company/30min`

## Non-Goals

- Merging, rebasing or cherry-picking `feat/podbean-rss-integration`.
- Podcast / Sanity backend completion (episode ingestion, Studio deploy) — explicitly not selected at Round 0.
- Expanding the Human Archive beyond the existing four entries. *(partially superseded 2026-08-26 — see Amendment 8: `/the-human-archive` now renders four NEW video entries from `HUMAN_ARCHIVE_VIDEOS`; `ARCHIVE` stays four, and per-person `/human-archive/$slug` pages remain deferred)*
- Migrating the Human Archive to Sanity.
- A "Why We Exist" nav parent or an About dropdown — **killed in Round 4 (Contrarian)**.
- A `/why-we-exist` route.
- WordPress migration.
- Retaining the superseded `PRINCIPLES` copy set.

## Acceptance Criteria

### Component 1 — `asset-pipeline`
- [ ] **AC-1.1** A recovery script reads every `src/assets/*.asset.json`, fetches the binary from the live Lovable host using the pointer's `url` / `r2_key`, and writes it beside the pointer.
- [ ] **AC-1.2** The script reports, per asset, whether recovery succeeded — and lists by `asset_id` any file it could not retrieve. No silent skips.
- [ ] **AC-1.3** `grep -rn "asset.json" src --include="*.ts" --include="*.tsx"` returns **zero** matches. All imports reference real image files so Vite fingerprints and emits them.
- [ ] **AC-1.4** All 47 `.asset.json` files are deleted, including the three already-dead ones sitting beside real files (`hero.png.asset.json` et al).
- [ ] **AC-1.5** `src/lib/content.ts`, `src/lib/podcast/imagery.ts` and `src/routes/index.tsx` import images as files, not JSON.
- [ ] **AC-1.6** On the production deploy, no image request returns 404. The homepage collage, the four archive portraits, and all 39 podcast guest avatars render.

### Component 2 — `site-chrome`
- [ ] **AC-2.1** `site-footer.tsx` matches the approved Indigenous-led design: the strapline bar ("The future belongs to the most human"), the wordmark + positioning paragraph, **"Indigenous and Canadian-owned."**, and "Stay Human." in Caveat/lime.
- [ ] **AC-2.2** `Sydney · London · New York` is removed from both `site-footer.tsx:64` and `contact.tsx:46`.
- [ ] **AC-2.3** Every footer social link resolves to a real URL — no `href="#"` remains in `site-footer.tsx` or `social-section.tsx`.
- [ ] **AC-2.4** Two exported constants define booking, used everywhere: `BOOKING_URL_15MIN = "https://cal.com/the-be-human-company/15min"` and `BOOKING_URL_30MIN = "https://cal.com/the-be-human-company/30min"`. No cal.com URL is inlined at a call site.
- [ ] **AC-2.5** No Calendly reference exists anywhere in `src/`.
- [ ] **AC-2.6** A booking CTA is present in the site header and at the three points PDF v4 specifies on the Blueprint page.

### Component 3 — `nav-ia`
> **SUPERSEDED BY AMENDMENT 1.** AC-3.1 and AC-3.2 below were reversed on 2026-08-17 after
> WhatsApp evidence from Maya and Shane. Retained verbatim for audit; see Amendment 1 for the
> binding criteria (AC-3.1a … AC-3.7a).

- [ ] ~~**AC-3.1** `NAV` in `site-header.tsx` is a **flat** list. About remains one top-level item. No dropdown component is introduced.~~ *(reversed)*
- [ ] ~~**AC-3.2** No `/why-we-exist` route exists; "Why we exist" persists only as homepage section copy (`index.tsx:108`).~~ *(reversed)*
- [ ] **AC-3.3** Every page except the Blueprint page renders only the single top nav.
- [ ] **AC-3.4** The Blueprint page renders the single top nav **plus** its own in-page section sub-nav.

### Component 4 — `typography-system`
- [ ] **AC-4.1** `styles.css` defines one scale — H1, H2, H3, H4, eyebrow, body — on Oswald (display) and Work Sans (body), as reusable classes.
- [ ] **AC-4.2** The four competing display utilities (`display` w200, `display-strong` w600, `archive-question` w700, `section-label` w700) are consolidated into one documented weight set.
- [ ] **AC-4.3** A specimen page renders H1–H4 with live values for review.
- [ ] **AC-4.4** The user approves the specimen **before** the scale is applied to any page.
- [ ] **AC-4.5** After approval, `the-new-human-era.tsx` and `be-human-ai.tsx` contain **no bespoke inline `clamp()`** — they use scale classes only.

### Component 5 — `new-human-era`
- [ ] **AC-5.1** `/the-new-human-era` is rebuilt from `new h era copy final.pdf` (11 pages).
- [ ] **AC-5.2** All named sections are present: Human Wealth, Human Debt, Human Reps, Human Mode, The Double Return, "Some friction is where humans are built", The framework, "What we are actually building", The invitation.
- [ ] **AC-5.3** The framework chain renders as: Practise Humanity → Human Reps → Human Wealth → Better Life → Better World.
- [ ] **AC-5.4** The six principles render as *Fully Here · Keep Your Own Mind · Your Word Carries Weight · Real Is Rare · Know What Matters · Built in the Reps* (i.e. `HOME_PRINCIPLES`).
- [ ] **AC-5.5** The superseded `PRINCIPLES` const (`content.ts:41`, "Presence is the new luxury…") is deleted, and nothing references it.
- [ ] **AC-5.6** The three `[HUMAN ARCHIVE QUOTE #N]` placeholders are filled with real quotes from the four `ARCHIVE` entries.
- [ ] **AC-5.7** The page closes on "What's my Human Rep today?" → "Welcome to the New Human Era."

### Component 6 — `blueprint-page`
- [ ] **AC-6.1** `/be-human-ai` is rebuilt from `Be_Human_AI_Flagship_Sales_Page_Design_Ready_v4.pdf` (12 pages).
- [ ] **AC-6.2** All sections present: Hero → The Problem → Our Approach (Human Readiness / Security-Governance-Sovereignty / AI Strategy) → Canadian Trust & Sovereignty → Our Commitments → The Blueprint → Who It Is For → What You'll Receive (4 deliverables) → Client Proof → How It Works (3 steps) → What Waiting Costs → The Offer → The Team → Who We Work Best With → FAQ → Closing CTA.
- [ ] **AC-6.3** Pricing renders exactly: **$795 CAD** founding rate, **$1,500 CAD** future rate, **3 business days**.
- [ ] **AC-6.4** The page has its own in-page sub-nav linking those sections.
- [ ] **AC-6.5** The "Risk & Governance Review" content is grounded in `../thebehumancompany/framework/controls.yaml` and the three checklists — not sales copy alone.
- [ ] **AC-6.6** The hero uses a **Canadian maple leaf** glyph, replacing the current generic leaf.
- [ ] **AC-6.7** Team bios render for Shane James (Founder & CEO), Sid (AI, Cybersecurity & Governance), Maya (Human Readiness & Organizational Change).
- [ ] **AC-6.8** Every CTA uses the booking constants from AC-2.4.

### Component 7 — `human-archive`
- [ ] **AC-7.1** Exactly four entries — ADEWOLF, BELLA, ANTON, ARLINA — with their existing quotes, locations and archive numbers preserved.
- [ ] **AC-7.2** All four portraits render from committed binaries.
- [ ] **AC-7.3** Both `/the-human-archive` and the homepage archive section render with zero broken images.

### Cross-cutting
- [ ] **AC-X.1** Branch is cut from `main@a6a377a`; `git log` shows no commit originating from `feat/podbean-rss-integration`.
- [ ] **AC-X.2** `bun test src/` passes.
- [ ] **AC-X.3** `tsc --noEmit` (and the `scripts` / `studio` projects) passes.
- [ ] **AC-X.4** `eslint .` passes.
- [ ] **AC-X.5** All seven components are **live on the production domain** — the stated definition of done.

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|---|---|---|
| Lovable's published changes are on `main` | Pulled latest `main` (`a6a377a`) and grepped: no Indigenous footer, no `info@`, no cal.com anywhere in `src/`. `git log -S` located all of it on `feat/podbean-rss-integration` | Premise disproved. User reaffirmed "start fresh from main" with full knowledge; branch is reference-only |
| The feature branch is disposable | It holds 24 commits already implementing components 1, 2, 3, 6 — including a critic-reviewed pass | User's call, accepted. Rebuild fresh; branch read only for binary recovery + diagnosis |
| "About becomes a dropdown under Why We Exist" | Contrarian mode: About would be the *only* child — a one-item dropdown adding a click to a page users already reach in zero | Dropdown killed. About stays flat; "Why we exist" stays homepage section copy |
| The New Human Era page = the six `PRINCIPLES` | The manifesto PDF's principles match `HOME_PRINCIPLES`, not `PRINCIPLES` | `PRINCIPLES` is the superseded set — deleted. This is what "delete and rebuild" meant |
| The archive should reflect "200+ people" | Simplifier mode: 200 entries implies CMS migration + ingestion + 200 images; 4 implies fixing four files | Ship the four, fix the images. Growth is a later pass |
| Image bug is a homepage bug | It's 47 pointers spanning archive, 39 podcast avatars and the collage — a repo-wide pipeline failure | Promoted to its own top-level component at Round 0 |
| Blueprint and Be Human AI are separate pages | PDF v4 is a single flagship page whose product is the Blueprint; image 5's mockup sits under the `BE HUMAN AI` nav item | One page. Topology collapsed 8 → 7 |
| One cal.com link covers both durations | User initially pasted the 30-min URL twice, then corrected mid-interview with the 15-min URL | Two distinct links; two constants |
| Image 5 is the New Human Era hero | It shows the Blueprint hero and the "BOOK YOUR BLUEPRINT" CTA | It's the Blueprint hero — which is where the maple-leaf swap applies (AC-6.6) |

## Technical Context

**Root cause of the image failure (verified on `main`).** 47 `.asset.json` pointer files are imported as JSON and their `.url` used as an image `src` — `src/lib/content.ts:1-9` (4 archive portraits), `src/lib/podcast/imagery.ts:5-43` (39 guest avatars), `src/routes/index.tsx:7-9` (homepage collage). Each URL is of the form `/__l5e/assets-v1/<asset_id>/<file>`, a path only Lovable's own hosting serves. The dev-side proxy is `apply: "serve"` and a no-op unless `LOVABLE_PREVIEW_HOST` is set, and nothing rewrites it at build time — so the bare path is baked verbatim into both the client and SSR bundles and 404s in production. `hero.png` was already resolved as a real file import, which is why its `.asset.json` sits unused beside it. (Independently corroborated by the commit message of `13f53dc` on the reference branch.)

**Binary recovery status.** 4 archive portraits exist as real `.jpg` on `feat/podbean-rss-integration`; 3 pointers already have real files beside them; the remaining **40** (39 guest avatars + collage) exist nowhere in git and must be fetched from the live Lovable host.

**Typography, current state.** No scale exists. Eight distinct H1 `clamp()` values (from `clamp(2rem,5vw,3.5rem)` to `clamp(3.5rem,11vw,8.5rem)`) and seven distinct H2 values are declared inline across routes, against four `@utility` display classes at conflicting weights (200 / 600 / 700 / 700), further overridden inline by `font-extrabold`.

**Source documents.**
- `/Users/siddicky/Downloads/Be_Human_AI_Flagship_Sales_Page_Design_Ready_v4.pdf` — 12pp, ~16 sections, the Blueprint sales page.
- `/Users/siddicky/Downloads/new h era copy final.pdf` — 11pp, ~4,500 words, the New Human Era manifesto.
- `../thebehumancompany/framework/controls.yaml` — controls spine for AC-6.5.

**Known risk (unresolved, accepted).** `gpt-engineer-app[bot]` is still auto-committing to `main` — `a6a377a` landed at 21:00 UTC on 2026-08-17, mid-interview. If Lovable publishes during the rebuild, `main` moves under the branch and conflicts follow. No governing rule was established. Mitigation: rebase early and often; re-verify `origin/main` before opening the PR.

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Page | core domain | route, title, meta, sections | Page has many Sections; Page rendered under NavItem |
| NavItem | core domain | to, label | NavItem points to Page; flat list, no children |
| Footer | supporting | strapline, wordmark, navColumn, socialColumn, contactColumn, indigenousLine | Footer renders NavItems + SocialLinks |
| BookingLink | core domain | url, duration (15\|30) | Blueprint CTAs → 30min; general CTAs → 15min |
| Asset | core domain | filename, binary, fingerprint | Asset replaces AssetPointer; imported by Page |
| AssetPointer | external system | asset_id, project_id, url, r2_key | Lovable-only; to be deleted |
| TypeScale | core domain | h1, h2, h3, h4, eyebrow, body, family, weight | TypeScale governs all Pages |
| Blueprint | core domain | price, futurePrice, turnaround, deliverables[4] | Blueprint sold on blueprint-page; grounded in Controls |
| Control | external system | id, domain, checklist | Control sourced from controls.yaml |
| ArchiveEntry | core domain | name, location, no, slug, quote, image | ArchiveEntry quoted by new-human-era |
| Principle | core domain | n, title, body | Six Principles render on new-human-era |
| HumanRep | core domain | practice, trigger | HumanRep builds HumanWealth |
| HumanWealth | core domain | trust, relationships, presence | HumanWealth accrues from HumanReps |
| HumanDebt | core domain | accumulation, cost | HumanDebt is the inverse of HumanWealth |
| HumanMode | core domain | awareness, choice | HumanMode precedes a HumanRep |
| DoubleReturn | core domain | selfEffect, otherEffect | DoubleReturn is the outcome of a HumanRep |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 9 | 9 | – | – | N/A |
| 2 | 9 | 0 | 0 | 9 | 100% |
| 3 | 10 | 1 | 0 | 9 | 90% |
| 4 | 10 | 0 | 0 | 10 | 100% |
| 5 | 16 | 6 | 0 | 10 | 63% |
| 6 | 16 | 0 | 0 | 16 | 100% |
| 7 | 16 | 0 | 0 | 16 | 100% |
| 8 | 16 | 0 | 0 | 16 | 100% |
| 9 | 16 | 0 | 0 | 16 | 100% |

The single dip at Round 5 is the manifesto PDF introducing the brand's real domain vocabulary (HumanRep, HumanWealth, HumanDebt, HumanMode, DoubleReturn, Principle) — expansion, not drift. Stable at 16 for five consecutive rounds.

## Interview Transcript

<details>
<summary>Full Q&A (Round 0 + 9 rounds)</summary>

### Round 0 — Topology
**Q:** Is the 5-component reading right? → then: which components to add? → then: is Blueprint separate from Be Human AI?
**A:** "Add a component" → Human Archive + Asset pipeline + Be Human AI → "the blueprint is based off `Be_Human_AI_Flagship_Sales_Page_Design_Ready_v4.pdf` and `framework/controls.yaml`"
**Result:** 7 components locked, 0 deferred.

### Round 1 — Constraint Clarity (all 7)
**Q:** Where does the work land, and what happens to Maya's Lovable build?
**A:** "Lovable changes were published, so do a git pull on main. It will be the source of truth."
**Ambiguity:** 53% (Goal 0.62, Constraints 0.30, Criteria 0.20, Context 0.85)

### Round 2 — Constraint Clarity (all 7)
**Q:** Given `feat/podbean-rss-integration` already implements components 1, 2, 3 and 6 — does "start fresh" still stand?
**A:** "Still start fresh from main."
**Ambiguity:** 42% (Goal 0.65, Constraints 0.62, Criteria 0.25, Context 0.88)

### Round 3 — Success Criteria (all 7)
**Q:** What has to be true for you to call this done?
**A:** "Live on production domain."
**Ambiguity:** 31% (Goal 0.68, Constraints 0.68, Criteria 0.60, Context 0.88)

### Round 4 — Goal Clarity (`nav-ia`) — **CONTRARIAN**
**Q:** Does "Why We Exist" need to be a nav item at all? A one-item dropdown adds a click.
**A:** "You're right — keep About flat."
**Ambiguity:** 27% (Goal 0.78, Constraints 0.68, Criteria 0.60, Context 0.90)

### Round 5 — Goal Clarity (`new-human-era`)
**Q:** What is The New Human Era page supposed to contain?
**A:** "Base it off `new h era copy final.pdf`."
**Ambiguity:** 23% (Goal 0.88, Constraints 0.68, Criteria 0.62, Context 0.92)

### Round 6 — Goal Clarity (`human-archive`) — **SIMPLIFIER**
**Q:** What's the smallest version of the Human Archive still worth shipping — 4 or 200?
**A:** "Ship the 4, fix the images."
**Ambiguity:** 19% (Goal 0.93, Constraints 0.70, Criteria 0.68, Context 0.94)

### Round 7 — Constraint Clarity (`asset-pipeline`)
**Q:** Where do the 40 missing image binaries come from?
**A:** "Pull them from the live Lovable host."
**Ambiguity:** 14% (Goal 0.94, Constraints 0.85, Criteria 0.72, Context 0.95)

### Round 8 — Success Criteria (`typography-system`)
**Q:** How will we know the typography system is correct?
**A:** "I propose the scale, you approve it."
**Ambiguity:** 10.5% (Goal 0.95, Constraints 0.80, Criteria 0.88, Context 0.95)

### Round 9 — Constraint Clarity (`site-chrome`)
**Q:** What is the cal.com booking URL?
**A:** `https://cal.com/the-be-human-company/30min`, corrected mid-turn to add `https://cal.com/the-be-human-company/15min`
**Ambiguity:** 6.5% (Goal 0.95, Constraints 0.95, Criteria 0.90, Context 0.95) — **threshold met**

</details>

---

## Amendment 1 — 2026-08-17, post-interview

New evidence arrived after the interview closed: Maya Brstilo's WhatsApp thread (2026-08-15 →
2026-08-17) and a live staging environment. Amendments are additive and marked; no original
criterion was deleted, only superseded in place with the supersession recorded.

### New evidence
| Source | Finding |
|---|---|
| `staging.thebehumancompany.ca` | **Live, HTTP 200**, running `feat/podbean-rss-integration` — nav shows `WHY WE EXIST ⌄ / CONTACT / BLUEPRINT ⌄`, which `main` does not have. This is the environment Maya reviews against. |
| Maya, 08-15 13:46 (+ staging screenshot) | *"I like these style of 'Why We Exist' and 'Explore…' and 'Read More…' style buttons better than what is currently on the different sections. **Let's go with this design.**"* |
| Shane, 08-15 12:06 (group) | *"Drop down when they click why exist goes to a second page who we are — those are separate pages — who we are explains us and sells my creds."* |
| Maya, 08-15 15:56 | *"lovable created all of the pages by default. The only page I actually created was the homepage."* |
| Maya, 08-16/17 | Four New Human Era layout mockups → `.omc/artifacts/maya-mockups/` |
| Verified by lead | `__root.tsx:104` already loads **Work Sans 300** — the mockups' second display voice needs **no new font file** |

### Reversal of the Round 4 decision
Round 4 (Contrarian) flattened the nav on the argument that About would be a dropdown's **only**
child. That premise was false: Shane's structure nests two distinct pages, and Blueprint carries
three. The user re-decided on 2026-08-17 with the corrected premise.

**Binding nav tree:**
`ABOUT ⌄ (Why We Exist · Who We Are) | THE NEW HUMAN ERA | THE HUMAN ARCHIVE | PODCAST | CONTACT | [BLUEPRINT ⌄ pill] (Human Readiness · Governance & Sovereignty · AI Strategy)`
*(superseded 2026-08-26 — see Amendment 8 for the binding seven-item flat tree)*

### Amended acceptance criteria
- [ ] **AC-3.1a** `site-header.tsx` renders the **Amendment 8 binding nav tree** — **seven flat top-level items** (Why We Exist, Who We Are, The New Human Era, The Human Archive, Podcast, Contact, Blueprint) with **zero dropdown parents**. *(supersedes AC-3.1; restated 2026-08-26 by Amendment 8 — the About and Blueprint dropdowns are gone)*
- [ ] **AC-3.2a** "Why We Exist" and "Who We Are" are **direct top-level nav links** to `/why-we-exist` and `/who-we-are`, both live (200). *(supersedes AC-3.2; repurposed 2026-08-26 by Amendment 8 — they are no longer About-dropdown children)*
- [ ] **AC-3.5a** A new `/who-we-are` route exists, drafted from Blueprint PDF v4 pp.9–10 (Shane James · Founder & CEO; Sid · AI, Cybersecurity & Governance; Maya · Human Readiness & Organizational Change) plus the "Built for Human-First AI Transformation" section. Shane reviews before production.
- [ ] **AC-3.6a** Blueprint's three pillar destinations exist: Human Readiness, Governance & Sovereignty, AI Strategy.
- [ ] **AC-3.7a** The Blueprint nav item is **the sole CTA** in the nav, rendered as an **outline lime pill at rest that fills lime on hover** (meeting 2026-08-22: "button with green outline once we hover on it"), visually distinct from the six text nav items. *(restated 2026-08-26 — Amendment 8)*
- [ ] **AC-4.6a** The type scale covers **two** display voices: condensed uppercase (Oswald) and large light sentence-case (**Work Sans 300**, already loaded). The AC-4.3 specimen shows both.
- [ ] **AC-5.8a** `/the-new-human-era` is built to the four mockups in `.omc/artifacts/maya-mockups/`: alternating cream/black full-bleed bands; eyebrow above a short lime rule; lime used only as accent (rule, single-word underline, quote glyphs, divider dot); alternating image-left/right splits; ~8px rounded imagery.
- [ ] **AC-5.9a** Principle titles carry **no trailing periods** (Maya, 08-15 12:47). `HOME_PRINCIPLES` is updated accordingly.
- [ ] **AC-2.7a** CTA labels read **"Explore the archive"** (not "Explore the human archive") and **"Read the New Human Era"** (not "Learn more").
- [ ] **AC-2.8a** A maple leaf sits **beside the "Indigenous-led" line** (Maya, 08-15 18:47) — this locates AC-6.6's leaf.
- [ ] **AC-6.9a** The Blueprint page is built **section by section and digestible** — Maya, 08-15 13:57: *"it just feels like information overload for the blueprint. We need to make that page more digestible."* Rendering all 16 PDF sections at equal weight fails this criterion.

### What the 2026-08-19 external review changed
An adversarial pass over this amendment rejected it, correctly, on four points,
all now closed:
- The honeypot returned success while discarding the message, and the page said
  "that reached us". Nothing is sent, so nothing is confirmed — it returns
  `ignored` and shows the fallback.
- The confirmation claimed delivery on a provider 2xx, which is acceptance.
- AC-3.2c's registered proof named a playwright test that did not exist.
- Copy fidelity was claimed but unverifiable: the PDFs lived in a WhatsApp store
  outside the repo. They are now committed under `docs/source/` and enforced by
  `src/lib/copy-fidelity.test.ts`, which found and fixed a real defect on the
  way in — an earlier draft of the founder page had silently expanded every
  contraction in Shane's first-person voice.

It also surfaced a defect in someone else's lane worth recording: the
fault-injection fixture omitted `data-section-id` on section-level `<details>`,
so `prod-acceptance.sh` failed at AC-6.9b/c and **every later fault case was
passing on the wrong rejection**. Fixed; that suite is now 14/14.

### Open items created by this amendment
1. **Brett's testimonial is still unwritten** (Maya, 08-15 15:52: *"We still need to get a quote from Brett"*). PDF v4 pp.7 and 12 carry placeholders. Blueprint cannot ship complete without it.
2. **"Lindsay / Vancouver"** is quoted in mockup 2 but is not one of the four `ARCHIVE` entries.
3. **Archive mockup shows five portraits** (1 large + 4 small); Round 6 settled on four.
4. Staging exists as a review environment — the plan previously assumed production only.

**Unchanged by this amendment:** the branch decision. Work still starts fresh from `main@a6a377a`;
`feat/podbean-rss-integration` remains reference-only and is not merged, despite staging running it.

---

## Amendment 2 — 2026-08-17, open questions resolved

Eight decisions the consensus loop escalated. All are user decisions, now closed. These
supersede any conflicting reading in the plan.

| # | Question | **Decision** |
|---|---|---|
| 1 | Typography consolidation scope | **47 occurrences** — the four AC-4.2 utilities (`display` 24, `archive-question` 4, `section-label` 8, `display-strong` 0/dead) **plus** `section-label-{dark,light,rule}` (11). **`eyebrow` (45) is explicitly OUT of scope** and left as-is. |
| 2 | Does Blueprint tiering satisfy AC-6.2's "16 sections present"? | **Yes — present ≠ equally prominent.** Tiering approved: 3 sections → summary cards linking to pillar routes, 7 → collapsed, 6 → fully visible. All 16 remain in the DOM, in PDF order. |
| 3 | Brett's testimonial (does not exist) | **Render the Client Proof section with its heading and `id`, and mark the testimonial slot visibly pending.** No lorem, no invented quote. 16/16 holds. |
| 4 | 85.4 MB of originals in git history | **Yes — commit them.** AC-1.1 stands as written: byte-identical originals beside their pointers, WebP derivatives serve the browser. User accepts this is irreversible under `AGENTS.md`. |
| 5 | Sovereignty wording on public copy | **Describe sovereignty through practices only** — no-train terms, PII redaction at the model boundary, audit trail, key management, exit/portability. **Assert no domain definition.** Ships valid under both the whitepaper and the rescoped `controls.yaml`. |
| 6 | "Lindsay / Vancouver" + the 5-portrait grid | **Mockups are illustrative.** Archive stays at the real four (ADEWOLF, BELLA, ANTON, ARLINA). The three `[HUMAN ARCHIVE QUOTE #N]` slots are filled from those four. Layout uses four portraits. |
| 7 | Review venue for the two human gates | **Staging.** The working branch deploys to `staging.thebehumancompany.ca`; Maya reviews design and Shane reviews `/who-we-are` there; production promotion only after both gates clear. Staging also rehearses the production acceptance checks. |
| 8 | Lovable bot auto-committing to `main` | **Pause Lovable publishing for the branch's lifetime.** Design changes arrive as mockups, not published edits. This eliminates the merge-conflict class and the reverting-bot risk (R2) structurally. |

### Amended criteria
- [ ] **AC-4.2b** The consolidation covers exactly the **47** occurrences in decision 1. The derived floor in `docs/type-inventory.md` must be produced by a **string-literal** scanner (not a `className="…"`-attribute regex), because two real call sites are otherwise invisible: `src/routes/podcast_.$slug.tsx:150` (`const SECTION_HEADING = "section-label …"`) and `src/components/episode-player.tsx:138` (`className={cn("eyebrow …")}`). *(supersedes AC-4.2's scope ambiguity)*
- [ ] **AC-6.10a** The Client Proof section renders with heading and `id`; the testimonial slot is explicitly marked pending. Nothing is fabricated and no section is omitted. *(resolves the AC-6.2 / S6.9 contradiction)*
- [ ] **AC-6.11a** Public sovereignty copy asserts **no domain definition** and describes practices only. A prohibited-claim test asserts the rendered page contains no compliance-guarantee or certification claim, per `controls.yaml:5`.
- [ ] **AC-X.6a** The branch is deployed to `staging.thebehumancompany.ca` and both human gates (typography specimen, `/who-we-are` review) are recorded as cleared **before** production promotion.

### Actions this creates outside the codebase
1. **Someone must tell Maya to pause Lovable publishing** (decision 8). Until confirmed, the plan must assume the no-pause case and keep the hand-reconciled merge strategy live.
2. **Brett's quote is still needed** before Blueprint is complete, even though it no longer blocks the gate.
3. **Six social URLs are still missing** (YouTube, LinkedIn, Instagram, TikTok, Spotify, X) — `site-footer.tsx:43` has `href="#"` for all six. Blocks AC-2.3 only.

**Unchanged:** the branch decision. Fresh from `main@a6a377a`; `feat/podbean-rss-integration` remains
reference-only and is never merged, rebased, or cherry-picked.

---

## Amendment 3 — 2026-08-17, contradictions resolved

Two mutually-unsatisfiable criteria found by the Codex critic pass, now resolved by the user.

### Decision 1 — The Indigenous line
Three variants were in circulation: `"Indigenous and Canadian-owned."` (Lovable footer screenshot,
implemented by AC-2.1), `"Indigenous-led"` (Maya, WhatsApp 08-15 18:47, asserted by AC-2.8a), and
`"Indigenous-founded. Canadian-built."` (Blueprint PDF v4 hero). AC-2.1 and AC-2.8a could not both pass.

**CANONICAL STRING — site-wide, exactly:** `Indigenous-led. Canadian-built`

- [ ] **AC-2.1b** The footer renders exactly `Indigenous-led. Canadian-built`. *(supersedes AC-2.1's "Indigenous and Canadian-owned.")*
- [ ] **AC-2.8b** The maple leaf sits immediately beside that string. Implementation and proof consume **one shared constant** — neither may hardcode the copy independently. *(supersedes AC-2.8a)*
- [ ] **AC-6.12a** The Blueprint hero uses the same constant, replacing PDF v4's `"Indigenous-founded. Canadian-built."`

### Decision 2 — Progressive disclosure mechanism
Codex server-rendered the vendored Radix accordion and demonstrated: two closed items produced
**8** `[data-state="closed"]` matches and **0** bodies — so the planned `≥6 closed` gate passes with
only two empty items — and with JavaScript disabled the server-rendered regions cannot be opened.
`forceMount` fixes DOM presence but not the no-JS toggle.

- [ ] **AC-6.9b** Collapsed Blueprint sections use **native `<details>/<summary>`**, not Radix accordion. Content is in the DOM and openable with JavaScript disabled. *(supersedes AC-6.9a's mechanism; its five sub-assertions stand)*
- [ ] **AC-6.9c** The collapsed-count gate counts **uniquely identified section containers**, not nested state attributes — the previous selector counted 8 for 2 sections.
- [ ] **AC-6.9d** The 40% ratio is defined as **visible normalized prose characters ÷ complete normalized prose characters**, measured against a canonical content fixture, with explicit minimum numerator and denominator floors so it cannot pass vacuously.

### Decision 3 — The principles period contradiction
AC-5.4 required `"Built in the Reps."` (with period, per PDF); AC-5.9a forbids trailing periods;
`content.ts:82` currently reads `"Build the reps."` — three forms of one principle.

- [ ] **AC-5.4b** The six principles render **period-free**, from a single shared fixture consumed by both implementation and proof: `Fully Here · Keep Your Own Mind · Your Word Carries Weight · Real Is Rare · Know What Matters · Built in the Reps`. *(supersedes AC-5.4; AC-5.9a governs)*

### Decision 4 — Human-review artifacts (third occurrence of the same defect)
`.omc/state/shane-review-who-we-are.json` is gitignored (`.gitignore:27`), yet the release gate
blocks on it and CI runs from a clone. The typography artifact was moved to a tracked path in an
earlier pass; this one was introduced afterwards and repeats the defect.

- [ ] **AC-X.7a** **Every** human-review artifact lives under tracked `.approvals/`, is schema-validated, and is bound to both the deployment URL and the commit SHA it approves. No release gate may depend on a gitignored path. A CI check asserts `git check-ignore` rejects nothing under `.approvals/`.

---

## Amendment 4 — 2026-08-18

### Decision 1 — Typography gate cleared in advance
User: *"Typography good to go."*

- [ ] **AC-4.4b** The G1 typography gate is **cleared in advance**. Phases 4, 5 and 6 are unblocked and do not wait on a sign-off round. *(supersedes AC-4.4's blocking behaviour)*
- The specimen (AC-4.3) is **still built** — it is how the scale gets defined and reviewed — but it is presented for information, not as a stop-the-line gate.
- `.approvals/typography.json` still records `scale_sha256` once the scale block exists, so the "approved one scale, shipped another" check survives.
- **Noted risk, accepted:** approving before the specimen exists removes the protection AC-4.4 was written for — a wrong scale reaching all 47 call sites unseen. Mitigation: the specimen is shown as soon as it exists, and the scale is one file to change.

### Decision 2 — `/who-we-are` scope
User: *"For now keep the main cards in who we are. They will be expanded to detailed pages for each member later."*

- [ ] **AC-3.5b** `/who-we-are` renders the **three team cards only** — Shane James (Founder & CEO), Sid (AI, Cybersecurity & Governance), Maya (Human Readiness & Organizational Change) — sourced from Blueprint PDF v4 pp.9–10. **No per-member detail routes in this pass.** *(clarifies AC-3.5a)*
- Cards must be built so per-member pages can be added later without restructuring — card content lives in one data module, not inline JSX.
- Non-goal, explicit: `/who-we-are/<member>` routes.

### Decision 3 — Social URLs: NOT recoverable, still open
User asked to take them from the live site. **They are not there.** Verified 2026-08-18:
- `https://www.thebehumancompany.ca/` renders the labels (YouTube, LinkedIn, Instagram, TikTok, **Snapchat**) with **`href="#"` on every one** — same as `main`.
- `staging.thebehumancompany.ca` and the Lovable preview return no social URLs.
- Neither repo, nor the PodBean feed, contains a company social URL.

Web search surfaces only **Shane's personal accounts** — `ca.linkedin.com/in/shanejeremyjames`, `youtube.com/c/ShaneJeremyJames`, `instagram.com/shanejjames`, `x.com/shanejjames`. **No TikTok or Snapchat account found**, though the footer lists both.

**RESOLVED 2026-08-18 — user supplied three URLs. All verified HTTP 200 on that date:**

| Platform | URL | Status |
|---|---|---|
| LinkedIn | `https://www.linkedin.com/company/the-be-human-company/` | 200 — company page |
| Instagram | `https://www.instagram.com/thebehumancompany/` | 200 — company account |
| YouTube | `https://www.youtube.com/@shanejeremyjames` | 200 — store the resolved `www.` form; the supplied `youtube.com/@…` 301s to it |

- [ ] **AC-2.3b** These three live in one shared constant module (with `INDIGENOUS_LINE` and the booking URLs); no call site inlines a social URL. *(supersedes AC-2.3's "no `href="#"` remains" for these three)*

**RESOLVED 2026-08-18 — TikTok and Snapchat are REMOVED.** No account exists for either. User decision: remove rather than link.

- [ ] **AC-2.3c** `SOCIAL` in `site-footer.tsx:4` and the platform list in `social-section.tsx:101` contain **exactly three** entries — LinkedIn, Instagram, YouTube. TikTok and Snapchat are deleted, along with any now-unused icon components (e.g. `SnapchatIcon`, `social-section.tsx:78`). A test asserts the rendered footer contains no TikTok or Snapchat text and exactly three social links, each with an `https://` href.
- **Component 2 has no remaining content blockers.** Every value it needs is now known: the three social URLs, `INDIGENOUS_LINE = "Indigenous-led. Canadian-built"`, and both cal.com booking URLs.

---

## Amendment 5 — 2026-08-18, execution-time decisions

Two surfaced by worker-3 during Phase 3. Both are visible product changes; neither was decided by inference.

### Decision 1 — Socials are FOUR, not three
`social-section.tsx` shipped **seven** platforms — Facebook and X in addition to the five previously known. Amendment 4's "exactly three" would have silently dropped both.

**User decision: keep X, drop Facebook.**

- [ ] **AC-2.3d** The social list is **exactly four**, all verified HTTP 200 on 2026-08-18: *(supersedes AC-2.3c's "exactly three")*

| Platform | URL |
|---|---|
| LinkedIn | `https://www.linkedin.com/company/the-be-human-company/` |
| Instagram | `https://www.instagram.com/thebehumancompany/` |
| YouTube | `https://www.youtube.com/@shanejeremyjames` |
| X | `https://x.com/shanejjames` — store this form; `twitter.com/shanejjames` 301s to it |

- **Removed:** TikTok, Snapchat, Facebook — with their orphaned icon components (`TikTokIcon`, `SnapchatIcon`, `FacebookIcon`). `XIcon` is **retained**.
- The list is data-driven from `brand.ts`; `social-links.sh` reads it rather than hardcoding names.

### Decision 2 — `/about` stays live; `/why-we-exist` is a new page
The plan recommended repurposing `/about` with a 301. That changes a live URL, and §11 Q9 was never resolved.

**User decision: create `/why-we-exist` fresh, keep `/about` live and reachable.** *(superseded 2026-08-26 — see Amendment 8: `/about` now permanently 301-redirects to `/who-we-are`)*

- [ ] **AC-3.2b** `/why-we-exist` exists as a **new route**. ~~`/about` remains live at its current URL, unredirected.~~ **`GET`/`HEAD` `/about` answers a permanent 301 with `Location: /who-we-are`** (search string preserved; non-GET/HEAD passes through to the framework; `/about` leaves the sitemap while `/who-we-are` stays). *(supersedes S3.6c's 301 recommendation; closes §11 Q9; the no-redirect clause reversed 2026-08-26 — see Amendment 8)*
- [ ] ~~**AC-3.8a** The About dropdown parent **links to `/about`**, so the page is not orphaned from navigation while its two children (Why We Exist, Who We Are) sit beneath it.~~ *(reversed 2026-08-26 — Amendment 8: the About dropdown no longer exists; `/about` is a 301)*
- Rationale: zero live-URL risk — no existing link, bookmark, or search result breaks. Reversible to a 301 later via `nav.ts` plus a redirect, with no structural rework. *(the 301 option was taken 2026-08-26 — Amendment 8)*

### Also corrected during execution
- **`brand.ts` vs `booking.ts` conflict.** The lead's brief said all constants live in `brand.ts`, but AC-2.4's layering proof asserts no file outside `src/lib/booking.ts` contains `cal.com`. Resolution: literals in `booking.ts`, re-exported by `brand.ts` (the re-export contains no `cal.com` substring). Both criteria satisfied, neither weakened.
- **`site-header.tsx` has no booking CTA on this branch** — the plan's `S3.5` line references (`:46-63`) are stale and point at the hamburger button. AC-2.6's header CTA is being **added**, not rewired.
- **`bun test src/` never executed `scripts/**`** — both fault-injection suites would have sat permanently unrun. `test:scripts` added and wired into the Phase 8 gate.
- **`ac-inventory.ts` would have parsed the spec from gitignored `.omc/`** — the AC-X.7a defect applied to the spec itself. A tracked copy now lives at `docs/spec/`, with a SHA-256 guard against drift.

---

## Amendment 6 — 2026-08-19, the Human Archive is deferred

**User decision (Sid, 2026-08-19): hold the Human Archive back — "we can use to be released soon or something similar".**
*(superseded 2026-08-26 — see Amendment 8: the archive is restored with four video people)*

The four entries are real and stay on the site. The homepage archive section and
the `/the-new-human-era` portrait row both render them from `ARCHIVE`, unchanged.
What is deferred is the archive as a *destination*: `/the-human-archive` drops
its portrait grid for a teaser that says **"To be released soon"**, and the
per-entry route `/human-archive/$slug` — four pages whose own copy read "This
archive entry is being prepared" — is deleted rather than left promising a
conversation the site cannot yet show. *(the destination-deferral superseded
2026-08-26 — see Amendment 8: the grid is restored with four NEW video entries;
the `$slug` deletion stands)*

The route stays live and stays in the nav. It is linked from the bar, from the
homepage section and from `/the-new-human-era`; a destination that admits it is
not ready beats three dead ends. The homepage CTA reads **"Coming soon"** rather
than "Explore the archive", because a label has to match what is behind it.
*(superseded 2026-08-26 — Amendment 8: the homepage CTA returns to "Explore
the archive"; the banned wording "Explore the human archive" stays banned)*

- [ ] **AC-7.3a** The four entries render with zero broken images on the **homepage archive section** and on the `/the-new-human-era` portrait row, both reading from `ARCHIVE`. ~~`/the-human-archive` carries the deferral notice — the words "to be released soon" — and names no entry,~~ and `src/routes/human-archive.$slug.tsx` does not exist. *(supersedes AC-7.3; the deferral clauses and the AC-2.7a narrowing reversed 2026-08-26 — see Amendment 8 and AC-7.4a/AC-7.5a)*

AC-7.1 and AC-7.2 are untouched, and that is what makes this a deferral rather
than a deletion: the entries, their quotes, their archive numbers and their
committed binaries are preserved exactly. Restoring the archive is a revert of
the deferral commit, not a rebuild.

### What the 2026-08-19 external review changed
An adversarial pass over this amendment rejected it, correctly, on four points,
all now closed:
- The honeypot returned success while discarding the message, and the page said
  "that reached us". Nothing is sent, so nothing is confirmed — it returns
  `ignored` and shows the fallback.
- The confirmation claimed delivery on a provider 2xx, which is acceptance.
- AC-3.2c's registered proof named a playwright test that did not exist.
- Copy fidelity was claimed but unverifiable: the PDFs lived in a WhatsApp store
  outside the repo. They are now committed under `docs/source/` and enforced by
  `src/lib/copy-fidelity.test.ts`, which found and fixed a real defect on the
  way in — an earlier draft of the founder page had silently expanded every
  contraction in Shane's first-person voice.

It also surfaced a defect in someone else's lane worth recording: the
fault-injection fixture omitted `data-section-id` on section-level `<details>`,
so `prod-acceptance.sh` failed at AC-6.9b/c and **every later fault case was
passing on the wrong rejection**. Fixed; that suite is now 14/14.

### Open items created by this amendment
- `/the-new-human-era` keeps its "Explore the archive" button, which now lands
  on the teaser. AC-2.7a pins that label, so changing it is a further amendment,
  not an execution-time call.
- `/the-human-archive` stays in the sitemap at `changefreq: weekly`. Accurate
  again the day the archive lands; mildly overstated while it is a teaser.

---

## Amendment 7 — 2026-08-19, Maya's outstanding pages, and Contact removed

Three decisions, all taken with the documents Maya sent on 08-18 and 08-19 in hand.

### 1. "About the Founder" is built from the PDF, not the mockup copy
She sent eleven design screens and, one second later, a four-page PDF captioned
"I will make sure to provide you with the proper text and images". The screens
carry a condensed third-person retelling; the PDF is first person and complete.
The PDF is used verbatim, because the PDF is what she called the proper text.

Her section spine is kept (MEET THE FOUNDER → EARLY YEARS → BUILDING AT SCALE →
the black pull-quote band → MEDIA · LEADERSHIP · TRAINING → ACTIONS OF COMPASSION
→ WHY THIS WORK), plus one kicker that is **not** hers — HUMAN PERFORMANCE —
because the PDF's Brainwave Synergy passage has no slot in her design.

**The photographs landed the same day.** The page first shipped as type only —
the pictures existed solely flattened inside her JPEG mockups, and an empty
frame waiting for one is the placeholder this repo's gates exist to keep out of
production. Sid supplied the ten originals on 2026-08-19; they are converted to
WebP at display width (~1MB total against ~2.4MB of source JPEG), imported so
the bundler fingerprints them, and each carries real alt text.

Two deviations from her mockup, both stated rather than hidden: her BUILDING AT
SCALE and MEDIA rows repeat the same three photographs, so the media row takes
the two she uses further down and every picture appears exactly once; and WHY
THIS WORK stays type, because the closing portrait in her design has no
counterpart in what was sent.

- [ ] **AC-3.9a** `/about-the-founder` exists and renders the 08-18 PDF's copy — the hero, five body sections, the "Businesses don't grow because of products" band, and the closing belief — verbatim, with **zero** accepted divergences, held to `docs/source/meet-the-founder.txt` sentence by sentence. Ten photographs render, every one a fingerprinted bundle import rather than a hand-written path, each with alt text longer than fifteen characters; there is exactly one `<img>` in the file, inside the shared `Shot` component, so no photograph can bypass the common treatment. No empty `<figure>`, no `placeholder`/`coming soon`/`TODO` string, and the page design she drew is not itself shipped as content. It is reachable from `/who-we-are` (Shane's card), and it is **not** a nav item.

### 2. Contact stays, and its form actually sends
The page was first removed as redundant: it offered `info@thebehumancompany.ca`
and the cal.com booking link, both already in the footer, plus an enquiry form.
**Sid reversed that mid-pass — fix the form instead.** The removal is reverted in
full; the nav keeps its six items and AC-3.1a stands unamended.

The form deserved the suspicion. Its only submit handler was
`onSubmit={(e) => e.preventDefault()}`, so it accepted enquiries, cleared, and
discarded every one, with nothing on the page or in the logs to say so. It now
posts to a server function that mails the enquiry.

**Address.** The instruction named `info@behumancompany.ca`. That domain has no
MX and no A record (checked 2026-08-19), so mail to it is not slow, it is gone.
The canonical `info@thebehumancompany.ca` — the address already on the footer
and the contact page, whose domain carries Google Workspace MX — is what the
form sends to, and it is now one constant, `CONTACT_EMAIL` in `brand.ts`, rather
than three hand-typed copies.

**Transport.** The deploy target cannot open outbound SMTP, so delivery goes
over Resend's HTTP API. Both prerequisites were satisfied on 2026-08-19: the
`RESEND_API_KEY` (send-only restricted) is set, and the sending domain
`updates.thebehumancompany.ca` is verified — a subdomain, not the apex, so the
mailbox people actually read keeps its own MX and SPF and cannot inherit a
deliverability problem caused by website mail. The key is set locally and in all
three Vercel environments.

**What was actually observed**, stated at the strength of the evidence: a
submission through the form returned a Resend 2xx with a message id, and the
page rendered its confirmation. Nobody has opened the shared mailbox to confirm
the message landed, and this system consumes no `email.delivered` webhook, so
delivery itself is **unverified**. An earlier draft of this paragraph said the
message "arrives at the shared mailbox" and quoted a confirmation string the
page no longer shows; it had the evidence for neither, and it contradicted
AC-3.11a's own acceptance-not-delivery wording below. Caught in review.

Before verification the same path returned 403 and the form said so rather than
confirming, which is the behaviour that matters: a silent success is the defect
being fixed, so every non-2xx, throw, and missing key returns a visible failure
carrying the direct-email fallback.

- [ ] **AC-3.11a** The `/contact` form submits to a server function that mails the enquiry to `CONTACT_EMAIL`, with `reply_to` set to the sender. No submit path resolves to `preventDefault()` alone. Across **every** reachable outcome — accepted, provider refusal, provider error, network throw, missing key, invalid input, honeypot — the visitor sees a confirmation **only** where the provider answered 2xx; every other outcome renders the direct-email fallback. The honeypot returns `ignored`, not success: nothing is sent, so nothing is confirmed. The confirmation says the message is *on its way*, not that it was delivered, because a 2xx is acceptance for delivery and a message can still bounce or be suppressed afterwards.

### 3. "Why We Exist" is completed from her document
Her four screens end at Human Reps / Human Wealth, but her document does not:
"there is still text that needs to be added" (08-19 08:52). The missing tail is
the four connected pieces, "this is just the beginning", and the closing
sequence. Copy verbatim; the layout for the four pieces is ours, since her
screens have none — each piece is a link, because each is a real destination.

- [ ] **AC-3.2c** `/why-we-exist` carries the 08-18 document, ending with the four connected pieces (Be Human AI, The New Human Era, The Human Archive, The People-Driven CEO Podcast — each linking to its own route) and the closing lines through "That's not a hope. That's the plan." Held to `docs/source/why-we-exist.txt` sentence by sentence. It is **not** wholly verbatim, and the exceptions are enumerated rather than averaged away: three sentences her own 08-19 screens shorten or trim, and the `Indigenous-founded` → `Indigenous-led` substitution that `layering.test.ts` enforces. Each exception is asserted to still be a real divergence, so the list cannot become a standing licence to drift. *(clarifies AC-3.2b)*

### What the 2026-08-19 external review changed
An adversarial pass over this amendment rejected it, correctly, on four points,
all now closed:
- The honeypot returned success while discarding the message, and the page said
  "that reached us". Nothing is sent, so nothing is confirmed — it returns
  `ignored` and shows the fallback.
- The confirmation claimed delivery on a provider 2xx, which is acceptance.
- AC-3.2c's registered proof named a playwright test that did not exist.
- Copy fidelity was claimed but unverifiable: the PDFs lived in a WhatsApp store
  outside the repo. They are now committed under `docs/source/` and enforced by
  `src/lib/copy-fidelity.test.ts`, which found and fixed a real defect on the
  way in — an earlier draft of the founder page had silently expanded every
  contraction in Shane's first-person voice.

It also surfaced a defect in someone else's lane worth recording: the
fault-injection fixture omitted `data-section-id` on section-level `<details>`,
so `prod-acceptance.sh` failed at AC-6.9b/c and **every later fault case was
passing on the wrong rejection**. Fixed; that suite is now 14/14.

### Open items created by this amendment
- Whether `/about-the-founder` joins the About dropdown. AC-3.1a deep-equals the nav tree, so a new entry there is an amendment, not an execution-time call. *(moot 2026-08-26 — Amendment 8: no About dropdown exists)*
- `RESEND_API_KEY` is set in `.env.local` (gitignored) and in all three Vercel environments; it takes effect on the next deployment. The key passed through a chat transcript, so rotating it is worth doing.
- Contact rate limiting is per-instance and in-memory. Durable protection needs the platform firewall or a shared store (Upstash) — an account decision, not code.
- Delivery is confirmed only to provider acceptance. Consuming an `email.delivered` webhook is the only way to claim more, and the copy deliberately claims no more.

---

## Amendment 8 — 2026-08-26, the Krisp "BeHuman Website changes" meeting, executed

Source: the Krisp meeting "BeHuman Website changes" (2026-08-22), user-confirmed
2026-08-26. Four decisions supersede earlier pins — the superseded statements are
struck or tagged in place above, never deleted, per this document's convention.

### Decision 1 — `/about` permanently 301-redirects to `/who-we-are`

Reverses Amendment 5 Decision 2 (AC-3.2b's no-redirect clause is struck there;
the rationale line is tagged). `GET`/`HEAD /about` answers **301** with
`Location: /who-we-are`, search string preserved; non-GET/HEAD methods pass
through to the framework; the `/about` route is deleted; `/about` leaves the
sitemap while `/who-we-are` stays. **AC-3.8a is struck** — with no About
dropdown there is no About nav item to link anywhere. This is the one
irreversible decision of the set: permanent redirects are cached aggressively
by browsers and search engines, which is the point.

### Decision 2 — The Human Archive is restored

Reverses Amendment 6's destination deferral (the decision line and paragraph are
tagged above; AC-7.3a's deferral clauses are struck in place). `/the-human-archive`
returns to the pre-deferral grid design (`0666fda^`: cream hero "Real stories.
Real humans." + ink 4-up grid, **live** head metadata — no "Coming Soon", no
"To be released soon" anywhere) rendering `HUMAN_ARCHIVE_VIDEOS` — four NEW
video people, in this order:

| Person | No. | Location | YouTube id |
|---|---|---|---|
| LUCY | 056 | Manchester, UK | `lDGsG0nu1Ck` |
| FARID | 038 | Morocco | `ESAw6gJRGhQ` |
| ABDI | 041 | Calgary, Canada | `xtbZARUHt7s` |
| MARISSA | 060 | Vancouver, Canada | `2sAGALC7Pig` |

Hover (fine pointer), tap (touch), or keyboard activation of a card mounts that
person's **muted** `youtube-nocookie.com/embed/<id>?autoplay=1&mute=1` iframe;
leaving or blurring unmounts it; **never two players at once** (YouTube RMF
policy); an unmute toggle reflects its state as data, not audio hardware. Below
the grid, a "Watch the Human Archives" button links to the verified playlist
`https://www.youtube.com/playlist?list=PLdA-mx7SlQ_A`. The existing four —
ADEWOLF, BELLA, ANTON, ARLINA — are untouched on the homepage section and
`/the-new-human-era` (AC-7.1, AC-7.2 and AC-7.3a's surviving clauses stand).
Per-person `/human-archive/$slug` pages **remain deferred**.

### Decision 3 — Homepage archive CTA: "Coming soon" → "Explore the archive"

The archive page is live again, so the label again matches what is behind it
(the Amendment 6 sentence is tagged above). AC-2.7a governs on the homepage
surface once more — AC-7.3a's narrowing of it is reversed. The banned wording
"Explore the human archive" stays banned.

### Decision 4 — The nav is seven flat items

`WHY WE EXIST | WHO WE ARE | THE NEW HUMAN ERA | THE HUMAN ARCHIVE | PODCAST | CONTACT | BLUEPRINT`

No About dropdown, no Blueprint dropdown. AC-3.1a and AC-3.2a are restated in
place; AC-3.8a is struck. Blueprint is **the sole CTA**, rendered as an
**outline lime pill at rest that fills lime on hover** (meeting: "button with
green outline once we hover on it") — AC-3.7a restated in place. Amendment 7's
open item about `/about-the-founder` joining the About dropdown is moot.

### New scope from the same meeting — homepage video

The Why We Exist section's dead placeholder becomes a click-to-load YouTube
facade for the "Welcome To My Channel — Building The Be Human Company" video
(`-r011ECKr7M`): zero iframes in the initial DOM, mounted on explicit click.

### New criteria

- [ ] **AC-7.4a** `/the-human-archive` renders the restored pre-deferral grid design over `HUMAN_ARCHIVE_VIDEOS` — exactly four entries in order LUCY (No. 056, Manchester, UK), FARID (No. 038, Morocco), ABDI (No. 041, Calgary, Canada), MARISSA (No. 060, Vancouver, Canada), each with its committed still. Zero YouTube iframes exist at load; hover, tap, or keyboard activation of a card mounts exactly one `youtube-nocookie.com/embed/<id>?autoplay=1&mute=1` iframe with `allow="autoplay"` and a meaningful `title`; pointer-leave, blur, or activating another card unmounts it, so the document never holds more than one player; the unmute control reports its state as data (`data-muted="false"`), not via audio hardware; the still returns when the player unmounts. Per-person `/human-archive/$slug` pages remain deferred.
- [ ] **AC-7.5a** Below the grid, a CTA with visible label exactly **Watch the Human Archives** links to the verified playlist `https://www.youtube.com/playlist?list=PLdA-mx7SlQ_A` — single-sourced as `ARCHIVE_PLAYLIST_URL` in `brand.ts`, never inlined at the call site — opening in a new tab. The page ships live metadata: no "Coming Soon" and no "to be released soon" anywhere in head or body.
- [ ] **AC-2.9a** The homepage Why We Exist section ships **zero** iframes in the initial DOM: the video affordance is click-to-load, and the first activation mounts exactly one `youtube-nocookie.com/embed/-r011ECKr7M?autoplay=1` iframe (`allow="autoplay"`, `title="Welcome To My Channel — Building The Be Human Company"`). The poster stays visible until the click, the control is a real button operable by keyboard, reloading returns zero iframes, and no horizontal document overflow appears after activation.

---
**Status: pending approval**
