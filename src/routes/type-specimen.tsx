/**
 * `/type-specimen` — the G1 review instrument (S0.7, AC-4.3).
 *
 * This is NOT a site page. It exists so the proposed type scale can be approved
 * against real font rendering, and to keep that scale reviewable after it was
 * applied. It records what shipped, on both the size and the WEIGHT axis.
 * and it is DELETED in S8.2 once the scale is approved and applied. It is
 * `noindex, nofollow`, and it is absent from `sitemap[.]xml.ts`'s static list.
 *
 * It is also the one file `scripts/type-inventory.ts` excludes: a mapping table
 * that reads "`display` → `type-h1-caps`" contains the bare literal `display`,
 * which the string-literal scanner would otherwise count as a call site.
 *
 * Every number in the "computed" column is read off the live DOM with
 * `getComputedStyle` — nothing here is hardcoded, so a specimen that claims a
 * weight the browser did not actually render is not possible.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import inventory from "../../docs/type-inventory.json";

export const Route = createFileRoute("/type-specimen")({
  head: () => ({
    meta: [
      { title: "Type specimen — review instrument (not a site page)" },
      // R18: this route must never be indexed and is deleted in Phase 8.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  // TanStack's default search parser JSON-parses each value, so `?frame=1`
  // arrives as the NUMBER 1, not the string "1". Matching only the string made
  // the router treat the param as unknown and 307 it away, which silently broke
  // the three viewport iframes below — they all rendered the outer page instead.
  validateSearch: (search: Record<string, unknown>) => ({
    frame: search.frame === 1 || search.frame === "1" ? (1 as const) : undefined,
  }),
  component: TypeSpecimen,
});

/* ── The proposed scale, as review rows ───────────────────────────────────── */

interface Row {
  /** The utility class under review. */
  cls: string;
  /** Which of the three mockup voices this row belongs to. */
  voice: 1 | 2 | 3 | 4 | 0;
  /** The exemplar string, taken verbatim from a mockup wherever one exists. */
  sample: string;
  /** Where that string appears, so the reviewer can compare like with like. */
  source: string;
}

const VOICES = {
  1: { name: "Condensed bold uppercase", face: "Oswald 700", note: "the hammer lines" },
  2: { name: "Condensed light sentence case", face: "Oswald 300", note: "unreachable on main" },
  3: {
    name: "Wide light sentence case",
    face: "Work Sans 200/300",
    note: "does not exist on main",
  },
  4: {
    name: "Condensed light UPPERCASE",
    face: "Oswald 200",
    note: "what `display` actually is — 24 sites incl. the Wordmark",
  },
  0: { name: "Body & supporting", face: "Work Sans 400/500", note: "" },
} as const;

const ROWS: Row[] = [
  // Voice 1 — Oswald 700 uppercase.
  {
    cls: "type-h1-caps",
    voice: 1,
    sample: "It is part of how you build one.",
    source:
      "mockup 3 — the answering line under the big question. Also the page-hero step: the page heroes disagreed (6.0 / 5.5 / 5.2 / 5.0rem) and now share it.",
  },
  {
    cls: "type-h2-caps",
    voice: 1,
    sample: "So we started asking one question: what does it mean to be human?",
    source: "mockup 1 — Human Archive section heading",
  },
  {
    cls: "type-h3-caps",
    voice: 1,
    sample: "This is bigger than AI.",
    source: "mockup 2 — black band, under the lime rule",
  },
  {
    cls: "type-h4-caps",
    voice: 1,
    sample: "It is about who we are as human beings and what kind of world we build next.",
    source: "mockup 2 — the subline beneath it",
  },
  // Voice 4 — Oswald 200 UPPERCASE. This is what `display` has always been, and
  // it had no home in the first draft of the scale. Without it, migrating
  // `display`'s 24 call sites means restyling the Wordmark from 200 to 700.
  {
    cls: "type-hero-caps-light",
    voice: 4,
    sample: "The future is human.",
    source: "the homepage hero — 8.5rem at Oswald 200, the largest type on the site",
  },
  {
    cls: "type-h1-caps-light",
    voice: 4,
    sample: "Real stories. Real humans.",
    source: "the page heroes — /about, /contact, /the-human-archive, /podcast",
  },
  {
    cls: "type-h4-caps-light",
    voice: 4,
    sample: "Real is rare.",
    source: "small light uppercase — archive names and card labels",
  },
  {
    cls: "type-wordmark",
    voice: 1,
    sample: "The Be Human Company",
    source:
      "the company lockup. Its own step, because a wordmark is designed around its letterspacing — this one is negatively tracked and a general heading step would loosen it.",
  },
  {
    cls: "type-label-caps",
    voice: 1,
    sample: "The Human Archive",
    source:
      "mockup 1 — the section opener above the lime rule. The `section-label` successor: its call sites (0.75–1.125rem, Oswald 700, 0.08em) fit neither the eyebrow nor h4.",
  },

  // Voice 2 — Oswald 300 sentence case. Currently impossible: the existing
  // condensed utility hardcodes `text-transform: uppercase`.
  {
    cls: "type-h1-condensed",
    voice: 2,
    sample: "We are the Bridge Generation.",
    source: "mockup 2 — left column, Bridge Generation section",
  },
  {
    cls: "type-h2-condensed",
    voice: 2,
    sample: "Technology is advancing, and humanity has to advance with it.",
    source: "mockup 2 — right column",
  },
  {
    cls: "type-h3-condensed",
    voice: 2,
    sample:
      "If these are the things people tell us make life human, why have we built a world that keeps pushing them aside?",
    source: "mockup 2 — centred cream band",
  },
  {
    cls: "type-h4-condensed",
    voice: 2,
    sample: "Our job is not simply to cross that bridge. It is to decide what we bring with us.",
    source: "mockup 2 — emphasised pull line",
  },

  // Voice 3 — Work Sans 200/300, wide, sentence case. Absent entirely today.
  {
    cls: "type-h1-prose",
    voice: 3,
    sample: "But what if your humanity is not the reward at the end of a good life?",
    source: "mockup 3 — the centred question",
  },
  {
    cls: "type-h2-prose",
    voice: 3,
    sample: "What if practising your humanity is how you build the life you want?",
    source: "mockup 4 — The Bigger Question",
  },
  {
    cls: "type-h3-prose",
    voice: 3,
    sample: "We are not here to add more to your life. We are here to develop who you are being.",
    source: "mockup 3 — black band, right column",
  },
  {
    cls: "type-h4-prose",
    voice: 3,
    sample: "Your humanity is not separate from those outcomes.",
    source: "mockup 3 — the line before the inline uppercase answer",
  },

  // Body and supporting.
  {
    cls: "type-body-lg",
    voice: 0,
    sample:
      "Most of us were taught that if we became successful enough, the freedom and happiness we wanted would arrive with it.",
    source: "mockup 3 — centred paragraph",
  },
  {
    cls: "type-body",
    voice: 0,
    sample:
      "More than 200 people have answered us so far. Different ages. Different backgrounds. Different stories.",
    source: "mockup 1 — Human Archive paragraph",
  },
  {
    cls: "eyebrow",
    voice: 0,
    sample: "The bigger question.",
    source: "mockup 4 — section opener (existing utility, out of migration scope)",
  },
];

/* ── Live computed values ─────────────────────────────────────────────────── */

const MEASURED = [
  "font-family",
  "font-weight",
  "font-size",
  "line-height",
  "letter-spacing",
] as const;

type Computed = Record<string, string>;

function shortFamily(family: string): string {
  const first = family.split(",")[0]?.replace(/["']/g, "").trim();
  return first || family;
}

function SpecimenRow({ row, index }: { row: Row; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [computed, setComputed] = useState<Computed | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fonts must be settled first, or the first paint reports the fallback
    // family's metrics and the specimen shows values the reviewer never saw.
    let cancelled = false;
    const measure = () => {
      if (cancelled || !el) return;
      const cs = getComputedStyle(el);
      const next: Computed = {};
      for (const prop of MEASURED) next[prop] = cs.getPropertyValue(prop);
      next["text-transform"] = cs.getPropertyValue("text-transform");
      setComputed(next);
    };
    void document.fonts.ready.then(measure);
    measure();
    return () => {
      cancelled = true;
    };
  }, []);

  const voice = VOICES[row.voice];

  return (
    <article
      data-specimen-row={row.cls}
      data-row-index={index}
      data-computed-font-family={computed ? shortFamily(computed["font-family"]) : ""}
      data-computed-font-weight={computed?.["font-weight"] ?? ""}
      data-computed-font-size={computed?.["font-size"] ?? ""}
      data-computed-line-height={computed?.["line-height"] ?? ""}
      data-computed-letter-spacing={computed?.["letter-spacing"] ?? ""}
      data-computed-text-transform={computed?.["text-transform"] ?? ""}
      className="grid gap-5 border-t border-hairline-dark py-10 lg:grid-cols-[1fr_16rem] lg:gap-10"
    >
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <code className="rounded-sm bg-ink px-2 py-1 font-mono text-[0.6875rem] tracking-wide text-cream">
            .{row.cls}
          </code>
          <span className="eyebrow text-ink/40">
            Voice {row.voice === 0 ? "—" : row.voice} · {voice.face}
          </span>
        </div>
        <p ref={ref} className={`${row.cls} text-ink`}>
          {row.sample}
        </p>
        <p className="mt-4 text-[0.75rem] leading-relaxed text-ink/45">{row.source}</p>
      </div>

      <dl className="self-start rounded-sm bg-cream-deep/60 p-4 font-mono text-[0.6875rem] leading-relaxed text-ink/70">
        {computed === null ? (
          <div className="text-ink/40">measuring…</div>
        ) : (
          [...MEASURED, "text-transform"].map((prop) => (
            <div key={prop} className="flex justify-between gap-3">
              <dt className="text-ink/45">{prop}</dt>
              <dd className="text-right text-ink">
                {prop === "font-family" ? shortFamily(computed[prop]) : computed[prop]}
              </dd>
            </div>
          ))
        )}
      </dl>
    </article>
  );
}

/* ── Page furniture ───────────────────────────────────────────────────────── */

function SectionOpener({ label, children }: { label: string; children: ReactNode }) {
  return (
    <header className="mb-10">
      <p className="eyebrow text-ink/50">{label}</p>
      <div className="type-eyebrow-rule" />
      <div className="mt-6">{children}</div>
    </header>
  );
}

const VIEWPORTS = [
  { width: 390, label: "390 — phone" },
  { width: 768, label: "768 — tablet" },
  { width: 1440, label: "1440 — desktop reference" },
] as const;

/**
 * Real iframes at real widths. A fixed-width `<div>` would be a lie here: every
 * size in the scale is a `clamp()` with a `vw` term, and `vw` resolves against
 * the viewport, not the container. Only a nested browsing context re-resolves it.
 */
function ViewportFrames() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {VIEWPORTS.map((vp) => {
        const scale = vp.width > 460 ? 460 / vp.width : 1;
        return (
          <figure key={vp.width} data-viewport={vp.width} className="min-w-0">
            <figcaption className="eyebrow mb-3 text-ink/50">{vp.label}</figcaption>
            {/* The iframe is absolutely positioned. `transform: scale()` shrinks
                what you SEE but not what the element occupies in layout, so a
                1440px frame in normal flow makes this whole page scroll
                sideways on a phone — which the browser suite caught. Taking it
                out of flow lets the wrapper own the footprint. */}
            <div
              className="relative w-full overflow-hidden rounded-lg border border-hairline-dark bg-cream"
              style={{ height: 520 }}
            >
              <iframe
                title={`Specimen at ${vp.width}px`}
                src="/type-specimen?frame=1"
                width={vp.width}
                height={Math.round(520 / scale)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: vp.width,
                  height: Math.round(520 / scale),
                  border: 0,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          </figure>
        );
      })}
    </div>
  );
}

/* ── The mapping table (S0.6 — "the user approves this mapping") ──────────── */

function MappingTable() {
  const inScope = inventory.occurrences.filter((o) => o.category === "utility-in-scope");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left text-[0.8125rem]">
        <thead>
          <tr className="border-b border-ink/20">
            <th className="eyebrow py-3 pr-4 text-ink/50">Call site</th>
            <th className="eyebrow py-3 pr-4 text-ink/50">Utility today</th>
            <th className="eyebrow py-3 text-ink/50">Proposed step</th>
          </tr>
        </thead>
        <tbody>
          {inScope.map((o, i) => (
            <tr key={`${o.file}:${o.line}:${i}`} className="border-b border-hairline-dark">
              <td className="py-2 pr-4 font-mono text-[0.6875rem] text-ink/60">
                {o.file.replace(/^src\//, "")}:{o.line}
              </td>
              <td className="py-2 pr-4 font-mono text-[0.6875rem] text-ink">{o.raw}</td>
              <td className="py-2 text-ink/80">{o.proposed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── The route component ──────────────────────────────────────────────────── */

function TypeSpecimen() {
  const { frame } = Route.useSearch();

  // The iframe variant renders the rows only — no nested frames, no tables.
  if (frame === 1) {
    return (
      <main className="section-cream min-h-screen px-5 py-8">
        {ROWS.map((row, i) => (
          <SpecimenRow key={row.cls} row={row} index={i} />
        ))}
      </main>
    );
  }

  return (
    <main className="section-cream min-h-screen">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <SectionOpener label="Review instrument — not a site page">
          <h1 className="type-h2-caps text-ink">The type scale, for approval</h1>
          <p className="type-body-lg mt-6 max-w-2xl text-ink/70">
            Three display voices across two family axes, measured off Maya&rsquo;s four New Human
            Era mockups. Every value in the right-hand column is read from the live DOM with{" "}
            <code className="font-mono text-[0.875em]">getComputedStyle</code> after the webfonts
            have loaded — nothing on this page is a hardcoded number.
          </p>
          <p className="type-body mt-4 max-w-2xl text-ink/55">
            This route is <code className="font-mono text-[0.875em]">noindex</code>, absent from the
            sitemap, and deleted once the scale is approved and applied.
          </p>
        </SectionOpener>

        {/* The three voices, stated before they are shown. */}
        <section className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4] as const).map((v) => (
            <div key={v} className="rounded-sm border border-hairline-dark p-5">
              <p className="eyebrow text-ink/40">Voice {v}</p>
              <div className="type-eyebrow-rule" />
              <p className="type-h4-caps mt-4 text-ink">{VOICES[v].name}</p>
              <p className="type-body mt-2 text-ink/60">{VOICES[v].face}</p>
              <p className="mt-1 text-[0.75rem] text-ink/45">{VOICES[v].note}</p>
            </div>
          ))}
        </section>

        {/* The three voices side by side, as the mockups pose them. */}
        <section className="mb-20">
          <p className="eyebrow text-ink/50">The three voices, side by side</p>
          <div className="type-eyebrow-rule" />
          <div className="mt-8 grid gap-10 lg:grid-cols-2 xl:grid-cols-4">
            <p className="type-h3-caps text-ink">This is bigger than AI.</p>
            <p className="type-h2-condensed text-ink">We are the Bridge Generation.</p>
            <p className="type-h2-prose text-ink">
              But what if your humanity is not the reward at the end of a good life?
            </p>
            <p className="type-h3-caps-light text-ink">The future is human.</p>
          </div>
        </section>

        {/* Every step, with live computed values. */}
        <section className="mb-20" data-specimen-rows={ROWS.length}>
          <p className="eyebrow text-ink/50">Every step</p>
          <div className="type-eyebrow-rule" />
          <div className="mt-2">
            {ROWS.map((row, i) => (
              <SpecimenRow key={row.cls} row={row} index={i} />
            ))}
          </div>
        </section>

        {/* The accent system, so lime is approved as an accent and not a fill. */}
        <section className="mb-20">
          <p className="eyebrow text-ink/50">Lime is an accent, never a fill</p>
          <div className="type-eyebrow-rule" />
          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <div>
              <p className="type-h3-condensed text-ink">
                If these are the things people tell us make life{" "}
                <span className="underline decoration-lime decoration-[3px] underline-offset-[6px]">
                  human
                </span>
                , why have we built a world that keeps pushing them aside?
              </p>
              <p className="mt-3 text-[0.75rem] text-ink/45">
                Job 2 of 4 — a single-word underline mid-sentence (mockup 2).
              </p>
            </div>
            <div>
              <blockquote className="type-h3-condensed relative text-ink">
                <span aria-hidden className="mr-1 text-lime-dark">
                  &ldquo;
                </span>
                Love. Love each other.
                <span aria-hidden className="ml-1 text-lime-dark">
                  &rdquo;
                </span>
              </blockquote>
              <p className="eyebrow mt-4 text-ink/50">Adewolf / Vancouver</p>
              <p className="mt-3 text-[0.75rem] text-ink/45">
                Job 3 of 4 — quote glyphs on archive quotes (mockup 2).
              </p>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-3xl">
            <div className="type-divider-dot text-ink" />
            <p className="mt-3 text-center text-[0.75rem] text-ink/45">
              Job 4 of 4 — a centred hairline with a lime dot at its midpoint (mockup 3).
            </p>
          </div>
        </section>

        {/* Real viewports, because vw does not resolve inside a fixed-width div. */}
        <section className="mb-20">
          <p className="eyebrow text-ink/50">Three viewports</p>
          <div className="type-eyebrow-rule" />
          <div className="mt-8">
            <ViewportFrames />
          </div>
        </section>

        {/* What the user is actually approving: the mapping, not four numbers. */}
        <section>
          <p className="eyebrow text-ink/50">The mapping — {inventory.scope.binding} call sites</p>
          <div className="type-eyebrow-rule" />
          <p className="type-body mt-6 max-w-2xl text-ink/60">
            Generated by <code className="font-mono text-[0.875em]">scripts/type-inventory.ts</code>{" "}
            (SHA-256{" "}
            <code className="font-mono text-[0.75em]">{inventory.scannerSha256.slice(0, 16)}…</code>
            ). The four names carry {inventory.scope.fourAc42Names} sites and the{" "}
            <code className="font-mono text-[0.875em]">section-label</code> variants add{" "}
            {inventory.scope.sectionLabelVariants}, for the binding {inventory.scope.binding}. The{" "}
            {inventory.scope.eyebrowOutOfScope} existing eyebrow sites are out of scope and are not
            migrated.
          </p>
          <div className="mt-8">
            <MappingTable />
          </div>
        </section>
      </div>
    </main>
  );
}
