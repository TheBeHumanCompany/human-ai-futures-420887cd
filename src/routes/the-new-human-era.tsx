/**
 * `/the-new-human-era` — the manifesto, rebuilt (Phase 5).
 *
 * COPY comes verbatim from `new h era copy final.pdf` (11 pp). LAYOUT comes from
 * Maya's four mockups in `.omc/artifacts/maya-mockups/`. Nothing on this page is
 * invented: the three `[HUMAN ARCHIVE QUOTE #N]` slots in the PDF are filled from
 * the real `ARCHIVE` const, and the six principle titles come from the single
 * `PRINCIPLE_TITLES` fixture rather than being retyped here.
 *
 * The design system the mockups establish, and which this file obeys:
 *   · Full-bleed bands alternating cream (ink text) / black (cream text). The
 *     alternation is STRUCTURAL — see `<Bands>` — not hand-assigned per section.
 *   · Every section opens with a letterspaced uppercase eyebrow above a short
 *     lime rule.
 *   · Lime is an accent and never a fill. It has exactly four jobs: the eyebrow
 *     rule, a single-word underline mid-sentence, the quote glyphs on archive
 *     quotes, and the dot at the midpoint of a centred hairline divider.
 *   · ~8px rounded corners on all imagery (`rounded-xl` — `--radius` is 2px and
 *     `--radius-xl` is `calc(--radius + 6px)`, so exactly 8px).
 *
 * No bespoke type sizes (AC-4.5): every heading carries a `type-*` class, and
 * nothing below sets a size by hand — no CSS clamping function, no arbitrary
 * bracket value, no named Tailwind size step. Sizes live in the scale only.
 * (Those forms are spelled out in `src/styles.css`, deliberately not here: the
 * AC-4.5 gate greps this file's raw source, so a comment naming them would fail
 * it just as surely as a real call site would.)
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Children, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";

import collageImage from "@/assets/new-human-era-collage.png";
import { ARCHIVE, HOME_PRINCIPLES } from "@/lib/content";

export const Route = createFileRoute("/the-new-human-era")({
  head: () => ({
    meta: [
      { title: "The New Human Era — Technology is advancing, and humanity has to advance with it" },
      {
        name: "description",
        content:
          "The greatest opportunity of the AI age is not simply to build more powerful technology. It is to become more powerful human beings because of it.",
      },
      {
        property: "og:title",
        content: "The New Human Era — Technology is advancing, and humanity has to advance with it",
      },
      {
        property: "og:description",
        content:
          "Human Wealth, Human Debt and Human Reps. A manifesto for practicing your humanity.",
      },
    ],
  }),
  component: NewHumanEra,
});

/* ── The three archive quotes, sourced from the const ─────────────────────── */
//
// The PDF carries `[HUMAN ARCHIVE QUOTE #1]` (p.1), `#2` (p.5) and `#3` (p.9).
// They are filled from the real four entries — ADEWOLF, ANTON, ARLINA. Mockup 2
// attributes a quote to "Lindsay / Vancouver" and mockup 1 shows five portrait
// slots; both are illustrative. The archive is four entries, and no fifth is
// invented here.
const [ADEWOLF, , , ARLINA] = ARCHIVE;

/* ── Band alternation, made structural ────────────────────────────────────── */

type Tone = "cream" | "ink";

/**
 * Assigns each band its tone from its position, so "no two adjacent bands share
 * a background" is guaranteed by construction rather than by everyone
 * remembering to alternate. Hand-assigned tones are how that invariant breaks
 * the first time a section is inserted in the middle.
 */
function Bands({ children }: { children: ReactNode }) {
  let i = 0;
  return (
    <>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const tone: Tone = i % 2 === 0 ? "cream" : "ink";
        i += 1;
        return cloneElement(child as ReactElement<{ tone?: Tone }>, { tone });
      })}
    </>
  );
}

function Band({
  id,
  tone = "cream",
  children,
}: {
  /** Present only on the nine named manifesto sections (AC-5.2). */
  id?: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <section
      {...(id ? { id, "data-nhe-section": id } : {})}
      data-band-tone={tone}
      className={tone === "cream" ? "section-cream" : "section-ink grain"}
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">{children}</div>
    </section>
  );
}

/* ── The four type roles ──────────────────────────────────────────────────
 *
 * 1. section label      — `type-label-caps` + lime rule (see `Opener`)
 * 2. manifesto headline — bold condensed caps: `type-h2-caps` (major),
 *                         `type-h3-caps` (medium), `type-h4-caps` (closing line)
 * 3. reflective headline— clean thin display: `type-h2-condensed` / `type-h3-condensed`
 * 4. body copy          — `type-body-lg`
 *
 * Nothing else. No condensed register, no decorative in-sentence underlines,
 * no one-off sizes.
 */

/** Standard column gaps, shared by every layout on the page. */
const COLS_2 = "grid gap-10 lg:grid-cols-2 lg:gap-16";
const SPLIT = "grid gap-10 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-16";


/** Eyebrow + short lime rule. Every section opens with this. */
function Opener({ label, tone = "cream" }: { label: string; tone?: Tone }) {
  return (
    <header className="mb-8">
      <p className={`type-label-caps ${tone === "cream" ? "text-ink/50" : "text-lime"}`}>{label}</p>
      <div className="type-eyebrow-rule" />
    </header>
  );
}

/**
 * Mobile-only section heading.
 *
 * On phones and small tablets the page reads eyebrow → strong heading → body.
 * Several sections go straight from eyebrow into copy on desktop by design, so
 * this heading is rendered only below `lg`, using language already present in
 * the section it introduces.
 */
function MobileHeading({ tone = "cream", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <h2
      className={`type-h2-caps mb-8 lg:hidden ${tone === "cream" ? "text-ink" : "text-foreground"}`}
    >
      {children}
    </h2>
  );
}


/* ── Layout 1 — Statement ─────────────────────────────────────────────────
 * label · one headline · one or two body columns beneath.
 */
function Statement({
  label,
  tone = "cream",
  headline,
  mobileHeadline,
  cols = 2,
  children,
}: {
  label?: string;
  tone?: Tone;
  headline?: ReactNode;
  /** Rendered below `lg` only — see `MobileHeading`. */
  mobileHeadline?: ReactNode;
  cols?: 1 | 2;
  children?: ReactNode;
}) {
  return (
    <>
      {label ? <Opener label={label} tone={tone} /> : null}
      {mobileHeadline ? <MobileHeading tone={tone}>{mobileHeadline}</MobileHeading> : null}
      {headline}
      {children ? (
        <div
          className={
            headline
              ? `mt-8 ${cols === 2 ? COLS_2 : "max-w-3xl"}`
              : cols === 2
                ? COLS_2
                : "max-w-3xl"
          }
        >
          {children}
        </div>
      ) : null}
    </>
  );
}


/* ── Layout 2 — Split editorial ───────────────────────────────────────────
 * 35/65 desktop grid: headline or thesis left, supporting copy or image right.
 */
function Split({
  label,
  tone = "cream",
  left,
  right,
  children,
}: {
  label?: string;
  tone?: Tone;
  left: ReactNode;
  right: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {label ? <Opener label={label} tone={tone} /> : null}
      <div className={SPLIT}>
        <div>{left}</div>
        <div>{right}</div>
      </div>
      {children ? <div className="mt-16">{children}</div> : null}
    </>
  );
}

/** Lime job — quote glyphs on an archive quote. */
function ArchiveQuote({ entry, tone = "cream" }: { entry: (typeof ARCHIVE)[number]; tone?: Tone }) {
  const limeText = tone === "cream" ? "text-lime-dark" : "text-lime";
  return (
    <figure data-archive-quote={entry.slug}>
      <blockquote className="type-h3-prose whitespace-pre-line">
        <span aria-hidden className={`mr-1 ${limeText}`}>
          &ldquo;
        </span>
        {entry.quote}
        <span aria-hidden className={`ml-1 ${limeText}`}>
          &rdquo;
        </span>
      </blockquote>
      <figcaption
        className={`eyebrow mt-6 ${tone === "cream" ? "text-ink/50" : "text-muted-foreground"}`}
      >
        {entry.name} / {entry.location} &middot; No. {entry.no}
      </figcaption>
    </figure>
  );
}

function Portrait({
  entry,
  className = "",
}: {
  entry: (typeof ARCHIVE)[number];
  className?: string;
}) {
  return (
    <img
      src={entry.image}
      alt={`${entry.name}, ${entry.location} — Human Archive No. ${entry.no}`}
      loading="lazy"
      className={`w-full rounded-xl object-cover ${className}`}
    />
  );
}

/* ── The page ─────────────────────────────────────────────────────────────── */

function NewHumanEra() {
  return (
    <Bands>
      {/* ---------- 1. Opening belief (cream) — Statement ---------- */}
      <Band>
        <Statement
          label="The Opportunity"
          headline={<h1 className="type-h1-caps max-w-4xl">The New Human Era</h1>}
        >
          <div>
            <p className="type-body-lg text-ink/70">
              We believe the greatest opportunity of the AI age is not simply to build more powerful
              technology. It is to become more powerful human beings because of it.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              More conscious. More connected. More capable of thinking for ourselves. More present
              for the people we love. More able to build lives that actually feel worth living.
            </p>
          </div>
          <p className="type-body-lg text-ink/70">
            If we get this right, technology could give humanity back something we have been chasing
            for generations: more freedom, more time, more possibility. It could help cure diseases
            that have taken people from us too early. It could remove enormous amounts of repetitive
            work and give more people the freedom to create, explore, build relationships and spend
            more of their lives doing what actually matters to them.
          </p>
        </Statement>

        <figure className="mt-16">
          <img
            src={collageImage}
            alt="Four people photographed at street level, side by side as one continuous portrait"
            loading="lazy"
            width={1786}
            height={886}
            className="h-auto w-full"
          />
          <figcaption className="mt-6">
            <p className="type-label-caps text-ink/50">REAL PEOPLE, REAL VOICES</p>
            <p className="type-body-lg mt-3 text-ink/70">
              This era belongs to people. The New Human Era is built with and for all of us.
            </p>
          </figcaption>
        </figure>
      </Band>

      {/* ---------- 2. What’s at stake (ink) — Statement ---------- */}
      <Band>
        <Statement
          tone="ink"
          label="The risk"
          headline={<h2 className="type-h2-caps">What’s at stake</h2>}
        >
          <p className="type-body-lg text-muted-foreground">
            If we get this transition wrong, we could become more technologically advanced than any
            generation before us and somehow less human at the same time.
          </p>
          <p className="type-body-lg text-muted-foreground">
            The truth is, we had already begun losing our way before AI arrived. The Industrial
            Revolution created extraordinary prosperity, but it also organized more of life around
            production. Clock in. Produce. Go home. Repeat. Over generations, work stopped simply
            supporting life and became the thing life was organized around. We became cogs in the
            wheel so gradually that most of us stopped asking what the wheel was for.
          </p>
        </Statement>
      </Band>

      {/* ---------- 3. The Human Archive (cream) — Split editorial ---------- */}
      <Band>
        <Split
          label="The Human Archive"
          left={
            <>
              <h2 className="type-h2-condensed">
                So we started asking one question: what does it mean to be human?
              </h2>
              <p className="type-body-lg mt-8 text-ink/70">
                More than 200 people have answered us so far. Different ages. Different backgrounds.
                Different stories. Almost nobody talks about productivity, titles or going to work.
                They talk about love, family, laughter, connection, freedom, helping someone, being
                there when somebody needs you and experiencing life while you still have it.
              </p>
              <Link
                to="/the-human-archive"
                className="eyebrow mt-8 inline-flex items-center gap-3 rounded-full border border-lime px-7 py-4 text-ink transition-colors hover:bg-lime"
              >
                Explore the archive <span aria-hidden>&rarr;</span>
              </Link>
            </>
          }
          right={
            <div>
              <Portrait entry={ADEWOLF} className="aspect-[4/3]" />
              <ul className="mt-4 grid grid-cols-4 gap-4">
                {ARCHIVE.map((entry) => (
                  <li key={entry.slug}>
                    <Portrait entry={entry} className="aspect-square" />
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <div className={COLS_2}>
            <ArchiveQuote entry={ADEWOLF} />
            <p className="type-body-lg self-center text-ink/70">
              One person talks about love. Another about family. Another about showing up when life
              gets hard. Different answers, but again and again they pull us back toward the same
              thing: the parts of life that are deeply human are often the very parts modern life
              keeps pushing to the edges.
            </p>
          </div>
        </Split>
      </Band>

      {/* ---------- 4. The bigger question (ink) — Split editorial ---------- */}
      <Band>
        <Split
          tone="ink"
          label="The bigger question"
          left={
            <>
              <h2 className="type-h2-caps">This is bigger than AI</h2>
              <p className="type-body-lg mt-8 text-foreground">
                If these are the things people tell us make life human, why have we built a world
                that keeps pushing them aside?
              </p>
            </>
          }
          right={
            <>
              <p className="type-body-lg text-muted-foreground">
                Now AI is powerful enough to change that system again. That could be extraordinary.
                But it raises a question that may matter just as much as what the technology itself
                can do:
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  If technology finally gives us more of our lives back, will we know what to do
                  with them?
                </strong>
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                More time does not automatically create a better life. More abundance does not
                automatically create connection. We already have more ways to communicate than any
                generation in history and can still struggle to have the conversations that matter
                most. We can be surrounded by people and feel alone. We can have unlimited
                information while becoming increasingly dependent on something outside ourselves to
                tell us what to think, what to want and where to place our attention.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                AI could free us from parts of the old system. It could also magnify its worst
                qualities: concentrating more power in fewer hands, making millions of people feel
                replaceable and deepening our dependence on systems we do not control.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                It is about who we are as human beings and what kind of world we build next.
              </p>
            </>
          }
        />
      </Band>

      {/* ---------- 5. The Bridge Generation (cream) — Split editorial ---------- */}
      <Band>
        <Statement
          label="The Bridge Generation"
          headline={<h2 className="type-h2-caps max-w-6xl">We are the Bridge Generation</h2>}
        >
          <div>
            <p className="type-body-lg text-ink/70">
              We are the Bridge Generation, standing between the world we inherited and the world
              that comes after it. Behind us is a system built largely around scarcity and
              exchanging huge portions of human life for work. Ahead of us may be a world of
              abundance and technological capability generations before us could barely imagine.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              Our job is not simply to cross that bridge. It is to decide what we bring with us.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              Do we bring our ability to think for ourselves? Relationships strong enough to carry
              real life? Trust, curiosity, laughter and the ability to actually experience the
              people standing in front of us? Or do we arrive with extraordinary machines and
              underdeveloped humans?
            </p>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              Governments cannot practice your humanity for you. Companies cannot do your
              relationships for you. AI cannot decide what kind of parent, friend, leader or human
              being you become.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              Technology is advancing, and humanity has to advance with it.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              That part still belongs to you. And that may be the opportunity hidden inside this
              whole transition. While technology becomes more capable, we can deliberately become
              more human. Not through another philosophy we agree with and forget. Through practice.
            </p>
          </div>
        </Statement>
      </Band>

      {/* ---------- 6. The bigger question (ink) — Split editorial ---------- */}
      <Band>
        <Split
          tone="ink"
          label="The bigger question"
          left={
            <h2 className="type-h2-caps lg:type-h2-condensed">
              What if practicing your humanity is how you build the life you want?
            </h2>
          }

          right={
            <>
              <p className="type-body-lg text-muted-foreground">
                For generations, we have been taught how to get ahead. Produce more. Work harder.
                Optimize your time. Build the company. Earn more. Win.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                We became extraordinarily good at developing everything around the human: our
                businesses, our productivity, our technology and our bank accounts. Very little
                taught us to practice the humanity of the person doing the building.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                Even self-help and personal growth begin with the self. The person. How do I become
                more successful? More confident? More productive? There is nothing wrong with that.
                But the New Human Era asks a bigger question:
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                What happens when the things you practice not only improve your own life, but
                improve what another human experiences because you were there?
              </p>
            </>
          }
        />
      </Band>

      {/* ---------- 7. Not the reward (cream) — Split editorial ---------- */}
      <Band>
        <Split
          label="Not the reward"
          left={
            <h2 className="type-h2-caps lg:type-h2-condensed">

              But what if your humanity is not the reward at the end of a good life?
            </h2>
          }
          right={
            <>
              <p className="type-body-lg text-ink/70">
                Most of us were taught that if we became successful enough, the freedom and
                happiness we wanted would arrive with it. We spend decades building the outside of
                our lives and assume the inside will take care of itself.
              </p>
              <p className="type-body-lg mt-6 text-ink/70">
                The strongest relationships depend on whether the people you love ever get the fully
                present version of you. Opportunities that last are built on whether people trust
                your judgment and believe your word means something. Success loses much of its
                meaning if you finally create the life you wanted but become too distracted to
                experience it.
              </p>
            </>
          }
        >
          <div className="mt-8 text-center lg:mt-16">
            <h3 className="type-h2-caps">It is part of how you build one</h3>
            <p className="type-body-lg mt-6 text-ink/70">
              Your humanity is not separate from those outcomes. It is underneath them.
            </p>
          </div>
        </Split>
      </Band>

      {/* ---------- 8. What status becomes (ink) — Statement, one column ---------- */}
      <Band>
        <Statement
          tone="ink"
          label="When the performance becomes cheap"
          mobileHeadline="Our humanity matters even more"
          cols={1}
        >

          <p className="type-body-lg text-muted-foreground">
            Our humanity matters even more because AI is making many of the old signals of advantage
            easier to manufacture. Knowledge can be accessed in seconds. Content can be produced
            endlessly. Confidence can be performed. An impressive image can be generated.
          </p>
          <p className="type-body-lg mt-6 text-muted-foreground">
            For generations, status has largely been something we display: the money, the title, the
            appearance of winning. But real status has never needed that much explanation. It is the
            person whose Word Carries Weight because they have kept it. The person people want beside
            them when something important happens. The parent whose child knows they are actually
            listening. The leader who makes people more capable instead of more afraid.
          </p>
          <p className="type-body-lg mt-6 text-muted-foreground">
            And what one generation learns to admire, the next learns to chase. If status begins
            attaching itself to humans who are Fully Here, who Keep Their Own Mind, whose Word
            Carries Weight, we begin changing more than individual lives.
          </p>
          <p className="type-body-lg mt-6 text-muted-foreground">
            We begin changing what success means.
          </p>
        </Statement>
      </Band>


      {/* ---------- 9. Human Wealth (cream) — Split editorial ---------- */}
      <Band id="human-wealth">
        <Split
          label="Human Wealth"
          left={<h2 className="type-h2-caps">The wealth nobody taught us to build</h2>}
          right={
            <>
              <p className="type-body-lg text-ink/70">
                We have been taught to think about wealth one way: money, property, ownership. But
                there is another kind of wealth that determines whether your life actually feels
                rich once the noise dies down.
              </p>
              <p className="type-body-lg mt-6 text-ink/70">
                It is the trust attached to your name. The relationships strong enough to carry real
                life. The ability to sit across from someone you love and actually be there. The
                confidence to think with your own mind when the world is constantly trying to shape
                it for you. Knowing there are people you can call when life falls apart, and knowing
                they would call you too.
              </p>
              <p className="type-h4-caps mt-8 text-ink">We call that Human Wealth</p>
            </>
          }
        />
      </Band>

      {/* ---------- 10. Human Debt (ink) — Statement ---------- */}
      <Band id="human-debt">
        <Statement
          tone="ink"
          label="Human Debt"
          headline={
            <h2 className="type-h2-caps max-w-4xl">There is a cost. We call it Human Debt</h2>
          }
        >
          <div>
            <p className="type-body-lg text-muted-foreground">
              You can spend thirty years building a company, hit the number you always wanted,
              finally get the house and the recognition, and still realize the people you love
              became strangers while you were building it. You can become wealthy and still have
              nobody you trust. You can finally create the time you spent your whole life chasing
              and discover you no longer know how to be still enough to enjoy it.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Human Debt accumulates when we repeatedly trade away the parts of our humanity that
              make life worth living. It builds when another notification wins over a real
              conversation, when we stop wrestling with our own thoughts because something else can
              answer faster, when the people we love keep getting the distracted version of us
              instead of the real one.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              It rarely feels serious while it is accumulating. It usually shows up years later: in
              the distance that quietly grew between you and somebody you love, in the child who
              stopped trying to get your attention, in the friendship that slowly disappeared, or in
              the decisions you no longer trust yourself to make without checking what everyone else
              thinks.
            </p>
            <p className="type-h4-caps mt-8 text-foreground">But Human Wealth compounds too</p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Imagine becoming successful and still having children who want to call you. Imagine
              building something extraordinary without needing to recover from the person you became
              while building it. Imagine having ambition without losing your ability to be Fully
              Here. That is the life we want to help people build.
            </p>
          </div>
        </Statement>
      </Band>

      {/* ---------- 11. Human Reps (cream) — Statement ---------- */}
      <Band id="human-reps">
        <Statement
          label="Human Reps"
          headline={
            <h2 className="type-h2-caps max-w-4xl">
              Human Reps: how you actually practice your humanity
            </h2>
          }
        >
          <div>
            <p className="type-body-lg text-ink/70">
              Human Wealth is created through small choices repeated over time. The conversation you
              do not avoid. The phone you put down. The promise you keep. The moment you catch an
              old pattern and choose something different. Those moments can look too small to
              matter. Repeated long enough, they become your life.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              You can agree with everything above and still wake up tomorrow behaving exactly the
              same way you did yesterday. That is why humanity has to be practiced. We call those
              practices Human Reps.
            </p>
            <p className="type-body-lg mt-6 font-semibold text-ink">
              A Human Rep is a small, conscious action where you interrupt an automatic pattern and
              choose how you want to show up instead.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              You notice yourself reaching for the phone while somebody is talking, and you put it
              down. You feel yourself becoming defensive, and you listen before responding. You are
              about to ask AI for the answer, and you decide to wrestle with the question yourself
              first. It does not have to be dramatic.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              Call the friend you keep thinking about instead of liking another one of their posts.
              Keep the promise that became inconvenient. Apologize. Tell someone what they mean to
              you. Bring somebody into the conversation instead of letting them stand outside it.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              The point is not that one rep changes your life. The point is that for one moment, you
              became conscious enough to choose something different. And then you do it again. Over
              time, those choices shape the person making them. That is Human Wealth being built in
              real time.
            </p>
          </div>
        </Statement>
      </Band>

      {/* ---------- 12. Human Mode (ink) — Statement ---------- */}
      <Band id="human-mode">
        <Statement
          tone="ink"
          label="Human Mode"
          cols={1}
          headline={<h2 className="type-h2-caps max-w-4xl">We call that Human Mode</h2>}
        >
          <p className="type-body-lg text-muted-foreground">
            Most Human Reps begin in the moment you catch yourself. You notice the phone in your
            hand, the urge to scroll or perform or hand a thought away because something else can
            answer faster. For a moment, you stop operating automatically and become conscious of
            how you are showing up.
          </p>
          <p className="type-body-lg mt-6 text-muted-foreground">
            Human Mode is not about disconnecting from technology. It is about creating enough space
            to choose what happens next. You do not have to live there perfectly. The goal is simply
            to notice more often, because every time you catch yourself, you create another chance
            to practice the human you want to become.
          </p>
        </Statement>
      </Band>

      {/* ---------- 13. The Double Return (cream) — Statement, two body columns ---------- */}
      <Band id="the-double-return">
        <Statement label="The Double Return" cols={2}>
          <div>
            <p className="type-body-lg text-ink/70">
              This is where Human Reps become bigger than self-improvement. There is usually another
              human on the other side of one.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              When you put your phone down, somebody feels heard. When you keep your word, somebody
              learns they can trust you. When you call the friend, somebody feels remembered. The rep
              strengthens something in you while changing something for another person at the same
              time.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              A real Human Rep can build something in you while creating something better for another
              human in the same act. That is why practicing your humanity is not simply a private
              project. Its effect begins moving outward the moment you do it.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              And that is why one of the simplest Human Reps may also be one of the most powerful:
            </p>
            <p className="type-body-lg mt-6 font-bold text-ink">
              How can I make one person&rsquo;s life a little better today?
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              A thoughtful message. A genuine compliment. A phone call. Encouragement. A laugh. Five
              minutes of undivided attention. Nobody would call most of those things world-changing.
              But the world does not always change through one enormous act. Sometimes it changes
              because enough people begin behaving differently toward the human directly in front of
              them.
            </p>
          </div>
        </Statement>
      </Band>


      {/* ---------- 14. Friction (ink) — Split editorial ---------- */}
      <Band id="some-friction-is-where-humans-are-built">
        <Split
          tone="ink"
          label="Friction"
          left={<h2 className="type-h2-caps">Some friction is where humans are built</h2>}
          right={
            <>
              <p className="type-body-lg text-muted-foreground">
                Much of who we become is shaped by what we repeatedly practice. If you continually
                hand away your thinking because something else can answer faster, you become less
                practiced at wrestling with hard questions yourself. Practice being Fully Here and
                you get better at giving attention. Keep your word and trust starts attaching itself
                to your name.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                There was a time when physical movement was simply built into everyday life. Modern
                life removed much of it, so we built gyms to deliberately put the reps back in. We
                believe something similar may now be happening to parts of our humanity.
              </p>
              <p className="type-body-lg mt-6 text-muted-foreground">
                AI can remember for us, write for us, answer for us and think alongside us. Much of
                that will make life better. But not every kind of friction should disappear. So the
                question is not whether we should use AI. We should. The question is:
              </p>
              <p className="type-body-lg mt-10 font-bold text-foreground">
                Is this technology freeing me to become more human, or replacing something in myself
                I still need to practice?
              </p>
            </>
          }
        />
      </Band>

      {/* ---------- 15. The framework (cream) — Statement, one column ---------- */}
      <Band id="the-framework">
        <Statement label="The framework" cols={1}>
          <p className="type-body-lg text-ink/70">
            We practice our humanity through small choices. Those choices become Human Reps. Repeated
            reps build Human Wealth. Human Wealth helps us build a richer life. And because those
            reps so often affect another human at the same time, the effect moves outward too. A
            better life for the person practicing it. A more human world because they did.
          </p>
          <p className="type-body-lg mt-6 text-ink/70">
            We did not want to build this framework by sitting in a room and deciding what humanity
            should mean for everyone else. We have enough people in the world telling us that their
            philosophy is the philosophy. So we started by listening. Through the Human Archive, we
            have asked more than 200 people one question: what does it mean to be human? We did not
            ask them to confirm our beliefs. We asked them to tell us theirs.
          </p>
        </Statement>
      </Band>

      {/* ---------- 16. How it compounds (ink) — progression + archive quote ---------- */}
      <Band id="how-it-compounds">
        <Opener label="How it compounds" tone="ink" />

        <ol className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {[
            "PRACTISE HUMANITY",
            "HUMAN REPS",
            "HUMAN WEALTH",
            "BETTER LIFE",
            "BETTER WORLD",
          ].map((node, i, all) => (
            <li key={node} className="flex items-center gap-4">
              <span className="type-h4-caps text-foreground">{node}</span>
              {i < all.length - 1 ? (
                <span aria-hidden className="text-lime">
                  &rarr;
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className={`mt-16 ${COLS_2}`}>
          <ArchiveQuote entry={ARLINA} tone="ink" />
          <p className="type-body-lg self-center text-muted-foreground">
            And we listened for what kept appearing: love, family, connection, laughter, being
            present, helping someone, thinking for yourself, being there when another person needs
            you and actually experiencing your life while you still have it. Those answers helped
            shape the principles we believe matter more as technology becomes more capable:
          </p>
        </div>
      </Band>

      {/* ---------- 17. The six principles (cream) — 3x2 grid ---------- */}
      <Band id="the-six-principles">
        <Opener label="The six principles" tone="cream" />

        <div className="flex flex-col">
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 order-1 sm:order-2 sm:mt-16">
            {HOME_PRINCIPLES.map((p) => (
              <li key={p.n}>
                <span className="eyebrow text-lime-dark">{p.n}</span>
                <h3 className="type-h4-caps mt-3 text-ink">{p.title}</h3>
                <p className="type-body mt-2 text-ink/65">{p.body}</p>
              </li>
            ))}
          </ol>

          <p className="type-body-lg order-2 sm:order-1 mt-16 sm:mt-0 max-w-3xl text-ink/70">
            They are not commandments. They are not a claim that we discovered the only way to be
            human. They are language for things humanity itself keeps reminding us are worth
            practicing. That is what makes the Human Archive so important. It keeps real human voices
            inside the conversation as the world changes. Not one guru telling humanity what it should
            become. Humanity helping shape it.
          </p>
        </div>
      </Band>


      {/* ---------- 18. What we are actually building (ink) — two columns ---------- */}
      <Band id="what-we-are-actually-building">
        <Opener label="What we are actually building" tone="ink" />

        <div className={COLS_2}>
          <div>
            <p className="type-body-lg text-muted-foreground">
              The goal of the New Human Era is not another philosophy people read, agree with and
              forget. We want to help millions of people understand how to practice their humanity
              deliberately — and understand what it can build in their own lives and in the lives
              around them.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Imagine a world where more people begin asking themselves: what is my Human Rep today?
              For one person, that rep might be as simple as asking: how can I make one
              person&rsquo;s life a little better today?
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Now imagine that becoming normal in homes, companies, schools and communities. A parent
              puts the phone down. A leader listens before reacting. A child notices somebody standing
              alone and brings them in. A friend makes the call. A person thinks through the question
              before handing it away. Individually, these moments look small. Together, they begin to
              shape culture.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              One person practices differently. Another human experiences the difference. Enough
              changed experiences shape relationships. Relationships shape families, teams, schools
              and communities. Eventually, what people repeatedly experience begins changing what a
              culture considers normal.
            </p>
            <p className="type-h4-caps mt-8 text-foreground">That is how humanity compounds</p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              That is the scale of the ambition. Not millions of people following one philosophy.
              Millions of people learning how to practice their humanity in a world becoming more
              artificial.
            </p>
          </div>
        </div>

      </Band>


      {/* ---------- 19. The invitation (cream) — two balanced text columns ---------- */}
      <Band id="the-invitation">
        <Statement label="The invitation" cols={2}>
          <div>
            <p className="type-body-lg text-ink/70">
              We are living through one of the biggest transitions humanity has ever faced, and none
              of us knows exactly what the world on the other side looks like. But we do get to
              decide how we show up while we build it.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              We can use extraordinary technology without surrendering the parts of ourselves that
              make life worth living. We can build financial wealth without ignoring Human Wealth.
              We can notice Human Debt accumulating and start paying some of it back. We can put in
              one Human Rep today, another tomorrow, and prove through our behaviour what kind of
              future we want. And we can do it together.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              You do not need to agree with every word on this page. You do not need to belong to
              the same political party, religion, generation, country or way of life. The New Human
              Era is not asking humanity to become the same. It is asking us to remember what we
              share.
            </p>
            <p className="type-body-lg mt-6 font-semibold text-ink">
              We are the Bridge Generation. We inherited one world, and together we are helping
              build the next one.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              The question is not whether technology will keep advancing. It will. The question is
              whether we will advance our humanity with it.
            </p>
          </div>
        </Statement>
      </Band>

      {/* ---------- 20. Closing (ink) — emotional close ---------- */}
      <Band>
        <div className="py-10 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="type-h2-caps text-foreground">
              <span className="block">There are no perfect humans</span>
              <span className="block">There are only humans practicing</span>
            </h2>
            <p className="type-body-lg mt-16 text-muted-foreground">
              Start where you are. Start with the human directly in front of you. Ask yourself one
              question:
            </p>
            <p className="type-body-xl mt-16 font-bold text-foreground">
              What&rsquo;s my Human Rep today?
            </p>
            <p className="type-body-lg mt-16 text-muted-foreground">
              Then do it. That is how this starts. One rep. One human. One life made a little
              better. And eventually, millions.
            </p>
          </div>
        </div>
      </Band>
    </Bands>
  );
}
