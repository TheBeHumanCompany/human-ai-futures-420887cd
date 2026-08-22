import { createFileRoute } from "@tanstack/react-router";

import aocFoodDrive from "@/assets/founder-aoc-fooddrive.webp";
import curvesTruck from "@/assets/founder-curves-truck.webp";
import diner from "@/assets/founder-diner.webp";
import harrington from "@/assets/founder-harrington.webp";
import mentoring from "@/assets/founder-mentoring.webp";

import pressCn from "@/assets/founder-press-cn.webp";
import satnam from "@/assets/founder-satnam.webp";

import pressCanIndia2011 from "@/assets/founder-press-canindia-2011.webp";
import kitvInterview from "@/assets/founder-kitv-interview.webp";
import founderBikeBehumn from "@/assets/founder-bike-behumn.webp";

/**
 * `/about-the-founder` — "Meet the Founder", built from Maya's 2026-08-18 brief.
 *
 * Copy is the four-page PDF used verbatim in Shane's first person;
 * `src/lib/copy-fidelity.test.ts` holds this file to
 * `docs/source/meet-the-founder.txt` sentence by sentence.
 *
 * ── The 2026-08-22 emphasis + tone pass ───────────────────────────────────
 *
 * Chapters now open on INK and alternate ink → cream → ink …, so the
 * sequence the brief calls out (cream, black, cream) is reversed across the
 * page. `Chapter` still owns the tone: on ink the eyebrow label goes lime and the
 * copy goes off-white; on cream both keep the light-section treatment.
 *
 * Emphasis is plain bold body copy — `<strong>` inside the paragraph flow, at
 * body size and body line-height. No lime backgrounds, no <mark>, no pull-out
 * callouts. Whole-sentence beliefs are bold paragraphs in the same register.
 *
 * The "Businesses don't grow because of products…" line is included in the
 * Human Performance section as a bold sentence within the same paragraph as its
 * lead-in sentence.
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

type Tone = "ink" | "cream";

/**
 * A supporting photograph at its OWN aspect ratio. No `aspect-*`, no cover
 * crop: the file's proportions decide the height, the caller decides only how
 * wide it may get.
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
 * Archival document: no card, no radius — a scan sitting directly on the page
 * at its natural proportions.
 */
function Archival({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Shot src={src} alt={alt} className={`rounded-none object-contain ${className}`} />;
}

/** Inline emphasis: real bold weight, inherited size/colour. Never highlighted. */
function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold">{children}</strong>;
}

/** Uppercase kicker. Lime on ink, muted ink on cream. */
function SectionLabel({ children, tone }: { children: string; tone: Tone }) {
  return (
    <p className={`type-label-caps ${tone === "ink" ? "text-lime" : "text-ink/50"}`}>{children}</p>
  );
}

const CHAPTER_GRID =
  "grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16";
const CHAPTER_PAD = "mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24";

/** One chapter: owns its background, its divider and its text tone.
 *  Strong emphasis inside body copy is rendered in a soft warm white on ink
 *  and a near-black charcoal on cream so it stands apart from muted paragraph text
 *  without the harshness of pure black or pure white. */
function Chapter({
  tone,
  first = false,
  children,
}: {
  tone: Tone;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        tone === "ink"
          ? `section-ink${first ? "" : " border-t border-hairline"} [&_strong]:text-[#F2F0EA]`
          : `section-cream${first ? "" : " border-t border-hairline-dark"} [&_strong]:text-[#111111]`
      }
    >
      <div className={CHAPTER_PAD}>{children}</div>
    </section>
  );
}

/** Body-copy colour for the tone. */
function body(tone: Tone) {
  return tone === "ink" ? "text-cream/75" : "text-ink/70";
}
function heading(tone: Tone) {
  return tone === "ink" ? "text-cream" : "text-ink";
}

function Founder() {
  return (
    <>
      {/* ══════ 01 — MEET THE FOUNDER (ink) ══════ */}
      <Chapter tone="ink" first>
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="ink">Meet the Founder</SectionLabel>
            <h1 className={`type-h2-condensed mt-6 max-w-[20ch] ${heading("ink")}`}>
              A life spent building
            </h1>

            <p className={`type-body mt-8 ${body("ink")}`}>
              Looking back, I realize every business I&rsquo;ve built, every leader I&rsquo;ve
              worked with, every team I&rsquo;ve trained, and every movement I&rsquo;ve been part of
              was preparing me for this. At the time, they felt like separate chapters.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Today, I see one story unfolding &mdash; a journey that taught me about leadership,
              human performance, technology, compassion, and how lasting change happens. Together,
              those experiences prepared me to build what I believe is the most important work of my
              life: <B>The Be Human Company.</B>
            </p>
          </div>

          <Shot
            src={curvesTruck}
            alt="Shane James with two colleagues in front of a Curves for Women transport trailer"
          />
        </div>
      </Chapter>

      {/* ══════ 02 — EARLY YEARS (cream) ══════ */}
      <Chapter tone="cream">
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="cream">Early years</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[22ch] ${heading("cream")}`}>
              The entrepreneurial journey started early
            </h2>

            <p className={`type-body mt-8 ${body("cream")}`}>
              My entrepreneurial journey started early. At sixteen, I asked for yearly subscriptions
              to Entrepreneur magazine for my birthday instead of gifts, and I wrote letters to
              business leaders I admired, hoping one of them would write back. Some did, and those
              relationships became my first mentors.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              My first business became possible through funding from{" "}
              <B>Aboriginal Business Canada</B>, which allowed me to become the first person to
              bring <B>Curves for Women</B> from the United States to Canada. My family invested
              alongside me, and together we built it into a family business. Curves would later
              become one of the fastest-growing franchise companies in history, growing into a
              multi-billion-dollar company within a decade.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              Building that business opened doors I never expected. I went on to build a national
              fitness brand, author four books in the health and fitness industry, coach thousands
              of people, and have my work featured internationally on television, magazine covers,
              and in publications as far away as China and India. Later, financing through{" "}
              <B>Tale&rsquo;awtxw Aboriginal Capital Corporation</B> helped support the publication
              of my books, allowing me to continue sharing ideas beyond the businesses I was
              building.
            </p>
          </div>

          <div className="grid items-start gap-10">
            <Archival
              src={pressCn}
              alt="Chinese-language newspaper feature on Shane James losing 65 pounds in six months"
            />
            <Archival
              src={pressCanIndia2011}
              alt="Can-India Plus fitness feature headlined Think, Act, Love, Lose Weight! interviewing Shane James"
            />
          </div>
        </div>
      </Chapter>

      {/* ══════ 03 — BUILDING AT SCALE (ink) ══════ */}
      <Chapter tone="ink">
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="ink">Building at scale</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[24ch] ${heading("ink")}`}>
              From fitness to leadership to building organizations
            </h2>

            <p className={`type-body mt-8 ${body("ink")}`}>
              Throughout my career, I&rsquo;ve often found myself drawn to industries just before
              they reached mainstream adoption. Recognizing the growing demand for healthier
              consumer products, I introduced a healthy energy drink brand from the United States
              into the Canadian market. That business grew into a direct sales organization of{" "}
              <B>well over 5,000 independent business owners and distributors</B>, giving me
              firsthand experience leading at scale and understanding how leadership, systems,
              culture, and duplication come together to build high-performing organizations.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              As that organization grew, I was invited to train many of the largest leaders and
              teams in the direct sales industry. While products brought people into the room, the
              conversations quickly became about leadership, culture, systems, growth, and how to
              build organizations where people could succeed. Those years reinforced something
              I&rsquo;ve believed ever since:{" "}
              <B>
                great organizations aren&rsquo;t built by products alone &mdash; people build them.
              </B>
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Around the same time, another shift was beginning to reshape business: social media.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Long before most organizations understood its potential, I immersed myself in learning
              how digital platforms would transform communication, marketing, and business. Over the
              following years, I worked with entrepreneurs and small business owners across North
              America through workshops, online programs, one-on-one consulting, Zoom coaching, and
              live events. While social media often opened the door, the work quickly expanded far
              beyond marketing. I found myself helping founders strengthen leadership, improve
              operations, build healthier workplace cultures, refine financial strategy, develop
              customer acquisition systems, implement email marketing, and build businesses that
              could scale without losing the people at their center. Many of those relationships
              evolved into long-term partnerships, and I continue to hold equity in several of the
              companies I helped build.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              That work also created opportunities to collaborate on projects with people already
              influencing millions worldwide. I helped launch the social media campaign for{" "}
              <B>Eckhart Tolle&rsquo;s</B> feature film, Milton&rsquo;s Secret. I helped build the
              social media presence of <B>Satnam Singh</B>, the first Indian-born player ever
              drafted into the NBA and later featured in Netflix&rsquo;s One in a Billion. I also
              travelled extensively with <B>Kevin Harrington</B>, the original Shark on Shark Tank,
              helping build several of his personal brands and gaining a front-row seat to how
              world-class brands, media, and influence are created.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Looking back, those years taught me far more than marketing. They taught me how trust
              is built, how ideas spread, how leaders influence culture, and how businesses grow.
              Those lessons continue to shape how I build organizations today.
            </p>
          </div>

          <div className="grid items-start gap-10">
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
      </Chapter>

      {/* ══════ 04 — HUMAN PERFORMANCE (cream) ══════ */}
      <Chapter tone="cream">
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="cream">Human performance</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[24ch] ${heading("cream")}`}>
              Understanding what helps people become their best
            </h2>

            <p className={`type-body mt-8 ${body("cream")}`}>
              As my businesses grew, so did my curiosity about people. I became fascinated by human
              performance &mdash; how people think, learn, adapt, and perform under pressure. That
              curiosity led me into years of studying neuro-linguistic programming (NLP), brainwave
              training, meditation, and the science of human behavior. Along the way, I&rsquo;ve
              read over a thousand books on business, leadership, psychology, health, and human
              potential.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              That journey led me to create <B>Brainwave Synergy</B>, where I developed brainwave
              training programs and guided meditations designed to help people improve focus,
              performance, and well-being. The programs reached people from all walks of life
              &mdash; entrepreneurs, executives, professional athletes, parents, and public figures.
              Participants included <B>Bonnie-Jill Laflin</B>, the first female scout in NBA history
              and an accomplished sports broadcaster, who later joined <B>Actions of Compassion</B>{" "}
              and appeared on <B>The Everyday Compassion Show</B>.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              Looking back, I wasn&rsquo;t simply teaching performance. I was trying to understand
              what helps people become the best version of themselves.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              One lesson stayed with me throughout every company I built.{" "}
              <strong className="font-bold">
                Businesses don&rsquo;t grow because of products. They grow because of people.
              </strong>
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              Over the course of my career, I&rsquo;ve directly managed more than{" "}
              <B>150 employees</B>, led a direct sales organization of well over{" "}
              <B>5,000 independent business owners and distributors</B>, and trained leadership
              teams across North America. Every experience reinforced one belief that has shaped how
              I&rsquo;ve led ever since:
            </p>
            <p className="type-body mt-6">
              <strong className="font-bold">
                The only way I truly win is if my people win first.
              </strong>
            </p>

            <p className={`type-body mt-6 ${body("cream")}`}>
              Long before &ldquo;people-first leadership&rdquo; became a popular phrase, I was
              intentionally building cultures where people felt valued, challenged, healthy, and
              capable of becoming more than they believed they could be. Health has always been a
              cornerstone of my leadership philosophy because I&rsquo;ve never believed success
              should come at the expense of people&rsquo;s well-being. The strongest organizations
              are built by people who are healthy enough to do their best work and supported enough
              to become their best selves.
            </p>
          </div>

          <div className="grid items-start gap-8">
            <Shot
              src={diner}
              alt="Shane James in conversation with a woman across a red diner booth"
            />
            <Shot
              src={kitvInterview}
              alt="Shane James interviewed at the anchor desk of KITV 4 Morning News"
            />
            <Shot
              src={mentoring}
              alt="Shane James beside a student holding up the vision board he built at an Actions of Compassion workshop"
            />
          </div>
        </div>
      </Chapter>

      {/* ══════ 05 — COMMUNITY + COMPASSION (ink) ══════ */}
      <Chapter tone="ink">
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="ink">Community + compassion</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[24ch] ${heading("ink")}`}>
              Building something that reaches beyond business
            </h2>

            <p className={`type-body mt-8 ${body("ink")}`}>
              That philosophy naturally extended beyond business.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Long before founding <B>The Be Human Company</B>, I founded{" "}
              <B>Actions of Compassion</B>, a movement dedicated to encouraging acts of kindness,
              supporting food drives, helping people through addiction, and bringing communities
              together. The movement attracted volunteers, business leaders, athletes, and public
              figures &mdash; including Bonnie-Jill Laflin &mdash; and was later documented through{" "}
              <B>The Everyday Compassion Show</B>. Those experiences reinforced something I&rsquo;ve
              always believed: meaningful change begins with ordinary people making intentional
              choices to help someone else.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Alongside my entrepreneurial career, I&rsquo;ve remained committed to serving my
              community. I&rsquo;ve volunteered with <B>Ronald McDonald House</B>, served on the
              board of the <B>Maple Ridge Food Bank</B>, acted as{" "}
              <B>President of the Ridge Meadows Business Association</B>, and later joined the board
              of the nonprofit organization founded by my longtime mentor, <B>John Volken</B>,
              founder of <B>United Furniture Warehouse</B>.
            </p>
          </div>

          <Shot
            src={aocFoodDrive}
            alt="Actions of Compassion volunteers with boxes of donated food at a food drive"
          />
        </div>
      </Chapter>

      {/* ══════ 06 — WHAT I’VE LEARNED (cream) ══════ */}
      <Chapter tone="cream">
        <div className="grid items-start gap-12 pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-24">
          <div className="max-w-[56ch]">
            <SectionLabel tone="cream">What I&rsquo;ve learned</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[20ch] ${heading("cream")}`}>
              What matters now
            </h2>

            <div className="mt-8 space-y-8">
              <p className={`type-body ${body("cream")}`}>
                When I look back today, I don&rsquo;t see a r&eacute;sum&eacute;. I see preparation.
              </p>

              <div className="space-y-3">
                <p className={`type-body leading-relaxed ${body("cream")}`}>
                  Every business taught me how to build.
                </p>
                <p className={`type-body leading-relaxed ${body("cream")}`}>
                  Every leader taught me something new.
                </p>
                <p className={`type-body leading-relaxed ${body("cream")}`}>
                  Every team taught me how culture shapes performance.
                </p>
                <p className={`type-body leading-relaxed ${body("cream")}`}>
                  Every success and every setback deepened my understanding of people.
                </p>
              </div>

              <p className={`type-body ${body("cream")}`}>
                Together, those experiences led me to one belief:
              </p>

              <p className="type-body">
                <strong className="font-bold">
                  The greatest opportunity of our generation isn&rsquo;t simply building more
                  intelligent technology. It&rsquo;s helping people become more intentional about
                  practicing their humanity alongside it.
                </strong>
              </p>

              <p className={`type-body ${body("cream")}`}>
                That&rsquo;s the work I&rsquo;ve devoted my life to.
              </p>
              <p className={`type-body ${body("cream")}`}>
                And it&rsquo;s the work I&rsquo;m committed to building through{" "}
                <strong className="font-bold">The Be Human Company</strong>.
              </p>
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <Shot
              src={founderBikeBehumn}
              alt="Shane James kneeling beside a motorcycle with a BEHUMN license plate, city lights behind him"
            />
          </div>
        </div>
      </Chapter>
    </>
  );
}
