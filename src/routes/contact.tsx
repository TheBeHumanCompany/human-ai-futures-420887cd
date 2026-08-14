import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { submitLead } from "@/lib/contact/submit";

/**
 * The submission itself lives in `@/lib/contact/submit`, not here. Routes in
 * this project do not talk to the network directly, and `src/lib/layering.test.ts`
 * enforces it.
 */
type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Work With Be Human AI" },
      {
        name: "description",
        content:
          "Talk to us about AI readiness, governance, agents and leadership programs for your organization.",
      },
      { property: "og:title", content: "Contact — Work With Be Human AI" },
      {
        property: "og:description",
        content: "Prepare your organization for the New Human Era.",
      },
    ],
  }),
  component: Contact,
});

const FIELDS = [
  { id: "name", label: "Name", type: "text", autoComplete: "name" },
  { id: "email", label: "Work email", type: "email", autoComplete: "email" },
  { id: "org", label: "Organization", type: "text", autoComplete: "organization" },
] as const;

function Contact() {
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;

    const form = new FormData(event.currentTarget);
    setState({ status: "submitting" });

    const result = await submitLead({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      organization: String(form.get("org") ?? ""),
      message: String(form.get("message") ?? ""),
    });

    setState(
      result.ok
        ? { status: "success" }
        : {
            status: "error",
            // A validation message is written for the visitor and is shown as
            // written. Network and service failures are not — "TypeError: Failed
            // to fetch" tells them nothing they can act on.
            message:
              result.reason === "validation"
                ? result.detail
                : "That didn't send. Please try again, or email us directly.",
          },
    );
  }

  return (
    <section className="section-cream grain">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-28">
        <div className="min-w-0">
          <p className="eyebrow text-ink/50">Contact</p>
          <h1 className="display mt-6 text-[clamp(2.5rem,7vw,5rem)] text-ink">
            Prepare your organization for the New Human Era.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/70">
            Tell us where you are with AI and what you're trying to protect. We'll come back with a
            point of view, not a pitch deck.
          </p>
          <dl className="mt-12 space-y-4 border-t border-hairline-dark pt-6 text-sm text-ink/70">
            <div>
              <dt className="eyebrow text-ink/45">New business</dt>
              <dd className="mt-1">ai@thebehumancompany.ca</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink/45">Everything else</dt>
              <dd className="mt-1">hello@thebehumancompany.ca</dd>
            </div>
            <div>
              <dt className="eyebrow text-ink/45">Where we are</dt>
              <dd className="mt-1">Indigenous and Canadian-owned.</dd>
            </div>
          </dl>
        </div>

        {state.status === "success" ? (
          <div
            className="border border-hairline-dark bg-cream-deep/40 p-8 lg:p-10"
            role="status"
            aria-live="polite"
          >
            <p className="eyebrow text-ink/50">Message sent</p>
            <p className="display mt-6 text-3xl text-ink lg:text-4xl">Thank you.</p>
            <p className="mt-6 max-w-sm leading-relaxed text-ink/70">
              We&apos;ve got it, and we&apos;ll come back to you with a point of view rather than a
              pitch deck.
            </p>
          </div>
        ) : (
          <form
            className="space-y-6 border border-hairline-dark bg-cream-deep/40 p-8 lg:p-10"
            onSubmit={handleSubmit}
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
                  autoComplete={f.autoComplete}
                  className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-ink outline-none transition-colors focus:border-ink"
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
                className="mt-2 w-full resize-none border-b border-ink/25 bg-transparent py-3 text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            {state.status === "error" && (
              <p role="alert" className="text-sm leading-relaxed text-destructive">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={state.status === "submitting"}
              className="eyebrow inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {state.status === "submitting" ? "Sending…" : "Work With Be Human AI"}
              <span aria-hidden>→</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
