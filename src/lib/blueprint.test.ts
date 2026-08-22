import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  BLUEPRINT_SECTIONS,
  CONTENT_IDS,
  SECTION_IDS,
  blockText,
  isSecondary,
  normalize,
  proseChars,
  visibleProseChars,
} from "./blueprint";
import { POSITIONING_DISCLAIMER } from "./brand";
import claims from "../../docs/blueprint-claims.json";

/**
 * The Blueprint page, asserted against its own content fixture.
 *
 * These run over the fixture rather than the rendered DOM, and that is the
 * stronger choice for every rule here. Two sections are collapsed by default,
 * so a DOM sweep would have to open them before it could see the copy — and
 * that copy is where every traceable claim lives. The fixture is what renders,
 * so scanning it sees everything, open or closed.
 *
 * ── What changed on 2026-08-22, and what deliberately did not ────────────────
 *
 * This file used to assert sixteen sections in the source PDF's order, a
 * seven/seven/two tier split, a price, a turnaround, and three "Book Your
 * Blueprint" calls to action. Those rules were not wrong — they were built so
 * that sections could not be deleted to make the page feel shorter, and that
 * guard held for as long as the page was a sales page.
 *
 * The page stopped being one. It no longer quotes a price, no longer sells the
 * Blueprint, and exists to establish credibility for a referral-led sales
 * cycle. So the section-count rules are superseded rather than circumvented,
 * and they are replaced here by rules that pin the NEW direction — because the
 * expensive failure now runs the other way: a price or a second CTA creeping
 * back onto a page whose whole positioning is that nothing on it can be bought.
 */

const ALL_TEXT = BLUEPRINT_SECTIONS.flatMap((s) => [
  s.title,
  s.summary ?? "",
  ...s.blocks.flatMap(blockText),
]);

describe("fixture sanity — floors before any rule claims a clean result", () => {
  test("the page has real content in it", () => {
    // Every assertion below is a filter or a ratio over these, and all of them
    // pass trivially against an empty page.
    expect(BLUEPRINT_SECTIONS.length).toBe(7);
    expect(ALL_TEXT.length).toBeGreaterThanOrEqual(60);
    expect(proseChars(BLUEPRINT_SECTIONS)).toBeGreaterThanOrEqual(6_500);
  });
});

describe("the seven sections", () => {
  test("are present, named, and in render order", () => {
    // Ordered array equality, not a count. Counting seven `id` attributes
    // passes against seven unrelated divs, and passes again after two
    // sections are swapped.
    expect(SECTION_IDS).toEqual([
      "the-problem",
      "the-blueprint",
      "canadian-trust",
      "our-commitments",
      "client-proof",
      "who-we-work-best-with",
      "closing-cta",
    ]);
  });

  test("the spine and the content agree in both directions", () => {
    // A section in the spine with no content throws at module load; a section
    // with content but no spine entry would simply never render, silently.
    expect([...CONTENT_IDS].sort()).toEqual([...SECTION_IDS].sort());
  });

  test("every id is unique", () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
  });

  test("the tier split is 5 visible / 2 collapsed", () => {
    const byTier = (t: number) => BLUEPRINT_SECTIONS.filter((s) => s.tier === t).length;

    expect(byTier(1)).toBe(5);
    expect(byTier(2)).toBe(2);
    expect(byTier(1) + byTier(2)).toBe(BLUEPRINT_SECTIONS.length);
  });

  test("every collapsed section says what is inside it before you open it", () => {
    // A disclosure labelled only with its title asks the reader to gamble a
    // click. The summary line is the only text they get to decide on.
    for (const section of BLUEPRINT_SECTIONS.filter((s) => s.tier === 2)) {
      expect(normalize(section.summary ?? "").length).toBeGreaterThanOrEqual(20);
    }
  });
});

describe("digestibility, measured", () => {
  /**
   * The old rule was a RATIO — visible prose at most 40% of total — and it was
   * the right rule for a page carrying more than ten thousand characters, where
   * the only way to make it readable was to put most of it behind a disclosure.
   *
   * A ratio is the wrong instrument now. This page is roughly two-thirds
   * shorter, and on a short page a ratio rewards padding: adding a thousand
   * characters of collapsed copy improves the score without a reader
   * benefiting. So the ceiling is absolute — what a reader actually faces on
   * arrival — with a floor underneath it so "digestible" still cannot be
   * achieved by deletion.
   */
  test("what a reader meets on arrival stays under four thousand characters", () => {
    const visible = visibleProseChars(BLUEPRINT_SECTIONS);

    expect(visible).toBeGreaterThanOrEqual(2_000);
    expect(visible).toBeLessThanOrEqual(4_000);
  });

  test("hiding is never deletion — the hidden text is still in the fixture", () => {
    // The whole risk of any digestibility target is that the cheapest way to
    // hit it is to delete paragraphs. This asserts the opposite happened.
    const collapsed = BLUEPRINT_SECTIONS.filter((s) => s.tier === 2);

    expect(proseChars(collapsed)).toBeGreaterThanOrEqual(3_000);
    expect(proseChars(BLUEPRINT_SECTIONS) - visibleProseChars(BLUEPRINT_SECTIONS)).toBeGreaterThan(
      3_000,
    );
    expect(BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter(isSecondary).length).toBeGreaterThan(
      0,
    );
  });
});

describe("the three pillars are stated as outcomes, not as a method", () => {
  const outcomes = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter((b) => b.kind === "outcomes");

  test("there is exactly one outcomes block, carrying three pillars", () => {
    expect(outcomes.length).toBe(1);
    expect(outcomes[0].kind === "outcomes" && outcomes[0].pillars.length).toBe(3);
  });

  test("each pillar names its question and at least three outcomes", () => {
    const block = outcomes[0];
    if (block.kind !== "outcomes") throw new Error("unreachable");

    for (const pillar of block.pillars) {
      expect(normalize(pillar.question).endsWith("?")).toBe(true);
      expect(pillar.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("every pillar links to the page that holds the depth", () => {
    /**
     * This is what stops the withheld method turning the page into a
     * philosophy page. The outcomes are all a visitor gets here; the substance
     * behind them is one click away and already written.
     */
    const block = outcomes[0];
    if (block.kind !== "outcomes") throw new Error("unreachable");

    expect(block.pillars.map((p) => p.to)).toEqual([
      "/be-human-ai/human-readiness",
      "/be-human-ai/governance",
      "/be-human-ai/ai-strategy",
    ]);
  });
});

describe("nothing on this page can be bought", () => {
  /**
   * The direction this page now carries was described on the call as a one-way
   * door: going from secretive to public is easy, and going back is not. These
   * three rules are that door's latch. Each one fails on the specific way the
   * old page would grow back.
   */
  const PROSE = ALL_TEXT.join(" ");

  test("no price, in any form, anywhere in the copy", () => {
    expect(PROSE).not.toContain("$");
    expect(PROSE).not.toMatch(/\bCAD\b/);
    expect(PROSE).not.toMatch(/\b\d{3,4}\s*(?:dollars|CAD)\b/i);
  });

  test("no turnaround promise", () => {
    // "3 business days" was a delivery commitment attached to a purchase. With
    // nothing being purchased, a turnaround is a promise with no contract
    // behind it. The 90-day plan is a client outcome, not a delivery date, and
    // is deliberately not caught by this.
    expect(PROSE).not.toMatch(/\b\d+\s+business\s+days?\b/i);
  });

  test("there is exactly one call to action, and it asks for a conversation", () => {
    const ctas = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter((b) => b.kind === "cta");

    expect(ctas.length).toBe(1);
    expect(ctas.map((b) => (b.kind === "cta" ? b.label : ""))).toEqual(["Start a conversation"]);
  });

  test("no call to action is worded as a purchase", () => {
    const labels = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks)
      .filter((b) => b.kind === "cta")
      .map((b) => (b.kind === "cta" ? b.label : ""));

    for (const label of labels) {
      expect(label).not.toMatch(/\b(buy|order|purchase|checkout|get started|book your)\b/i);
    }
  });
});

describe("nothing is fabricated", () => {
  test("no bracket placeholder from the source document survives", () => {
    // The PDF ships `[BRETT TESTIMONIAL PLACEHOLDER]`, `[BRETT HEADSHOT]`,
    // `[ALL Y'ALL FOODS LOGO]` and `[Last Name]`. A placeholder that reaches
    // production reads as a mistake; a placeholder someone "fills in" to tidy
    // it up is worse, because it reads as a fact.
    const offenders = ALL_TEXT.filter((t) => /\[[A-Za-z '’]+\]/.test(t));
    expect(offenders).toEqual([]);
  });

  test("the client proof section renders, with its slot honestly empty", () => {
    // The section is not omitted while the quote is missing, and the slot is
    // not filled with an invented endorsement attributed to a real, named
    // person at a real, named company.
    const section = BLUEPRINT_SECTIONS.find((s) => s.id === "client-proof");

    expect(section).toBeDefined();
    expect(section!.tier).toBe(1);

    const pending = section!.blocks.find((b) => b.kind === "pending");
    expect(pending).toBeDefined();
    expect(pending!.kind === "pending" && pending!.label.toLowerCase()).toContain("pending");
  });

  test("no quotation marks around a testimonial-shaped claim", () => {
    // A cheap but real guard: the pending slot must not acquire quoted praise.
    const section = BLUEPRINT_SECTIONS.find((s) => s.id === "client-proof")!;
    const text = section.blocks.flatMap(blockText).join(" ");

    expect(text).not.toMatch(/[“"][^”"]{20,}[”"]/);
  });
});

describe("positioning — what this page may not claim", () => {
  /**
   * The control framework's own metadata says it provides readiness and
   * assurance, is not a compliance guarantee, and that its maturity score is
   * not a certification. Public copy that promises more than the framework
   * promises is the failure this catches, and it is an easy one to commit —
   * "compliant" is a natural word to reach for and a claim the business cannot
   * back.
   */
  const PROHIBITED =
    /\b(certifie[sd]|certifying|certification|compliant|compliance guarantee|guarantees? compliance|government[- ](approved|recognized)|accredited)\b/i;

  test("the rule catches every form it is meant to catch", () => {
    // Pinned as a table, because a regex that silently stops matching one form
    // is indistinguishable from copy that stopped containing it.
    const shouldMatch = [
      "we make your organization compliant",
      "this guarantees compliance with PIPEDA",
      "a compliance guarantee",
      "government approved framework",
      "government-recognized assessment",
      "we are certifying your systems",
      "an accredited certification",
      "your organization is certified",
    ];

    for (const phrase of shouldMatch) {
      expect(PROHIBITED.test(phrase)).toBe(true);
    }
  });

  test("no product or offer copy makes a prohibited claim", () => {
    /**
     * One exemption, and it is the rule working rather than being weakened:
     * the disclaimer necessarily contains the banned words, because denying a
     * claim requires naming it — "it is not a certification, it is not a
     * compliance guarantee" would otherwise be flagged as the very overclaim it
     * exists to prevent. Exempting it by block kind rather than by matching its
     * text means a *second* piece of copy cannot smuggle a claim through by
     * resembling the disclaimer.
     *
     * The team-bio exemption is gone with the team section, which now lives at
     * /who-we-are. Real personal credentials are no longer this page's problem.
     */
    const productText = BLUEPRINT_SECTIONS.flatMap((s) => [
      s.title,
      s.summary ?? "",
      ...s.blocks.filter((b) => b.kind !== "disclaimer").flatMap(blockText),
    ]);

    const offenders = productText.filter((t) => PROHIBITED.test(t));
    expect(offenders).toEqual([]);
  });

  test("the disclaimer is the only place those words are allowed, and it is exempt by kind", () => {
    // Guards the exemption itself. If the disclaimer block ever stopped being
    // the sole carrier of that language, the test above would start passing for
    // the wrong reason.
    const carriers = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter((b) =>
      blockText(b).some((t) => PROHIBITED.test(t)),
    );

    expect(carriers.map((b) => b.kind)).toEqual(["disclaimer"]);
  });

  test("the disclaimer renders, from the shared constant", () => {
    const disclaimers = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter(
      (b) => b.kind === "disclaimer",
    );

    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
    expect(disclaimers.flatMap(blockText)).toContain(POSITIONING_DISCLAIMER);
  });

  test("sovereignty is described as practices, and no definition is asserted", () => {
    /**
     * The framework records a signed-off divergence: it rescoped sovereignty
     * from hosting geography to data handling, and its declared source of truth
     * has not been updated to match. While those two disagree, ANY definition
     * published here contradicts one of them — so the page asserts none, and
     * describes what is assessed instead.
     */
    const section = BLUEPRINT_SECTIONS.find((s) => s.id === "canadian-trust")!;
    const text = section.blocks.flatMap(blockText).join(" ");

    /**
     * The check is for an *affirmative* definition, not for the word.
     *
     * The page says "We do not hand you a definition of sovereignty to agree
     * with", which is the position itself — a blanket ban on the phrase would
     * flag the sentence that establishes the very thing being asserted.
     */
    expect(text).not.toMatch(/sovereignty\s+(is|means)\s+\w/i);
    expect(text).not.toMatch(/we define sovereignty/i);
    expect(text).not.toMatch(/define sovereignty as/i);

    // And the declining-to-define sentence is asserted present, so the position
    // cannot be quietly dropped while the negative checks keep passing.
    expect(text).toContain("We do not hand you a definition of sovereignty");

    // The practices themselves are named, all five of them.
    for (const practice of [
      "No-train and no-retention terms",
      "Redaction at the model boundary",
      "call-level audit trail",
      "Key management",
      "Exit and portability",
    ]) {
      expect(text).toContain(practice);
    }
  });
});

describe("claim traceability", () => {
  const CONTROLS_YAML = path.join(
    import.meta.dir,
    "..",
    "..",
    "..",
    "thebehumancompany",
    "framework",
    "controls.yaml",
  );

  /** Control ids, read out of the real YAML rather than a copy of it. */
  function controlIds(): string[] {
    const source = readFileSync(CONTROLS_YAML, "utf8");
    return [...source.matchAll(/^ {2}- id: ([a-z]+-\d+)$/gm)].map((m) => m[1]);
  }

  const available = controlIds();

  test("the framework was actually read", () => {
    expect(available.length).toBeGreaterThanOrEqual(50);
    expect(available).toContain("sov-01");
  });

  test("every claim cites at least one control", () => {
    expect(claims.claims.length).toBeGreaterThanOrEqual(10);
    for (const claim of claims.claims) {
      expect(claim.controls.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("every cited control id resolves in the real framework", () => {
    // Catches the two ways this rots: a claim invented an id, or the framework
    // renamed one underneath us.
    const cited = [...new Set(claims.claims.flatMap((c) => c.controls))];
    const dangling = cited.filter((id) => !available.includes(id));

    expect(dangling).toEqual([]);
  });

  test("all eight domains are still represented after the page was cut down", () => {
    /**
     * This is the assertion that made the section cut safe to do at all.
     *
     * Nine sections were removed on 2026-08-22. Three claims went with
     * `what-youll-receive`, because they named deliverables the page no longer
     * describes and remapping them would have asserted coverage that is not on
     * the page. One of those three was the only claim citing all eight domains
     * by itself — so if the two remaining sections had not covered the full
     * spread between them, this test would have caught the page silently
     * dropping a domain it still claims to assess.
     */
    const domains = new Set(claims.claims.flatMap((c) => c.domains));

    expect([...domains].sort()).toEqual([
      "cybersecurity",
      "governance",
      "operational_risk",
      "privacy_data",
      "sovereignty",
      "transparency_audit",
      "vendor_risk",
      "workforce_readiness",
    ]);
  });

  test("every claim points at a section that exists", () => {
    const orphans = claims.claims.filter((c) => !SECTION_IDS.includes(c.section));
    expect(orphans).toEqual([]);
  });

  test("the sections carrying the claims are the ones that survived the cut", () => {
    // Both are tier 2. That is the deliberate shape: the traceable content is
    // present and openable, without competing with the outcomes for attention.
    const carrying = [...new Set(claims.claims.map((c) => c.section))].sort();

    expect(carrying).toEqual(["canadian-trust", "our-commitments"]);
    for (const id of carrying) {
      expect(BLUEPRINT_SECTIONS.find((s) => s.id === id)!.tier).toBe(2);
    }
  });
});
