import { BOOKING_URL_15MIN } from "@/lib/booking";

/**
 * The post-upload closing surface (todo 11, G5).
 *
 * After the intake write is verified, the portal's confirmed state renders
 * this surface: the thank-you, the 24-hour outreach promise the client was
 * given, and — when a booking destination resolves — the CTA to book a call
 * without waiting for us. The booking URL is consumed through the booking
 * module's layering rule (that file is the only place the destination may be
 * written), never re-typed here.
 *
 * The URL arrives through a seam rather than a constant read so the degrade
 * path is a real contract, not dead code: an absent or blank destination
 * resolves to `null`, the CTA simply does not render, and the copy stands
 * alone — a visitor is never handed a dead link.
 */

/** The outreach promise, verbatim from the user's copy spec. Snapshot-pinned. */
export const THANKYOU_OUTREACH = "Our team reaches out within 24 hours with what comes next.";

/** The CTA's accessible name — stable, for the funnel suite to click by. */
export const THANKYOU_BOOKING_LABEL = "Book a 15-minute call with the team";

export type ThankYouBooking = { href: string; label: string };

/**
 * Resolve the booking CTA, or `null` when no destination resolves. The
 * default reads the booking module's 15-minute destination (the general
 * book-a-call surface); a test or future caller may supply the URL instead,
 * and `null`/blank anywhere in the supply degrades to no CTA.
 */
export function thankYouBooking(
  input: { bookingUrl?: string | null } = {},
): ThankYouBooking | null {
  const url = input.bookingUrl === undefined ? BOOKING_URL_15MIN : input.bookingUrl;
  if (url === null || url.trim() === "") return null;
  return { href: url, label: THANKYOU_BOOKING_LABEL };
}
