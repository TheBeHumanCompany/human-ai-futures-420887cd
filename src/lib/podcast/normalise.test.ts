import { describe, expect, test } from "bun:test";

import { type Browsable, DEFAULT_BROWSE_STATE, browseEpisodes } from "../podbean/filter";
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

/**
 * `podbean/filter.ts` has its own module-private `normalise()` (NFD-fold +
 * lowercase + strip to `\p{L}\p{N}` + collapse whitespace) that this file's
 * `foldDiacritics`/`keywordSlug` deliberately duplicate rather than import —
 * see this file's header comment for why. Duplicated logic drifts silently,
 * so this pins the two against each other (P3/P5).
 *
 * There is no importable seam to assert equality directly: neither
 * `normalise` nor `matchesQuery` (its only caller) is exported from
 * `filter.ts`. `browseEpisodes` is the outermost function that observably
 * depends on `normalise`'s folding, so agreement is asserted by driving a
 * query through it and separately pinning this file's fold of the same
 * string, rather than by importing the private function.
 */
describe("agrees with podbean/filter.ts's private search normalisation (P3/P5)", () => {
  function episode(overrides: Partial<Browsable>): Browsable {
    return {
      title: "",
      excerpt: "",
      durationSeconds: 3000,
      pubDate: "2025-06-01",
      episodeNumber: null,
      ...overrides,
    };
  }

  test.each([
    ["sao paulo", "São Paulo Summit", "sao paulo summit"],
    ["cafe", "The café Chronicles", "the cafe chronicles"],
    // The guest behind the shipped "joao-ribeiro-..." slug (slugs.snapshot.json).
    ["joao ribeiro", "João Ribeiro's Banana Brownies", "joao ribeiro's banana brownies"],
  ])(
    "query %j finds title %j, whose fold this file computes as %j",
    (query, title, expectedFold) => {
      // Pin this file's own fold of the accented title first: if
      // `foldDiacritics` ever narrowed its combining-mark range, this would
      // fail here even in a fixture that doesn't reach `browseEpisodes`.
      expect(foldDiacritics(title).toLowerCase()).toBe(expectedFold);

      // Then confirm `filter.ts`'s private `normalise()` folds the *query*
      // compatibly: if it diverged (e.g. a narrower Unicode range, or
      // case-folding differently), this accented query would stop matching
      // this accented title through `browseEpisodes` — its only public
      // consumer.
      const result = browseEpisodes([episode({ title })], { ...DEFAULT_BROWSE_STATE, query });
      expect(result).toHaveLength(1);
    },
  );
});

/**
 * The plan calls for "every term of normalise(query) is a prefix of some
 * token of normalise(searchText)". Neither `filter.ts` nor this file exports
 * a function literally named `normalise` that a caller can invoke on
 * arbitrary text, so "normalise" here is read as the fold + tokenise recipe
 * this file already uses (`foldDiacritics` + lowercase + split on non-alnum
 * runs, the same technique `keywordSlug` applies internally).
 *
 * Note this is a SUFFICIENT condition for a match, not the literal
 * implementation: `filter.ts`'s `matchesQuery` checks each term as a
 * substring of the whole normalised haystack, which is strictly more
 * permissive than "prefix of a token" (e.g. "eco" is a substring of "second"
 * without being a prefix of any token in it). Every query term chosen below
 * IS constructed as a genuine token prefix, which is why the search below is
 * also asserted to succeed through `browseEpisodes` — a prefix of a token is
 * always a substring of it, so this property entails a real match.
 */
describe("every term of a normalised query is a prefix of some token of the normalised search text", () => {
  function tokensOf(text: string): string[] {
    return foldDiacritics(text.toLowerCase()).match(/[a-z0-9]+/g) ?? [];
  }

  function episode(overrides: Partial<Browsable>): Browsable {
    return {
      title: "",
      excerpt: "",
      durationSeconds: 3000,
      pubDate: "2025-06-01",
      episodeNumber: null,
      ...overrides,
    };
  }

  test.each([
    { query: "resilien", searchText: "Lessons in Resilience and Leadership" },
    { query: "sao paulo", searchText: "São Paulo Summit" },
    { query: "joao ribeiro", searchText: "João Ribeiro's Banana Brownies" },
  ])("every term of $query is a prefix of some token of $searchText", ({ query, searchText }) => {
    const queryTerms = foldDiacritics(query.toLowerCase()).match(/[a-z0-9]+/g) ?? [];
    expect(queryTerms.length).toBeGreaterThan(0);

    const textTokens = tokensOf(searchText);
    for (const term of queryTerms) {
      expect(textTokens.some((token) => token.startsWith(term))).toBe(true);
    }

    // The prefix property is a sufficient condition for filter.ts's actual
    // substring-based matching, so it should also actually find the episode
    // through the public surface it feeds.
    const result = browseEpisodes([episode({ title: searchText })], {
      ...DEFAULT_BROWSE_STATE,
      query,
    });
    expect(result).toHaveLength(1);
  });
});
