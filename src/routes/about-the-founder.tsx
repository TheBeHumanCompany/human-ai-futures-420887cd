import { createFileRoute } from "@tanstack/react-router";

import aocFoodDrive from "@/assets/founder-aoc-fooddrive.webp";
import aocTeam from "@/assets/founder-aoc-team.webp";
import conversations from "@/assets/founder-conversations.webp";
import curvesTruck from "@/assets/founder-curves-truck.webp";
import filming from "@/assets/founder-filming.webp";
import harrington from "@/assets/founder-harrington.webp";
import mentoring from "@/assets/founder-mentoring.webp";

import kitv from "@/assets/founder-kitv.webp";
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
 * ── One typography system, shared with /why-we-exist (2026-08-20) ─────────
 *
 * This page used to run a tall condensed register (`type-h*-caps` and
 * `type-h*-condensed`) that exists nowhere on /why-we-exist, so the two read as
 * two different sites. That register is gone. What is left is exactly the three
 * treatments the mission page uses:
 *
 *   · `type-h1-prose` / `type-h2-prose` / `type-h3-prose` — Work Sans 200/300,
 *     every large statement a size step of the same face.
 *   · `type-body` / `type-body-lg` / `type-body-sm` — paragraphs, always.
 *   · `SectionLabel` — the uppercase kicker over a short lime rule, byte for
 *     byte the component /why-we-exist declares. Duplicated rather than
 *     imported because the brief scopes this change to this route; if a third
 *     page needs it, that is the moment it moves to src/components.
 *
 * Section padding, label-to-headline distance and the hairline dividers copy
 * the tightened rhythm that page settled on (py-14 / lg:py-20, mt-10).
 *
 * ── The photographs ───────────────────────────────────────────────────────
 *
 * Fewer, larger, and each tied to the paragraph it stands next to. The hero is
 * type only; BUILDING AT SCALE keeps one picture at half-width instead of a
 * three-up gallery; EARLY YEARS gains the Curves trailer, which is archival and
 * therefore rendered uncropped — no aspect box, no frame, no rounded card, so
 * the truck's copy and the three men stay whole.
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
 * One photograph, one treatment.
 *
 * `alt` is required by the type rather than optional: every one of these is a
 * photograph of real people doing real things, and a screen reader deserves to
 * be told which. Passing no aspect class renders the picture at its own
 * proportions — the archival case, where cropping loses the evidence.
 */
function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full object-cover ${className}`}
    />
  );
}

/**
 * The section kicker, identical to the one on /why-we-exist: uppercase label
 * above a short lime rule, `text-ink/50` on cream and `text-lime` on ink.
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

function Founder() {
  return (
    <>
      {/* ══════ 01 — MEET THE FOUNDER (cream) ══════
          Typography-led. No photograph: the opening earns its scale from the
          headline and the two columns of intro, the way the mission hero does. */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <SectionLabel tone="dark">Meet the Founder</SectionLabel>
          <h1 className="type-h1-prose mt-10 max-w-[16ch] text-ink">A life spent building</h1>

          <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-20">
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
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <SectionLabel tone="dark">Early years</SectionLabel>
              <h2 className="type-h2-prose mt-10 max-w-[14ch] text-ink">
                Entrepreneurship started early
              </h2>
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

              {/* Archival: rendered at its own proportions, uncropped. */}
              <Shot
                src={curvesTruck}
                alt="Shane James with two colleagues in front of a Curves for Women transport trailer, America's Largest Fitness Franchise"
                className="my-10"
              />

              <p className="type-body text-ink/70">
                Building that business opened doors I never expected. I went on to build a national
                fitness brand, author four books in the health and fitness industry, coach thousands
                of people, and have my work featured internationally on television, magazine covers,
                and in publications as far away as China and India. Later, financing through
                Tale&rsquo;awtxw Aboriginal Capital Corporation helped support the publication of my
                books, allowing me to continue sharing ideas beyond the businesses I was building.
              </p>
            </div>
          </div>

          {/* The two press clippings this section already carried — retained,
              because they are the "featured internationally" sentence itself. */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Shot
              src={pressCn}
              alt="Chinese-language newspaper feature on Shane James losing 65 pounds in six months"
              className="aspect-[4/3]"
            />
            <Shot
              src={pressCanIndia}
              alt="CanIndia Plus newspaper interview headlined Think, Act, Love, Lose Weight!"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ══════ 03 — BUILDING AT SCALE (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <SectionLabel tone="dark">Building at scale</SectionLabel>
              <h2 className="type-h2-prose mt-10 max-w-[14ch] text-ink">
                People build organizations
              </h2>
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

          {/* One picture, at scale, aligned to the text column of the grid. */}
          <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div aria-hidden className="hidden lg:block" />
            <Shot
              src={kitv}
              alt="Shane James interviewed at the KITV 4 Morning News desk"
              className="aspect-[16/10]"
            />
          </div>
        </div>
      </section>

      {/* ══════ 04 — THE BELIEF (ink) ══════
          Centered pull-quote. The oversized marks are cream at low opacity and
          sit outside the sentence, so they frame it rather than punctuate it. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-16 text-center sm:px-8 lg:py-24">
          <figure className="relative mx-auto max-w-[900px]">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-8 -left-2 select-none text-[6rem] leading-none text-cream/10 sm:-top-10 sm:-left-8 sm:text-[9rem]"
            >
              &ldquo;
            </span>
            <blockquote className="type-h2-prose relative">
              Businesses don&rsquo;t grow because of products. They grow because of people.
            </blockquote>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -bottom-16 select-none text-[6rem] leading-none text-cream/10 sm:-right-8 sm:-bottom-20 sm:text-[9rem]"
            >
              &rdquo;
            </span>
          </figure>

          <p className="type-body mx-auto mt-12 max-w-[40ch] text-muted-foreground lg:mt-14">
            The only way I truly win is if my people win first.
          </p>
          <p className="type-body-sm mt-6 text-muted-foreground/70">&mdash; Shane</p>
        </div>
      </section>

      {/* ══════ 05 — MEDIA · LEADERSHIP · TRAINING (cream) ══════ */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <SectionLabel tone="dark">Media &middot; Leadership &middot; Training</SectionLabel>
              <h2 className="type-h2-prose mt-10 max-w-[14ch] text-ink">How trust is built</h2>
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

              <div className="my-10 grid gap-6 sm:grid-cols-2">
                <Shot
                  src={harrington}
                  alt="Shane James with Kevin Harrington on a film set, teleprompter and camera rig behind them"
                  className="aspect-[4/5]"
                />
                <Shot
                  src={satnam}
                  alt="Shane James and Satnam Singh, the first Indian-born NBA draftee, flexing together off camera"
                  className="aspect-[4/5]"
                />
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
          The one kicker that is not in Maya's screens: her design has no slot
          for the Brainwave Synergy passage, and folding it into a neighbouring
          section would have put it where it does not belong. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <SectionLabel tone="dark">Human performance</SectionLabel>
              <h2 className="type-h2-prose mt-10 max-w-[16ch] text-ink">
                What helps people become the best version of themselves
              </h2>
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

              {/* Moved out of the two-up grid: shown whole, at its own proportions. */}
              <Shot
                src={conversations}
                alt="Four frames of Shane James in conversation, on a desert road and in a diner booth"
                className="my-10"
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

              <Shot
                src={mentoring}
                alt="Shane James beside a student holding up the vision board he built at an Actions of Compassion workshop"
                className="my-10"
              />

              <Shot
                src={filming}
                alt="Shane James being filmed on location in front of a painted mural"
                className="mt-10"
              />

            </div>

          </div>
        </div>
      </section>

      {/* ══════ 07 — ACTIONS OF COMPASSION (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <SectionLabel tone="dark">Actions of Compassion</SectionLabel>
              <h2 className="type-h2-prose mt-10 max-w-[14ch] text-ink">
                Business was never the whole story
              </h2>
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
              <p className="type-body mt-6 text-ink/70">
                Alongside my entrepreneurial career, I&rsquo;ve remained committed to serving my
                community. I&rsquo;ve volunteered with Ronald McDonald House, served on the board of
                the Maple Ridge Food Bank, acted as President of the Ridge Meadows Business
                Association, and later joined the board of the nonprofit organization founded by my
                longtime mentor, John Volken, founder of United Furniture Warehouse.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Shot
              src={aocFoodDrive}
              alt="Actions of Compassion volunteers with boxes of donated food at a food drive"
              className="aspect-[4/3]"
            />
            <Shot
              src={aocTeam}
              alt="Three people wearing Actions of Compassion shirts and caps"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ══════ 08 — WHY THIS WORK (ink) ══════
          Type only: a photograph here would compete with the closing line. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel tone="light">Why this work</SectionLabel>
          <h2 className="type-h2-prose mt-10 max-w-[18ch]">Preparation, not a r&eacute;sum&eacute;</h2>

          <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="type-body text-muted-foreground">
                When I look back today, I don&rsquo;t see a r&eacute;sum&eacute;. I see preparation.
              </p>
              <ul className="type-body mt-8 space-y-3 text-muted-foreground">
                <li>Every business taught me how to build.</li>
                <li>Every leader taught me something new.</li>
                <li>Every team taught me how culture shapes performance.</li>
                <li>Every success and every setback deepened my understanding of people.</li>
              </ul>
            </div>
            <div>
              <p className="type-body text-muted-foreground">
                Together, those experiences led me to one belief:
              </p>
              <p className="type-h3-prose mt-6 max-w-[34ch]">
                The greatest opportunity of our generation isn&rsquo;t simply building more
                intelligent technology. It&rsquo;s helping people become more intentional about
                practicing their humanity alongside it.
              </p>
              <p className="type-body mt-8 text-muted-foreground">
                That&rsquo;s the work I&rsquo;ve devoted my life to. And it&rsquo;s the work
                I&rsquo;m committed to building through The Be Human Company.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

