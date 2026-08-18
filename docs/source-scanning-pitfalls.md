# Scanning source text: six ways to get it wrong

Several gates in this repo work by reading source files as text and counting
things — utility call sites, banned tokens, forbidden imports. Every pitfall
below is a real defect that shipped into one of those gates during the
typography consolidation, was caught, and cost a round trip.

They share one shape: **the scan disagreed with reality, and stayed green while
doing it.** A scan that reports zero is indistinguishable from a scan that found
nothing, so these failures are quiet by construction.

> **The general rule.** Prefer a real parser. `scripts/type-inventory.ts` walks
> the TypeScript AST and takes string-literal nodes, which makes pitfalls 1–3
> structurally impossible. Reach for a regex only when a parser genuinely does
> not fit, and then read this list first.

---

## 1. Substring matching

`grep -n "display" src` returns **several hundred** hits in this repo. **None**
of them is the `display` utility. They are:

| What matched    | Where                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `displayName`   | the Radix/shadcn convention, ~40 files under `src/components/ui/`                                 |
| `displayTitle`  | a helper in `episode-media-card.tsx`, `featured-episode.tsx`, `podcast_.$slug.tsx`                |
| `font-display`  | a Tailwind **font-family** utility from the `--font-display` token — a different utility entirely |
| `display: flex` | literal CSS in `src/lib/error-page.ts`                                                            |
| prose           | "for display only", "…displayed nothing"                                                          |

**Fix.** Tokenize, then compare with `===`. Never `String.includes`, never an
unanchored regex. A hyphen is a word boundary, so even `\bdisplay\b` matches
`font-display`.

**Symptom if you get it wrong:** a migration that is complete reads as 12 or 200
outstanding call sites, and somebody reverts working code to "fix" it.

## 2. Comments

A doc comment containing a utility name in backticks —

```ts
/* `display` is Oswald 200 and this line carries no weight override. */
```

— is a **template literal** as far as a regex is concerned. A file that had been
fully migrated still reported call sites, purely because it explained itself.

**Fix.** Strip comments before extracting string spans:

```ts
const text = readFileSync(file, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
```

The `[^:]` guard keeps `https://` intact. An AST scanner never sees comments at
all, which is the better answer.

## 3. Tokenizing the raw file instead of the string contents

Splitting the whole file on whitespace leaves the attribute glued to its first
class:

```
className="display   →   className="display     (not `display`)
```

So **the first class of every attribute goes uncounted**, and a file that
plainly uses the utility reports **zero**.

**Fix.** Extract quoted spans first, then split _their contents_:

```ts
const spans = text.match(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g) ?? [];
for (const span of spans) for (const cls of span.slice(1, -1).split(/\s+/)) …
```

## 4. Only looking at `className=`

An attribute-scoped regex structurally cannot see two real call sites in this
repo:

- `src/routes/podcast_.$slug.tsx` — `const SECTION_HEADING = "type-label-caps …"`,
  a bare string constant with no `className=` anywhere near it
- `src/components/episode-player.tsx` — `className={cn("eyebrow …")}`, a helper
  argument

This is why AC-4.2b pins the scanner to **string literals wherever they appear**,
not to attributes. It is the difference between counting 45 and 47.

## 5. Stripping variant prefixes at the wrong colon

Tailwind variants are `prefix:class`, so "take everything after the last colon"
looks right — until the class has a colon _inside_ its arbitrary value:

```
[mask-image:linear-gradient(…)]   [--cell-size:2rem]   sm:[mask-image:none]
```

Ten tokens in this repo hit this. Splitting at the last colon truncates them
mid-value.

**Fix.** Track bracket depth and split only at a **top-level** colon.
`scripts/type-inventory.ts` also asserts that both readings classify identically
and **exits non-zero** if they ever diverge — turning an assumption into a proof.

## 6. Treating `max-*` variants as ordinary variants

`max-sm:` means _below_ the breakpoint. A scan resolving the **desktop** value
must **skip** those classes, not strip the prefix and apply them.

Stripping made `max-sm:text-[clamp(1.45rem,5.6vw,1.95rem)]` look unconditional,
so the footer strapline resolved to 1.95rem instead of its actual 2.25rem — and
the sweep invented a 41% jump that never existed.

**Fix.** `if (/(^|:)max-[a-z0-9]+:/.test(token)) continue;`

---

## Why two implementations, deliberately

`src/lib/type-scale.test.ts` re-implements call-site counting instead of
importing `scripts/type-inventory.ts`. That duplication is intentional: **if the
test imports the scanner, a defect in the scanner makes the test agree with it**,
and the derived floor stops being falsifiable — the gate greens on whatever the
scanner happens to believe.

Pitfalls 2 and 6 above were both caught by the two implementations disagreeing.
Neither would have surfaced from a single source of truth.

## Non-vacuity floors

Every "this token appears nowhere" assertion needs a companion that proves the
counter can find something:

```ts
expect(callSites(indexTsx, "type-label-caps")).toBeGreaterThanOrEqual(1);
```

Without it, a broken counter that always returns `0` makes every ban pass.

## What a text scan can never tell you

It sees class names, not rendered pages. It cannot see reflow, wrapping,
overflow or collision — and a correct class list still wraps a 36-character line
onto two rows in a band sized for one. `scripts/verify/type-diff.ts` resolves
computed typography from both trees and says this limitation in its own output;
`e2e/` is where the rest has to be proven.
