/**
 * Archive enrichment — the traceability validator and the mutation plan.
 *
 * Task 10 drafts a `guestBio` and a `topics[]` assignment for all 39 episodes
 * **from each episode's own `title` and `description` and nothing else**. There
 * is no model API key here, no network call, and no research step: the drafting
 * is an authoring pass whose output is a committed JSON artifact
 * (`content/episode-enrichment.json`) reviewed as a PR diff, deliberately the
 * same shape as Decision B's slug review. This module is what makes the
 * no-outside-research rule mechanical rather than aspirational.
 *
 * Pure by rule: no `node:` import, no filesystem, no network — the same rule
 * `topics.ts` states, for the same reason. It lives under `src/` because the PR
 * gate is `bun test src/`, and a rule that lives under `scripts/` is a rule the
 * gate cannot see.
 *
 * ## What this validator proves, and what it does not
 *
 * It proves that **every capitalised token and every numeric literal in a bio
 * already appears in that episode's own source text**. That is a real guarantee
 * and it kills the two failures that would be hardest to spot in a 39-row diff:
 * a company that does not exist, and a number nobody said.
 *
 * It does **not** prove the bio is true. Pre-mortem #3 is about exactly this:
 * a sentence saying a founder *"sold"* the company her description says she
 * *"stepped back from"* uses only real entities in an invented relationship, and
 * passes every check here. So the clean result is labelled
 * `entities-and-numbers: clean` and **never "verified"** — the label is the
 * mitigation, because it sets what a reviewer thinks is left to do. Relational
 * accuracy stays a human judgement, made against a diff, before a human presses
 * Publish.
 *
 * The claim-verb extraction below is the other half of that: the verbs that
 * carry relational claims are surfaced as individual sign-off line items so they
 * are read one at a time rather than skimmed inside prose.
 */
import { episodeDocId } from "./doc-id";
import { MAX_TOPICS_PER_EPISODE, topicDocId } from "./topics";

/**
 * The two labels this module can emit, and the reason they are constants.
 *
 * Pre-mortem #3's failure is a reviewer reading "39/39 clean" as "39/39
 * verified". Naming the strings here — rather than building them at each call
 * site — is what lets `enrichment.test.ts` assert that the word "verified"
 * cannot appear in any status this validator produces. That assertion is the
 * mitigation; without it the label is a comment.
 */
export const CLEAN_LABEL = "entities-and-numbers: clean";
export const ISSUES_LABEL = "entities-and-numbers: issues found";

/**
 * Bio length bounds, in characters, measured after trimming.
 *
 * The floor mirrors `rule.min(20)` on `studio/schemaTypes/episode.ts`'s
 * `guestBio` — and trimming matters there specifically: that Studio rule cannot
 * detect a whitespace-only bio, and neither can the GROQ `isEnriched` predicate
 * (`src/lib/sanity/enriched.ts` says so explicitly, because GROQ has no
 * `trim()`). This is the one place in the pipeline that can, so it does.
 *
 * The ceiling is the detail page's, not the datastore's: `guestBio` is excluded
 * from `EPISODE_LIST_PROJECTION` so it costs the directory nothing, but a bio
 * long enough to need its own scroll is a bio nobody read before publishing it.
 */
export const BIO_MIN_LENGTH = 20;
export const BIO_MAX_LENGTH = 400;

/**
 * The verbs that carry a relational claim, enumerated form by form.
 *
 * The seven stems are the consensus plan's Task 10 list. Each asserts a
 * relationship between entities rather than the existence of one, which is
 * precisely the class the entity check cannot see.
 *
 * **Written out rather than generated from stems, because generating them was
 * silently wrong.** The previous version matched `(stem)(s|d|ed|ing)?`, which
 * produces "raiseing" for raise + ing and therefore never matched **raising**
 * at all. That was not hypothetical: episode 16's bio says "raising capital",
 * and episode 16 was missing from the sign-off list entirely — a real
 * relational claim that no human was ever asked to check, in the one mechanism
 * built to make sure they were. "acquiring" had the same defect.
 *
 * An explicit list cannot be subtly wrong in that way. It can only be
 * incomplete, which is visible.
 *
 * Role claims are handled separately, by `extractRoleClaims` below, rather than
 * being mixed in here — see its own note for why.
 */
export const CLAIM_VERB_FORMS = [
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
] as const;

/**
 * The role a bio assigns its guest.
 *
 * "founder of X" versus "co-founder of X" is a relational claim of exactly the
 * kind the entity check cannot see — both words are lower case, so every token
 * in the sentence is sourced whichever one is wrong — and it is among the
 * likeliest to upset a guest.
 *
 * **An earlier version left these out**, arguing that every bio makes a role
 * claim so listing them all would drown the sign-off list. Review called that
 * what it was: "the list would be long" is a readability argument, not a safety
 * one. It is fixed here by SEPARATION rather than omission — roles get their own
 * list, so the claim-verb list keeps its signal and the role claims still get
 * read. A one-time audit that lives only in a commit message is not a control;
 * this is.
 */
export const ROLE_CLAIM_TERMS = [
  // Plurals are listed explicitly, and are not decoration: episode 6 says "the
  // dynamic founders of Minta" — two people, one of the few co-founded shows in
  // the corpus — and a singular-only list silently dropped it from the sign-off
  // entirely. Exactly the class of miss that "raiseing" was for the verbs.
  // Longer forms precede their prefixes so "co-founder" reports as itself.
  "co-founders",
  "co-founder",
  "cofounders",
  "cofounder",
  "founders",
  "founder",
  "ceos",
  "ceo",
  "owners",
  "owner",
  "presidents",
  "president",
  "directors",
  "director",
  "chairman",
  "chairs",
  "chair",
  "partners",
  "partner",
] as const;

/** One relational claim, with the sentence it was made in. */
export interface ClaimVerbSighting {
  /** The matched surface form, e.g. "founded". */
  verb: string;
  /** The sentence it appears in — the unit a human signs off on. */
  sentence: string;
}

export interface EnrichmentReport {
  /** `CLEAN_LABEL` or `ISSUES_LABEL`. Never the word "verified". */
  label: string;
  /** Empty when clean. Every issue, not the first, so one pass fixes the bio. */
  errors: string[];
  /**
   * Relational claims needing per-episode human sign-off. These are NOT errors
   * and never affect `label` — surfacing them is the whole point.
   */
  claimVerbs: ClaimVerbSighting[];
  /**
   * Role assertions needing the same per-episode human sign-off, kept in their
   * own list so they do not drown the verb claims. Also never errors.
   */
  roleClaims: ClaimVerbSighting[];
}

/**
 * Word tokens: runs of letters, split on everything else.
 *
 * Splitting this way resolves three cases that would otherwise be false
 * failures:
 *
 *   - possessives: "Alexandra's" → `Alexandra`, `s`
 *   - hyphenates: "AI-powered" → `AI`, `powered`; "human-centred" → both halves
 *   - digits glued to text: "PCOS2" splits, and neither half is invented
 *
 * Words and numbers are tokenised separately and checked by different rules — a
 * capitalised word against the source's capitalised words, a numeric literal
 * against the source's numeric literals. Sharing one token space would let
 * "2024" satisfy a check meant for "Lululemon".
 */
const WORD_TOKEN = /[\p{L}\p{M}]+/gu;

/**
 * A numeric literal, INCLUDING its internal separators.
 *
 * This is deliberately not `/\p{N}+/`, and the difference is a real exploit
 * rather than a tidiness point. A bare digit-run match splits "3,000" into
 * `3` and `000`, so the source's digit-run set for episode 7 — which says
 * *"a 3,000 sq. ft. clinic with 13 practitioners"* — is `{7, 3, 000, 13}`.
 * A bio claiming a **"13,000 sq. ft. clinic"** then splits to `13` and `000`,
 * both of which are in that set, and passes cleanly. That is a real guest's
 * clinic inflated more than fourfold using only digits the source contains —
 * precisely the invented-number failure this check exists to catch, walking
 * straight through it.
 *
 * Matching the whole literal and normalising it away (below) closes it:
 * "3,000" and "13,000" become the distinct literals `3000` and `13000`, and
 * only the first is in the source.
 *
 * The trailing `\p{N}` is what keeps sentence-final punctuation out — in
 * "live well past 100." the `.` is not followed by a digit, so the literal is
 * `100` rather than `100.`.
 */
const NUMERIC_LITERAL =
  /(?:(?<![\p{N}\p{L}])[-\u2212\u2012\u2013\u2796\uFF0D]\s*)?(?:\p{N}[\p{N},.\u00A0\u202F]*\p{N}|\p{N})(?:\s*%)?/gu;

/**
 * Canonicalisation, split into two normal forms on purpose.
 *
 * This is the boundary the checks below depend on, and it replaced a losing
 * game of naming individual glyphs. Review demonstrated all of these passing
 * clean against a validator that patched signs one at a time:
 *
 *   "−\u200B13"  minus + ZERO WIDTH SPACE — the sign detached from the digits
 *   "⁻13" "₋13" "﹣13"        superscript / subscript / small minus
 *   "Meta\u200Bverse"          a zero-width space splitting an invented brand
 *                              into two unremarkable halves
 *
 * **Why two functions rather than one NFKC pass.** NFKC is right for numbers and
 * WRONG for words, and using it on both opened a fresh hole: compatibility
 * composition maps "№" → "No", "℠" → "SM" and "℡" → "TEL", so a source
 * containing one of those symbols manufactures a capitalised token that never
 * appeared in it. An invented "No", "SM" or "TEL" entity then matched a source
 * that merely used "№". Fixing one direction had opened the other.
 *
 * So:
 *   - `canonicaliseText` — **NFC**. Composes "Mari\u0301a" into "María" so a
 *     decomposed name matches a composed one, without inventing letters that
 *     were never written.
 *   - `canonicaliseNumbers` — **NFKC**. Folds fullwidth "１３" onto "13" and
 *     superscript/subscript minus onto real signs, which is exactly what a
 *     numeric comparison wants and where compatibility folding is safe.
 *
 * Both drop default-ignorable characters: zero-width spaces and joiners are
 * invisible to a reader and to a diff, so a token split by one looks identical
 * to the reviewer while matching nothing.
 *
 * Applied to the bio AND the source, so the two are always compared in the same
 * normal form.
 */
const IGNORABLE = /[\p{Default_Ignorable_Code_Point}\u200B-\u200D\uFEFF]/gu;

function canonicaliseText(text: string): string {
  return text.normalize("NFC").replace(IGNORABLE, "");
}

function canonicaliseNumbers(text: string): string {
  return text.normalize("NFKC").replace(IGNORABLE, "");
}

function wordTokens(text: string): string[] {
  return text.match(WORD_TOKEN) ?? [];
}

/**
 * Numeric literals with thousands separators removed, so grouping style cannot
 * change whether two numbers are considered the same.
 *
 * "3,000" and "3000" are one number written two ways; a reader comparing a bio
 * against a description should not have to care which the author picked.
 *
 * What is deliberately NOT normalised away, because each changes the number:
 *
 *   - the decimal point — "3.5" and "35" are different
 *   - a leading minus — "-13" must not match a source's positive "13"
 *   - a trailing percent — "13%" must not match a source's bare "13"
 *
 * The last two were holes found in review: both are part of the numeric
 * expression, so dropping either lets a bio state a different quantity out of
 * digits the source happens to contain.
 */
function numericLiterals(text: string): string[] {
  return (text.match(NUMERIC_LITERAL) ?? []).map((literal) =>
    literal.replace(/[,\u00A0\u202F\s]/g, "").replace(/^[\u2212\u2012\u2013\u2796\uFF0D]/, "-"),
  );
}

/**
 * Whether a word token carries a capital anywhere in it.
 *
 * Deliberately not `/^\p{Lu}/`. Two real bypasses came out of review:
 *
 *   - **"eBay"** — the first character is lower case, so a first-character test
 *     saw no capital at all and never checked the word. Every camel-cased brand
 *     ("eBay", "iPhone", "iOS") was therefore exempt from the entire proper-noun
 *     rule, which is the opposite of what it exists to do.
 *   - **titlecase** — `\p{Lt}` (e.g. "ǅuro") is a distinct Unicode category from
 *     `\p{Lu}`, so those were missed too.
 *
 * Checking for an upper- or titlecase letter ANYWHERE catches both, and costs
 * nothing on ordinary lower-case words.
 */
const startsCapitalised = (token: string) => /[\p{Lu}\p{Lt}]/u.test(token);

/**
 * The closed set of words allowed to carry a capital without justifying it.
 *
 * **Why a fixed list beats reasoning about position.** An earlier version of
 * this validator classified each capitalised token as sentence-initial or
 * mid-sentence and applied a weaker, case-insensitive check to the first. That
 * was wrong in a way that let the exact failure this module exists to prevent
 * walk through:
 *
 *     validateEnrichment(
 *       "Apple sold the business in 2024.",
 *       "She ate an apple and later sold the business in 2024.",
 *       "",
 *     )                                            // → CLEAN, and should not be
 *
 * The source contains only the common noun "apple"; the bio invented the
 * company "Apple", and the case-insensitive check accepted it. Abbreviations
 * widened the hole further — every `.` reset the state, so `e.g. Marketing`
 * made "Marketing" sentence-initial and matched it against a lower-case
 * "marketing".
 *
 * So position is no longer consulted at all. **Every capitalised token must
 * appear capitalised in the episode's own source text**, except the function
 * words below, which are exempt outright. Those carry no claim about anybody:
 * no episode description is made more or less true by whether it opens a
 * sentence with "She" or "After".
 *
 * This is both stricter and simpler — there is no sentence-boundary walk left
 * to be wrong, and "Apple" now fails wherever it appears. The cost is that a
 * bio may not open a sentence with an ordinary word the source only ever uses
 * in lower case ("Launching…" against "…from launching just months before"),
 * which is a prose constraint on the author rather than a hole in the check.
 *
 * **The list is exactly the four words the shipped corpus needs, and no more.**
 * Every entry is an exemption someone can hide behind, so the list is derived by
 * measurement rather than by imagining what an author might want.
 *
 * An earlier version carried ~60 entries "for symmetry" and claimed to be as
 * short as the corpus allowed. It was not, and the surplus was load-bearing in
 * the wrong direction: any word that is both a function word and a plausible
 * name let a claim through. `Out magazine`, `All detergent` and `Now Foods` all
 * passed against sources that never mention them — and, because both halves were
 * exempt, so did **`The Who`**, an invented entity built entirely out of
 * exemptions.
 *
 * Measured against the 39 committed bios, exactly four exemptions are used:
 * `she`, `her`, `their`, `after`. The rest are gone.
 *
 * The cost is real and is the right trade: a future bio may not open a sentence
 * with "In", "With" or "From" unless that episode's own text capitalises the
 * word somewhere. Adding an exemption is then a deliberate, reviewed edit here —
 * which is exactly the friction an exemption should carry, given each one is a
 * hole in the only mechanical check standing between a draft and a real person's
 * page.
 */
const EXEMPT_CAPITALS = new Set(["she", "her", "their", "after"]);

/** Every capitalised word token in the text, in order, duplicates included. */
function capitalisedTokens(text: string): string[] {
  return wordTokens(text).filter(startsCapitalised);
}

/** Splits a bio into sentences for claim-verb attribution. */
function sentences(bio: string): string[] {
  return bio
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * Every claim verb in the bio, one sighting per sentence it appears in.
 *
 * Matched on the stem with an optional inflection (`-s`, `-d`, `-ed`, `-ing`)
 * so the tense a bio happens to use does not decide whether a relational claim
 * gets reviewed. Bounded by a word boundary at both ends: "sold" must not fire
 * on "soldering", and "led" must not fire on "ledger" or "fuelled".
 */
function sightings(bio: string, pattern: RegExp): ClaimVerbSighting[] {
  const found: ClaimVerbSighting[] = [];
  for (const sentence of sentences(canonicaliseText(bio))) {
    for (const [term] of sentence.matchAll(pattern)) found.push({ verb: term, sentence });
  }
  return found;
}

/**
 * Every role a bio assigns, one sighting per sentence.
 *
 * "co-founder" is listed before "founder" and matched with a preceding
 * boundary that allows the hyphen, so "co-founder" reports as itself rather
 * than as a bare "founder" — the distinction is the entire point of surfacing
 * these, so collapsing it would defeat the mechanism.
 */
export function extractRoleClaims(bio: string): ClaimVerbSighting[] {
  return sightings(bio, new RegExp(`(?<![\\p{L}-])(${ROLE_CLAIM_TERMS.join("|")})\\b`, "giu"));
}

export function extractClaimVerbs(bio: string): ClaimVerbSighting[] {
  return sightings(bio, new RegExp(`\\b(${CLAIM_VERB_FORMS.join("|")})\\b`, "giu"));
}

/**
 * The check itself: a bio against the ONE episode it belongs to.
 *
 * `description` and `title` are that episode's own, and the signature takes them
 * separately rather than pre-joined so a caller cannot accidentally hand it the
 * whole corpus — which is the failure mode `topics.test.ts` had to fix in the
 * taxonomy's evidence check, where a quote could be paired with the wrong
 * episode and still pass. Here the same mistake would let a bio describe a
 * different guest entirely and come back clean.
 */
export function validateEnrichment(
  bio: string,
  description: string,
  title: string,
): EnrichmentReport {
  const errors: string[] = [];
  const rawSource = `${title}\n${description}`;
  const textSource = canonicaliseText(rawSource);
  const textBio = canonicaliseText(bio);
  const trimmed = textBio.trim();

  if (trimmed.length < BIO_MIN_LENGTH) {
    errors.push(
      `bio is ${trimmed.length} characters after trimming; the floor is ${BIO_MIN_LENGTH} ` +
        `(mirrors rule.min(20) on studio/schemaTypes/episode.ts's guestBio)`,
    );
  }
  if (trimmed.length > BIO_MAX_LENGTH) {
    errors.push(`bio is ${trimmed.length} characters; the ceiling is ${BIO_MAX_LENGTH}`);
  }

  const sourceCapitalised = new Set(
    capitalisedTokens(textSource).map((word) => word.toLowerCase()),
  );
  const sourceNumbers = new Set(numericLiterals(canonicaliseNumbers(rawSource)));

  for (const token of capitalisedTokens(textBio)) {
    const key = token.toLowerCase();
    // Function words carry no claim about anybody. Everything else must be
    // capitalised in the source too — position is not consulted.
    if (EXEMPT_CAPITALS.has(key)) continue;

    if (!sourceCapitalised.has(key)) {
      errors.push(
        `"${token}" is capitalised here but this episode's title and description never ` +
          `capitalise it — an unsourced proper noun`,
      );
    }
  }

  for (const literal of numericLiterals(canonicaliseNumbers(bio))) {
    if (!sourceNumbers.has(literal)) {
      errors.push(`the number ${literal} appears nowhere in this episode's title or description`);
    }
  }

  return {
    label: errors.length === 0 ? CLEAN_LABEL : ISSUES_LABEL,
    errors,
    // Extracted whether or not the bio is clean. A bio with a length error still
    // makes relational claims, and the sign-off list is for the human, not for
    // the gate.
    claimVerbs: extractClaimVerbs(textBio),
    roleClaims: extractRoleClaims(textBio),
  };
}

/**
 * Topic assignment rules.
 *
 * Separate from `validateEnrichment` because it needs the taxonomy, which
 * `validateEnrichment`'s three-argument signature deliberately does not take —
 * the bio check must stay answerable from one episode's own text.
 *
 * `MAX_TOPICS_PER_EPISODE` is imported rather than restated: it is the number
 * `queries.test.ts`'s per-episode payload bound is measured against and the
 * number `studio/schemaTypes/episode.ts` enforces with `rule.max(6)`, and a
 * third independent copy is a third thing to forget.
 */
export function validateTopicAssignment(topics: string[], taxonomySlugs: string[]): string[] {
  const errors: string[] = [];
  const allowed = new Set(taxonomySlugs);

  if (topics.length > MAX_TOPICS_PER_EPISODE) {
    errors.push(
      `${topics.length} topics assigned; the cap is ${MAX_TOPICS_PER_EPISODE} ` +
        `(rule.max(6) in studio/schemaTypes/episode.ts, and what queries.test.ts's ` +
        `payload bound is measured against)`,
    );
  }
  if (topics.length === 0) {
    errors.push("no topics assigned — an episode with no topics has no related-episode signal");
  }

  const seen = new Set<string>();
  for (const slug of topics) {
    if (!allowed.has(slug)) {
      errors.push(`topic "${slug}" is not in content/topic-taxonomy.json`);
    }
    if (seen.has(slug)) errors.push(`topic "${slug}" is assigned twice`);
    seen.add(slug);
  }

  return errors;
}

/* ------------------------------------------------------------------------- *
 * The committed artifact, and the transaction it implies
 * ------------------------------------------------------------------------- */

/** Where the enrichment lives, relative to the repo root. */
export const ENRICHMENT_RELATIVE_PATH = "content/episode-enrichment.json";

/**
 * One episode's drafted enrichment.
 *
 * Keyed by `guid` — the durable feed identity the document `_id` is derived
 * from — rather than by `episodeNumber`, which is nullable in the schema and
 * which `podcast:report` exists partly to count nulls of. `episodeNumber` and
 * `guestName` are carried anyway, for the PR reviewer: a 39-row diff of bios
 * keyed only by an opaque guid is a diff nobody can actually read.
 */
export interface EnrichmentEntry {
  guid: string;
  episodeNumber: number | null;
  guestName: string | null;
  guestBio: string;
  topics: string[];
}

export interface Enrichment {
  source: string;
  constraint: string;
  reviewNote: string;
  episodes: EnrichmentEntry[];
}

/** The subset of a snapshot episode this module needs. */
export interface EnrichmentSource {
  guid: string;
  title: string;
  description: string;
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * Proves the parsed JSON has the shape the type asserts.
 *
 * Same job and same reason as `parseTaxonomy` in `topics.ts`: `JSON.parse`
 * returns `any`, a type assertion checks nothing at runtime, and the input to an
 * irreversible write is validated before the write is planned. A numeric
 * `guestBio` would sail past every value-level rule below — `(123).trim()` does
 * not throw a *useful* error, it throws deep inside the validator — and a
 * missing `topics` array would only surface as a malformed Sanity mutation.
 */
export function parseEnrichment(raw: unknown): {
  enrichment: Enrichment | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { enrichment: null, errors: [`enrichment is not an object (got ${describeType(raw)})`] };
  }

  const record = raw as Record<string, unknown>;
  for (const key of ["source", "constraint", "reviewNote"] as const) {
    if (typeof record[key] !== "string" || (record[key] as string).length === 0) {
      errors.push(`"${key}" must be a non-empty string (got ${JSON.stringify(record[key])})`);
    }
  }

  if (!Array.isArray(record.episodes)) {
    errors.push(`"episodes" must be an array (got ${describeType(record.episodes)})`);
    return { enrichment: null, errors };
  }

  record.episodes.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`episode ${index} is not an object (got ${describeType(entry)})`);
      return;
    }
    const episode = entry as Record<string, unknown>;

    for (const key of ["guid", "guestBio"] as const) {
      const value = episode[key];
      if (typeof value !== "string" || value.length === 0) {
        errors.push(
          `episode ${index} has a non-string or empty "${key}" (got ${JSON.stringify(value)})`,
        );
      }
    }

    if (episode.episodeNumber !== null && !Number.isInteger(episode.episodeNumber)) {
      errors.push(
        `episode ${index} has a non-integer, non-null "episodeNumber" ` +
          `(got ${JSON.stringify(episode.episodeNumber)})`,
      );
    }
    if (episode.guestName !== null && typeof episode.guestName !== "string") {
      errors.push(
        `episode ${index} has a non-string, non-null "guestName" ` +
          `(got ${JSON.stringify(episode.guestName)})`,
      );
    }

    if (!Array.isArray(episode.topics)) {
      errors.push(
        `episode ${index} has a non-array "topics" (got ${describeType(episode.topics)})`,
      );
      return;
    }
    episode.topics.forEach((slug, slugIndex) => {
      if (typeof slug !== "string" || slug.length === 0) {
        errors.push(
          `episode ${index} topic ${slugIndex} is not a non-empty string ` +
            `(got ${JSON.stringify(slug)})`,
        );
      }
    });
  });

  if (errors.length > 0) return { enrichment: null, errors };
  return { enrichment: record as unknown as Enrichment, errors };
}

export interface EntryValidation {
  guid: string;
  episodeNumber: number | null;
  report: EnrichmentReport;
  topicErrors: string[];
}

/**
 * The whole file against the whole snapshot: coverage, then per-episode checks.
 *
 * Coverage is checked in both directions on purpose. A missing episode is the
 * obvious gap; an *extra* entry is the quieter one — a guid that matches no
 * episode is enrichment written for a show that does not exist here, and
 * without this it would simply never be applied and never be noticed.
 */
export function validateEnrichmentFile(
  enrichment: Enrichment,
  sources: EnrichmentSource[],
  taxonomySlugs: string[],
): { errors: string[]; entries: EntryValidation[] } {
  const errors: string[] = [];
  const byGuid = new Map(sources.map((source) => [source.guid, source]));

  const covered = new Set(enrichment.episodes.map((entry) => entry.guid));
  for (const source of sources) {
    if (!covered.has(source.guid)) errors.push(`no enrichment entry for episode ${source.guid}`);
  }
  if (covered.size !== enrichment.episodes.length) {
    errors.push("the enrichment file contains duplicate guids");
  }

  const entries: EntryValidation[] = [];

  for (const entry of enrichment.episodes) {
    const source = byGuid.get(entry.guid);
    if (source === undefined) {
      errors.push(`enrichment entry ${entry.guid} matches no episode in the snapshot`);
      continue;
    }

    const report = validateEnrichment(entry.guestBio, source.description, source.title);
    const topicErrors = validateTopicAssignment(entry.topics, taxonomySlugs);

    const where = `episode ${entry.episodeNumber ?? "?"} (${entry.guid})`;
    for (const error of report.errors) errors.push(`${where}: ${error}`);
    for (const error of topicErrors) errors.push(`${where}: ${error}`);

    entries.push({
      guid: entry.guid,
      episodeNumber: entry.episodeNumber,
      report,
      topicErrors,
    });
  }

  return { errors, entries };
}

/** The draft id for an episode: `drafts.` + its deterministic published id. */
export function draftDocId(guid: string): string {
  return `drafts.${episodeDocId(guid)}`;
}

/**
 * A `topics[]` member as `publish.ts` would key it.
 *
 * `_key` is set to the same value as `_ref` because that is exactly what
 * `keyedTopics()` (`src/lib/sanity/publish.ts:189`) computes on publish. Writing
 * any other key here — a random one, an index — would mean the first publish
 * after enrichment rewrites every key, which `strip()` hides from the content
 * comparison but which shows up as churn in the document's history for no
 * reason. Matching it means the draft is already in its published shape.
 */
export function topicReference(slug: string): {
  _type: "reference";
  _ref: string;
  _key: string;
} {
  const id = topicDocId(slug);
  return { _type: "reference", _ref: id, _key: id };
}

/**
 * Removed from a published document before it is copied into a draft.
 *
 * Top-level only, and NOT `publish.ts`'s recursive `strip()`. That one also
 * drops every `_key` at every depth, which is correct for a content comparison
 * and wrong here: a draft copied without its array keys is a draft whose
 * existing `topics[]` and image entries have lost their identity. These four are
 * Sanity's own bookkeeping — `_rev` in particular would turn a create into an
 * optimistic-locking assertion against a revision that is about to change.
 */
const DRAFT_COPY_STRIPPED_KEYS = ["_rev", "_createdAt", "_updatedAt", "_originalId"] as const;

function forDraftCopy(published: Record<string, unknown>, draftId: string) {
  const copy: Record<string, unknown> = { ...published };
  for (const key of DRAFT_COPY_STRIPPED_KEYS) delete copy[key];
  copy._id = draftId;
  return copy;
}

/** Exactly the two fields enrichment writes. Nothing else on the draft is touched. */
interface EnrichmentSet {
  guestBio: string;
  topics: ReturnType<typeof topicReference>[];
}

/**
 * The `set` payload for one episode — fully determined offline.
 *
 * Separated from the plan below because this half needs no read: the bio and
 * the topic references are computable from the committed file alone, which is
 * what makes `--dry-run` able to show an operator the real payload with no
 * credential and no network.
 */
function buildEnrichmentSet(entry: EnrichmentEntry): EnrichmentSet {
  return { guestBio: entry.guestBio, topics: entry.topics.map(topicReference) };
}

export interface EnrichmentPlanEntry {
  guid: string;
  episodeNumber: number | null;
  mutations: unknown[];
  /** Why nothing is emitted, when nothing is. */
  skippedReason?: string;
}

export interface EnrichmentPlan {
  entries: EnrichmentPlanEntry[];
  mutations: unknown[];
  applied: number;
  skipped: number;
}

/**
 * The published documents, read once before planning.
 *
 * Whole documents rather than ids, because the draft copy is built *from* them.
 *
 * Drafts are deliberately NOT read. An earlier version did, to decide between
 * three different per-episode transactions, and the extra state bought nothing:
 * `createIfNotExists` already does the right thing against a draft that is
 * there (no-op) and one that is not (copy the published document in). Knowing
 * which case applies changed no mutation, so the read was answering a question
 * nothing asked.
 */
export interface ExistingDocuments {
  published: Map<string, Record<string, unknown>>;
}

/**
 * The transaction, per episode: `createIfNotExists` then `patch`. Every episode
 * gets the same pair — there are no per-episode variants.
 *
 * **Why both, and why in this order.** The `patch` is what actually writes the
 * bio, and a patch against a document that does not exist fails the transaction.
 * The `createIfNotExists` is what guarantees it exists — and, being
 * `createIfNotExists` rather than `createOrReplace`, it is also what guarantees
 * an editor's half-finished draft is **not** clobbered on the way. Both
 * properties come from the same mutation, which is why the authority specifies
 * that verb and not a convenient-looking neighbour.
 *
 * **What happens when the published document is missing.** Nothing is emitted
 * for that episode and it is recorded as missing — and `applyEnrichment` then
 * refuses the entire run rather than writing the others. The create would
 * otherwise have to invent a document with no `_type`, no `title` and no
 * `audioUrl`; enrichment enriches an archive, it does not create one.
 *
 * That case cannot arise in ordinary operation: the committed file is validated
 * against the snapshot before this is ever called, so every entry names an
 * episode the archive contains. A missing published document therefore means
 * the *dataset* has diverged from the snapshot, which is an operator's problem
 * to resolve rather than something to enrich around.
 *
 * **An earlier version had a third case** — no published document but an
 * existing draft — which emitted the patch alone. It was written for the shape
 * US-107's "Sync from Podbean" leaves behind, but no entry in the committed file
 * can be in it (every entry is a snapshot episode, and every snapshot episode is
 * published), so it was an unreachable branch that also broke the authority's
 * ordered-pair guarantee. Refusing is both simpler and safer.
 *
 * The plan is built here rather than inside `scripts/apply-enrichment.ts` for
 * the reason `topics.ts` gives about `buildTopicMutations`: the PR gate runs
 * `bun test src/` and does not run `scripts/`, so a mutation shape defined in a
 * script is a mutation shape nothing checks.
 *
 * Nothing in this module imports `publish.ts`. The publish path is never
 * called, cannot be called, and `enrichment.test.ts` asserts the import is
 * absent — which is what makes AC-5.4's "never auto-published" structural.
 */
export function buildEnrichmentPlan(
  entries: EnrichmentEntry[],
  existing: ExistingDocuments,
): EnrichmentPlan {
  const planned: EnrichmentPlanEntry[] = entries.map((entry) => {
    const publishedId = episodeDocId(entry.guid);
    const draftId = draftDocId(entry.guid);
    const published = existing.published.get(publishedId);

    if (published === undefined) {
      return {
        guid: entry.guid,
        episodeNumber: entry.episodeNumber,
        mutations: [],
        skippedReason:
          `${publishedId} is not in the dataset — enrichment enriches an existing ` +
          `archive document and will not invent one`,
      };
    }

    return {
      guid: entry.guid,
      episodeNumber: entry.episodeNumber,
      mutations: [
        { createIfNotExists: forDraftCopy(published, draftId) },
        { patch: { id: draftId, set: buildEnrichmentSet(entry) } },
      ],
    };
  });

  return {
    entries: planned,
    mutations: planned.flatMap((entry) => entry.mutations),
    applied: planned.filter((entry) => entry.mutations.length > 0).length,
    skipped: planned.filter((entry) => entry.mutations.length === 0).length,
  };
}

/**
 * Transport, injectable so this runs with no network and no credential in
 * tests — the same shape and the same reason as `TopicApplyDeps` in `topics.ts`.
 */
export interface EnrichmentApplyDeps {
  getDocuments: (ids: string[]) => Promise<Record<string, unknown>[]>;
  mutate: (mutations: unknown[]) => Promise<unknown>;
}

export interface EnrichmentApplyReport extends EnrichmentPlan {
  transactionsSubmitted: number;
  /**
   * Set when the run was refused because some episode was in state 3.
   *
   * Distinguishes "nothing to do" from "we declined to do part of it" — two
   * outcomes that both submit zero transactions and must not read the same.
   */
  refusedForSkips?: boolean;
}

/**
 * The dry run's plan: the real ordered pair, with the copied body stubbed.
 *
 * A dry run performs no read, so it cannot show the published document each
 * `createIfNotExists` will carry — that body only exists in the dataset. What
 * it can and must show is the SHAPE of the transaction: two mutations per
 * episode, `createIfNotExists` then `patch`, with the `set` payload in full,
 * since that payload is what an operator is actually reviewing.
 *
 * An earlier version planned patches only, on the grounds that the create's
 * body was unknowable. That understated the transaction — a reviewer reading
 * the dry run saw 39 mutations where the live run submits 78, and never saw the
 * verb that carries the non-clobbering guarantee.
 */
export function buildDryRunPlan(entries: EnrichmentEntry[]): EnrichmentPlan {
  return buildEnrichmentPlan(entries, {
    published: new Map(
      entries.map((entry) => [
        episodeDocId(entry.guid),
        {
          _id: episodeDocId(entry.guid),
          _type: "episode",
          // Stands in for the published document's real fields, which a dry run
          // has not read. Labelled so nobody mistakes the dry-run output for a
          // faithful copy of what will actually be written.
          "…": "the published document's fields, copied at apply time",
        },
      ]),
    ),
  });
}

/**
 * Applies the enrichment, or plans it.
 *
 * The read is **not** reporting-only here, and that is the difference from
 * `applyTopics`. There the pre-read told an operator whether a run was a first
 * seed or a no-op, and `createIfNotExists` decided correctly regardless. Here
 * the read supplies the document each draft is copied from, so a failed read
 * cannot be shrugged off and continued through. It propagates, and nothing is
 * written.
 *
 * **A run that cannot cover every episode is refused outright.** If any
 * published document is missing, nothing is submitted at all — not "the other
 * 34, and a note about the five".
 *
 * The reason is that this cannot happen during ordinary operation. The
 * committed file is validated against the snapshot before this function is ever
 * called, so every entry names an episode that exists in the archive; a missing
 * published document therefore means the *dataset* has diverged from the
 * snapshot — someone deleted a document, or the snapshot is stale. That is a
 * condition an operator has to see and resolve, not one to enrich around.
 *
 * Reporting it and continuing was the original behaviour and it was wrong in a
 * specific way: the run printed the skips and still exited 0, so `podcast:enrich`
 * could report success having enriched 34 of 39 episodes. The five that silently
 * stayed at `guestBio: null` are exactly the ones nobody would think to check —
 * the coverage guarantee reads as met precisely when it is not.
 */
export async function applyEnrichment(
  entries: EnrichmentEntry[],
  options: { dryRun: boolean },
  deps: EnrichmentApplyDeps,
): Promise<EnrichmentApplyReport> {
  if (options.dryRun) {
    return { ...buildDryRunPlan(entries), transactionsSubmitted: 0 };
  }

  // Published ids only. Drafts are not read: `createIfNotExists` decides
  // correctly whether or not one is there, so their state changes no mutation.
  // Sanity omits missing ids rather than erroring, so absence is a normal
  // result — and it is the one this function refuses on.
  const ids = entries.map((entry) => episodeDocId(entry.guid));
  const documents = await deps.getDocuments(ids);

  const published = new Map<string, Record<string, unknown>>();
  for (const doc of documents) published.set(String(doc._id), doc);

  const plan = buildEnrichmentPlan(entries, { published });

  // Refused before the write, not reported after it. See the note above: a
  // missing published document means the dataset diverged from the snapshot,
  // and a partial enrichment that exits successfully is the failure this guard
  // exists to prevent.
  if (plan.skipped > 0) {
    return { ...plan, mutations: [], transactionsSubmitted: 0, refusedForSkips: true };
  }

  if (plan.mutations.length === 0) return { ...plan, transactionsSubmitted: 0 };

  // One array, one transaction — matching `applyTopics`. A half-applied
  // enrichment would leave the archive in a state a re-run cannot distinguish
  // from a fresh one, and 39 episodes' worth fits comfortably in one request.
  await deps.mutate(plan.mutations);

  return { ...plan, transactionsSubmitted: 1 };
}
