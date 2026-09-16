import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { PanelState } from "@/lib/checkout/audit-checkout-client";

import { CheckoutBand, CheckoutStates } from "./checkout-panel";

/**
 * The checkout panel's states, rendered statically like the rest of this
 * repo's component tests — no browser, no effect run, exactly the markup
 * server-rendered before hydration.
 *
 * What is pinned here: every state carries its stable `data-testid` (todo
 * 12's Playwright selectors depend on them not drifting), the error states
 * render their distinct bodies with no pay button, and Stripe is loaded
 * exactly once on the ready state and ZERO times on every other — proven
 * with an injected loader, the same seam discipline as the injected fetch
 * doubles. The confirm invocation itself is pinned at the seam in
 * `audit-checkout-client.test.ts`; the decline text, the alert semantics,
 * and the pay-button wiring are pinned by source below.
 */

const ROUTE_TOKEN = "tok-fixture-abcdef";

const readyState: PanelState = {
  kind: "ready",
  clientSecret: "cs_test_secret",
  publishableKey: "pk_test_fixture",
};

const loaderCounting = () => {
  const calls: string[] = [];
  return {
    initStripe: (key: string) => {
      calls.push(key);
      return Promise.resolve(null);
    },
    calls: () => calls,
  };
};

const SOURCE = readFileSync(new URL("./checkout-panel.tsx", import.meta.url).pathname, "utf8");

describe("the purchase band on the locked-final page", () => {
  test("with locked finals it renders the pay CTA on the ink band", () => {
    const html = renderToStaticMarkup(
      createElement(CheckoutBand, {
        identity: { kind: "token", token: ROUTE_TOKEN },
        hasLockedFinals: true,
      }),
    );

    expect(html).toContain('data-testid="pay-cta"');
    expect(html).toContain("section-ink");
  });

  test("without locked finals it renders nothing — no upsell on an open page", () => {
    const html = renderToStaticMarkup(
      createElement(CheckoutBand, {
        identity: { kind: "token", token: ROUTE_TOKEN },
        hasLockedFinals: false,
      }),
    );

    expect(html).not.toContain('data-testid="pay-cta"');
  });
});

describe("the ready state — the Payment Element panel", () => {
  test("the panel, the payment element mount, and the pay button all render", () => {
    const { initStripe, calls } = loaderCounting();
    const html = renderToStaticMarkup(
      createElement(CheckoutStates, { state: readyState, initStripe }),
    );

    expect(html).toContain('data-testid="checkout-panel"');
    expect(html).toContain('data-testid="payment-element"');
    expect(html).toContain('data-testid="pay-button"');
    expect(calls()).toEqual(["pk_test_fixture"]);
  });

  test("the pay button starts disabled — it cannot fire before the SDK is ready", () => {
    const html = renderToStaticMarkup(createElement(CheckoutStates, { state: readyState }));

    expect(html).toContain("disabled");
  });
});

describe("the error states — no Stripe initialization", () => {
  test("a 404 denial renders the invalid state and loads Stripe zero times", () => {
    const { initStripe, calls } = loaderCounting();
    const html = renderToStaticMarkup(
      createElement(CheckoutStates, { state: { kind: "invalid" }, initStripe }),
    );

    expect(html).toContain('data-testid="checkout-error"');
    expect(html).toContain("This link is not valid");
    expect(html).not.toContain('data-testid="pay-button"');
    expect(calls()).toEqual([]);
  });

  test("a 409 replay renders the already-paid state with the portal sign-in way back", () => {
    const { initStripe, calls } = loaderCounting();
    const html = renderToStaticMarkup(
      createElement(CheckoutStates, { state: { kind: "paid" }, initStripe }),
    );

    expect(html).toContain('data-testid="checkout-paid"');
    expect(html).toContain('href="/portal"');
    expect(calls()).toEqual([]);
  });

  test("a 400 no-email record renders its own contact state, Stripe untouched", () => {
    const { initStripe, calls } = loaderCounting();
    const html = renderToStaticMarkup(
      createElement(CheckoutStates, { state: { kind: "no-email" }, initStripe }),
    );

    expect(html).toContain('data-testid="checkout-no-email"');
    expect(html).toContain("no contact email");
    expect(html).not.toContain('data-testid="pay-button"');
    expect(calls()).toEqual([]);
  });

  test("an unavailable init renders the retry state and loads Stripe zero times", () => {
    const { initStripe, calls } = loaderCounting();
    const html = renderToStaticMarkup(
      createElement(CheckoutStates, { state: { kind: "unavailable" }, initStripe }),
    );

    expect(html).toContain('data-testid="checkout-error"');
    expect(html).toContain("could not be initialized");
    expect(html).toContain('data-testid="checkout-retry"');
    expect(calls()).toEqual([]);
  });
});

describe("the selectors todo 12 will drive", () => {
  test("every stable testid is present in the component source", () => {
    for (const testid of [
      "pay-cta",
      "checkout-panel",
      "payment-element",
      "pay-button",
      "checkout-error",
      "checkout-paid",
      "checkout-no-email",
      "checkout-inline-error",
      "checkout-retry",
    ]) {
      expect(SOURCE).toContain(`data-testid="${testid}"`);
    }
  });

  test("the pay button wires the confirm seam and the decline text renders inline as an alert", () => {
    expect(SOURCE).toContain("confirmAuditPayment");
    expect(SOURCE).toContain("{payState.message}");
    expect(SOURCE).toContain('data-testid="checkout-inline-error"');
    expect(SOURCE).toContain('role="alert"');
  });
});

describe("source pins — the secret and the token never wander", () => {
  test("nothing is logged from the panel", () => {
    expect(SOURCE).not.toMatch(/console\./);
  });

  test("the token reaches the panel only through its prop", () => {
    expect(SOURCE).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });

  test("Stripe.js loads through the CDN wrapper, never an inlined script", () => {
    expect(SOURCE).toContain("loadStripe");
    expect(SOURCE).not.toMatch(/js\.stripe\.com\/v3/);
  });
});
