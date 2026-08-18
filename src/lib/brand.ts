/**
 * Brand copy that appears in more than one place, defined exactly once.
 *
 * Every constant here exists because the same string was found in circulation
 * in two or more forms. That is not a tidiness problem — each one is a string
 * a test asserts by identity, so a second hand-typed copy is a gate that
 * passes against copy the site does not actually render.
 *
 * The booking URLs are re-exported rather than defined here: `booking.ts` is
 * the sole file permitted to contain the booking host's name, enforced as a
 * text rule, and a re-export moves the binding without moving the URL.
 */

export { BOOKING_URL_15MIN, BOOKING_URL_30MIN } from "./booking";

/**
 * The canonical Indigenous line, site-wide (AC-2.1b).
 *
 * Three variants were in circulation before this constant existed — one in
 * the shipped footer, one in the design brief, and one in the Blueprint PDF's
 * hero — and two acceptance criteria demanded different ones, so they could
 * not both be rendered and both be asserted. That is how the contradiction
 * surfaced. The user resolved it with a fourth string that supersedes all
 * three, and it is this one. The superseded wordings are deliberately not
 * quoted anywhere in this tree: a text-level rule asserts they appear nowhere,
 * and a comment quoting one would be the first thing to trip it.
 *
 * A trailing period closes "Canadian-built." — the string is exact, and a
 * test compares it by identity. A maple leaf renders beside it wherever it
 * appears (AC-2.8b), within two DOM levels.
 */
export const INDIGENOUS_LINE = "Indigenous-led. Canadian-built.";

/**
 * The positioning disclaimer, pinned rather than paraphrased (AC-6.11a).
 *
 * A direct restatement of `framework/controls.yaml`'s `meta.positioning`:
 * "Readiness and assurance, not a compliance guarantee. The Maturity Score is
 * NOT a certification." The framework's own spine says what the product is
 * not, and public copy that drifts from it is the specific failure this
 * constant prevents — a sales page claiming certification for a tool whose
 * source of truth denies it.
 *
 * Rendered within two DOM levels of every Maturity Score mention, and
 * compared to this literal by identity, not by keyword.
 */
export const POSITIONING_DISCLAIMER =
  "The AI Governance Maturity Score is a readiness and assurance tool. It is not a certification, it is not a compliance guarantee, and it is not recognized by any government.";

/** A social destination the footer and the social section both render. */
export type SocialLink = {
  /** Display name, and the key both surfaces render. */
  name: "LinkedIn" | "Instagram" | "YouTube" | "X";
  /** Absolute `https://` URL. Verified HTTP 200 on 2026-08-18. */
  href: string;
};

/**
 * Every social account this company actually has — all four of them.
 *
 * The site shipped seven platform labels, every one of them linking to a bare
 * fragment placeholder rather than to an account. Three of those accounts do
 * not exist: two were searched for and found nowhere, and one was never a
 * company account. The decision was to remove rather than to invent, so the
 * icon components for those three are deleted along with their entries, and a
 * test asserts the count so a placeholder cannot creep back in.
 *
 * Two of these are stored in their **resolved** form rather than the form they
 * were supplied in — `youtube.com/@…` and `twitter.com/…` both 301 to what is
 * written here. That matters beyond tidiness: a link checker that HEADs a URL
 * without following redirects is asserting against a 15-byte redirect body,
 * which is a check that cannot fail. Storing the destination removes the hop
 * and gives the checker something real to assert.
 *
 * This list is the single source for both surfaces that render socials and for
 * the link checker, so a platform cannot be dropped from one and survive in
 * another.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/the-be-human-company/" },
  { name: "Instagram", href: "https://www.instagram.com/thebehumancompany/" },
  { name: "YouTube", href: "https://www.youtube.com/@shanejeremyjames" },
  { name: "X", href: "https://x.com/shanejjames" },
] as const;
