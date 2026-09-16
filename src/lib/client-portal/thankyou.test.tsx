import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as booking from "@/lib/booking";
import { ThankYouCard } from "../../components/client-portal/intake-card";
import { THANKYOU_BOOKING_LABEL, THANKYOU_OUTREACH, thankYouBooking } from "./thankyou";

/**
 * The post-upload closing surface (todo 11, G5), pinned offline.
 *
 * Three contracts: the copy carries the 24-hour outreach promise the user
 * specified; the booking CTA's href is the booking module's URL — asserted
 * both as the exact destination and as identity with `booking.ts`, so the
 * layering rule (one file may name the booking host) is what the test reads
 * through; and an unresolvable booking URL degrades to copy alone — zero
 * anchor elements, never a dead link.
 */

const PORTAL_SOURCE = readFileSync(
  new URL("../../components/client-portal/intake-card.tsx", import.meta.url).pathname,
  "utf8",
);

/* ------------------------------------------------------------------ */
/* The copy — the user's 24-hour spec, verbatim                         */
/* ------------------------------------------------------------------ */

describe("the thank-you copy", () => {
  test("the outreach line carries the 24-hour promise", () => {
    expect(THANKYOU_OUTREACH).toBe("Our team reaches out within 24 hours with what comes next.");
  });

  test("the booking CTA has a stable accessible name", () => {
    expect(THANKYOU_BOOKING_LABEL).toBe("Book a 15-minute call with the team");
  });

  test("the rendered surface shows the copy", () => {
    const html = renderToStaticMarkup(createElement(ThankYouCard, { booking: thankYouBooking() }));
    expect(html).toContain('data-testid="thankyou"');
    expect(html).toContain('data-testid="thankyou-copy"');
    expect(html).toContain("Our team reaches out within 24 hours with what comes next.");
  });
});

/* ------------------------------------------------------------------ */
/* The booking CTA — href from the booking module's layering            */
/* ------------------------------------------------------------------ */

describe("thankYouBooking", () => {
  test("the default resolves the booking module's 15-minute destination", () => {
    const resolved = thankYouBooking();
    expect(resolved).not.toBeNull();
    expect(resolved!.href).toBe("https://cal.com/the-be-human-company/15min");
    // Layering identity: the URL is booking.ts's object, not a re-typed copy.
    expect(resolved!.href).toBe(booking.BOOKING_URL_15MIN);
    expect(resolved!.label).toBe(THANKYOU_BOOKING_LABEL);
  });

  test("the rendered CTA is a real anchor carrying that exact href", () => {
    const html = renderToStaticMarkup(createElement(ThankYouCard, { booking: thankYouBooking() }));
    expect(html).toContain('data-testid="booking-cta"');
    expect(html).toContain('href="https://cal.com/the-be-human-company/15min"');
  });

  test("an absent booking URL resolves to null", () => {
    expect(thankYouBooking({ bookingUrl: null })).toBeNull();
  });

  test("a blank booking URL resolves to null", () => {
    expect(thankYouBooking({ bookingUrl: "" })).toBeNull();
    expect(thankYouBooking({ bookingUrl: "   " })).toBeNull();
  });

  test("an explicitly supplied URL is honored as-is", () => {
    expect(thankYouBooking({ bookingUrl: "https://example.com/book" })).toEqual({
      href: "https://example.com/book",
      label: THANKYOU_BOOKING_LABEL,
    });
  });
});

/* ------------------------------------------------------------------ */
/* The graceful degrade — no booking URL, no anchor, copy stands alone  */
/* ------------------------------------------------------------------ */

describe("the degraded thank-you surface", () => {
  test("an unresolvable booking renders zero anchor elements", () => {
    const html = renderToStaticMarkup(createElement(ThankYouCard, { booking: null }));
    expect(/<a[\s>]/.test(html)).toBe(false);
  });

  test("the copy stands alone — no dead link, no missing surface", () => {
    const html = renderToStaticMarkup(createElement(ThankYouCard, { booking: null }));
    expect(html).toContain('data-testid="thankyou"');
    expect(html).toContain("Our team reaches out within 24 hours with what comes next.");
  });
});

/* ------------------------------------------------------------------ */
/* The portal handoff — the confirmed intake state reaches the surface  */
/* ------------------------------------------------------------------ */

describe("the portal route pins the thank-you contract", () => {
  test("the funnel stage S5 asserts against these testids", () => {
    expect(PORTAL_SOURCE).toContain('data-testid="thankyou"');
    expect(PORTAL_SOURCE).toContain('data-testid="thankyou-copy"');
    expect(PORTAL_SOURCE).toContain('data-testid="booking-cta"');
  });

  test("the confirmed intake branch is where the surface mounts", () => {
    expect(PORTAL_SOURCE).toContain("<ThankYouCard");
    expect(PORTAL_SOURCE).toContain("thankYouBooking()");
  });
});
