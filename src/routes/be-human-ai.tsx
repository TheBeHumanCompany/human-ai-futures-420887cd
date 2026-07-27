import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVICES } from "@/lib/content";

export const Route = createFileRoute("/be-human-ai")({
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
          <h2 className="eyebrow text-ink/50">Capabilities</h2>
          <div className="mt-10 grid gap-px bg-hairline-dark sm:grid-cols-2">
            {SERVICES.map((s) => (
              <article key={s.n} className="bg-cream p-8 lg:p-12">
                <span className="eyebrow text-ink/40">{s.n}</span>
                <h3 className="display mt-6 text-3xl text-ink lg:text-4xl">{s.title}</h3>
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
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="eyebrow text-lime">How we work</h2>
          <div className="mt-10 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <div key={p.n} className="bg-background p-8">
                <span className="eyebrow text-lime">{p.n}</span>
                <h3 className="display mt-5 text-3xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
