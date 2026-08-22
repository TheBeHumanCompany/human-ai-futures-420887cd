import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BOOKING_URL_30MIN } from "@/lib/booking";
import { POSITIONING_DISCLAIMER } from "@/lib/brand";
import { isSecondary, type Block, type Section } from "@/lib/blueprint";

/**
 * Rendering for the Blueprint page.
 *
 * ── Native `<details>`, not the vendored Accordion ────────────────────────────
 *
 * Every disclosure here is a native `<details>/<summary>`. The Radix accordion
 * was tried and rejected on evidence, and the reasons are worth keeping close to
 * the code so nobody swaps it back for consistency with the rest of `ui/`:
 *
 *  1. It unmounts closed content. "All sixteen sections are present" then
 *     becomes false for every collapsed one — the page would lose most of its
 *     text to search engines and to anything reading the document rather than
 *     watching it.
 *  2. With JavaScript disabled, server-rendered Radix regions cannot be opened
 *     at all. `forceMount` puts the content back in the DOM but leaves it
 *     permanently unreachable, which is arguably worse: it ships hidden content
 *     a reader can never reveal.
 *  3. The collapsed-count gate false-greened against it. Two closed items
 *     produced eight `[data-state="closed"]` matches and zero bodies, so a
 *     "six or more collapsed" check passed on two empty ones.
 *
 * `<details>` has none of those properties. Content is in the DOM and openable
 * with zero JavaScript, by construction rather than by configuration, and the
 * count is taken from `details[data-section-id]` deduplicated by id — one
 * element per section, no nested state attributes to miscount.
 */

const PROSE = "type-body max-w-2xl text-ink/75";

/**
 * The page's single call to action.
 *
 * Deliberately a text link on a lime rule rather than the lime pill it used to
 * be. The pill was a conversion control on a page that sold something; this
 * page does not, and a pill here would reintroduce the "buy now" reading that
 * the exclusive positioning exists to remove. It still points at the same
 * 30-minute booking link, which is the one destination AC-2.6 allows.
 */
function CtaLink({ label }: { label: string }) {
  return (
    <a
      href={BOOKING_URL_30MIN}
      target="_blank"
      rel="noreferrer"
      data-blueprint-cta="true"
      className="mt-10 inline-flex w-fit items-center gap-2.5 border-b border-lime-dark pb-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] text-ink"
    >
      {label}{" "}
      <span aria-hidden className="text-lime-dark transition-transform">
        &rarr;
      </span>
    </a>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "lead":
      return (
        <p
          className={`mt-8 max-w-3xl text-ink ${block.strong ? "type-h2-caps" : "type-h3-condensed"}`}
        >
          {block.text}
        </p>
      );

    case "para":
      return <p className={`mt-5 ${PROSE}`}>{block.text}</p>;

    case "list":
      return (
        <ul className={`mt-5 space-y-3 ${PROSE}`}>
          {block.items.map((item) => (
            <li key={item} className="border-l-2 border-lime pl-4">
              {item}
            </li>
          ))}
        </ul>
      );

    case "check":
      return (
        <ul className={`mt-5 space-y-2 ${PROSE}`}>
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden className="text-lime">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <div className="mt-8 grid gap-px bg-hairline-dark sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.n} className="bg-cream p-6 lg:p-8">
              <span className="eyebrow text-lime">{item.n}</span>
              <h3 className="type-h4-caps mt-4 text-ink">{item.title}</h3>
              <p className="type-body-sm mt-3 text-ink/70">{item.text}</p>
            </div>
          ))}
        </div>
      );

    /**
     * The three pillars, as outcomes.
     *
     * The question sits in the left rail and the outcomes stack to its right,
     * each on its own hairline, so a reader scanning the page gets three
     * questions and nine statements rather than a wall. The link at the foot of
     * each pillar is the one route to the method: withheld here, written in
     * full on the pillar page.
     */
    case "outcomes":
      return (
        <div className="mt-12 space-y-14 lg:space-y-16">
          {block.pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="grid gap-8 border-t border-hairline-dark pt-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14"
            >
              <div>
                <span className="eyebrow text-lime-dark">{pillar.n}</span>
                <h3 className="type-h3-caps mt-4 text-ink">{pillar.title}</h3>
                <p className="type-h4-prose mt-5 text-lime-dark">{pillar.question}</p>
              </div>

              <div className="min-w-0">
                <p className="eyebrow text-ink/45">What is different afterwards</p>
                <ul className="mt-5">
                  {pillar.items.map((item) => (
                    <li
                      key={item}
                      className="type-h4-condensed border-t border-hairline-dark py-5 text-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={pillar.to}
                  className="eyebrow mt-6 inline-flex w-fit items-center gap-2 border-b border-lime-dark pb-1 text-ink"
                >
                  {pillar.linkLabel} <span aria-hidden>&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      );

    case "criteria":
      return (
        <div className="mt-8 grid gap-px bg-hairline-dark sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.title} className="bg-cream p-6 lg:p-8">
              <h3 className="type-h4-caps text-ink">{item.title}</h3>
              <p className="type-body-sm mt-3 text-ink/70">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "cta":
      return <CtaLink label={block.label} />;

    case "disclaimer":
      return (
        <p
          data-positioning-disclaimer="true"
          className="type-body-sm mt-8 max-w-2xl border-l-2 border-ink/25 pl-4 text-ink/60"
        >
          {POSITIONING_DISCLAIMER}
        </p>
      );

    case "pending":
      return (
        <div
          data-testimonial-pending="true"
          className="mt-8 max-w-2xl border border-dashed border-ink/30 bg-cream-deep/40 p-6"
        >
          <p className="eyebrow text-ink/50">{block.label}</p>
          <p className="type-body-sm mt-3 text-ink/70">{block.note}</p>
        </div>
      );
  }
}

/**
 * A run of expository blocks, behind an in-section disclosure.
 *
 * Also a native `<details>`, and deliberately without `data-section-id` — these
 * are depth inside a section, not sections, and counting them as sections would
 * make the collapsed-section floor meaningless.
 */
function SecondaryRun({ blocks }: { blocks: readonly Block[] }) {
  return (
    <details className="group mt-6 max-w-2xl">
      <summary className="eyebrow inline-flex cursor-pointer list-none items-center gap-2 text-ink/60 marker:hidden hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="link-underline">Read the detail</span>
        <span aria-hidden className="transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-2">
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </details>
  );
}

/** Groups consecutive secondary blocks so document order is preserved exactly. */
function renderBlocks(blocks: readonly Block[]) {
  const out: React.ReactNode[] = [];
  let run: Block[] = [];

  const flush = (key: number) => {
    if (run.length === 0) return;
    out.push(<SecondaryRun key={`run-${key}`} blocks={run} />);
    run = [];
  };

  blocks.forEach((block, i) => {
    if (isSecondary(block)) {
      run.push(block);
      return;
    }
    flush(i);
    out.push(<BlockView key={i} block={block} />);
  });
  flush(blocks.length);

  return out;
}

export function BlueprintSectionView({ section }: { section: Section }) {
  const body = renderBlocks(section.blocks);

  // Tier 2 — the whole section is a disclosure. The `id` and `data-section-id`
  // sit on the `<details>` itself, which is always in the DOM whether open or
  // closed, so "the sixteen ids are present in order" stays true while
  // collapsed. Putting the id on inner content would make that assertion depend
  // on the open state.
  if (section.tier === 2) {
    return (
      <details
        id={section.id}
        data-section-id={section.id}
        data-tier={section.tier}
        className="group scroll-mt-24 border-b border-hairline-dark"
      >
        <summary className="cursor-pointer list-none py-8 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="flex items-baseline justify-between gap-6">
            <span>
              <h2 className="type-h3-caps text-ink">{section.title}</h2>
              {section.summary && (
                <span className="type-body mt-3 block max-w-2xl text-ink/60">
                  {section.summary}
                </span>
              )}
            </span>
            <span
              aria-hidden
              className="type-h3-condensed shrink-0 text-lime transition-transform group-open:rotate-45"
            >
              +
            </span>
          </span>
        </summary>
        <div className="pb-12">{body}</div>
      </details>
    );
  }

  return (
    <section
      id={section.id}
      data-tier={section.tier}
      className="scroll-mt-24 border-b border-hairline-dark py-14 lg:py-20"
    >
      <h2 className="type-h2-caps text-ink">{section.title}</h2>
      {body}
    </section>
  );
}

/**
 * The in-page rail — the second nav this page is allowed, and the only one on
 * the site.
 *
 * It tracks scroll position and marks the current section rather than listing
 * anchors decoratively. That is the point: a long page stops feeling endless
 * once its shape and your place in it are legible, which is the actual remedy
 * for "this feels like information overload". A static list of sixteen links
 * would be one more thing to read.
 *
 * `IntersectionObserver` rather than a scroll handler — no per-frame work, and
 * it degrades to "no highlight" rather than to a broken page if unavailable.
 * The links are real fragment hrefs, so the rail still navigates with
 * JavaScript disabled; only the highlighting needs it.
 */
export function BlueprintSubnav({ sections }: { sections: readonly Section[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-24 hidden lg:block">
      <p className="eyebrow text-ink/40">On this page</p>
      <span className="type-eyebrow-rule block" aria-hidden />
      <ol className="mt-5 space-y-1.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={`type-body-sm block border-l-2 py-1 pl-3 transition-colors ${
                active === section.id
                  ? "border-lime text-ink"
                  : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
