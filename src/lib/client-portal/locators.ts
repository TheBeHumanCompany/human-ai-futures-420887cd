/**
 * Transcript locators are internal grounding, not client copy (US-007).
 *
 * The generator cites transcript support as a parenthetical of time codes and
 * `E###` evidence ids, e.g. `(transcript:foo.txt, ~05:23; E025–E026)`. Shane
 * asked for the time codes gone; the evidence ids and the transcript filename
 * are internal identifiers that were never meant to be read by a client.
 * The quote and the speaker attribution around them stay.
 *
 * Only a parenthetical made up ENTIRELY of locator tokens is removed. A
 * parenthetical carrying any other prose — `(ccib.ca)`, `(fetched this task)`,
 * `(CoffeeTalk, Sept. 17, 2024, prior research)` — is left exactly as authored,
 * because those are real citations a client should see.
 */

/** `transcript:<file>`, a `~MM:SS`/`~HH:MM:SS` time code, or an `E###` id. */
const TOKEN = String.raw`(?:transcript:[^\s,;()]+|~?\d{1,2}:\d{2}(?::\d{2})?|E\d{3})`;
/** One token, or a dash-joined range of two. */
const ITEM = `${TOKEN}(?:\\s*[\u2013\u2014-]\\s*${TOKEN})?`;
/**
 * A whole parenthetical body that is nothing but locator items.
 *
 * Exported so a gate can run it over rendered output rather than over this
 * module's own inputs: `scripts/export-blueprint.test.ts` pulls every
 * parenthetical out of the exported HTML and asserts none of them matches,
 * which is the claim that actually matters — no locator reaches a client —
 * rather than the claim that this function works on the strings it was given.
 */
export const LOCATOR_ONLY = new RegExp(`^\\s*${ITEM}(?:\\s*[;,]\\s*${ITEM})*\\s*$`);
/**
 * A bare, unparenthesised locator list the generator appends after a dash,
 * e.g. `growth into wholesale — ~05:23–09:53` or `— ~38:24, 55:45–01:03:29`.
 * Only a dash-led locator list at the end of a line matches, so prose ending
 * in ordinary words never strips.
 */
const TRAILING_RANGE = new RegExp(`\\s*[\u2013\u2014-]\\s*${ITEM}(?:\\s*[;,]\\s*${ITEM})*\\s*$`);

export function stripLocators(text: string): string {
  return text
    .replace(/ ?\(([^()]*)\)/g, (match, inner: string) => (LOCATOR_ONLY.test(inner) ? "" : match))
    .replace(new RegExp(TRAILING_RANGE.source, "gm"), "");
}
