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

import archiveStill from "@/assets/human-archive-still.webp";
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
          "Human Wealth, Human Debt and Human Reps. A manifesto for practising your humanity.",
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
const [ADEWOLF, , ANTON, ARLINA] = ARCHIVE;

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

/** Eyebrow + short lime rule. Every mockup section opens with this. */
function Opener({ label, tone = "cream" }: { label: string; tone?: Tone }) {
  return (
    <header className="mb-10">
      <p className={`type-label-caps ${tone === "cream" ? "text-ink/50" : "text-lime"}`}>{label}</p>
      <div className="type-eyebrow-rule" />
    </header>
  );
}

/** Lime job 2 of 4 — an underline beneath one key word mid-sentence. */
function Key({ children }: { children: ReactNode }) {
  return (
    <span className="underline decoration-lime decoration-[3px] underline-offset-[8px]">
      {children}
    </span>
  );
}

/** Lime job 4 of 4 — a centred hairline with a lime dot at its midpoint. */
function DividerDot() {
  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="type-divider-dot" />
    </div>
  );
}

/** Lime job 3 of 4 — quote glyphs on an archive quote. */
function ArchiveQuote({ entry, tone = "cream" }: { entry: (typeof ARCHIVE)[number]; tone?: Tone }) {
  const limeText = tone === "cream" ? "text-lime-dark" : "text-lime";
  return (
    <figure data-archive-quote={entry.slug}>
      <blockquote className="type-h2-condensed whitespace-pre-line">
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
        {entry.name} / {entry.location} · No. {entry.no}
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
      {/* ---------- 1. Opening belief (cream) ---------- */}
      <Band>
        <Opener label="The Opportunity" />
        <h1 className="type-h1-caps max-w-4xl">The New Human Era</h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-h3-prose">
              We believe the greatest opportunity of the AI age is not simply to build more powerful
              technology. It is to become more powerful human beings because of it.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              More conscious. More connected. More capable of thinking for ourselves. More present
              for the people we love. More able to build lives that actually feel worth living.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              If we get this right, technology could give humanity back something we have been
              chasing for generations: more freedom, more time, more possibility. It could help cure
              diseases that have taken people from us too early. It could remove enormous amounts of
              repetitive work and give more people the freedom to create, explore, build
              relationships and spend more of their lives doing what actually matters to them.
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 2. None of that is guaranteed (ink) ---------- */}
      <Band>
        <h2 className="type-h2-caps">None of that is guaranteed.</h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <p className="type-h4-prose text-foreground/85">
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
        </div>
      </Band>

      {/* ---------- 3. The Human Archive (cream) — mockup 1 ---------- */}
      <Band>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Opener label="The Human Archive" />
            <h2 className="type-h2-caps max-w-xl">
              So we started asking one question: what does it mean to be human?
            </h2>
            <p className="type-body-lg mt-8 max-w-md text-ink/70">
              More than 200 people have answered us so far. Different ages. Different backgrounds.
              Different stories. Almost nobody talks about productivity, titles or going to work.
              They talk about love, family, laughter, connection, freedom, helping someone, being
              there when somebody needs you and experiencing life while you still have it.
            </p>
            <Link
              to="/the-human-archive"
              className="eyebrow mt-10 inline-flex items-center gap-3 rounded-full border border-lime px-7 py-4 text-ink transition-colors hover:bg-lime"
            >
              Explore the archive <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          {/* One feature portrait above the row of four. The feature is not a
              fifth entry — the archive is four, and mockup 1's fifth slot is
              illustrative. */}
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
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ArchiveQuote entry={ADEWOLF} />
          <p className="type-body-lg self-center text-ink/70">
            One person talks about love. Another about family. Another about showing up when life
            gets hard. Different answers, but again and again they pull us back toward the same
            thing: the parts of life that are deeply human are often the very parts modern life
            keeps pushing to the edges.
          </p>
        </div>

        <DividerDot />

        <div className="mx-auto max-w-4xl text-center">
          <p className="type-body-lg text-ink/60">That should make us ask a harder question:</p>
          <h3 className="type-h2-condensed mt-6">
            If these are the things people tell us make life <Key>human</Key>, why have we built a
            world that keeps pushing them aside?
          </h3>
        </div>
      </Band>

      {/* ---------- 4. This is bigger than AI (ink) — mockup 2 ---------- */}
      <Band>
        <div className="mx-auto max-w-4xl text-center">
          <p className="type-body-lg text-muted-foreground">
            Now AI is powerful enough to change that system again. That could be extraordinary. But
            it raises a question that may matter just as much as what the technology itself can do:
          </p>
          <h2 className="type-h2-condensed mt-8">
            If technology finally gives us more of our lives back, will we know what to do with
            them?
          </h2>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-muted-foreground">
              More time does not automatically create a better life. More abundance does not
              automatically create connection. We already have more ways to communicate than any
              generation in history and can still struggle to have the conversations that matter
              most. We can be surrounded by people and feel alone. We can have unlimited information
              while becoming increasingly dependent on something outside ourselves to tell us what
              to think, what to want and where to place our attention.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              AI could free us from parts of the old system. It could also magnify its worst
              qualities: concentrating more power in fewer hands, making millions of people feel
              replaceable and deepening our dependence on systems we do not control.
            </p>
          </div>
          <div className="self-end">
            <div className="type-eyebrow-rule mb-6" />
            <h3 className="type-h2-caps">That is why we believe this is bigger than AI.</h3>
            <p className="type-h4-caps mt-5 text-foreground/80">
              It is about who we are as human beings and what kind of world we build next.
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 5. The Bridge Generation (cream) — mockup 2 ---------- */}
      <Band>
        <Opener label="The Bridge Generation" />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="type-h1-condensed">We are the Bridge Generation.</h2>
            <p className="type-body-lg mt-8 text-ink/70">
              We are the Bridge Generation, standing between the world we inherited and the world
              that comes after it. Behind us is a system built largely around scarcity and
              exchanging huge portions of human life for work. Ahead of us may be a world of
              abundance and technological capability generations before us could barely imagine.
            </p>
            <p className="type-h4-condensed mt-8">
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
            <h3 className="type-h1-condensed">
              Technology is advancing, and humanity has to advance <Key>with it</Key>.
            </h3>
            <p className="type-body-lg mt-8 text-ink/70">
              Governments cannot practise your humanity for you. Companies cannot do your
              relationships for you. AI cannot decide what kind of parent, friend, leader or human
              being you become.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              That part still belongs to you. And that may be the opportunity hidden inside this
              whole transition. While technology becomes more capable, we can deliberately become
              more human. Not through another philosophy we agree with and forget.{" "}
              <strong className="font-semibold text-ink">Through practice.</strong>
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 6. The bigger question (ink) — mockup 4 ---------- */}
      <Band>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Opener label="The bigger question" tone="ink" />
            <h2 className="type-h2-prose">
              What if practising your humanity is how you build the life you want?
            </h2>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              For generations, we have been taught how to get ahead. Produce more. Work harder.
              Optimize your time. Build the company. Earn more. Win.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              We became extraordinarily good at developing everything around the human: our
              businesses, our productivity, our technology and our bank accounts. Very little taught
              us to practise the humanity of the person doing the building.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Even self-help and personal growth begin with the self. The person. How do I become
              more successful? More confident? More productive? There is nothing wrong with that.
              But the New Human Era asks a bigger question:
            </p>
            <p className="type-h4-prose mt-8">
              What happens when the things you practise not only improve your own life, but improve
              what another human experiences because you were there?
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 7. Not the reward (cream) — mockup 3 ---------- */}
      <Band>
        <DividerDot />
        <div className="mx-auto max-w-4xl text-center">
          <p className="type-body-lg text-ink/70">
            Most of us were taught that if we became successful enough, the freedom and happiness we
            wanted would arrive with it. We spend decades building the outside of our lives and
            assume the inside will take care of itself.
          </p>
          <h2 className="type-h2-prose mt-12">
            But what if your humanity is not the reward at the end of a good life?
          </h2>
          <div className="type-eyebrow-rule mx-auto my-10" />
          <h3 className="type-h2-caps">It is part of how you build one.</h3>
          <p className="type-body-lg mt-10 text-ink/70">
            The strongest relationships depend on whether the people you love ever get the fully
            present version of you. Opportunities that last are built on whether people trust your
            judgment and believe your word means something. Success loses much of its meaning if you
            finally create the life you wanted but become too distracted to experience it.
          </p>
          <p className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span className="type-h4-prose text-ink/70">
              Your humanity is not separate from those outcomes.
            </span>
            <span aria-hidden className="hidden h-8 w-px bg-lime sm:block" />
            <span className="type-h2-caps">It is underneath them.</span>
          </p>
        </div>
      </Band>

      {/* ---------- 8. What status becomes (ink) ---------- */}
      <Band>
        <Opener label="When the performance becomes cheap" tone="ink" />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-muted-foreground">
              This matters even more because AI is making many of the old signals of advantage
              easier to manufacture. Knowledge can be accessed in seconds. Content can be produced
              endlessly. Confidence can be performed. An impressive image can be generated.
            </p>
            <h2 className="type-h3-condensed mt-8">
              When the performance becomes cheap, the human behind it becomes valuable.
            </h2>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              For generations, status has largely been something we display: the money, the title,
              the appearance of winning. But real status has never needed that much explanation. It
              is the person whose Word Carries Weight because they have kept it. The person people
              want beside them when something important happens. The parent whose child knows they
              are actually listening. The leader who makes people more capable instead of more
              afraid.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              And what one generation learns to admire, the next learns to chase. If status begins
              attaching itself to humans who are Fully Here, who Keep Their Own Mind, whose Word
              Carries Weight, we begin changing more than individual lives.
            </p>
            <p className="type-h4-condensed mt-8">We begin changing what success means.</p>
          </div>
        </div>
      </Band>

      {/* ---------- 9. Human Wealth (cream) ---------- */}
      <Band id="human-wealth">
        <Opener label="Human Wealth" />
        <h2 className="type-h2-caps max-w-3xl">The wealth nobody taught us to build</h2>
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-ink/70">
              We have been taught to think about wealth one way: money, property, ownership. But
              there is another kind of wealth that determines whether your life actually feels rich
              once the noise dies down.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              It is the trust attached to your name. The relationships strong enough to carry real
              life. The ability to sit across from someone you love and actually be there. The
              confidence to think with your own mind when the world is constantly trying to shape it
              for you. Knowing there are people you can call when life falls apart, and knowing they
              would call you too.
            </p>
            <p className="type-h3-condensed mt-8">We call that Human Wealth.</p>
          </div>
          <div className="self-center">
            <ArchiveQuote entry={ANTON} />
          </div>
        </div>
      </Band>

      {/* ---------- 10. Human Debt (ink) ---------- */}
      <Band id="human-debt">
        <Opener label="Human Debt" tone="ink" />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-muted-foreground">
              You can spend thirty years building a company, hit the number you always wanted,
              finally get the house and the recognition, and still realize the people you love
              became strangers while you were building it. You can become wealthy and still have
              nobody you trust. You can finally create the time you spent your whole life chasing
              and discover you no longer know how to be still enough to enjoy it.
            </p>
            <h2 className="type-h2-caps mt-8">There is a cost to that. We call it Human Debt.</h2>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              Human Debt accumulates when we repeatedly trade away the parts of our humanity that
              make life worth living. It builds when another notification wins over a real
              conversation, when we stop wrestling with our own thoughts because something else can
              answer faster, when the people we love keep getting the distracted version of us
              instead of the real one.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              It rarely feels serious while it is accumulating. It usually shows up years later: in
              the distance that quietly grew between you and somebody you love, in the child who
              stopped trying to get your attention, in the friendship that slowly disappeared, or in
              the decisions you no longer trust yourself to make without checking what everyone else
              thinks.
            </p>
            <h3 className="type-h3-condensed mt-8">But Human Wealth compounds too.</h3>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Imagine becoming successful and still having children who want to call you. Imagine
              building something extraordinary without needing to recover from the person you became
              while building it. Imagine having ambition without losing your ability to be Fully
              Here. That is the life we want to help people build.
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 11. Human Reps (cream) ---------- */}
      <Band id="human-reps">
        <Opener label="Human Reps" />
        <h2 className="type-h2-caps max-w-3xl">
          Human Reps: how you actually practise your humanity
        </h2>
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-ink/70">
              Human Wealth is created through small choices repeated over time. The conversation you
              do not avoid. The phone you put down. The promise you keep. The moment you catch an
              old pattern and choose something different. Those moments can look too small to
              matter. Repeated long enough, they become your life.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              You can agree with everything above and still wake up tomorrow behaving exactly the
              same way you did yesterday. That is why humanity has to be practised. We call those
              practices Human Reps.
            </p>
            <p className="type-h4-condensed mt-8">
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
        </div>
      </Band>

      {/* ---------- 12. Human Mode (ink) ---------- */}
      <Band id="human-mode">
        <Opener label="Human Mode" tone="ink" />
        <div className="mx-auto max-w-4xl">
          <p className="type-body-lg text-muted-foreground">
            Most Human Reps begin in the moment you catch yourself. You notice the phone in your
            hand, the urge to scroll or perform or hand a thought away because something else can
            answer faster. For a moment, you stop operating automatically and become conscious of
            how you are showing up.
          </p>
          <h2 className="type-h2-condensed mt-8">We call that Human Mode.</h2>
          <p className="type-body-lg mt-8 text-muted-foreground">
            Human Mode is not about disconnecting from technology. It is about creating enough space
            to choose what happens next. You do not have to live there perfectly. The goal is simply
            to notice more often, because every time you catch yourself, you create another chance
            to practise the human you want to become.
          </p>
        </div>
      </Band>

      {/* ---------- 13. The Double Return (cream) ---------- */}
      <Band id="the-double-return">
        <Opener label="The Double Return" />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="type-body-lg text-ink/70">
              And this is where Human Reps become bigger than self-improvement. There is usually
              another human on the other side of one.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              When you put your phone down, somebody feels heard. When you keep your word, somebody
              learns they can trust you. When you call the friend, somebody feels remembered. The
              rep strengthens something in you while changing something for another person at the
              same time.
            </p>
            <h2 className="type-h2-caps mt-8">That is the Double Return.</h2>
          </div>
          <div>
            <p className="type-body-lg text-ink/70">
              A real Human Rep can build something in you while creating something better for
              another human in the same act. That is why practising your humanity is not simply a
              private project. Its effect begins moving outward the moment you do it.
            </p>
            <p className="type-body-lg mt-6 text-ink/60">
              And that is why one of the simplest Human Reps may also be one of the most powerful:
            </p>
            <h3 className="type-h3-condensed mt-6">
              How can I make one person&rsquo;s life a little <Key>better</Key> today?
            </h3>
            <p className="type-body-lg mt-6 text-ink/70">
              A thoughtful message. A genuine compliment. A phone call. Encouragement. A laugh. Five
              minutes of undivided attention. Nobody would call most of those things world-changing.
              But the world does not always change through one enormous act. Sometimes it changes
              because enough people begin behaving differently toward the human directly in front of
              them.
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 14. Some friction is where humans are built (ink) ---------- */}
      <Band id="some-friction-is-where-humans-are-built">
        <Opener label="Friction" tone="ink" />
        <h2 className="type-h2-caps max-w-3xl">Some friction is where humans are built</h2>
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <p className="type-body-lg text-muted-foreground">
            Much of who we become is shaped by what we repeatedly practise. If you continually hand
            away your thinking because something else can answer faster, you become less practised
            at wrestling with hard questions yourself. Practise being Fully Here and you get better
            at giving attention. Keep your word and trust starts attaching itself to your name.
          </p>
          <div>
            <p className="type-body-lg text-muted-foreground">
              There was a time when physical movement was simply built into everyday life. Modern
              life removed much of it, so we built gyms to deliberately put the reps back in. We
              believe something similar may now be happening to parts of our humanity.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              AI can remember for us, write for us, answer for us and think alongside us. Much of
              that will make life better. But not every kind of friction should disappear. So the
              question is not whether we should use AI. We should. The question is:
            </p>
            <h3 className="type-h3-prose mt-8">
              Is this technology freeing me to become more human, or replacing something in myself I
              still need to practise?
            </h3>
          </div>
        </div>
      </Band>

      {/* ---------- 15. The framework (cream) ---------- */}
      <Band id="the-framework">
        <Opener label="The framework" />
        <h2 className="type-h2-caps max-w-3xl">
          In the New Human Era, more of the advantage shifts toward who you become.
        </h2>

        <ol
          data-framework-chain
          className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-4 border-y border-ink/15 py-8"
        >
          {["Practise Humanity", "Human Reps", "Human Wealth", "Better Life", "Better World"].map(
            (node, i, all) => (
              <li key={node} className="flex items-center gap-4">
                <span className="type-h4-caps">{node}</span>
                {i < all.length - 1 ? (
                  <span aria-hidden className="text-lime-dark">
                    &rarr;
                  </span>
                ) : null}
              </li>
            ),
          )}
        </ol>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <p className="type-body-lg text-ink/70">
            You practise your humanity through small choices. Those choices become Human Reps.
            Repeated reps build Human Wealth. Human Wealth helps you build a richer life. And
            because those reps so often affect another human at the same time, the effect moves
            outward too. A better life for the person practising it. A more human world because they
            did.
          </p>
          <p className="type-body-lg text-ink/70">
            We did not want to build this framework by sitting in a room and deciding what humanity
            should mean for everyone else. We have enough people in the world telling us that their
            philosophy is the philosophy. So we started by listening. Through the Human Archive, we
            have asked more than 200 people one question: what does it mean to be human? We did not
            ask them to confirm our beliefs. We asked them to tell us theirs.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ArchiveQuote entry={ARLINA} />
          <p className="type-body-lg self-center text-ink/70">
            And we listened for what kept appearing: love, family, connection, laughter, being
            present, helping someone, thinking for yourself, being there when another person needs
            you and actually experiencing your life while you still have it. Those answers helped
            shape the principles we believe matter more as technology becomes more capable:
          </p>
        </div>

        <ol data-principles className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_PRINCIPLES.map((p) => (
            <li key={p.n} className="border-t border-ink/15 pt-5">
              <span className="eyebrow text-lime-dark">{p.n}</span>
              <h3 className="type-h4-caps mt-3">{p.title}</h3>
              <p className="type-body mt-2 text-ink/65">{p.body}</p>
            </li>
          ))}
        </ol>

        <p className="type-body-lg mt-14 max-w-3xl text-ink/70">
          They are not commandments. They are not a claim that we discovered the only way to be
          human. They are language for things humanity itself keeps reminding us are worth
          practising. That is what makes the Human Archive so important. It keeps real human voices
          inside the conversation as the world changes. Not one guru telling humanity what it should
          become. Humanity helping shape it.
        </p>
      </Band>

      {/* ---------- 16. What we are actually building (ink) ---------- */}
      <Band id="what-we-are-actually-building">
        <Opener label="What we are actually building" tone="ink" />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {/* A Human Archive still. Rendered at its native 738px cap rather
                than stretched to the column: the source is a video frame, and
                upscaling it would read as a defect where a little softness at
                natural size reads as documentary. */}
            <img
              src={archiveStill}
              alt="A young girl shelters under a rainbow umbrella at a street gathering, looking down at a pin held in an adult's hand."
              width={738}
              height={955}
              loading="lazy"
              className="mb-10 w-full max-w-[460px] rounded-xl object-cover"
            />
            <h2 className="type-h2-prose">
              We are not here to add more to your life. We are here to develop who you are being.
            </h2>
            <p className="type-body-lg mt-8 text-muted-foreground">
              The goal of the New Human Era is not another philosophy people read, agree with and
              forget. We want to help millions of people understand how to practise their humanity
              deliberately — and understand what it can build in their own lives and in the lives
              around them.
            </p>
          </div>
          <div>
            <p className="type-body-lg text-muted-foreground">
              Imagine a world where more people begin asking themselves: what is my Human Rep today?
              For one person, that rep might be as simple as asking: how can I make one
              person&rsquo;s life a little better today?
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              Now imagine that becoming normal in homes, companies, schools and communities. A
              parent puts the phone down. A leader listens before reacting. A child notices somebody
              standing alone and brings them in. A friend makes the call. A person thinks through
              the question before handing it away. Individually, these moments look small. Together,
              they begin to shape culture.
            </p>
            <p className="type-body-lg mt-6 text-muted-foreground">
              One person practises differently. Another human experiences the difference. Enough
              changed experiences shape relationships. Relationships shape families, teams, schools
              and communities. Eventually, what people repeatedly experience begins changing what a
              culture considers normal.
            </p>
            <h3 className="type-h3-condensed mt-8">That is how humanity compounds.</h3>
            <p className="type-body-lg mt-6 text-muted-foreground">
              That is the scale of the ambition. Not millions of people following one philosophy.
              Millions of people learning how to practise their humanity in a world becoming more
              artificial.
            </p>
          </div>
        </div>
      </Band>

      {/* ---------- 17. The invitation (cream) ---------- */}
      <Band id="the-invitation">
        <Opener label="The invitation" />
        <h2 className="type-h2-caps max-w-3xl">
          There are no perfect humans here. There are only humans practising.
        </h2>
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
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
            <p className="type-h4-condensed mt-8">
              We are the Bridge Generation. We inherited one world, and together we are helping
              build the next one.
            </p>
            <p className="type-body-lg mt-6 text-ink/70">
              The question is not whether technology will keep advancing. It will. The question is
              whether we will advance our humanity with it.
            </p>
          </div>
        </div>

        <DividerDot />

        <div className="mx-auto max-w-3xl text-center">
          <p className="type-body-lg text-ink/70">
            Start where you are. Start with the human directly in front of you. Ask yourself one
            question:
          </p>
          <h3 className="type-h1-prose mt-8">What&rsquo;s my Human Rep today?</h3>
          <p className="type-body-lg mt-8 text-ink/70">
            Then do it. That is how this starts. One rep. One human. One life made a little better.
            And eventually, millions.
          </p>
          <p className="type-h2-caps mt-10">Welcome to the New Human Era.</p>
        </div>
      </Band>
    </Bands>
  );
}
