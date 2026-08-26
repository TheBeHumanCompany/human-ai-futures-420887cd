import { describe, expect, test } from "bun:test";

import { NAV, hasChildren, mobileNavChildren, navDestinations, type NavItem } from "./nav";

/**
 * The nav tree, pinned by deep equality rather than by shape.
 *
 * 2026-08-26: the About dropdown was removed. Why We Exist and Who We Are are
 * now top-level items, so the bar is flat — seven navigating items, the last
 * of which is the Blueprint pill.
 */
const BINDING_TREE: NavItem[] = [
  { label: "Why We Exist", to: "/why-we-exist", triggerNavigates: true },
  { label: "Who We Are", to: "/who-we-are", triggerNavigates: true },
  { label: "The New Human Era", to: "/the-new-human-era", triggerNavigates: true },
  { label: "The Human Archive", to: "/the-human-archive", triggerNavigates: true },
  { label: "Podcast", to: "/podcast", triggerNavigates: true },
  { label: "Contact", to: "/contact", triggerNavigates: true },
  {
    label: "Blueprint",
    to: "/be-human-ai",
    triggerNavigates: true,
    cta: true,
  },
];

describe("the binding nav tree", () => {
  test("NAV equals it exactly", () => {
    expect(NAV).toEqual(BINDING_TREE);
  });

  test("seven top-level items, in order", () => {
    expect(NAV.map((item) => item.label)).toEqual([
      "Why We Exist",
      "Who We Are",
      "The New Human Era",
      "The Human Archive",
      "Podcast",
      "Contact",
      "Blueprint",
    ]);
  });

  test("no item has children — the bar is flat", () => {
    expect(NAV.filter(hasChildren)).toEqual([]);
  });

  test("exactly one item is the pill", () => {
    const pills = NAV.filter((item) => item.cta);
    expect(pills.map((item) => item.label)).toEqual(["Blueprint"]);
  });
});

describe("the split-control invariant", () => {
  test("triggerNavigates is set if and only if the item has a destination", () => {
    for (const item of NAV) {
      expect({ label: item.label, navigates: item.triggerNavigates }).toEqual({
        label: item.label,
        navigates: item.to !== undefined,
      });
    }
  });

  test("Blueprint is one page and links straight to it, with no dropdown", () => {
    const blueprint = NAV.find((item) => item.label === "Blueprint");

    expect(blueprint?.to).toBe("/be-human-ai");
    expect(blueprint?.triggerNavigates).toBe(true);
    expect(blueprint?.children).toBeUndefined();
  });

  test("the non-navigating shape is still reachable by changing one field", () => {
    const label: NavItem = {
      label: "Pure label",
      triggerNavigates: false,
      children: [{ to: "/why-we-exist", label: "Why We Exist" }],
    };

    expect(label.to).toBeUndefined();
    expect(mobileNavChildren(label)).toEqual([{ to: "/why-we-exist", label: "Why We Exist" }]);
  });
});

describe("mobileNavChildren", () => {
  test("the rule is derived from the flag, not from the label", () => {
    const invented: NavItem = {
      label: "Invented",
      to: "/contact",
      triggerNavigates: true,
      children: [{ to: "/podcast", label: "Child" }],
    };

    expect(mobileNavChildren(invented)[0]).toEqual({ to: "/contact", label: "Invented" });
  });

  test("a flat item lists only itself", () => {
    const podcast = NAV.find((item) => item.label === "Podcast")!;
    expect(mobileNavChildren(podcast)).toEqual([{ to: "/podcast", label: "Podcast" }]);
  });
});

describe("navDestinations", () => {
  test("flattens without losing or duplicating anything", () => {
    const destinations = navDestinations();

    expect(destinations).toHaveLength(7);
    expect(new Set(destinations.map((d) => d.to)).size).toBe(destinations.length);
    expect(destinations.map((d) => d.to)).toContain("/who-we-are");
    expect(destinations.map((d) => d.to)).toContain("/be-human-ai");
  });

  test("order follows the bar", () => {
    const order = navDestinations().map((d) => d.to);

    expect(order.indexOf("/why-we-exist")).toBeLessThan(order.indexOf("/who-we-are"));
    expect(order.indexOf("/who-we-are")).toBeLessThan(order.indexOf("/be-human-ai"));
  });
});
