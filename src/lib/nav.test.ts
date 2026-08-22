import { describe, expect, test } from "bun:test";

import { NAV, hasChildren, mobileNavChildren, navDestinations, type NavItem } from "./nav";

/**
 * The nav tree, pinned by deep equality rather than by shape.
 *
 * This tree is a user decision that was reversed once already: an earlier
 * round flattened it on the premise that About would be a dropdown with a
 * single child, which turned out to be false. What ships now is the corrected
 * structure, and the thing worth protecting is not "there are six items" but
 * "these six items, these labels, this order, these children" — every drift
 * that matters here is invisible to a count.
 */
const BINDING_TREE: NavItem[] = [
  {
    label: "About",
    to: "/about",
    triggerNavigates: true,
    children: [
      { to: "/why-we-exist", label: "Why We Exist" },
      { to: "/who-we-are", label: "Who We Are" },
    ],
  },
  { label: "The New Human Era", to: "/the-new-human-era", triggerNavigates: true },
  { label: "The Human Archive", to: "/the-human-archive", triggerNavigates: true },
  { label: "Podcast", to: "/podcast", triggerNavigates: true },
  { label: "Contact", to: "/contact", triggerNavigates: true },
  {
    label: "Blueprint",
    to: "/be-human-ai",
    triggerNavigates: true,
    cta: true,
    children: [
      { to: "/be-human-ai/human-readiness", label: "Human Readiness" },
      { to: "/be-human-ai/governance", label: "Governance & Sovereignty" },
      // Renamed with the 2026-08-22 rebrand. The ROUTE is deliberately still
      // /be-human-ai/ai-strategy: changing it needs redirects, and a rename that
      // silently 404s every existing link to this pillar is a worse outcome than
      // a path that no longer matches its label.
      { to: "/be-human-ai/ai-strategy", label: "Intelligence Strategy" },
    ],
  },
];

describe("the binding nav tree", () => {
  test("NAV equals it exactly", () => {
    expect(NAV).toEqual(BINDING_TREE);
  });

  test("six top-level items, in order", () => {
    expect(NAV.map((item) => item.label)).toEqual([
      "About",
      "The New Human Era",
      "The Human Archive",
      "Podcast",
      "Contact",
      "Blueprint",
    ]);
  });

  test("exactly two items have children", () => {
    const parents = NAV.filter(hasChildren);
    expect(parents.map((item) => item.label)).toEqual(["About", "Blueprint"]);
  });

  test("exactly one item is the pill", () => {
    // AC-3.7a asserts the Blueprint pill is *visually distinct*, which means
    // exactly one item carries the treatment. Every item being a pill passes a
    // "the pill is lime" check and fails the thing it was checking for.
    const pills = NAV.filter((item) => item.cta);
    expect(pills.map((item) => item.label)).toEqual(["Blueprint"]);
  });
});

describe("the split-control invariant", () => {
  /**
   * A Radix dropdown trigger is a `<button>` that opens a panel — it does not
   * navigate. So a parent that is also a page needs a second control, or its
   * own page becomes unreachable from the bar. `triggerNavigates` is what the
   * header branches on, and this is what keeps the flag honest.
   */
  test("triggerNavigates is set if and only if the item has a destination", () => {
    for (const item of NAV) {
      expect({ label: item.label, navigates: item.triggerNavigates }).toEqual({
        label: item.label,
        navigates: item.to !== undefined,
      });
    }
  });

  test("About links to /about, so the page is not orphaned from navigation", () => {
    // `/about` stays live and unredirected. Nothing else in the tree points at
    // it — Why We Exist and Who We Are are separate pages — so if the About
    // parent were a pure menu label, a live page would be reachable only by
    // typing its URL.
    const about = NAV.find((item) => item.label === "About");

    expect(about?.to).toBe("/about");
    expect(about?.triggerNavigates).toBe(true);
    expect(about?.children?.length).toBe(2);
  });

  test("Blueprint is a page AND a parent, so it is the split control", () => {
    const blueprint = NAV.find((item) => item.label === "Blueprint");

    expect(blueprint?.to).toBe("/be-human-ai");
    expect(blueprint?.triggerNavigates).toBe(true);
    expect(blueprint?.children?.length).toBe(3);
  });

  test("the non-navigating shape is still reachable by changing one field", () => {
    // Nothing in the tree sets `triggerNavigates: false` today, so the pure
    // menu label would rot unnoticed. It is kept deliberately: folding
    // `/about` into `/why-we-exist` behind a redirect later is meant to be a
    // redirect plus this one field, not a rebuild. Exercised here so it cannot
    // quietly stop compiling.
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
  /**
   * On mobile the row IS the toggle — there is no pill beside a chevron. A
   * navigating parent whose own destination were not listed would be a page
   * with no route to it on a phone, which is where most of the traffic is.
   */
  test("a navigating parent leads its own sub-list", () => {
    const blueprint = NAV.find((item) => item.label === "Blueprint")!;
    const children = mobileNavChildren(blueprint);

    expect(children[0]).toEqual({ to: "/be-human-ai", label: "Blueprint" });
    expect(children).toHaveLength(4);
  });

  test("About leads its own sub-list too, since it is also a page", () => {
    const about = NAV.find((item) => item.label === "About")!;

    expect(mobileNavChildren(about)).toEqual([
      { to: "/about", label: "About" },
      { to: "/why-we-exist", label: "Why We Exist" },
      { to: "/who-we-are", label: "Who We Are" },
    ]);
  });

  test("the rule is derived from the flag, not from the label", () => {
    // The behaviour above must hold for a parent nobody has written yet. If
    // this were special-cased by name, a third parent added later would
    // silently get the wrong shape.
    const invented: NavItem = {
      label: "Invented",
      to: "/contact",
      triggerNavigates: true,
      children: [{ to: "/podcast", label: "Child" }],
    };

    expect(mobileNavChildren(invented)[0]).toEqual({ to: "/contact", label: "Invented" });
  });
});

describe("navDestinations", () => {
  test("flattens parents and children without losing or duplicating either", () => {
    const destinations = navDestinations();

    // 4 flat items + About + Blueprint + 2 About children + 3 pillars.
    expect(destinations).toHaveLength(11);
    expect(new Set(destinations.map((d) => d.to)).size).toBe(destinations.length);
    expect(destinations.map((d) => d.to)).toContain("/who-we-are");
    expect(destinations.map((d) => d.to)).toContain("/be-human-ai/governance");
  });

  test("both parents appear ahead of their own children", () => {
    // Document order, so the footer's Navigate column reads as the nav does
    // rather than as an arbitrary flattening.
    const order = navDestinations().map((d) => d.to);

    expect(order.indexOf("/about")).toBeLessThan(order.indexOf("/why-we-exist"));
    expect(order.indexOf("/be-human-ai")).toBeLessThan(
      order.indexOf("/be-human-ai/human-readiness"),
    );
  });
});
