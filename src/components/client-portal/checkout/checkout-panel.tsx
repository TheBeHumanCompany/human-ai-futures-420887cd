import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";

import {
  confirmAuditPayment,
  fetchStripePublishableKey,
  resolveCheckoutPanel,
  type PanelState,
} from "@/lib/checkout/audit-checkout-client";

/**
 * The purchase band and embedded checkout for `/c/$token` (funnel todo 7).
 *
 * The band sits where the locked sections end — the page's one upsell — and
 * the CTA opens the checkout in place: the token is already the grant, so
 * the checkout has no URL of its own and no second identity check. Clicking
 * asks the init route for a `client_secret`, then the React checkout
 * provider (the `/checkout` subpath of @stripe/react-stripe-js, verified
 * against the installed d.ts) initializes the elements SDK and mounts the
 * Payment Element — an iframe Stripe itself owns; nothing here wraps another
 * frame around it.
 *
 * A confirm success hands control to Stripe, which navigates the browser to
 * the session's `return_url` (`/audit/success`). A declined card stays on
 * this page: the seam maps `paymentFailed` to the inline message and the
 * panel renders it — no redirect, the buyer can retry with another card.
 * Init-route 404, 409, and 400 render their own states, and those paths
 * never touch Stripe: no key is loaded into them, so there is nothing to
 * initialize with.
 */

type StripeInit = (publishableKey: string) => PromiseLike<Stripe | null>;

export function CheckoutBand({
  token,
  hasLockedFinals,
}: {
  token: string;
  hasLockedFinals: boolean;
}) {
  const [state, setState] = useState<PanelState | null>(null);
  const [starting, setStarting] = useState(false);

  async function begin() {
    setStarting(true);
    try {
      setState(
        await resolveCheckoutPanel({
          token,
          publishableKey: await fetchStripePublishableKey(),
        }),
      );
    } catch {
      setState({ kind: "unavailable" });
    } finally {
      setStarting(false);
    }
  }

  if (!hasLockedFinals) return null;

  return (
    <section className="section-ink">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-14 sm:px-8">
        {state ? (
          <CheckoutStates state={state} onBegin={begin} />
        ) : (
          <IdleOffer starting={starting} onBegin={begin} />
        )}
      </div>
    </section>
  );
}

function IdleOffer({ starting, onBegin }: { starting: boolean; onBegin: () => void }) {
  return (
    <>
      <p className="eyebrow opacity-60">The full blueprint</p>
      <h2 className="type-h3-caps-light mt-3">Unlock the rest of this page</h2>
      <p className="mt-4 max-w-[60ch] opacity-80">
        The sections above are the preliminary read. The locked ones hold the full strategic
        blueprint — every priority, verdict, and play — and one payment unlocks them here and in
        your portal.
      </p>
      <button
        type="button"
        onClick={onBegin}
        disabled={starting}
        data-testid="pay-cta"
        className="eyebrow mt-8 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream"
      >
        {starting ? "Preparing checkout…" : "Unlock the full blueprint"}
      </button>
    </>
  );
}

export function CheckoutStates({
  state,
  onBegin,
  initStripe,
}: {
  state: PanelState;
  /** Re-runs the init request — the unavailable state's retry. */
  onBegin?: () => void;
  /** Test seam; production uses `loadStripe`, which pulls Stripe.js from the CDN. */
  initStripe?: StripeInit;
}) {
  switch (state.kind) {
    case "invalid":
      return (
        <div data-testid="checkout-error" className="max-w-[60ch] border-t border-current/20 pt-6">
          <p className="eyebrow opacity-60">This link is not valid</p>
          <p className="mt-3 opacity-80">
            The link you followed does not match a client page, so checkout cannot start. Ask us to
            send your link again.
          </p>
        </div>
      );
    case "paid":
      return (
        <div data-testid="checkout-paid" className="max-w-[60ch] border-t border-current/20 pt-6">
          <p className="eyebrow opacity-60">Already unlocked</p>
          <p className="mt-3 opacity-80">
            This audit is already paid. Check your email for your portal link, or{" "}
            <a className="underline underline-offset-4" href="/portal">
              sign in to your portal
            </a>{" "}
            to read the final report.
          </p>
        </div>
      );
    case "no-email":
      return (
        <div
          data-testid="checkout-no-email"
          className="max-w-[60ch] border-t border-current/20 pt-6"
        >
          <p className="eyebrow opacity-60">One thing is missing</p>
          <p className="mt-3 opacity-80">
            This client record has no contact email, so checkout cannot be initialized. Contact us
            and we will sort it out.
          </p>
        </div>
      );
    case "unavailable":
      return (
        <div data-testid="checkout-error" className="max-w-[60ch] border-t border-current/20 pt-6">
          <p className="eyebrow opacity-60">Checkout is unavailable</p>
          <p className="mt-3 opacity-80">
            Checkout could not be initialized. Please try again shortly.
          </p>
          <button
            type="button"
            onClick={onBegin}
            data-testid="checkout-retry"
            className="eyebrow mt-6 inline-flex items-center rounded-full border border-current px-6 py-3 opacity-90 transition-colors duration-200 hover:bg-cream hover:text-ink"
          >
            Try again
          </button>
        </div>
      );
    case "ready":
      return (
        <PaymentSection
          clientSecret={state.clientSecret}
          publishableKey={state.publishableKey}
          initStripe={initStripe}
        />
      );
  }
}

function PaymentSection({
  clientSecret,
  publishableKey,
  initStripe,
}: {
  clientSecret: string;
  publishableKey: string;
  initStripe?: StripeInit;
}) {
  const load = initStripe ?? loadStripe;
  // One init per mount: the provider needs a stable stripe promise, and
  // re-running it on re-renders would re-initialize the session.
  const [stripePromise] = useState(() => load(publishableKey));

  return (
    <div data-testid="checkout-panel" className="max-w-[60ch]">
      <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
        <PaymentBody />
      </CheckoutElementsProvider>
    </div>
  );
}

function PaymentBody() {
  const checkout = useCheckoutElements();
  const [payState, setPayState] = useState<{
    kind: "idle" | "confirming" | "declined" | "failed";
    message?: string;
  }>({ kind: "idle" });

  async function pay() {
    if (checkout.type !== "success" || payState.kind === "confirming") return;
    setPayState({ kind: "confirming" });
    const outcome = await confirmAuditPayment(() => checkout.checkout.confirm());
    if (outcome.kind === "redirected") return;
    setPayState({ kind: outcome.kind, message: outcome.message });
  }

  if (checkout.type === "error") {
    return (
      <>
        <div data-testid="payment-element" />
        <p
          data-testid="checkout-inline-error"
          role="alert"
          className="mt-4 border border-current/20 px-4 py-3 opacity-90"
        >
          {checkout.error.message}
        </p>
      </>
    );
  }

  const ready = checkout.type === "success";

  return (
    <>
      <div data-testid="payment-element">
        <PaymentElement />
      </div>
      <button
        type="button"
        onClick={pay}
        disabled={!ready || payState.kind === "confirming"}
        data-testid="pay-button"
        className="eyebrow mt-8 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {payState.kind === "confirming" ? "Processing payment…" : "Pay for the full blueprint"}
      </button>
      {payState.message ? (
        <p
          data-testid="checkout-inline-error"
          role="alert"
          className="mt-4 border border-current/20 px-4 py-3 opacity-90"
        >
          {payState.message}
        </p>
      ) : null}
    </>
  );
}
