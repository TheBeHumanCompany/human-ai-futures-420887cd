import { describe, expect, test } from "bun:test";

import { mobileNavChildren } from "@/lib/nav";

import { NAV } from "./site-header";

/**
 * The navigation shape, asserted at the data level.
 *
 * This repo has no component-test infrastructure — all test files are `.test.ts`
 * and nothing renders a component — so this suite cannot tell you the dropdown
 * opens or that the panel is positioned correctly. What it CAN do is pin the
 * properties of `NAV` that the two renders depend on, and one of those
 * properties is the reason an earlier design was rejected: a child whose label
 * repeats its parent's prints the same words twice in the mobile menu.
 *
 * Every rule below filters over `children`, and a filter over an empty set
 * passes while asserting nothing. The floor comes first for that reason.
 */

type NavEntry = (typeof NAV)[number];
type WithChildren = Extract<NavEntry, { children: readonly unknown[] }>;

const withChildren = NAV.filter((item): item is WithChildren => "children" in item);

/** Every destination NAV knows about, children included. */
const TOP_LEVEL_ROUTES = new Set<string>(NAV.map((item) => item.to));

describe("non-vacuity floor", () => {
  test("at least one nav item actually has children", () => {
    // Without this, every assertion below is a filter over an empty list and
    // the suite reads as coverage while proving nothing.
    expect(withChildren.length).toBeGreaterThan(0);
  });

  test("the parent that has children has more than one", () => {
    for (const item of withChildren) {
      expect(item.children.length).toBeGreaterThan(1);
    }
  });
});

describe("no child repeats its parent", () => {
  /**
   * Unconditional, with no `self` carve-out.
   *
   * An earlier revision exempted the `self` entry from this rule, which is
   * precisely how the duplication got in: the exemption existed to accommodate
   * the defect rather than to describe a legitimate case. With `self` labelled
   * distinctly ("Overview") and filtered out of the mobile render, the rule
   * needs no exception — and a rule with no exceptions cannot rot into one.
   */
  test("no child label equals its parent's label", () => {
    for (const item of withChildren) {
      for (const child of item.children) {
        expect(child.label).not.toBe(item.label);
      }
    }
  });
});

describe("the self child", () => {
  /**
   * `self` marks the child that repeats the parent's own destination. It exists
   * only because the desktop trigger is a <button> that opens the menu instead
   * of navigating, so without it the desktop bar has no route to the parent
   * page at all.
   */
  test("there is exactly one per children array, not at most one", () => {
    // "At most one" would pass an array with none, which leaves the desktop
    // dropdown with no way to reach the parent page — the affordance `self`
    // exists to restore.
    for (const item of withChildren) {
      const selves = item.children.filter((child) => child.self);
      expect(selves).toHaveLength(1);
    }
  });

  test("it is first, so the parent's own page opens the panel", () => {
    for (const item of withChildren) {
      expect(item.children[0].self).toBe(true);
    }
  });

  test("it carries its parent's destination", () => {
    for (const item of withChildren) {
      for (const child of item.children) {
        if (!child.self) continue;
        expect(child.to).toBe(item.to);
      }
    }
  });

  test("the mobile menu renders it nowhere", () => {
    /**
     * Asserted through `mobileNavChildren`, the function the mobile block
     * actually calls — NOT by re-creating the filter here.
     *
     * An earlier version of this test wrote `children.filter((c) => !("self"
     * in c))` itself and asserted against that. It would have stayed green
     * while production stopped filtering entirely, which makes it a statement
     * about the test rather than about the menu. R17 is the one defect that
     * already survived a full review round, so its guard has to be bound to
     * the shipped code.
     */
    for (const item of withChildren) {
      const mobile = mobileNavChildren(item.children);

      expect(mobile).toHaveLength(item.children.length - 1);
      for (const child of mobile) {
        expect(child.self).toBeUndefined();
        expect(child.to).not.toBe(item.to);
        expect(child.label).not.toBe(item.label);
      }
    }
  });
});

describe("children point at routes NAV already knows", () => {
  test("every child destination is also a top-level NAV entry", () => {
    // A floor rather than a guarantee — `to` is typed against the generated
    // router union, so a nonexistent route fails the build long before this.
    // What this adds is that the dropdown cannot reach somewhere the footer
    // does not list, which is how a page becomes reachable from one surface
    // and invisible on the other.
    for (const item of withChildren) {
      for (const child of item.children) {
        expect(TOP_LEVEL_ROUTES.has(child.to)).toBe(true);
      }
    }
  });

  test("child destinations are unique within their parent", () => {
    for (const item of withChildren) {
      const tos = item.children.map((child) => `${child.to}${child.hash ?? ""}`);
      expect(new Set(tos).size).toBe(tos.length);
    }
  });
});
