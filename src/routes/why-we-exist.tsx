import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Lightbulb, Users } from "lucide-react";

import manifestoImage from "@/assets/manifesto.jpg";
import humanStoryPortrait from "@/assets/human-story-portrait.webp";
import generationsPortrait from "@/assets/generations-portrait.png.asset.json";

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
 * on ink, at two disciplined sizes — `type-h2-condensed` for a section's statement,
 * `type-h3-condensed` for anything subordinate to it.
 *
 * Copy is her document, complete, and `src/lib/copy-fidelity.test.ts` holds this
 * file to `docs/source/why-we-exist.txt` sentence by sentence. Paragraphs may be
 * re-laid-out here; they may not be reworded.
 */
function WhyWeExist() {
  return (
    <>
      {/* ══════ 01 — HERO (cream) ══════ Type only; the portrait now lives in The Pattern. */}
      <section className="section-cream">
        <div className={`${SHELL} pt-16 pb-16 lg:pt-28 lg:pb-28`}>
          <div className="max-w-[24ch]">
            <p className="type-label-caps text-ink/45">Why we exist</p>

            <h1 className="type-h1-caps-light mt-8 text-ink lg:mt-10">
              There&rsquo;s a moment from The Human Archive we haven&rsquo;t stopped thinking about
            </h1>
          </div>

          <p className="type-body mt-10 max-w-[46ch] text-ink/60 lg:mt-14">
            Actually, it&rsquo;s not one moment. It&rsquo;s a pattern. We started asking people one
            question:
          </p>

          <div className="mt-8 flex items-center gap-5 lg:mt-10">
            <span aria-hidden className="h-[3px] w-9 shrink-0 bg-lime" />
            <p className="type-body-lg font-semibold text-ink">What does it mean to be human?</p>
          </div>
        </div>
      </section>

      {/* ══════ 01b — THE PATTERN (cream) ══════ The story, plus the portrait. */}
      <section className="section-cream border-t border-ink/10">
        <div className={`${SHELL} py-16 lg:py-28`}>
          <p className="type-label-caps text-ink/45">The pattern</p>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-24">
            <p className="type-body-lg max-w-[46ch] text-ink/75">
              Almost nobody talks about their job title, how productive they&rsquo;ve been, or what
              they&rsquo;ve built.
            </p>
            <p className="type-body-lg max-w-[46ch] text-ink/75">
              They talk about feeling things. Laughing. Crying. Showing up for someone when it was
              hard. Being kind when it would&rsquo;ve been easier not to be.
            </p>
          </div>

          <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-center lg:gap-20">
            <figure className="flex max-w-[52ch] items-stretch gap-6">
              <span aria-hidden className="w-[2px] shrink-0 bg-lime" />
              <div>
                <blockquote className="type-h3-prose text-ink">
                  &ldquo;To love one another. Treat each other, and yourself, with respect and
                  compassion.&rdquo;
                </blockquote>
                <figcaption className="type-body mt-6 text-ink/55">
                  &mdash; Lindsay, Vancouver
                </figcaption>
              </div>
            </figure>

            <img
              src={humanStoryPortrait}
              alt="A woman in a blue cap smiling as she holds up a small Be Human token"
              loading="lazy"
              width={1000}
              height={1752}
              className="aspect-4/5 w-full object-cover lg:max-w-[320px]"
            />
          </div>
        </div>
      </section>



      {/* ══════ 02 — THE REAL QUESTION (ink) ══════ Type only, two body columns. */}
      <section className="section-ink">
        <div className={`${SHELL} py-14 lg:py-24`}>
          <SectionLabel tone="light">The real question</SectionLabel>

          <h2 className="type-h2-condensed mt-10 w-full max-w-[16ch] lg:w-[65%] lg:max-w-none">
            What kind of humans are we becoming?
          </h2>

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-20">
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
            </div>
            <div className="max-w-[52ch]">
              <p className="type-body text-muted-foreground">
                For generations, we've gotten remarkably good at building the world around us
                &mdash; businesses, economies, systems capable of extraordinary things. But
                somewhere in that process, a lot of us stopped asking the simpler question
                underneath it.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                Now we're in the middle of one of the biggest transitions in human history. For the
                first time, we're building technology that can think alongside us, create alongside
                us, and increasingly make decisions that used to belong only to people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 03 — THE OPPORTUNITY (cream) ══════
          Same split, same rhythm as The Human Story. */}
      <section className="section-cream">
        <div className={`${SHELL} py-14 lg:py-24`}>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <div className="max-w-[52ch]">
              <SectionLabel tone="dark">The opportunity</SectionLabel>
              <h2 className="type-h1-condensed mt-10 text-ink">Time.</h2>
              <p className="type-body mt-8 text-ink/70">
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

          {/* Three statement rows with icon circles and vertical dividers on desktop. */}
          <div className="mt-14 grid gap-0 lg:mt-16 lg:grid-cols-3">
            {TIME_LINES.map((line, i) => {
              const isFirst = i === 0;
              const isLast = i === TIME_LINES.length - 1;
              const Icon = line.icon;
              return (
                <div
                  key={line.text}
                  className={[
                    "flex items-center gap-5 py-8 lg:py-0",
                    isFirst ? "lg:pr-10" : isLast ? "lg:pl-10" : "lg:px-10",
                    !isLast ? "border-b border-ink/10 lg:border-b-0 lg:border-r" : "",
                  ].join(" ")}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lime/25 text-lime-dark"
                    aria-hidden
                  >
                    <Icon size={22} strokeWidth={1.25} />
                  </span>
                  <p className="type-h4-condensed text-ink">{line.text}</p>
                </div>
              );
            })}
          </div>

          <p className="type-body mx-auto mt-12 max-w-[52ch] text-center font-bold text-ink/70">
            We believe that future is worth building toward.
          </p>
        </div>
      </section>

      {/* ══════ 04 — THE REAL QUESTION (ink) ══════ */}
      <section className="section-ink">
        <div className={`${SHELL} py-14 lg:py-24`}>
          <SectionLabel tone="light">The real question</SectionLabel>

          <h2 className="type-h2-condensed mt-10 max-w-[18ch]">
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
        <div className={`${SHELL} py-14 lg:py-24`}>
          <p className="type-label-caps text-ink/45">What we practice</p>

          <h2 className="type-h2-caps-light mt-8 w-full max-w-[24ch] text-ink lg:mt-10">
            You&rsquo;re born human. Humanity is what you practice
          </h2>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-24">
            <div className="max-w-[52ch] space-y-6">
              <p className="type-body text-ink/70">
                You practice it in the conversations you choose to have instead of scrolling past.
                In the promises you keep when breaking them would be easier.
              </p>
              <p className="type-body text-ink/70">
                In the moments you think for yourself instead of letting something else think for
                you. In choosing to be fully present with the person in front of you when
                distraction would cost you nothing.
              </p>
            </div>
            <div className="max-w-[52ch] space-y-6">
              <p className="type-body text-ink/70">We call those moments Human Reps.</p>
              <p className="type-body text-ink/70">
                Small, conscious choices where you interrupt the automatic pattern and decide how
                you want to show up.
              </p>
              <p className="type-body text-ink/70">None of them looks like much on its own.</p>
              <p className="type-body text-ink/70">
                But they compound into trust with your name attached, into relationships strong
                enough to carry real life, into leaders people actually believe in, into families
                that feel closer instead of more distant, and into organizations that become more
                human because the people inside them chose to practice being human.
              </p>
              <p className="type-body font-semibold text-ink">We call that Human Wealth.</p>
            </div>
          </div>

          <div className="mt-12 max-w-[62ch] space-y-6">
            <p className="type-body text-ink/70">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity.
            </p>
            <p className="type-body text-ink/70">
              Not because we say it does. Because it&rsquo;s true every single time it happens.
            </p>
            <p className="type-body-lg font-semibold text-ink">
              One conversation. One promise kept. One moment of real presence instead of
              performance.
            </p>
          </div>

          {/* The compounding progression, at the foot of the section. */}
          <ul className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-4 lg:mt-14 lg:gap-x-8">
            {COMPOUNDS.map((item, i) => (
              <li key={item} className="flex items-center gap-5 lg:gap-8">
                <span className="type-label-caps text-ink/75">{item}</span>
                {i < COMPOUNDS.length - 1 ? (
                  <span aria-hidden className="type-body-sm text-lime-dark">
                    &rarr;
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* ══════ 06 — GENERATIONS, NOT QUARTERS (ink) ══════ Text left, photo right. */}
      <section className="section-ink">
        <div className={`${SHELL} py-14 lg:py-24`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-center lg:gap-20">
            <div className="max-w-[48ch]">
              <SectionLabel tone="light">Generations, not quarters</SectionLabel>
              {/* Her document uses a superseded variant of this line; the page reads
                  "Indigenous-led" — the canonical voice. Flagged to Maya. */}
              <h2 className="type-h2-condensed mt-10 max-w-[22ch]">
                The decisions we make today are inherited by the people who come after us.
              </h2>
              <p className="type-body mt-10 text-muted-foreground">
                That belief didn't start with AI, either. It's older than that. As an Indigenous-led
                company, we grew up understanding something the rest of the world is only now
                circling back to: the decisions we make today are inherited by the people who come
                after us. That's not a metaphor we borrowed for a pitch deck. It's the actual
                starting point this company was built from, and it's why we think about this
                transition in generations, not quarters.
              </p>
            </div>

            <img
              src={generationsPortrait.url}
              alt="A young girl looking toward the camera, lit against a dark background"
              loading="lazy"
              className="aspect-4/5 w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ══════ 07 — THE INFRASTRUCTURE (cream) ══════ Standalone; ends before 08. */}
      <section className="section-cream">
        <div className={`${SHELL} py-14 lg:py-28`}>
          <SectionLabel tone="dark">The infrastructure</SectionLabel>

          <h2 className="type-h2-condensed mt-10 w-full max-w-[26ch] text-ink lg:w-[70%] lg:max-w-none">
            We're building the human infrastructure for the age of artificial intelligence.
          </h2>

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-20">
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

      {/* ══════ 08 — HOW IT COMES TO LIFE (ink) ══════ Editorial 2×2, no cards. */}
      <section className="section-ink">
        <div className={`${SHELL} py-14 lg:py-28`}>
          <SectionLabel tone="light" rule={false}>
            How it comes to life
          </SectionLabel>

          <h2 className="type-h2-condensed mt-8 max-w-[16ch] lg:mt-10">Four parts. One mission.</h2>

          <p className="type-body mt-8 max-w-[52ch] text-muted-foreground">
            Everything we do is connected by one belief: humanity is our greatest advantage.
          </p>

          <ul className="mt-14 grid gap-0 lg:mt-20 lg:grid-cols-2 lg:gap-x-20">
            {INFRASTRUCTURE.map((piece, i) => (
              <li
                key={piece.to}
                className="border-t border-foreground/10 py-8 first:border-t-0 first:pt-0 lg:border-t lg:py-10 lg:nth-[-n+2]:border-t-0 lg:nth-[-n+2]:pt-0"
              >
                <Link to={piece.to} className="group block">
                  <div className="flex items-baseline gap-5">
                    <span aria-hidden className="type-h4-condensed text-lime">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="type-h4-condensed text-foreground transition-opacity group-hover:opacity-60">
                      {piece.name}
                      <span aria-hidden className="type-body-sm ml-3 text-lime">
                        &rarr;
                      </span>
                    </h3>
                  </div>
                  <p className="type-body-sm mt-4 max-w-[52ch] text-muted-foreground">
                    {piece.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <span className="mt-14 block w-full border-t border-foreground/10 lg:mt-20" aria-hidden />

          <p className="type-body mt-10 max-w-[56ch] text-muted-foreground lg:mt-12">
            This is just the beginning. The infrastructure keeps growing, through education,
            research, media, community, and whatever this transition ends up asking of us next,
            because it isn't finished asking yet.
          </p>
        </div>
      </section>

      {/* ══════ 09 — THE PLAN (ink) ══════ */}
      <section className="section-ink">
        <div className={`${SHELL} py-20 lg:py-32`}>
          <SectionLabel tone="light">The plan</SectionLabel>

          <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-2 lg:gap-28">
            {/* LEFT COLUMN: main statement + closing line */}
            <div>
              <h2 className="type-h2-caps-light max-w-[18ch] text-foreground">
                Technology will keep advancing whether we&rsquo;re ready or not. Humanity has to
                advance with it.
              </h2>

              <p className="type-body mt-16 font-bold text-foreground lg:mt-24">
                That&rsquo;s not a hope. That&rsquo;s the plan.
              </p>
            </div>

            {/* RIGHT COLUMN: three supporting thoughts */}
            <div className="flex flex-col gap-10 lg:gap-14 lg:pt-2">
              {PLAN_THOUGHTS.map((thought, i) => (
                <div key={thought} className="flex items-start gap-6 lg:gap-8">
                  <span aria-hidden className="type-label-caps shrink-0 text-lime">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="type-body-lg max-w-[46ch] text-foreground/85">{thought}</p>
                </div>
              ))}
            </div>
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
function SectionLabel({
  children,
  tone,
  rule = true,
}: {
  children: string;
  tone: "dark" | "light";
  rule?: boolean;
}) {
  return (
    <>
      <p className={`type-label-caps ${tone === "light" ? "text-lime" : "text-ink/50"}`}>
        {children}
      </p>
      {rule ? <span className="type-eyebrow-rule block" aria-hidden /> : null}
    </>
  );
}

/** The three Time lines, each paired with a human-centered icon. */
const TIME_LINES = [
  {
    text: "Time to be present with the people we love.",
    icon: Users,
    label: "Presence",
  },
  {
    text: "Time to think instead of react.",
    icon: Lightbulb,
    label: "Thought",
  },
  {
    text: "Time to actually experience the life we've spent so long building.",
    icon: Heart,
    label: "Experience",
  },
] as const;

/** What Human Reps compound into — read straight off the paragraph above them. */
const COMPOUNDS = ["Trust", "Relationships", "Leadership", "Families", "Organizations"] as const;

/**
 * The four pieces, in the order Maya's document names them.
 */
const INFRASTRUCTURE = [
  {
    to: "/be-human-ai",
    name: "Be Human Intelligence",
    body: "Be Human Intelligence helps organizations adopt these systems through strategy, human readiness, governance, and transformation, keeping a person accountable for every judgment that matters. Hence, the technology strengthens both the business and the people inside it.",
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

/** The three supporting statements in The Plan section. */
const PLAN_THOUGHTS = [
  "We're not building this because we're afraid of artificial intelligence.",
  "We're building it because we've seen what's possible if humanity leads this well, and what's at risk if it doesn't.",
  "One Human Rep won't change the world. Millions of them will.",
] as const;
