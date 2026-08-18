import { describe, expect, test } from "bun:test";

import { BOOKING_URL_15MIN, BOOKING_URL_30MIN, INDIGENOUS_LINE, SOCIAL_LINKS } from "./brand";
import * as booking from "./booking";

describe("the Indigenous line", () => {
  test("is the canonical fourth variant, character for character", () => {
    // Asserted by identity rather than by keyword. Three earlier wordings were
    // each "close enough" to pass a keyword check, and two acceptance criteria
    // demanded different ones — which is the contradiction this string exists
    // to end. It closes with a trailing period.
    expect(INDIGENOUS_LINE).toBe("Indigenous-led. Canadian-built.");
  });
});

describe("the booking URLs", () => {
  test("are the two exact literals, and brand.ts re-exports the same bindings", () => {
    expect(booking.BOOKING_URL_15MIN).toBe("https://cal.com/the-be-human-company/15min");
    expect(booking.BOOKING_URL_30MIN).toBe("https://cal.com/the-be-human-company/30min");

    // The re-export is the reason call sites can import everything from one
    // module while the URL text stays in one file. If it ever stopped
    // re-exporting, imports would silently resolve to `undefined` and every
    // CTA would render `href="undefined"` without a type error at the callers.
    expect(BOOKING_URL_15MIN).toBe(booking.BOOKING_URL_15MIN);
    expect(BOOKING_URL_30MIN).toBe(booking.BOOKING_URL_30MIN);
  });

  test("the two are distinct", () => {
    // They are a 15-minute intro call and a 30-minute Blueprint booking. One
    // URL pasted twice is the easy mistake, and both CTAs would still work.
    expect(BOOKING_URL_15MIN).not.toBe(BOOKING_URL_30MIN);
  });
});

describe("the social accounts", () => {
  test("are exactly the four that exist", () => {
    expect(SOCIAL_LINKS.map((s) => s.name)).toEqual(["LinkedIn", "Instagram", "YouTube", "X"]);
  });

  test("name no platform the company has no account on", () => {
    // Asserted as absence rather than trusted to the count above, because the
    // count stays at four if one of these silently replaces a real account.
    const names = SOCIAL_LINKS.map((s) => s.name);
    for (const absent of ["TikTok", "Snapchat", "Facebook"]) {
      expect(names).not.toContain(absent);
    }
  });

  test("every href is an absolute https URL, never a placeholder", () => {
    for (const social of SOCIAL_LINKS) {
      expect(social.href.startsWith("https://")).toBe(true);
      expect(social.href).not.toBe("#");
    }
  });

  test("the two redirecting hosts are stored in their resolved form", () => {
    // `youtube.com/@…` and `twitter.com/…` both 301 to what is stored. A link
    // checker that HEADs the unresolved form without following redirects is
    // asserting against a 15-byte redirect body — a check that cannot fail.
    const href = (name: string) => SOCIAL_LINKS.find((s) => s.name === name)?.href;

    expect(href("YouTube")).toBe("https://www.youtube.com/@shanejeremyjames");
    expect(href("X")).toBe("https://x.com/shanejjames");
    expect(href("X")).not.toContain("twitter.com");
  });
});
