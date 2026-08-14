import { describe, expect, it } from "bun:test";

import { PILLARS, POSITIONING_GUARDRAIL, SPINE, pillarBySlug, pillarControlCount } from "./pillars";

/**
 * These pages make checkable claims about someone else's source of truth.
 *
 * The domain names and counts here are transcribed from the audit framework's
 * `framework/controls.yaml` in the sibling repo, which this project cannot
 * import — different language, different repo, no build-time link. That makes
 * the numbers a hand-carried copy, and a hand-carried copy drifts silently.
 *
 * These tests do not prove the transcription matches the spine today; nothing
 * inside this repo can. What they prove is that the numbers are internally
 * consistent and that the total is the one the pages print, so a careless edit
 * to one domain cannot quietly leave the pages claiming 72 while summing to 71.
 */
describe("pillar → control domain mapping", () => {
  it("sums to the 72 controls the pages claim", () => {
    const total = PILLARS.reduce((sum, pillar) => sum + pillarControlCount(pillar), 0);
    expect(total).toBe(SPINE.controls);
    expect(total).toBe(72);
  });

  it("covers all 8 domains exactly once", () => {
    const names = PILLARS.flatMap((pillar) => pillar.domains.map((domain) => domain.name));
    expect(names).toHaveLength(SPINE.domains);
    expect(new Set(names).size).toBe(SPINE.domains);
  });

  it("assigns the documented per-pillar counts", () => {
    expect(pillarControlCount(pillarBySlug("human-readiness"))).toBe(7);
    expect(pillarControlCount(pillarBySlug("governance"))).toBe(56);
    expect(pillarControlCount(pillarBySlug("ai-strategy"))).toBe(9);
  });

  it("has no empty or non-positive domain counts", () => {
    for (const pillar of PILLARS) {
      expect(pillar.domains.length).toBeGreaterThan(0);
      for (const domain of pillar.domains) {
        expect(domain.controls).toBeGreaterThan(0);
        expect(Number.isInteger(domain.controls)).toBe(true);
      }
    }
  });
});

describe("positioning guardrail", () => {
  /**
   * The framework's methodology treats these two claims as non-negotiable, and
   * the failure mode is a sales page implying regulatory standing the work does
   * not confer. Pinning the substance — not the exact sentence — means the copy
   * can be reworded without the guarantee quietly disappearing.
   */
  it("denies both a compliance guarantee and certification status", () => {
    expect(POSITIONING_GUARDRAIL).toContain("not a compliance guarantee");
    expect(POSITIONING_GUARDRAIL).toContain("not a certification");
  });
});

describe("pillar routing", () => {
  it("exposes exactly the three slugs the routes are built on", () => {
    expect(PILLARS.map((pillar) => pillar.slug)).toEqual([
      "human-readiness",
      "governance",
      "ai-strategy",
    ]);
  });

  it("throws on an unknown slug rather than returning undefined", () => {
    // @ts-expect-error — deliberately outside the union, to pin the runtime guard
    expect(() => pillarBySlug("does-not-exist")).toThrow();
  });
});
