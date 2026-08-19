import { createFileRoute } from "@tanstack/react-router";

import aocFoodDrive from "@/assets/founder-aoc-fooddrive.webp";
import aocTeam from "@/assets/founder-aoc-team.webp";
import conversations from "@/assets/founder-conversations.webp";
import filming from "@/assets/founder-filming.webp";
import kitv from "@/assets/founder-kitv.webp";
import pinterest from "@/assets/founder-pinterest.webp";
import pressCanIndia from "@/assets/founder-press-canindia.webp";
import pressCn from "@/assets/founder-press-cn.webp";
import stage from "@/assets/founder-stage.webp";
import studio from "@/assets/founder-studio.webp";

/**
 * `/about-the-founder` — "Meet the Founder", built from Maya's 2026-08-18 brief.
 *
 * ── Where every word came from ────────────────────────────────────────────
 *
 * She sent two things one second apart at 11:52: eleven screens of a page
 * design, and a four-page PDF captioned "I will make sure to provide you with
 * the proper text and images". The PDF is the copy and it is used verbatim —
 * first person, Shane's own voice, nothing rewritten or summarised. Her screens
 * carry a condensed third-person version of the same story ("At sixteen, Shane
 * asked for Entrepreneur magazine…"), which reads as design filler standing in
 * for copy that had not arrived yet. Where the two disagree, the PDF wins,
 * because the PDF is the thing she called the proper text.
 *
 * The section spine IS hers: MEET THE FOUNDER → EARLY YEARS → BUILDING AT SCALE
 * → the black pull-quote band → MEDIA · LEADERSHIP · TRAINING → ACTIONS OF
 * COMPASSION → WHY THIS WORK. One kicker is not hers: HUMAN PERFORMANCE, added
 * because the PDF has a Brainwave Synergy / NLP passage that her screens have
 * no slot for, and burying it inside another section would have been the
 * quieter, worse choice. Flagged to her rather than presented as her design.
 *
 * ── The photographs ───────────────────────────────────────────────────────
 *
 * Supplied as originals on 2026-08-19, after this page first shipped as type
 * only — they had existed solely flattened inside her JPEG mockups, and an
 * empty frame waiting for a picture is the placeholder this repo's gates exist
 * to keep out of production. Converted to WebP at display width (~1MB for all
 * ten, against ~2.4MB of source JPEG) and imported so the bundler fingerprints
 * them; nothing here reaches for a path of its own.
 *
 * One deviation from her mockup, stated rather than hidden: her BUILDING AT
 * SCALE and MEDIA · LEADERSHIP · TRAINING rows repeat the same three
 * photographs. That reads as a designer filling a grid twice rather than an
 * intention, so the media row takes the two pictures her mockup uses further
 * down instead, and every photograph appears exactly once.
 *
 * The mockup's closing portrait has no counterpart in what was sent, so WHY
 * THIS WORK stays type — which is also the section where a photograph would
 * compete with the closing line rather than support it.
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
    ],
  }),
  component: Founder,
});

/**
 * One photograph, one treatment.
 *
 * Ten `<img>` written out longhand is ten chances for a stray aspect ratio, a
 * forgotten `loading="lazy"`, or an empty `alt`. `alt` is required by the type
 * rather than optional: every one of these is a photograph of real people doing
 * real things, and a screen reader deserves to be told which.
 */
function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full rounded-md object-cover ${className}`}
    />
  );
}

function Founder() {
  return (
    <>
      {/* ---------- Hero (cream) ---------- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">Meet the Founder</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-caps-light mt-6 max-w-4xl text-ink">A life spent building</h1>

          <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div className="grid gap-8">
              <p className="type-body-lg text-ink/70">
                Looking back, I realize every business I&rsquo;ve built, every leader I&rsquo;ve
                worked with, every team I&rsquo;ve trained, and every movement I&rsquo;ve been part
                of was preparing me for this. At the time, they felt like separate chapters.
              </p>
              <p className="type-body text-ink/70 lg:pt-2">
                Today, I see one story unfolding &mdash; a journey that taught me about leadership,
                human performance, technology, compassion, and how lasting change happens. Together,
                those experiences prepared me to build what I believe is the most important work of
                my life: The Be Human Company.
              </p>
            </div>
            <Shot
              src={studio}
              alt="Shane James on a television set with a colleague, a teleprompter and camera rig behind them"
              className="aspect-[4/5] lg:aspect-[4/5]"
            />
          </div>
        </div>
      </section>

      {/* ---------- Early years (cream) ---------- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">Early years</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <h2 className="type-h2-condensed mt-6 text-ink">Entrepreneurship started early</h2>
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
              <p className="type-body mt-6 text-ink/70">
                Building that business opened doors I never expected. I went on to build a national
                fitness brand, author four books in the health and fitness industry, coach thousands
                of people, and have my work featured internationally on television, magazine covers,
                and in publications as far away as China and India. Later, financing through
                Tale&rsquo;awtxw Aboriginal Capital Corporation helped support the publication of my
                books, allowing me to continue sharing ideas beyond the businesses I was building.
              </p>
            </div>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
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

      {/* ---------- Building at scale (cream) ---------- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">Building at scale</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <h2 className="type-h2-condensed mt-6 text-ink">People build organizations</h2>
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
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <Shot
              src={kitv}
              alt="Shane James interviewed at the KITV 4 Morning News desk"
              className="aspect-[4/3]"
            />
            <Shot
              src={pinterest}
              alt="Shane James presenting to a seated workshop audience beside a Pinterest slide"
              className="aspect-[4/3]"
            />
            <Shot
              src={stage}
              alt="Shane James speaking with a microphone in front of a large seated audience"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ---------- The belief, as the band in her design (ink) ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 text-center sm:px-8 lg:py-28">
          <blockquote className="type-h2-condensed mx-auto max-w-4xl">
            Businesses don&rsquo;t grow because of products. They grow because of people.
          </blockquote>
          <p className="type-body mt-10 text-muted-foreground">
            The only way I truly win is if my people win first.
          </p>
        </div>
      </section>

      {/* ---------- Media, leadership, training (cream) ---------- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">
                Media &middot; Leadership &middot; Training
              </p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <h2 className="type-h2-condensed mt-6 text-ink">How trust is built</h2>
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
              <p className="type-body mt-6 text-ink/70">
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
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <Shot
              src={filming}
              alt="Shane James being filmed on location in front of a painted mural"
              className="aspect-[4/3]"
            />
            <Shot
              src={conversations}
              alt="Four frames of Shane James in conversation, on a desert road and in a diner booth"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ---------- Human performance (cream) ----------

          The one kicker that is not in Maya's screens. Her design has no slot
          for the Brainwave Synergy passage, and the alternative was to fold it
          into a neighbouring section where it does not belong. */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">Human performance</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <h2 className="type-h2-condensed mt-6 text-ink">
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
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Actions of Compassion (cream) ---------- */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">Actions of Compassion</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <h2 className="type-h2-condensed mt-6 text-ink">
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
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
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

      {/* ---------- Why this work (ink) ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-lime">Why this work</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h2 className="type-h2-condensed mt-6 max-w-3xl">
            Preparation, not a r&eacute;sum&eacute;
          </h2>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
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
            <div className="lg:pt-1">
              <p className="type-body text-muted-foreground">
                Together, those experiences led me to one belief:
              </p>
              <p className="type-h3-condensed mt-6">
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
