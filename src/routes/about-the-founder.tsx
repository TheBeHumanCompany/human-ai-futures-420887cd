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

/**
 * `/about-the-founder` — "Meet the Founder", built from Maya's 2026-08-18 brief.
 *
 * Copy is the four-page PDF used verbatim in Shane's first person;
 * `src/lib/copy-fidelity.test.ts` holds this file to
 * `docs/source/meet-the-founder.txt` sentence by sentence.
 *
 * ── The 2026-08-22 alternating-background pass ────────────────────────────
 *
 * Chapters now alternate ink → cream → ink → cream so the page reads as an
 * editorial sequence rather than one long cream scroll. Every chapter is
 * rendered by `Chapter`, which owns the tone: on ink the eyebrow label goes
 * lime and the copy goes off-white; on cream both keep the light-section
 * treatment. Headings stay `type-h2-condensed`, sentence case, everywhere.
 *
 * The standalone quote block is gone: "Businesses don't grow because of
 * products…" now closes the Community + Compassion chapter as a bold body
 * paragraph, no quote marks and no attribution.
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

/** Uppercase kicker. Lime on ink, muted ink on cream. */
function SectionLabel({ children, tone }: { children: string; tone: Tone }) {
  return (
    <p className={`type-label-caps ${tone === "ink" ? "text-lime" : "text-ink/50"}`}>{children}</p>
  );
}

const CHAPTER_GRID =
  "grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16";
const CHAPTER_PAD = "mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24";

/** One chapter: owns its background, its divider and its text tone. */
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
          ? `section-ink${first ? "" : " border-t border-hairline"}`
          : `section-cream${first ? "" : " border-t border-hairline-dark"}`
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
              Looking back, I realize every business I&rsquo;ve built, every leader I&rsquo;ve worked
              with, every team I&rsquo;ve trained, and every movement I&rsquo;ve been part of was
              preparing me for this. At the time, they felt like separate chapters.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Today, I see one story unfolding &mdash; a journey that taught me about leadership,
              human performance, technology, compassion, and how lasting change happens. Together,
              those experiences prepared me to build what I believe is the most important work of my
              life: The Be Human Company.
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
              My first business became possible through funding from Aboriginal Business Canada,
              which allowed me to become the first person to bring Curves for Women from the United
              States to Canada. My family invested alongside me, and together we built it into a
              family business. Curves would later become one of the fastest-growing franchise
              companies in history, growing into a multi-billion-dollar company within a decade.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              Building that business opened doors I never expected. I went on to build a national
              fitness brand, author four books in the health and fitness industry, coach thousands
              of people, and have my work featured internationally on television, magazine covers,
              and in publications as far away as China and India. Later, financing through
              Tale&rsquo;awtxw Aboriginal Capital Corporation helped support the publication of my
              books, allowing me to continue sharing ideas beyond the businesses I was building.
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
              into the Canadian market. That business grew into a direct sales organization of well
              over 5,000 independent business owners and distributors, giving me firsthand
              experience leading at scale and understanding how leadership, systems, culture, and
              duplication come together to build high-performing organizations.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              As that organization grew, I was invited to train many of the largest leaders and
              teams in the direct sales industry. While products brought people into the room, the
              conversations quickly became about leadership, culture, systems, growth, and how to
              build organizations where people could succeed. Those years reinforced something
              I&rsquo;ve believed ever since: great organizations aren&rsquo;t built by products
              alone &mdash; people build them.
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

      {/* ══════ 04 — HUMAN PERFORMANCE (cream) ══════
          Three photographs now: the diner conversation, the KITV morning-news
          interview, and the mentoring frame moved up out of Community +
          Compassion. The two wide frames stack full column width; the diner
          and mentoring frames pair beneath so the column fills cleanly. */}
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
              That journey led me to create Brainwave Synergy, where I developed brainwave training
              programs and guided meditations designed to help people improve focus, performance,
              and well-being. The programs reached people from all walks of life &mdash;
              entrepreneurs, executives, professional athletes, parents, and public figures.
              Participants included Bonnie-Jill Laflin, the first female scout in NBA history and an
              accomplished sports broadcaster, who later joined Actions of Compassion and appeared
              on The Everyday Compassion Show. Looking back, I wasn&rsquo;t simply teaching
              performance. I was trying to understand what helps people become the best version of
              themselves.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              One lesson stayed with me throughout every company I built.
            </p>
            <p className={`type-body mt-6 ${body("cream")}`}>
              Over the course of my career, I&rsquo;ve directly managed more than 150 employees, led
              a direct sales organization of well over 5,000 independent business owners and
              distributors, and trained leadership teams across North America. Every experience
              reinforced one belief that has shaped how I&rsquo;ve led ever since: the only way I
              truly win is if my people win first.
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

      {/* ══════ 05 — COMMUNITY + COMPASSION (ink) ══════
          Closes with the "Businesses don't grow…" line as bold body copy —
          the standalone centred quote section was removed on 2026-08-22. */}
      <Chapter tone="ink">
        <div className={CHAPTER_GRID}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="ink">Community + compassion</SectionLabel>
            <h2 className={`type-h2-condensed mt-6 max-w-[24ch] ${heading("ink")}`}>
              Building something that reaches beyond business
            </h2>

            <p className={`type-body mt-8 ${body("ink")}`}>
              Long before founding The Be Human Company, I founded Actions of Compassion, a movement
              dedicated to encouraging acts of kindness, supporting food drives, helping people
              through addiction, and bringing communities together. The movement attracted
              volunteers, business leaders, athletes, and public figures &mdash; including
              Bonnie-Jill Laflin &mdash; and was later documented through The Everyday Compassion
              Show. Those experiences reinforced something I&rsquo;ve always believed: meaningful
              change begins with ordinary people making intentional choices to help someone else.
            </p>
            <p className={`type-body mt-6 ${body("ink")}`}>
              Alongside my entrepreneurial career, I&rsquo;ve remained committed to serving my
              community. I&rsquo;ve volunteered with Ronald McDonald House, served on the board of
              the Maple Ridge Food Bank, acted as President of the Ridge Meadows Business
              Association, and later joined the board of the nonprofit organization founded by my
              longtime mentor, John Volken, founder of United Furniture Warehouse.
            </p>
            <p className={`type-body mt-6 font-bold ${heading("ink")}`}>
              Businesses don&rsquo;t grow because of products. They grow because of people.
            </p>
          </div>

          <Shot
            src={aocFoodDrive}
            alt="Actions of Compassion volunteers with boxes of donated food at a food drive"
          />
        </div>
      </Chapter>

      {/* ══════ 06 — WHAT I'VE LEARNED (cream) ══════ */}
      <Chapter tone="cream">
        <SectionLabel tone="cream">What I&rsquo;ve learned</SectionLabel>
        <h2 className={`type-h2-condensed mt-6 max-w-[28ch] ${heading("cream")}`}>
          When I look back, I don&rsquo;t see a resume. I see a lot of lessons.
        </h2>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <ul className="grid gap-5">
            {[
              "Every business taught me something about building.",
              "Every leader taught me something about people.",
              "Every team showed me how much culture matters.",
              "Every success, and every mistake, gave me more to learn.",
            ].map((lesson) => (
              <li key={lesson} className="type-body border-t border-hairline-dark pt-5 text-ink/70">
                {lesson}
              </li>
            ))}
          </ul>

          <div>
            <h3 className="type-h4-prose text-ink">I don&rsquo;t have all the answers.</h3>
            <p className="type-body mt-6 text-ink/70">
              Technology is moving quickly, and I think the choices we make around it will shape how
              we work, lead, connect, and live.
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
      </Chapter>
    </>
  );
}
