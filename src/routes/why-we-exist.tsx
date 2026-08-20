import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Lightbulb, Users } from "lucide-react";

import manifestoImage from "@/assets/manifesto.jpg";
import humanStoryPortrait from "@/assets/human-story-portrait.webp";

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
 * `/why-we-exist` — one continuous editorial story (Maya, 2026-08-20 refactor).
 *
 * The page now opens on The Human Story; the old poster hero, the "Stay Human."
 * standalone, and every image but two are gone. Two photographs only: the
 * portrait beside The Human Story, the sunset group beside The Opportunity —
 * same column split, same treatment, so the page reads as one grid rather than
 * nine layouts.
 *
 * Lime is an accent, never a headline: `SectionLabel` (uppercase label + thin
 * rule) is the only lime on the page. Headlines are ink on cream and foreground
 * on ink, at two disciplined sizes — `type-h2-prose` for a section's statement,
 * `type-h3-prose` for anything subordinate to it.
 *
 * Copy is her document, complete, and `src/lib/copy-fidelity.test.ts` holds this
 * file to `docs/source/why-we-exist.txt` sentence by sentence. Paragraphs may be
 * re-laid-out here; they may not be reworded.
 */
function WhyWeExist() {
  return (
    <>
      {/* ══════ 01 — THE HUMAN STORY (cream) ══════ */}
      <section className="section-cream">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <div className="max-w-[52ch]">
              <SectionLabel tone="dark">The human story</SectionLabel>

              <h1 className="type-h2-prose mt-10 text-ink">
                There's a moment from The Human Archive we haven't stopped thinking about.
              </h1>

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

              {/* Quiet pull quote — no rule above it, no isolated block. */}
              <figure className="mt-10 max-w-[44ch]">
                <blockquote className="type-body-lg text-ink/85">
                  &ldquo;To love one another. Treat each other, and yourself, with respect and
                  compassion.&rdquo;
                </blockquote>
                <figcaption className="type-body-sm mt-4 text-ink/55">
                  &mdash; Lindsay, Vancouver
                </figcaption>
              </figure>
            </div>

            <img
              src={humanStoryPortrait}
              alt="A woman in a blue cap smiling as she holds up a small Be Human token"
              loading="lazy"
              width={1000}
              height={1752}
              className="aspect-4/5 w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ══════ 02 — THE QUESTION UNDERNEATH IT ALL (ink) ══════ */}
      <section className="section-ink">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <SectionLabel tone="light">The question underneath it all</SectionLabel>
          <h2 className="type-h2-prose mt-10 max-w-[20ch]">
            What kind of humans are these systems actually helping us become?
          </h2>
          <div className="mt-10 max-w-[52ch]">
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

      {/* ══════ 03 — THE OPPORTUNITY (cream) ══════
          Same split, same rhythm as The Human Story. */}
      <section className="section-cream">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <div className="max-w-[52ch]">
              <SectionLabel tone="dark">The opportunity</SectionLabel>
              <h2 className="type-h3-prose mt-10 text-ink">Time.</h2>
              <p className="type-body mt-8 text-ink/70">
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

            <img
              src={manifestoImage}
              alt="Four friends talking together on a rooftop as the sun sets behind the city"
              loading="lazy"
              width={1408}
              height={912}
              className="aspect-4/5 w-full object-cover"
            />
          </div>

          {/* Three clean text blocks. No rules, no separators, no cards. */}
          <div className="mt-14 grid gap-8 lg:mt-16 lg:grid-cols-3 lg:gap-12">
            {TIME_LINES.map((line) => (
              <p key={line} className="type-h4-prose max-w-[26ch] text-ink">
                {line}
              </p>
            ))}
          </div>

          <p className="type-body mt-12 max-w-[52ch] text-ink/70">
            We believe that future is worth building toward.
          </p>
        </div>
      </section>

      {/* ══════ 04 — THE REAL QUESTION (ink) ══════ */}
      <section className="section-ink">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <SectionLabel tone="light">The real question</SectionLabel>

          <h2 className="type-h2-prose mt-10 max-w-[18ch]">
            Being human isn't something you're born finished with.
          </h2>

          <p className="type-body mt-10 max-w-[52ch] text-muted-foreground">
            But every leap this size asks something of us in return. The question was never really
            whether AI becomes more intelligent. It will. The real question, the one that actually
            matters, is who we become because of it.
          </p>
        </div>
      </section>

      {/* ══════ 05 — WHAT WE PRACTICE (cream) ══════ */}
      <section className="section-cream">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <SectionLabel tone="dark">What we practice</SectionLabel>

          <h2 className="type-h2-prose mt-10 max-w-[20ch] text-ink">
            You're born human. Humanity is what you practice.
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
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

          {/* Quiet category markers: one row on desktop, a neat stack on mobile. */}
          <ul className="mt-12 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-14">
            {COMPOUNDS.map((item) => (
              <li key={item} className="type-label-caps text-ink/55">
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-14 max-w-[56ch]">
            <h3 className="type-h3-prose text-ink">We call that Human Wealth.</h3>
            <p className="type-body mt-6 max-w-[52ch] text-ink/70">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity. Not because we say it does. Because it's true every single time it
              happens &mdash; one conversation. One promise kept &mdash; one moment of real presence
              instead of performance.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 06 — GENERATIONS, NOT QUARTERS (ink) ══════ Text only. */}
      <section className="section-ink">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <SectionLabel tone="light">Generations, not quarters</SectionLabel>
          {/* Her document uses a superseded variant of this line; the page reads
              "Indigenous-led" — the canonical voice. Flagged to Maya. */}
          <h2 className="type-h2-prose mt-10 max-w-[22ch]">
            The decisions we make today are inherited by the people who come after us.
          </h2>
          <p className="type-body mt-10 max-w-[52ch] text-muted-foreground">
            That belief didn't start with AI, either. It's older than that. As an Indigenous-led
            company, we grew up understanding something the rest of the world is only now circling
            back to: the decisions we make today are inherited by the people who come after us.
            That's not a metaphor we borrowed for a pitch deck. It's the actual starting point this
            company was built from, and it's why we think about this transition in generations, not
            quarters.
          </p>
        </div>
      </section>

      {/* ══════ 07 — THE INFRASTRUCTURE (cream) ══════ */}
      <section className="section-cream">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <SectionLabel tone="dark">The infrastructure</SectionLabel>

          <h2 className="type-h2-prose mt-10 max-w-[22ch] text-ink">
            We're building the human infrastructure for the age of artificial intelligence.
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
            <p className="type-body max-w-[52ch] text-ink/70">
              That's why we created The Be Human Company. Not simply to help organizations adopt AI.
              Not to launch another movement with a hashtag attached.
            </p>
            <p className="type-body max-w-[52ch] text-ink/70">
              The ideas. The frameworks. The practices. The research. The conversations. The
              stories. The tools that help people and organizations strengthen the human qualities
              that become more valuable, not less, as technology becomes more capable.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ 08 — HOW IT COMES TO LIFE (cream) ══════ */}
      <section className="section-cream">
        <div className={`${SHELL} pb-16 lg:pb-24`}>
          <div className="grid gap-12 lg:grid-cols-[34%_1fr] lg:gap-16">
            <div className="max-w-[34ch]">
              <SectionLabel tone="dark">How it comes to life</SectionLabel>
              <h2 className="type-h3-prose mt-10 text-ink">Four parts. One mission.</h2>
              <p className="type-body mt-6 text-ink/70">
                Everything we do is connected by one belief: humanity is our greatest advantage.
              </p>
            </div>

            <ul className="grid gap-10">
              {INFRASTRUCTURE.map((piece) => (
                <li key={piece.to}>
                  <Link to={piece.to} className="group block max-w-[56ch]">
                    <h3 className="type-h4-prose text-ink transition-opacity group-hover:opacity-60">
                      {piece.name}
                      <span aria-hidden className="type-body-sm ml-3 text-ink/40">
                        &rarr;
                      </span>
                    </h3>
                    <p className="type-body-sm mt-2 text-ink/60">{piece.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="type-body mt-12 max-w-[56ch] text-ink/70">
            This is just the beginning. The infrastructure keeps growing, through education,
            research, media, community, and whatever this transition ends up asking of us next,
            because it isn't finished asking yet.
          </p>
        </div>
      </section>

      {/* ══════ 09 — THE PLAN (ink) ══════ */}
      <section className="section-ink">
        <div className={`${SHELL} py-16 lg:py-24`}>
          <div className="max-w-[56ch]">
            <SectionLabel tone="light">The plan</SectionLabel>

            <h2 className="type-h2-prose mt-10 max-w-[20ch]">
              Technology will keep advancing whether we're ready or not. Humanity has to advance
              with it.
            </h2>

            <p className="type-body mt-10 text-muted-foreground">
              We're not building this because we're afraid of artificial intelligence.
            </p>
            <p className="type-body mt-5 text-muted-foreground">
              We're building it because we've seen what's possible if humanity leads this well, and
              what's at risk if it doesn't.
            </p>
            <p className="type-body mt-5 text-muted-foreground">
              One Human Rep won't change the world. Millions of them will.
            </p>

            <p className="type-h3-prose mt-10 text-foreground">
              That's not a hope. That's the plan.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/** One content shell for every section, so the page reads on a single grid. */
const SHELL = "mx-auto max-w-[1180px] px-5 sm:px-8";

/**
 * The one section-kicker treatment on this page: uppercase label above a short
 * lime rule. The only lime on the page, by design.
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

/** The three Time lines, exactly as her screens trim them. */
const TIME_LINES = [
  "Time to be present with the people we love.",
  "Time to think instead of react.",
  "Time to actually experience the life we've spent so long building.",
] as const;

/** What Human Reps compound into — read straight off the paragraph above them. */
const COMPOUNDS = ["Trust", "Relationships", "Leadership", "Families", "Organizations"] as const;

/**
 * The four pieces, in the order Maya's document names them.
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
