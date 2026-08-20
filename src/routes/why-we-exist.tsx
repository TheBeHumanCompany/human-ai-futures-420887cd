import { createFileRoute, Link } from "@tanstack/react-router";

import manifestoImage from "@/assets/manifesto.jpg";
import archiveAdewolf from "@/assets/archive-adewolf.png";
import archiveArlina from "@/assets/archive-arlina.png";
import archiveBella from "@/assets/archive-bella.png";
import founderConversations from "@/assets/founder-conversations.webp";

export const Route = createFileRoute("/why-we-exist")({
  head: () => ({
    meta: [
      { title: "Why We Exist — The Be Human Company" },
      {
        name: "description",
        content:
          "As technology becomes more powerful, humanity has to become more intentional. Why this company exists, and what it is for.",
      },
      { property: "og:title", content: "Why We Exist — The Be Human Company" },
      {
        property: "og:description",
        content: "Being human is what we're born with. Humanity is what we practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhyWeExist,
});

/**
 * `/why-we-exist` — the mission half of the About menu.
 *
 * "About" is a label in the nav, not a page: its two destinations are this
 * one and `/who-we-are`. This page argues *why*; that one introduces *who*.
 *
 * The page is a SCROLLED STORY rather than a stack of text blocks (Maya,
 * 2026-08-20), moving hero → the Human Archive pattern → the question
 * underneath → the opportunity (Time) → the real question → Human Reps and
 * Human Wealth → generations, not quarters → the infrastructure → the four
 * connected pieces → the close.
 *
 * Copy is her document, complete, and `src/lib/copy-fidelity.test.ts` holds
 * this file to `docs/source/why-we-exist.txt` sentence by sentence — the few
 * places the page and the document differ are named there with a reason, and
 * nowhere else. So paragraphs may be RESHAPED into statements here; they may
 * not be reworded.
 *
 * Every visual decision is borrowed rather than invented: cream/ink section
 * alternation and the eyebrow + lime rule from the homepage, oversized
 * statement lines from `/the-new-human-era`, documentary photography and the
 * bordered editorial rows from `/who-we-are` and `/about-the-founder`. No card
 * system, no new tokens.
 */
function WhyWeExist() {
  return (
    <>
      {/* ══════ 01 — HERO (cream) — preserved direction, spacing refined ══════ */}
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:py-32">
          <p className="type-label-caps text-ink/50">Why we exist</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-prose mt-8 max-w-4xl text-ink sm:mt-10">
            Being human is what we're born with. Humanity is what we{" "}
            <span className="text-lime-dark">practice</span>.
          </h1>
          <p className="type-body-lg mt-8 max-w-xl text-ink/70 sm:mt-10">
            As technology becomes more powerful, humanity has to become more intentional. We exist
            to help people and organizations become more capable with AI while becoming more
            deliberate about their humanity.
          </p>
          {/* Maya asked for the signature in brand lime. This band is cream, where
              `--lime` measures 1.26:1 — `text-lime-dark` is the same 118° hue at
              the lightness the cream side is designed for. Chromium paints it
              rgb(127,146,0) on rgb(244,240,230) = 3.07:1, which clears AA for
              text at this size. */}
          <p className="font-hand mt-12 text-3xl text-lime-dark">Stay Human.</p>
        </div>
      </section>

      {/* ══════ 02 — THE HUMAN STORY (ink) ══════
          Documentary portraits from the Archive, offset rather than gridded, so
          the section reads as a pattern of people and not a gallery of cards. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-lime">The human story</p>
          <span className="type-eyebrow-rule block" aria-hidden />

          <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            <div className="max-w-[58ch]">
              <h2 className="type-h2-condensed">
                There's a moment from The Human Archive we haven't stopped thinking about.
              </h2>
              <p className="type-body mt-8 text-muted-foreground">
                Actually, it's not one moment. It's a pattern.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                We started asking people one question:
              </p>

              <p className="type-h3-condensed mt-10 text-foreground">
                What does it mean to be human?
              </p>

              <p className="type-body mt-10 text-muted-foreground">
                Almost nobody talks about their job title, how productive they've been, or what
                they've built.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                They talk about feeling things. Laughing. Crying. Showing up for someone when it was
                hard. Being kind when it would've been easier not to be.
              </p>
            </div>

            {/* Two portraits, one dropped, the way the Archive rail staggers them. */}
            <div className="grid grid-cols-2 gap-4 self-start sm:gap-6">
              <figure className="overflow-hidden">
                <img
                  src={archiveAdewolf}
                  alt="Adewolf, photographed on the street in Vancouver for The Human Archive"
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="aspect-4/5 w-full object-cover"
                />
              </figure>
              <figure className="mt-10 overflow-hidden sm:mt-16">
                <img
                  src={archiveArlina}
                  alt="Arlina, photographed in Chitré, Panama for The Human Archive"
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="aspect-4/5 w-full object-cover"
                />
              </figure>
            </div>
          </div>

          {/* Lindsay, given the room a spoken answer deserves. */}
          <figure className="mt-16 grid gap-10 border-t border-border pt-12 lg:mt-24 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <img
              src={archiveBella}
              alt="Bella, photographed in Vancouver for The Human Archive"
              loading="lazy"
              width={800}
              height={1000}
              className="aspect-4/5 w-full max-w-xs object-cover"
            />
            <div className="self-center">
              <blockquote className="type-h2-condensed max-w-[24ch]">
                &ldquo;To love one another. Treat each other, and yourself, with respect and
                compassion.&rdquo;
              </blockquote>
              <figcaption className="eyebrow mt-8 text-muted-foreground">
                &mdash; Lindsay, Vancouver
              </figcaption>
            </div>
          </figure>
        </div>
      </section>

      {/* ══════ 03 — THE QUESTION UNDERNEATH IT ALL (ink) ══════ */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
            <div className="max-w-[52ch]">
              <p className="type-body text-muted-foreground">
                It isn't really a story about technology.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                It's a story about attention. About time. About the people we love getting
                whatever's left of us after the day has already taken everything else.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                We think that's our generation's story. And it started long before artificial
                intelligence arrived.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                For generations, we've gotten remarkably good at building the world around us
                &mdash; businesses, economies, systems capable of extraordinary things. But
                somewhere in that process, a lot of us stopped asking the simpler question
                underneath it.
              </p>
            </div>

            <h2 className="type-h1-prose self-center text-foreground">
              What kind of humans are these systems actually helping us become?
            </h2>
          </div>
        </div>
      </section>

      {/* ══════ 04 — THE OPPORTUNITY (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">The opportunity</p>
          <span className="type-eyebrow-rule block" aria-hidden />

          <div className="mt-12 max-w-[58ch]">
            <p className="type-body text-ink/70">
              Now we're in the middle of one of the biggest transitions in human history. For the
              first time, we're building technology that can think alongside us, create alongside
              us, and increasingly make decisions that used to belong only to people.
            </p>
            <p className="type-body mt-6 text-ink/70">
              The opportunity in that is real. AI will cure diseases, remove decades of repetitive
              work, unlock discoveries we haven't imagined yet, and give millions of people
              something that's become genuinely rare.
            </p>
          </div>

          <div className="mt-16 grid items-center gap-12 lg:mt-20 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <div>
              <h2 className="type-h1-caps text-lime-dark">Time</h2>
              <div className="mt-8 max-w-md border-t border-hairline-dark pt-8">
                <p className="type-h4-condensed text-ink">Time to be present with the people we love.</p>
                <p className="type-h4-condensed mt-4 text-ink">Time to think instead of react.</p>
                <p className="type-h4-condensed mt-4 text-ink">
                  Time to actually experience the life we've spent so long building.
                </p>
              </div>
              <p className="type-body mt-10 text-ink/70">
                We believe that future is worth building toward.
              </p>
            </div>

            <img
              src={manifestoImage}
              alt="Four friends talking together on a rooftop as the sun sets behind the city"
              loading="lazy"
              width={1408}
              height={912}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ══════ 05 — THE REAL QUESTION (ink) ══════
          The turning point, so it is a page-width statement and almost nothing else. */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36">
          <p className="type-label-caps text-lime">The real question</p>
          <span className="type-eyebrow-rule block" aria-hidden />

          <p className="type-body mt-14 max-w-[52ch] text-muted-foreground">
            But every leap this size asks something of us in return. The question was never really
            whether AI becomes more intelligent. It will. The real question, the one that actually
            matters, is who we become because of it.
          </p>

          <h2 className="type-h1-condensed mt-14 max-w-4xl">
            Being human isn't something you're born finished with.
          </h2>
        </div>
      </section>

      {/* ══════ 06 — HUMAN REPS + HUMAN WEALTH (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="type-h1-caps max-w-4xl text-ink">
            You're born human. Humanity is what you <span className="text-lime-dark">practice</span>
            .
          </h2>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <p className="type-body max-w-[58ch] text-ink/70">
              You practice it in the conversations you choose to have instead of scrolling past. In
              the promises you keep when breaking them would be easier. In the moments you think for
              yourself instead of letting something else think for you. In choosing to be fully
              present with the person in front of you when distraction would cost you nothing.
            </p>
            <p className="type-body max-w-[58ch] text-ink/70">
              We call those moments Human Reps. Small, conscious choices where you interrupt the
              automatic pattern and decide how you want to show up. None of them look like much by
              themselves. But they compound into trust with your name attached, into relationships
              strong enough to carry real life, into leaders people actually believe, into families
              that feel closer instead of more distant, into organizations that become more human
              because the people inside them chose to practice being human.
            </p>
          </div>

          {/* What the reps compound into, as a line of plain words with rules
              between them — the /who-we-are divider language, not four boxes. */}
          <ul className="mt-16 grid border-t border-hairline-dark sm:grid-cols-2 lg:mt-20 lg:grid-cols-5">
            {COMPOUNDS.map((item) => (
              <li
                key={item}
                className="border-b border-hairline-dark py-6 pr-6 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:py-8 sm:pl-6 sm:first:pl-0"
              >
                <p className="type-h4-caps text-ink">{item}</p>
              </li>
            ))}
          </ul>

          <div className="mt-16 max-w-3xl border-t border-hairline-dark pt-12 lg:mt-20">
            <h3 className="type-h2-caps text-ink">
              We call that <span className="text-lime-dark">Human Wealth</span>.
            </h3>
            <p className="type-body mt-8 text-ink/70">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity. Not because we say it does. Because it's true every single time it
              happens &mdash; one conversation. One promise kept &mdash; one moment of real presence
              instead of performance.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 07 — GENERATIONS, NOT QUARTERS (ink) ══════
          Photography and narrative in the /who-we-are register: this is a way of
          deciding, not a credential, so it is told rather than badged. */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20 lg:py-28">
          <img
            src={founderConversations}
            alt="Shane in conversation with a group of people, listening rather than presenting"
            loading="lazy"
            width={1200}
            height={900}
            className="aspect-[5/4] w-full object-cover"
          />

          <div className="max-w-[58ch]">
            <p className="type-label-caps text-lime">Generations, not quarters</p>
            <span className="type-eyebrow-rule block" aria-hidden />
            {/* Maya's doc uses a different adjective here than the site does.
                That wording is one of the two superseded variants
                `layering.test.ts` bans by name, so this reads "Indigenous-led" —
                the canonical voice, matching `INDIGENOUS_LINE` in brand.ts.
                Flagged to Maya rather than changed silently. (The banned string
                is deliberately not spelled out in this comment: the same proof
                scans comments, precisely because that is how a retired variant
                gets copied back into live copy.) */}
            <h2 className="type-h2-condensed mt-10 max-w-[22ch]">
              The decisions we make today are inherited by the people who come after us.
            </h2>
            <p className="type-body mt-8 text-muted-foreground">
              That belief didn't start with AI, either. It's older than that. As an Indigenous-led
              company, we grew up understanding something the rest of the world is only now circling
              back to: the decisions we make today are inherited by the people who come after us.
              That's not a metaphor we borrowed for a pitch deck. It's the actual starting point
              this company was built from, and it's why we think about this transition in
              generations, not quarters.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 08 — WHY THE BE HUMAN COMPANY EXISTS (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-[58ch]">
            <p className="type-body text-ink/70">
              That's why we created The Be Human Company. Not simply to help organizations adopt AI.
              Not to launch another movement with a hashtag attached.
            </p>
          </div>

          <h2 className="type-h1-condensed mt-12 max-w-4xl text-ink">
            We're building the human infrastructure for the age of artificial intelligence.
          </h2>

          <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <ul className="grid gap-0 border-t border-hairline-dark sm:grid-cols-2">
              {INFRASTRUCTURE_PARTS.map((part) => (
                <li key={part} className="border-b border-hairline-dark py-5">
                  <p className="type-h3-caps-light text-ink">{part}</p>
                </li>
              ))}
            </ul>

            <p className="type-body max-w-[58ch] self-center text-ink/70">
              The ideas. The frameworks. The practices. The research. The conversations. The
              stories. The tools that help people and organizations strengthen the human qualities
              that become more valuable, not less, as technology becomes more capable.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 09 — FOUR CONNECTED PIECES (ink) ══════

          Each piece is a real destination, so each is a link. That is also the
          honest reason this block is worth building rather than four more
          paragraphs: it is the only place on the site where the four halves of
          the company are named together and reachable in one move. Large
          editorial rows with hairline dividers, not four cards. */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-lime">The infrastructure</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h2 className="type-h2-condensed mt-8 max-w-3xl">
            Right now, that infrastructure is four connected pieces.
          </h2>

          <ul className="mt-14 lg:mt-16">
            {INFRASTRUCTURE.map((piece, i) => (
              <li key={piece.to} className="border-t border-border last:border-b">
                <Link
                  to={piece.to}
                  className="group grid gap-6 py-10 lg:grid-cols-[auto_1fr_1.35fr] lg:items-baseline lg:gap-12 lg:py-12"
                >
                  <span className="eyebrow text-lime">0{i + 1}</span>
                  <h3 className="type-h3-caps-light transition-colors group-hover:text-lime">
                    {piece.name}
                  </h3>
                  <span className="type-body block max-w-[62ch] text-muted-foreground">
                    {piece.body}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="type-body mt-14 max-w-[62ch] text-muted-foreground">
            This is just the beginning. The infrastructure keeps growing, through education,
            research, media, community, and whatever this transition ends up asking of us next,
            because it isn't finished asking yet.
          </p>
        </div>
      </section>

      {/* ══════ 10 — ENDING (cream) ══════ */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36">
          <div className="max-w-[58ch]">
            <p className="type-body text-ink/70">
              We're not building this because we're afraid of artificial intelligence.
            </p>
            <p className="type-body mt-6 text-ink/70">
              We're building it because we've seen what's possible if humanity leads this well, and
              what's at risk if it doesn't.
            </p>
            <p className="type-body mt-6 text-ink/70">
              Technology will keep advancing whether we're ready or not.
            </p>
          </div>

          <h2 className="type-h1-caps mt-14 max-w-4xl text-ink">Humanity has to advance with it.</h2>

          <p className="type-h2-condensed mt-20 max-w-3xl border-t border-hairline-dark pt-14 text-ink">
            One Human Rep won't change the world. Millions of them will.
          </p>
          <p className="type-h2-condensed mt-6 text-lime-dark">
            That's not a hope. That's the plan.
          </p>
        </div>
      </section>
    </>
  );
}

/**
 * What Human Reps compound into — read straight off the paragraph above them,
 * so the row is a restatement of her sentence and not new brand language.
 */
const COMPOUNDS = [
  "Trust",
  "Relationships",
  "Leadership",
  "Families",
  "Organizations",
] as const;

/** The infrastructure, named as she names it. */
const INFRASTRUCTURE_PARTS = [
  "The ideas",
  "The frameworks",
  "The practices",
  "The research",
  "The conversations",
  "The stories",
  "The tools",
] as const;

/**
 * The four pieces, in the order Maya's document names them.
 *
 * A const rather than four hand-written blocks: the bodies are her words and
 * the destinations are the nav's, and keeping them as data is what stops a
 * later edit from quietly rewording one piece and leaving the other three.
 */
const INFRASTRUCTURE = [
  {
    to: "/be-human-ai",
    name: "Be Human AI",
    body: "Be Human AI helps organizations adopt AI through strategy, human readiness, governance, and transformation, keeping a person accountable for every judgment that matters. Hence, the technology strengthens both the business and the people inside it.",
  },
  {
    to: "/the-new-human-era",
    name: "The New Human Era",
    body: "The New Human Era is the worldview underneath it all, a framework for how humanity practices itself deliberately in a world becoming more artificial. It asks people to rethink what success, status, and a life well lived actually mean when execution stops being the scarce thing.",
  },
  {
    to: "/the-human-archive",
    name: "The Human Archive",
    body: "The Human Archive is a living record built around one question we keep asking strangers on camera: what does it mean to be human? Not experts. Not a panel. Just people, telling us the truth. It keeps real human experience at the center of a transition that could easily lose it.",
  },
  {
    to: "/podcast",
    name: "The People-Driven CEO Podcast",
    body: "The People-Driven CEO Podcast is where we sit down with founders and leaders and ask them to say the honest version out loud, the one that doesn't usually make it into a keynote.",
  },
] as const;
