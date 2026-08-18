import { createFileRoute } from "@tanstack/react-router";

import { BOOKING_URL_15MIN } from "@/lib/booking";

// The "Studios" row that used to sit in this list named three cities on three
// continents. This company has offices in none of them, and a contact page is
// the last place a plausible-sounding invention belongs. The booking link
// replaces it with something a reader can actually act on.
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

function Contact() {
  return (
    <section className="section-cream grain">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-28">
        <div className="min-w-0">
          <p className="type-label-caps text-ink/50">Contact</p>
          <h1 className="type-h1-caps-light mt-6 text-ink">
            Prepare your organization for the New Human Era.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/70">
            Tell us where you are with AI and what you're trying to protect. We'll come back with a
            point of view, not a pitch deck.
          </p>
          <dl className="mt-12 space-y-4 border-t border-hairline-dark pt-6 text-sm text-ink/70">
            <div>
              <dt className="eyebrow text-ink/45">Email</dt>
              <dd className="mt-1">info@thebehumancompany.ca</dd>
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

        <form
          className="space-y-6 border border-hairline-dark bg-cream-deep/40 p-8 lg:p-10"
          onSubmit={(e) => e.preventDefault()}
        >
          {[
            { id: "name", label: "Name", type: "text" },
            { id: "email", label: "Work email", type: "email" },
            { id: "org", label: "Organization", type: "text" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="eyebrow text-ink/50">
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
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
              rows={4}
              className="mt-2 w-full resize-none border-b border-ink/25 bg-transparent py-3 text-ink outline-none transition-colors focus:border-ink"
            />
          </div>
          <button
            type="submit"
            className="eyebrow inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-cream transition-transform hover:-translate-y-0.5"
          >
            Work With Be Human AI <span aria-hidden>→</span>
          </button>
        </form>
      </div>
    </section>
  );
}
