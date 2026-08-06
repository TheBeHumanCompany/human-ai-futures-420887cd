import { describe, expect, test } from "bun:test";

import { IS_ENRICHED_FRAGMENT } from "./enriched";
import { evaluateGroq } from "./groq-eval";

/**
 * The `isEnriched` truth table (Decision D1, Decision H). All six rows are
 * evaluated by running the REAL exported `IS_ENRICHED_FRAGMENT` through
 * `groq-js`'s actual parser and evaluator — never a hand-written JavaScript
 * re-implementation of the predicate. A JS mirror can agree with every
 * expectation below while the exported GROQ fragment itself is broken; that
 * is false-green audit row 16, and this file exists specifically so that
 * class of bug cannot hide behind a passing test.
 *
 * A valid image reference, reused across rows that need one. Only the
 * `asset._ref` leaf matters to the predicate — everything else a real
 * `guestPhoto` field carries (`alt`, hotspot/crop) is irrelevant here.
 */
const VALID_PHOTO = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-aaaa1111-800x800-jpg" },
};

/**
 * The `guestPhoto` wrapper Studio leaves behind before any image has been
 * uploaded: the field has been touched but carries no `asset` at all, so
 * `guestPhoto.asset._ref` is undefined rather than merely present-but-empty.
 */
const EMPTY_PHOTO_WRAPPER = { _type: "image" };

const VALID_BIO = "Jane Doe is a researcher working on AI safety.";

describe("IS_ENRICHED_FRAGMENT", () => {
  /**
   * Expected values are the REAL GROQ result, not a boolean coercion of it.
   * GROQ's `&&` is three-valued: `true && null` evaluates to `null`, not
   * `false` — it propagates the indeterminate operand instead of collapsing
   * it. That is why the null-bio row below expects `null` rather than
   * `false`, even though both mean "not enriched" wherever this fragment is
   * consumed downstream (a template's truthiness check, a GROQ filter). A
   * hand-written JS mirror using `(guestBio?.length ?? 0) > 0` would produce
   * a plain `false` for that row and never reveal this — exactly the
   * mismatch this file is testing against by evaluating the real fragment.
   */
  test.each<[string, Record<string, unknown>, boolean | null]>([
    ["guestPhoto absent, guestBio absent", {}, false],
    [
      "guestPhoto wrapper present but no asset._ref, guestBio valid",
      { guestPhoto: EMPTY_PHOTO_WRAPPER, guestBio: VALID_BIO },
      false,
    ],
    ["guestPhoto valid _ref, guestBio null", { guestPhoto: VALID_PHOTO, guestBio: null }, null],
    [
      "guestPhoto valid _ref, guestBio empty string",
      { guestPhoto: VALID_PHOTO, guestBio: "" },
      false,
    ],
    [
      // Documented and accepted (see enriched.ts), not a bug: GROQ has no
      // trim(), so length("   ") > 0 is true. The practical guard is Studio
      // validation (Rule.required().min(20) on guestBio). Do not "fix" this
      // row to expect `false` — that would be pinning a regression.
      "guestPhoto valid _ref, guestBio whitespace-only — documented enriched",
      { guestPhoto: VALID_PHOTO, guestBio: "   " },
      true,
    ],
    [
      "guestPhoto valid _ref, guestBio valid text",
      { guestPhoto: VALID_PHOTO, guestBio: VALID_BIO },
      true,
    ],
  ])("%s", async (_label, root, expected) => {
    const result = await evaluateGroq(IS_ENRICHED_FRAGMENT, { root, dataset: [] });
    expect(result).toBe(expected);
  });
});
