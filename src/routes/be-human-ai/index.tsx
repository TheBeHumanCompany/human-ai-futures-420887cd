import { createFileRoute, Link } from "@tanstack/react-router";

import { ProcessSteps } from "@/components/sales/process-steps";
import { SERVICES } from "@/lib/content";

/**
 * The services overview, moved here from the former flat `src/routes/be-human-ai.tsx`
 * so that `/be-human-ai/blueprint` and the three pillar pages can live beneath it.
 *
 * **The route id carries a trailing slash and the public URL does not.** The generator
 * keys `FileRoutesByPath` on `'/be-human-ai/'` while that entry's own `path` is
 * `'/be-human-ai'`, and `createFileRoute` is constrained to `keyof FileRoutesByPath` —
 * so the *key* is what the argument has to match. Copying the old
 * `createFileRoute("/be-human-ai")` verbatim is a hard type error once the flat file is
 * gone. The `to:` union still carries `/be-human-ai` without the slash, which is why
 * every existing `<Link to="/be-human-ai">` keeps working untouched.
 *
 * There is deliberately no `be-human-ai/route.tsx` layout file. Nothing needs hoisting —
 * header and footer live in `__root.tsx` and each page sets its own `head()` — and a
 * parent route that forgets `<Outlet/>` silently swallows every child, which is the exact
 * failure `route-shape.test.ts:56-63` exists to catch. Add one later if shared chrome
 * ever appears; it is additive and changes no URL.
 */
export const Route = createFileRoute("/be-human-ai/")({
  head: () => ({
    meta: [
      { title: "Be Human AI — AI Strategy, Governance & Agents" },
      {
        name: "description",
        content:
          "AI readiness and strategy, human + AI transformation, security and governance, and AI agents built into real workflows.",
      },
      { property: "og:title", content: "Be Human AI — AI Strategy, Governance & Agents" },
      {
        property: "og:description",
        content: "Consulting and implementation that makes organizations ready for the AI era.",
      },
    ],
  }),
  component: BeHumanAI,
});

const PROCESS = [
  { n: "01", title: "Assess", body: "Where you stand on data, capability, risk and culture." },
  { n: "02", title: "Prioritise", body: "The few use cases that move the business, sequenced." },
  { n: "03", title: "Build", body: "Agents, workflows and guardrails shipped into production." },
  { n: "04", title: "Embed", body: "Literacy, governance and adoption that outlast the project." },
];

function BeHumanAI() {
  return (
    <>
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-lime">Be Human AI</p>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)]">
            Build an organization ready for the AI era.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            We help organizations strengthen their people, protect what matters and transform how
            work gets done. Real consulting, real implementation, measured on outcomes.
          </p>
          <Link
            to="/contact"
            className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
          >
            Work With Us <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-ink/50">Our approach</h2>
          <p className="display mt-8 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
            Prepare your people. Protect your organization. Transform your business.
          </p>
          <p className="mt-8 max-w-2xl leading-relaxed text-ink/75">
            Not three disconnected services. One complete approach to becoming a human-first,
            AI-powered organization.
          </p>

          <div className="mt-12 grid gap-px bg-hairline-dark lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article key={s.n} className="flex flex-col bg-cream p-8 lg:p-12">
                <span className="eyebrow text-ink/40">{s.n}</span>
                <p className="eyebrow mt-6 text-ink/50">{s.promise}</p>
                <h3 className="display mt-3 text-3xl text-ink lg:text-4xl">{s.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/70">{s.body}</p>
                <ul className="mt-7 space-y-2">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="border-t border-hairline-dark pt-2 text-xs uppercase tracking-widest text-ink/55"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
                <Link to={s.to} className="eyebrow link-underline mt-8 inline-block text-ink">
                  Explore <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">Start here</h2>
          <p className="display mt-8 max-w-3xl text-[clamp(2rem,5vw,3.25rem)]">
            The Be Human AI Blueprint™
          </p>
          <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
            An executive assessment and 90-day plan that tells you where AI creates the greatest
            leverage, what must be protected, and what to do first.
          </p>
          <Link
            to="/be-human-ai/blueprint"
            className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
          >
            See what the Blueprint includes <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">How we work</h2>
          <ProcessSteps steps={PROCESS} theme="ink" className="mt-10" />
        </div>
      </section>
    </>
  );
}
