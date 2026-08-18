# Branch status — `feat/site-restructure`

**This branch inherits two failing tests and 33 eslint errors from `main@a6a377a`, deliberately.**

If you have opened this branch — in Lovable's editor, in CI, or locally — and found it red,
this file is the answer. The red is pinned, recorded and gated. It is not rot, and it is not
something anyone forgot.

---

## Why the branch is knowingly non-green

`AGENTS.md:8-9` asks that the connected branch be kept "in a working state", because commits
pushed here sync back to Lovable and show up in the editor. That instruction and the pinned
baseline pull in opposite directions, so the tension is resolved explicitly rather than left
implicit:

**"Working state" is read here as _no new breakage_, and that reading is enforced mechanically.**

The alternative — running a tree-wide `eslint --fix` at branch time — was considered and
rejected. It creates a whitespace diff across bot-authored files and holds it open for the
branch's entire life, against a bot that reverts. That maximises exactly the merge-conflict
surface this branch has to minimise. The formatting sweep therefore lands in **Phase 7, last**,
after final integration, where it cannot collide with anything.

---

## What is pinned

### Two failing tests

Both live in `src/routes/podcast.test.ts` and both are **stale source strings**, not broken
behaviour. Each greps `podcast.tsx` for a literal that a later bot commit renamed:

| Test | Asserts | Reality |
|---|---|---|
| `podcast.test.ts:54` — "the card is keyed on slug.current, never on the dropped guid" | `ROUTE` contains `key={row.source.slug.current}` | `podcast.tsx:240` says `key={episode.slug.current}` |
| `podcast.test.ts:155` — "a page size is declared and the grid is sliced by it" | `ROUTE` contains `visible.slice(1, 1 + shown)` | `podcast.tsx:102` says `gridEpisodes.slice(0, shown)` after mobile pagination landed. (`const PAGE_SIZE = 9;`, the first half of the same test, still matches.) |

The invariants these tests were written to protect — cards keyed on `slug.current` and never on
the dropped guid; a declared page size that the grid is sliced by — **both still hold in the
source**. Only the literals are stale. They are repaired in Phase 7 by restating the current
invariants, not by deleting the rows.

> **On provenance:** an earlier draft of the plan named `e5196a3` as the commit that removed the
> assertion string. That claim was **retracted** — it is false, and it was produced by a shell
> quoting bug (`^` expansion in an unquoted zsh `for` list) that returned a confident wrong
> number. Neither side of `e5196a3` contains the string. What is true and checkable:
> `3e03c8a` **introduced** `visible.slice(1, 1 + shown)`, and some later bot commit removed it
> before `6e3856f`. Which one is archaeology with no bearing on the repair. The range is
> recorded; no culprit is named.

Also worth knowing before someone "tidies" it: `podcast.tsx:84-96` carries an **undocumented
editorial ordering** (`episodeNumber === 5 / 39 / 38`). It is intentional.

### 33 eslint errors

Across 10 files. All `prettier/prettier` except one `no-misleading-character-class`
(`src/lib/podcast/show-notes.ts`) and one `react-refresh/only-export-components`
(`src/components/episode-media-card.tsx`).

---

## How the red is prevented from spreading

`scripts/verify/delta.sh` compares the current tree against `.baseline/` and **exits non-zero on
any regression**. It also runs as a pre-push hook — install it with
`bash scripts/verify/install-hooks.sh` — so the branch provably never regresses past the
baseline rather than merely being asserted not to.

The baseline records failing tests by **assertion identity** — `{file, suite, name, assertions[]}`
— not by test name. That is not fussiness. Both inherited failures are stale source strings, so
a later edit could keep a test's name, change the literal it asserts, and fail for an entirely
new reason. A name-keyed gate would wave that through as "still the known failure". Same name,
different assertions ⇒ reported as new.

```bash
bash scripts/verify/delta.sh                        # no new eslint error, no new test failure
bun run scripts/verify/baseline.ts --pin            # re-pin, only for a reviewed reason
```

## Baseline files

| File | Contents |
|---|---|
| `.baseline/eslint.json` | 33 errors as `(file, rule) -> count` fingerprints, repo-relative |
| `.baseline/failing-tests.json` | the two failures, by assertion identity, each with its cause |
| `.baseline/asset-recovery-report.json` | per-asset recovery status for all 46 originals |

---

## Expected to be red until their phase lands

Some gates in `scripts/verify/` read fixtures that later phases create, and **fail loudly rather
than skipping** when those fixtures are absent. That is deliberate: a gate that silently skips
is indistinguishable from a gate that passed.

| Gate | Blocked on | Phase |
|---|---|---|
| `social-links.sh` | `src/lib/brand.ts` | 3 |
| `g1.sh` | `.approvals/typography.json` | 4 |
| `restore-drill.sh` | the GitHub release asset | 0, after the push |
| `ac-suite.sh --release` | every live AC having a proof | 8 |

`bash scripts/verify/ac-suite.sh` without `--release` reports these as `PEND` and keeps going.
With `--release`, a criterion with no proof is a **failure** — because "nobody wrote this check"
and "this check passed" must never look the same.
