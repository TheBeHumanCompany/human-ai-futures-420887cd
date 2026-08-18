/**
 * The two booking destinations, and the only place `cal.com` may be written.
 *
 * AC-2.4 is enforced from the layering test as "no file outside this one
 * contains the substring `cal.com`". That rule is what makes a booking URL
 * impossible to fork: an inlined `https://cal.com/...` in a hero button is
 * indistinguishable from a correct one by review, and it survives until
 * someone changes the real link and a stale CTA keeps taking bookings into a
 * calendar nobody is watching.
 *
 * So the rule is textual, and this file is the exemption. `src/lib/brand.ts`
 * re-exports both names for call sites that want one import for all shared
 * copy — a re-export carries no URL text, so it does not breach the rule.
 */

/** The general "book a call" destination. Header CTA, contact surfaces. */
export const BOOKING_URL_15MIN = "https://cal.com/the-be-human-company/15min";

/** "Book Your Blueprint" — every CTA on the Blueprint page (AC-2.6, AC-6.8). */
export const BOOKING_URL_30MIN = "https://cal.com/the-be-human-company/30min";
