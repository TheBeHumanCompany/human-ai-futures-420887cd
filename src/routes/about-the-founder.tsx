import { createFileRoute } from "@tanstack/react-router";

import aocFoodDrive from "@/assets/founder-aoc-fooddrive.webp";
import curvesTruck from "@/assets/founder-curves-truck.webp";
import diner from "@/assets/founder-diner.webp";
import harrington from "@/assets/founder-harrington.webp";
import mentoring from "@/assets/founder-mentoring.webp";

import pressCanIndia from "@/assets/founder-press-canindia.webp";
import pressCn from "@/assets/founder-press-cn.webp";
import satnam from "@/assets/founder-satnam.webp";

/**
 * `/about-the-founder` — "Meet the Founder", built from Maya's 2026-08-18 brief.
 *
 * ── Where every word came from ────────────────────────────────────────────
 *
 * The copy is the four-page PDF she captioned "the proper text", used verbatim
 * in Shane's first person. Nothing here is rewritten or summarised, and
 * `src/lib/copy-fidelity.test.ts` holds this file to
 * `docs/source/meet-the-founder.txt` sentence by sentence.
 *
 * ── The 2026-08-22 editorial restructure ──────────────────────────────────
 *
 * Four chapters, each a text column beside its own pictures:
 *
 *   1. Hero — text left (60%), an EMPTY portrait field right (40%). The frame
 *      is deliberately empty: Shane's portrait is coming, and a stock stand-in
 *      would be a fabricated photograph of a real person.
 *   2. Early years — the Curves trailer plus the two press scans, one gallery.
 *   3. Building at scale — the Harrington and Satnam frames as its gallery.
 *   4. Human performance + compassion — the former HUMAN PERFORMANCE and
 *      ACTIONS OF COMPASSION chapters merged, copy intact, three pictures.
 *
 * Removed in the same pass, at Maya's request: the ink "Businesses don't grow
 * because of products" pause, the MEDIA · LEADERSHIP · TRAINING chapter, the
 * closing "What I've learned" chapter, and the lime rule under every section
 * label. The two copy spans that left the page with them are named as accepted
 * divergences in the fidelity test rather than being quietly dropped.
 *
 * ── The image system ─────────────────────────────────────────────────────
 *
 * Photographs keep their OWN orientation; nothing is squeezed into a shared
 * ratio. Consistency comes from a shared column width, matching radius and one
 * vertical rhythm. `Archival` renders magazine scans whole on the cream page.
 */
export const Route = createFileRoute("/about-the-founder")({
  head: () => ({
    meta: [
      { title: "Meet the Founder — A Life Spent Building" },
      {
        name: "description",
        content:
          "Shane James on the businesses, teams and movements that led to The Be Human Company: a life spent building, and why this is the work he has devoted it to.",
      },
      { property: "og:title", content: "Meet the Founder — A Life Spent Building" },
      {
        property: "og:description",
        content:
          "Every business taught me how to build. Every team taught me how culture shapes performance.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Founder,
});

/**
 * A supporting photograph at its OWN aspect ratio. No `aspect-*`, no cover
 * crop: the file's proportions decide the height, the caller decides only how
 * wide it may get. `alt` is required by the type rather than optional — every
 * one of these is a photograph of real people doing real things.
 */
function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-auto w-full rounded-sm ${className}`}
    />
  );
}

/**
 * Archival document: no card, no beige field, no radius — a scan sitting
 * directly on the cream page at its natural proportions.
 */
function Archival({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Shot src={src} alt={alt} className={`rounded-none object-contain ${className}`} />;
}

/**
 * The section kicker: uppercase label, `text-ink/50` on cream. The lime rule
 * that used to sit beneath it was removed on 2026-08-22 — the page carries no
 * underlines at all now.
 */
function SectionLabel({ children }: { children: string }) {
  return <p className="type-label-caps text-ink/50">{children}</p>;
}

/** Story column / picture column. Shared by every chapter so the rhythm matches. */
const CHAPTER_GRID = "grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16";
const CHAPTER_PAD = "mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24";

function Founder() {
  return (
    <>
      {/* ══════ 01 — MEET THE FOUNDER (cream) ══════
          Text left (60%), empty portrait field right (40%). */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <SectionLabel>Meet the Founder</SectionLabel>
              <h1 className="type-h2-prose mt-6 max-w-[16ch] text-ink">A life spent building</h1>

              {/* Two equal columns, both starting on the same baseline. */}
              <div className="mt-10 grid items-start gap-8 sm:grid-cols-2 sm:[&>p]:mt-0 lg:gap-12">
                <p className="type-body text-ink/70">
                  Looking back, I realize every business I&rsquo;ve built, every leader I&rsquo;ve
                  worked with, every team I&rsquo;ve trained, and every movement I&rsquo;ve been
                  part of was preparing me for this. At the time, they felt like separate chapters.
                </p>
                <p className="type-body text-ink/70">
                  Today, I see one story unfolding &mdash; a journey that taught me about
                  leadership, human performance, technology, compassion, and how lasting change
                  happens. Together, those experiences prepared me to build what I believe is the
                  most important work of my life: The Be Human Company.
                </p>
              </div>
            </div>

            {/* Shane's portrait goes here. Left empty on purpose — no stock stand-in. */}
            <div
              className="aspect-[4/5] w-full rounded-sm border border-hairline-dark bg-ink/[0.04]"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* ══════ 02 — EARLY YEARS (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel>Early years</SectionLabel>
              <h2 className="type-h3-prose mt-6 max-w-[20ch] text-ink">
                The entrepreneurial journey started early
              </h2>

              <p className="type-body mt-8 text-ink/70">
                My entrepreneurial journey started early. At sixteen, I asked for yearly
                subscriptions to Entrepreneur magazine for my birthday instead of gifts, and I wrote
                letters to business leaders I admired, hoping one of them would write back. Some
                did, and those relationships became my first mentors.
              </p>
              <p className="type-body mt-6 text-ink/70">
                My first business became possible through funding from Aboriginal Business Canada,
                which allowed me to become the first person to bring Curves for Women from the
                United States to Canada. My family invested alongside me, and together we built it
                into a family business. Curves would later become one of the fastest-growing
                franchise companies in history, growing into a multi-billion-dollar company within a
                decade.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Building that business opened doors I never expected. I went on to build a national
                fitness brand, author four books in the health and fitness industry, coach thousands
                of people, and have my work featured internationally on television, magazine covers,
                and in publications as far away as China and India. Later, financing through
                Tale&rsquo;awtxw Aboriginal Capital Corporation helped support the publication of my
                books, allowing me to continue sharing ideas beyond the businesses I was building.
              </p>
            </div>

            {/* Gallery: the trailer, then the two press scans as one row. */}
            <div className="grid max-w-[560px] items-start gap-6">
              <Shot
                src={curvesTruck}
                alt="Shane James with two colleagues in front of a Curves for Women transport trailer, America's Largest Fitness Franchise"
              />
              <div className="grid items-start gap-6 sm:grid-cols-2">
                <Archival
                  src={pressCn}
                  alt="Chinese-language newspaper feature on Shane James losing 65 pounds in six months"
                />
                <Archival
                  src={pressCanIndia}
                  alt="CanIndia Plus newspaper interview headlined Think, Act, Love, Lose Weight!"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 03 — BUILDING AT SCALE (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel>Building at scale</SectionLabel>
              <h2 className="type-h3-prose mt-6 max-w-[22ch] text-ink">
                From fitness to leadership to building organizations
              </h2>

              <p className="type-body mt-8 text-ink/70">
                Throughout my career, I&rsquo;ve often found myself drawn to industries just before
                they reached mainstream adoption. Recognizing the growing demand for healthier
                consumer products, I introduced a healthy energy drink brand from the United States
                into the Canadian market. That business grew into a direct sales organization of
                well over 5,000 independent business owners and distributors, giving me firsthand
                experience leading at scale and understanding how leadership, systems, culture, and
                duplication come together to build high-performing organizations.
              </p>
              <p className="type-body mt-6 text-ink/70">
                As that organization grew, I was invited to train many of the largest leaders and
                teams in the direct sales industry. While products brought people into the room, the
                conversations quickly became about leadership, culture, systems, growth, and how to
                build organizations where people could succeed. Those years reinforced something
                I&rsquo;ve believed ever since: great organizations aren&rsquo;t built by products
                alone &mdash; people build them.
              </p>
            </div>

            {/* Both sources are 1:1; shown as one square pair. */}
            <div className="grid max-w-[560px] items-start gap-6 sm:grid-cols-2">
              <Shot
                src={harrington}
                alt="Shane James with Kevin Harrington on a film set, teleprompter and camera rig behind them"
              />
              <Shot
                src={satnam}
                alt="Shane James and Satnam Singh, the first Indian-born NBA draftee, flexing together off camera"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 04 — HUMAN PERFORMANCE + COMPASSION (cream) ══════
          The former HUMAN PERFORMANCE and ACTIONS OF COMPASSION chapters, merged
          on 2026-08-22 with their copy untouched. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel>Human performance + compassion</SectionLabel>
              <h2 className="type-h3-prose mt-6 max-w-[22ch] text-ink">
                Understanding what helps people become their best
              </h2>

              <p className="type-body mt-8 text-ink/70">
                As my businesses grew, so did my curiosity about people. I became fascinated by
                human performance &mdash; how people think, learn, adapt, and perform under
                pressure. That curiosity led me into years of studying neuro-linguistic programming
                (NLP), brainwave training, meditation, and the science of human behavior. Along the
                way, I&rsquo;ve read over a thousand books on business, leadership, psychology,
                health, and human potential.
              </p>
              <p className="type-body mt-6 text-ink/70">
                That journey led me to create Brainwave Synergy, where I developed brainwave
                training programs and guided meditations designed to help people improve focus,
                performance, and well-being. The programs reached people from all walks of life
                &mdash; entrepreneurs, executives, professional athletes, parents, and public
                figures. Participants included Bonnie-Jill Laflin, the first female scout in NBA
                history and an accomplished sports broadcaster, who later joined Actions of
                Compassion and appeared on The Everyday Compassion Show. Looking back, I
                wasn&rsquo;t simply teaching performance. I was trying to understand what helps
                people become the best version of themselves.
              </p>
              <p className="type-body mt-6 text-ink/70">
                One lesson stayed with me throughout every company I built.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Over the course of my career, I&rsquo;ve directly managed more than 150 employees,
                led a direct sales organization of well over 5,000 independent business owners and
                distributors, and trained leadership teams across North America. Every experience
                reinforced one belief that has shaped how I&rsquo;ve led ever since: the only way I
                truly win is if my people win first.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Long before &ldquo;people-first leadership&rdquo; became a popular phrase, I was
                intentionally building cultures where people felt valued, challenged, healthy, and
                capable of becoming more than they believed they could be. Health has always been a
                cornerstone of my leadership philosophy because I&rsquo;ve never believed success
                should come at the expense of people&rsquo;s well-being. The strongest organizations
                are built by people who are healthy enough to do their best work and supported
                enough to become their best selves.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Long before founding The Be Human Company, I founded Actions of Compassion, a
                movement dedicated to encouraging acts of kindness, supporting food drives, helping
                people through addiction, and bringing communities together. The movement attracted
                volunteers, business leaders, athletes, and public figures &mdash; including
                Bonnie-Jill Laflin &mdash; and was later documented through The Everyday Compassion
                Show. Those experiences reinforced something I&rsquo;ve always believed: meaningful
                change begins with ordinary people making intentional choices to help someone else.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Alongside my entrepreneurial career, I&rsquo;ve remained committed to serving my
                community. I&rsquo;ve volunteered with Ronald McDonald House, served on the board of
                the Maple Ridge Food Bank, acted as President of the Ridge Meadows Business
                Association, and later joined the board of the nonprofit organization founded by my
                longtime mentor, John Volken, founder of United Furniture Warehouse.
              </p>
            </div>

            {/* Curated three-picture gallery from the two former chapters. */}
            <div className="grid max-w-[560px] items-start gap-6">
              <Shot
                src={diner}
                alt="Shane James in conversation with a woman across a red diner booth"
              />
              <div className="grid items-start gap-6 sm:grid-cols-2">
                <Shot
                  src={mentoring}
                  alt="Shane James beside a student holding up the vision board he built at an Actions of Compassion workshop"
                />
                <Shot
                  src={aocFoodDrive}
                  alt="Actions of Compassion volunteers with boxes of donated food at a food drive"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
