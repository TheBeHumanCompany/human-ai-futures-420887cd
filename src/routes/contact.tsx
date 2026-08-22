import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { CONTACT_EMAIL } from "@/lib/brand";
import { FALLBACK, sendContactEnquiry, type ContactResult } from "@/lib/contact";

import { BOOKING_URL_15MIN } from "@/lib/booking";

// The "Studios" row that used to sit in this list named three cities on three
// continents. This company has offices in none of them, and a contact page is
// the last place a plausible-sounding invention belongs. The booking link
// replaces it with something a reader can actually act on.
export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Work With Be Human Intelligence" },
      {
        name: "description",
        content:
          "Talk to us about human readiness, governance, agents and leadership programs for your organization.",
      },
      { property: "og:title", content: "Contact — Work With Be Human Intelligence" },
      {
        property: "og:description",
        content: "Prepare your organization for the New Human Era.",
      },
    ],
  }),
  component: Contact,
});

/**
 * The fields, as data rather than three near-identical blocks — the original
 * shape of this form, kept, with the attributes a real submission needs.
 */
const FIELDS = [
  { id: "name", label: "Name", type: "text", required: true, autoComplete: "name" },
  { id: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
  { id: "org", label: "Organization", type: "text", required: false, autoComplete: "organization" },
] as const;

function Contact() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ContactResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);

    setPending(true);
    setResult(null);
    try {
      const outcome = await sendContactEnquiry({
        data: {
          name: String(values.get("name") ?? ""),
          email: String(values.get("email") ?? ""),
          org: String(values.get("org") ?? ""),
          message: String(values.get("message") ?? ""),
          fax: String(values.get("fax") ?? ""),
        },
      });
      setResult(outcome);
      // Only clear on success. Clearing after a failure would throw away what
      // the person wrote at the exact moment they need to send it elsewhere.
      if (outcome.ok) form.reset();
    } catch {
      // The same sentence the server would have sent, imported rather than
      // retyped — a client-side copy is how the address drifts in one place
      // only, which is the version nobody notices.
      setResult({ ok: false, reason: "failed", message: FALLBACK.failed });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section-cream grain">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-28">
        <div className="min-w-0">
          <p className="type-label-caps text-ink/50">Contact</p>
          <h1 className="type-h1-caps-light mt-6 text-ink">
            Prepare your organization for the New Human Era.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/70">
            Tell us where you are with machine intelligence and what you're trying to protect. We'll
            come back with a point of view, not a pitch deck.
          </p>
          <dl className="mt-12 space-y-4 border-t border-hairline-dark pt-6 text-sm text-ink/70">
            <div>
              <dt className="eyebrow text-ink/45">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-ink/45">Book a call</dt>
              <dd className="mt-1">
                <a href={BOOKING_URL_15MIN} target="_blank" rel="noreferrer" className="underline">
                  Fifteen minutes, no deck
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* The form actually sends now. Until 2026-08-19 its only submit
            handler was `preventDefault`, so every enquiry was discarded while
            the page looked like it had worked. */}
        <form
          className="space-y-6 border border-hairline-dark bg-cream-deep/40 p-8 lg:p-10"
          onSubmit={onSubmit}
        >
          {FIELDS.map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="eyebrow text-ink/50">
                {f.label}
              </label>
              <input
                id={f.id}
                name={f.id}
                type={f.type}
                required={f.required}
                autoComplete={f.autoComplete}
                disabled={pending}
                className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
              />
            </div>
          ))}
          <div>
            <label htmlFor="message" className="eyebrow text-ink/50">
              What are you working on?
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              disabled={pending}
              className="mt-2 w-full resize-none border-b border-ink/25 bg-transparent py-3 text-ink outline-none transition-colors focus:border-ink disabled:opacity-60"
            />
          </div>

          {/* Honeypot. Hidden from people and from screen readers; bots fill it
              in because they read the DOM, and anything that arrives with it set
              is dropped server-side. Named `fax` because autofill completes a
              hidden `website` field and would drop a real person's enquiry. */}
          <div className="hidden" aria-hidden>
            <label htmlFor="fax">Fax</label>
            <input id="fax" name="fax" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="eyebrow inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          >
            {pending ? "Sending\u2026" : "Work With Be Human Intelligence"}{" "}
            <span aria-hidden>{pending ? "" : "\u2192"}</span>
          </button>

          {/* One live region for both outcomes, so a screen reader hears the
              result without the focus being moved out from under it. */}
          <p
            role="status"
            aria-live="polite"
            className={[
              "type-body-sm",
              result?.ok ? "text-ink" : "text-ink/70",
              result ? "" : "sr-only",
            ].join(" ")}
          >
            {result?.ok
              ? "Thank you \u2014 that's on its way to us. We'll come back to you at the address you gave."
              : (result?.message ?? "")}
          </p>
        </form>
      </div>
    </section>
  );
}
