import { createFileRoute, Link } from "@tanstack/react-router";

import manifestoImage from "@/assets/manifesto.jpg";
import archiveArlina from "@/assets/archive-arlina.png";
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
 * ── One typography system, top to bottom (Maya, 2026-08-20) ────────────────
 *
 * The previous pass reached for a different register in almost every section:
 * Oswald 700 caps for TIME and the close, Oswald 300 condensed for the story
 * and the four pieces, Work Sans light for the two questions. Read end to end
 * it looked like several pages stitched together.
 *
 * So this page now uses exactly THREE treatments, and nothing else:
 *
 *   · `type-h1-prose` / `type-h2-prose` / `type-h3-prose` — Work Sans 200/300,
 *     the hero's own voice. Every large philosophical statement is a size step
 *     of the hero, never a different face.
 *   · `type-body` / `type-body-lg` / `type-body-sm` — paragraphs, always.
 *   · `type-label-caps` + `type-eyebrow-rule` — the section kicker, always.
 *
 * Difference between sections comes from scale, whitespace, cream vs ink, and
 * where the photograph sits. Deliberately absent: the `-caps` poster register,
 * the `-condensed` register, cards, icons, and any grid of boxes.
 *
 * Copy is her document, complete, and `src/lib/copy-fidelity.test.ts` holds
 * this file to `docs/source/why-we-exist.txt` sentence by sentence. Paragraphs
 * may be re-laid-out here; they may not be reworded.
 */
function WhyWeExist() {
  return (
    <>
      {/* ══════ 01 — HERO (cream) ══════ */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28 lg:py-40">
          <SectionLabel tone="dark">Why we exist</SectionLabel>
          <h1 className="type-h1-prose mt-10 max-w-[16ch] text-ink">
            Being human is what we're born with. Humanity is what we{" "}
            <span className="text-lime-dark">practice</span>.
          </h1>
          <p className="type-body mt-12 max-w-[46ch] text-ink/70">
            As technology becomes more powerful, humanity has to become more intentional. We exist
            to help people and organizations become more capable with AI while becoming more
            deliberate about their humanity.
          </p>
          {/* Cream measures `--lime` at 1.26:1, so the signature uses the same
              118° hue at the lightness the cream side is designed for. */}
          <p className="font-hand mt-12 text-3xl text-lime-dark">Stay Human.</p>
        </div>
      </section>

      {/* ══════ 02 — THE HUMAN STORY (cream) ══════
          One portrait, one column of text. No collage, no staggered rail. */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <SectionLabel tone="dark">The human story</SectionLabel>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="max-w-[52ch]">
              <h2 className="type-h2-prose text-ink">
                There's a moment from The Human Archive we haven't stopped thinking about.
              </h2>
              <p className="type-body mt-8 text-ink/70">
                Actually, it's not one moment. It's a pattern. We started asking people one
                question:
              </p>
              <p className="type-h3-prose mt-8 text-ink">What does it mean to be human?</p>
              <p className="type-body mt-8 text-ink/70">
                Almost nobody talks about their job title, how productive they've been, or what
                they've built.
              </p>
              <p className="type-body mt-6 text-ink/70">
                They talk about feeling things. Laughing. Crying. Showing up for someone when it was
                hard. Being kind when it would've been easier not to be.
              </p>
            </div>

            <figure className="self-start">
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

          {/* Lindsay, quiet: a rule, a sentence, a name. */}
          <figure className="mt-16 max-w-[46ch] border-t border-hairline-dark pt-10 lg:mt-20">
            <blockquote className="type-h3-prose text-ink">
              &ldquo;To love one another. Treat each other, and yourself, with respect and
              compassion.&rdquo;
            </blockquote>
            <figcaption className="type-body-sm mt-6 text-ink/55">
              &mdash; Lindsay, Vancouver
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ══════ 03 — THE QUESTION UNDERNEATH IT ALL (ink) ══════
          Typography only. The first of four ink moments on the page. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36">
          <SectionLabel tone="light">The question underneath it all</SectionLabel>
          <h2 className="type-h1-prose mt-12 max-w-[18ch] lg:mt-16">
            What kind of humans are these systems actually helping us become?
          </h2>
          <div className="mt-14 max-w-[52ch] lg:mt-20">
            <p className="type-body text-muted-foreground">
              It isn't really a story about technology.
            </p>
            <p className="type-body mt-6 text-muted-foreground">
              It's a story about attention. About time. About the people we love getting whatever's
              left of us after the day has already taken everything else.
            </p>
            <p className="type-body mt-6 text-muted-foreground">
              We think that's our generation's story. And it started long before artificial
              intelligence arrived.
            </p>
            <p className="type-body mt-6 text-muted-foreground">
              For generations, we've gotten remarkably good at building the world around us &mdash;
              businesses, economies, systems capable of extraordinary things. But somewhere in that
              process, a lot of us stopped asking the simpler question underneath it.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 04 — THE OPPORTUNITY / TIME (cream) ══════ */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <SectionLabel tone="dark">The opportunity</SectionLabel>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            <div className="max-w-[46ch] self-center">
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
              <p className="type-h1-prose mt-12 text-lime-dark">Time.</p>
            </div>

            <img
              src={manifestoImage}
              alt="Four friends talking together on a rooftop as the sun sets behind the city"
              loading="lazy"
              width={1408}
              height={912}
              className="aspect-[4/3] w-full self-center object-cover"
            />
          </div>

          {/* Three lines, divided rather than boxed. */}
          <div className="mt-16 grid border-t border-hairline-dark lg:mt-20 lg:grid-cols-3">
            <p className="type-h4-prose border-b border-hairline-dark py-6 pr-8 text-ink lg:border-b-0 lg:border-r">
              Time to be present with the people we love.
            </p>
            <p className="type-h4-prose border-b border-hairline-dark py-6 pr-8 text-ink lg:border-b-0 lg:border-r lg:pl-8">
              Time to think instead of react.
            </p>
            <p className="type-h4-prose py-6 text-ink lg:pl-8">
              Time to actually experience the life we've spent so long building.
            </p>
          </div>

          <p className="type-body mt-10 text-ink/70">
            We believe that future is worth building toward.
          </p>
        </div>
      </section>

      {/* ══════ 05 — THE REAL QUESTION (ink) ══════
          The turning point: the largest statement on the page after the hero. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36">
          <SectionLabel tone="light">The real question</SectionLabel>

          <p className="type-body mt-12 max-w-[52ch] text-muted-foreground">
            But every leap this size asks something of us in return. The question was never really
            whether AI becomes more intelligent. It will. The real question, the one that actually
            matters, is who we become because of it.
          </p>

          <h2 className="type-h1-prose mt-14 max-w-[16ch] lg:mt-20">
            Being human isn't something you're born finished with.
          </h2>
        </div>
      </section>

      {/* ══════ 06 — HUMAN REPS + HUMAN WEALTH (cream) ══════ */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <SectionLabel tone="dark">What we practice</SectionLabel>

          <h2 className="type-h2-prose mt-12 max-w-[20ch] text-ink">
            You're born human. Humanity is what you{" "}
            <span className="text-lime-dark">practice</span>.
          </h2>

          <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-20">
            <p className="type-body max-w-[52ch] text-ink/70">
              You practice it in the conversations you choose to have instead of scrolling past. In
              the promises you keep when breaking them would be easier. In the moments you think for
              yourself instead of letting something else think for you. In choosing to be fully
              present with the person in front of you when distraction would cost you nothing.
            </p>
            <p className="type-body max-w-[52ch] text-ink/70">
              We call those moments Human Reps. Small, conscious choices where you interrupt the
              automatic pattern and decide how you want to show up. None of them look like much by
              themselves. But they compound into trust with your name attached, into relationships
              strong enough to carry real life, into leaders people actually believe, into families
              that feel closer instead of more distant, into organizations that become more human
              because the people inside them chose to practice being human.
            </p>
          </div>

          {/* What the reps compound into: a quiet line of words, not a framework. */}
          <ul className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline-dark pt-8 lg:mt-20 lg:gap-x-10">
            {COMPOUNDS.map((item, i) => (
              <li key={item} className="flex items-center gap-6 lg:gap-10">
                {i > 0 ? (
                  <span aria-hidden className="h-4 w-px bg-hairline-dark" />
                ) : null}
                <span className="type-label-caps text-ink/70">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-16 max-w-[56ch] lg:mt-24">
            <p className="type-body-lg text-ink/55">We call that</p>
            <h3 className="type-h1-prose mt-3 text-ink">
              Human <span className="text-lime-dark">Wealth</span>.
            </h3>
            <p className="type-body mt-8 max-w-[52ch] text-ink/70">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity. Not because we say it does. Because it's true every single time it
              happens &mdash; one conversation. One promise kept &mdash; one moment of real presence
              instead of performance.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 07 — GENERATIONS, NOT QUARTERS (ink) ══════ */}
      <section className="section-ink">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20 lg:py-28">
          <div className="max-w-[52ch]">
            <SectionLabel tone="light">Generations, not quarters</SectionLabel>
            {/* Her document uses a different adjective here than the site does.
                That wording is one of the superseded variants `layering.test.ts`
                bans by name, so this reads "Indigenous-led" — the canonical
                voice, matching `INDIGENOUS_LINE` in brand.ts. Flagged to Maya
                rather than changed silently. */}
            <h2 className="type-h2-prose mt-10 max-w-[20ch]">
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

          <img
            src={founderConversations}
            alt="Shane in conversation with a group of people, listening rather than presenting"
            loading="lazy"
            width={1200}
            height={900}
            className="aspect-[5/4] w-full object-cover"
          />
        </div>
      </section>

      {/* ══════ 08 — HUMAN INFRASTRUCTURE (cream) ══════ */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <SectionLabel tone="dark">The infrastructure</SectionLabel>

          <p className="type-body mt-12 max-w-[52ch] text-ink/70">
            That's why we created The Be Human Company. Not simply to help organizations adopt AI.
            Not to launch another movement with a hashtag attached.
          </p>

          <h2 className="type-h1-prose mt-10 max-w-[20ch] text-ink">
            We're building the human infrastructure for the age of artificial intelligence.
          </h2>

          <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <ul className="border-t border-hairline-dark">
              {INFRASTRUCTURE_PARTS.map((part) => (
                <li key={part} className="border-b border-hairline-dark py-4">
                  <p className="type-h4-prose text-ink">{part}</p>
                </li>
              ))}
            </ul>

            <p className="type-body max-w-[52ch] self-center text-ink/70">
              The ideas. The frameworks. The practices. The research. The conversations. The
              stories. The tools that help people and organizations strengthen the human qualities
              that become more valuable, not less, as technology becomes more capable.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 09 — FOUR CONNECTED PIECES (cream) ══════
          Two-column editorial layout: intro on the left, four linked rows on
          the right, separated by quiet hairlines. */}
      <section className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[35%_1fr] lg:gap-16">
            <div className="max-w-[36ch]">
              <SectionLabel tone="dark">How it comes to life</SectionLabel>
              <h2 className="type-h2-prose mt-10 text-ink">
                Four parts.
                <br />
                One mission.
              </h2>
              <p className="type-body mt-6 text-ink/70">
                Everything we do is connected by one belief: humanity is our greatest advantage.
              </p>
            </div>

            <ul>
              {INFRASTRUCTURE.map((piece, i) => (
                <li key={piece.to} className="border-t border-hairline-dark first:border-t-0">
                  <Link
                    to={piece.to}
                    className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-7 lg:gap-10 lg:py-8"
                  >
                    <span className="type-h3-prose w-8 text-ink/25 lg:w-12">0{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="type-h4-prose text-ink transition-colors group-hover:text-lime-dark">
                        {piece.name}
                      </h3>
                      <p className="type-body-sm mt-1 max-w-[52ch] text-ink/60">{piece.body}</p>
                    </div>
                    <span
                      aria-hidden
                      className="type-body-sm text-ink/40 transition-transform group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="type-body mt-12 max-w-[62ch] text-ink/70 lg:mt-16">
            This is just the beginning. The infrastructure keeps growing, through education,
            research, media, community, and whatever this transition ends up asking of us next,
            because it isn't finished asking yet.
          </p>
        </div>
      </section>

      {/* ══════ 10 — THE PLAN (ink) ══════
          Calm, centered manifesto close. Everything on one vertical axis. */}
      <section className="section-ink">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center px-5 py-24 text-center sm:px-8 lg:py-40">
          <SectionLabel tone="light">The plan</SectionLabel>

          <p className="type-body mt-14 max-w-[52ch] text-muted-foreground lg:mt-18">
            We're not building this because we're afraid of artificial intelligence.
          </p>
          <p className="type-body mt-5 max-w-[52ch] text-muted-foreground">
            We're building it because we've seen what's possible if humanity leads this well, and
            what's at risk if it doesn't.
          </p>

          <h2 className="type-h1-prose mt-18 max-w-[18ch] lg:mt-24">
            Technology will keep advancing whether we're ready or not.
          </h2>

          <p className="type-h1-prose mt-8 max-w-[16ch] text-lime lg:mt-10">
            Humanity has to advance with it.
          </p>

          <p className="type-body mt-16 max-w-[46ch] text-foreground/80 lg:mt-20">
            One Human Rep won't change the world. Millions of them will.
          </p>

          <p className="type-h3-prose mt-10 max-w-[36ch] lg:mt-12">
            That's not a hope. <span className="text-lime">That's the plan.</span>
          </p>
        </div>
      </section>
    </>
  );
}

/**
 * The one section-kicker treatment used everywhere on this page: uppercase
 * label above a short lime rule. Extracted so no section can drift into its own
 * variant — the drift this redesign exists to remove.
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

/**
 * What Human Reps compound into — read straight off the paragraph above them,
 * so the row is a restatement of her sentence and not new brand language.
 */
const COMPOUNDS = ["Trust", "Relationships", "Leadership", "Families", "Organizations"] as const;

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
