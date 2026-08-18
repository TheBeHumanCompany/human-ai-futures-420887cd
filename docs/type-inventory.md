# Type inventory (S0.6)

> **Generated. Do not hand-edit.** Regenerate with `bun run scripts/type-inventory.ts`.
> Scanner SHA-256: `641e7fdd57606f57f327a3347072f7e99c3746ba360184b1cf72dc2080b92e42`
> The AC-4.2 gate re-runs the scanner, compares the result against
> `docs/type-inventory.json`, and re-checks the hash above. Editing the scanner
> without regenerating this file fails the gate.

> ### Which tree this describes
> Branch `feat/site-restructure` at `f2fc14ce6531`, working tree **dirty**.
>
> **The 47-site floor is a user decision measured against `main@a6a377a`** (Amendment 2,
> decision 1). Verified: run against that tree this scanner returns `display` 24 ·
> `display-strong` 0 · `archive-question` 4 · `section-label` 8 ·
> `section-label-{dark,light,rule}` 1/6/4 = **47**, with `eyebrow` at 45 — the decision,
> digit for digit.
>
> A live count above 47 does **not** mean the scanner is wrong. It means branch work
> landed after the decision and added call sites of the same utilities. Phase 4 migrates
> whatever the tree actually holds, so **regenerate this file at the start of Phase 4** and
> treat the number it then reports as the floor.

## 1. The binding migration scope

| Scope | Call sites |
|---|---|
| The four AC-4.2 names (`display`, `display-strong`, `archive-question`, `section-label`) | **0** |
| + `section-label-{dark,light,rule}` | **0** ← **the binding scope (AC-4.2b)** |
| + `eyebrow` (**explicitly OUT of scope**, Amendment 2 decision 1) | 68 |
| `@utility` definitions in `src/styles.css` (deleted, not migrated) | 1 |

| Utility | Call sites | Definitions | In scope |
|---|---|---|---|
| `display` | 0 | 0 | yes |
| `display-strong` | 0 | 0 | yes |
| `archive-question` | 0 | 0 | yes |
| `section-label` | 0 | 0 | yes |
| `section-label-dark` | 0 | 0 | yes |
| `section-label-light` | 0 | 0 | yes |
| `section-label-rule` | 0 | 0 | yes |
| `eyebrow` | 68 | 1 | **no** |

Files scanned (non-test `src/**/*.{ts,tsx}`): **121**.
Files carrying at least one type-setting declaration: **50**.

**One file is excluded**, `src/routes/type-specimen.tsx` (exclusion applied).
It is the G1 review instrument and is deleted in S8.2. It necessarily *names* the
utilities it proposes to replace, and under rule 1 those bare names would be
counted as call sites — inflating the very floor it exists to establish. The
exclusion is one hardcoded path, not a pattern.

### The two sites an attribute regex cannot see

These are the reason rule 1 scans string literals rather than `className="…"`.
Both are present in the table below; if either goes missing, the scanner has
regressed to the defective form and the count silently drops by two.

- `src/components/episode-player.tsx:139` — `eyebrow`

## 2. Utility call sites — in scope (0)

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|


## 3. Utility call sites — `eyebrow`, out of scope (68)

Listed for reconciliation only. **Phase 4 does not touch these** (Amendment 2,
decision 1). `eyebrow` is extended in place rather than duplicated (V25).

| Site | Token | Max size | Disposition |
|---|---|---|---|
| `src/components/blueprint.tsx:51` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:68` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:113` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:126` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:144` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:212` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:229` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/blueprint.tsx:359` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/social-section.tsx:110` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/episode-player.tsx:139` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:58` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:83` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:156` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:217` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:255` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-header.tsx:289` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/episode-media-card.tsx:97` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-footer.tsx:63` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-footer.tsx:76` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-footer.tsx:94` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-footer.tsx:111` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/site-footer.tsx:112` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/pillar-page.tsx:48` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/pillar-page.tsx:74` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/pillar-page.tsx:90` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/pillar-page.tsx:97` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/components/featured-episode.tsx:71` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/index.tsx:381` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/index.tsx:454` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/index.tsx:460` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/index.tsx:463` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/why-we-exist.tsx:40` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/why-we-exist.tsx:56` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/why-we-exist.tsx:81` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/why-we-exist.tsx:96` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/why-we-exist.tsx:102` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/be-human-ai/index.tsx:60` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-human-archive.tsx:28` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-human-archive.tsx:55` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast.tsx:166` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast.tsx:208` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast.tsx:217` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast.tsx:287` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-new-human-era.tsx:115` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-new-human-era.tsx:154` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-new-human-era.tsx:245` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/the-new-human-era.tsx:721` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:33` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:43` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:47` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:51` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:71` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:82` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/contact.tsx:93` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:167` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:176` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:203` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:247` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:267` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:334` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/podcast_.$slug.tsx:352` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/who-we-are.tsx:41` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/who-we-are.tsx:66` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/who-we-are.tsx:76` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/who-we-are.tsx:117` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/about.tsx:29` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/about.tsx:45` | `eyebrow` | — | eyebrow (unchanged — out of scope) |
| `src/routes/about.tsx:57` | `eyebrow` | — | eyebrow (unchanged — out of scope) |

## 4. Raw size declarations (167)

Not part of the 47-occurrence utility floor, but migrated alongside it in S4.2 —
these are what a `clamp(`-only scan misses. AC-4.5 bans all of them from
`the-new-human-era.tsx` and `be-human-ai.tsx`.

### 4a. Arbitrary values `text-[…]` (27)

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|
| `src/components/ui/calendar.tsx:79` | `text-[0.8rem]` | 0.800rem | type-body |
| `src/components/ui/calendar.tsx:85` | `text-[0.8rem]` | 0.800rem | type-body |
| `src/components/ui/form.tsx:131` | `text-[0.8rem]` | 0.800rem | type-body |
| `src/components/ui/form.tsx:153` | `text-[0.8rem]` | 0.800rem | type-body |
| `src/components/episode-media-card.tsx:53` | `text-[0.7rem]` | 0.700rem | type-body |
| `src/components/site-footer.tsx:38` | `max-sm:text-[clamp(1.45rem,5.6vw,1.95rem)]` | 1.950rem | type-h3-prose |
| `src/components/featured-episode.tsx:36` | `text-[0.7rem]` | 0.700rem | type-body |
| `src/components/featured-episode.tsx:45` | `text-[0.7rem]` | 0.700rem | type-body |
| `src/components/human-archive-section.tsx:81` | `text-[9.5px]` | 0.594rem | type-body |
| `src/components/human-archive-section.tsx:85` | `text-[9.5px]` | 0.594rem | type-body |
| `src/components/human-archive-section.tsx:93` | `text-[clamp(1.1rem,2.2vw,1.6rem)]` | 1.600rem | type-h4-prose |
| `src/components/human-archive-section.tsx:101` | `text-[clamp(1rem,1.5vw,1.25rem)]` | 1.250rem | type-body |
| `src/components/human-archive-section.tsx:104` | `text-[9.5px]` | 0.594rem | type-body |
| `src/components/human-archive-section.tsx:152` | `lg:text-[17px]` | 1.063rem | type-body |
| `src/components/human-archive-section.tsx:192` | `text-[9.5px]` | 0.594rem | type-body |
| `src/routes/index.tsx:262` | `text-[15px]` | 0.938rem | type-body |
| `src/routes/index.tsx:308` | `text-[11px]` | 0.688rem | type-body |
| `src/routes/index.tsx:333` | `text-[13px]` | 0.813rem | type-body |
| `src/routes/human-archive.$slug.tsx:49` | `text-[9px]` | 0.563rem | type-body |
| `src/routes/human-archive.$slug.tsx:52` | `text-[10px]` | 0.625rem | type-body |
| `src/routes/human-archive.$slug.tsx:62` | `text-[12px]` | 0.750rem | type-body |
| `src/routes/human-archive.$slug.tsx:71` | `text-[0.7rem]` | 0.700rem | type-body |
| `src/routes/human-archive.$slug.tsx:88` | `text-[0.7rem]` | 0.700rem | type-body |
| `src/routes/podcast_.$slug.tsx:171` | `text-[clamp(1.6rem,3.4vw,3.35rem)]` | 3.350rem | type-h2-prose |
| `src/routes/podcast_.$slug.tsx:233` | `text-[1.0625rem]` | 1.063rem | type-body |
| `src/routes/podcast_.$slug.tsx:244` | `text-[clamp(1.4rem,2.2vw,1.75rem)]` | 1.750rem | type-h3-prose |
| `src/routes/podcast_.$slug.tsx:251` | `text-[1.0625rem]` | 1.063rem | type-body |

### 4b. Tailwind named sizes (140)

| Site | Token | Max size | Proposed scale step |
|---|---|---|---|
| `src/components/ui/alert-dialog.tsx:65` | `text-lg` | 1.125rem | type-body |
| `src/components/ui/alert-dialog.tsx:77` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/tabs.tsx:30` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/card.tsx:36` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/input-otp.tsx:42` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/chart.tsx:51` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/chart.tsx:162` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sheet.tsx:93` | `text-lg` | 1.125rem | type-body |
| `src/components/ui/sheet.tsx:105` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/label.tsx:10` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/navigation-menu.tsx:38` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/accordion.tsx:25` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/accordion.tsx:43` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/drawer.tsx:69` | `text-lg` | 1.125rem | type-body |
| `src/components/ui/drawer.tsx:81` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/tooltip.tsx:23` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/alert.tsx:7` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/alert.tsx:45` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/calendar.tsx:61` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/calendar.tsx:72` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/calendar.tsx:73` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/calendar.tsx:168` | `[&>span]:text-xs` | 0.750rem | type-body |
| `src/components/ui/breadcrumb.tsx:20` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/command.tsx:47` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/command.tsx:74` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/command.tsx:86` | `[&_[cmdk-group-heading]]:text-xs` | 0.750rem | type-body |
| `src/components/ui/command.tsx:114` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/command.tsx:126` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/menubar.tsx:49` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:66` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:122` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:138` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:161` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:184` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/menubar.tsx:205` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/dialog.tsx:75` | `text-lg` | 1.125rem | type-body |
| `src/components/ui/dialog.tsx:87` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/badge.tsx:7` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sidebar.tsx:434` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sidebar.tsx:472` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/sidebar.tsx:504` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/sidebar.tsx:513` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/sidebar.tsx:514` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sidebar.tsx:515` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/sidebar.tsx:621` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sidebar.tsx:708` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/sidebar.tsx:709` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/table.tsx:8` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/table.tsx:90` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/button.tsx:8` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/button.tsx:22` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/toggle.tsx:8` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:30` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:85` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:101` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:124` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:147` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/dropdown-menu.tsx:167` | `text-xs` | 0.750rem | type-body |
| `src/components/ui/select.tsx:22` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/select.tsx:101` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/select.tsx:114` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/textarea.tsx:10` | `text-base` | 1.000rem | type-body |
| `src/components/ui/textarea.tsx:10` | `md:text-sm` | 0.875rem | type-body |
| `src/components/ui/input.tsx:11` | `text-base` | 1.000rem | type-body |
| `src/components/ui/input.tsx:11` | `file:text-sm` | 0.875rem | type-body |
| `src/components/ui/input.tsx:11` | `md:text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:28` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:81` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:97` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:120` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:143` | `text-sm` | 0.875rem | type-body |
| `src/components/ui/context-menu.tsx:164` | `text-xs` | 0.750rem | type-body |
| `src/components/episode-media-card.tsx:94` | `text-sm` | 0.875rem | type-body |
| `src/components/episode-media-card.tsx:96` | `text-sm` | 0.875rem | type-body |
| `src/components/site-footer.tsx:59` | `text-2xl` | 1.500rem | type-h4-prose |
| `src/components/podcast-degraded.tsx:24` | `text-sm` | 0.875rem | type-body |
| `src/components/podcast-degraded.tsx:26` | `text-3xl` | 1.875rem | type-h3-prose |
| `src/components/podcast-degraded.tsx:26` | `sm:text-4xl` | 2.250rem | type-h3-prose |
| `src/components/podcast-degraded.tsx:30` | `text-base` | 1.000rem | type-body |
| `src/components/podcast-degraded.tsx:35` | `text-base` | 1.000rem | type-body |
| `src/components/podcast-degraded.tsx:40` | `text-sm` | 0.875rem | type-body |
| `src/components/pillar-page.tsx:79` | `text-xs` | 0.750rem | type-body |
| `src/components/featured-episode.tsx:57` | `text-sm` | 0.875rem | type-body |
| `src/components/featured-episode.tsx:63` | `text-base` | 1.000rem | type-body |
| `src/components/human-archive-section.tsx:152` | `text-base` | 1.000rem | type-body |
| `src/components/human-archive-section.tsx:157` | `text-sm` | 0.875rem | type-body |
| `src/components/human-archive-section.tsx:195` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:100` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:100` | `sm:text-lg` | 1.125rem | type-body |
| `src/routes/index.tsx:185` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:191` | `text-xs` | 0.750rem | type-body |
| `src/routes/index.tsx:191` | `sm:text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:209` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:212` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:223` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:227` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:237` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:240` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:262` | `sm:text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:277` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:328` | `text-xs` | 0.750rem | type-body |
| `src/routes/index.tsx:358` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:396` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:411` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:426` | `text-sm` | 0.875rem | type-body |
| `src/routes/index.tsx:431` | `text-base` | 1.000rem | type-body |
| `src/routes/index.tsx:457` | `text-sm` | 0.875rem | type-body |
| `src/routes/why-we-exist.tsx:50` | `text-3xl` | 1.875rem | type-h3-prose |
| `src/routes/__root.tsx:21` | `text-7xl` | 4.500rem | type-h1-prose |
| `src/routes/__root.tsx:22` | `text-xl` | 1.250rem | type-body |
| `src/routes/__root.tsx:23` | `text-sm` | 0.875rem | type-body |
| `src/routes/__root.tsx:29` | `text-sm` | 0.875rem | type-body |
| `src/routes/__root.tsx:49` | `text-xl` | 1.250rem | type-body |
| `src/routes/__root.tsx:52` | `text-sm` | 0.875rem | type-body |
| `src/routes/__root.tsx:61` | `text-sm` | 0.875rem | type-body |
| `src/routes/__root.tsx:67` | `text-sm` | 0.875rem | type-body |
| `src/routes/human-archive.$slug.tsx:65` | `text-base` | 1.000rem | type-body |
| `src/routes/human-archive.$slug.tsx:65` | `sm:text-lg` | 1.125rem | type-body |
| `src/routes/human-archive.$slug.tsx:71` | `sm:text-xs` | 0.750rem | type-body |
| `src/routes/human-archive.$slug.tsx:88` | `sm:text-xs` | 0.750rem | type-body |
| `src/routes/the-human-archive.tsx:34` | `text-lg` | 1.125rem | type-body |
| `src/routes/podcast.tsx:124` | `text-base` | 1.000rem | type-body |
| `src/routes/podcast.tsx:154` | `text-lg` | 1.125rem | type-body |
| `src/routes/podcast.tsx:160` | `text-lg` | 1.125rem | type-body |
| `src/routes/podcast.tsx:192` | `text-sm` | 0.875rem | type-body |
| `src/routes/podcast.tsx:216` | `text-sm` | 0.875rem | type-body |
| `src/routes/podcast.tsx:223` | `text-sm` | 0.875rem | type-body |
| `src/routes/podcast.tsx:261` | `text-sm` | 0.875rem | type-body |
| `src/routes/contact.tsx:37` | `text-lg` | 1.125rem | type-body |
| `src/routes/contact.tsx:41` | `text-sm` | 0.875rem | type-body |
| `src/routes/podcast_.$slug.tsx:279` | `text-base` | 1.000rem | type-body |
| `src/routes/podcast_.$slug.tsx:288` | `text-sm` | 0.875rem | type-body |
| `src/routes/podcast_.$slug.tsx:335` | `text-xl` | 1.250rem | type-body |
| `src/routes/podcast_.$slug.tsx:335` | `sm:text-2xl` | 1.500rem | type-h4-prose |
| `src/routes/podcast_.$slug.tsx:349` | `text-base` | 1.000rem | type-body |
| `src/routes/who-we-are.tsx:82` | `text-xs` | 0.750rem | type-body |
| `src/routes/about.tsx:33` | `text-lg` | 1.125rem | type-body |
| `src/routes/about.tsx:38` | `text-3xl` | 1.875rem | type-h3-prose |
| `src/routes/about.tsx:47` | `text-base` | 1.000rem | type-body |
| `src/routes/about.tsx:51` | `text-base` | 1.000rem | type-body |

## 5. `@utility` definitions in `src/styles.css` (1)

Rule 4 keeps these in their own category so a definition is never counted as a
call site. They are **deleted** in S4.2, not migrated.

| Site | Token | Disposition |
|---|---|---|
| `src/styles.css:113` | `eyebrow` | deleted (definition, not a call site) |

## 6. The proposed scale — two registers, not one

Maya's mockups use three display voices; only one is reachable today.

| # | Voice | Family / weight | Exemplar | Status on `main` |
|---|---|---|---|---|
| 1 | Condensed **bold uppercase** | Oswald 700 | "THIS IS BIGGER THAN AI." | exists (`display`, `archive-question`) |
| 2 | Condensed **light sentence-case** | Oswald 200/300 | "We are the Bridge Generation." | **unreachable** — `display` hardcodes `text-transform: uppercase` |
| 3 | Wide **light sentence-case, very large** | Work Sans 300 | "But what if your humanity is not the reward at the end of a good life?" | **does not exist** |

So the scale gains an **axis** (`case` × family), not merely more steps:

**The caps steps are fitted to the measured site, not chosen in the abstract.**
Every pre-existing uppercase heading was measured at a 1440px viewport first.
Two results changed the first draft of this scale: the four page heroes
disagreed with each other (8.5 / 6.5 / 6 / 5.5rem) and now share one step at
7rem; and `section-label` had **nowhere to go** — 0.75–1.125rem Oswald 700 at
0.08em tracking fits neither `eyebrow` (0.6875rem Work Sans 500 at 0.22em) nor
`type-h4-caps` (nearly double), so it survives as `type-label-caps`.

| Step | Family | Weight | Case | Size (clamp) | Tracking |
|---|---|---|---|---|---|
| `type-h1-caps` | Oswald | 700 | uppercase | `clamp(2.75rem, 8.5vw, 7rem)` | `0.005em` |
| `type-h2-caps` | Oswald | 700 | uppercase | `clamp(2.25rem, 5.4vw, 4.5rem)` | `0.01em` |
| `type-h3-caps` | Oswald | 700 | uppercase | `clamp(1.5rem, 2.6vw, 2.25rem)` | `0.015em` |
| `type-h4-caps` | Oswald | 700 | uppercase | `clamp(1.0625rem, 1.5vw, 1.375rem)` | `0.02em` |
| `type-label-caps` | Oswald | 700 | uppercase | `clamp(0.8125rem, 1vw, 1rem)` | `0.08em` |
| `type-h1-condensed` | Oswald | 300 | none | `clamp(2.5rem, 6vw, 4.25rem)` | `0.005em` |
| `type-h2-condensed` | Oswald | 300 | none | `clamp(2rem, 4.4vw, 3.25rem)` | `0.005em` |
| `type-h3-condensed` | Oswald | 300 | none | `clamp(1.5rem, 2.8vw, 2.25rem)` | `0.01em` |
| `type-h4-condensed` | Oswald | 300 | none | `clamp(1.25rem, 2vw, 1.625rem)` | `0.01em` |
| `type-h1-prose` | Work Sans | 200 | none | `clamp(2.25rem, 5.6vw, 5rem)` | `0.005em` |
| `type-h2-prose` | Work Sans | 300 | none | `clamp(2rem, 4.4vw, 3.5rem)` | `0.005em` |
| `type-h3-prose` | Work Sans | 300 | none | `clamp(1.5rem, 2.6vw, 2.25rem)` | `0.005em` |
| `type-h4-prose` | Work Sans | 300 | none | `clamp(1.25rem, 1.8vw, 1.5rem)` | `0.005em` |
| `type-body-lg` | Work Sans | 400 | none | `clamp(1.0625rem, 1.2vw, 1.25rem)` | `0` |
| `type-body` | Work Sans | 400 | none | `1rem` | `0` |
| `type-body-sm` | Work Sans | 400 | none | `0.875rem` | `0` |

**Font cost is zero.** Work Sans 300 is already loaded (`__root.tsx:104`) and
Oswald 200/300 are already requested; voice 2 needs only a utility that omits
`text-transform`, and voice 3 needs no new file at all.

**`eyebrow` + lime rule survives as a role** (V39): every mockup section opens
with a letterspaced uppercase eyebrow above a ~4rem lime rule. The four old
utility *names* are deleted; that *role* is preserved.

## 7. Mapping rules used above

The "proposed scale step" column is computed, not hand-assigned:

- **Register** — every existing in-scope utility hardcodes `text-transform:
  uppercase`, so all of their call sites map to `-caps`. The `-prose`
  register is new surface with no legacy call sites.
- **Level** — from the token's largest resolvable size (a `clamp()`'s third
  argument; `vw` resolved at a 1440px reference viewport):
  ≥4rem → h1 · ≥2.75rem → h2 · ≥1.75rem → h3 · else h4, and <1.375rem prose → body.
- **Unsized utility tokens** carry no size of their own; their level is set by
  the sibling size token on the same element and is resolved at migration time.
