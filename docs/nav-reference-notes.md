# Nav model — provenance note

**Date:** 2026-08-18
**Author:** worker-3, Phase 3 (`site-chrome` + `nav-ia`)
**Files covered:** `src/lib/nav.ts`, `src/components/site-header.tsx`

## Why this note exists

`feat/podbean-rss-integration` is reference-only. It is never merged, rebased, or
cherry-picked, and no code is copied from it. That constraint is checked two ways:
`git cherry` for patch-equivalent commits, and a source-similarity check for
identical runs of five or more lines between our nav files and the reference blobs.

Neither check is sufficient on its own. `git cherry` compares *commits*, so it is
blind to code that was hand-written to look the same. The similarity check is
better, but it measures the artifact rather than the process — it cannot
distinguish "written independently" from "written from memory after reading."

The plan's answer was an ordering rule: write `nav.ts` from the specification
first, then read the reference, and record the reading here as a dated note about
what was *learned* rather than what was copied.

## What actually happened

**The reference was never read at all.**

I did not open `src/lib/nav.ts` or `src/components/site-header.tsx` from
`feat/podbean-rss-integration`, at any point, in any form — not via `git show`,
not via the staging deployment's source, not indirectly. `src/lib/nav.ts` was
written from one source: the binding nav tree stated in the spec, which states it
completely.

```
ABOUT ⌄ (Why We Exist · Who We Are) | THE NEW HUMAN ERA | THE HUMAN ARCHIVE
| PODCAST | CONTACT | [BLUEPRINT ⌄ pill] (Human Readiness ·
Governance & Sovereignty · AI Strategy)
```

That is a stronger position than the ordering rule asks for, and it is the reason
this note has no "what was learned from the reference" section. There is nothing
to disclose because there was no reading to disclose.

What I *did* read was the consensus plan's **description** of the reference — its
verification table records that the reference used separate routes rather than
anchors for the pillars, that it had a typed nav model, and that a dropdown
trigger is a button that opens a panel instead of navigating. Those are findings
about the problem, written by the planner in prose. They are not the reference's
source, and each was independently re-derived or re-verified here:

- **Routes over anchors** was decided on its own merits, recorded in the plan's
  decision table. The deciding argument is that moving pillar depth off the
  Blueprint page is simultaneously the fix for "the destinations must exist" and
  for "the page is information overload" — the two criteria point the same way.
- **The split-control behaviour** was re-verified directly against
  `@radix-ui/react-dropdown-menu`, not taken on description.
- **The typed model** is a shape this codebase would reach for anyway; every
  other cross-cutting list here (`SURFACES`, `TEAM`, `SOCIAL_LINKS`) is typed data
  in `src/lib/`.

Note also that the plan records the reference's nav *tree* as **different** from
the binding one: the reference had a "Why We Exist" parent with five children.
Ours has About with two. Converging on the reference's tree would have been a
defect, not a shortcut.

## Design decisions taken here, and why

These are recorded because they depart from the plan's letter, and a future reader
should find the reasoning rather than re-derive it.

### Radix `NavigationMenu` is not used

The plan specified `NavigationMenu` for the desktop bar. It cannot be used.
`NavigationMenuPrimitive.Root` renders its own `<nav>` element, so nesting it
inside the header's `<nav>` puts two navigation landmarks on every page and fails
the single-nav criterion site-wide. This is a property of the library, verified in
`node_modules/@radix-ui/react-navigation-menu/dist/index.mjs`, not a preference.

`DropdownMenu` renders a button plus a portalled panel and contributes no landmark
of its own, so the header owns exactly one `<nav>` whether the menu is open or
closed. `Collapsible` handles the mobile disclosures. Both were already vendored;
no dependency was added.

### The mobile drawer lives inside the same `<nav>`

Previously it was a second `<nav>` rendered only while the menu was open. That
shape passes every page-load check and is wrong the instant a user taps the
hamburger — a gate that greens on the untouched state and fails on the used state.
One `<nav>` wraps both the desktop bar and the drawer.

### The item type is a discriminated union, not a struct with a flag

A dropdown trigger is a `<button>`: it opens a panel, it does not navigate. A
parent that is *also* a real page therefore needs a second control, or its own
page becomes unreachable from the bar — and nothing about the markup looks wrong
when that happens. That is the trap.

Rather than document it as a convention, `NavItem` is
`NavigatingItem | DisclosureItem`: a navigating item carries `to`, and a
disclosure item is *required* to carry children. An inert label — an item that
neither navigates nor discloses — is unrepresentable, and `to` is present exactly
when `triggerNavigates` is true, so the header gets the destination narrowed by
branching on the flag. The header and its tests branch on the flag, never on a
label, so a third parent added later gets correct behaviour by declaring intent
rather than by being added to a list of exceptions.

Both current parents navigate. `/about` stays live and unredirected, and nothing
else in the tree points at it, so About links to it rather than being a pure menu
label. `TriggerOnlyItem` is therefore unreached in production — it is kept, and
exercised against a synthetic item in `nav.test.ts`, because it is the other half
of a deliberate switch: if `/about` is later folded into `/why-we-exist` behind a
redirect, dropping `to` and flipping the flag is the entire nav change.

### The pill is data-driven and asserted as a count

Only Blueprint carries `cta`, so only Blueprint gets the lime pill; About renders
as a text item with a chevron. This matters because the criterion is *visual
distinctness*. If both split controls had inherited the pill treatment, a check
that "the Blueprint pill is lime" would still pass while the property it exists to
protect had been destroyed. The test asserts exactly one pill among the six items.

## A trap worth knowing about

A text-level rule asserts that superseded wordings of the Indigenous line appear
nowhere in non-test source. It scans **comments as well as code**, and it caught
my own explanatory comments quoting the old strings while documenting why they
were replaced.

That is the rule working correctly, not a false positive — a superseded string
sitting in a comment is exactly how it gets copied back into a page later. The fix
is to *describe* the old wording rather than quote it. Anyone documenting retired
copy in this tree will hit the same thing.
