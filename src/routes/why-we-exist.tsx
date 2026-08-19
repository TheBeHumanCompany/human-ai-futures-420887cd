import { createFileRoute } from "@tanstack/react-router";

import manifestoImage from "@/assets/manifesto.jpg";

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
 * The existing `/about` route is deliberately left in place and untouched. The
 * plan recommends folding it into this URL behind a 301, but that changes a
 * live, indexed URL and the decision has not been made — so this route is
 * additive, and `/about` keeps working exactly as it did.
 *
 * Section order below is Maya's, from the four screens she sent on 2026-08-19
 * ("this is what the Why We Exist page needs to look like, this in this
 * order"): hero → What We Noticed → The Real Question → Human Reps / Human
 * Wealth. Body copy is verbatim from the 3-page doc she sent on 2026-08-18,
 * with one deliberate exception noted at the Indigenous line below.
 */
function WhyWeExist() {
  return (
    <>
      <section className="section-cream border-b border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">Why we exist</p>
          <span className="type-eyebrow-rule block" aria-hidden />
          <h1 className="type-h1-prose mt-6 max-w-4xl text-ink">
            Being human is what we're born with. Humanity is what we practice.
          </h1>
          <p className="type-body-lg mt-8 max-w-xl text-ink/70">
            As technology becomes more powerful, humanity has to become more intentional. We exist
            to help people and organizations become more capable with AI while becoming more
            deliberate about their humanity.
          </p>
          {/* Maya asked for the signature in brand lime. This band is cream, where
              `--lime` measures 1.26:1 — `text-lime-dark` is the same 118° hue at
              the lightness the cream side is designed for. Chromium paints it
              rgb(127,146,0) on rgb(244,240,230) = 3.07:1, which clears AA for
              text at this size. */}
          <p className="font-hand mt-10 text-3xl text-lime-dark">Stay Human.</p>
        </div>
      </section>

      {/* ---------- What we noticed (ink) ---------- */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-foreground">What we noticed</p>
          <span className="type-eyebrow-rule block" aria-hidden />

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
            <div>
              <h2 className="type-h2-condensed max-w-2xl">
                There's a moment from The Human Archive we haven't stopped thinking about.
              </h2>
              <p className="type-body mt-8 text-muted-foreground">
                Actually, it's not one moment. It's a pattern.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                We started asking people one question:
              </p>
              <p className="type-body mt-6 font-semibold text-foreground">
                What does it mean to be human?
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                Almost nobody talks about their job title, how productive they've been, or what
                they've built.
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                They talk about feeling things. Laughing. Crying. Showing up for someone when it was
                hard. Being kind when it would've been easier not to be.
              </p>
            </div>

            {/* The rule sits left of the quote on desktop and above it on mobile,
                which is the only part of Maya's screenshot that cannot survive a
                one-column layout unchanged. */}
            <figure className="border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <blockquote className="type-h3-condensed">
                &ldquo;To love one another. Treat each other, and yourself, with respect and
                compassion.&rdquo;
              </blockquote>
              <figcaption className="type-body mt-6 text-muted-foreground">
                &mdash; Lindsay, Vancouver
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- The real question (ink) ---------- */}
      <section className="section-ink border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-lime">The real question</p>
          <span className="type-eyebrow-rule block" aria-hidden />

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="type-h2-condensed">It isn't really a story about technology.</h2>
              <p className="type-body mt-8 text-muted-foreground">
                It's a story about attention. About time. About the people we love getting
                whatever's left of us after the day has already taken everything else.
              </p>
            </div>
            <div className="lg:pt-4">
              <p className="type-body font-semibold text-foreground">
                What kind of humans are these systems actually helping us become?
              </p>
              <p className="type-body mt-6 text-muted-foreground">
                AI can unlock extraordinary progress. But the real question is not whether it
                becomes more intelligent. It will. The real question is who we become because of it.
              </p>
            </div>
          </div>

          <div className="mt-20 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="type-h1-condensed text-lime">Time.</p>
              <p className="type-body mt-6 text-muted-foreground">
                Time to be present with the people we love.
                <br />
                Time to think instead of react.
                <br />
                Time to actually experience the life we've spent so long building.
              </p>
            </div>
            <img
              src={manifestoImage}
              alt="Four friends talking together on a rooftop as the sun sets behind the city"
              loading="lazy"
              width={1408}
              height={912}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------- Human Reps / Human Wealth (cream) ---------- */}
      <section className="section-cream border-t border-hairline-dark">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-4xl">
            <p className="type-body text-ink/70">
              We believe that future is worth building toward.
            </p>
            <p className="type-body mt-6 text-ink/70">
              But every leap this size asks something of us in return. The question was never really
              whether AI becomes more intelligent. It will. The real question, the one that actually
              matters, is who we become because of it.
            </p>
            <p className="type-body mt-6 text-ink/70">
              Being human isn't something you're born finished with.
            </p>
            <p className="type-body mt-6 font-semibold text-ink">
              You're born human. Humanity is what you practice.
            </p>
            <p className="type-body mt-6 text-ink/70">
              You practice it in the conversations you choose to have instead of scrolling past. In
              the promises you keep when breaking them would be easier. In the moments you think for
              yourself instead of letting something else think for you. In choosing to be fully
              present with the person in front of you when distraction would cost you nothing.
            </p>
            <p className="type-body mt-6 text-ink/70">
              We call those moments Human Reps. Small, conscious choices where you interrupt the
              automatic pattern and decide how you want to show up. None of them look like much by
              themselves. But they compound into trust with your name attached, into relationships
              strong enough to carry real life, into leaders people actually believe, into families
              that feel closer instead of more distant, into organizations that become more human
              because the people inside them choose to practice being human.
            </p>
            <p className="type-body mt-6 font-semibold text-ink">We call that Human Wealth.</p>
            <p className="type-body mt-6 text-ink/70">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity. Not because we say it does. Because it's true every single time it
              happens &mdash; one conversation. One promise kept &mdash; one moment of real presence
              instead of performance.
            </p>
            {/* Maya's doc uses a different adjective here than the site does.
                That wording is one of the two superseded variants
                `layering.test.ts` bans by name, so this reads "Indigenous-led" —
                the canonical voice, matching `INDIGENOUS_LINE` in brand.ts.
                Flagged to Maya rather than changed silently. (The banned string
                is deliberately not spelled out in this comment: the same proof
                scans comments, precisely because that is how a retired variant
                gets copied back into live copy.) */}
            <p className="type-body mt-6 text-ink/70">
              That belief didn't start with AI, either. It's older than that. As an Indigenous-led
              company, we grew up understanding something the rest of the world is only now circling
              back to: the decisions we make today are inherited by the people who come after us.
              That's not a metaphor we borrowed for a pitch deck. It's the actual starting point
              this company was built from, and it's why we think about this transition in
              generations, not quarters.
            </p>
            <p className="type-body mt-6 text-ink/70">
              That's why we created The Be Human Company. Not simply to help organizations adopt AI.
              Not to launch another movement with a hashtag attached.
            </p>
            <p className="type-body mt-6 text-ink/70">
              We're building the human infrastructure for the age of artificial intelligence. The
              ideas. The frameworks. The practices. The research. The conversations. The stories.
              The tools that help people and organizations strengthen the human qualities that
              become more valuable, not less, as technology becomes more capable.
            </p>
          </div>

          <div className="mt-16 grid gap-12 border-t border-hairline-dark pt-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="type-label-caps text-lime-dark">Human Reps</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <p className="type-h3-condensed mt-6 text-ink">
                Small, conscious choices where you interrupt the automatic pattern and decide how
                you want to show up.
              </p>
            </div>
            <div className="border-t border-hairline-dark pt-12 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <p className="type-label-caps text-lime-dark">Human Wealth</p>
              <span className="type-eyebrow-rule block" aria-hidden />
              <p className="type-h3-condensed mt-6 text-ink">
                Trust with your name attached. Relationships strong enough to carry real life.
                Leaders people actually believe. Families that feel closer. Organizations that
                become more human.
              </p>
            </div>
          </div>

          <p className="mt-16 flex items-start gap-5 border-t border-hairline-dark pt-10 text-ink/70">
            <span className="type-h3-condensed leading-none text-lime-dark" aria-hidden>
              &#8599;
            </span>
            <span className="eyebrow">
              We believe the world gets measurably better every time someone chooses to practice
              their humanity.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
