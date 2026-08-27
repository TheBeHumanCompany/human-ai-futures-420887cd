# Consensus Plan: The Be Human Company — Site Restructure & Bug Fix Pass

**Status: `pending approval`**

- Plan ID: `behuman-site-restructure-consensus`
- Mode: RALPLAN-DR (deliberate) — **iteration 5 (final)**. Reviewed across 5 rounds by an
  Architect pass and a Codex Critic pass, plus 3 binding spec amendments.
- Source spec: `.omc/specs/deep-interview-behuman-site-restructure.md` — 7 components, 3 amendments.

> ### ★★★★★ The AC inventory is DERIVED. No count in this document is authoritative.
> Counts drifted across five iterations (44 → 55 → 53, and separately 9/10/13/14 surfaces and
> 35/36/46/47/53/79/90/92 utilities). Every one of those was a hand-typed literal.
> **`scripts/verify/ac-inventory.ts` parses the spec and emits `docs/ac-inventory.json`:**
> - **Live** = listed, minus struck-through (`~~AC-x.y~~`), minus fully superseded.
> - **Partial supersession is distinguished by rule**: `*(supersedes AC-x.y)*` retires the
>   criterion; `*(supersedes AC-x.y's <aspect>; …stand)*` retires only that aspect and the
>   criterion **stays live** — e.g. AC-6.9b supersedes AC-6.9a's *mechanism* while its five
>   sub-assertions remain binding.
> - `ac-suite.sh` asserts **one proof row per live ID**, and fails on any live ID without a
>   row *or* any row without a live ID.
>
> **The derivation was run. It returns 63.**
> ```
> total checkbox rows : 67      unique IDs : 67      duplicates : none
> struck-through      : AC-3.1, AC-3.2
> fully superseded    : AC-2.8a, AC-5.4  (+ the two struck)   → 4 retired
> partially superseded: AC-2.1, AC-4.2, AC-6.9a               → STAY LIVE
> *** LIVE = 63 ***
> ```
> Earlier drafts asserted 44, then 55, then 53. **All three were wrong.** 63 is what the rule
> returns; if `docs/ac-inventory.json` ever disagrees with this box, the JSON is right and this
> box is the bug.
>
> **Bijection is enforced, and it was broken.** Auditing §3 against the derived set found
> **5 live ACs with no proof row** — `AC-4.2b`, `AC-6.10a`, `AC-6.11a`, `AC-X.6a` (all from
> Amendment 2, whose *content* I implemented without ever adding rows) and `AC-6.9a` (which I
> wrongly marked fully superseded when its five sub-assertions stand). It also found **5 rows
> carrying IDs I invented** — `AC-5.1b`, `AC-6.5b/c/d/e` — which are **not criteria**; they are
> now demoted to named sub-proofs of the real ACs they serve. Rows for retired ACs remain,
> explicitly tagged `SUPERSEDED`, and the checker skips them by that tag.
- Base: `main@a6a377a`
- Definition of done: **live on `https://www.thebehumancompany.ca`**, not green tests

### Authoritative sources

| Source | Path | Governs |
|---|---|---|
| Manifesto (copy) | `/Users/siddicky/Downloads/new h era copy final.pdf` (11 pp) | AC-5.1 … AC-5.7 |
| Sales page (copy) | `/Users/siddicky/Downloads/Be_Human_AI_Flagship_Sales_Page_Design_Ready_v4.pdf` (12 pp) | AC-6.1 … AC-6.8 |
| Controls spine | `../thebehumancompany/framework/controls.yaml` + `framework/checklists/{cybersecurity,privacy_data,transparency_audit}.md` | AC-6.5 |
| **★ Maya's NHE layout mockups** | `.omc/artifacts/maya-mockups/` — `nhe-01-human-archive-section.jpg`, `nhe-02-quote-bigger-than-ai-bridge-generation.jpg`, `nhe-03-humanity-not-reward.jpg`, `nhe-04.jpg`, `archive-still-grace-saskatoon.jpg` | **AC-4.1–4.5 (both display voices), AC-5.1–5.7 (layout), AC-7.x (archive section)** |

### ★★★★★ Spec Amendment 3 — 4 decisions resolving mutually-unsatisfiable criteria

Codex found pairs of criteria that **could not both pass**. The user resolved each. 8 new ACs.

| # | Decision | Effect |
|---|---|---|
| 1 | **Canonical Indigenous string, exactly `Indigenous-led. Canadian-built`** — a **fourth** variant, superseding all three in circulation | **AC-2.1b** (footer), **AC-2.8b** (leaf beside it), **AC-6.12a** (Blueprint hero). AC-2.1 and AC-2.8a could not both pass — one said "Indigenous and Canadian-owned.", the other "Indigenous-led". **Implementation and proof consume ONE shared constant.** |
| 2 | **Progressive disclosure = native `<details>/<summary>`, NOT Radix accordion** | **AC-6.9b/c/d.** ⚠️ **This supersedes the `forceMount` mechanism specified in iteration 4** — do **not** implement it. |
| 3 | **Principles period-free from one shared fixture** | **AC-5.4b** supersedes AC-5.4 (which demanded `"Built in the Reps."` *with* period); AC-5.9a governs. `content.ts:82` currently reads `"Build the reps."` — a **third** form. |
| 4 | **Every human-review artifact under tracked `.approvals/`**, schema-validated, bound to deployment URL + commit SHA | **AC-X.7a.** CI asserts `git check-ignore` rejects nothing under `.approvals/`. |

> #### ★★★★★ Why `forceMount` was wrong, and `<details>` is right
> I specified `forceMount` in iteration 4 to fix DOM presence. **It fixes presence and nothing
> else.** Codex server-rendered the vendored Radix accordion and demonstrated two failures:
> 1. **The gate false-greened.** Two closed items produced **8** `[data-state="closed"]`
>    matches and **0** bodies — so the `≥6 collapsed` gate would have **passed on two empty
>    items**. My selector counted nested state attributes, not sections.
> 2. **No-JS is fatal.** With JavaScript disabled the server-rendered regions **cannot be
>    opened at all**. `forceMount` puts content in the DOM but leaves it permanently
>    unreachable without JS — arguably worse than unmounting, since it ships hidden content a
>    user can never reveal.
>
> **Native `<details>/<summary>` is correct by construction**: content is in the DOM, openable
> with zero JavaScript, SEO-safe, and needs no vendored component at all. It also deletes the
> a11y concern `forceMount` created. This is the better answer on every axis — the accordion
> was a reflex toward the component library rather than the platform.

### ★★★★ Spec Amendment 2 — 8 user decisions, all CLOSED

Authoritative; supersedes conflicting readings. Eight previously-escalated questions are now
answered, which retires most of §11.

| # | Decision | Effect on this plan |
|---|---|---|
| 1 | **Typography scope = 47** — four AC-4.2 utilities + `section-label-{dark,light,rule}`. **`eyebrow` (45) is OUT.** | Every floor set to 47. §11 Q1 **resolved**. All 53/79/46/90 figures purged. |
| 2 | **Blueprint tiering APPROVED** — "present ≠ equally prominent" | S6.0 stands. §11 Q10 **closed**; no longer gated. |
| 3 | **Brett: render the section, mark the slot pending** | Resolves the AC-6.2/S6.9 contradiction. **16/16 holds.** No omission, no lorem, no invented quote. |
| 4 | **85.4 MB originals: COMMIT** | AC-1.1 stands as written. §11 Q4 **answered** — but the S0.2b ordering fix is retained (capture before commit costs nothing). |
| 5 | **Sovereignty: practices only, assert NO domain definition** | Interim resolution promoted to decision. Prohibited-claim test added per `controls.yaml:5`. §11 Q5 **closed**. |
| 6 | **Archive: mockups are illustrative** | Real four only. Four portraits, not five. **Lindsay is NOT added.** The three `[HUMAN ARCHIVE QUOTE #N]` slots fill from ADEWOLF/BELLA/ANTON/ARLINA. §11 Q7, Q8 **closed**. |
| 7 | **Staging is the review venue** | Maya reviews design, Shane reviews `/who-we-are`; production only after both. **Also the rehearsal target** — `prod-acceptance.sh` runs against staging before it ever runs against prod. §11 Q13 **closed**. |
| 8 | **Lovable publishing PAUSED** for the branch's lifetime | §11 Q3 **closed** — *but* the pause must be communicated to Maya first, so **the hand-reconciled merge strategy stays live**. Treat the pause as risk reduction, **not** as permission to assume a static `main`. R2 and PM-2 are unchanged. |

**Still open after Amendment 2:** Q2 (six social URLs), Q6 (surnames — non-blocking), Q9
(`/about`'s fate), Q11 (footer maple leaf). Everything else is decided.

### ★★ Spec Amendment 1 (2026-08-17, post-interview) — binding

Reverses the Round 4 nav flattening on a **corrected premise**: About is not a one-child
dropdown. Adds 11 amended criteria and four open items. Read `spec:259-300`.

**Binding nav tree** — note the user *inverted* the original brief: **About is the PARENT**.
```
ABOUT ⌄ (Why We Exist · Who We Are) | THE NEW HUMAN ERA | THE HUMAN ARCHIVE
| PODCAST | CONTACT | [BLUEPRINT ⌄ pill] (Human Readiness · Governance & Sovereignty · AI Strategy)
```

**Environments (new).** `staging.thebehumancompany.ca` — **verified live, HTTP 200, 51 234 B**,
running `feat/podbean-rss-integration`. This is Maya's review environment. The plan previously
assumed production only; staging is now the gate where AC-X.5's checks are proven **before**
production promotion.

★ **Provenance.** WhatsApp from Maya Brstilo, 2026-08-16/17. The PDF she also sent is
SHA-256 identical to `new h era copy final.pdf` — **no new copy, but authoritative layout**.
`archive-still-grace-saskatoon.jpg` ("WHAT IT MEANS TO BE HUMAN: GRACE | SASKATOON") is a
Human Archive video still — **content, not layout**; it does not govern any AC.

> **Iteration-2 headline.** The previous revision's git strategy was *prohibited by
> `AGENTS.md:1-10`* and would have destroyed the user's Lovable project history. It
> is replaced wholesale with history-preserving merges. See §12 Changelog for every
> finding applied or rejected.

---

## 0. Verification performed while planning

Everything below was executed against the working tree at `main@a6a377a`. Claims
carry the command that produced them. **Iteration-2 additions are marked ★.**

| # | Finding | Evidence |
|---|---|---|
| V1 | **46** `.asset.json` pointers exist, not 47 | `ls src/assets/*.asset.json \| wc -l` → 46 |
| V2 | **44** are imported by code; **2** are orphans | `src/lib/content.ts:1-4` (4), `src/lib/podcast/imagery.ts:5-43` (39), `src/routes/index.tsx:7` (1) |
| V3 | Only **1** pointer is "already-dead" (real file beside it): `hero.png.asset.json` | no other pointer has a sibling binary |
| V4 | 2nd orphan `guest-ep39.png.asset.json` — superseded by `guest-ep39-jill.png.asset.json` (`imagery.ts:5`), no binary anywhere | pointer glob minus import grep |
| V5 | **All 46 binaries fetch, byte-exact** | HEAD-probed all 46: `OK=46 FAIL=0`, each `size_download` == pointer `size`. Codex independently confirmed with full GETs: 46/46 HTTP 200 |
| V6 | Recovery URL: `https://id-preview--<project_id>.lovable.app<pointer.url>` | host pattern from `src/routes/__root.tsx:95`; `project_id=d03b88e4-…` matches every pointer |
| V7 | **R2 bucket is NOT an asset fallback** — 404s on the `a/v1/<pid>/<aid>/` key shape | probed → `404` |
| V8 | Total raw payload **85.4 MB** / 46 files (43 PNG, 3 WebP); largest 2.65 MB | summed pointer `size` |
| V9 | **`bun test src/` already RED on `main`**: 620 pass / 17 skip / **2 fail** | `src/routes/podcast.test.ts:55`, `:157` |
| V10 | **`eslint .` already RED on `main`**: **33 errors, 12 warnings** (32 auto-fixable, ~all `prettier/prettier`) | `bunx eslint .` |
| V11 | `tsc --noEmit`, `-p scripts`, `-p studio` all **PASS** | exit 0 ×3 |
| V12 | **12 test files assert over raw source text** via `readFileSync` | incl. `src/routes/index.test.ts:24`, `src/lib/layering.test.ts`, `src/lib/route-shape.test.ts` |
| V13 | `24` inline `clamp()` call sites across `12` files | `grep -rn "clamp(" src/routes src/components` |
| V15 | The three `[HUMAN ARCHIVE QUOTE #N]` placeholders live in the **PDF** (pp.1,5,9), not the repo | `grep -rn "HUMAN ARCHIVE QUOTE" src` → 0 |
| V16 | `controls.yaml:5` binds copy: *"readiness and assurance, not a compliance guarantee… NOT a certification"* | repeated in all 3 checklists |
| ★V17 | **`AGENTS.md:1-10` forbids rebasing/amending/squashing pushed commits** — "the user will likely lose their project history" | read verbatim; it is the repo's only AGENTS.md |
| ★V18 | The spec has **44** ACs, not 40 | `grep -c '^- \[ \] \*\*AC-' .omc/specs/…md` → 44 |
| ★V19 | **Production is `www`**: `https://thebehumancompany.ca/` → **308** → `https://www.thebehumancompany.ca/`; with `-L` → 200, 79 899 B | any check without `-L` greps a 15-byte redirect body and false-greens |
| ★V20 | `.omc` is **gitignored** (`.gitignore:27`) — an "off-repo tarball" there is an untracked local dir, not a backup | read |
| ★V21 | `origin/feat/podbean-rss-integration` holds **19** binaries under `src/assets`, including **all 4 archive portraits** (`archive-{adewolf,anton,arlina,bella}.jpg`) — **but zero guest avatars and no collage** | `git ls-tree -r … -- src/assets` |
| ★V22 | ⇒ **40 files (39 avatars + collage) have exactly one source on earth**; the 4 portraits have two | V21 ∩ V5 |
| ★V23 | *(superseded by **V54** — re-measured in iteration 3 as **35 / 46 / 90** across 15 files. The earlier 53/79 mis-summed the `section-label-*` variants.)* | see V54 |
| ★V24 | **`display-strong` is dead code** — defined at `styles.css:244-250`, zero call sites | V23 |
| ★V25 | `eyebrow` already exists (`styles.css:124`) with **44** call sites; adding a second `type-eyebrow` beside it creates a duplicate | V23 |
| ~~V26~~ | *(superseded by **V58** — 13 visitable surfaces post-Amendment-1.)* **10 route ids**, of which **9 renderable** (`/sitemap.xml` excluded) incl. **2 dynamic** (`/human-archive/$slug`, `/podcast_/$slug`) | `routeTree.gen.ts` `FileRoutesById` |
| ★V27 | `layering.test.ts:83` defines `srcNonTestFiles`; `:66` `isTestFile`. Existing rules use it to avoid self-matching | read |
| ★V28 | **Test tripwires**: `index.test.ts:103` asserts `index.tsx` contains **no catch clause**; `route-shape.test.ts:70` asserts `episodeRoutes` equals exactly `["/podcast_/$slug"]` | read |
| ★V29 | **`__root.tsx:95-96` hardcodes `og:image`+`twitter:image` to a Lovable R2 URL** — probes **200, 1.99 MB** today. Survives a pass whose purpose is removing Lovable image deps; `src=`-only sweeps cannot see it | curl |
| ★V30 | **The Lovable preset sets no `assetsInlineLimit`, `assetsDir`, or `manifest`** | grep of `node_modules/@lovable.dev/vite-tanstack-config/dist/` → no hits |
| ★V31 | ⇒ Vite defaults apply: `assetsInlineLimit` **4096 B** (sub-4 KB assets inline as `data:` URIs) and **`build.manifest` is OFF** — a manifest-driven check requires enabling it first | V30 + Vite defaults |
| ★V32 | **The 2 failing tests were broken by a bot *revert*, proven**: `e5196a3` (`gpt-engineer-app[bot]`, "Reverted to commit e7bf6ba…") removed `visible.slice(1, 1 + shown)` from `podcast.tsx`; `podcast.test.ts` still asserts it (last touched `6e3856f`, same bot) | `git log --format=… -- <file>` + per-commit `git show \| grep` |
| ★V33 | ⇒ The bot performs **reverts**, not just additions — it can undo our landed work, not merely conflict with it | V32 |
| **★V34** | **The mockups use a second display voice that exists nowhere in `src/styles.css`**: large, light, **sentence-case**, wide — "But what if your humanity is not the reward at the end of a good life?" (mockup 3), "What if practising your humanity is how you build the life you want?" (mockup 4), "We are not here to add more to your life." (mockup 3, black band) | visual inspection of all 4 layout mockups |
| **★V35** | **It needs NO new font file.** Identified as **Work Sans at 200/300** by same-image letterform comparison: in `nhe-04.jpg` the large heading and the known-Work-Sans body sit side by side and share letterforms — double-storey `a`, single-storey hook-tailed `g`, straight-diagonal `y` descender | `nhe-04.jpg`, `nhe-03-humanity-not-reward.jpg` |
| **★V36** | **Work Sans 300 is ALREADY loaded**; 100/200/300 all exist upstream. Adding weight 200 is **provably zero-cost**: `css2` for `wght@300;400;500;600` and for `wght@200;300;400;500;600` returns the **byte-identical set of 3 woff2 URLs** — Google serves a variable font, and the weight list does not change the served files | `__root.tsx:104`; probed both `css2` responses and diffed the `woff2` URL sets |
| **★★★★V59** | **Radix accordion UNMOUNTS closed content, so "collapsed but in the DOM" was unsatisfiable.** `grep -rn forceMount src/` → **0 hits**; `src/components/ui/accordion.tsx:37-48` wraps stock `AccordionPrimitive.Content` | grep + read |
| **★★★★V60** | **`be-human-ai.tsx` renders no `<Outlet/>`** (`grep -c Outlet` → **0**), so `be-human-ai/<pillar>.tsx` files would nest under it as a layout and render **blank**. The repo documents this exact bug at `route-shape.test.ts:56-60` (it is why `podcast_.$slug.tsx` has the underscore) | grep + read |
| **★★★★V61** | **My type scanner was defective — it missed 2 real call sites** that a `className=`-attribute regex structurally cannot see: `podcast_.$slug.tsx:150` (`const SECTION_HEADING = "section-label …"`) and `episode-player.tsx:138` (`className={cn("eyebrow …")}`). This reconciles **36/47/92** exactly; my V55 explanation was wrong — the other scanner never opens `styles.css` | read both lines |
| **★★★★V62** | **`sitemap.xml.test.ts` keeps a duplicate route list and asserts it exactly.** `:42` `STATIC_PATHS` (7 entries incl. `/about`); `:106` `expect(locs.sort()).toEqual(...)`; comment hardcodes *"the site still has seven pages"* | read |
| **★★★★V63** | **Three surface counts had drifted within one iteration** — 13/12 (V58), "9 → 14" (V50), "10 surfaces" (AC-X.5), "10 surfaces (9+2) × 3 = 33" (PM-3, itself inconsistent since 9+2=11) | self-audit |
| **★★★V51** | **`\|\| true` on a `curl` greens on a dead site — reproduced.** `val="$(curl -fsSL <404-url> \| grep -c '__l5e' \|\| true)"` → curl prints `error: 404`, **`val='0'`**, `assert_eq "$val" 0` **PASSES**. `-fsSL` buys nothing once `\|\| true` swallows the exit code | executed under `set -Eeuo pipefail` |
| **★★★V52** | **`wc -l` padding inverts assertions across platforms.** On darwin: unquoted `$(… \| wc -l)` → `[0]`; quoted → `[       0]`. Quoting for `set -u` hygiene silently flips five gates; GNU coreutils in CI pads differently again | executed |
| **★★★V53** | **`.omc/**` is gitignored — including the G1 approval and the AC-1.2 report.** `git check-ignore` → IGNORED: `.approvals/typography.json`, `.baseline/asset-recovery-report.json`. **Tracked**: `.baseline/`, `docs/`, `src/assets/manifest.json`, `.approvals/` | `git check-ignore -q` per path |
| ~~V54~~ | *(**SUPERSEDED by V61** — this scan was defective; the correct figures are 36/47/92. Retained for audit.)* **AC-4.2 migration scope, measured.** `className`-scoped, non-test `src/**`, responsive prefixes stripped: `display` 24 · `display-strong` **0** · `archive-question` 4 · `section-label` 7 · `-dark` 1 · `-light` 6 · `-rule` 4 · `eyebrow` 44. ⇒ **four names = 35 call sites** (46 with `section-label-*`, 90 with `eyebrow`), across **15** non-test files, **plus 4 `@utility` definitions** in `styles.css` that are *deleted, not migrated* | scripted scan |
| ~~V55~~ | *(**WITHDRAWN — this explanation was wrong**; see V61. The other scanner never opens `styles.css`. Retained for audit.)* **Claimed the count disputes were a units mismatch.** A raw `\bname\b` grep over non-test `src/**` yields `display` **52**, `section-label` **23**, `eyebrow` **46** — because it also catches the `@utility` definition (1 per name) and, for `display`, the 5 `--font-display`/`font-display` tokens (a hyphen is a word boundary). **Call sites ≠ raw matches.** 35/46/90 is the migration scope; 36/47/92 counts definitions as sites | scripted comparison |
| ~~V56~~ | **RETRACTED — the claim was false.** I asserted `e5196a3` removed the assertion string. Isolated re-test: `e5196a3^` (=`6e3856f`) contains it **0×** and `e5196a3` **0×** — neither side has it. My earlier loop was corrupted by `^` expansion in an unquoted zsh `for` list. `3e03c8a` **added** it (0→1). **No single-commit provenance is claimed; see S0.4b for the range + reproduction.** | isolated `git show` to a file, then `grep -cF` |
| **★★★V57** | **Route arithmetic was double-counted.** Dynamic ids are *patterns*, not surfaces. Pre-amendment visitable = **7 static + 2 concrete = 9** (not 11); `/sitemap.xml` is an XML endpoint, not a page | `routeTree.gen.ts` |
| **★★★V58** | **Post-Amendment-1 surfaces = 13.** 7 existing static − `/about` (becomes a 301, S3.6c) + 5 new (`/why-we-exist`, `/who-we-are`, 3 pillars) = **11 static**, + 2 concrete dynamic = **13**. AC-3.3 checks **12** of them (all but `/be-human-ai`) | V50 + V57 |
| **★★V43** | **Staging is live and independent**: `https://staging.thebehumancompany.ca/` → **200**, 51 234 B, no redirect. A second verification target, and a safe place to prove AC-X.5 before prod | `curl` |
| **★★V44** | **The reference branch chose separate ROUTES, not anchors**, for every pillar: `src/routes/be-human-ai/{human-readiness,governance,ai-strategy,blueprint,index}.tsx` + `src/routes/why-we-exist.tsx` | `git ls-tree -r origin/feat/podbean-rss-integration -- src/routes` |
| **★★V45** | Its `src/lib/nav.ts` is a **typed** nav model — `NavRoute` literal union, `NavItem`/`NavChild`, flags `footerOnly`, `cta`, `triggerNavigates`, and a `mobileNavChildren` filter | `git show …:src/lib/nav.ts` |
| **★★V46** | **The split-control trap, documented on the reference branch**: a Radix dropdown *trigger* is a `<button>` that opens the panel instead of navigating, so a parent whose trigger does not navigate **must** carry a `self` child or its own page becomes unreachable from the bar. Blueprint is the other kind — pill navigates, chevron opens | `nav.ts` comments on `NavChild.self` / `NavItem.triggerNavigates` |
| **★★V47** | **The reference nav tree ≠ the binding tree.** Reference: `Why We Exist ⌄` parent with 5 children (Overview/Be Human AI/NHE/Archive/Podcast). Binding: `About ⌄` parent with 2 (Why We Exist · Who We Are). **Its structure is evidence; its tree is not the spec** | `git show …:src/components/site-header.tsx` vs `spec:283` |
| **★★V48** | **Radix primitives are already vendored on `main`** — `src/components/ui/` plus deps `@radix-ui/react-navigation-menu`, `react-dropdown-menu`, `react-collapsible`, `react-accordion` in `package.json`. **No new dependency is needed** for the dropdown nav or for accordion-based progressive disclosure | `package.json:11-38` |
| **★★V49** | **`/about` exists on `main`** (`src/routes/about.tsx`, H1 at `:30`) but appears **nowhere** in the binding tree — About is a menu label whose two destinations are Why We Exist and Who We Are. `/why-we-exist` does **not** exist on `main`. So this reversal *creates* `/why-we-exist` and leaves `/about`'s fate unstated | `spec:283`; `ls src/routes` |
| ~~V50~~ | *(count superseded — surfaces now derive from `SURFACES`; see V58.)* **Amendment 1 adds up to 5 routes**: `/who-we-are` (AC-3.5a), 3 pillars (AC-3.6a), `/why-we-exist` (AC-3.2a). Renderable surfaces go **9 → 14**, which re-baselines V26 and every route-sweep floor | V26 + spec:284-288 |
| **★V42** | **Trimming the Oswald weight request is NOT a page-weight win — disproved.** `Oswald:wght@200;300;400;500;700;800` and `Oswald:wght@200;700` return the **identical five woff2 URLs**. The multiple URLs are `unicode-range` subsets (latin, latin-ext, …), not per-weight files. Requesting fewer named weights from a variable family saves **zero bytes** | probed both `css2` responses and diffed the `woff2` URL sets |
| **★V37** | **A third voice is also missing but is nearly free**: mockup 2's condensed **sentence-case** lines ("We are the Bridge Generation.", "Technology is advancing, and humanity has to advance with it.", "If these are the things people tell us make life human,") are **Oswald 200/300 *without* uppercase**. Oswald 200/300 are already loaded — but `@utility display` hardcodes `text-transform: uppercase` (`styles.css:106-112`), so the voice is currently unreachable | `nhe-02*.jpg`; `styles.css:111`; `__root.tsx:104` |
| **★V38** | ⇒ **The typography axis is `case`, not just size.** Both existing families need an uppercase *and* a sentence-case register. This is why AC-4.2's "one documented weight set" is under-scoped as written — it consolidates weights but says nothing about case | V34, V37 |
| **★V39** | **`section-label` + `section-label-rule` are LOAD-BEARING, not disposable.** Every mockup section opens with a letterspaced uppercase eyebrow above a ~4 rem lime rule — exactly these two utilities (`styles.css:198-204`, `:214-218`). Iteration-2 planned to *delete* the four utilities; the eyebrow+rule **role** must survive the consolidation | all 4 layout mockups |
| **★V40** | **Mockup 1 shows 5 portrait slots** (1 large + 4 small) in the archive section, and mockup 2 attributes a quote to **"Lindsay / Vancouver"** — not among the four `ARCHIVE` entries (`content.ts:85`: ADEWOLF, BELLA, ANTON, ARLINA) | `nhe-01*.jpg`, `nhe-02*.jpg` |
| **★V41** | Stale comment: `styles.css:9-10` documents the display face as **"Bebas Neue"**; the actual face is Oswald (`:44`) | read |

**Spec/reality deltas (counts corrected, scope untouched).** AC-1.4 says "All 47 …
including the three already-dead ones"; reality is **46 files, one already-dead**
(V1, V3). AC-2.3 names `social-section.tsx`, which is already clean — the single
`href="#"` is `site-footer.tsx:43` (rendered 6× via `SOCIAL.map`). AC-5.4 lists
*"Built in the Reps"* while `HOME_PRINCIPLES[5].title` is `"Build the reps."`
(`content.ts:82`); PDF p.9 says *"Built in the Reps."*, and AC-5.4 defers to
`HOME_PRINCIPLES`, so the const is updated to the PDF wording.
**No AC is renumbered, dropped, merged, or reworded.** Implementation is
data-driven (glob) so no count is ever hardcoded.

---

## 1. RALPLAN-DR Summary

### Principles

1. **Never rewrite published history.** `AGENTS.md:1-10` (V17) makes rebase-after-push a
   user-data-loss operation. Integration is by merge commit, always.
2. **Capture the irreplaceable first, durably.** 40 files have exactly one source on
   earth (V22). "Durable" means retrievable from a different machine — not a local
   gitignored dir (V20).
3. **A human gate must not idle the machine** — but must not be bypassed either (AC-4.4).
4. **A gate must be at least as strict as the AC it claims to prove.** No check that
   passes vacuously, greps a redirect body, or covers 4 of 47 call sites.
5. **Pin the inherited red; don't repaint the house.** `main` is red before we start
   (V9, V10) and a formatting-unaware bot keeps rewriting the same files (V33).

### Decision Drivers

| # | Driver | Why it dominates |
|---|--------|------------------|
| **D1** | **Asset-source volatility** | 40 files, one host, no fallback (V7, V22). Unrecoverable if lost. |
| **D2** | **Human-gate latency (AC-4.4)** | Sits upstream of the two largest deliverables. Schedule-dominant. |
| **D3** | **Concurrent *reverting* writer on `main`** | The bot already broke the build by reverting (V32-33), **and history-preserving integration is mandatory** (V17), so conflict cost is paid in manual merges. |

### Viable Options — Sequencing

**Option A1 — Strict sequential** *(steelmanned)*.
Capture assets first (nothing sane defers D1), then run components strictly in
dependency order: 1 → 7 → 2 → 3 → 4 (specimen, **wait for G1**) → 5 → 6.

- *Pros:* one work front, so merge conflicts are minimal — which matters more under
  V17 than it did under a rebase model, since every integration is now a hand-reconciled
  merge. Simplest to audit. No file-ownership discipline required.
- *Cons:* between publishing the specimen and G1 clearing, the branch genuinely idles —
  work exists that does not depend on the scale, and A1 declines to do it. Under D3 that
  idle time is not free: `main` keeps moving and reverting beneath us.

**Option A2 — Three fully parallel tracks behind one gate.**
Assets→archive, chrome+nav, and typography all run concurrently from Phase 0.

- *Pros:* maximum overlap with G1 latency; shortest wall-clock.
- *Cons:* three concurrent fronts multiply the merge surface at exactly the moment
  (V17) merges became manual and expensive. Requires a file-ownership table to stay
  coherent. Realistically more coordination than a small team wants.

**Option A3 — Capture-first, specimen-as-early-as-the-inventory-allows, then sequential** ***(CHOSEN)***.

> **★★★★★ Stated honestly (Codex #9).** Earlier drafts claimed A3 "opens the gate on day one"
> and then, paragraphs later, conceded it cannot. Both sentences stayed in the document. The
> real dependency graph:
> ```
> S0.2 capture (minutes)  ──────────────► closes D1 immediately, depends on nothing
> S0.6 type inventory ──► S0.7 specimen ──► G1 opens        ← THIS sets gate-open time
> Phase 1 asset-pipeline ─────────────────► independent of both
> ```
> **The gate opens when the inventory and specimen are done — not on day one.** That is A3's
> real cost and it is not hidden. What A3 buys is that *nothing else waits on the gate*: asset
> capture closes the irreversible risk in minutes regardless, and Phase 1 proceeds in parallel
> with the inventory under the carved exception below.

Phase 0 captures all assets immediately and publishes the specimen as soon as the inventory
permits; thereafter non-typography work runs in dependency order while the approval pends.
Phases 5–6 begin when G1 clears **and** Track A has landed.

| | D1 asset volatility | D2 gate latency | D3 merge/revert cost |
|---|---|---|---|
| **A1** | ✅ capture first | ❌ idles the whole gate window | ✅ one front, minimal merges |
| **A2** | ✅ capture first | ✅ full overlap | ❌ three fronts, most merge surface |
| **A3** | ✅ capture first, closes D1 in minutes | ⚠️ gate opens after inventory+specimen — **honestly, not day 1** — but nothing else waits on it | ✅ single front after Phase 0, plus one carved overlap |

> ### ★★★ A3, amended — Phase 0 is the critical path, and it gets one concurrency exception
> **The steelman that lands:** A3's gate cannot open "on day one", because S0.7 (the specimen)
> depends on S0.6 (the full site-wide type inventory) — precisely the work that had to move
> pre-gate. So the gate opens *after* a typography audit, and under a strict "single front"
> reading, **`asset-pipeline` would wait behind a typography audit it has zero dependency on.**
> A2 ran those concurrently. That is a real cost A3 must answer, not wave away.
>
> **Two amendments, and A3 still wins:**
> 1. **State it plainly: Phase 0 is now the critical path.** Its duration is the gate's
>    latency floor. That is a property to manage, not to hide.
> 2. **One carved exception to "single front": S0.6/S0.7 may overlap Phase 1.** The merge
>    surface is near-zero and provably so — Track A touches `src/assets/**`, `content.ts`,
>    `imagery.ts` and `index.tsx` *imports*; the inventory touches only `className` strings and
>    `styles.css`. Forbidding that overlap would be discipline for its own sake.
>
> A3 still beats A2 because D1 closes in minutes regardless of sequencing (S0.2 is first
> either way), S0.6 is **analysis, not migration** (it writes one markdown file, so it cannot
> conflict), and V17 re-prices A2's three permanent fronts against a *reverting* bot. A3 pays
> a one-time, bounded Phase-0 cost; A2 pays an unbounded merge cost for the branch's life.

**Why A3 wins:** it takes A2's only real advantage — publishing the specimen as early as the
dependency graph permits, so the approval's latency overlaps productive work — without paying
A2's price. (**Not "immediately"**: S0.7 depends on S0.6; see the dependency graph above.)
The specimen is a Phase 0 deliverable, not the output of a parallel track; once
published, there is nothing left for a "typography track" to do until G1 clears, so
the second front dissolves on its own. A1 was rejected **not** for deferring asset
risk (the steelman captures first — the iteration-1 plan strawmanned this) but purely
for idling the gate window. A2 was rejected because V17 re-priced merge conflicts:
when every integration is a hand-reconciled merge commit against a bot that reverts,
three concurrent fronts is the wrong trade for a marginal schedule gain.

### Viable Options — Asset recovery

**B1 — Per-surface incremental.** Rejected: spreads single-point-of-failure exposure
(V22) across the branch lifetime to buy tidier commits. Trading unrecoverable data
loss for diff hygiene is the wrong side of that trade.

**B2 — One bulk fetch, first, with retry/resume and a durable off-machine backup** ***(CHOSEN)***.
Collapses D1 exposure from days to minutes; one pass satisfies AC-1.1 and AC-1.2 together;
every pointer carries `size` so byte-level verification is free (V5).

**B′ — What gets committed.** *(Iteration-1 chose derivatives; that was wrong.)*
AC-1.1 (`spec:71`) requires the **fetched binary** written beside the pointer. A
resized WebP is a different artifact — a lower bar dressed as a count correction.

- **B′1 — commit the byte-identical originals beside their pointers** ***(CHOSEN)***, with a
  SHA-256 manifest, **plus** WebP derivatives for runtime rendering. 85.4 MB enters git
  history once; that is the literal cost of the AC as written.
- **B′2 — derivatives only.** **Rejected on review:** silently weakens AC-1.1.
- **B′3 — Git LFS.** Rejected: unvalidated against both Vercel builds *and* Lovable's
  sync, and a broken LFS fetch degrades to pointer files — reintroducing the exact
  failure class this component exists to delete. Not worth the risk for 85 MB.

---

## 2. Requirements Summary

Branch from `main@a6a377a` and ship seven components to production on Vercel
(`prj_Zea77SyZVM7fiu9hr2zYi85Hf0jg`) without merging, rebasing or cherry-picking
`feat/podbean-rss-integration`:

1. **`asset-pipeline`** — replace all Lovable `.asset.json` pointers with real,
   Vite-emitted images so images stop 404ing in production.
2. **`site-chrome`** — Indigenous-led footer, real social URLs, drop Sydney/London/New
   York, route every booking CTA through two exported cal.com constants.
3. **`nav-ia`** — flat `NAV`; no dropdown, no `/why-we-exist`; Blueprint alone gets a sub-nav.
4. **`typography-system`** — one H1–H4 + eyebrow + body scale, consolidating four
   conflicting utilities, **user-approved via specimen before it touches any page**.
5. **`new-human-era`** — rebuild from the 11-page manifesto.
6. **`blueprint-page`** — rebuild from the 12-page sales PDF, grounded in `controls.yaml`.
7. **`human-archive`** — four entries, four working portraits.

Fonts fixed. Archive stays at four. Booking URLs are fixed literals.

---

## 3. AC-Proof Table — one row per live AC (derived; see `docs/ac-inventory.json`)

Every row: the runnable proof, its **non-vacuity floor** (what stops it passing on an
empty set), and the failure mode. All shell proofs run under `set -Eeuo pipefail`;
all counts are asserted, never printed. `PROD=https://www.thebehumancompany.ca` (V19),
and every `curl` uses `-fsSL`.

**Convention.** `assert_eq <actual> <expected> <label>` and `assert_ge` are helpers in
`scripts/verify/lib.sh` that `exit 1` on mismatch. `T:` = a `bun test` case.
`B:` = a browser/DOM check via the Playwright runner introduced in §7.

### Component 1 — `asset-pipeline`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-1.1 | `T: scripts/recover-assets.test.ts` — every pointer has a sibling file whose SHA-256 matches `manifest.json`, and whose byte length equals the pointer's `size` | manifest row count equals the `src/assets/*.asset.json` glob count; ≥1 hash compared | any missing sibling, hash mismatch, or manifest shorter than the pointer glob |
| AC-1.2 | `T:` fault-injected runs: non-2xx, truncated body, wrong MIME → each produces a `status!="ok"` row naming `asset_id`, and a nonzero exit | ≥3 injected faults each observed | a fault produces `ok`, or exit 0 |
| AC-1.3 | `T: layering` rule over `srcNonTestFiles` (V27) — **the only form**; no shell grep, because a shell grep over `src/` includes the test files that contain the forbidden token by design | layering fixture asserts ≥100 files walked | any residual reference — **or a scan that includes tests and self-matches** |
| AC-1.4 | `assert_eq "$(git ls-files 'src/assets/*.asset.json' \| count)" 0` **and** the same for the working tree | prior commit asserted the pointer set non-empty, so 0 is a real transition | any pointer left tracked or on disk |
| AC-1.5 | `T:` parse each of the 3 files' import statements; assert **0** `.asset.json` specifiers and image-file specifiers matching the per-file counts in `docs/asset-inventory.json` | per-file minimum counts | a file drops to JSON imports or loses images |
| AC-1.6 | **`scripts/verify/prod-images.sh`** — manifest-driven (§7 Observability): every formerly-pointered image (count from `docs/asset-inventory.json`) resolved to its built URL and `HEAD`ed against `$PROD`; **plus** DOM sweep over the **13 visitable surfaces** (V58), collecting `<img>`, `<source>`, and `og:image`/`twitter:image` `content=` URLs narrowed to `^https?://` + image extension | asserts inventory count **equals the manifest** before checking, and that `/podcast` DOM yielded `≥1` avatar | any non-200, or inventory below floor (catches "found no images, exited 0") |

### Component 2 — `site-chrome`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-2.1 | **LIVE — partially superseded** (only its Indigenous string is replaced, by AC-2.1b; its other three clauses stand). `B:` render `SiteFooter`; assert **all four** elements present as distinct nodes — strapline, `Wordmark` + paragraph, `INDIGENOUS_LINE` (per AC-2.1b), and "Stay Human." with computed `font-family` containing `Caveat` **and** computed colour == `--lime` | 4 discrete assertions; the Caveat/lime one reads *computed style*, not a class name | any element missing or the hand font/lime not actually applied |
| AC-2.2 | `T: layering` rule over **`srcNonTestFiles`** (never a raw `grep -r src`, which would self-match this rule's own fixtures) **and** `B:` neither rendered footer nor `/contact` contains "Sydney" | layering fixture floor; DOM nodes located | either surface retains it — or the scan includes tests and passes on its own text |
| AC-2.3 | `T:` every `<a>` in `site-footer.tsx` + `social-section.tsx` has `href` matching `^https://` — **and** `scripts/verify/social-links.sh` `HEAD`s all 6 live | asserts exactly **6** social links found | any `#`, relative, or dead URL |
| AC-2.4 | `T:` `booking.ts` exports the two exact literals; `T: layering` rule — no file outside `src/lib/booking.ts` contains `cal.com` (scoped `srcNonTestFiles`) | asserts both constants' values char-for-char | an inlined URL anywhere |
| AC-2.5 | `T: layering` — `assert_eq` case-insensitive `calendly` count over `srcNonTestFiles` to 0 | layering fixture floor | any reintroduction |
| AC-2.6 | `B:` header renders a link whose `href == BOOKING_URL_15MIN`; **and** `/be-human-ai` renders **exactly 3** links with `href == BOOKING_URL_30MIN`, at the hero, offer, and closing sections (asserted by nearest section ancestor id) | count `== 3` **and** the three ancestor ids are distinct | 2 CTAs, 4 CTAs, or all three in one section |

### Component 3 — `nav-ia`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| `SUPERSEDED` ~~AC-3.1~~ | **SUPERSEDED by AC-3.1a** (Amendment 1). Not proven; the flat-nav assertion is now false by design. | — | — |
| `SUPERSEDED` ~~AC-3.2~~ | **SUPERSEDED by AC-3.2a**. `/why-we-exist` must now **exist**, inverting the original criterion. | — | — |
| AC-3.3 | `B:` for every surface in `SURFACES` with `expectsSingleNav` (all but `/be-human-ai`) — assert exactly **1** `<nav>` descendant of the site header. *(Radix dropdown panels are menus inside that one nav, not additional `<nav>` elements.)* `/about` is checked as a **301**, not a page. | asserts `SURFACES.length` matches `routeTree.gen.ts` and the checked subset is non-empty, before iterating | any page grows a second nav; **or the sweep silently covers fewer routes** |
| AC-3.4 | `B:` `/be-human-ai` renders the header nav **plus** a second in-page nav; every sub-nav `href="#id"` resolves to an existing element | sub-nav link count `≥ 10` | a dangling anchor or a missing sub-nav |

### Amendment 8 — 2026-08-26 — amended criteria (Krisp "BeHuman Website changes" meeting, user-confirmed)

Four decisions, superseding rows below: (1) `/about` permanently **301**s to `/who-we-are`
(SEO; the sitemap drops `/about`, `/who-we-are` stays); (2) `/the-human-archive` is restored
to the pre-deferral grid with four NEW video people (LUCY 056 Manchester, UK; FARID 038
Morocco; ABDI 041 Calgary, Canada; MARISSA 060 Vancouver, Canada — hover/tap plays each
person's muted YouTube embed, unmute toggle, never two players at once) plus a "Watch the
Human Archives" button to playlist `PLdA-mx7SlQ_A`; (3) the homepage archive CTA returns to
"Explore the archive" (banned wording stays banned); (4) the nav is **seven flat items** —
About dropdown gone, Blueprint dropdown gone, Blueprint the sole CTA as an outline lime pill
that fills on hover. The existing four archive people are unchanged; `/human-archive/$slug`
stays deferred.

| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-3.1a *(restated)* | `T:` `NAV` deep-equals the Amendment 8 fixture: **7 top-level items** in order `Why We Exist, Who We Are, The New Human Era, The Human Archive, Podcast, Contact, Blueprint`; **exactly 0** dropdown triggers. `B:` desktop bar renders the 7 links and no dropdown | full deep-equal on the tree; trigger count asserted to 0 | any label, order, or nesting drifts, or a dropdown returns |
| AC-3.2a *(repurposed)* | `B:` Why We Exist and Who We Are are **direct top-level links** to `/why-we-exist` and `/who-we-are`; each fetched for **200** | both fetched, both 200 | either 404s, or either becomes a dropdown child again |
| AC-3.2b *(inverted)* | `B:` `GET /about` with `maxRedirects: 0` answers **301** with `Location` ending `/who-we-are` (query preserved); `/why-we-exist` and `/who-we-are` still 200 | the redirect is NOT followed — following it would prove a 200, not the 301 | `/about` 200s, redirects elsewhere, or drops the query string |
| AC-3.7a *(restated)* | `B:` the Blueprint item is the **sole** `data-nav-cta`; at rest it computes a lime **border** with a non-lime background, and on hover the background **fills** `--lime`; `border-radius` ≥ 9999px | exactly **1** CTA among 7 items; at-rest AND hover states both asserted | the pill is filled at rest, a second CTA appears, or hover does not fill |
| ~~AC-3.8a~~ | **REVERSED by Amendment 8 (2026-08-26).** The About dropdown parent no longer exists; `/about` is a 301. Row deleted from the machine-readable proof table. | — | — |
| AC-7.4a *(new)* | `B:` the restored grid renders `HUMAN_ARCHIVE_VIDEOS` in order — LUCY 056, FARID 038, ABDI 041, MARISSA 060, with names, numbers, locations; iframe count goes **0 → 1 → 0** on hover/leave; a second card's hover keeps the count at **1** with the src swapped; unmute click reports `data-muted="false"`; no overflow after activation at 390/834/1440. `T:` exact-content unit tests over `HUMAN_ARCHIVE_VIDEOS` | four names + numbers + locations asserted; iframe count asserted at every step | two players live at once, an iframe at load, or a player leaking after leave |
| AC-7.5a *(new)* | `B:` the playlist link's visible label is exactly **Watch the Human Archives** and its href is the `ARCHIVE_PLAYLIST_URL` constant (`PLdA-mx7SlQ_A`); no "Coming Soon"/"to be released soon" in head or body; live metadata restored | label and href asserted by identity against the constant | teaser wording survives, or the button hardcodes the URL |
| AC-2.9a *(new)* | `B:` the homepage ships **0** iframes at load; clicking the facade mounts exactly **1** `youtube-nocookie.com/embed/-r011ECKr7M`; poster visible before the click; reload returns 0; no overflow after activation | iframe count asserted before and after activation | an iframe in the initial DOM, or activation stacking a second player |

### ★★★★★ Amendment 3 — amended criteria
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-2.1b | `T:` `src/lib/brand.ts` exports `INDIGENOUS_LINE = "Indigenous-led. Canadian-built"`; `B:` footer renders it **exactly**; `T:` **no file other than `brand.ts` contains the literal**, nor any superseded variant (`Indigenous and Canadian-owned`, `Indigenous-founded`) | asserts the constant is non-empty and the footer node was found | any surface hardcodes the copy, or a superseded variant survives |
| AC-2.8b | `B:` the maple-leaf node (`data-glyph="maple-leaf"`) and the `INDIGENOUS_LINE` text node share an ancestor **within 2 DOM levels**; **both implementation and test import the same constant** | both nodes located before distance is measured | the leaf drifts from the line, or proof and implementation diverge on the copy |
| AC-6.12a | `B:` Blueprint hero renders `INDIGENOUS_LINE`; `assert_eq` occurrences of `Indigenous-founded` sitewide to **0** | hero node found | the PDF's original wording ships |
| AC-6.9b | `B:` every Tier-2 section is a `<details>`; **and the no-JS run** (JavaScript disabled) opens and reads each one | asserts ≥6 `<details>` found **in the no-JS context** | Radix/JS-dependent disclosure returns, or content is unreachable without JS |
| AC-6.9c | `B:` `assert_ge` count of `details[data-section-id]` **deduplicated by id** to 6 | dedup applied before counting; asserts ids are unique | nested attributes inflate the count (Codex measured 8 for 2 sections) |
| AC-6.9d | `B:` visible-normalized-prose-chars ÷ complete-normalized-prose-chars ≤ **0.40**, against the canonical fixture | **both** a numerator floor and a denominator floor asserted | an empty or stub page scores a perfect ratio |
| AC-5.4b | `T:` rendered principle titles `toEqual` the shared fixture `PRINCIPLE_TITLES` (period-free), consumed by **both** `content.ts` and the test; `assert_eq` titles matching `/\.$/` to **0** | all six compared by identity to one fixture | any of the three historical forms (`Build the reps.` / `Built in the Reps.` / period-free) diverge between const, render, and test |
| AC-X.7a | CI: `git check-ignore` returns **nothing** for every path under `.approvals/`; each artifact validates against its JSON schema and carries `{reviewer, timestamp, deployment_url, commit_sha, verdict}`; every release gate that blocks on a review reads only from `.approvals/` | asserts ≥1 artifact present and ≥1 path tested | any review artifact is gitignored, unschema'd, or unbound to a commit |

### ★★★★★ Amendment 2 — amended criteria *(previously implemented but never given proof rows — bijection gap)*
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-4.2b | `T:` the consolidation covers exactly the count in `docs/type-inventory.md` (**47**), and that file was produced by the **string-literal** scanner whose SHA-256 it records — not a `className="…"` regex | asserts the two known-invisible sites are in the inventory: `podcast_.$slug.tsx:150`, `episode-player.tsx:138` | a regex scanner is substituted and silently under-counts |
| AC-6.10a | `B:` Client Proof renders with heading **and** `id`; the testimonial slot renders an explicit *pending* state; `assert_eq` bracket-placeholder text (`/\[[A-Z ']+\]/`) to **0** | section id asserted present, pending marker asserted present | the section is omitted, stubbed with lorem, or ships an invented quote |
| AC-6.11a | `B:` sovereignty copy asserts **no domain definition** (practice nouns only); prohibited-claim regex (broadened — *compliant*, *guarantees compliance*, *government approved*, *certifying*) matches **0** in product/offer sections; `POSITIONING_DISCLAIMER` renders ≤2 DOM levels from every Maturity Score mention; `.approvals/positioning-review.json` present with copy+controls hashes **re-verified at gate time** | ≥8 prohibited cases exercised as fixtures; ≥1 allowed personal credential asserted to survive; every Maturity Score occurrence checked | an overclaim ships, a domain definition is asserted, legitimate bios are banned, or copy changed after sign-off |
| AC-X.6a | CI: the branch is deployed to `$STAGING`, **and** `.approvals/typography.json` + `.approvals/who-we-are-review.json` both validate and bind to the promoted `commit_sha`, **before** production promotion | both artifacts asserted present, schema-valid, and SHA-matched to the deploy | production is promoted with either gate uncleared or bound to a different commit |

### ★★ Amendment 1 — amended criteria
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-3.1a *(amended 2026-08-26 — current row in the Amendment 8 table)* | `T:` `NAV` deep-equals the binding tree fixture: 6 top-level items in order `About, The New Human Era, The Human Archive, Podcast, Contact, Blueprint`; **exactly 2** have `children`; About's children are `[Why We Exist, Who We Are]`; Blueprint's are `[Human Readiness, Governance & Sovereignty, AI Strategy]`. `B:` desktop bar renders 2 dropdown triggers | full deep-equal on the tree, not a length check | any label, order, or nesting drifts from the binding tree |
| AC-3.2a *(amended 2026-08-26 — current row in the Amendment 8 table)* | `B:` open the About dropdown; assert **2** links resolving to `/why-we-exist` and `/who-we-are`, both returning **200**; **and** the two are distinct URLs | both fetched, both 200 | a child that 404s, or the two collapsing to one destination |
| AC-3.5a | `B:` `/who-we-are` returns 200 and renders **3** team entries (Shane James · Founder & CEO; Sid · AI, Cybersecurity & Governance; Maya · Human Readiness & Organizational Change) plus the "Built for Human-First AI Transformation" content; `assert_eq` count of `\[Last Name\]` to **0**; **release gate blocks on `.approvals/who-we-are-review.json`** | 3 entries + 3 roles + review artifact present | a surname is invented, a placeholder ships, or it reaches prod without Shane's sign-off |
| AC-3.6a | `B:` all three pillar destinations return **200** and each renders its own H1: Human Readiness, Governance & Sovereignty, AI Strategy | 3 routes fetched, 3 distinct H1s | a pillar 404s or two share a heading |
| AC-3.7a *(amended 2026-08-26 — current row in the Amendment 8 table)* | `B:` the Blueprint nav item's computed `background-color` == `--lime` and its `border-radius` ≥ 9999px (pill), **and** no other top-level nav item matches — i.e. it is *visually distinct*, not merely styled | asserts exactly **1** pill among 6 items | Blueprint renders as a plain text link, or every item becomes a pill |
| AC-4.6a | covered by the AC-4.1/4.3 rows (two-register scale + both voices on the specimen) | — | — |
| AC-5.8a | covered by its layout sub-proof row below (band alternation, eyebrow+rule, lime-accent-only, alternating splits, 8 px radii) | — | — |
| AC-5.9a | `T:` **no** `HOME_PRINCIPLES` title matches `/\.$/`; **and** the rendered principle titles on `/` and `/the-new-human-era` likewise | asserts all **6** titles checked | any trailing period survives in const or render |
| AC-2.7a *(homepage surface restored 2026-08-26 — Amendment 8)* | `B:` the archive CTA's accessible name is exactly **"Explore the archive"** and the NHE CTA's is exactly **"Read the New Human Era"**; `assert_eq` occurrences of "Explore the human archive" and "Learn more" to **0** sitewide | both positive strings asserted **and** both negatives | an old label survives anywhere |
| `SUPERSEDED` ~~AC-2.8a~~ | **SUPERSEDED by AC-2.8b.** Original: the maple-leaf node and the "Indigenous-led" text node share a common ancestor **within 2 DOM levels** — i.e. adjacency, not merely co-presence on the page | asserts both nodes found before measuring distance | the leaf floats loose in the hero (the pre-amendment reading) |
| AC-6.9a | **LIVE — mechanism superseded by AC-6.9b/c/d; these five sub-assertions STAND.** See §5 Phase 6. `B:` (a) **≥6** sections render default-collapsed, counted as `details[data-section-id]` **deduplicated by id** (AC-6.9c — never `[data-state="closed"]`, which counted 8 for 2 sections); (b) the ratio **as defined by AC-6.9d** — visible ÷ complete normalized prose characters against the canonical fixture, with both floors — ≤ **40%**; (c) **scroll depth to the *last* Tier-1 element** ≤ 4 viewport heights at 1440×900 — *re-aimed: the old "first CTA within 2 viewports" was **vacuous**, since S6.6 puts a CTA in the hero and it could never fail*; (d) the 16 AC-6.2 sections are **all still in the DOM**; (e) **heading-size *distribution*, not just variety** — every Tier-1 heading is strictly larger than every Tier-2 heading (computed `font-size`), and the 16 resolve to ≥3 distinct steps. *Re-aimed: with a two-register scale, "≥3 distinct steps" alone was near-vacuous* | every sub-assertion has its own floor; (d) re-runs AC-6.2's ordered-id check so digestibility cannot be bought by deleting content | a flat 16-section wall, **or** a "digestible" page that achieved it by dropping sections |

### Component 4 — `typography-system`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-4.1 | `T: styles.test.ts` (**new — nothing currently reads `styles.css`, V23**) — assert `@utility` blocks for h1,h2,h3,h4,eyebrow,body **in both registers** (`-caps` Oswald and `-prose` Work Sans, V38); each declares family resolving to `--font-display`/`--font-sans`, plus weight, size, line-height | asserts parsed rule count `≥ 10` **and** that ≥1 rule per register exists | a level missing, a family unset, **or only the uppercase register defined** |
| AC-4.2 | `T:` `assert_eq` **combined** `className` occurrences of `display`, `display-strong`, `archive-question`, `section-label` (incl. `-dark/-light/-rule`) to **0** across `srcNonTestFiles`; `T:` `styles.css` no longer defines those four names; `T:` exactly one documented weight set, **and the eyebrow+rule role still resolves** (V39) | **Derived floor, never retyped** (V54-V55): the scan asserts the pre-migration count equals the **47** recorded in the committed `docs/type-inventory.md`, that the scanner's own SHA-256 matches, and that it walked **≥15** non-test files. **Plus** a positive assertion that the eyebrow+rule role survives | **any** of the four survives; *or* the eyebrow+rule pattern is deleted; *or* the inventory and the scan disagree (which is how a hand-typed number gets caught) |
| AC-4.3 | `B:` `/type-specimen` renders **both display voices side by side** — the condensed uppercase register and the light sentence-case register (V34, V37) — plus h1–h4, eyebrow, body; each row shows live computed `font-family`, `font-weight`, `font-size` px, `line-height`, `letter-spacing`; and renders the four mockup exemplar strings in their proposed classes | asserts **≥10** specimen rows, each with 5 non-empty computed values, **and** that ≥1 row computes `font-weight ≤ 300` with `text-transform: none` | a hardcoded value, a missing level, **or a specimen that shows only the uppercase voice** |
| AC-4.4 | **G1 artifact**: `.approvals/typography.json`, conforming to the **one shared review schema** below, with `evidence.scale_sha256`. Release gate asserts it exists, validates, the hash still matches, and every commit touching page type is dated after `timestamp` | hash equality — approving one scale and shipping another fails | scale edited post-approval, or any type commit predates approval |

> #### ★★★★★ ONE schema for every review artifact (C2)
> Three artifacts previously declared **three different field sets** — typography used
> `{specimen_url, approved_by, approved_at, …}` while AC-X.7a required
> `{reviewer, timestamp, deployment_url, commit_sha, verdict}`. They cannot both be the
> "common schema". **Canonical, `.approvals/schema.json`, for all three:**
> ```json
> { "reviewer": "string", "timestamp": "ISO-8601", "deployment_url": "string",
>   "commit_sha": "string", "verdict": "approved | rejected", "notes": "string?" }
> ```
> **Extension rule:** an artifact may add a typed `evidence` object holding the hashes it must
> bind. typography → `{scale_sha256}`; positioning → `{copy_sha256, controls_sha256}`;
> `/who-we-are` and Maya's staging review → `{}`. (The earlier "exactly one extra field" rule
> was internally impossible — positioning needs two.) **No artifact uses `specimen_url`,
> `approved_by` or `approved_at`; those are the obsolete typography-only names.**
> `.approvals/typography.json`, `.approvals/who-we-are-review.json`,
> `.approvals/maya-staging-review.json`, `.approvals/positioning-review.json` all validate
> against it, and CI asserts `git check-ignore` rejects nothing under `.approvals/`.
| AC-4.5 | `T:` `the-new-human-era.tsx` + `be-human-ai.tsx` contain **zero** `clamp(`, `text-[…vw]`, `text-[…rem]`, or Tailwind `text-{xs..9xl}`; **and** every heading element in both carries a `type-*` class *(positive assertion, per A-B3)* | asserts heading count `≥ 12` per page before checking | a bespoke size sneaks back, **or** the file has no headings (vacuous pass) |

### Component 5 — `new-human-era`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-5.1 | `B:` page renders ≥ 2 500 words of manifesto prose; `T:` fidelity fixture — ≥ 20 verbatim sentences extracted from the PDF all appear | ≥20 sentence matches, word floor | a stub page passes on section headings alone |
| AC-5.2 | `T:` all 9 named sections present as elements with stable ids: Human Wealth, Human Debt, Human Reps, Human Mode, The Double Return, "Some friction is where humans are built", The framework, "What we are actually building", The invitation | `assert_eq` id count to **9**, ids asserted individually by name | any section missing or renamed |
| AC-5.8a *(layout sub-proof — not a separate criterion)* | **Layout conformance to the mockups** *(new — Maya's mockups are authoritative)*: `B:` every section is a full-bleed band alternating cream/ink; each opens with an eyebrow + lime rule; imagery carries `border-radius: 8px`; the alternating image-left/image-right split holds; the lime dot divider renders where mockup 3 places it | asserts band count `≥ 6`, alternation actually alternates (no two adjacent bands share a background), and `≥4` rounded images | a flat single-background page, or bands that don't alternate |
| AC-5.3 | `T:` the five chain nodes appear **in order** in document order | order asserted, not mere presence | reordered or partial chain |
| `SUPERSEDED` ~~AC-5.4~~ | **SUPERSEDED by AC-5.4b** (period-free, shared fixture). Original: six rendered titles `toEqual` `HOME_PRINCIPLES`, in order | exact array equality | any drift between page and const |
| AC-5.5 | `T:` `content.ts` has no `PRINCIPLES` export (`import * as content` → key absent); `assert_eq` grep of `\bPRINCIPLES\b` minus `HOME_PRINCIPLES` to 0 | module-level key check, not just grep | the const or a reference survives |
| AC-5.6 | `T:` zero `[HUMAN ARCHIVE QUOTE` in rendered output; **and** the three rendered quotes each `toEqual` an `ARCHIVE[n].quote` string, with name + location + `no` also present | all 3 matched against the const, not literals | a retyped/invented quote passes |
| AC-5.7 | `T:` last 200 chars of rendered text contain "What's my Human Rep today?" **then** "Welcome to the New Human Era." in that order | positional (tail), not anywhere-in-page | the closer appears mid-page |

### Component 6 — `blueprint-page`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-6.1 | `T:` fidelity fixture — ≥ 25 verbatim sentences from PDF v4 present; `B:` ≥ 3 000 words | sentence + word floors | a skeleton page |
| AC-6.2 | `T:` **16 named** sections present as ids, asserted **by name and in PDF order** (`assert_eq` on the ordered id array) | ordered array equality — *the iteration-1 gate counted 16 arbitrary `id=` strings and would pass on 16 unrelated divs* | any section missing, renamed, or out of order |
| AC-6.3 | `T:` rendered DOM contains `$795 CAD`, `$1,500 CAD`, `3 business days`; `T:` each is sourced from a named const, not a literal in JSX | all 3 asserted individually | a price edited in one of several places |
| AC-6.4 | see AC-3.4 | — | — |
| AC-6.5 | `T:` **traceability fixture** `blueprint-controls.json` maps each public claim in the Risk & Governance section → a `controls.yaml` id or domain; test asserts every mapped id resolves in the real YAML, **and** ≥ 8 domains are represented; **plus** prohibited-claim test (below) | ≥8 domain coverage; every id must resolve | copy drifts from the spine, or an id is invented |
| AC-6.11a *(prohibited-claim sub-proof)* | **Prohibited-claim test, broadened (Codex #7).** Rendered `/be-human-ai` **and** the governance pillar must not match `/\b(certifie[sd]\|certifying\|certification\|compliant\|compliance guarantee\|guarantees? compliance\|government[- ](approved\|recognized)\|accredited)\b/i` **within product/offer sections** — the earlier regex missed *"compliant"*, *"guarantees compliance"*, *"government approved"*, *"certifying"*. Personal credentials ("certified cybersecurity professional", "certified counsellor") are **explicitly allowed** and asserted to survive | disclaimer asserted positively; ≥1 allowed personal-credential string asserted present; ≥8 prohibited cases exercised as unit fixtures | an overclaim ships, or the test bans legitimate bios |
| AC-6.11a *(disclaimer sub-proof)* | **The disclaimer is pinned, not paraphrased.** `src/lib/brand.ts` exports `POSITIONING_DISCLAIMER` with **this exact literal**, and the test compares by identity (not by keyword): <br>`"The AI Governance Maturity Score is a readiness and assurance tool. It is not a certification, it is not a compliance guarantee, and it is not recognized by any government."` <br>— a direct restatement of `controls.yaml:5`. A test asserts every clause of `controls.yaml:5`'s positioning is represented and that the constant is the only definition. `B:` it renders adjacent (≤2 DOM levels) to every Maturity Score mention | disclaimer constant non-empty; every Maturity Score occurrence checked, not just the first | copy drifts from the controls spine, or one mention is left undisclaimed |
| AC-6.11a *(sign-off artifact sub-proof)* | **Legal sign-off is a release artifact, not a promise.** `.approvals/positioning-review.json` — canonical schema + `evidence.{copy_sha256, controls_sha256}`. Release gate blocks without it, **and** re-checks that `copy_sha256` still matches the rendered claims and `controls_sha256` still matches `controls.yaml` | both hashes re-verified at gate time | copy or the controls spine changed after approval — the "approve one thing, ship another" hole |
| AC-6.5 *(traceability sub-proof)* | **Claim traceability is structured data.** `docs/blueprint-claims.json` maps every public risk/governance claim → a `controls.yaml` control id or domain; a test asserts each id resolves in the real YAML and ≥8 domains are represented | every id must resolve; domain floor | a claim is invented or an id goes stale |
| AC-6.6 | `T:` hero contains an inline `<svg>` with `aria-label`/`<title>` matching `/maple leaf/i` and a `data-glyph="maple-leaf"` hook; `T:` the previous generic-leaf node is absent | both directions asserted | the old glyph survives beside the new one |
| AC-6.7 | `T:` three team entries render with names **Shane James**, **Sid**, **Maya** and their exact role strings; `assert_eq` count of `\[Last Name\]` to **0** | 3 entries + 3 roles + placeholder-free | a bracket placeholder ships |
| AC-6.8 | see AC-2.6 (the 3× 30-min assertion) | — | — |

### Component 7 — `human-archive`
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-7.1 | `T:` `ARCHIVE` deep-equals a frozen fixture of the 4 entries — names, locations, `no`, slugs, quotes | full deep-equal on 4×6 fields | any field edited |
| AC-7.2 | `T:` each `ARCHIVE[n].image` resolves to a file on disk whose SHA-256 is in the recovery manifest; `B:` all 4 render with `naturalWidth > 0` | 4 asserted individually, in DOM | a portrait falls back to a pointer or a broken img |
| AC-7.3 *(the `/the-human-archive` half is live again 2026-08-26 — Amendment 8; the page is now proven by AC-7.4a/AC-7.5a)* | `B:` `/the-human-archive` **and** `/` archive section — every `<img>` has `naturalWidth > 0` | asserts `≥4` images found on each surface | zero-image vacuous pass |

### Cross-cutting
| AC | Proof | Non-vacuity floor | Fails when |
|----|-------|-------------------|-----------|
| AC-X.1 | `git merge-base --is-ancestor a6a377a HEAD`; patch-ID equivalence: `git cherry -v origin/feat/podbean-rss-integration HEAD` yields **no `-` lines**; **plus a source-similarity check** — no identical ≥5-line run between our nav files and the reference blobs (S3.6a), since `git cherry` sees commits, not convergent hand-written code (no commit of ours is patch-equivalent to one of theirs). *(Iteration-1 used `git log origin/feat..HEAD`, which printed 217 commits and proves nothing.)* | asserts the cherry output parsed ≥1 line total | ancestry broken or a cherry-pick detected |
| AC-X.2 | `bun test src/` exits 0 **and** reports `0 fail`; **delta gate** additionally asserts no test in `.baseline/failing-tests.json` is still failing | parses the summary line; asserts total ≥ 620 so a collapsed run can't pass | any failure, or the suite silently shrinks |
| AC-X.3 | all three `tsc --noEmit` invocations exit 0 | three separate exits | any type error |
| AC-X.4 | `eslint .` exits 0 **and** `assert_eq` error count 0 | asserts ≥1 file linted | any error |
| AC-X.5 | **`scripts/verify/prod-acceptance.sh`** — one assertion per component against `$PROD` with `-fsSL`: (1) image inventory — **count derived from `docs/asset-inventory.json`**, every URL 200; (2) footer renders `INDIGENOUS_LINE` (`Indigenous-led. Canadian-built`, AC-2.1b) and no "Sydney"; (3) header CTA → 15min; (4) `NAV` 6 items, one nav on the **12 `expectsSingleNav` surfaces** (from `SURFACES`, B5) / two on Blueprint; (5) `/the-new-human-era` closer + 6 principles + framework chain; (6) `/be-human-ai` 16 ordered sections + 3 prices + 3× 30-min CTAs + disclaimer; (7) 4 portraits render | **each of the 7 components asserted**, each with its own floor; script exits nonzero on the first failure | *iteration-1 covered fragments of 4 of 7 components and could not fail* |

---

## 4. Phase Overview (Option A3)

```
PHASE 0  Branch · capture · pin baseline · publish specimen   [CRITICAL PATH]
         └─ S0.6/S0.7 (type inventory + specimen) MAY overlap Phase 1 — the one
            carved exception to "single front". Near-zero merge surface: Track A
            touches src/assets/**, content.ts, imagery.ts, index.tsx imports;
            the inventory touches className strings and styles.css only.
  S0.1 branch from a6a377a          S0.2 bulk asset capture (URGENT, D1)
  S0.3 durable backup + restore drill   S0.4 PIN baseline (do not fix)
  S0.5 delete dead display-strong   S0.6 FULL type inventory
  S0.7 build + publish specimen  ───────────────►  ####  G1 (AC-4.4)  ####
  S0.8 send the ONE open-questions message                #  USER GATE  #
                                                          ###############
        │                                                        │
        ▼   (single front, dependency order, while G1 pends)      │
  PHASE 1  asset-pipeline   (AC-1.x)                              │
  PHASE 2  human-archive    (AC-7.x)   [needs P1]                 │
  PHASE 3  site-chrome+nav  (AC-2.x, AC-3.1-3.3)                  │
                                                                  │
        ┌─────────────────────────────────────────────────────────┘
        ▼  G1 CLEARED
  PHASE 4  apply scale to existing pages   (AC-4.1,4.2,4.5)
  PHASE 5  new-human-era   [needs P2 quotes + G1]   (AC-5.x)
  PHASE 6  blueprint-page  [needs G1]               (AC-6.x, AC-3.4)
  PHASE 7  formatting-only eslint --fix  ◄── LANDS LAST (Tension 1)
  PHASE 8  full gate + typography guard + Vercel-parity build
  PHASE 9  merge (never rebase) · deploy · prod acceptance
```

**Dependencies honoured:** P1 → P2 (AC-7.2) and → the homepage collage; **G1** → P4/P5/P6
(AC-4.5); P2 → P5 (AC-5.6 needs real quotes); `controls.yaml` → P6 (AC-6.5).

---

## 5. Implementation Steps

### PHASE 0 — Branch, capture, pin, publish the specimen

**S0.1** — `git fetch origin && git switch -c feat/site-restructure a6a377a`.
**Push immediately** and never rebase thereafter (V17). → *AC-X.1*

**S0.2 — 🔴 FIRST. Bulk asset capture.** `scripts/recover-assets.ts`:
- Globs `src/assets/*.asset.json` (never hardcodes 46 — V1).
- `GET https://id-preview--${project_id}.lovable.app${url}` (V6).
- **Retry/resume/backoff *in the script itself*** (was only in the pre-mortem before):
  3 attempts per asset, exponential backoff 1s/4s/16s, resumable — an asset already
  present with a matching SHA-256 is skipped, so a re-run costs nothing.
- **Integrity:** assert `bytes.length === pointer.size` **and** `content-type === pointer.content_type`;
  compute SHA-256; write **`src/assets/asset-recovery-manifest.json`** (`{asset_id, filename, sha256, bytes}`).
- Writes the **byte-identical original** beside its pointer (B′1 — *not* a derivative).
- Emits a per-asset report to **`.baseline/asset-recovery-report.json`** (tracked — V53);
  **exits nonzero** listing failures by `asset_id`. No silent skips.
→ *AC-1.1, AC-1.2*

> **★★★ N4 — two different things were both called "the manifest". Disambiguated:**
>
> | Artifact | Contains | Proves | Written by |
> |---|---|---|---|
> | **`src/assets/asset-recovery-manifest.json`** | SHA-256 + byte length of the 46 **originals** | **AC-1.1** (the fetched binary sits beside its pointer, unmodified) | S0.2 |
> | **Vite build manifest** (`build.manifest: true`) | fingerprinted URLs of the **derivatives** Vite emitted | **AC-1.6** (no image 404s in production) | `vercel build` |
>
> **The originals can never appear in the Vite manifest** — nothing imports them, so Vite
> never processes them. That is correct and intended, not a gap. An implementer who goes
> looking for originals in the build manifest will find none and must **not** "fix" it by
> importing 85 MB into the bundle or by weakening the AC-1.6 check. AC-1.6 checks
> *derivative* URLs; AC-1.1 checks *original* SHA-256s. They never meet.

> ### ★★★ S0.2b — ASK BEFORE THE IRREVERSIBLE PUSH (N6). Ordering defect, now fixed.
> Iteration-2 pushed 85.4 MB in S0.3.1 and *then* asked, in S0.8 Q4, whether 85.4 MB in git
> history was acceptable. **Principle 1 and `AGENTS.md:1-10` forbid the only remedy** —
> `filter-repo`/BFG is a history rewrite. So a "no" answer would have had no compliant fix:
> the question was arranged to become unanswerable before it was asked.
>
> **Split the ask.** **Q3** (pause Lovable publishing / branch-sync scope) and **Q4** (85.4 MB
> in history) are sent **now, before S0.3's push**. The other questions travel later with S0.8.
>
> **Capture is urgent (D1); the *commit* is not.** S0.2 already has the bytes on disk and
> S0.3.2 puts them in a durable release asset. If Q4 stalls, capture and back up regardless,
> and defer only the commit — which costs nothing, because the release asset already closes
> the data-loss risk.

**S0.3 — Durable backup + restore drill.** *(A-B1/C2: `.omc/` is gitignored, V20/V53.)*
1. **After Q4 clears (S0.2b)**, commit the 46 originals + `asset-recovery-manifest.json` to
   the branch and **push** — the push is then a second off-machine copy.
2. Upload `assets-raw-<sha>.tar` as a **private GitHub release asset** on the repo
   (`gh release create assets-backup-<date> --repo TheBeHumanCompany/… <tar>`).
3. **Free second source for the 4 portraits** (V21) — extract `archive-{adewolf,anton,arlina,bella}.jpg`
   from `origin/feat/podbean-rss-integration` via `git show <ref>:<path>` and record their
   SHA-256s in the manifest as `alt_source`. *Reading blobs is explicitly permitted; nothing
   is merged or cherry-picked.* Iteration-1 dismissed this — wrongly; it trades a permanent
   host-independent copy against a host that is merely up today.
4. **Restore drill (Phase 0 exit condition):** in a clean temp clone on a *different* path,
   `gh release download` the tar, extract, and assert all 46 SHA-256s match the manifest.
   `assert_eq "$(matched | count)" "$(jq length docs/asset-inventory.json)"`. **`ls | wc -l` is not a backup test**, and the expected value is derived, not typed.
→ *AC-1.1*

**S0.4 — PIN the baseline; do NOT fix it.** *(Architect Tension 1 — decisive.)*
A tree-wide `eslint --fix` at branch time creates a whitespace diff across bot-authored
files and holds it open for the branch's life, against a bot that **reverts** (V33) —
maximizing exactly the conflict surface we must minimize under V17.
- Commit `.baseline/eslint.json` (`bunx eslint -f json .`) and **`.baseline/failing-tests.json`**.
  **★★★ Record assertion *identity*, not just test names**: `{file, testName, assertedSubstring}`.
  The failure mode here is a source string going stale, so the delta gate must be able to tell
  *"still stale for the known reason"* from *"newly broken"* — two failures with identical
  names are not necessarily the same failure.
- **Gate on delta:** no *new* eslint error, no *new* test failure. `scripts/verify/delta.sh`
  compares against the baseline and exits nonzero on any regression.
- **The `eslint --fix` commit lands in Phase 7, after final integration**, where it cannot collide.
→ *AC-X.2, AC-X.4 (both fully satisfied by Phase 8, via Phase 7)*

> ### ★★★ Tension: `AGENTS.md:8-9` "keep the branch in a working state" vs. the pinned red baseline
> Verbatim: *"Commits you push to the connected branch sync back to Lovable and show up in the
> editor, so keep the branch in a working state."* S0.1 pushes immediately; S0.4 then
> deliberately preserves 2 failing tests and 33 eslint errors for the branch's whole life. A
> branch Lovable may surface in the user's editor is knowingly held non-working.
>
> **Synthesis — read "working state" as *no new breakage*, and make that explicit rather than
> implicit:**
> 1. **`BRANCH-STATUS.md` at branch root**, committed in Phase 0: names the two inherited
>    failures and the 33 eslint errors, states they are **pinned deliberately** with the
>    delta-gate rationale, and links the baseline files. Anyone — or Lovable — opening the
>    branch sees *intent*, not rot. This is the difference between a known-red baseline and an
>    abandoned branch, and it costs one file.
> 2. **`scripts/verify/delta.sh` runs as a pre-push hook**, so the branch *provably* never
>    regresses past the baseline. "No new breakage" becomes mechanically enforced, not asserted.
> 3. Per S0.2b, **Q3 and Q4 are answered before the irreversible push** — including whether
>    Lovable's sync covers feature branches at all (§11 Q3), which determines whether any of
>    this is even user-visible.
>
> The alternative — fixing the baseline at branch time — was rejected in iteration 2 for
> maximizing conflict surface against a reverting bot (Tension 1), and nothing here changes
> that. This synthesis honours the *purpose* of `AGENTS.md:8-9` (don't hand the user a broken
> editor) without adopting the tactic that breaks Tension 1.

**S0.4b — ★★★★ provenance: NO verdict is committed. My `e5196a3` claim is retracted.**

I asserted twice that `e5196a3` removed the assertion string, the second time at my highest
confidence marker, and used it to partially reject a correct review finding. **It is false.**
Isolated re-test — writing each blob to a file first, then `grep -cF`:

```bash
git show 'e5196a3^:src/routes/podcast.tsx' > /tmp/a && grep -cF 'visible.slice(1, 1 + shown)' /tmp/a   # 0
git show 'e5196a3:src/routes/podcast.tsx'  > /tmp/b && grep -cF 'visible.slice(1, 1 + shown)' /tmp/b   # 0
git show '3e03c8a^:src/routes/podcast.tsx' | grep -cF 'visible.slice(1, 1 + shown)'                    # 0
git show '3e03c8a:src/routes/podcast.tsx'  | grep -cF 'visible.slice(1, 1 + shown)'                    # 1  ← ADDED here
```
Neither side of `e5196a3` contains it. My earlier loop was corrupted by `^` expansion in an
unquoted zsh `for` list — a shell bug that produced a confident wrong number, which is
precisely why RULE 3 in `lib.sh` exists.

**What goes in the branch: the reproduction above and a range — never a named culprit.**
`3e03c8a` introduced the string; some later bot commit removed it before `6e3856f`. Pinning
which one is archaeology with no bearing on the work.

The **conclusion is untouched and was never load-bearing on the citation**: bot activity
stranded the assertion, which is why R2 exists. So the repair restates
the *current* invariants (page size declared; grid sliced by it; cards keyed on `slug.current`)
rather than deleting the rows. Also document the undocumented editorial ordering at
`podcast.tsx:84-96` (`episodeNumber === 5/39/38`) so a later reader does not "clean it up".

**★★★★★★★ S0.4c — CREATE every artifact the plan invokes. Complete manifest.**
A systematic sweep found **40** scripts, tests and generated files referenced somewhere in this
plan. Several — most seriously **`ac-suite.sh`, which the release gate calls** — had no creation
step at all; Phase 8 would have halted on missing files. Each row below is created in the phase
**before** its first use. The acceptance-fault test lives at **`scripts/verify/acceptance-faults.test.ts`**
(one path, used everywhere — the earlier `src/lib/blueprint/…` reference was a mismatch).

| Artifact | Created in | Contract |
|---|---|---|
| `scripts/verify/lib.sh` | **S0.4c** | `set -Eeuo pipefail`; `fetch`, `fetch_ok`, `assert_origin`, `assert_eq`, `assert_ge`, `count`. RULES 1/1b/2/3. |
| **`scripts/verify/ac-suite.sh`** | **S0.4c** | ⚠️ *Release-gate entry point.* Runs every live AC's proof, in order, and exits nonzero naming the first failure. Calls `ac-bijection.sh` first. |
| `scripts/verify/ac-inventory.ts` | **S0.4c** | Parses the spec; applies full-vs-partial supersession; writes `docs/ac-inventory.json`. |
| `scripts/verify/ac-bijection.sh` | **S0.4c** | Asserts live == rows == unique, 0 missing, 0 duplicate. *Current expected: 63/63.* |
| `scripts/verify/audit-scans.sh` | **S0.4c** | No scan enumerates files by bare `grep -r … src`; all route through `srcNonTestFiles()`. |
| `scripts/verify/audit-or-true.sh` | **S0.4c** | No `\|\| true` wraps a network call (RULE 1). |
| `scripts/verify/audit-count.sh` | **S0.4c** | No bare `\| wc -l` outside `count()` (RULE 2). |
| `scripts/verify/delta.sh` | **S0.4c** | No *new* eslint error / test failure vs `.baseline/`. Also runs as a pre-push hook. |
| `scripts/verify/g1.sh` | **S0.4c** | Validates `.approvals/typography.json`; re-checks `evidence.scale_sha256`; asserts type commits post-date `timestamp`. |
| `scripts/verify/restore-drill.sh` | **S0.4c** | Downloads the release asset into a temp clone on a different path; asserts every SHA-256 matches the manifest. |
| `scripts/verify/social-links.sh` | **S0.4c** | `HEAD`s all six footer social URLs; asserts exactly six found and all 200. |
| `scripts/verify/prod-images.sh` | **S0.4c** | Origin-asserted; inventory count == `docs/asset-inventory.json`; every image URL 200. |
| `scripts/verify/prod-acceptance.sh` | **S0.4c** | Origin-asserted first; one assertion per component; nonzero on first failure. |
| `scripts/verify/acceptance-faults.test.ts` | **S0.4c** | Runs `prod-acceptance.sh` against 8 seeded fixtures and asserts it **fails** on each. |
| `scripts/verify/visual-diff.ts` | **S0.4c** | Playwright; `SURFACES.length` × 3 viewports; before/after diff; flags >15% heading-box change. |
| `playwright.config.ts` | **S0.4c** | Browser runner config incl. the **JS-disabled** project used by AC-6.9b. |
| `src/lib/surfaces.ts` | **S0.4c** | `SURFACES` — `{path, kind, expectsSingleNav}`; a test asserts it agrees with `routeTree.gen.ts`. |
| `.approvals/schema.json` | **S0.4c** | Canonical review schema + typed `evidence` object. |
| `BRANCH-STATUS.md` | S0.4 | Records the pinned inherited failures and the delta-gate rationale. |
| `.baseline/eslint.json`, `.baseline/failing-tests.json` | S0.4 | Pinned baseline; failing tests recorded by assertion identity. |
| `scripts/recover-assets.ts` | S0.2 | Glob, fetch, retry/backoff/resume, integrity, report, nonzero on failure. |
| `scripts/recover-assets.test.ts` | **S0.2** | Fault-injects non-2xx, truncated body, wrong MIME; asserts each is reported and exits nonzero. |
| `src/assets/asset-recovery-manifest.json`, `.baseline/asset-recovery-report.json`, `docs/asset-inventory.json` | S0.2 | Emitted by the recovery run. |
| `scripts/type-inventory.ts` → `docs/type-inventory.md` | S0.6 | String-literal scanner (4 pinned rules); records its own SHA-256. |
| `src/lib/brand.ts` | **S3.2** | `INDIGENOUS_LINE`, `POSITIONING_DISCLAIMER`. Created before its first consumer. |
| `src/lib/booking.ts` | S3.4 | The two cal.com constants. |
| `src/lib/nav.ts`, `docs/nav-reference-notes.md` | S3.6a | Typed nav model; dated reference-reading note. |
| `docs/blueprint-sections.json` | **S6.0** | The 16-section fixture, one tier each. |
| `docs/blueprint-claims.json` | S6.5 | Claim → control-id traceability. |
| `.approvals/*.json` (typography, who-we-are, maya-staging, positioning) | G1 / S9.3 | Written by humans at their gates; schema-validated. |

**Gate ordering:** `ac-inventory.ts` → `ac-bijection.sh` → `ac-suite.sh`. A missing generated
file fails the gate loudly rather than being silently skipped.
→ *AC-X.2, AC-X.3, AC-X.4*

**S0.5** — Delete the **dead** `display-strong` utility (`styles.css:244-250`) — 0 call
sites (V24). Trivial, isolated, removes one of AC-4.2's four names at zero risk. → *AC-4.2*

**S0.6 — FULL type inventory (pre-gate).** *(A-B3: the iteration-1 plan sized this at 24
`clamp()` sites and would have discovered the rest **after** sign-off.)*
Enumerate **every type-setting declaration** in `src/routes` + `src/components`:
`clamp(`, `text-[…vw]`, `text-[…rem]`, Tailwind `text-{xs..9xl}`, and the four utilities.
Known landmines this surfaces that a `clamp(`-scan misses entirely:
- `index.tsx:117` — a **three-breakpoint ramp** (`text-[clamp…] sm:text-[clamp…] …`), not one value.
- `index.tsx:260` and `human-archive-section.tsx:146` — same shape **plus** `md:text-[5vw]`.
- `site-footer.tsx:10` — sized by `text-4xl` + a `max-sm:` clamp; invisible to a clamp scan.
**★★★★ SETTLED: the scope is 47 (Amendment 2, decision 1). My earlier scanner was defective.**

| Scope | Call sites | Status |
|---|---|---|
| The four AC-4.2 names (`display` · `display-strong` **0** · `archive-question` · `section-label`) | **36** | in scope |
| + `section-label-{dark,light,rule}` | **47** | ← **the binding scope** |
| + `eyebrow` (45) | 92 | **explicitly OUT** (Amendment 2) |
| *plus* the four `@utility` definitions in `styles.css` | +4 | deleted, not migrated |

> **★★★★ Why I was wrong, and why it matters more than the number (B3).** My scan matched
> only `className="…"` and `` className={`…`} ``. It **structurally cannot see** two real call
> sites, both verified:
> - `src/routes/podcast_.$slug.tsx:150` — `const SECTION_HEADING = "section-label …"`, a bare
>   string constant, no `className=` anywhere near it.
> - `src/components/episode-player.tsx:138` — `className={cn("eyebrow …")}`, a helper call.
>
> That is exactly +1 `section-label` and +1 `eyebrow` — reconciling **36/47/92** precisely.
> My V55 explanation ("the other count includes `@utility` definitions") was **wrong**: the
> other scanner never opens `styles.css`. **The defect was my scanner, not their arithmetic.**
>
> **So pinning the scanner's *output* was never enough — the plan must pin its *definition*.**
> An unpinned scanner defeats the whole derived-floor mechanism: it writes 46, the live scan
> agrees with itself, the gate greens, and `section-label` quietly survives in
> `podcast_.$slug.tsx`.

**`scripts/type-inventory.ts` — pinned specification (all four rules binding):**
1. **Scan string literals, not attributes.** Every `"…"`, `'…'` and `` `…` `` in non-test
   `src/**/*.{ts,tsx}`, regardless of syntactic position — this is what catches bare constants
   and `cn(...)` arguments.
2. **Tokenize on whitespace, then strip variant prefixes** (`sm:`, `lg:`, `hover:`, …) by
   taking the segment after the final `:`.
3. **Match the token exactly** against the utility set. Never substring-match — that is what
   makes `font-display` a false positive.
4. **Also scan `src/styles.css`** separately and report `@utility` definitions as a distinct
   category, so definitions are never conflated with call sites.

The script writes `docs/type-inventory.md`; the AC-4.2 gate asserts the live scan equals the
committed inventory **and** that the scanner file's own SHA-256 matches the one recorded in
it — so changing the scanner without regenerating the inventory fails the gate.

Output: `docs/type-inventory.md` mapping every declaration → proposed scale step.
**The user approves this mapping, not four numbers.**

**★ S0.6b — the scale must be two-register, not one-dimensional (V34–V38).** Maya's mockups
use **three** display voices; only one exists today:

| # | Voice | Mockup exemplars | Status |
|---|---|---|---|
| 1 | Oswald condensed **bold uppercase** | "THIS IS BIGGER THAN AI.", "IT IS UNDERNEATH THEM.", "SO WE STARTED ASKING ONE QUESTION…" | exists (`display`, `archive-question`) |
| 2 | Oswald condensed **light sentence-case** | "We are the Bridge Generation.", "Technology is advancing, and humanity has to advance with it." | **unreachable** — `display` hardcodes `text-transform: uppercase` (`styles.css:111`) |
| 3 | Work Sans **light, wide, sentence-case, very large** | "But what if your humanity is not the reward at the end of a good life?", "What if practising your humanity is how you build the life you want?" | **does not exist** |

So the scale gains an **axis** (`case` × family), not just more steps: `type-h{1..4}-caps`
(Oswald, uppercase) and `type-h{1..4}-prose` (sentence case, per-level family). Voice 2 is
Oswald-prose; voice 3 is Work Sans-prose at the largest steps.

**★ Font cost: provably zero — no new file, no new family, no new request, no extra bytes.**
Voice 3 is Work Sans 200/300 (V35, identified by same-image letterform comparison against
known Work Sans body copy in `nhe-04.jpg`). Work Sans **300 is already loaded**, and adding
200 returns the **byte-identical woff2 set** — Google serves a variable font, so the weight
list does not change the files at all (V36). Voice 2 needs **no font change whatsoever** —
Oswald 200/300 are already requested; it needs a utility that does not force uppercase (V37).

> **Do not "trim" the Oswald weight request as an optimization — it saves nothing (V42).**
> `Oswald:wght@200;300;400;500;700;800` and `Oswald:wght@200;700` serve the *same five files*;
> the multiple URLs are `unicode-range` subsets, not per-weight files. Trimming the list is
> cosmetic tidying with zero performance effect, so it is **not** in this plan's step list.
> (The one genuinely stale item — `display-strong` requesting an unrequested weight 600 — is
> moot: it is dead code with 0 call sites and is deleted in Phase 0, S0.5.)

⇒ *The font question is small — genuinely free. The design work — approving a two-register
scale — is the real cost, and it lands entirely inside the existing G1 gate.*
→ *AC-4.1, AC-4.2, AC-4.3*

**★ Reconciling "two axes" with "three voices".** Both framings are correct and compatible:
there are **two family axes** (Oswald-condensed, Work Sans-wide) but **three usable registers**,
because Oswald is needed in *both* uppercase and sentence-case. The third register is the one
that is easy to miss — it costs no font, only a utility that omits `text-transform` (V37) —
and omitting it from the specimen is exactly how AC-4.4 gets signed off on a scale that cannot
build mockup 2.

**S0.7 — Build and publish the specimen.** `src/routes/type-specimen.tsx` renders h1–h4 +
eyebrow + body with **live computed values** at three viewports, alongside the S0.6 mapping
table showing which current page/element lands on which step. Ship as a **deployed Vercel
preview URL** (real font rendering, not localhost).
**★ The specimen must show all three voices** (S0.6b), each rendered with its actual mockup
exemplar string so the user compares like with like — "THIS IS BIGGER THAN AI." beside "We
are the Bridge Generation." beside "But what if your humanity is not the reward at the end of
a good life?" It must also show the **eyebrow + lime rule** pattern (V39), since every mockup
section opens with it. A specimen omitting voices 2 and 3 would ask the user to approve a
scale that cannot build half the page — AC-4.4 would be satisfied in form and void in fact.
**Disposition (decided, was open):** the route is `noindex` via its `head()`, excluded from
`sitemap[.]xml.ts`, and **deleted in Phase 8** once the scale is approved and applied — it is
a review instrument, not a site page. → *AC-4.3*

> ### 🚦 **G1 — BLOCKING HUMAN GATE (AC-4.4)**
> Approval recorded in `.approvals/typography.json` against the canonical schema
> `{reviewer, timestamp, deployment_url, commit_sha, verdict}` plus
> **`evidence.scale_sha256`** (hash of the `styles.css` scale block); `deployment_url` is the
> specimen preview URL. The release gate re-checks the hash, so approving one scale and
> shipping another fails. **Phases 4, 5 and 6 do not start until this file exists and validates.**
> Phases 1–3 continue meanwhile. Escalate at 48 h rather than proceeding.

**S0.8 — Send ONE consolidated open-questions message** (§11). Not "ask during Phase 0" —
a single message at branch time, so the user answers once.

---

### PHASE 1 — `asset-pipeline`

**S1.1** — Generate WebP derivatives **in addition to** the committed originals (avatars
≤512 px, portraits/collage ≤1600 px) and point runtime imports at them. Originals remain
on disk beside their pointers for AC-1.1; derivatives serve the browser. Note V31: Vite's
default `assetsInlineLimit` is 4096 B, so sub-4 KB assets inline as `data:` URIs and will
**not** appear as manifest entries — the §7 sweep accounts for this.
**S1.2** — `src/lib/content.ts:1-9` — replace 4 JSON imports + `.url` derefs with file imports. → *AC-1.3, AC-1.5, AC-7.2*
**S1.3** — `src/lib/podcast/imagery.ts:5-43` — replace all 39. → *AC-1.3, AC-1.5*
**S1.4** — `src/routes/index.tsx:7` — replace the collage import and its `.url` deref. → *AC-1.3, AC-1.5*
**S1.5** — **Capture and rewrite `__root.tsx:95-96`** (V29): `og:image` and `twitter:image`
point at a Lovable R2 URL (live today, 1.99 MB). Fetch it, commit it as a real asset, and
serve it from our own origin. Otherwise a pass whose stated purpose is removing Lovable
image dependencies ships with two of them in every social preview. → *AC-1.6 (spirit), AC-X.5*
**S1.6** — `git rm src/assets/*.asset.json` — all 46 (V1), orphans included. → *AC-1.4*
**S1.7** — Add the `.asset.json` layering rule **scoped to `srcNonTestFiles`** (V27, A-B5) so
the rule does not match its own source text. Same scoping for the `cal.com` and typography
rules. → *AC-1.3*

### PHASE 2 — `human-archive`
**S2.1** — Verify `ARCHIVE` (`content.ts:85-118`) unchanged but for `image`. → *AC-7.1*
**S2.2** — Portraits render from committed binaries on `/the-human-archive` and `human-archive.$slug.tsx`. → *AC-7.2*
**S2.3** — Homepage archive section (`human-archive-section.tsx`) renders clean. → *AC-7.3*

### PHASE 3 — `site-chrome` + `nav-ia`
**S3.1** — Wire the six real social URLs (from S0.8). *Only genuinely blocked sub-step.* → *AC-2.3*
**S3.2** — Rewrite `site-footer.tsx`: keep strapline (`:9-13`), `Wordmark` + paragraph (`:17-21`),
"Stay Human." in Caveat/lime (`:22`); **add `INDIGENOUS_LINE` from `src/lib/brand.ts` — exactly `Indigenous-led. Canadian-built` (AC-2.1b; a fourth variant superseding all three in circulation)**; replace the six
`href="#"` (`:43`); **delete `Sydney · London · New York` (`:64`)**. → *AC-2.1, AC-2.2, AC-2.3*
**S3.3** — Delete `Sydney · London · New York` at `contact.tsx:46`. → *AC-2.2*
**S3.4** — `src/lib/booking.ts` with the two exact constants; add the scoped `cal.com` layering rule. → *AC-2.4, AC-2.5*
**S3.5** — Header booking CTA → `BOOKING_URL_15MIN`, in `site-header.tsx:46-63` and the mobile drawer (`:66-79`). → *AC-2.6*

**★★ S3.5b — CTA label copy (AC-2.7a).** Maya's wording is binding: the archive CTA reads
**"Explore the archive"** (not "Explore the human archive") and the New Human Era CTA reads
**"Read the New Human Era"** (not "Learn more"). Apply at every occurrence — homepage sections,
the archive section component, and the NHE entry points — and assert the superseded strings
appear nowhere. Maya also endorsed the *button style* on staging (08-15 13:46, *"Let's go with
this design"*): outline pills, matching the `EXPLORE THE ARCHIVE →` treatment in mockup 1.
→ *AC-2.7a*
**S3.6 — ★★ REPLACED by Amendment 1. `nav-ia` roughly triples.**
It is no longer "guard the flat nav that already exists" — it is *build a dropdown nav and
five new routes*. Iteration-2's S3.6 (a one-line guard step) is void.

**S3.6a — typed nav model. ★★★★ Independence must be auditable, not merely asserted.**

> **The tension is real:** AC-X.1's "reference-only" is enforced by implementer discipline
> exactly where the incentive to converge is highest — the nav is intricate, the reference
> already solved it, and V46's split-control trap is subtle. **`git cherry` detects
> patch-equivalent *commits*, not convergent hand-written code**, so AC-X.1's current proof is
> blind to the actual risk.
>
> **Ordering rule, so independence is a property of the process:**
> 1. Write `src/lib/nav.ts` **from the binding tree in `spec:283`, before reading the
>    reference model.** The spec is sufficient — it states the tree completely.
> 2. Record the reference reading as a **separate, dated note in `docs/nav-reference-notes.md`**,
>    citing what was learned (V44-V47: routes-not-anchors, the split-control trap) rather than
>    what was copied.
> 3. **Add a similarity check to AC-X.1:** assert no identical ≥5-line run between our
>    `src/lib/nav.ts` / `site-header.tsx` and the reference blobs
>    (`git show origin/feat/podbean-rss-integration:<path>`). Trivially-identical lines
>    (imports, closing braces) are excluded by the ≥5-line window.

Create `src/lib/nav.ts` with `NavRoute` (literal union of the generated route ids), `NavItem`,
`NavChild`, and a `mobileNavChildren` filter. The reference model (V45) is **evidence that
such a shape works — not a source to copy** (AC-X.1).
Encode the binding tree (V47 — the reference *tree* differs and is not the spec):
```
About ⌄        → Why We Exist, Who We Are
The New Human Era · The Human Archive · Podcast · Contact   (flat)
Blueprint ⌄ (lime pill)  → Human Readiness, Governance & Sovereignty, AI Strategy
```
→ *AC-3.1a*

**S3.6b — desktop + mobile nav.** Rebuild `site-header.tsx` on Radix `NavigationMenu` +
`DropdownMenu` + `Collapsible` — **all already vendored in `src/components/ui/` with deps in
`package.json` (V48); no new dependency.** Mobile renders the parents as `Collapsible`
sub-lists.
**⚠ Mind the split-control trap (V46).** A Radix dropdown *trigger* is a `<button>` that opens
the panel rather than navigating. So:
- **About** — its two children *are* its destinations; About itself is a label, not a page
  (V49). Its trigger does **not** navigate, and because neither child duplicates a parent
  destination, **no `self` child is needed**.
- **Blueprint** — a split control: the lime pill is a real `<Link>` to `/be-human-ai`, the
  chevron beside it opens the panel. `triggerNavigates: true`, so again no `self` child.
Assert both branches off the flag rather than exempting either by name.
→ *AC-3.1a, AC-3.7a*

**S3.6c — `/why-we-exist`.** The reversal *creates* this route; it does not exist on `main`
(V49). **Repurpose the existing `/about` page** (`src/routes/about.tsx`) as the mission page
rather than writing a third About-ish page, and add a **301 from `/about` → `/why-we-exist`**
so existing links and any indexed URL survive. See §11 Q9 — `/about`'s fate is *unstated* by
the amendment, so this is a recommendation, not an assumption I will action silently.
→ *AC-3.2a*

**S3.6d — `/who-we-are` (new page, I draft it).** Source: Blueprint PDF v4 **pp. 9-10** team
bios + the "Built for Human-First AI Transformation" section. Renders Shane James (Founder &
CEO), Sid (AI, Cybersecurity & Governance), Maya (Human Readiness & Organizational Change).
**Do not invent surnames** — the PDF's `[Last Name]` placeholders are stripped, not filled.
Shane's positioning content ("sells my creds", Shane 08-15) belongs here rather than on the
Blueprint page, which directly serves AC-6.9a by moving depth off the Blueprint.
**Gate: Shane reviews on staging before production** — recorded in
`.approvals/who-we-are-review.json`, checked by the release gate.
→ *AC-3.5a*

**S3.6e — three Blueprint pillar routes.**
**Decision: separate routes, not anchors.** Justification below (§5 "Routes vs anchors").

> ### ★★★★ B6 — THE ROUTE CONVERSION, SPECIFIED. Without this all three pillars render blank.
> **Verified:** `grep -c Outlet src/routes/be-human-ai.tsx` → **0**. Under TanStack file-based
> routing, adding `src/routes/be-human-ai/<pillar>.tsx` while `src/routes/be-human-ai.tsx`
> exists makes the latter their **layout route** — and a layout that renders no `<Outlet/>`
> renders its children **nowhere**. All three pillars would mount and display nothing.
>
> **This repo has already hit this exact bug and documented it.**
> `src/lib/route-shape.test.ts:56-60`, verbatim: *"`podcast.tsx` is a leaf that renders no
> `<Outlet/>`, so a `podcast.$slug.tsx` would nest inside it and never render — and the
> resulting 404s would be on the exact URLs this project exists to keep alive."* That is why
> `podcast_.$slug.tsx` carries the underscore escape. V44 also records that the reference
> branch solved it by converting to `be-human-ai/index.tsx`.
>
> **Required, stated as a file operation — not left to inference:**
> ```
> git mv src/routes/be-human-ai.tsx  src/routes/be-human-ai/index.tsx
> # then create as siblings:
> src/routes/be-human-ai/human-readiness.tsx
> src/routes/be-human-ai/governance.tsx
> src/routes/be-human-ai/ai-strategy.tsx
> ```
> `index.tsx` keeps the `/be-human-ai` path and stays a leaf; the pillars become siblings, not
> children, so no `<Outlet/>` is required anywhere. *(The alternative — `be-human-ai_.<pillar>.tsx`
> escapes — also works but scatters four related files across the routes root; the directory
> form matches what was reviewed on staging.)*
>
> **Guard, because the old one could not catch this:** iteration-3 said "confirm
> `route-shape.test.ts` still passes", but that file pins **podcast** ids only (`:70` is scoped
> to `/podcast.*\$slug/`) and `:52` is a `>= 8` floor — both stay green through a blank pillar
> page. Add an explicit assertion: the generated ids contain `/be-human-ai/`,
> `/be-human-ai/human-readiness`, `/be-human-ai/governance`, `/be-human-ai/ai-strategy`,
> **and** a rendered-DOM check that each pillar page emits a non-empty `<h1>` (AC-3.6a's floor
> already does this — it is the assertion that actually catches a blank layout).

→ *AC-3.6a*

**S3.6f — route-tree consequences. ★★★★ One surface list, imported everywhere (B5).**

> **Three hand-maintained copies drifted inside a single iteration** (V59): V58/AC-3.3 said 13
> visitable / 12 checked; V50/S3.6f said "9 → 14"; AC-X.5 still said "one nav on 10 surfaces"
> — *in the production acceptance script*; PM-3 said "10 surfaces (9 renderable + 2 dynamic)
> × 3 viewports = 33 shots", which is both internally inconsistent (9+2=11) and stale.
>
> **Fix: define the list ONCE as data and have every floor import it.**
> `src/lib/surfaces.ts` exports `SURFACES` — for each: `path`, `kind`
> (`static | dynamic-instance | redirect | endpoint`), and `expectsSingleNav`. Every consumer
> imports it: the AC-3.3 sweep, the AC-1.6 DOM sweep, `prod-acceptance.sh` (via a generated
> JSON), the visual-diff shot matrix, and the sitemap. **No number in this plan is a floor —
> `SURFACES.length` is.** A test asserts `SURFACES` and `routeTree.gen.ts` agree, so adding a
> route without updating the list fails rather than silently shrinking a sweep.

Post-Amendment-1 the list holds 11 static + 2 concrete dynamic surfaces *(count derived from
`SURFACES`, quoted for orientation only — every gate reads `SURFACES.length`)*,
plus `/about` as a `redirect` and `/sitemap.xml` as an `endpoint` (V58). AC-3.3 checks the
**12** with `expectsSingleNav`. Visual diff = `SURFACES.length` × 3 viewports — **derived, never typed**.

Regenerate `routeTree.gen.ts` and re-baseline against `SURFACES`.

**★★★★ B7 — `sitemap.xml.test.ts` will go red, and iteration-3 never named it.**
`src/routes/sitemap.xml.test.ts:42` keeps its **own duplicate** `STATIC_PATHS` (7 entries,
including `/about`), consumed at **`:66`** (feeding the exact `toEqual` at **`:71`**), floored at
**`:88`**, and asserted **exactly** again at **`:106`**. *(Reviewers disagreed on which lines —
verified: all four are real consumers; `:106` is the assertion that breaks first.)* its comment hardcodes *"the site
still has seven pages."* Adding 5 routes — or 301-ing `/about` (S3.6c) — turns `:106` red
unless the test's copy changes in the same commit. Worse: updating the test but not the route
silently drops 5 routes from the sitemap **with a green suite**.
→ Both `sitemap[.]xml.ts` and `sitemap.xml.test.ts:42` import `SURFACES`; the duplicate list
is deleted. R27 previously named only `route-shape.test.ts` — corrected.
→ *AC-3.3*

> #### Routes vs anchors for the three pillars — decided: **routes**
> | | Separate routes | Anchors on `/be-human-ai` |
> |---|---|---|
> | AC-6.9a (digestible) | ✅ **Moves depth off the page** — the single biggest lever against "information overload" | ❌ Makes the overload *worse*: all pillar depth stays on the one page |
> | AC-3.6a "destinations exist" | ✅ Unambiguous | ⚠️ An anchor is arguably not a "destination" |
> | Approved structure | ✅ Matches what Maya reviewed on staging (V44) | ❌ Diverges from the reviewed build |
> | SEO / shareability | ✅ Three indexable pages for three service lines | ❌ One page, three fragments |
> | Cost | 3 new route files + content | Lower — but the content still has to exist |
>
> **Routes win decisively because AC-6.9a and AC-3.6a point the same way**: the pillars are
> exactly the depth that makes the Blueprint page feel overloaded, and moving them out is
> simultaneously the fix for both. Anchors would satisfy AC-3.6a on the most generous reading
> while actively worsening AC-6.9a. (Reading the reference branch's *structure* is permitted
> diagnosis; **no code is copied** — AC-X.1.)

### PHASE 4 — Apply the scale *(post-G1)*
**S4.1** — Implement the approved **two-register** scale in `styles.css`:
`type-h{1..4}-caps` (Oswald, uppercase) and `type-h{1..4}-prose` (sentence case), plus
`type-body`. **`eyebrow` is extended in place, not duplicated** (V25 — 44 call sites already
use it; a second `type-eyebrow` beside it would be the fifth competing utility). **Preserve
the eyebrow + lime-rule role** under its successor name (V39). Add `200` to the Work Sans
range at `__root.tsx:104` — **byte-identical woff2 set, zero cost** (V36). Fix the stale
"Bebas Neue" comment at `styles.css:9-10` (V41). **Do not trim the Oswald weight list** — it
saves nothing (V42). → *AC-4.1*
**S4.2** — Migrate **all 47 call sites** of the four utilities incl. `section-label-*`
variants (V23), plus the 24 inline `clamp()` and the non-clamp declarations from S0.6.
Strip the inline `font-extrabold`/`font-extralight` overrides (`index.tsx:117,333`,
`social-section.tsx:111`). Delete the four old utility **names** from `styles.css` — but the
eyebrow+rule **role** survives under the scale, per V39. → *AC-4.2, AC-4.5*
**S4.3** — Run the visual-diff sweep (§7) against the pre-migration baselines. → *AC-4.5*

### PHASE 5 — `new-human-era` *(needs G1 + P2)*
**S5.1** Rebuild `the-new-human-era.tsx` (61 lines today) from the manifesto **copy** and
Maya's mockups for **layout**. → *AC-5.1*

**★ S5.1b — the design system the mockups establish.** Build to these, not to a generic
editorial template:
- **Section bands** — full-bleed, alternating **cream (ink text) / black (white text)**. No
  two adjacent bands share a background.
- **Section opener** — letterspaced uppercase eyebrow above a **~4 rem lime rule, 2-3 px**
  (the surviving `section-label` + `section-label-rule` role, V39).
- **Lime is an accent, never a fill.** Its only four jobs: (1) the eyebrow rule; (2) an
  underline beneath **one** key word mid-sentence — "make life <u>human</u>" (mockup 2),
  "advance <u>with it</u>" (mockup 2); (3) opening/closing quote glyphs on archive quotes
  (mockup 2); (4) a centered hairline divider with a **lime dot at its midpoint** (mockup 3).
  A lime-filled block is out of system.
- **Layout** — alternating image-left/text-right splits; **~8 px rounded corners on all
  imagery**; centered single-column for the big reflective statements (mockups 3, 4);
  two-column for the Bridge Generation section (mockup 2).
- **Voices** — condensed bold uppercase for the hammer lines; light sentence-case for the
  reflective statements (S0.6b). Both come from the approved scale; no bespoke sizes (AC-4.5).
→ *AC-5.8a, AC-4.5*

**S5.2** All 9 named sections as ids — verified PDF headings pp. 3,4,6,7,8,9,10. → *AC-5.2*

**★ S5.2b — the Human Archive section (mockup 1) maps 1:1 to manifesto p.9.** Build it as:
eyebrow "THE HUMAN ARCHIVE" + lime rule → heading "SO WE STARTED ASKING ONE QUESTION: WHAT
DOES IT MEAN TO BE HUMAN?" (voice 1) → the "More than 200 people have answered us so far…"
paragraph **verbatim** → `EXPLORE THE ARCHIVE →` outline pill (lime border, not lime fill).
Imagery: **one feature portrait above a row of four archive portraits** — the four are the real
`ARCHIVE` entries; the feature image is not a fifth entry. **Amendment 2 decision 6 closed this**
(mockups are illustrative; four, not five; Lindsay is not added). No question remains open. → *AC-5.2, AC-7.3*
**S5.3** Chain, in order: `Practise Humanity → Human Reps → Human Wealth → Better Life → Better World` (p.8). → *AC-5.3*
**S5.4** Six principles from `HOME_PRINCIPLES`; update `[5].title` → `"Built in the Reps"` **(period-free, from the shared `PRINCIPLE_TITLES` fixture — AC-5.4b; `content.ts:82` currently reads a third form, `"Build the reps."`)**;
re-verify the homepage consumer at `index.tsx:314`. **★★ AC-5.9a: strip the trailing period
from all six titles** (`content.ts:76-83` — every title currently ends in `.`). This
harmonises with AC-5.4, which already lists them period-free. → *AC-5.4, AC-5.9a*
**S5.5** Delete `PRINCIPLES` (`content.ts:38-69`) + refs at `the-new-human-era.tsx:2,41`. → *AC-5.5*
**S5.6** Fill the three PDF placeholders (V15) from `ARCHIVE`, **sourced from the const**:
#1 (p.1) ADEWOLF · #2 (p.5) ANTON · #3 (p.9) ARLINA — each with name, location, `no`. → *AC-5.6*
**S5.7** Close on "What's my Human Rep today?" → "Welcome to the New Human Era." (p.11; p.10's "What **is**…" is a decoy). → *AC-5.7*

### PHASE 6 — `blueprint-page` *(needs G1)*
**S6.1** Rebuild `be-human-ai.tsx` (93 lines; `PROCESS` `:24-29` superseded). → *AC-6.1*

### ★★ S6.0 — Making the Blueprint digestible (AC-6.9a). The previous approach is now wrong.

Iteration-2 planned to render all 16 PDF sections as a linear wall. **AC-6.9a makes that a
failing page**, and Maya's complaint is the evidence: *"it just feels like information
overload."*

**The reconciliation — APPROVED (Amendment 2, decision 2).** AC-6.2 requires all 16 sections
**present**; AC-6.9a forbids them at **equal weight**. Those are compatible only if
*present ≠ equally prominent*. So nothing is deleted — content is **re-ranked and relocated**.
Digestibility is bought with hierarchy, not scissors. Three tiers:

> **Provenance, stated honestly.** Maya's *"information overload"* complaint (08-15 13:57) was
> made against the **staging build**, which does not implement AC-6.2's 16-section page at all.
> So it is strong evidence that *the current Blueprint reads as overloaded*, and it is the
> user's stated requirement — but it is **not** an observation about the 16-section page this
> plan builds. The tiering design is a response to a requirement, not a measurement of a page
> that has never existed. AC-6.9a's five floors are what make it checkable.

> ### ★★★★★ THE 16-SECTION FIXTURE — exact, exhaustive, one tier each
> **The earlier "6/7/3" split was mine and it did not add up.** Tier 3's three pillars are
> *subdivisions of "Our Approach"*, which is itself one of the 16 — so they were being counted
> as sections they are not; and Client Proof and Team never reconciled. Corrected, from AC-6.2's
> enumeration verbatim, in PDF order. This table is `docs/blueprint-sections.json`, and both the
> page and every AC-6.2/6.9 assertion import it.
>
> | # | Section (AC-6.2 verbatim) | Tier | Treatment |
> |---|---|---|---|
> | 1 | Hero | **1** | visible |
> | 2 | The Problem | **1** | visible |
> | 3 | Our Approach | **3** | summary + links → 3 pillar routes (its Human Readiness / Governance & Sovereignty / AI Strategy subdivisions are **not** separate sections) |
> | 4 | Canadian Trust & Sovereignty | **2** | `<details>` |
> | 5 | Our Commitments | **2** | `<details>` |
> | 6 | The Blueprint | **1** | visible |
> | 7 | Who It Is For | **2** | `<details>` |
> | 8 | What You'll Receive (4 deliverables) | **1** | visible |
> | 9 | Client Proof | **1** | visible, testimonial slot marked pending (AC-6.10a) |
> | 10 | How It Works (3 steps) | **2** | `<details>` |
> | 11 | What Waiting Costs | **2** | `<details>` |
> | 12 | The Offer | **1** | visible |
> | 13 | The Team | **3** | 3 compact cards → `/who-we-are` |
> | 14 | Who We Work Best With | **2** | `<details>` |
> | 15 | FAQ | **2** | `<details>` (9 questions) |
> | 16 | Closing CTA | **1** | visible |
>
> **Split = Tier 1: 7 · Tier 2: 7 · Tier 3: 2 = 16.** ✅ Not 6/7/3.
> Tier 2's **7** satisfies AC-6.9c's `≥6` floor with one to spare. The tiering *principle* is
> what Amendment 2 approved; these specific assignments are mine and are open to revision
> without reopening the principle.

**Tier 1 — The spine (7 sections, always visible).** The linear path to a booking, readable in
one scroll: Hero, The Problem, The Blueprint, What You'll Receive, Client Proof, The Offer,
Closing CTA. Short blocks, large type, generous whitespace. This alone is a complete sales page.

> ### ★★★★★ THE MECHANISM — native `<details>`, per Amendment 3 decision 2
> **⚠️ Supersedes the `forceMount` design specified in iteration 4. Do not implement that.**
> Radix was the wrong tool twice over (see the Amendment 3 box above): the gate false-greened
> on nested state attributes, and no-JS users could never open the sections.
>
> **Required implementation — binding:**
> 1. **Each Tier-2 section is a native `<details>` with a `<summary>`.** No Radix, no
>    `forceMount`, no vendored component. Content is in the DOM and openable with JS disabled,
>    by construction rather than by configuration.
> 2. **The section `id` goes on the `<details>` element itself** (always present), never on
>    inner content — this keeps AC-6.2's ordered-id assertion true while collapsed.
> 3. **Styling** via `details[open]` and `summary::marker`/`::-webkit-details-marker`. A CSS
>    height transition is optional; correctness must not depend on it.
> 4. **AC-6.9c — count uniquely identified section containers, not state attributes.**
>    The selector is `details[data-section-id]`, deduplicated by `data-section-id`. *Codex's
>    probe: 2 sections produced **8** `[data-state="closed"]` matches — my original selector
>    would have passed `≥6` on two empty items.*
> 5. **AC-6.9d — the ratio is pinned, with floors on both sides.**
>    **visible normalized prose characters ÷ complete normalized prose characters**, measured
>    against a **canonical content fixture** (not live DOM alone, so the denominator cannot
>    shrink to flatter the ratio). "Normalized" = collapse whitespace, strip markup.
>    Numerator floor and denominator floor are both asserted, so the metric cannot pass
>    vacuously — a page with no content would otherwise score perfectly.
> 6. **No-JS assertion:** the Playwright suite loads `/be-human-ai` with **JavaScript disabled**
>    and asserts every Tier-2 section can still be opened and read. This is the check that
>    would have caught the accordion design, and nothing else in the suite would have.

**Tier 2 — Collapsed depth, inline (~7 sections).** Supports the sale without driving it:
Our Approach, Canadian Trust & Sovereignty, Our Commitments, Who It Is For, How It Works
(3 steps), What Waiting Costs, Who We Work Best With — plus the **FAQ's 9 questions**, which
are already a disclosure list by nature. Rendered as **native `<details>/<summary>`**
(Amendment 3 decision 2 — **not** Radix `Accordion`, which unmounts closed content and cannot
be opened without JavaScript), each `<summary>` showing a one-line summary.
**Critical:** these render **in the DOM, default-collapsed — not lazy-loaded**. That is what
keeps AC-6.2, SEO, and the AC-6.9a(d) floor all satisfiable at once. A lazy-loaded section is
absent, and would fail AC-6.2 while appearing to pass.

**Tier 3 — Moved off the page entirely (3 sections → pillar routes).** "Our Approach"'s three
pillars — Human Readiness / Governance & Sovereignty / AI Strategy — become the three routes
AC-3.6a requires (S3.6e). On the Blueprint they appear as **three summary cards** with a
heading, a one-sentence promise, and a link. This is the single largest reduction, and it is
where AC-6.5's `controls.yaml` grounding finally has room to be rigorous instead of cramped —
the governance pillar page carries the 8 domains and the 0-5 maturity model properly.
**Team** likewise compresses to three compact cards linking to `/who-we-are` (S3.6d) rather
than full bios inline.

**The sub-nav does real work (AC-6.4).** Not a decorative anchor list: a **sticky rail that
tracks scroll position and marks the current section**. Showing a reader the shape and their
place in it is the standard antidote to overload — the page stops feeling endless because its
length becomes legible.

**Why this is testable and not a vibe.** AC-6.9a's proof (§3) pins five measurable properties:
≥6 default-collapsed sections; default-visible text ≤40% of total; first CTA within 2 viewport
heights; **all 16 sections still in the DOM**; and headings resolving to ≥3 distinct scale
steps — which *literally falsifies "equal weight"*. Floor (d) is the important one: it means
digestibility **cannot be achieved by deleting content**, which is the obvious wrong fix.

> **⚠ Judgment call flagged.** Tier 3 renders three sections as summary-card-plus-link rather
> than in full. I read "sections present" (AC-6.2) as satisfied by a titled, linked section
> that carries the promise — with the depth one click away. If the user reads AC-6.2 as
> requiring full inline content for all 16, Tier 3 collapses back into Tier 2 (accordions) and
> the pillar routes carry duplicates. **CLOSED — Amendment 2 decision 2 approved tiering; summary-plus-link stands.**

**S6.2** 16 sections, ids, **in PDF order** (pp. 1→12), tiered per S6.0. → *AC-6.2, AC-6.9a*
**S6.3** `$795 CAD` / `$1,500 CAD` / `3 business days` from named consts. → *AC-6.3*
**S6.4** Sticky in-page sub-nav over the S6.2 ids — the only page with a second nav. → *AC-3.4, AC-6.4*
**S6.5** Ground "Risk & Governance Review" in `controls.yaml` (8 domains; `domains:` `:36`,
`levels:` `:62`, `controls:` `:70`) + the 3 checklists (10/9/8 controls). Produce
`blueprint-controls.json` traceability (claim → control id). **Render the disclaimer
adjacent to any Maturity Score mention.** **★★★★ Sovereignty framing is now DECIDED (Amendment 2, decision 5), not interim.**
Describe sovereignty **through practices** — no-train terms, PII redaction at the model
boundary, call-level audit trail, key management, exit/portability — and **assert no domain
*definition***. This is the framing on which `controls.yaml` and the published whitepaper
agree, sidestepping the recorded `source_of_truth_divergence` (`controls.yaml:24-35`) that
neither the plan nor the implementer may resolve unilaterally.

**Prohibited-claim test (AC-6.11a's prohibited-claim sub-proof, covering sovereignty too):** rendered `/be-human-ai` and
the governance pillar page must not match
the **broadened** pattern pinned in AC-6.11a's prohibited-claim sub-proof — which also catches *compliant*, *guarantees compliance*, *government approved*, and *certifying* —
within product/offer sections, per `controls.yaml:5` (*"readiness and assurance, not a
compliance guarantee… NOT a certification"*), and must render the disclaimer adjacent to any
Maturity Score mention. **Personal credentials remain explicitly allowed** and are asserted to
survive ("certified cybersecurity professional", "certified counsellor"). → *AC-6.5, AC-6.11a*
**S6.6** All CTAs → `BOOKING_URL_30MIN`; exactly 3, labelled "Book Your Blueprint" (pp. 1, 9, 12). → *AC-2.6, AC-6.8*
**S6.7** Inline maple-leaf SVG with `data-glyph="maple-leaf"`; remove the generic leaf. (No new
dep; `lucide-react` has none.) **★★ Placement is now pinned by AC-2.8a: the leaf sits *beside
the "Indigenous-led" line*, not loose in the hero.** **Copy comes from `INDIGENOUS_LINE` (`Indigenous-led. Canadian-built`)** — the canonical
constant per Amendment 3 decision 1, which supersedes PDF v4's "Indigenous-founded.
Canadian-built." in the hero **and** the footer's former wording. One constant, both surfaces;
neither implementation nor proof hardcodes the string. Whether the footer also gets a leaf is
§11 Q11.
→ *AC-6.6, AC-2.8b, AC-6.12a*

**★★★★ S6.9 — Client Proof: render the section, mark the slot pending (Amendment 2, decision 3).**
Iteration-3 planned to **omit** the section until Brett's quote arrived — which contradicted
AC-6.2's "all 16 sections present". Amendment 2 resolves it: **the section renders, the
testimonial slot is explicitly marked pending.** So **16/16 holds** and nothing is fabricated.

- The Client Proof section is present with its `id`, heading, and the real client context
  (All Y'All Foods) that is **not** in dispute.
- The quote slot renders a visible, honest **"testimonial pending"** state — *not* lorem,
  *not* an invented quote, *not* a hidden placeholder. `[BRETT HEADSHOT]` and
  `[ALL Y'ALL FOODS LOGO]` bracket text never ships (same rule as AC-6.7's `[Last Name]`).
- `T:` assert the section id exists **and** that no bracket-placeholder text (`/\[[A-Z ']+\]/`)
  renders anywhere on the page.
- The release gate records the pending slot as a known, accepted gap rather than a blocker.
→ *AC-6.2, AC-6.9a*
**S6.8** Team bios: **Shane James**, **Sid**, **Maya** with their exact roles; **strip the PDF's
`[Last Name]` placeholders**. *(Codex, accepted: AC-6.7 asks for "Sid" and "Maya" — surnames
are a nice-to-have in §11, **not a blocker**.)* → *AC-6.7*

### PHASE 7 — Formatting, last
**S7.1** — Now, after final integration, run `bunx eslint . --fix` + hand-fix the residue
(`podcast_.$slug.tsx:150,248,302`) as one formatting-only commit. → *AC-X.4*

### PHASE 8 — Full gate
**S8.1** — Add the typography guard **here, not in Phase 4** (A-B4: in iteration-1 it landed
before Phases 5–6, while those files still legitimately held clamps, so it would have gone
red on correct work). Positive form (A-B3): every heading in `src/routes`/`src/components`
carries a `type-*` class; plus the forbidden-token scan, scoped `srcNonTestFiles`.
**S8.2** — Delete `/type-specimen` (S0.7 disposition).
**S8.3** — `bun test src/` · `tsc --noEmit` ×3 · `eslint .` · **`vercel build`**.
*(Codex, accepted: local `bun run build` runs the Lovable preset whose Nitro default targets
Cloudflare (`vite.config.ts:1-5`), so a green local build does not prove the Vercel output.
The release gate uses the real Vercel build.)* → *AC-X.2, AC-X.3, AC-X.4*
**S8.4** — Run `ac-suite.sh`: every live AC in `docs/ac-inventory.json` has a passing proof row, and every row maps to a live AC.

### PHASE 9 — Integrate and deploy *(history-preserving)*
**S9.1** — `git fetch origin && git merge origin/main` — **a merge commit, never a rebase**
(V17). Reconcile every overlapping file by hand (§6 PM-2), then re-run Phase 8 in full.
**S9.2** — Verify AC-X.1 by patch-ID: `git cherry -v origin/feat/podbean-rss-integration HEAD`
shows no `-` lines, plus the ancestry check. → *AC-X.1*
**★★ S9.3 — Staging first (new; V43).** Deploy to `https://staging.thebehumancompany.ca` and
run the **full** production verification suite there — `prod-images.sh` and
`prod-acceptance.sh` against `$STAGING`. This is the plan's first opportunity to prove
AC-X.5's checks without touching production, and it is where the two human review gates land:
**Maya reviews the site** (she has been reviewing on staging throughout) and **Shane reviews
`/who-we-are`** (AC-3.5a). Both recorded under **tracked `.approvals/`** (AC-X.7a) — never `.omc/`, which is gitignored.
Note staging currently runs `feat/podbean-rss-integration` — deploying our branch there
**replaces that preview**, which is a visible change to a shared environment. Confirm before
overwriting — **CLOSED, Amendment 2 decision 7: staging is the review venue.**

**S9.4** — Open the PR, land it, promote to production.
**S9.5** — Re-run `scripts/verify/prod-images.sh` + `prod-acceptance.sh` against `$PROD`
(V19, with `-fsSL`). Same scripts, both environments — a check that passed on staging and
fails on prod is a deploy defect, not a content defect. → *AC-1.6, AC-X.5*

---

## 6. Pre-mortem

### PM-1 — The Lovable host goes dark and 40 images are unrecoverable *(D1)*

**Story.** Recovery is spread across the branch. On day 4, every request to
`id-preview--<pid>.lovable.app` 404s — project deleted, preview expired, integration
disconnected. R2 is not a fallback (V7). The 39 avatars + collage exist nowhere else
on earth (V22). AC-1.6, AC-7.2, AC-7.3 become unachievable.

**Mitigations, all now *inside S0.2/S0.3* rather than asserted in prose** *(C8)*:
- S0.2 is the first substantive step and fetches all 46 in one pass.
- **Retry (3×), exponential backoff (1/4/16 s), and SHA-256-based resume are implemented
  in the script** — iteration-1's pre-mortem promised "stop after 3 retries" that the step
  itself never defined.
- Byte-length + MIME + SHA-256 verification catches a host serving error pages as 200s.
- **Durable backup is a pushed branch + a private GitHub release asset**, proven by a
  restore drill from a different path (S0.3.4) — not a gitignored local tarball (V20).
- The 4 portraits gain a second, host-independent source from the reference branch (V21).

**Stop rule.** Any asset still failing after retries → halt, surface the `asset_id` list,
do not proceed to Phase 1. A partial image set in production is worse than a late branch.

### PM-2 — The bot reverts `main` under us and a hand-merge silently drops work *(D3)*

**Story.** Mid-branch, Lovable publishes — or, per V32-33, **reverts**. `main` gains commits
touching `index.tsx` and `__root.tsx`. Someone integrates, hits a conflict where Phase 1
changed the collage import and Phase 4 replaced type declarations, and resolves it "ours"
to move on — silently discarding a genuine bot change. Or resolves "theirs" and reverts the
collage import to a `.asset.json`, sending AC-1.3 non-zero and shipping a broken homepage.
`routeTree.gen.ts` regenerates and `route-shape.test.ts:70` (V28) still passes through a rename.

**This is not hypothetical.** The bot already broke the build this exact way (V32).

**Strategy — history-preserving, per `AGENTS.md:1-10` (V17).**
1. **Ask the user to pause Lovable publishing for the branch's lifetime** (§11 Q3). The only
   mitigation that removes the risk rather than managing it.
2. **Exactly ONE rebase, ever:** the optional tidy-up *before the branch's first push*
   (S0.1). After that push, **never** rebase, amend, squash, or force-push.
3. **Integrate `origin/main` with ordinary merge commits.** No wholesale resolution rules —
   iteration-1's "take OURS wholesale" would discard unreviewed future `main` changes, which
   under a *reverting* bot may include deliberate reverts we need to see.
4. **Every overlapping file is reconciled by hand, hunk by hunk**, and the merge is followed
   by the **full Phase 8 gate** before any new commit lands. A merge that leaves the gate red
   is fixed forward — never force-pushed away.
5. **`routeTree.gen.ts`: regenerate, never hand-merge**, then confirm `route-shape.test.ts`.
6. **Stop-and-reconcile-with-the-user triggers:** any incoming commit touching `src/assets/**`,
   `package.json`, or `vite.config.ts`; any commit whose subject starts `Reverted to commit`;
   or >10 commits of drift since the last merge. These mean Lovable re-published or undid
   something, and the branch's premises need re-checking — not an automated resolution.

### PM-3 — The gate stalls, or the approved scale silently regresses the site

**Story A (stall).** The specimen sits unanswered for four days; the temptation is to start
Phase 6 "and fix the type later", producing exactly the bespoke sizes AC-4.5 forbids.

**Story B (regression).** G1 clears. Phase 4 migrates **the full utility surface recorded in `docs/type-inventory.md` (47 at time of writing — derived, never retyped) plus the inline
clamps plus the non-clamp declarations** (V23, S0.6) onto four steps. Nobody notices that
`index.tsx:95` was `clamp(3.5rem,11vw,8.5rem)` while `human-archive.$slug.tsx:89` was
`clamp(2rem,5vw,3.5rem)` — a 2.4× range collapsed onto one `type-h1`. `/human-archive/$slug`
wraps badly on mobile. **Every test stays green, because no existing test renders a page and
nothing at all reads `styles.css`** (V12, V23).

**Mitigations.**
- *Stall:* A3 publishes the specimen as early as the inventory allows (**not day 1** — S0.7 depends on S0.6) and keeps Phases 1–3 flowing regardless; specimen ships as a
  preview URL; escalate at 48 h.
- *Regression:* the scale is **derived from the S0.6 inventory, not invented**, and the user
  approves a **mapping**. Named command, not an activity:
  `bun run scripts/verify/visual-diff.ts --baseline .baseline/shots --routes all` — Playwright,
  **`SURFACES.length` × 3 viewports (375/768/1440)** — imported from `src/lib/surfaces.ts`,
  never hand-counted (B5),
  captured **before** Phase 4 and diffed after; any heading whose rendered box changes >15%
  is human-reviewed. `.approvals/typography.json` carries `scale_sha256` so the
  approved scale and the shipped scale are provably the same.
- *Ordering:* the typography guard lands in **Phase 8** (A-B4), not Phase 4, so it cannot go
  red on correct in-flight work.

---

## 7. Test Plan

**Runner and wiring** *(C7: iteration-1 named activities with no runner.)*
- Unit/integration: `bun test src/` (existing).
- DOM/component: **`@testing-library/react` + `happy-dom` under `bun test`** for anything
  asserting rendered structure. New dev deps; no runtime deps.
- Browser/E2E + visual diff: **Playwright** (`playwright.config.ts`), `bun run e2e`.
  Fixtures for the two dynamic routes: `/human-archive/adewolf` (from `ARCHIVE[0].slug`) and
  the first slug returned by the podcast list loader, with a recorded RSS fixture so the
  suite does not depend on PodBean being up.
- Production: `scripts/verify/prod-images.sh`, `prod-acceptance.sh`, `social-links.sh`,
  all sourcing `scripts/verify/lib.sh` (`set -Eeuo pipefail`, `assert_eq`, `assert_ge`).
- CI: a `verify` job running `bun test src/` → `tsc` ×3 → `eslint .` → `vercel build` →
  `bun run e2e`; and a `post-deploy` job running the two production scripts against `$PROD`.

> ### ★★★★★ Forbidden-token scans exclude tests BY CONSTRUCTION (Codex #6)
> Every forbidden token this plan bans — `.asset.json`, `cal.com`, `Sydney`, `clamp(`, the
> utility names, the Indigenous variants — **appears inside the very tests that ban it**. A
> scan that walks `src/` without excluding tests therefore **matches its own fixtures and can
> never pass**, and the tempting fix is to loosen the pattern until it does. This is the
> Architect's iteration-2 B5 finding reappearing in new scans.
>
> **One tested helper, `srcNonTestFiles()` in `src/lib/layering.test.ts:83` (V27), is the only
> way any scan enumerates files.** No plan step, AC row, or script may use a bare
> `grep -r … src/`. `audit-scans.sh` (Phase 8) asserts no verify script contains `grep -r`
> against `src` without going through the helper.

**Text-scanning is confined to true forbidden-token architecture rules** *(C7, A-B5)* — the
`.asset.json`, `cal.com`, `calendly`, and typography-token rules — all added to
`layering.test.ts` and **scoped to `srcNonTestFiles`** (V27) so they cannot self-match.
Everything about structure, nav, CTAs, section order, pricing, images and typography is
asserted against **rendered DOM**, per §3.

**Audit of the 12 `readFileSync` tests** *(Architect, recorded so nobody re-derives it)*:
none break under the planned rewrites. Two live tripwires to respect:
- `index.test.ts:103` — asserts `index.tsx` contains **no catch clause** (V28). Adding error
  handling to the homepage goes red by design.
- `route-shape.test.ts:70` — requires podcast slug route ids to be exactly `["/podcast_/$slug"]` (V28).

**Observability / production verification** *(A-B6, C3 — iteration-1's sweep could not prove AC-1.6)*.
Three layers, because each covers the others' blind spot:
1. **Manifest-driven inventory (primary).** Enable **`build.manifest: true`** — the Lovable
   preset does not set it and Vite defaults it off (V30-31), so iteration-1's "read the client
   manifest" step would have had no manifest to read. After `vercel build`, resolve each of the
   formerly-pointered images to its fingerprinted URL and `HEAD` each against `$PROD`.
   **Assert the inventory count equals `docs/asset-inventory.json` before checking**, so "found
   nothing, exited 0" fails and no literal is typed.
   Assets under 4096 B inline as `data:` URIs (V31) and are asserted **present in the HTML**
   instead of fetched.
2. **DOM sweep (secondary). ★★★ Route arithmetic corrected (V57-V58).**
   Iteration-2 wrote "9 renderable + 1 `/podcast/$slug` + 1 `/human-archive/$slug`" — that
   **double-counts**: the dynamic ids in `routeTree.gen.ts` are *patterns*, and the two
   concrete instances *are* those patterns' surfaces, not extras. `/sitemap.xml` is an XML
   endpoint, not a page.

   | | Static pages | Concrete dynamic | **Visitable total** |
   |---|---|---|---|
   | Pre-amendment (actual) | 7 | 2 | **9** (not 11) |
   | Post-Amendment 1 | 11 (7 − `/about`→301 + 5 new) | 2 | **13** |

   The sweep iterates **13** surfaces and asserts that count before starting; **AC-3.3 checks
   12** of them (all but `/be-human-ai`). `/about` is checked as a **301**, not as a page.

   Collect `<img>` and `<source>` URLs, **plus meta `content=` narrowed to `og:image` and
   `twitter:image` whose value matches `^https?://` and ends in an image extension** (V29).
   *Unnarrowed, the sweep collects `og:description` prose and either throws or silently skips —
   and a silently-skipped `og:image` is the exact hole V29 exists to close.*
   Assert `naturalWidth > 0`. **`/podcast` is paginated** (`podcast.tsx:98-102` slices to 6
   mobile / 9 desktop), so one page exposes ~10 avatars, not 39 — the sweep therefore
   **paginates through the full list** and asserts the union reaches 39 distinct avatar URLs.
3. **Negative proof.** `body="$(fetch_ok "$ENV")"` then `grep -c '__l5e'` on the captured
   body → **0**, asserted. **Never `curl … | grep -c … || true`** — that greens on a dead
   site (V51). If the root cause is gone, that substring cannot exist. Plus Vercel runtime logs checked for `/__l5e/*`
   404s in the first 30 minutes post-promotion.

---

## 8. Risks and Mitigations

| # | Risk | Sev | Mitigation | Step |
|---|------|-----|------------|------|
| R0 | **Rebasing pushed commits destroys the user's Lovable project history** (V17) | **Critical** | One optional rebase before first push; merge commits only thereafter; no force-push, amend, or squash | S0.1, S9.1, PM-2 |
| R1 | 40 files have one source on earth (V22) | **Critical** | Bulk capture first; retry/backoff/resume in-script; pushed branch + GitHub release asset; restore drill from a different path; reference-branch second source for the 4 portraits | S0.2, S0.3 |
| R2 | Bot **reverts** `main`; a hand-merge drops work either direction (V32-33) | **High** | Hand reconciliation only; full gate after every merge; explicit stop triggers incl. `Reverted to commit` subjects; ask to pause Lovable | PM-2, §11 Q3 |
| R3 | Inherited red baseline (V9, V10) | **High** | **Pin, don't fix**; gate on delta; formatting commit lands last | S0.4, S7.1 |
| R4 | G1 stalls, blocking Phases 4–6 | **High** | Specimen published as early as the inventory allows (not day 1 — S0.7 depends on S0.6); Phases 1–3 flow regardless; preview URL; escalate at 48 h | S0.7, G1 |
| R5 | Scale regresses pages; **nothing reads `styles.css` and no test renders a page** (V12, V23) | **High** | Full pre-gate inventory (S0.6); user approves a *mapping*; named visual-diff command over `SURFACES.length` × 3 shots; `scale_sha256` binds approved to shipped; new `styles.test.ts` | S0.6, S4.3, PM-3 |
| R6 | **AC-4.2 is a 47-occurrence migration** (Amendment 2 decision 1; AC-4.2b), not the 4 the iteration-1 gate covered | **High** | Scoped into Phase 4; gate asserts all four names reach 0 against the **derived** floor in `docs/type-inventory.md` | S4.2, AC-4.2b |
| R7 | Verification passes vacuously — redirects, empty inventories, unasserted greps (V19) | **High** | §3 AC-proof table: every check has a non-vacuity floor and a nonzero exit; `-fsSL` everywhere | §3, §7 |
| R8 | Blueprint copy overclaims; `controls.yaml:5` forbids certification/compliance claims (V16) | **High** | Rendered disclaimer; traceability fixture; prohibited-claim test scoped to product sections; personal credentials explicitly allowed; human positioning sign-off | S6.5, AC-6.5b |
| ~~R9~~ | **CLOSED — Amendment 2 decision 5**: practices only, no domain definition, prohibited-claim test per `controls.yaml:5`. No longer an open risk. | — | — | AC-6.11a |
| R10 | `__root.tsx:95-96` keeps two Lovable-hosted images after a de-Lovable pass (V29) | Medium | Capture and re-host; sweep reads `content=` too | S1.5 |
| R11 | Local `bun run build` targets Cloudflare via the preset, not Vercel | Medium | Release gate runs `vercel build` | S8.3 |
| R12 | Guard tests self-match; the tempting fix is loosening them (A-B5) | Medium | All three scoped to `srcNonTestFiles` per `layering.test.ts:83` | S1.7 |
| R13 | Typography guard lands before Phases 5–6 and goes red on correct work (A-B4) | Medium | Guard moved to Phase 8 | S8.1 |
| R14 | 85.4 MB enters git history (B′1) | Medium | Accepted as the literal cost of AC-1.1; WebP derivatives keep runtime weight low; **§11 Q4 confirms** | S0.3, S1.1 |
| R15 | Six social URLs absent from repo and spec | Medium | §11 Q2; blocks S3.1 only | S3.1 |
| R16 | Spec counts (47/3) ≠ reality (46/1) | Low | Glob, never hardcode | S0.2, S1.6 |
| R17 | `routeTree.gen.ts` regenerates; text assertions can pass through a rename (V28) | Low | Regenerate not merge; re-run `route-shape.test.ts` after every merge | PM-2 |
| R18 | `/type-specimen` ships forever | Low | `noindex`, sitemap-excluded, **deleted in S8.2** | S0.7, S8.2 |
| **R19** | **A specimen showing one voice gets approved, then Phase 5 discovers half the mockups are unbuildable** (V34, V37) — AC-4.4 satisfied in form, void in fact, and re-approval reopens the gate late | **High** | S0.6b enumerates all three voices *pre-gate*; S0.7 renders all three with real mockup strings; AC-4.3's floor fails an uppercase-only specimen | S0.6b, S0.7 |
| **R20** | **Consolidation deletes the eyebrow+lime-rule pattern every mockup section depends on** (V39) | Medium | AC-4.2's proof positively asserts the role survives under its successor name | S4.1, S4.2 |
| **R22** | **Component 3 roughly triples and lands in an already-loaded phase** — dropdown nav + 5 new routes (V50), not the one-line guard iteration-2 planned | **High** | S3.6a–f decompose it; Radix primitives already vendored so no new dep (V48); the split-control trap is called out explicitly (V46) | S3.6a–f |
| **R23** | **AC-6.2 and AC-6.9a pull against each other** — "all 16 present" vs "not at equal weight" | **High** | Reconciled as *present ≠ prominent* (S6.0); AC-6.9a floor (d) re-runs AC-6.2's ordered-id check so digestibility **cannot** be bought by deleting sections; tiering approved by Amendment 2 decision 2 | S6.0, AC-6.10a |
| **R24** | **Client Proof has no testimonial** — Brett's quote does not exist (Maya 08-15 15:52) | Medium | **Amendment 2 decision 3 / AC-6.10a: the section RENDERS with heading and `id`, testimonial slot explicitly marked pending.** Not omitted, not stubbed, nothing fabricated. 16/16 holds; no longer a release blocker, only a content gap | S6.9, §11b item 1 |
| **R25** | **`/who-we-are` reaches production without Shane's review** (AC-3.5a explicitly requires it) | Medium | Release gate blocks on `.approvals/who-we-are-review.json`; staging deploy (S9.3) is where the review happens | S3.6d, S9.3 |
| ~~R26~~ | **CLOSED — Amendment 2 decision 7**: staging is the designated review venue. The reference branch is preserved in git regardless. | — | — | S9.3 |
| **R27** | **New routes silently break route-dependent tests and the sitemap** — `routeTree.gen.ts` regenerates, `route-shape.test.ts` pins podcast ids (V28), `sitemap.xml.test.ts` keeps a duplicate list | Medium | S3.6f re-points every floor at `SURFACES` (no hardcoded count), and both sitemap route and test import it | S3.6f |
| **R28** | **Copying the reference branch's nav** — its structure is evidence, but its **tree differs from the binding tree** (V47), and copying code would breach AC-X.1 | Medium | S3.6a writes the model fresh; the binding tree is encoded from `spec:283`, not from `site-header.tsx` | S3.6a |
| ~~R21~~ | **CLOSED — Amendment 2 decision 6**: mockups are illustrative; four entries, four portraits; Lindsay not added. AC-7.1's deep-equal still guards against silent expansion. | — | — | AC-7.1 |

---

## 9. Verification Steps (per phase)

### ★★★ `scripts/verify/lib.sh` — the three rules every check obeys

Iteration-1 greped a redirect body. Iteration-2 replaced it with something **strictly worse**
(V51). These rules exist so there is no third variant.

```bash
set -Eeuo pipefail

# RULE 1 — `|| true` may NEVER wrap a network call. Capture, assert the fetch, THEN assert
#          content. `curl -fsSL … | grep -c X || true` returns "0" when the site is DOWN,
#          so the assertion greens on a dead site (V51, reproduced).
fetch() {                    # fetch <url> -> stdout, aborts on any HTTP/transport failure
  curl -fsSL --max-time 30 "$1"
}
# RULE 1b — ORIGIN FIRST. A body check alone does not establish WHICH site answered.
#           Demonstrated twice: this gate passed against Wikipedia (246,246 bytes).
#           Assert the final effective URL's host BEFORE reading any content.
assert_origin() {            # assert_origin <url> <expected-host>
  local eff; eff="$(curl -fsSL -o /dev/null -w '%{url_effective}' --max-time 30 "$1")"
  local host; host="$(printf '%s' "$eff" | sed -E 's#^https?://([^/]+).*#\1#')"
  assert_eq "$host" "$2" "origin of $1 (effective: $eff)"
}
fetch_ok() {                 # origin + fetch + non-trivial-body floor
  assert_origin "$1" "$EXPECTED_HOST"
  local body; body="$(fetch "$1")"
  assert_ge "${#body}" 10000 "non-trivial HTML from $1"
  printf '%s' "$body"
}

# RULE 2 — counts are normalized. BSD `wc -l` pads; GNU does not. Unquoted `$(… | wc -l)`
#          passes by word-splitting accident, quoted fails `got '       0' want '0'` (V52).
#          Prefer `grep -c`; when `wc` is unavoidable, strip whitespace.
count() { tr -d '[:space:]'; }

# RULE 3 — every assertion names what it proves and exits non-zero. No bare `grep`, no
#          unasserted `echo`, no check whose only failure mode is a human reading output.
assert_eq() { [ "$1" = "$2" ] || { echo "FAIL[$3]: got '$1' want '$2'" >&2; exit 1; }; }
assert_ge() { [ "$1" -ge "$2" ] || { echo "FAIL[$3]: got '$1' want >= '$2'" >&2; exit 1; }; }
```

**Audit obligation:** before Phase 8, grep every script under `scripts/verify/` for `|| true`
and prove each remaining instance wraps a *local, non-network* command whose empty result is
genuinely valid. Any `|| true` on a `curl` is a defect.

**Phase 0 exits when:**
```bash
git merge-base --is-ancestor a6a377a HEAD
assert_eq "$(git cherry -v origin/feat/podbean-rss-integration HEAD | grep -c '^-')" 0 "no cherry-picks"
# floor: the cherry output must be non-empty, or 0 is vacuous. (Verified: 172 lines, 0 '^-'.)
assert_ge "$(git cherry -v origin/feat/podbean-rss-integration HEAD | grep -c '^[+-]')" 1 "cherry produced output"

assert_eq "$(jq '[.[]|select(.status!="ok")]|length' .baseline/asset-recovery-report.json)" 0 "recovery failures"
assert_eq "$(jq 'length' src/assets/asset-recovery-manifest.json)" "$(ls src/assets/*.asset.json | count)" "manifest covers every pointer"
bash scripts/verify/restore-drill.sh     # temp clone on a DIFFERENT path; 46/46 SHA-256 match
bash scripts/verify/delta.sh             # no NEW eslint error, no NEW test failure
test -f .baseline/eslint.json && test -f .baseline/failing-tests.json
test -f BRANCH-STATUS.md                 # inherited-red intent is recorded, not implied
test -f docs/type-inventory.md           # S0.6 inventory — the ONLY source of the type counts
```

**G1 clears when:** **`.approvals/typography.json`** (tracked — V53) exists, validates against
`.approvals/schema.json`, and `evidence.scale_sha256` matches the current `styles.css` scale
block. Every commit touching page typography is dated after `timestamp` — asserted in
`scripts/verify/g1.sh`.

**Phases 1–3, 4, 5, 6:** each phase runs its slice of the §3 AC-proof table; the phase is done
when every AC mapped to it passes **with its floor satisfied**.

**Phase 8 (full gate):**
```bash
bun test src/ && bunx tsc --noEmit && bunx tsc -p scripts --noEmit \
  && bunx tsc -p studio --noEmit && bunx eslint . && bunx vercel build
bun run e2e
bash scripts/verify/ac-suite.sh          # one row per live AC (derived)
bash scripts/verify/audit-or-true.sh     # RULE 1 audit
bash scripts/verify/audit-count.sh       # RULE 2 audit: no bare `| wc -l` outside count()
bash scripts/verify/audit-scans.sh       # forbidden-token scans go through srcNonTestFiles()
bash scripts/verify/ac-bijection.sh      # spec live-set <-> proof-table, both directions
```

**Phase 9 — staging first, then production. Same scripts, both environments.**
```bash
STAGING=https://staging.thebehumancompany.ca   # V43 — 200, no redirect
PROD=https://www.thebehumancompany.ca          # V19 — the apex 308-redirects here

for ENV in "$STAGING" "$PROD"; do
  # EXPECTED_HOST is derived from ENV, and asserted before anything else runs.
  EXPECTED_HOST="$(printf '%s' "$ENV" | sed -E 's#^https?://([^/]+).*#\1#')"
  assert_origin "$ENV" "$EXPECTED_HOST"      # wrong-origin gate, FIRST
  bash scripts/verify/prod-images.sh     "$ENV"   # inventory == manifest count, asserted FIRST
  bash scripts/verify/prod-acceptance.sh "$ENV"   # one assertion per component, all 7

  # RULE 1 in practice — the fetch is asserted before the content is
  body="$(fetch_ok "$ENV")"
  assert_eq "$(printf '%s' "$body" | grep -c '__l5e' || true)" 0 "no Lovable asset paths"
done
```
`|| true` is safe on that last line **only** because `$body` was already proven non-trivial by
`fetch_ok`; the pipeline is now local text, not a network call.

> ### ★★★★★ `prod-acceptance.sh` must be fault-injection tested — it currently proves nothing
> **Codex ran the isolated `fetch_ok` + no-Lovable-paths check against Wikipedia and it
> PASSED.** That sub-gate establishes neither identity nor correctness: any large HTML page
> with no `__l5e` substring satisfies it. A production check that green-lights Wikipedia is
> not a production check.
>
> **`scripts/verify/acceptance-faults.test.ts` runs the real script against seeded fixtures and
> asserts it FAILS on each:**
> | Injected fault | Must fail because |
> |---|---|
> | Wrong host (any unrelated 200 page) | identity is not established |
> | **Correct copied DOM served from a disallowed host** | **origin, not content, is what proves identity** — this is the case a content-only gate cannot catch |
> | Soft-404 — 200 status, "not found" body | status alone is not correctness |
> | A component's content removed | per-component assertions are real |
> | Duplicated nav on a non-Blueprint surface | AC-3.3 is enforced, not assumed |
> | A `<details>` section present but empty | AC-6.9c/d floors bite |
> | Sections reordered | AC-6.2's *ordered* id array is ordered |
> | Hidden-text padding (visually hidden prose) | AC-6.9d's ratio can't be gamed |
>
> A gate that has never been observed failing is a gate of unknown strength. These seven cases
> are the minimum evidence that it can fail at all.

Plus the Vercel runtime-log check for `/__l5e/*` and `/assets/*` 404s in the first 30 minutes
after promotion.

---

## 10. ADR

### ADR-001 — History-preserving integration, capture-first assets, gate-early sequencing

**Status:** proposed (pending approval) · **Supersedes** iteration-1's rebase strategy and B′2.

**Context.** 7 components, 44 ACs (V18), one blocking human approval upstream of the two
largest deliverables, 40 image binaries with a single source on earth (V22), a bot that
*reverts* the base branch (V32-33), and a repo whose `AGENTS.md` forbids rewriting pushed
history on pain of user data loss (V17).

**Decision.**
1. **Integration is by merge commit.** At most one rebase, before the branch's first push.
   No force-push, amend, or squash thereafter. Every overlapping file is hand-reconciled and
   followed by the full gate.
2. **Sequencing — Option A3:** capture assets and publish the specimen in Phase 0, then run a
   single work front in dependency order while G1 pends.
3. **Assets — B2 + B′1:** one bulk fetch with in-script retry/backoff/resume; the
   **byte-identical originals** committed beside their pointers with a SHA-256 manifest; WebP
   derivatives added for runtime; durability proven by a restore drill from a different path.
4. **Baseline is pinned, not fixed.** Gate on delta; the formatting commit lands last.
5. **Every AC gets a proof with a non-vacuity floor** (§3).

**Alternatives considered.**
- *Rebase-based integration* (iteration-1) — **invalidated by `AGENTS.md:1-10`**. Not a style
  preference: the consequence is the user losing their Lovable project history.
- *A1 strict sequential* — steelmanned (it also captures assets first); rejected only because
  it idles the entire G1 window under a moving base branch.
- *A2 three parallel tracks* — rejected because V17 re-priced merge conflicts; three fronts is
  the wrong trade for marginal schedule gain when every integration is hand-reconciled.
- *B′2 derivatives-only* — rejected: silently weakens AC-1.1, which requires the fetched binary.
- *B′3 Git LFS* — rejected: unvalidated against Vercel *and* Lovable sync; a failed LFS fetch
  degrades to pointer files, reintroducing this component's own failure class.
- *`eslint --fix` at branch time* — rejected: maximizes conflict surface against a reverting bot.
- *Merging `feat/podbean-rss-integration`* — barred by the spec. Reading its blobs is permitted
  and now **used** (V21) for a second copy of the 4 portraits.

**Consequences.**
- *Positive:* no risk to the user's project history; irreplaceable data secured in minutes and
  provably restorable; the specimen is published as early as the inventory allows; every live AC
  have falsifiable proofs; AC-4.2's real size (47 call sites) is scoped instead of discovered
  post-approval; the `og:image` Lovable dependency is removed rather than left behind.
- *Negative:* 85.4 MB enters git history permanently; merge commits make a noisier graph than
  a rebase would; new Playwright + testing-library infrastructure this repo has never had;
  Phase 4 is a materially larger migration than iteration-1 assumed.
- *Neutral:* spec counts corrected (46/1, 44 ACs) without renumbering any criterion.

**Follow-ups (out of scope).** Retire the source-text-assertion convention that produced the
inherited red (V9, V32). Archive growth / CMS migration; podcast-Sanity completion (spec
Non-Goals). Delete unreferenced legacy binaries (`archive-{alex,amara,kenji,sofia}.jpg`,
`portrait-1..4.jpg`) if confirmed dead. Reconcile `controls.yaml`'s recorded
`source_of_truth_divergence` with the published whitepaper (`controls.yaml:24-35`) — a
product decision this site works around but does not fix.

---

### ADR-002 — Derive every gate input; forbid hand-entered literals

**Status:** proposed · **Date:** 2026-08-17 (iteration 5)

**Context.** Across five review iterations, **every single count in this plan was wrong at
least once**: acceptance criteria (44 → 55 → 53 → derived), typography call sites
(35/36/46/47/53/79/90/92 — disputed four times, twice by me), visitable surfaces
(9/10/11/13/14 — three copies disagreed *within one iteration*), and asset pointers (47 → 46).
Two separate reviewers and I each produced a confidently-wrong number. One of my errors was a
shell artefact (`^` expansion in an unquoted zsh `for` list) promoted to my highest confidence
marker and then used to reject a correct finding.

**Decision.** No literal that a scan could derive may appear as a gate input.
1. **ACs** — `scripts/verify/ac-inventory.ts` parses the spec (including partial-supersession
   rules); `ac-suite.sh` asserts a bijection between live IDs and proof rows.
2. **Typography** — `scripts/type-inventory.ts` writes `docs/type-inventory.md`; the gate
   asserts the live scan equals it **and** that the scanner's own SHA-256 matches, because
   pinning only the output leaves the mechanism defeatable (an unpinned scanner agrees with
   itself while missing real call sites — which is exactly what happened).
3. **Surfaces** — `src/lib/surfaces.ts` exports `SURFACES`; every floor imports it;
   `SURFACES.length` is the floor.
4. **Assets** — `docs/asset-inventory.json` from the recovery manifest.
5. **Prose figures** are labelled "derived, quoted for orientation"; where a quoted figure and
   its generated file disagree, **the generated file is correct and the prose is a bug.**

**Consequences.** *Positive:* the class of defect that dominated five review rounds is
structurally eliminated; a reviewer can no longer be right-by-assertion, only right-by-script.
*Negative:* four small generators to build and keep honest, and a generator bug now
silently propagates to every consumer — mitigated by the scanner-SHA binding and by pinning
each generator's *definition* in this plan, not just its output.

---

### ADR-003 — Prefer the platform to the component library for progressive disclosure

**Status:** proposed · **Date:** 2026-08-17 (iteration 5, Amendment 3 decision 2)

**Context.** AC-6.9a needs 16 sections present but not equally prominent. I specified the
vendored Radix `Accordion`, then — when told closed content unmounts — specified `forceMount`
to keep it in the DOM. Codex server-rendered it and found two failures `forceMount` does not
touch: two closed items produced **8** `[data-state="closed"]` matches with **0** bodies (so
the `≥6 collapsed` gate passed on two empty items), and with JavaScript disabled the regions
**cannot be opened at all**.

**Decision.** Native `<details>/<summary>`. Content is in the DOM, openable with zero JS,
SEO-safe — by construction rather than configuration. No vendored component, no `forceMount`,
no a11y workaround. The collapsed-count selector becomes `details[data-section-id]`
deduplicated by id, so it counts sections rather than nested state attributes.

**Alternatives.** *Radix + `forceMount`* — rejected: fixes presence only, leaves no-JS users
with permanently unreachable content, arguably worse than unmounting. *Lazy-load on expand* —
rejected earlier: a lazy section is genuinely absent and fails AC-6.2 while appearing to pass.

**Consequences.** *Positive:* the simplest mechanism is also the most correct; three
derived problems (DOM presence, no-JS, a11y) collapse into one platform primitive; less code.
*Negative:* less animation control than Radix, and `<summary>` styling needs
`::-webkit-details-marker` handling. *Lesson recorded:* reaching for the component library was
a reflex; the platform primitive was better on every axis and I did not consider it until a
reviewer forced the question.

---

## 11. Open Questions — send as ONE message at branch time (S0.8)

1. ~~**AC-4.2 scope**~~ — **CLOSED (Amendment 2, decision 1): the scope is 47** (four names +
   `section-label-{dark,light,rule}`); **`eyebrow` (92) is explicitly out**. Corrected figures
   retained below for the record — note the earlier 35/46/90 came from a defective scanner
   (V61), not from a different definition.

   | Scope | Call sites to edit | Files |
   |---|---|---|
   | The four AC-4.2 names | **36** | 17 |
   | + `section-label-{dark,light,rule}` | **47** ← **binding scope** | 17 |
   | + `eyebrow` | 92 — **explicitly OUT** | — |
   | + `@utility` definitions (deleted, not migrated) | +4 | 1 |

   *(A raw grep reports higher — 52/23/46 per name — because it also counts each name's own
   `@utility` definition and, for `display`, the `font-display` tokens. Call sites ≠ raw
   matches. The gate derives from a generated `docs/type-inventory.md` so no one retypes it.)*

   Maya's mockups **raise the floor**: they need display voices the codebase does not have
   (V34, V37), so the scale must gain a **case axis**, not just fewer weights. A partial
   consolidation leaves both the competing-weights bug *and* an unbuildable page.
   **RESOLVED — Amendment 2, decision 1: the scope is 47** (four names + `section-label-*`). `eyebrow` (45) is explicitly **out of scope**.
   — Cost note: **no font file, no network request, no extra bytes** (V35, V36).
2. **Six social URLs** — YouTube, LinkedIn, Instagram, TikTok, Spotify, X. Absent from the repo
   (`site-footer.tsx:4,43`). *Blocks S3.1 only.* (R15)
3. ~~**Pause Lovable publishing**~~ — **CLOSED (Amendment 2, decision 8): publishing WILL be paused.** ⚠️ **But the pause must be communicated to Maya first, so the hand-reconciled merge strategy stays live — the pause is risk reduction, NOT permission to assume a static `main`.** R2/PM-2 unchanged. Remaining sub-question:
   (a) Can publishing be paused for the branch's lifetime? Not blocking, but it is the only
   structural fix for the reverting-bot risk. (R2)
   (b) **Does Lovable's sync cover feature branches, or only the connected branch?**
   `AGENTS.md:8` says commits sync *"to the connected branch"*. If Lovable mirrors feature
   branches too, pushing 85.4 MB is a new, unmodelled interaction with a third-party system.
   *(GitHub itself is mechanically fine — largest single file is 2.65 MB, well under limits.)*
   This gates Q4. (R2, R14)
4. ~~**85.4 MB of originals in git history**~~ — **CLOSED (Amendment 2, decision 4): COMMIT them; AC-1.1 stands as written. The S0.2b capture-before-commit ordering is retained.** Original text: (B′1), as AC-1.1 literally requires, with
   WebP derivatives serving the browser. The alternative weakens the AC. (R14)
5. ~~**Sovereignty positioning**~~ — **CLOSED (Amendment 2, decision 5): practices only, assert NO domain definition, plus a prohibited-claim test per `controls.yaml:5`.** Original text: `controls.yaml:4`
   names `reference/whitepaper.html` as `source_of_truth`, while `controls.yaml:24-35` records
   that sovereignty was **rescoped** from hosting geography to data handling and that the
   whitepaper and `CONTEXT_BRIEF.md` are *"not yet updated to match — gated on human sign-off."*
   So the spine documents that it currently diverges from its own declared source of truth.
   Grounding public copy in the YAML contradicts the published whitepaper; grounding it in the
   whitepaper contradicts live controls. **The plan's interim resolution:** describe sovereignty
   through *practices* both agree on and assert no domain *definition*. Confirm, or tell us
   which source wins. (R9)
6. *(Non-blocking)* Surnames for **Sid** and **Maya**. AC-6.7 requires only the given names, so
   the plan strips the PDF's `[Last Name]` placeholders and ships without surnames unless you
   supply them.
7. ~~**"Lindsay / Vancouver"**~~ — **CLOSED (Amendment 2, decision 6): mockups are illustrative; the real four stand; Lindsay is NOT added.** Original text: Mockup 2 attributes *"To love one
   another. Treat each other, and yourself, with respect and compassion."* to **Lindsay /
   Vancouver**. The four `ARCHIVE` entries (`content.ts:85`) are ADEWOLF, BELLA, ANTON, ARLINA
   (V40). Either the archive gains Lindsay, or the mockup is illustrative and a real quote
   substitutes in. **The plan will not silently invent an entry.** *Which?* **Recommend:
   treat the mockup as illustrative and substitute ADEWOLF's "Love. Love each other." —
   it is the closest real quote in sentiment** — unless Lindsay is a genuine archive subject
   you want added, which is an archive-content decision, not a layout one.
8. ~~**Five portrait slots**~~ — **CLOSED (Amendment 2, decision 6): four portraits, not five.** Original text: Mockup 1's archive section shows
   **1 large + 4 small** portraits (V40), while Round 6 of the interview deliberately settled
   the archive at **four** entries and AC-7.1 pins exactly four. Either the large portrait is a
   **distinct feature image** (not a fifth archive entry — the plan's reading, and compatible
   with AC-7.1), or the archive needs a fifth entry, which reopens a simplification you chose
   on purpose. **Recommend: large portrait = a feature/hero image, four small = the four
   archive entries.** *Confirm.* This blocks S5.2b only.
9. **★★ What happens to `/about`?** The binding tree lists **About as a menu label** whose two
   destinations are Why We Exist and Who We Are (V49) — About itself is not among them. But
   `/about` exists on `main` (`src/routes/about.tsx`) and the amendment doesn't say what
   becomes of it. **Recommend: repurpose `/about`'s content as `/why-we-exist` and 301
   `/about` → `/why-we-exist`**, so no indexed URL breaks and we don't maintain two
   near-identical mission pages. *Confirm — this changes a live URL.* (S3.6c)
10. ~~**AC-6.2 summary-plus-link?**~~ — **CLOSED (Amendment 2, decision 2): tiering approved, "present ≠ equally prominent".** Original text: The digestibility design
   (S6.0) moves the three Our Approach pillars to their own routes, leaving titled summary
   cards on the Blueprint. I read that as "present". If you read AC-6.2 as requiring full
   inline content for all 16, say so — Tier 3 then collapses into Tier 2 accordions and the
   pillar routes carry duplicate content. **Recommend: summary-plus-link.** (S6.0)
11. **★★ Does the footer's Indigenous line also get a maple leaf?** AC-2.8a + AC-6.6 jointly
   locate the leaf beside the Blueprint hero's Indigenous-led line. The footer carries its own
   Indigenous line (AC-2.1). **Recommend: hero only** — one leaf reads as a mark, two reads as
   decoration. (S6.7)
12. ~~**Brett's testimonial**~~ — **CLOSED (Amendment 2, decision 3): render the section, mark the slot pending. 16/16 holds.** Original text: PDF v4 pp. 7 and 12 are placeholders
   and the quote does not exist yet (Maya, 08-15 15:52). **The plan will not stub or invent
   it**; the Client Proof section is omitted until real copy arrives. *Is shipping without
   Client Proof acceptable, or does Blueprint hold for it?* This is the one open item that can
   block AC-X.5 on content rather than code. (S6.9)
13. ~~**Deploy to staging?**~~ — **CLOSED (Amendment 2, decision 7): yes; staging is the review venue and the rehearsal target for `prod-acceptance.sh`.** Original text: It currently serves
   `feat/podbean-rss-integration`, and it is the environment Maya reviews against. Deploying
   over it is a visible change to shared infrastructure. **Recommend: yes** — it is the only
   way to prove AC-X.5 before production, and the reference branch is preserved in git
   regardless. *Confirm.* (S9.3)

## 11b. ★★★★★ OPEN AT HAND-OFF — needs a human, not a planning decision

Everything below is genuinely unresolved. None blocks starting; several block *finishing*.

| # | Item | Blocks | Owner | Notes |
|---|---|---|---|---|
| 1 | **Brett's testimonial does not exist** (Maya 08-15 15:52) | Blueprint completeness, not the release | Maya/Shane | Amendment 2 decision 3: section renders, slot marked pending. Nothing fabricated. Ships incomplete-but-honest until the quote arrives. |
| 2 | **Six social URLs** — YouTube, LinkedIn, Instagram, TikTok, Spotify, X | **S3.1 hard-blocks** | Maya | Absent from repo and all three amendments. `site-footer.tsx:43` is the lone `href="#"`. Only genuinely blocked sub-step in Component 2. |
| 3 | **The Lovable pause must be communicated to Maya** before it is real | Nothing, but it gates R2's mitigation | Team lead | Amendment 2 decision 8. Until communicated, treat `main` as live: hand-reconciled merges, PM-2 triggers all stand. |
| 4 | **Shane's copy for the Human Archive and Why We Exist** | S3.6c content quality | Shane | `/why-we-exist` is planned as a repurpose of `/about`; Shane's own framing supersedes that if supplied. |
| 5 | **Shane must review `/who-we-are`** before production (AC-3.5a) | **Production promotion** | Shane | Artifact: `.approvals/who-we-are-review.json`. Happens on staging (S9.3). |
| 6 | **Maya must review the site on staging** (Amendment 2 decision 7) | **Production promotion** | Maya | Staging is the review venue and the rehearsal target for `prod-acceptance.sh`. |
| 7 | **Typography specimen sign-off (G1 / AC-4.4)** | **Phases 4, 5, 6** | User | The single largest schedule dependency. Artifact: `.approvals/typography.json` with `scale_sha256`. |
| 8 | **Positioning/legal sign-off** (AC-6.5d) | **Production promotion** | Shane + whoever owns claims | New in iteration 5. Blueprint makes governance claims bounded by `controls.yaml:5`; needs a named human verdict, hash-bound. |
| 9 | **`/about`'s fate** — repurpose to `/why-we-exist` + 301? | S3.6c | User | Recommended, not actioned: it changes a live URL. §11 Q9. |
| 10 | **Footer maple leaf?** AC-2.8b places one beside the Blueprint hero's line | Cosmetic | User | Recommend hero only. §11 Q11. |
| 11 | **Sid's and Maya's surnames** | Nothing (AC-6.7 needs given names only) | Maya/Sid | PDF `[Last Name]` placeholders are stripped, never filled with guesses. |
| 12 | **Lovable branch-sync scope** — does it mirror feature branches? | Gates the 85 MB push (S0.2b) | Team lead | If Lovable mirrors feature branches, an 85 MB push is an unmodelled third-party interaction. |

---

## 12. Changelog

### ★★★★★★★★ Iteration 8 — hold (final)

Four enumerated items. No new scope, no re-argument.

| Item | Disposition |
|---|---|
| **1 — schema hash placement** | Positioning's flat `copy_sha256`/`controls_sha256` moved under `evidence`, matching typography's `evidence.scale_sha256`. The iteration-6 changelog's impossible "at most one typed extra" rule is corrected in place. One schema, one extension rule, one set of field names — verified by grepping every artifact reference. |
| **2 — typed gate counts** | All four replaced by generator expressions: manifest rows → `src/assets/*.asset.json` glob count; `≥39` imports → per-file counts in `docs/asset-inventory.json`; `13` → `SURFACES.length`; `12` → `SURFACES.filter(s => s.expectsSingleNav).length`. The sweep also caught `≥44` and a descriptive "13 visitable surfaces" and derived both. |
| **3 — creation wiring** | **S0.4c rewritten as a complete 40-artifact manifest.** The sweep surfaced **12** files with no creation step, not the 5 named — most seriously **`ac-suite.sh`**, the release-gate entry point. Path mismatch resolved: the acceptance-fault test is `scripts/verify/acceptance-faults.test.ts` everywhere. Gate ordering pinned: `ac-inventory.ts` → `ac-bijection.sh` → `ac-suite.sh`. |
| **4 — phantom cross-references** | AC-5.8a's proof now points at its own layout sub-proof, not the non-criterion `AC-5.1b`. Three further binding references to `AC-6.5b` repointed to AC-6.11a's prohibited-claim sub-proof. No invented ID remains in a binding position. |

**Rejected:** nothing.

### ★★★★★★★ Iteration 7 — closing pass (final)

Five mechanical items. No new scope, no architecture change.

| Item | Disposition |
|---|---|
| **1 — bijection 63/63** | **Fixed and re-run: `live=63 rows=63 unique=63, 0 missing, 0 duplicate`.** `AC-2.1` was declared partially superseded (live) in the header but tagged fully superseded in its row — reconciled to **live/partial**, since only its Indigenous string is replaced by AC-2.1b while its strapline, wordmark and Caveat/lime clauses stand. `AC-6.9a` had two rows; the stub was deleted and the composite row relabelled. **63 is the only live count stated anywhere.** |
| **2 — artifact schema** | **Fixed.** The "exactly one extra field" rule was internally impossible — positioning needs two hashes. Replaced with a typed `evidence` object: typography `{scale_sha256}`, positioning `{copy_sha256, controls_sha256}`, the two human reviews `{}`. The obsolete `specimen_url` / `approved_by` / `approved_at` names are purged; `deployment_url` carries the specimen URL and `timestamp` replaces `approved_at`. |
| **3 — typed literals** | **Fixed.** `46` now derives from the pointer glob, the restore drill from the recovery manifest, surface counts from `SURFACES`, and nav length from the binding-tree fixture. |
| **4 — uncreated scripts** | **Fixed — this was the one that would have halted execution.** New **S0.4c** creates `ac-bijection.sh`, `audit-scans.sh` and `acceptance-faults.test.ts` with their contracts stated, plus the eight other invoked-but-uncreated files (`lib.sh`, `delta.sh`, `restore-drill.sh`, `g1.sh`, `audit-or-true.sh`, `audit-count.sh`, `prod-images.sh`, `prod-acceptance.sh`, `surfaces.ts`) — the same defect applied to all of them, not just the three named. |
| **5 — stale instructions** | **Fixed.** S5.2b no longer gates on the closed Q7 and specifies four archive portraits plus one feature image, not five entries. `AC-5.1b` is gone as an ID; its content is AC-5.8a's layout sub-proof, and both cross-references now point there. R9 and R21 are marked **CLOSED** (Amendments 2.5 / 2.6) rather than presented as open risks; R27's invalid `9→14` is replaced by `SURFACES`. |

**Rejected:** nothing. All five reproduced; item 4 was a genuine execution blocker I introduced.

### ★★★★★★ Iteration 6 — reconciliation (final)

Codex's third REJECT diagnosed the real defect: **iteration 5 accreted fixes instead of
replacing them**, so an executor reading top-to-bottom met both the old and the new instruction
with no way to tell which governed. This pass deletes rather than adds. **No new scope; no
architecture changed.**

| Item | Disposition |
|---|---|
| **A — superseded-instruction purge** | **11 binding instructions rewritten or deleted** (see summary below). Retracted *history* (V56, ADR-003 context, the "why forceMount was wrong" box) is kept and clearly tagged; binding *instructions* are gone. |
| **B-1 — AC inventory** | **Derivation executed: 67 unique IDs, 4 retired, `LIVE = 63`.** 44/55/53 were all wrong. **Bijection was broken both ways**: 5 live ACs had no proof row (`AC-4.2b`, `AC-6.10a`, `AC-6.11a`, `AC-X.6a` from Amendment 2, whose content I had implemented without ever adding rows; plus `AC-6.9a`, which I wrongly marked fully superseded when only its *mechanism* was). And **5 rows carried IDs I invented** (`AC-5.1b`, `AC-6.5b/c/d/e`) — demoted to named sub-proofs of real ACs. `ac-bijection.sh` now enforces both directions in the gate. |
| **B-2 — tier mapping** | **The 6/7/3 split was mine and it did not add up.** Tier 3's three pillars are *subdivisions of "Our Approach"*, itself one of the 16. Published an exact 16-row fixture (`docs/blueprint-sections.json`), one tier each, in PDF order: **Tier 1: 7 · Tier 2: 7 · Tier 3: 2 = 16**. Tier 2's 7 satisfies AC-6.9c's ≥6 floor. |
| **B-3 — wrong-origin acceptance** | **Fixed.** `assert_origin` checks `%{url_effective}`'s host **before** any content read, for both environments; `EXPECTED_HOST` derived from the env URL. Added the decisive fault case: *correct copied DOM served from a disallowed host*. Content assertions can never establish identity — only origin can. |
| **C1** | `audit-scans.sh` and `ac-bijection.sh` wired into the Phase 8 gate commands (previously declared but never invoked). |
| **C2** | **One schema for all review artifacts.** Typography's `{specimen_url, approved_by, approved_at}` conflicted with the stated common schema; unified on `{reviewer, timestamp, deployment_url, commit_sha, verdict}` + a typed `evidence` object holding whatever hashes an artifact must bind (typography one, positioning two). *(The "at most one typed extra" wording in this row was itself impossible and is corrected in iteration 7.)* |
| **C3** | `POSITIONING_DISCLAIMER` pinned to an **exact literal**, compared by identity rather than keyword. |
| **C4** | Remaining literals (13, 12, 39, 44) derived from `SURFACES` and `docs/asset-inventory.json`, per ADR-002. |

**Rejected:** nothing. Every finding was reproducible, and three of them (B-1's bijection,
B-2's arithmetic, B-3's origin hole) were defects I introduced and did not catch.

### ★★★★★ Iteration 5 (final) — Amendment 3 + Codex REJECT (9 findings)

Codex reviewed the **iteration-3** snapshot, so #1, #3, #5, #8 were partly closed by iteration-4
work. Reconciled individually rather than dismissed.

| Finding | Disposition |
|---|---|
| **#1 tiering unauthorized** | **Closed by Amendment 2 decision 2** (Codex hadn't seen it). **Narrower point kept and applied:** the tiering evidence came from Maya critiquing the *staging* build, which does not implement AC-6.2 — recorded as provenance, so it reads as a requirement rather than a measurement of a page that never existed. |
| **#2 accordion fails SSR/no-JS; gate false-greens** | **Fully applied — and it reverses my iteration-4 `forceMount` design.** Native `<details>/<summary>` per Amendment 3 decision 2. Both Codex gate fixes applied verbatim: count `details[data-section-id]` **deduplicated**, not nested state attributes (its probe: 8 matches for 2 sections); ratio defined as visible ÷ complete normalized prose characters against a canonical fixture with **both** numerator and denominator floors. Added a **JS-disabled Playwright run** — the only check that would have caught the accordion. See ADR-003. |
| **#3 pillar routes swallowed** | **Fixed in iteration 4** (V60, `be-human-ai/index.tsx`). Verified still complete; Codex's extra assertions added (route ID, full path, H1, direct navigation). |
| **#4 route blast radius / contradictory counts** | **Fixed in iteration 4** via `SURFACES`; verified it eliminates all three disagreements Codex names. **On the line-number dispute: the Architect was right and Codex found an extra site.** `STATIC_PATHS` is at `:42`; the exact `toEqual` that breaks is `:106`; Codex's `:59-72` points at a *second* consumer (`:66` feeding the `toEqual` at `:71`), plus a `>=` floor at `:88`. All four now named. |
| **#5 copy gates contradict implementation** | **Closed by Amendment 3 decisions 1 and 3.** `INDIGENOUS_LINE` and `PRINCIPLE_TITLES` are single shared constants consumed by implementation *and* proof, so they cannot drift. |
| **#6 lib.sh rules declared but not applied** | **Fully applied, including the new part.** Raw `wc -l` purged from AC rows. More importantly: **forbidden-token scans now exclude tests by construction** — every banned token appears inside the test that bans it, so a bare `grep -r src/` self-matches and can never pass. All scans go through `srcNonTestFiles()`; `audit-scans.sh` enforces it. AC inventory derived from the spec rather than hand-listed. |
| **#7 legal sign-off not provable** | **Fully applied.** Regex broadened to catch *compliant*, *guarantees compliance*, *government approved*, *certifying* (AC-6.5b); disclaimer pinned as `POSITIONING_DISCLAIMER` asserted against `controls.yaml:5` (AC-6.5c); **release-blocking artifact** `.approvals/positioning-review.json` carrying the canonical fields + `evidence.{copy_sha256, controls_sha256}`, both **re-verified at gate time**; structured claim→control traceability (AC-6.5e). |
| **#8 review artifacts non-durable** | **Closed by Amendment 3 decision 4** — and it was the **third** occurrence. I fixed the typography artifact in iteration 3, then introduced `.omc/state/shane-review-who-we-are.json` in iteration 4, which is gitignored (confirmed). All artifacts now under tracked `.approvals/`, schema-validated, bound to deployment URL + commit SHA, with a CI check that `git check-ignore` rejects nothing there. |
| **#9 pre-mortem internally invalid** | **Fully applied.** The plan claimed A3 opens the gate "on day one" and then conceded it cannot — **both sentences stayed in the document across two iterations.** Now rewritten around the actual dependency graph, with the cost stated rather than glossed. PM-3's obsolete 53 purged. |
| **NB — stale metadata** | Applied: header said "iteration 2"; "all 44" headings and obsolete 14/10/53 text corrected or marked superseded. |
| **NB — fault-injection for `prod-acceptance.sh`** | **Applied, and this one is important.** Codex proved the isolated `fetch_ok` + no-Lovable check **passes against Wikipedia** — it establishes neither identity nor correctness. Seven seeded-failure cases added (wrong host, soft-404, missing component, duplicated nav, empty collapsed content, reordered sections, hidden-text padding). A gate never observed failing is of unknown strength. |

**Rejected this round:** nothing. Every finding either reproduced or was already closed by
Amendment 2/iteration-4 work, and I've said which is which rather than claiming credit.

### ★★★★ Iteration 4 — Amendment 2 (8 decisions) + Architect B1-B7

**Amendment 2 applied in full.** All 8 decisions folded in; §11 Q3, Q4, Q5, Q7, Q8, Q10, Q12,
Q13 closed in place with their original text retained for audit. Four questions remain: Q2
(social URLs), Q6 (surnames, non-blocking), Q9 (`/about`'s fate), Q11 (footer maple leaf).
Note on decision 8: the Lovable pause is recorded as **risk reduction, not permission** — the
hand-reconciled merge strategy, R2 and PM-2 are all unchanged, since the pause has to reach
Maya before it is real.

| Finding | Disposition |
|---|---|
| **B1 — V56 is false** | **Fully accepted; V56 RETRACTED.** Isolated re-test: `e5196a3^` **0×**, `e5196a3` **0×** — neither side contains the string; `3e03c8a` **added** it (0→1). My earlier loop was corrupted by `^` expansion in an unquoted zsh `for` list. I promoted a shell artefact to ★★★ and used it to partially reject a correct finding. **S0.4b now commits the reproduction and a range, and names no culprit at all** — the provenance was never load-bearing on R2. |
| **B2 — AC-6.9a(d) unsatisfiable** | ⚠️ **THE `forceMount` FIX BELOW IS SUPERSEDED — see iteration 5 / Amendment 3 decision 2. Implement native `<details>`, NOT `forceMount`.** Retained for audit. **Accepted; mechanism specified (at the time).** Verified: `forceMount` 0 hits, `accordion.tsx:37-48` wraps stock `Content` which unmounts. Four binding requirements added — `forceMount` in a **local** `accordion-forcemount.tsx` (not the shared component), visual collapse via `hidden`/`data-state` + CSS height, **section `id` on `AccordionItem` never inside `Content`**, and AC-6.9a(b) pinned as `innerText`(expanded) / `textContent`(all 16). Plus an a11y note. |
| **B3 — count is 36/47/92; the scanner is the defect** | **Accepted; my V55 explanation was wrong.** Both missed sites verified. The other scanner never opens `styles.css`, so "it counts definitions" was false — **my regex simply could not see bare string constants or `cn()` arguments**. Per Amendment 2 the floor is **47**. The plan now **pins the scanner's definition** (4 rules: string-literal scan, prefix-stripping, exact token match, separate `styles.css` pass) and the gate asserts the **scanner's own SHA-256** matches the inventory — because pinning only the output leaves the derived-floor mechanism defeatable. |
| **B4** | Resolved by Amendment 2 decision 3; implemented in S6.9. |
| **B5 — three drifting surface counts** | **Accepted.** `src/lib/surfaces.ts` exports `SURFACES` (path, kind, `expectsSingleNav`); every floor imports it — AC-3.3, AC-1.6, `prod-acceptance.sh`, the visual-diff matrix, the sitemap. **`SURFACES.length` is the floor; no number in the plan is.** A test asserts `SURFACES` and `routeTree.gen.ts` agree. PM-3's matrix corrected to 13 × 3 = **39**; AC-X.5's stale "10 surfaces" replaced. |
| **B6 — pillars render blank** | **Accepted; conversion stated as a file operation.** `git mv src/routes/be-human-ai.tsx → src/routes/be-human-ai/index.tsx`, pillars as siblings, no `<Outlet/>` needed. Added an explicit id assertion **and** a rendered-`<h1>` check, because the old mitigation (`route-shape.test.ts` passes) pins podcast ids only (`:70` scoped, `:52` a `>=8` floor) and stays green through a blank page. |
| **B7 — sitemap test** | **Accepted.** `sitemap.xml.test.ts:42`'s duplicate `STATIC_PATHS` and `:106`'s exact `toEqual` named in S3.6f; both route and test import `SURFACES`; duplicate deleted. R27 corrected (it named only `route-shape.test.ts`). |
| **Tiering provenance** | **Accepted.** Recorded that Maya's overload complaint was made against the **staging** build, which does not implement AC-6.2 — so it is evidence of a requirement, not a measurement of the 16-section page. |
| **AC-X.1 independence** | **Accepted.** `git cherry` sees commits, not convergent code. S3.6a now mandates writing `nav.ts` **from `spec:283` before reading the reference**, a dated `docs/nav-reference-notes.md`, and a **≥5-line identical-run similarity check** added to AC-X.1's proof. |
| **NB1 `count()` unused** | Applied — `audit-count.sh` added to Phase 8 (no bare `\| wc -l` outside `count()`). |
| **NB2 AC-6.9a(c) vacuous** | Applied — re-aimed from "first CTA within 2 viewports" (which S6.6's hero CTA made unfailable) to **scroll depth to the last Tier-1 element ≤ 4 viewport heights**. |
| **NB3 AC-6.9a(e) near-vacuous** | Applied — now asserts a **distribution**: every Tier-1 heading strictly larger than every Tier-2 heading, plus ≥3 distinct steps. |
| **NB4 V26 stale** | Applied — marked superseded by V58, as V23 was. |
| **NB5 phase diagram** | Applied — Phase 0 relabelled **[CRITICAL PATH]** with the S0.6/S0.7 overlap exception drawn in, matching the A3 amendment. |

**Rejected:** nothing in this round. B1 was a straightforward error on my part; every other
finding reproduced on first attempt.

### ★★★ Iteration 3 — Architect N1-N6 + verified tiebreakers

Six defects the iteration-2 revision itself introduced, plus two tensions. All re-checked
against the post-Amendment-1 file.

| Finding | Disposition |
|---|---|
| **N1 — `\|\| true` greens on a dead site** | **Applied, and generalized.** Reproduced (V51): a 404 URL yields `val='0'` and the assertion PASSES. Iteration-1 greped a redirect body; iteration-2 was strictly worse. §9 now opens with **three binding rules** in `lib.sh` — capture-then-assert (`fetch_ok` with a 10 000-byte floor), normalized counts, and no unasserted output — plus a **`audit-or-true.sh` obligation** in Phase 8 to prove every remaining `\|\| true` wraps a local, non-network command. |
| **N2 — approval + report artifacts sit in the gitignored `.omc/`** | **Applied.** Confirmed by `git check-ignore` (V53). Moved to tracked paths: `.approvals/typography.json`, `.baseline/asset-recovery-report.json`, `.baseline/failing-tests.json`. Verified `.baseline/`, `docs/`, `src/assets/*.json`, `.approvals/` are all tracked. Fair hit: I applied this lesson to 85 MB of images and not to the one artifact proving a human said yes. |
| **N3 — the count is wrong (again)** | **Applied with a correction, and made moot.** My measured call-site scope is **35 / 46 / 90** (four names / +variants / +eyebrow) across 15 files — see "Rejected" for why this differs from 36/47/92. More importantly the number is now **generated**: `docs/type-inventory.md` is written by a committed script and the AC-4.2 gate asserts the live scan equals it, so no figure is ever retyped. §11 Q1 restated on measured data. |
| **N4 — "manifest" names two artifacts; originals can never appear in the Vite one** | **Applied.** Renamed to `src/assets/asset-recovery-manifest.json` (SHA-256 of originals → **AC-1.1**) vs the **Vite build manifest** (fingerprinted derivative URLs → **AC-1.6**). Added an explicit note that originals are *never* in the build manifest by design, and that the wrong fixes are importing 85 MB or weakening AC-1.6. |
| **N5 — V32's provenance is false** | **Partially rejected — see below.** The *citation* is loosened to a range and a reproduction; the *conclusion* stands. |
| **N6 — the irreversible push precedes the question authorizing it** | **Applied. This was the most serious finding after N1.** S0.3 pushed 85.4 MB; S0.8 then asked Q4 whether that was acceptable — and `AGENTS.md:1-10` forbids the only remedy, so "no" had no compliant answer. New **S0.2b** splits the ask: **Q3 and Q4 go out before the push**. Capture (D1) is urgent; the *commit* is not — the release asset already closes the data-loss risk, so a stalled Q4 costs nothing. |
| **A3 steelman — the gate can't open "day one"** | **Applied as an explicit amendment.** S0.7 depends on S0.6, so Phase 0 **is** the critical path — now stated rather than glossed. Carved **one exception** to "single front": S0.6/S0.7 may overlap Phase 1 (near-zero merge surface — Track A touches assets and imports; the inventory touches class strings and `styles.css`). A3 still wins: D1 closes in minutes either way, S0.6 is analysis not migration, and V17 re-prices A2's three permanent fronts. |
| **Tension — `AGENTS.md:8-9` vs the pinned red baseline** | **Applied as synthesis.** "Working state" read as **no new breakage**: (a) `BRANCH-STATUS.md` at branch root records the inherited failures and that they are pinned deliberately, so Lovable/anyone sees intent not rot; (b) `delta.sh` runs as a **pre-push hook** so the branch provably never regresses; (c) Q3/Q4 answered before the push. Fixing the baseline at branch time stays rejected — it maximizes conflict surface against a reverting bot (Tension 1). |
| **NB1 — `wc -l` padding inverts five gates** | **Applied.** Reproduced on darwin (V52): unquoted `[0]`, quoted `[       0]`. `lib.sh` RULE 2 standardizes on `grep -c`, with `tr -d '[:space:]'` where `wc` is unavoidable. |
| **NB2 — route arithmetic double-counts** | **Applied and re-derived for the new nav tree.** Dynamic ids are *patterns*, not extra surfaces (V57). Pre-amendment visitable = **9**, not 11. Post-Amendment-1 = **13** (11 static + 2 concrete), with AC-3.3 checking **12** and `/about` checked as a 301 (V58). |
| **NB3 — `git cherry` floor is sound** | Noted; a non-vacuity floor added anyway so a silent empty output can't pass. |
| **NB4 — baseline should record assertion identity** | **Applied.** `.baseline/failing-tests.json` stores `{file, testName, assertedSubstring}` so the delta gate distinguishes "still stale for the known reason" from "newly broken". |
| **NB5 — confirm Lovable branch-sync scope** | **Applied.** Folded into §11 Q3(b) and made a **gate on Q4**, since it determines whether an 85 MB push is even user-visible. |
| **NB6 — narrow the `content=` sweep** | **Applied.** Restricted to `og:image`/`twitter:image` with `^https?://` and an image extension — unnarrowed it collects `og:description` prose and silently skips, which is the exact hole V29 exists to close. |

**Rejected, with reasoning**

| Finding | Why not applied as stated |
|---|---|
| **N5's factual claim** ("`e5196a3^` and `e5196a3` each have 0 occurrences") | **Disproved by execution (V56).** `e5196a3^` contains `visible.slice(1, 1 + shown)` **1×**; `e5196a3` contains it **0×**; and `e5196a3` is a single-parent commit, not a merge. So `e5196a3` *did* remove the string. That said, `git log -S` independently names `3e03c8a` and `5ef8dd7`, so the string **oscillated** across several bot commits and my original single-commit citation was overconfident in a different way. **Resolution: cite neither as sole culprit.** S0.4b now commits the *reproduction commands* and the range, not a verdict. The conclusion — bot activity stranded the assertion, R2 is well-founded — was never in doubt. |
| **"Treat 36/47/92 as authoritative"** | ⚠️ **THIS ENTRY WAS WRONG — see iteration 4 / B3. 36/47/92 was correct; my scanner was defective.** Original text follows for audit. **Adopted in spirit, corrected in fact.** My `className`-scoped scan gives **35/46/90** across 15 files. The delta is exactly **+1 per name**: a raw `\bname\b` grep also counts each utility's own `@utility` definition in `styles.css` — and those are **deleted, not migrated**, so they are not call sites. (`display` diverges further: raw grep sees 52 because `font-display`/`--font-display` match on the hyphen word-boundary.) Both readings are internally consistent; only one answers *"how much has to be edited"*. Rather than have a fourth count dispute, **the gate now derives the number from a generated inventory** and no hand-typed figure is authoritative — which is the mechanism you proposed, applied to both numbers. |

### ★★ Spec Amendment 1 (2026-08-17) — nav reversal + Maya's requirements

Arrived after the mockup integration. Binding; supersedes parts of iteration 2.

| Change | Detail |
|---|---|
| **AC count** | 44 → **55 listed** (44 original + 11 amended), of which **AC-3.1 and AC-3.2 are superseded** ⇒ **53 live**. Both struck rows are retained in the proof table marked SUPERSEDED, not deleted — the amendment's own convention. |
| **Round 4 reversed** | Nav flattening was decided on a **false premise** (About as a one-child dropdown). New evidence: staging live at 200 (V43), Shane's two-page structure, Maya's *"Let's go with this design."* The binding tree **inverts the original brief — About is the PARENT**. |
| **Component 3 tripled** | Iteration-2's S3.6 was a one-line guard. Replaced by **S3.6a–f**: typed `src/lib/nav.ts`, Radix dropdown desktop + Collapsible mobile, `/why-we-exist`, `/who-we-are`, three pillar routes, and route-tree re-baselining. New R22. |
| **Routes vs anchors — decided: routes** | Justified in a scored table (§5). **AC-6.9a and AC-3.6a point the same way**: the pillars are precisely the depth that makes the Blueprint feel overloaded, so moving them out fixes both at once. Anchors would satisfy AC-3.6a on a generous reading while actively worsening AC-6.9a. Corroborated by V44 — the reviewed staging build chose routes. |
| **AC-6.9a — the previous approach was actively wrong** | Iteration-2 planned a linear 16-section wall. Replaced by the **three-tier design (S6.0)**: a 6-section always-visible spine; ~7 default-collapsed accordion sections **in the DOM, not lazy-loaded**; 3 sections relocated to the pillar routes as summary cards. Sub-nav upgraded from decorative anchors to a **scroll-tracking sticky rail**. AC-6.9a given **five measurable floors**, including one that literally falsifies "equal weight" and one that makes deleting content a failure. |
| **New routes' blast radius** | *(count later superseded — surfaces derive from `SURFACES`.)* Renderable surfaces 9 → 14 (V50). Every route-sweep floor, the sitemap, and the footer NAV mapping re-baselined in S3.6f. New R27. |
| **Split-control trap** | V46 recorded from the reference branch's own comments: a Radix trigger is a `<button>`, so a non-navigating parent needs a `self` child or its page becomes unreachable. About needs none (its children *are* its destinations); Blueprint is a split control (pill navigates, chevron opens). |
| **Staging as a gate** | New S9.3: deploy to staging, run the **full** production suite there, and land both human reviews (Maya's site review, Shane's `/who-we-are` review) **before** prod. Same scripts on both environments, so a staging-pass/prod-fail is provably a deploy defect. |
| **Maya's smaller ACs** | AC-2.7a CTA labels → S3.5b (both positive strings and both superseded strings asserted). AC-5.9a trailing periods → S5.4. AC-2.8a leaf placement → S6.7, now an **adjacency** assertion (≤2 DOM levels), not co-presence. AC-4.6a and AC-5.8a were already satisfied by the mockup pass. |
| **Brett's testimonial** | ⚠️ **SUPERSEDED in iteration 5 — Amendment 2 decision 3 / AC-6.10a: the section RENDERS with the slot marked pending. It is NOT omitted.** Retained for audit. Original: recorded as a hard content dependency; section omitted, never stubbed. |
| **Lovable-generated pages** | Maya, 08-15 15:56 (*"lovable created all of the pages by default. The only page I actually created was the homepage."*) corroborates that every non-homepage route is generic scaffold — strengthening the rebuild-from-source approach for Components 5 and 6, and lowering the risk of discarding `/about`'s current content (§11 Q9). |
| **No new dependencies** | V48: `@radix-ui/react-{navigation-menu,dropdown-menu,collapsible,accordion}` are already in `package.json` and `src/components/ui/`. The dropdown nav **and** the accordion-based progressive disclosure both ship without adding a package. |
| **Reference branch** | Still reference-only. Its **structure** is cited as evidence (V44-V46); its **tree is not the spec** (V47 — it uses "Why We Exist" as parent with 5 children). Nav model written fresh. New R28. |

### ★ Mid-iteration-2 input: Maya's NHE layout mockups

Arrived from the user **after** both reviews were returned and after the iteration-2 rewrite
was complete. Authoritative; folded in as a delta rather than a re-plan.

| Change | Detail |
|---|---|
| **Sources** | Mockups added as a cited authoritative source alongside the two PDFs, with paths and provenance (§ Authoritative sources). Her PDF is SHA-256 identical to the manifesto already on file — **layout is the new information, not copy**. `archive-still-grace-saskatoon.jpg` classified as content, not layout; governs no AC. |
| **Component 4 — scope widened** | V34–V38: the mockups use **three** display voices; the codebase has **one**. The scale gains a **case axis** (`type-h*-caps` / `type-h*-prose`), not just fewer weights. AC-4.1/4.2/4.3 proof rows rewritten to require both registers, with floors that fail a uppercase-only scale. |
| **Component 4 — font priced** | **No new font file, no new family, no new request** (V35, V36). Voice 3 is Work Sans 200/300 — 300 already loaded, and Google `css2` serves one variable woff2 per family, so widening the range at `__root.tsx:104` costs one URL character. Voice 2 needs **no font change at all**: Oswald 200/300 are already requested but `display` hardcodes `text-transform: uppercase` (`styles.css:111`), making the voice unreachable. |
| **Component 4 — correction to iteration 2** | V39: iteration 2 planned to **delete** all four utilities. `section-label` + `section-label-rule` are **load-bearing** — every mockup section opens with that eyebrow+rule. The consolidation now must **preserve the role** under its successor name, and AC-4.2's proof asserts it positively. |
| **Component 5 — layout** | New S5.1b (band system, eyebrow+rule, the four sanctioned lime jobs, alternating splits, 8 px rounded imagery, lime-dot divider) and S5.2b (archive section mapped 1:1 to manifesto p.9). New proof row **AC-5.8a**'s layout sub-proof, with a floor that fails a flat single-background page. |
| **Specimen** | S0.7 must show **all three voices** with their actual mockup exemplar strings, plus the eyebrow+rule. A specimen omitting voices 2 and 3 would satisfy AC-4.4 in form and void it in fact. |
| **Open questions** | Two conflicts **surfaced, not resolved**: Q7 "Lindsay / Vancouver" is not an `ARCHIVE` entry; Q8 five portrait slots against a deliberately-four-entry archive. Recommendations given for both; neither is silently actioned. Q1 updated — the mockups strengthen the case for full AC-4.2 scoping. |
| **Incidental** | V41: stale `styles.css:9-10` comment names the display face "Bebas Neue"; it is Oswald. Fixed in S4.1. |
| **★ Font cost strengthened** | V36 upgraded from "no new request" to **"byte-identical woff2 set"** — `css2` for `Work+Sans:wght@300;…` and `wght@200;…` return the same three files. Adding the light weight is provably free, not merely cheap. |
| **★ Rejected: "trim the Oswald weight request for a free page-weight win"** | **Disproved (V42).** `Oswald:wght@200;300;400;500;700;800` and `Oswald:wght@200;700` return the **identical five woff2 URLs** — the multiple URLs are `unicode-range` subsets, not per-weight files, and Google serves a variable font either way. Trimming saves **zero bytes**. Kept out of the step list so nobody spends a review cycle on a no-op, with a note in S0.6b saying why. The related `display-strong`/weight-600 point is moot — it is dead code (V24), deleted in Phase 0 S0.5. |
| **★ Framing reconciled** | "Two display axes" (Oswald-condensed / Work Sans-wide) and "three voices" are the same finding at different granularity: two *families*, three *registers*, because Oswald is needed in both uppercase **and** sentence case (V37). Recorded in S0.6b so the specimen cannot quietly ship two of three. |

**Net effect on size.** The font question is **small** — zero new assets. The typography
*design* question is **larger**: the user now approves a two-register scale rather than a
one-dimensional ramp. Critically, this lands **inside the existing G1 gate** rather than
adding a new one, so it costs specimen breadth, not schedule shape. Component 5's step count
grows; its dependencies do not change.

### Iteration 1 → 2

### Applied

| Finding | What changed |
|---|---|
| **Verified #1 / C1 / PM-2** | **Rebase strategy deleted entirely.** One optional rebase before first push; merge commits thereafter; no force-push/amend/squash. All wholesale-resolution rules removed — every overlapping file is hand-reconciled. Recorded as R0 (Critical) and V17. |
| **Verified #2** | 40 → **44 ACs** document-wide (V18). Nothing renumbered, dropped, or reworded. |
| **Verified #3 / C3** | Production is `www` (V19). All checks use `-fsSL`; `$PROD` set to the www host. |
| **C2 / A-B1** | AC-1.1 restored to full strength: **byte-identical originals** committed beside pointers + SHA-256 manifest (B′1); derivatives are additive only. Backup moved out of gitignored `.omc/` (V20) to a pushed branch + private GitHub release asset, proven by a **restore drill from a different path**. |
| **A-B1 (portraits)** | Reversed iteration-1's dismissal: the 4 archive portraits **are** extracted from the reference branch as a host-independent second source (V21). |
| **C3 / C4** | New **§3 AC-proof table covering all 44**, each with a runnable proof, a non-vacuity floor, and a failure mode. AC-X.1 now uses `git cherry` patch-ID equivalence. |
| **C5** | **Option A3 added** and chosen; A1 steelmanned accurately (it captures assets first); A1/A2/A3 scored against D1–D3 in a table. |
| **C6** | AC-6.5 hardened: rendered disclaimer, `blueprint-controls.json` traceability, **AC-6.5b prohibited-claim test scoped to product sections**, with personal credentials explicitly allowed and asserted to survive. |
| **C7** | Text scanning confined to forbidden-token rules; structure/nav/CTA/order/pricing/images/typography moved to rendered DOM. Named the runner (Playwright + testing-library/happy-dom), config, fixtures for both dynamic routes, scripts, and CI jobs. |
| **C8** | Retry (3×), exponential backoff, and SHA-256 resume moved **into S0.2** rather than promised in PM-1. PM-2 rewritten around merges. PM-3 given a named command and an approval artifact with `scale_sha256`. |
| **A-B2** | AC-4.2 gate widened from 2 utilities to **all four**, with the verified surface (V23) scoped into Phase 4 **and** raised as §11 Q1. `display-strong` confirmed dead (V24) and deleted in Phase 0. `eyebrow` extended in place, not duplicated (V25). New `styles.test.ts` — nothing read `styles.css` before. |
| **A-B3** | Full type inventory (`clamp(`, `text-[…vw]`, `text-[…rem]`, Tailwind sizes) moved **pre-gate** to S0.6, with the four named landmines. User approves a **mapping**. AC-4.5 guard changed to a **positive** assertion. |
| **A-B4** | Typography guard moved from Phase 4 to **Phase 8**. |
| **A-B5** | All three new guard rules scoped to `srcNonTestFiles` (V27). |
| **A-B6** | Production sweep rebuilt: manifest-driven primary (**with `build.manifest: true` enabled** — see Rejected), DOM secondary over **9 renderable + 2 dynamic** routes (V26), `content=` included (V29), pagination handled, inventory floors throughout. |
| **Tension 1** | **Pin-don't-fix** adopted: baseline committed, delta gate, `eslint --fix` lands in Phase 7 after final integration. |
| **Tension 2** | Whitepaper/YAML divergence surfaced as **§11 Q5**, a user decision; interim practice-level framing documented. |
| **Codex non-blocking** | AC-6.7 **no longer blocks on surnames** — placeholders stripped, surnames demoted to §11 Q6. `vercel build` added to the release gate. `/type-specimen` disposition decided: `noindex`, sitemap-excluded, deleted in S8.2. |
| **Architect non-blocking** | `readFileSync` audit recorded with both tripwires (V28). S0.4b proves the podcast-test claim (V32) and documents the `episodeNumber === 5/39/38` ordering. `__root.tsx:95-96` og:image capture added as S1.5 (V29). Open questions bundled into one message (S0.8). |

### Rejected, with reasoning

| Finding | Why not applied |
|---|---|
| **A-B2's "~103 call sites"** | Substance accepted in full (the gate was far too narrow); **the number is corrected**. My scan of every `className` string in non-test `src/**` gives **35** call sites for the four AC-4.2 names, **46** including `section-label-{dark,light,rule}`, and **90** including `eyebrow` (V54). "~103" appears to double-count. *(Superseded in iteration 3: the count is now generated into `docs/type-inventory.md` and asserted by the gate, so no figure here is authoritative.)* |
| **C2's Git LFS option** | Rejected as B′3: unvalidated against both Vercel builds and Lovable's sync, and a failed LFS fetch degrades to pointer files — reintroducing precisely the failure class `asset-pipeline` exists to delete. Plain committed originals + a release-asset backup achieve the same durability without that tail risk. |
| **A-B6's manifest-driven check, as stated** | Adopted, but it **could not have worked as written**: the Lovable preset sets no `manifest` option and Vite defaults `build.manifest` to **off** (V30-31), so there is no manifest to read. The plan now enables it explicitly, and handles the 4096 B inline threshold that turns small assets into `data:` URIs with no manifest entry at all. |
| **Treating the 2 failing tests as simply "stale"** | Refined rather than rejected. Evidence (V32) shows a bot **revert** (`e5196a3`) removed the asserted string while the test was left behind — so the repair restates current invariants instead of deleting rows, and the reverting behaviour is now a first-class risk (R2, V33). |
