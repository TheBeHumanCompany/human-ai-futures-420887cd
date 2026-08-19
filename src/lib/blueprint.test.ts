import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  BLUEPRINT_SECTIONS,
  CONTENT_IDS,
  FOUNDING_RATE,
  FUTURE_RATE,
  SECTION_IDS,
  TURNAROUND,
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
 * stronger choice for every rule here. Half the page is collapsed by default,
 * so a DOM sweep would have to open sixteen disclosures before it could see the
 * copy — and the copy most likely to overclaim is exactly the copy sitting
 * inside the governance section nobody expanded. The fixture is what renders,
 * so scanning it sees everything, open or closed.
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
    expect(BLUEPRINT_SECTIONS.length).toBe(16);
    expect(ALL_TEXT.length).toBeGreaterThanOrEqual(80);
    expect(proseChars(BLUEPRINT_SECTIONS)).toBeGreaterThanOrEqual(10_000);
  });
});

describe("the sixteen sections", () => {
  test("are present, named, and in the source document's order", () => {
    // Ordered array equality, not a count. Counting sixteen `id` attributes
    // passes against sixteen unrelated divs, and passes again after two
    // sections are swapped.
    expect(SECTION_IDS).toEqual([
      "hero",
      "the-problem",
      "our-approach",
      "canadian-trust",
      "our-commitments",
      "the-blueprint",
      "who-it-is-for",
      "what-youll-receive",
      "client-proof",
      "how-it-works",
      "what-waiting-costs",
      "the-offer",
      "the-team",
      "who-we-work-best-with",
      "faq",
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

  test("the tier split is 7 visible / 7 collapsed / 2 relocated", () => {
    const byTier = (t: number) => BLUEPRINT_SECTIONS.filter((s) => s.tier === t).length;

    expect(byTier(1)).toBe(7);
    expect(byTier(2)).toBe(7);
    expect(byTier(3)).toBe(2);
    expect(byTier(1) + byTier(2) + byTier(3)).toBe(16);
  });

  test("collapsed sections clear the six-section floor", () => {
    // Counted as whole sections, never as `[data-state]` attributes — an
    // earlier version of this gate counted eight matches for two sections and
    // would have passed on two empty ones.
    expect(BLUEPRINT_SECTIONS.filter((s) => s.tier === 2).length).toBeGreaterThanOrEqual(6);
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
  test("default-visible prose is at most 40% of the page's prose", () => {
    const total = proseChars(BLUEPRINT_SECTIONS);
    const visible = visibleProseChars(BLUEPRINT_SECTIONS);

    // Both floors asserted, because the ratio alone is perfect on an empty
    // page: 0/0 guarded, and a stub page would score beautifully.
    expect(total).toBeGreaterThanOrEqual(10_000);
    expect(visible).toBeGreaterThanOrEqual(2_000);
    expect(visible / total).toBeLessThanOrEqual(0.4);
  });

  test("hiding is never deletion — the hidden text is still in the fixture", () => {
    // The whole risk of a ratio target is that the cheapest way to hit it is to
    // delete paragraphs. This asserts the opposite happened: the text excluded
    // from the visible count is present, substantial, and still rendered.
    const secondary = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter(isSecondary);
    const collapsed = BLUEPRINT_SECTIONS.filter((s) => s.tier === 2);

    expect(secondary.length).toBeGreaterThanOrEqual(8);
    expect(proseChars(collapsed)).toBeGreaterThanOrEqual(5_000);
    expect(proseChars(BLUEPRINT_SECTIONS) - visibleProseChars(BLUEPRINT_SECTIONS)).toBeGreaterThan(
      6_000,
    );
  });

  test("the two relocated sections still carry a promise and a way through", () => {
    // "Present" for a tier-3 section means a titled section with real summary
    // cards that link onward — not a heading over an empty div.
    for (const section of BLUEPRINT_SECTIONS.filter((s) => s.tier === 3)) {
      const cards = section.blocks.find((b) => b.kind === "cards");
      expect(cards).toBeDefined();
      expect(cards!.kind === "cards" && cards!.items.length).toBe(3);
      expect(cards!.kind === "cards" && cards!.items.every((i) => Boolean(i.to))).toBe(true);
    }
  });
});

describe("pricing", () => {
  test("the three facts are exact", () => {
    expect(FOUNDING_RATE).toBe("$795 CAD");
    expect(FUTURE_RATE).toBe("$1,500 CAD");
    expect(TURNAROUND).toBe("3 business days");
  });

  test("no price is typed a second time in the prose", () => {
    // The expensive failure is mundane: the rate changes, three of four
    // mentions get updated, and the page quotes two prices for one thing.
    //
    // Scoped to everything EXCEPT the pricing blocks, which render the
    // constants and are supposed to contain them. Scanning those too would be
    // asserting that the price never appears, which is a different and useless
    // claim — the rule is that it appears in exactly one *source*.
    const prose = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks)
      .filter((b) => b.kind !== "pricing")
      .flatMap(blockText)
      .join(" ");

    expect(prose).not.toContain("795");
    expect(prose).not.toContain("1,500");
    expect(prose).not.toContain("$");
  });

  test("both rates and the turnaround reach the page", () => {
    const pricing = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter((b) => b.kind === "pricing");
    expect(pricing.length).toBeGreaterThanOrEqual(1);

    const rendered = pricing.flatMap(blockText);
    expect(rendered).toContain(FOUNDING_RATE);
    expect(rendered).toContain(FUTURE_RATE);
    expect(rendered).toContain(TURNAROUND);
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
    // The section is not omitted while the quote is missing — omitting it would
    // break "all sixteen present" — and the slot is not filled with an invented
    // endorsement attributed to a real, named person at a real, named company.
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
    // is indistinguishable from copy that stopped containing it. An earlier
    // version missed four of these.
    const shouldMatch = [
      "we make your organization compliant",
      "this guarantees compliance with PIPEDA",
      "a compliance guarantee",
      "government approved framework",
      "government-recognized assessment",
      "we are certifying your AI systems",
      "an accredited AI certification",
      "your organization is certified",
    ];

    for (const phrase of shouldMatch) {
      expect(PROHIBITED.test(phrase)).toBe(true);
    }
  });

  test("the rule does not ban legitimate personal credentials", () => {
    // People hold real qualifications. A rule that erased them to protect the
    // product's positioning would be a worse error than the one it prevents,
    // so the boundary is pinned in both directions.
    expect(PROHIBITED.test("a certified cybersecurity professional")).toBe(true);
    // ...which is why product copy is scanned and bios are not. The team cards
    // on this page carry exactly those credentials, and they are allowed.
    const team = BLUEPRINT_SECTIONS.find((s) => s.id === "the-team")!;
    const teamText = team.blocks.flatMap(blockText).join(" ");

    expect(teamText).toContain("certified cybersecurity professional");
    expect(teamText).toContain("certified counsellor");
  });

  test("no product or offer copy makes a prohibited claim", () => {
    /**
     * Two exemptions, both of which are the rule working rather than being
     * weakened.
     *
     * The team bios carry real personal credentials, per the boundary pinned
     * above. And the disclaimer necessarily contains the banned words, because
     * denying a claim requires naming it — "it is not a certification, it is
     * not a compliance guarantee" would otherwise be flagged as the very
     * overclaim it exists to prevent. Exempting it by block kind rather than by
     * matching its text means a *second* piece of copy cannot smuggle a claim
     * through by resembling the disclaimer.
     */
    const productText = BLUEPRINT_SECTIONS.filter((s) => s.id !== "the-team").flatMap((s) => [
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

    expect(carriers.map((b) => b.kind)).toEqual(["disclaimer", "cards"]);
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
     * flag the sentence that establishes the very thing being asserted. What
     * must not appear is a construction that completes the definition.
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
    // Floor: every assertion below is a lookup against this list, and all of
    // them would fail loudly rather than silently — but a mis-parsed file would
    // make the domain-coverage count wrong in a confusing way instead.
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

  test("all eight domains are represented", () => {
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
});

describe("booking CTAs", () => {
  test("there are exactly three, in three different sections", () => {
    const withCta = BLUEPRINT_SECTIONS.filter((s) => s.blocks.some((b) => b.kind === "cta"));
    const total = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks).filter((b) => b.kind === "cta");

    expect(total.length).toBe(3);
    expect(withCta.map((s) => s.id)).toEqual(["hero", "the-offer", "closing-cta"]);
  });

  test("every one is labelled the same thing", () => {
    const labels = BLUEPRINT_SECTIONS.flatMap((s) => s.blocks)
      .filter((b) => b.kind === "cta")
      .map((b) => (b.kind === "cta" ? b.label : ""));

    expect(labels).toEqual(["Book Your Blueprint", "Book Your Blueprint", "Book Your Blueprint"]);
  });
});
