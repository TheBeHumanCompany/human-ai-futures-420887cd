import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import catalogue from "./catalogue.snapshot.json";
import {
  BIO_MAX_LENGTH,
  BIO_MIN_LENGTH,
  CLEAN_LABEL,
  ENRICHMENT_RELATIVE_PATH,
  type EnrichmentApplyDeps,
  type EnrichmentEntry,
  ISSUES_LABEL,
  applyEnrichment,
  buildDryRunPlan,
  buildEnrichmentPlan,
  draftDocId,
  extractClaimVerbs,
  extractRoleClaims,
  CLAIM_VERB_FORMS,
  parseEnrichment,
  topicReference,
  validateEnrichment,
  validateEnrichmentFile,
  validateTopicAssignment,
} from "./enrichment";
import { episodeDocId } from "./doc-id";
import { MAX_TOPICS_PER_EPISODE, TAXONOMY_RELATIVE_PATH, parseTaxonomy } from "./topics";

/**
 * Both committed artifacts are read off disk rather than `import`ed, for the
 * reason `topics.test.ts` states: `content/` sits outside `src/`, and a static
 * import would pull a review artifact into whatever bundle walks this tree.
 * Nothing at runtime needs either file — the site reads bios and topics from
 * Sanity.
 */
const REPO_ROOT = path.join(import.meta.dir, "..", "..", "..");
const read = (relative: string) => JSON.parse(readFileSync(path.join(REPO_ROOT, relative), "utf8"));

const parsedEnrichment = parseEnrichment(read(ENRICHMENT_RELATIVE_PATH));
const parsedTaxonomy = parseTaxonomy(read(TAXONOMY_RELATIVE_PATH));
const TAXONOMY_SLUGS = (parsedTaxonomy.taxonomy?.topics ?? []).map((topic) => topic.slug);

const EPISODES = catalogue.episodes;
const episode = (episodeNumber: number) => {
  const found = EPISODES.find((entry) => entry.episodeNumber === episodeNumber);
  if (found === undefined) throw new Error(`no episode ${episodeNumber} in the snapshot`);
  return found;
};

/**
 * Two real episodes, used as the fixture pair throughout.
 *
 * Real ones rather than invented ones on purpose: a hand-authored source string
 * can be quietly widened until whatever the test is asserting passes, which is
 * the failure Principle 6 is about. These are the shipped corpus.
 */
const enrichmentEpisodes = parsedEnrichment.enrichment?.episodes ?? [];

const EP2 = episode(2);
const EP5 = episode(5);

describe("fixture sanity — non-vacuity floors", () => {
  test("both committed artifacts parsed", () => {
    // Every describe below filters or indexes into these. If either failed to
    // parse, the suite would pass by describing nothing.
    expect(parsedEnrichment.errors).toEqual([]);
    expect(parsedEnrichment.enrichment).not.toBeNull();
    expect(parsedTaxonomy.errors).toEqual([]);
    expect(TAXONOMY_SLUGS.length).toBeGreaterThanOrEqual(12);
  });

  test("the snapshot still holds the 39 episodes this file is written against", () => {
    expect(EPISODES.length).toBe(39);
  });
});

describe("validateEnrichment — the entity and number check", () => {
  test("a bio drawn from the episode's own words is clean", () => {
    const report = validateEnrichment(
      "Alexandra Dean is the founder of Adhere to Studios, a sustainable outerwear brand.",
      EP2.description,
      EP2.title,
    );
    expect(report.errors).toEqual([]);
    expect(report.label).toBe(CLEAN_LABEL);
  });

  test("an INVENTED COMPANY NAME fails", () => {
    const report = validateEnrichment(
      "Alexandra Dean is the founder of Acme Outerwear, a sustainable brand.",
      EP2.description,
      EP2.title,
    );
    expect(report.label).toBe(ISSUES_LABEL);
    expect(report.errors.join(" ")).toContain("Acme");
  });

  test("an INVENTED NUMBER fails", () => {
    const report = validateEnrichment(
      "Alexandra Dean spent 14 years at Lululemon before starting her own brand.",
      EP2.description,
      EP2.title,
    );
    expect(report.label).toBe(ISSUES_LABEL);
    expect(report.errors.join(" ")).toContain("14");
  });

  test("a number that IS in the source passes, so the rule is not just rejecting digits", () => {
    // Episode 7 is the one with real numbers in its description — 3,000 sq. ft.
    // and 13 practitioners. Without this row the invented-number test above
    // would pass equally well against a validator that rejected every digit.
    const EP7 = episode(7);
    const report = validateEnrichment(
      `Ariel Jarvis runs a 3,000 sq. ft. clinic with 13 practitioners.`,
      EP7.description,
      EP7.title,
    );
    expect(report.errors).toEqual([]);
  });

  /**
   * The thousands-separator exploit, found by adversarial review and fixed.
   *
   * The original check matched bare digit runs, which split "3,000" into `3`
   * and `000`. Episode 7's source says *"a 3,000 sq. ft. clinic with 13
   * practitioners"*, giving the set {7, 3, 000, 13} — so a bio claiming a
   * "13,000 sq. ft. clinic" split to `13` and `000`, both present, and passed.
   * A real guest's clinic inflated more than fourfold, using only digits the
   * source contained, straight through the check meant to catch exactly that.
   */
  test("a grouped number cannot be inflated by regrouping its digits", () => {
    const EP7 = episode(7);

    // The truthful figure still passes...
    expect(
      validateEnrichment(
        "Ariel Jarvis runs a 3,000 sq. ft. clinic with 13 practitioners.",
        EP7.description,
        EP7.title,
      ).errors,
    ).toEqual([]);

    // ...and the inflated one no longer does.
    const inflated = validateEnrichment(
      "Ariel Jarvis runs a 13,000 sq. ft. clinic today.",
      EP7.description,
      EP7.title,
    );
    expect(inflated.label).toBe(ISSUES_LABEL);
    expect(inflated.errors.join(" ")).toContain("13000");
  });

  test("grouping style itself is not a difference", () => {
    // "3,000" and "3000" are one number written two ways. A reviewer comparing
    // a bio against a description should not have to care which one the author
    // picked, so the separator is normalised away rather than being significant.
    const EP7 = episode(7);
    expect(
      validateEnrichment(
        "Ariel Jarvis runs a 3000 sq. ft. clinic with 13 practitioners.",
        EP7.description,
        EP7.title,
      ).errors,
    ).toEqual([]);
  });

  test("a decimal point is NOT stripped — 3.5 and 35 are different numbers", () => {
    // The separator normalisation removes thousands grouping only. Collapsing
    // the decimal point too would reintroduce the same class of bug one digit
    // further down.
    const EP7 = episode(7);
    expect(
      validateEnrichment(
        "Ariel Jarvis runs a 3.5 sq. ft. clinic today.",
        EP7.description,
        EP7.title,
      ).errors.join(" "),
    ).toContain("3.5");
  });

  /**
   * The per-episode property, and why it needs its own row.
   *
   * `topics.test.ts` had to fix exactly this shape of bug in the taxonomy's
   * evidence check: a quote searched against the whole corpus could be paired
   * with the wrong episode and still pass. Here the same mistake would let a bio
   * describing a different guest entirely come back clean — the single worst
   * outcome this validator exists to prevent, since it is a real person's page.
   */
  test("a bio that is clean against its OWN episode fails against another one", () => {
    const bio =
      "Jenn Harper is the trailblazing founder of Cheekbone Beauty, whose Indigenous heritage shaped her mission.";

    expect(validateEnrichment(bio, EP5.description, EP5.title).errors).toEqual([]);

    const crossed = validateEnrichment(bio, EP2.description, EP2.title);
    expect(crossed.label).toBe(ISSUES_LABEL);
    expect(crossed.errors.join(" ")).toContain("Cheekbone");
  });

  test("a sentence-initial common word is not treated as a proper noun", () => {
    // "She" is capitalised for position, not for meaning. EP2's description says
    // "she honed her skills", so the word is in the source in lower case — which
    // is what the sentence-initial rule checks against. A flat "must appear
    // capitalised" rule would reject this and push an author toward worse prose.
    const report = validateEnrichment(
      "Alexandra Dean designs outerwear. She honed her skills at Lululemon.",
      EP2.description,
      EP2.title,
    );
    expect(report.errors).toEqual([]);
  });

  test("but a sentence-initial word absent from the source entirely still fails", () => {
    // The sentence-initial relaxation is about CASE, not about membership.
    const report = validateEnrichment(
      "Alexandra Dean designs outerwear. Zeppelins were her first love, she says.",
      EP2.description,
      EP2.title,
    );
    expect(report.errors.join(" ")).toContain("Zeppelins");
  });

  /**
   * The counterexample that killed the position-based rule.
   *
   * The old validator checked sentence-initial capitals case-insensitively, so a
   * bio could invent the company "Apple" against a source that only said "she
   * ate an apple". Position is no longer consulted; this row is what stops that
   * design coming back.
   */
  test("an invented proper noun fails even where the lower-case word IS in the source", () => {
    const report = validateEnrichment(
      "Apple sold the business, and the founder moved on to other work.",
      "She ate an apple and later sold the business to a larger group.",
      "",
    );
    expect(report.label).toBe(ISSUES_LABEL);
    expect(report.errors.join(" ")).toContain("Apple");
  });

  test("an abbreviation's period no longer weakens the next word", () => {
    // Every "." used to reset the sentence-boundary state, so "e.g. Marketing"
    // matched a lower-case "marketing". There is no state left to reset.
    const report = validateEnrichment(
      "The founder works in e.g. Marketing and other fields entirely.",
      "the founder works in marketing and other fields entirely",
      "",
    );
    expect(report.errors.join(" ")).toContain("Marketing");
  });

  /**
   * Unicode bypasses, all four found by adversarial review of the "fixed"
   * validator. Each one let a claim through a check that reported clean.
   */
  test("a Unicode minus changes the number and is not ignored", () => {
    // The sign check recognised only ASCII "-", so "−13" (U+2212) tokenised as
    // a bare 13 and matched a source's positive 13 — the sign silently dropped.
    const report = validateEnrichment(
      "she led a team of −13 people in a big city, working hard",
      "she led a team of 13 people in a big city",
      "",
    );
    expect(report.errors.join(" ")).toContain("-13");
  });

  test("a lower-case-initial brand is still checked", () => {
    // "eBay" begins with a lower-case letter, so a /^\p{Lu}/ test saw no capital
    // and skipped the word entirely — exempting every camel-cased brand
    // ("eBay", "iPhone", "iOS") from the proper-noun rule altogether.
    const report = validateEnrichment(
      "she sold the business through eBay over several months of work",
      "she sold the business through an online marketplace over months",
      "",
    );
    expect(report.errors.join(" ")).toContain("eBay");
  });

  test("a Unicode titlecase letter counts as a capital", () => {
    // \p{Lt} is a distinct category from \p{Lu}, so titlecase proper nouns were
    // missed entirely by the original /^\p{Lu}/ test.
    //
    // This row became load-bearing when word canonicalisation moved from NFKC to
    // NFC (to stop "№" manufacturing a sourced "No"). NFKC used to fold U+01C5
    // into "Dž", so the \p{Lu} half of the check caught it incidentally. NFC
    // does not fold it at all — so \p{Lt} is now the ONLY thing standing between
    // a titlecase proper noun and a clean report.
    const report = validateEnrichment(
      "she worked with ǅuro on the launch of the brand for years",
      "she worked with a partner on the launch of the brand for years",
      "",
    );
    expect(report.label).toBe(ISSUES_LABEL);
    expect(report.errors.join(" ")).toContain("ǅuro");
  });

  test("an entity built entirely out of exempt words is still caught", () => {
    // "The Who" passed while both halves were exempt — an invented entity
    // assembled purely from exemptions. It is the sharpest argument for keeping
    // the exemption list to the four the corpus actually needs.
    const report = validateEnrichment(
      "backed by The Who in its earliest days of trading, she grew it",
      "she raised money from investors early on and grew the company",
      "",
    );
    expect(report.label).toBe(ISSUES_LABEL);
  });

  test("zero-width and compatibility characters cannot smuggle a claim past the check", () => {
    // Canonicalisation is a BOUNDARY, not a list of glyphs to patch. Each of
    // these passed clean against a validator that named signs one at a time —
    // a zero-width space detaching a minus from its digits, three compatibility
    // minus forms, and a zero-width space splitting an invented brand into two
    // unremarkable halves.
    const numberSource = "she led a team of 13 people in a big city";
    for (const bio of [
      "she led a team of \u2212\u200B13 people in a big city, working",
      "she led a team of \u207B13 people in a big city, working",
      "she led a team of \u208B13 people in a big city, working",
      "she led a team of \u2796 13 people in a big city, working",
      "she led a team of \uFE6313 people in a big city, working",
    ]) {
      expect(validateEnrichment(bio, numberSource, "").label).toBe(ISSUES_LABEL);
    }

    const brandSource = "she built a metaverse product for the company over time";
    expect(
      validateEnrichment(
        "she built Meta\u200Bverse for the company over years now",
        brandSource,
        "",
      ).label,
    ).toBe(ISSUES_LABEL);
  });

  test("canonicalisation also removes FALSE rejections", () => {
    // The same boundary that closes the bypasses fixes their mirror image: a
    // name written decomposed in the bio and composed in the source is the same
    // name, and fullwidth digits are the same digits. Before NFKC both were
    // rejected, which would have pushed an author toward retyping rather than
    // toward matching the source.
    expect(
      validateEnrichment(
        "she led a team of \uFF11\uFF13 people in a big city, working",
        "she led a team of 13 people in a big city",
        "",
      ).errors,
    ).toEqual([]);

    expect(
      validateEnrichment(
        "she worked with Mari\u0301a on the brand for many years now",
        "she worked with Mar\u00EDa on the brand for many years",
        "",
      ).errors,
    ).toEqual([]);
  });

  test("a hyphenated range is not read as a negative number", () => {
    // "3-5" must parse as 3 and 5, not 3 and -5, or an ordinary range is a
    // false rejection. A minus only signs a number when it is not infix.
    expect(
      validateEnrichment(
        "she hired 3-5 people in the first year of trading there",
        "she hired 3 and 5 people in the first year of trading",
        "",
      ).errors,
    ).toEqual([]);
  });

  test("the exempt list excludes function words that double as brand names", () => {
    // Each entry in the exempt list is an exemption someone could hide behind,
    // so words that are both function words and plausible single-word brands
    // were removed. The second word of a multi-word name is checked regardless,
    // which is the backstop for the ones that remain.
    const neutral = "a description mentioning no proper nouns whatsoever here";
    for (const bio of [
      "Out magazine profiled the founder at length this year.",
      "All detergent funded the launch of the business venture.",
      "Now Foods supplies the ingredients for the whole product line.",
      "Both Industries acquired the firm in a deal last year.",
    ]) {
      expect(validateEnrichment(bio, neutral, "").label).toBe(ISSUES_LABEL);
    }
  });

  test("length bounds are enforced at both ends", () => {
    const short = "a".repeat(BIO_MIN_LENGTH - 1);
    const long = "a".repeat(BIO_MAX_LENGTH + 1);

    expect(validateEnrichment(short, EP2.description, EP2.title).errors.join(" ")).toContain(
      "the floor is",
    );
    expect(validateEnrichment(long, EP2.description, EP2.title).errors.join(" ")).toContain(
      "the ceiling is",
    );

    // Both ends of the valid range, so the bound is a range rather than a wall.
    expect(
      validateEnrichment("a".repeat(BIO_MIN_LENGTH), EP2.description, EP2.title).errors,
    ).toEqual([]);
    expect(
      validateEnrichment("a".repeat(BIO_MAX_LENGTH), EP2.description, EP2.title).errors,
    ).toEqual([]);
  });

  test("length is measured after trimming, which is the check GROQ cannot do", () => {
    // `src/lib/sanity/enriched.ts` says outright that a whitespace-only bio has
    // `length > 0` and reads as enriched, because GROQ has no `trim()`. This is
    // the one place in the pipeline that can catch it, so it does.
    const padded = `${" ".repeat(50)}short${" ".repeat(50)}`;
    expect(validateEnrichment(padded, EP2.description, EP2.title).errors.join(" ")).toContain(
      "the floor is",
    );
  });
});

describe("claim verbs — surfaced as sign-off items, never as failures", () => {
  test("a claim verb is extracted with the sentence it was made in", () => {
    const bio = "Alexandra Dean founded Adhere to Studios. She designs outerwear in Vancouver.";
    const sightings = extractClaimVerbs(bio);

    expect(sightings.map((sighting) => sighting.verb.toLowerCase())).toContain("founded");
    expect(sightings[0]?.sentence).toBe("Alexandra Dean founded Adhere to Studios.");
  });

  test("EVERY declared form surfaces — driven off the list, not a hand-picked few", () => {
    // An earlier version checked seven past-tense forms by hand, so deleting
    // "raising" and "acquiring" from the list would have left it green — which
    // is precisely the bug that shipped ("raiseing" never matched "raising").
    // Driving the assertion off CLAIM_VERB_FORMS makes the test impossible to
    // outlive the list it is testing.
    // The expectation is a LITERAL. Iterating CLAIM_VERB_FORMS and asserting
    // each member extracts is circular — deleting "raising" would delete its
    // own test case and stay green, which is exactly the bug that shipped.
    const EXPECTED_FORMS = [
      "found",
      "founds",
      "founded",
      "founding",
      "sell",
      "sells",
      "selling",
      "sold",
      "raise",
      "raises",
      "raised",
      "raising",
      "lead",
      "leads",
      "leading",
      "led",
      "launch",
      "launches",
      "launched",
      "launching",
      "exit",
      "exits",
      "exited",
      "exiting",
      "acquire",
      "acquires",
      "acquired",
      "acquiring",
    ];

    // The declared list must BE the expected list — so a deletion is red here.
    expect([...CLAIM_VERB_FORMS]).toEqual(EXPECTED_FORMS);

    for (const form of EXPECTED_FORMS) {
      const found = extractClaimVerbs(`She ${form} the company last year.`);
      expect({ form, found: found.map((s) => s.verb.toLowerCase()) }).toEqual({
        form,
        found: [form],
      });
    }
  });

  test("a claim verb never turns a clean bio into a failing one", () => {
    // The whole point of the mechanism: relational accuracy is a HUMAN
    // judgement made against a diff. If a claim verb were a gate, an author
    // would route around it by rewording, and the claim would stop being
    // reviewed rather than start being true.
    const report = validateEnrichment(
      "Alexandra Dean founded Adhere to Studios, a sustainable outerwear brand.",
      EP2.description,
      EP2.title,
    );
    expect(report.label).toBe(CLEAN_LABEL);
    expect(report.errors).toEqual([]);
    expect(report.claimVerbs.length).toBeGreaterThan(0);
  });

  test("co-founder is reported as itself, never collapsed to founder", () => {
    // The whole reason roles are surfaced. If "co-founder of Neuraura" reported
    // as a bare "founder", the sign-off list would show the reviewer exactly the
    // claim that is NOT being made, which is worse than showing nothing.
    expect(extractRoleClaims("Claire Dixon is co-founder of Neuraura.")[0]?.verb).toBe(
      "co-founder",
    );
    expect(extractRoleClaims("Jenn Harper is the founder of Cheekbone Beauty.")[0]?.verb).toBe(
      "founder",
    );
  });

  test("role claims are surfaced separately and never gate", () => {
    // Roles live in their own list so they neither drown the verb claims nor
    // get dropped for being numerous — the failure of the first attempt.
    const report = validateEnrichment(
      "Alexandra Dean is the founder of Adhere to Studios, a sustainable outerwear brand.",
      EP2.description,
      EP2.title,
    );
    expect(report.label).toBe(CLEAN_LABEL);
    expect(report.roleClaims.map((claim) => claim.verb)).toEqual(["founder"]);
    expect(report.claimVerbs).toEqual([]);
  });

  /**
   * The oracle is a LITERAL, not a re-derivation from ROLE_CLAIM_TERMS.
   *
   * Two earlier versions of this test were circular and review caught both. The
   * first required only ">25 episodes" and stayed green while episode 6's plural
   * "founders" was silently dropped. The second built its "independent" scanner
   * out of ROLE_CLAIM_TERMS itself — so deleting "founders" removed it from the
   * expectation and the implementation at the same time, and the test still
   * passed. A test whose oracle comes from the thing under test can only ever
   * agree with it.
   *
   * This table was read off the committed bios once and is now frozen here.
   * Deleting any form from ROLE_CLAIM_TERMS makes a row mismatch and the test
   * red — which is the property the previous two versions claimed and lacked.
   */
  const EXPECTED_ROLE_CLAIMS: [number, string[]][] = [
    [2, ["founder"]],
    [3, ["ceo", "founder"]],
    [4, ["founder"]],
    [5, ["founder"]],
    [6, ["founders"]],
    [7, ["founder"]],
    [8, ["founder"]],
    [9, ["founder"]],
    [10, ["co-founder"]],
    [11, ["founder"]],
    [12, ["founder"]],
    [13, ["ceo", "founder"]],
    [14, ["founder"]],
    [15, ["founder"]],
    [16, ["co-founder"]],
    [17, ["co-founder"]],
    [18, ["co-founder", "ceo"]],
    [19, ["founder"]],
    [20, ["co-founder"]],
    [21, ["founder"]],
    [22, ["founder"]],
    [23, ["co-founder"]],
    [24, ["director", "co-founder"]],
    [25, ["founder"]],
    [26, ["founder"]],
    [27, ["co-founder", "partner"]],
    [28, ["founder", "ceo"]],
    [29, ["founder"]],
    [32, ["ceo"]],
    [33, ["founder"]],
    [34, ["ceo"]],
    [35, ["founder"]],
    [36, ["founder"]],
    [38, ["founder"]],
    [39, ["owner"]],
  ];

  test("every role claim in the committed bios matches a frozen expectation", () => {
    const actual = enrichmentEpisodes
      .map((item) => [
        item.episodeNumber,
        extractRoleClaims(item.guestBio).map((claim) => claim.verb.toLowerCase()),
      ])
      .filter(([, roles]) => (roles as string[]).length > 0);

    expect(actual).toEqual(EXPECTED_ROLE_CLAIMS);
  });

  test("episode 6's PLURAL role is present — the one a singular-only list dropped", () => {
    // Called out on its own because it is the miss that happened: "the dynamic
    // founders of Minta" vanished from the sign-off list entirely.
    const six = enrichmentEpisodes.find((item) => item.episodeNumber === 6);
    expect(extractRoleClaims(six!.guestBio).map((claim) => claim.verb)).toEqual(["founders"]);
  });

  test("a bio making no relational claim produces an empty list", () => {
    expect(extractClaimVerbs("Alexandra Dean designs outerwear in Vancouver.")).toEqual([]);
  });

  test("the stems do not fire inside longer, unrelated words", () => {
    // "soldering", "ledger" and "leading question" would each make the sign-off
    // list noise, and a noisy list is one nobody reads — which is the same
    // outcome as not having one.
    expect(extractClaimVerbs("A soldering ledger sat on the foundation shelf.")).toEqual([]);
  });
});

/**
 * Pre-mortem #3, asserted rather than commented.
 *
 * The named failure is a reviewer reading "39/39 clean" as "39/39 verified" and
 * approving a bio whose entities are all real and whose relationship between
 * them is invented. The label is the mitigation, so the label is pinned.
 */
describe("the label is load-bearing", () => {
  test("a clean result says 'entities-and-numbers: clean'", () => {
    expect(CLEAN_LABEL).toBe("entities-and-numbers: clean");
  });

  test("no status this validator can emit contains the word 'verified'", () => {
    for (const label of [CLEAN_LABEL, ISSUES_LABEL]) {
      expect(label.toLowerCase()).not.toContain("verified");
    }

    const clean = validateEnrichment(
      "Alexandra Dean is the founder of Adhere to Studios, a sustainable outerwear brand.",
      EP2.description,
      EP2.title,
    );
    const dirty = validateEnrichment(
      "Acme Corp did things here, allegedly.",
      EP2.description,
      EP2.title,
    );

    expect(JSON.stringify([clean, dirty]).toLowerCase()).not.toContain("verified");
  });

  test("a REAL number attached to the wrong thing also passes — the same hole, in digits", () => {
    // Episode 38's source says he raised over $1 million and overcame more than
    // 300 investor rejections. Swapping the two figures keeps every literal in
    // the source and inverts the claim entirely. This is the numeric twin of the
    // relational hole above, and it is why the sign-off step covers figures as
    // well as verbs rather than treating "no invented numbers" as sufficient.
    const EP38 = episode(38);
    const swapped = validateEnrichment(
      "Nick Vassev raised over $300 million in funding and overcame more than 1 investor rejection.",
      EP38.description,
      EP38.title,
    );
    expect(swapped.label).toBe(CLEAN_LABEL);
  });

  test("and the hole the label exists to describe is real, not hypothetical", () => {
    // A relational claim built entirely from lower-case words the source
    // contains passes cleanly. This row is not a defect to fix — it is the
    // documented boundary of what the check proves, and it is asserted so that
    // a future reader cannot mistake "clean" for "true".
    const report = validateEnrichment(
      "Alexandra Dean stepped back from her brand to work in marketing.",
      EP2.description,
      EP2.title,
    );
    expect(report.label).toBe(CLEAN_LABEL);
  });
});

describe("validateTopicAssignment", () => {
  test("a slug outside the taxonomy fails", () => {
    const errors = validateTopicAssignment(["leadership", "cryptocurrency"], TAXONOMY_SLUGS);
    expect(errors.join(" ")).toContain("cryptocurrency");
  });

  test("more than six topics fails and exactly six passes", () => {
    const six = TAXONOMY_SLUGS.slice(0, MAX_TOPICS_PER_EPISODE);
    const seven = TAXONOMY_SLUGS.slice(0, MAX_TOPICS_PER_EPISODE + 1);

    expect(validateTopicAssignment(six, TAXONOMY_SLUGS)).toEqual([]);
    expect(validateTopicAssignment(seven, TAXONOMY_SLUGS).join(" ")).toContain("the cap is");
  });

  test("an empty assignment and a duplicated slug both fail", () => {
    expect(validateTopicAssignment([], TAXONOMY_SLUGS).join(" ")).toContain("no topics assigned");
    expect(
      validateTopicAssignment(["leadership", "leadership"], TAXONOMY_SLUGS).join(" "),
    ).toContain("assigned twice");
  });
});

describe("parseEnrichment — shape before values", () => {
  test("a numeric guestBio is rejected at the shape gate", () => {
    // The reason this gate exists: `JSON.parse` returns `any`, and a numeric
    // bio would reach `.trim()` inside the validator rather than a readable
    // error at the file boundary.
    const { enrichment, errors } = parseEnrichment({
      source: "s",
      constraint: "c",
      reviewNote: "r",
      episodes: [{ guid: "g", episodeNumber: 1, guestName: null, guestBio: 123, topics: [] }],
    });
    expect(enrichment).toBeNull();
    expect(errors.join(" ")).toContain("guestBio");
  });

  test("a null episodeNumber and a null guestName are both legal", () => {
    // Two of the 39 have no parsed guest name, and the schema does not require
    // `episodeNumber` at all — `podcast:report` exists partly to count its nulls.
    const { enrichment, errors } = parseEnrichment({
      source: "s",
      constraint: "c",
      reviewNote: "r",
      episodes: [
        { guid: "g", episodeNumber: null, guestName: null, guestBio: "b", topics: ["leadership"] },
      ],
    });
    expect(errors).toEqual([]);
    expect(enrichment).not.toBeNull();
  });
});

/**
 * The committed file against the real corpus — the row that makes every bio's
 * traceability a PR gate rather than a one-time check at authoring time.
 */
describe("content/episode-enrichment.json against the real snapshot", () => {
  const enrichment = parsedEnrichment.enrichment!;
  const sources = EPISODES.map((entry) => ({
    guid: entry.guid,
    title: entry.title,
    description: entry.description,
  }));

  test("all 39 episodes are covered, with no extras and no duplicates", () => {
    expect(enrichment.episodes.length).toBe(EPISODES.length);
    expect(new Set(enrichment.episodes.map((entry) => entry.guid)).size).toBe(EPISODES.length);
  });

  test("every bio is clean against ITS OWN episode, and every topic is in the taxonomy", () => {
    const { errors } = validateEnrichmentFile(enrichment, sources, TAXONOMY_SLUGS);
    expect(errors).toEqual([]);
  });

  test("...and that result is not vacuous — a corrupted bio in the same file fails", () => {
    // The row above would stay green against a validateEnrichmentFile that
    // always returned no errors. This one runs the SAME function over the SAME
    // corpus with one bio deliberately broken, so the clean result above means
    // "checked and clean" rather than "not checked".
    const corrupted = {
      ...enrichment,
      episodes: enrichment.episodes.map((item, index) =>
        index === 0 ? { ...item, guestBio: `${item.guestBio} Acme Zeppelin Corp did this.` } : item,
      ),
    };

    const { errors } = validateEnrichmentFile(corrupted, sources, TAXONOMY_SLUGS);
    expect(errors.join(" ")).toContain("Acme");
  });

  test("every entry's episodeNumber and guestName match the snapshot", () => {
    // These two fields exist for the PR reviewer, who reads the diff by episode
    // number rather than by guid. A drifted number would misdirect the review
    // without affecting a single mutation, so nothing else would notice.
    const byGuid = new Map(EPISODES.map((entry) => [entry.guid, entry]));
    for (const entry of enrichment.episodes) {
      const source = byGuid.get(entry.guid)!;
      expect(entry.episodeNumber).toBe(source.episodeNumber ?? null);
      expect(entry.guestName).toBe(source.guestName ?? null);
    }
  });

  test("no topic in the taxonomy ends up with zero episodes", () => {
    // A topic document nothing references is the long-tail failure the 12–18
    // band exists to avoid, and US-110's report prints it as a defect. Catching
    // it here means it never ships rather than being reported after it has.
    const used = new Set(enrichment.episodes.flatMap((entry) => entry.topics));
    expect(TAXONOMY_SLUGS.filter((slug) => !used.has(slug))).toEqual([]);
  });

  test("the file carries its provenance note, and that note does not say 'verified'", () => {
    // Worth being clear about what this can and cannot do: it asserts prose
    // that was authored into the artifact, so it proves the REVIEWER IS TOLD
    // the constraint — not that the constraint was honoured. Nothing in a JSON
    // file can prove no outside research was used. What actually enforces that
    // is validateEnrichment, exercised over the real corpus two rows above.
    expect(enrichment.source).toContain("catalogue.snapshot.json");
    expect(enrichment.reviewNote.toLowerCase()).toContain("entities-and-numbers: clean");
    expect(enrichment.reviewNote).toContain("never 'verified'");
  });
});

/* --------------------------------------------------------------------- *
 * The mutation plan
 * --------------------------------------------------------------------- */

const GUID = EPISODES[0]!.guid;
const PUBLISHED_ID = episodeDocId(GUID);
const DRAFT_ID = draftDocId(GUID);

const entry: EnrichmentEntry = {
  guid: GUID,
  episodeNumber: 1,
  guestName: "A Guest",
  guestBio: "A bio long enough to clear the floor.",
  topics: ["leadership", "scaling"],
};

/**
 * A realistic published episode — including the fields a FROZEN one carries.
 *
 * `slug` and `slugFrozenAt` are here deliberately. An earlier version of this
 * fixture omitted them and then asserted the emitted mutations contained no
 * `slugFrozenAt`, which proved nothing: the value was never in the input. Real
 * published episodes are frozen and do carry it, copying it into the draft is
 * correct, and the Studio's publish action drops both before republishing
 * (`studio/actions/publish-episode.ts`'s `OMITTED_FIELDS`).
 */
const publishedDoc = {
  _id: PUBLISHED_ID,
  _type: "episode",
  _rev: "abc",
  _createdAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-02T00:00:00Z",
  title: "A title",
  slug: { _type: "slug", current: "a-title" },
  slugFrozenAt: "2026-01-01T00:00:00Z",
  topics: [{ _type: "reference", _ref: "topic-old", _key: "topic-old" }],
};

describe("draft ids and topic references", () => {
  test("the draft id is 'drafts.' + the deterministic published id", () => {
    expect(DRAFT_ID).toBe(`drafts.${PUBLISHED_ID}`);
    expect(PUBLISHED_ID).toBe(episodeDocId(GUID));
  });

  test("a topic reference carries _key === _ref, exactly as publish.ts would key it", () => {
    // `keyedTopics()` (src/lib/sanity/publish.ts:189) sets each `_key` to the
    // referenced topic's id. Writing anything else here means the first publish
    // after enrichment rewrites every key for no reason.
    const reference = topicReference("mental-health");
    expect(reference).toEqual({
      _type: "reference",
      _ref: "topic-mental-health",
      _key: "topic-mental-health",
    });
  });
});

describe("buildEnrichmentPlan — one ordered pair per episode", () => {
  test("a published document yields createIfNotExists THEN patch, in that order", () => {
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });

    expect(plan.mutations).toEqual([
      {
        createIfNotExists: {
          _id: DRAFT_ID,
          _type: "episode",
          title: "A title",
          slug: { _type: "slug", current: "a-title" },
          slugFrozenAt: "2026-01-01T00:00:00Z",
          topics: [{ _type: "reference", _ref: "topic-old", _key: "topic-old" }],
        },
      },
      {
        patch: {
          id: DRAFT_ID,
          set: {
            guestBio: entry.guestBio,
            topics: [topicReference("leadership"), topicReference("scaling")],
          },
        },
      },
    ]);
  });

  test("the draft copy drops Sanity's bookkeeping but keeps array _keys", () => {
    // `_rev` in a create is an optimistic-locking assertion against a revision
    // that is about to change. `_key`s are the opposite case: publish.ts's
    // recursive strip() drops them, which is right for a content comparison and
    // wrong for a document copy — a draft whose topics lost their keys is a
    // draft whose array entries lost their identity.
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });
    const created = (plan.mutations[0] as { createIfNotExists: Record<string, unknown> })
      .createIfNotExists;

    for (const key of ["_rev", "_createdAt", "_updatedAt", "_originalId"]) {
      expect(created).not.toHaveProperty(key);
    }
    expect((created.topics as { _key: string }[])[0]!._key).toBe("topic-old");
  });

  test("the frozen slug IS copied into the draft, and that is correct", () => {
    // Not a leak. The draft needs a slug or the Studio's publish action refuses
    // it outright ("this episode needs a URL slug before it can be published"),
    // and that action then drops both fields via OMITTED_FIELDS before
    // republishing, while publish.ts re-derives them from the published
    // document. Asserted against a fixture that actually carries them, so this
    // says something.
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });
    const created = (plan.mutations[0] as { createIfNotExists: Record<string, unknown> })
      .createIfNotExists;

    expect(created.slug).toEqual({ _type: "slug", current: "a-title" });
    expect(created.slugFrozenAt).toBe("2026-01-01T00:00:00Z");
  });

  test("a missing published document emits NOTHING for that episode, and says why", () => {
    // The create would have to invent a document with no _type, no title and no
    // audioUrl. Enrichment enriches an archive; it does not create one.
    const plan = buildEnrichmentPlan([entry], { published: new Map() });

    expect(plan.mutations).toEqual([]);
    expect(plan.skipped).toBe(1);
    expect(plan.entries[0]!.skippedReason).toContain("will not invent one");
  });

  test("every episode gets the same two mutations — there are no per-episode variants", () => {
    // The authority specifies one createIfNotExists → patch pair per episode.
    // An earlier version emitted three different shapes depending on what
    // already existed, which broke that guarantee for two of them.
    const second: EnrichmentEntry = { ...entry, guid: `${GUID}-second` };
    const plan = buildEnrichmentPlan([entry, second], {
      published: new Map([
        [PUBLISHED_ID, publishedDoc],
        [episodeDocId(second.guid), { ...publishedDoc, _id: episodeDocId(second.guid) }],
      ]),
    });

    expect(plan.skipped).toBe(0);
    expect(plan.mutations).toHaveLength(4);
    expect(plan.mutations.map((mutation) => Object.keys(mutation as object)[0])).toEqual([
      "createIfNotExists",
      "patch",
      "createIfNotExists",
      "patch",
    ]);
  });

  /**
   * The contract, stated at the precision it actually holds.
   *
   * `createIfNotExists` protects every field on an existing draft. The patch
   * that follows overwrites exactly two. So the file is the source of truth for
   * `guestBio` and `topics` until publication, and the Studio is the source of
   * truth for everything else — which is narrower than "an in-progress draft is
   * never clobbered", and is what the code actually does.
   */
  test("the patch writes exactly two fields, and names them", () => {
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });
    const patch = (plan.mutations[1] as { patch: { set: Record<string, unknown> } }).patch;

    expect(Object.keys(patch.set).sort()).toEqual(["guestBio", "topics"]);
  });

  test("createIfNotExists is the verb, so EVERY OTHER field on an existing draft survives", () => {
    // Deliberately not titled "an in-progress draft is never clobbered": the
    // patch immediately after this create overwrites guestBio and topics on
    // purpose, so the unqualified claim would be false and this test would be
    // asserting something the next mutation contradicts. What the VERB buys is
    // everything else on the draft — title, excerpt, artwork, guest photo.
    // `createOrReplace` here would take those too.
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });

    const verbs = plan.mutations.map((mutation) => Object.keys(mutation as object)[0]);
    expect(verbs).toEqual(["createIfNotExists", "patch"]);
    expect(verbs).not.toContain("createOrReplace");
    expect(verbs).not.toContain("create");
  });
});

/**
 * AC-5.4's "never auto-published", proven structurally.
 *
 * A comment saying "this never publishes" is worth nothing; these two rows are
 * what make it true. The first says no mutation this module can emit is a
 * publish-shaped one; the second says the module cannot even reach the function
 * that would perform one.
 */
describe("never auto-published", () => {
  test("no mutation the plan emits touches a published id or a slugLock", () => {
    const plan = buildEnrichmentPlan([entry], {
      published: new Map([[PUBLISHED_ID, publishedDoc]]),
    });

    // No slugLock is constructed here — publish.ts is the sole writer of those
    // (layering.test.ts enforces it), and a lock is what binds a permanent URL.
    //
    // `slugFrozenAt` is deliberately NOT asserted absent: the draft copy carries
    // it, which is correct, and the test above says why. An earlier version
    // asserted its absence against a fixture that never had it — a check that
    // could not fail.
    expect(JSON.stringify(plan.mutations)).not.toContain("slugLock");

    // Every id this plan writes to is a draft id. The published document is
    // READ from and copied, never written to.
    for (const mutation of plan.mutations) {
      const target = mutation as {
        createIfNotExists?: { _id: string };
        patch?: { id: string };
      };
      const id = target.createIfNotExists?._id ?? target.patch?.id;
      expect(id).toBe(DRAFT_ID);
    }
  });

  test("enrichment.ts imports nothing from publish.ts", () => {
    // Read as text, the way layering.test.ts enforces its boundaries: an import
    // is the only way the publish path could be reached from here, so its
    // absence is the guarantee. A type-level assertion could not go red.
    //
    // Comments are stripped first, and that is not a convenience. This module's
    // header explains at length what it does NOT do, naming the publish
    // function to do so — so a raw-text scan would fail on the documentation
    // that exists to describe the very rule being asserted. Stripping comments
    // makes the assertion about code, which is what it always claimed to be.
    // Both halves of the pipeline, not just the library. Scanning only
    // enrichment.ts would leave the claim true of the module while the script
    // shell imported the publish path directly — and the shell is what an
    // operator actually runs.
    const files = [
      path.join(import.meta.dir, "enrichment.ts"),
      path.join(REPO_ROOT, "scripts", "apply-enrichment.ts"),
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

      expect({ file, match: /from\s+["'].*\/publish["']/.test(code) }).toEqual({
        file,
        match: false,
      });
      expect({ file, publishes: code.includes("publishEpisode") }).toEqual({
        file,
        publishes: false,
      });
    }

    const code = readFileSync(files[0]!, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    // Floor: prove the strip left real code behind rather than emptying the
    // file, which would make both assertions above vacuously true.
    expect(code).toContain("export function validateEnrichment");
    expect(code).toContain("createIfNotExists");
  });
});

describe("applyEnrichment", () => {
  const deps = (documents: Record<string, unknown>[]) => {
    const calls: { reads: string[][]; writes: unknown[][] } = { reads: [], writes: [] };
    const injected: EnrichmentApplyDeps = {
      getDocuments: async (ids) => {
        calls.reads.push(ids);
        return documents;
      },
      mutate: async (mutations) => {
        calls.writes.push(mutations);
        return {};
      },
    };
    return { injected, calls };
  };

  test("a dry run performs no read and no write", () => {
    const { injected, calls } = deps([]);
    return applyEnrichment([entry], { dryRun: true }, injected).then((report) => {
      expect(calls.reads).toEqual([]);
      expect(calls.writes).toEqual([]);
      expect(report.transactionsSubmitted).toBe(0);
    });
  });

  test("the dry run shows the SAME two-mutation shape the live run submits", () => {
    // An earlier version planned patches only, on the grounds that it could not
    // know the create's body without a read. That understated the transaction:
    // a reviewer saw 39 mutations where the live run submits 78, and never saw
    // the verb carrying the non-clobbering guarantee. The body is stubbed and
    // labelled; the shape and the `set` payload are real.
    const plan = buildDryRunPlan([entry]);
    const verbs = plan.mutations.map((mutation) => Object.keys(mutation as object)[0]);

    expect(verbs).toEqual(["createIfNotExists", "patch"]);
    expect(plan.mutations[1]).toEqual({
      patch: {
        id: DRAFT_ID,
        set: {
          guestBio: entry.guestBio,
          topics: [topicReference("leadership"), topicReference("scaling")],
        },
      },
    });
  });

  test("a live run reads only the published ids and submits ONE transaction", () => {
    const { injected, calls } = deps([publishedDoc]);
    return applyEnrichment([entry], { dryRun: false }, injected).then((report) => {
      // Drafts are deliberately not read: createIfNotExists decides correctly
      // whether or not one exists, so their state changes no mutation.
      expect(calls.reads[0]).toEqual([PUBLISHED_ID]);
      // One array, one request — matching applyTopics. A half-applied
      // enrichment leaves a state a re-run cannot distinguish from a fresh one.
      expect(calls.writes).toHaveLength(1);
      expect(report.transactionsSubmitted).toBe(1);
      expect(report.applied).toBe(1);
    });
  });

  test("a failed read propagates and NOTHING is written", () => {
    // The difference from applyTopics, where a failed pre-read was reporting
    // only and the write continued. Here the read decides which mutations exist
    // at all, so continuing through it would mean writing a plan built on no
    // information.
    const calls: unknown[][] = [];
    const injected: EnrichmentApplyDeps = {
      getDocuments: async () => {
        throw new Error("network down");
      },
      mutate: async (mutations) => {
        calls.push(mutations);
        return {};
      },
    };

    return applyEnrichment([entry], { dryRun: false }, injected).then(
      () => {
        throw new Error("expected the read failure to propagate");
      },
      (error: Error) => {
        expect(error.message).toContain("network down");
        expect(calls).toEqual([]);
      },
    );
  });

  test("a run that cannot cover every episode is REFUSED, and writes nothing", () => {
    const { injected, calls } = deps([]);
    return applyEnrichment([entry], { dryRun: false }, injected).then((report) => {
      expect(report.skipped).toBe(1);
      expect(report.refusedForSkips).toBe(true);
      expect(calls.writes).toEqual([]);
      expect(report.transactionsSubmitted).toBe(0);
    });
  });

  /**
   * The partial-coverage failure, and why refusing beats reporting.
   *
   * The original behaviour enriched what it could and printed the rest as a
   * skip list — which meant `podcast:enrich` could exit 0 having enriched 34 of
   * 39 episodes. The five left at `guestBio: null` are exactly the ones nobody
   * would think to check, so the coverage guarantee read as met precisely when
   * it was not.
   *
   * A skip cannot happen in ordinary operation: the file is validated against
   * the snapshot before this runs, so every entry names an episode that exists.
   * A state-3 episode means the dataset diverged from the snapshot, which is an
   * operator's problem to resolve rather than something to enrich around.
   */
  test("one uncoverable episode refuses the whole run, including the coverable ones", () => {
    const other: EnrichmentEntry = { ...entry, guid: `${GUID}-second` };
    const { injected, calls } = deps([publishedDoc]); // exists for `entry`, not for `other`

    return applyEnrichment([entry, other], { dryRun: false }, injected).then((report) => {
      expect(report.refusedForSkips).toBe(true);
      expect(report.skipped).toBe(1);
      // The point: the episode that COULD have been enriched was not, because a
      // partial success is the outcome this refusal exists to prevent.
      expect(calls.writes).toEqual([]);
      expect(report.mutations).toEqual([]);
      expect(report.transactionsSubmitted).toBe(0);
    });
  });
});
