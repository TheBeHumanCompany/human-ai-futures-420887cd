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
 * `/about-the-founder` — "Meet the Founder", built from Maya's 2026-08-18 brief
 * and restructured 2026-08-20 into one continuous biography.
 *
 * ── Where every word came from ────────────────────────────────────────────
 *
 * The copy is the four-page PDF she captioned "the proper text", used verbatim
 * in Shane's first person. Nothing here is rewritten or summarised, and
 * `src/lib/copy-fidelity.test.ts` holds this file to
 * `docs/source/meet-the-founder.txt` sentence by sentence.
 *
 * ── One headline, six chapters (2026-08-20) ───────────────────────────────
 *
 * "A life spent building" is the ONLY large editorial headline on the page.
 * Every later chapter opens on its `SectionLabel` alone — the per-section h2s
 * ("Entrepreneurship started early", "People build organizations", "How trust
 * is built", "What helps people…", "Business was never the whole story") were
 * removed outright, not shrunk, and nothing replaced them. The page should read
 * as one biography divided into chapters, not six hero sections.
 *
 * Backgrounds: warm cream throughout, with exactly one ink section — the belief
 * pause after BUILDING AT SCALE, deliberately short and quiet.
 *
 * ── The image system (revised 2026-08-20) ────────────────────────────────
 *
 * Photographs keep their OWN orientation. Nothing is squeezed into a shared
 * ratio, because a fixed 4:3 was cropping heads and turning the biography into
 * a gallery. Consistency comes from restrained widths, matching radius and a
 * shared vertical rhythm instead:
 *
 *   · `Shot` — a supporting photograph at its natural ratio (`h-auto`,
 *     no forced `aspect-*`), capped so it sits at roughly half the measure.
 *   · `Archival` — magazine scans, shown whole on the cream page itself:
 *     no beige card, no padding box, just the document at its own proportions.
 *
 * Three photographs were removed entirely at Maya's request: the KITV studio
 * shot (BUILDING AT SCALE is intentionally text-led), the mural/cameraman
 * filming frame, and the posed three-person Actions of Compassion portrait.
 * The four-frame conversations collage went too; HUMAN PERFORMANCE now shows
 * only the single diner frame cut from it.

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
 * directly on the cream page at its natural proportions, sized to stay
 * readable as archival material. Renders through <Shot> so every photograph
 * and scan on this route goes through one element.
 */
function Archival({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Shot src={src} alt={alt} className={`rounded-none object-contain ${className}`} />;
}

/** Two square photographs, equal displayed size, top-aligned. */
function SquarePair({ children }: { children: React.ReactNode }) {
  return <div className="grid max-w-[720px] items-start gap-6 sm:grid-cols-2">{children}</div>;
}


/**
 * The section kicker, identical to the one on /why-we-exist: uppercase label
 * above a short lime rule, `text-ink/50` on cream and `text-lime` on ink.
 * After the opening section this is the ONLY thing that introduces a chapter.
 */
function SectionLabel({ children, tone }: { children: string; tone: "dark" | "light" }) {
  return (
    <>
      <p className={`type-label-caps ${tone === "light" ? "text-lime" : "text-ink/50"}`}>
        {children}
      </p>
      <span className="type-eyebrow-rule block" aria-hidden />
    </>
  );
}

/** Label column / story column. Shared by every chapter so the rhythm matches. */
const CHAPTER_GRID =
  "grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16";
const CHAPTER_PAD = "mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:py-16";

function Founder() {
  return (
    <>
      {/* ══════ 01 — MEET THE FOUNDER (cream) ══════
          Typography-led, text only. The page's single large headline. */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <SectionLabel tone="dark">Meet the Founder</SectionLabel>
          <h1 className="type-h1-prose mt-8 max-w-[16ch] text-ink">A life spent building</h1>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
            <p className="type-body-lg max-w-[52ch] text-ink/70">
              Looking back, I realize every business I&rsquo;ve built, every leader I&rsquo;ve
              worked with, every team I&rsquo;ve trained, and every movement I&rsquo;ve been part of
              was preparing me for this. At the time, they felt like separate chapters.
            </p>
            <p className="type-body max-w-[52ch] text-ink/70">
              Today, I see one story unfolding &mdash; a journey that taught me about leadership,
              human performance, technology, compassion, and how lasting change happens. Together,
              those experiences prepared me to build what I believe is the most important work of my
              life: The Be Human Company.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 02 — EARLY YEARS (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel tone="dark">Early years</SectionLabel>
            </div>
            <div>
              <p className="type-body text-ink/70">
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

              <Shot
                src={curvesTruck}
                alt="Shane James with two colleagues in front of a Curves for Women transport trailer, America's Largest Fitness Franchise"
                className="my-8 max-w-[520px]"
              />

              <p className="type-body text-ink/70">
                Building that business opened doors I never expected. I went on to build a national
                fitness brand, author four books in the health and fitness industry, coach thousands
                of people, and have my work featured internationally on television, magazine covers,
                and in publications as far away as China and India. Later, financing through
                Tale&rsquo;awtxw Aboriginal Capital Corporation helped support the publication of my
                books, allowing me to continue sharing ideas beyond the businesses I was building.
              </p>

              {/* Archival clippings: on the cream page itself, whole, no card. */}
              <div className="mt-8 grid max-w-[820px] items-start gap-8 sm:grid-cols-2">
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

      {/* ══════ 03 — BUILDING AT SCALE (cream) ══════
          Intentionally text-led: no photograph, so the page can breathe before
          the belief pause. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel tone="dark">Building at scale</SectionLabel>
            </div>
            <div>
              <p className="type-body text-ink/70">
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
          </div>
        </div>
      </section>

      {/* ══════ 04 — THE BELIEF (ink) ══════
          The page's only ink section. Short, narrow, no decorative marks: a
          private belief, not a keynote slide. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-12 text-center sm:px-8 lg:py-16">
          <blockquote className="type-h3-prose mx-auto max-w-[30ch]">
            Businesses don&rsquo;t grow because of products. They grow because of people.
          </blockquote>
          <p className="type-body-sm mx-auto mt-6 max-w-[40ch] text-muted-foreground">
            The only way I truly win is if my people win first.
          </p>
          <p className="type-body-sm mt-4 text-muted-foreground/70">&mdash; Shane</p>
        </div>
      </section>

      {/* ══════ 05 — MEDIA · LEADERSHIP · TRAINING (cream) ══════ */}
      <section className="section-cream">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel tone="dark">Media &middot; Leadership &middot; Training</SectionLabel>
            </div>
            <div>
              <p className="type-body text-ink/70">
                Around the same time, another shift was beginning to reshape business: social media.
                Long before most organizations understood its potential, I immersed myself in
                learning how digital platforms would transform communication, marketing, and
                business. Over the following years, I worked with entrepreneurs and small business
                owners across North America through workshops, online programs, one-on-one
                consulting, Zoom coaching, and live events. While social media often opened the
                door, the work quickly expanded far beyond marketing. I found myself helping
                founders strengthen leadership, improve operations, build healthier workplace
                cultures, refine financial strategy, develop customer acquisition systems, implement
                email marketing, and build businesses that could scale without losing the people at
                their center. Many of those relationships evolved into long-term partnerships, and I
                continue to hold equity in several of the companies I helped build.
              </p>

              {/* Both sources are 1:1; shown square, side by side, restrained. */}
              <div className="my-8">
                <SquarePair>
                  <Shot
                    src={harrington}
                    alt="Shane James with Kevin Harrington on a film set, teleprompter and camera rig behind them"
                  />
                  <Shot
                    src={satnam}
                    alt="Shane James and Satnam Singh, the first Indian-born NBA draftee, flexing together off camera"
                  />
                </SquarePair>
              </div>

              <p className="type-body text-ink/70">
                That work also created opportunities to collaborate on projects with people already
                influencing millions worldwide. I helped launch the social media campaign for
                Eckhart Tolle&rsquo;s feature film, Milton&rsquo;s Secret. I helped build the social
                media presence of Satnam Singh, the first Indian-born player ever drafted into the
                NBA and later featured in Netflix&rsquo;s One in a Billion. I also travelled
                extensively with Kevin Harrington, the original Shark on Shark Tank, helping build
                several of his personal brands and gaining a front-row seat to how world-class
                brands, media, and influence are created.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Looking back, those years taught me far more than marketing. They taught me how
                trust is built, how ideas spread, how leaders influence culture, and how businesses
                grow. Those lessons continue to shape how I build organizations today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 06 — HUMAN PERFORMANCE (cream) ══════
          One photograph only: the diner/conversation frames. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel tone="dark">Human performance</SectionLabel>
            </div>
            <div>
              <p className="type-body text-ink/70">
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

              <Shot
                src={diner}
                alt="Shane James in conversation with a woman across a red diner booth"
                className="my-8 max-w-[560px]"
              />

              <p className="type-body text-ink/70">
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
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 07 — ACTIONS OF COMPASSION (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <div className={CHAPTER_GRID}>
            <div>
              <SectionLabel tone="dark">Actions of Compassion</SectionLabel>
            </div>
            <div>
              <p className="type-body text-ink/70">
                Long before founding The Be Human Company, I founded Actions of Compassion, a
                movement dedicated to encouraging acts of kindness, supporting food drives, helping
                people through addiction, and bringing communities together. The movement attracted
                volunteers, business leaders, athletes, and public figures &mdash; including
                Bonnie-Jill Laflin &mdash; and was later documented through The Everyday Compassion
                Show. Those experiences reinforced something I&rsquo;ve always believed: meaningful
                change begins with ordinary people making intentional choices to help someone else.
              </p>

              {/* Portrait source, kept portrait and narrow. */}
              <Shot
                src={mentoring}
                alt="Shane James beside a student holding up the vision board he built at an Actions of Compassion workshop"
                className="my-8 max-w-[380px]"
              />

              <p className="type-body text-ink/70">
                Alongside my entrepreneurial career, I&rsquo;ve remained committed to serving my
                community. I&rsquo;ve volunteered with Ronald McDonald House, served on the board of
                the Maple Ridge Food Bank, acted as President of the Ridge Meadows Business
                Association, and later joined the board of the nonprofit organization founded by my
                longtime mentor, John Volken, founder of United Furniture Warehouse.
              </p>

              <Shot
                src={aocFoodDrive}
                alt="Actions of Compassion volunteers with boxes of donated food at a food drive"
                className="mt-8 max-w-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 08 — WHAT I'VE LEARNED (cream) ══════
          The quietest section on the page: a reflective statement rather than a
          headline, in ink — no lime on the sentence. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className={CHAPTER_PAD}>
          <SectionLabel tone="dark">What I&rsquo;ve learned</SectionLabel>

          <p className="mt-8 max-w-[30ch] font-sans text-[1.75rem] leading-tight font-extralight text-ink lg:text-[2.5rem]">
            When I look back, I don&rsquo;t see a resume. I see a lot of lessons.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
            {/* LEFT — LESSONS */}
            <ul className="divide-y divide-hairline-dark">
              {LESSONS.map((lesson) => (
                <li key={lesson} className="type-body py-5 text-ink/70 first:pt-0">
                  {lesson}
                </li>
              ))}
            </ul>

            {/* RIGHT — REFLECTION */}
            <div>
              <p className="type-h4-prose max-w-[34ch] text-ink">
                I don&rsquo;t have all the answers.
              </p>
              <p className="type-body mt-6 text-ink/70">
                Technology is moving quickly, and I think the choices we make around it will shape
                how we work, lead, connect, and live.
              </p>
              <p className="type-body mt-6 text-ink/70">
                The Be Human Company is my attempt to bring the lessons I&rsquo;ve learned together
                and contribute something useful to that transition.
              </p>
              <p className="type-body mt-6 text-ink/70">
                I&rsquo;m still learning. I&rsquo;m still building. And I&rsquo;m grateful to be doing
                it alongside people who care about where we go from here.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * The four reflective lessons that close the founder story. Kept as data so
 * the wording stays consistent across the list and the surrounding paragraphs.
 */
const LESSONS = [
  "Every business taught me something about building.",
  "Every leader taught me something about people.",
  "Every team showed me how much culture matters.",
  "Every success, and every mistake, gave me more to learn.",
] as const;
