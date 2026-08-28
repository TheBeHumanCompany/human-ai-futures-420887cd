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
 * The one contact address, and the only mailbox the site talks to.
 *
 * Hardcoded in three places before this constant existed — the footer, the
 * contact page's details list, and (as of 2026-08-19) the enquiry form's
 * delivery target. The third is what made a constant necessary rather than
 * tidy: a copy of this string that drifts in the footer is a cosmetic bug, but
 * a copy that drifts in the send path routes real enquiries into a mailbox
 * nobody reads, and looks identical from the outside either way.
 *
 * `thebehumancompany.ca` — with the "the". `behumancompany.ca` has no MX and no
 * A record, so mail addressed there is not slow, it is gone. Checked on
 * 2026-08-19 precisely because the shorter form is the natural typo.
 */
export const CONTACT_EMAIL = "info@thebehumancompany.ca";

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
 *
 * The leading qualifier was "AI Governance" until 2026-08-22. The rebrand drops
 * the word AI from public copy, and dropping it here moves this line TOWARDS its
 * source rather than away from it: `controls.yaml` calls the instrument "the
 * Maturity Score", and the "AI" was added on this side, not taken from there.
 */
export const POSITIONING_DISCLAIMER =
  "The Governance Maturity Score is a readiness and assurance tool. It is not a certification, it is not a compliance guarantee, and it is not recognized by any government.";

/** A social destination the footer and the social section both render. */
export type SocialLink = {
  /** Display name, and the key both surfaces render. */
  name: "LinkedIn" | "Instagram" | "YouTube" | "X" | "TikTok" | "Snapchat" | "Facebook";
  /** Absolute `https://` URL. */
  href: string;
};

/**
 * Every social account this company actually has — all seven of them.
 *
 * This list is the single source for both surfaces that render socials and for
 * the link checker, so a platform cannot be dropped from one and survive in
 * another.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/the-be-human-company/" },
  { name: "Instagram", href: "https://www.instagram.com/shanejjames?igsh=bTNjd2syZnAxdXB4" },
  { name: "YouTube", href: "https://m.youtube.com/@shanejeremyjames?ra=m" },
  { name: "X", href: "https://x.com/shanejjames?lang=en" },
  { name: "TikTok", href: "https://www.tiktok.com/@shanejjames?_r=1&_t=ZS-98rtTHgscnF" },
  { name: "Snapchat", href: "https://www.snapchat.com/add/shanejjames?share_id=lkw0bdXiL6I&locale=en-CA" },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61590590709616" },
] as const;

/**
 * The Human Archive playlist — every conversation in the series, one list.
 *
 * The archive page's "Watch the Human Archives" link points here, and any
 * future gate that mentions the playlist asserts this constant rather than a
 * hand-typed copy. The list id is the full identity of the URL: the `si=`
 * parameter YouTube appends when a link is shared from the app encodes the
 * sharer, not the destination, and would drift with every re-copy, so it is
 * kept out on purpose.
 *
 * Verified live on 2026-08-26 (Krisp meeting 2026-08-22, Shane's pick for
 * the button wording).
 */
export const ARCHIVE_PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLdA-mx7SlQ_A";
