import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { CONTACT_EMAIL } from "@/lib/brand";
import { FALLBACK, sendContactEnquiry, type ContactResult } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — The Be Human Company" },
      {
        name: "description",
        content:
          "Whether you want to work with us, partner with us, or join the conversation — tell us what's on your mind.",
      },
      { property: "og:title", content: "Contact — The Be Human Company" },
      {
        property: "og:description",
        content:
          "Whether you want to work with us, partner with us, or join the conversation — tell us what's on your mind.",
      },
    ],
  }),
  component: Contact,
});

/**
 * The fields, as data rather than three near-identical blocks. Labels render
 * uppercase via styling; the values stay sentence case for autofill semantics.
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
      setResult({ ok: false, reason: "failed", message: FALLBACK.failed });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section-cream grain">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:py-24 xl:gap-24">
        {/* LEFT — editorial column */}
        <div className="min-w-0">
          <p className="eyebrow text-ink/50">Contact</p>
          <h1 className="font-display mt-8 text-[clamp(3.375rem,8vw,6.875rem)] leading-[0.95] font-extralight tracking-[0.005em] text-ink uppercase">
            Let&rsquo;s
            <br />
            Connect
          </h1>

          <div className="mt-11 max-w-[44ch] space-y-7 text-[1.0625rem] leading-relaxed text-ink/80 lg:text-lg">
            <p>
              We&rsquo;re building The Be Human Company around a simple belief: the more artificial
              the world becomes, the more important our humanity becomes.
            </p>
            <p>
              Whether you want to work with us, partner with us, join the conversation, share your
              story, or simply learn more about what we&rsquo;re building, we&rsquo;d love to hear
              from you.
            </p>
          </div>

          <p className="mt-10 text-[1.0625rem] font-semibold text-ink lg:text-lg">
            Tell us what&rsquo;s on your mind.
          </p>

          <div className="mt-14 border-t border-ink/15 pt-6">
            <p className="eyebrow text-ink/45">Email</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-block text-[0.9375rem] text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        {/* RIGHT — dark form panel. The form actually sends; until 2026-08-19
            its only submit handler was `preventDefault`. */}
        <form
          className="rounded-xl bg-ink p-7 sm:p-10 lg:p-14"
          onSubmit={onSubmit}
        >
          <div className="space-y-8">
            {FIELDS.map((f) => (
              <div key={f.id}>
                <label
                  htmlFor={f.id}
                  className="text-[0.6875rem] font-medium tracking-[0.14em] text-cream/60 uppercase"
                >
                  {f.label}
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  required={f.required}
                  autoComplete={f.autoComplete}
                  disabled={pending}
                  className="mt-3 w-full border-b border-cream/25 bg-transparent py-3 text-cream outline-none transition-colors duration-200 focus:border-cream/70 disabled:opacity-60"
                />
              </div>
            ))}
            <div>
              <label
                htmlFor="message"
                className="text-[0.6875rem] font-medium tracking-[0.14em] text-cream/60 uppercase"
              >
                What&rsquo;s on your mind?
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                disabled={pending}
                className="mt-3 w-full resize-none border-b border-cream/25 bg-transparent py-3 text-cream outline-none transition-colors duration-200 focus:border-cream/70 disabled:opacity-60"
              />
            </div>
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
            className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-full bg-lime px-10 py-4 text-[0.8125rem] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-200 hover:bg-lime-dark disabled:opacity-60 sm:w-auto sm:min-w-[65%] lg:min-w-[70%]"
          >
            {pending ? "Sending\u2026" : "Start a conversation"}
            <span aria-hidden>{pending ? "" : "\u2192"}</span>
          </button>

          {/* One live region for both outcomes, so a screen reader hears the
              result without the focus being moved out from under it. */}
          <p
            role="status"
            aria-live="polite"
            className={[
              "type-body-sm mt-5",
              result?.ok ? "text-cream" : "text-cream/70",
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
