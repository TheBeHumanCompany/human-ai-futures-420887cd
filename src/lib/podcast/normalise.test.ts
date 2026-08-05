import { describe, expect, test } from "bun:test";

import { STOPWORDS, capAtWordBoundary, foldDiacritics, kebab, keywordSlug } from "./normalise";

describe("foldDiacritics", () => {
  test("strips a combining accent off a name", () => {
    expect(foldDiacritics("João")).toBe("Joao");
  });

  test("strips a combining accent off an ordinary word", () => {
    expect(foldDiacritics("café")).toBe("cafe");
  });
});

describe("kebab", () => {
  test("lowercases and hyphenates a plain name", () => {
    expect(kebab("Jill De Chavez")).toBe("jill-de-chavez");
  });

  test("a possessive apostrophe is its own hyphen run: the trailing s survives as its own token", () => {
    // The apostrophe in "Ribeiro's" is a one-character non-alphanumeric run
    // distinct from the space before it, so it becomes its own hyphen rather
    // than merging the "s" back onto "ribeiro".
    expect(kebab("Joao Ribeiro's")).toBe("joao-ribeiro-s");
  });
});

describe("keywordSlug", () => {
  test("drops stopwords and preserves word order", () => {
    // Double space and a colon exercise tokenizing on non-alphanumeric
    // boundaries: consecutive separators just produce no empty tokens.
    expect(keywordSlug("Leading with Heart:  on Building a People-First Business")).toBe(
      "leading-heart-building-people-first-business",
    );
  });

  test("drops 'how', a real stopword from this feed's titles", () => {
    expect(keywordSlug("How Glyn Lewis Creates Community")).toBe("glyn-lewis-creates-community");
  });

  test("STOPWORDS contains the words the two cases above rely on", () => {
    expect(STOPWORDS.has("how")).toBe(true);
    expect(STOPWORDS.has("with")).toBe(true);
    expect(STOPWORDS.has("a")).toBe(true);
  });
});

describe("capAtWordBoundary", () => {
  test("truncates back to the last complete word rather than cutting mid-word", () => {
    // maxLength=11 lands inside "f" (index 10 of "a-b-c-d-e-f-g-h"); the cut
    // must land on the hyphen before it, at "a-b-c-d-e", not mid-token.
    const result = capAtWordBoundary("a-b-c-d-e-f-g-h", 11);
    expect(result).toBe("a-b-c-d-e");
    expect(result.endsWith("-")).toBe(false);
  });

  test("passes an already-short slug through unchanged", () => {
    const slug = "jill-de-chavez";
    expect(capAtWordBoundary(slug, 40)).toBe(slug);
  });
});
