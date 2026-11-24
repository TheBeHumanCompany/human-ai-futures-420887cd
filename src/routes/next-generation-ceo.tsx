import { OperatingSystem } from "@/components/ceo/operating-system";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { BOOKING_URL_15MIN } from "@/lib/booking";
import boardroom from "@/assets/ceo-boardroom.jpg";
import brettPhoto from "@/assets/brett-christoffel.png";
import shaneBookshelf from "@/assets/shane-bookshelf.png.asset.json";
import curvesTruck from "@/assets/shane-curves-truck.jpg.asset.json";
import shaneTeaching from "@/assets/shane-teaching.jpg.asset.json";
import shanePlaid from "@/assets/shane-portrait-plaid.jpg.asset.json";
import kanePhoto from "@/assets/kane-minkus.jpg.asset.json";
import { ReportShowcase } from "@/components/ceo/report-showcase";

/** `/next-generation-ceo` — sales page. Copy is Shane's document verbatim. */
export const Route = createFileRoute("/next-generation-ceo")({
  head: () => ({
    meta: [
      { title: "The Next Generation CEO — A private founding program for eight CEOs" },
      {
        name: "description",
        content:
          "Eight CEOs. Your own Chief AI Officer. 24 live sessions. A private founding program from The Be Human Company.",
      },
      { property: "og:title", content: "The Next Generation CEO" },
      {
        property: "og:description",
        content: "Eight CEOs. Your own Chief AI Officer. 24 live sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CeoPage,
});

const SHELL = "mx-auto max-w-[1400px] px-5 sm:px-8";
/** Checkout link not supplied yet — seats route to the enrollment section. */
const RESERVE_HREF = "#enroll";

function Ctas({ tone = "ink", reserveOnly = false }: { tone?: "ink" | "cream"; reserveOnly?: boolean }) {
  const outline =
    tone === "ink"
      ? "border-foreground text-foreground hover:bg-foreground hover:text-background"
      : "border-ink text-ink hover:bg-ink hover:text-cream";
  return (
    <div className={reserveOnly ? "" : "flex flex-col gap-3 sm:flex-row sm:gap-4"}>
      <a
        href={RESERVE_HREF}
        className={`inline-flex items-center justify-center rounded-[10px] bg-lime px-7 py-4 text-sm font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-lime/85 ${
          reserveOnly ? "w-full whitespace-nowrap" : ""
        }`}
      >
        Reserve your seat
      </a>
      {!reserveOnly && (
        <a
          href={BOOKING_URL_15MIN}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center justify-center rounded-[10px] border-2 px-7 py-4 text-sm font-bold uppercase tracking-[0.08em] transition-colors ${outline}`}
        >
          Talk to Shane first
        </a>
      )}
    </div>
  );
}

function Label({ children, tone = "lime" }: { children: string; tone?: "lime" | "muted" }) {
  return (
    <p className={`type-label-caps ${tone === "lime" ? "text-lime" : "text-ink/50"}`}>{children}</p>
  );
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`type-body max-w-[64ch] ${className}`}>{children}</p>;
}

function Bullets({
  items,
  dark = true,
  variant = "number",
}: {
  items: readonly React.ReactNode[];
  dark?: boolean;
  /** "number" = numbered rows with hairline dividers; "dot" = plain bullet list, no dividers. */
  variant?: "number" | "dot";
}) {
  if (variant === "dot") {
    return (
      <ul>
        {items.map((it, i) => (
          <li
            key={i}
            className={`type-body grid grid-cols-[0.9rem_minmax(0,1fr)] gap-3 py-[0.4rem] ${
              dark ? "text-foreground/80" : "text-ink/80"
            }`}
          >
            <span
              aria-hidden
              className="mt-[0.6em] h-[7px] w-[7px] shrink-0 rounded-full bg-lime"
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`border-t ${dark ? "border-border" : "border-ink/15"}`}>
      {items.map((it, i) => (
        <li
          key={i}
          className={`type-body grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 border-b py-4 ${dark ? "border-border text-foreground/80" : "border-ink/15 text-ink/80"}`}
        >
          <span className="type-label-caps pt-[3px] text-lime-dark">
            <span className={dark ? "text-lime" : ""}>{String(i + 1).padStart(2, "0")}</span>
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold">{children}</strong>;
}

function PersuasionStatement({
  children,
  emphasis,
  tone = "dark",
  className = "",
  matchSize = false,
  emphasisClassName = "",
}: {
  matchSize?: boolean;
  children: React.ReactNode;
  emphasis: React.ReactNode;
  tone?: "dark" | "cream";
  className?: string;
  emphasisClassName?: string;
}) {
  return (
    <div className={`w-full max-w-6xl border-l-2 border-lime pl-6 sm:pl-8 ${className}`}>
      <p
        className={`max-w-[52ch] font-sans text-[clamp(1.375rem,2.2vw,2rem)] font-medium leading-[1.3] tracking-[-0.025em] ${
          tone === "dark" ? "text-foreground/85" : "text-ink/80"
        }`}
      >
        {children}
      </p>
      <p
        className={`mt-4 max-w-[38ch] font-sans font-bold sm:mt-5 ${
          matchSize ? "text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.3] tracking-[-0.025em]" : "text-[clamp(1.75rem,3.2vw,3rem)] leading-[1.12] tracking-[-0.035em]"
        } ${
          emphasisClassName || (tone === "dark" ? "text-lime" : "text-lime-dark")
        }`}
      >
        {emphasis}
      </p>
    </div>
  );
}

const FAMILIAR = [
  "You’re using AI every day, but you can’t point to what it has actually changed in the business.",
  "Everything still runs through you, and your week disappears into questions and decisions that land back on your desk.",
  "You don’t have a CTO, a chief of staff, or a marketing lead, and you can’t justify hiring them yet.",
  "You’ve been pitched tools and agents, and you can’t tell which ones are worth the money.",
  "You’ve paid for technology that looked impressive and quietly went unused.",
  "You can feel competitors moving faster, and you’re seeing new ones show up with smaller teams and lower costs.",
  "You know you should be leading this, but you don’t have time to figure it out.",
];

const AGENTS: [string, string][] = [
  ["Research", "agents watching your competitors and the market, and preparing what you need to decide."],
  ["Marketing", "agents supporting planning, copy, production, repurposing and distribution."],
  ["Sales", "agents researching prospects, preparing outreach and keeping follow-up from slipping."],
  ["Operations", "agents organizing information, preparing reports and handling repetitive admin."],
  ["Executive support", "an AI-supported chief of staff that helps you set priorities and keep projects moving."],
];

const HIGHLIGHTS = [
  "Brought Curves for Women franchises to Canada as part of a franchise system that grew into a $4 billion company in 10 years",
  "Was one of the first to bring healthy energy drinks to market, building a team of more than 10,000 distributors before the company’s exit",
  "Sat on the board of the John Volken organization, a $200 million company, and helped oversee its digital strategy",
  "Sat on the board of the Maple Ridge Food Bank and helped double its donations and funding in one year",
  "Built a fitness brand that was written up around the world and wrote two best-selling books",
  "Started a marketing and social media company in the earliest days of social media, and it still runs marketing for clients today",
  "Grew a podcast to 500,000 listeners, hosted my own radio shows and interviewed more than 150 CEOs about how they lead and grow",
  "Helped build brands and launches for Kevin Harrington (an original investor on Shark Tank), the film Milton’s Secret (based on the book by Eckhart Tolle, author of The Power of Now) and Satnam Singh (the first India-born player drafted into the NBA, featured in Netflix’s One in a Billion)",
  "Started a compassion movement, filming acts of compassion across North America, a mission that lives on through The Be Human Company",
];

const STEPS: [string, string][] = [
  ["Step 2. Define AI opportunities and risks.", "Where you can grow revenue, cut waste and cost, free up your team and get ahead of competitors, plus the risks and obstacles that could stop it from working."],
  ["Step 3. Develop your AI strategy and roadmap.", "How AI fits your wider business strategy: which processes change, which systems make sense, where agents create value, how your people are involved and what you shouldn’t spend money on."],
  ["Step 4. Prioritize objectives.", "The sequence: what happens first, what can wait, what it takes, who owns it and how you’ll measure it."],
];

const WEEKS: [string, string, string][] = [
  ["Week 1. Redesign how you think and work.", "We start with you. How to think with AI instead of just asking it questions, how to rebuild your own week around it and how to tell great output from average. Then what language models, tools, agents and agentic systems can really do, and how to evaluate ChatGPT, Claude and the vendors pitching you, before you spend another dollar.", "you lead from your own experience and make the technology calls instead of taking someone’s word for it."],
  ["Week 2. Value mapping.", "How your company makes money, where work gets stuck and where resources leak.", "you know what to fix before you automate anything."],
  ["Week 3. Your company brain and the harness.", "This is where results are won or lost. Your agents are only as good as what they know, so you’ll learn to build the brain they work from: your data, your context, your strategy and the way you do things, organized in one place you own. Then you set up the harness, the instructions, tools, connections and controls that let your agents put that knowledge to work. You’ll see it all live inside Claude and ChatGPT, including projects, scheduled tasks, skills, connectors and plugins, working rather than just described.", "agents that understand your business instead of giving generic answers."],
  ["Week 4. Build workflows that run with agents and people.", "Map your key workflows in depth, step by step, then connect agents to them: which steps agents handle, which stay with your people, how work hands off between them and where human judgment and approval sit. The agents support the workflow and the people in it.", "workflows built for how work gets done now, not technology bolted onto old processes."],
  ["Week 5. Orchestrate your agentic workforce.", "The future of every business is a team of agents working together. You’ll learn to build lead agents for research, marketing, sales, operations and the executive team, with specialist agents working under each one. They talk to each other, work without being asked and hand off to your people when a decision needs human judgment.", "a team of agents moving your business forward, not one chatbot waiting for a question."],
  ["Week 6. Lead the human-and-AI workforce.", "A new leadership style that leaves the old-school model behind, where you orchestrate humans and intelligent systems together. How roles change, which skills matter now, how to hire and train for it and how to keep accountability and human judgment at the center.", "a more capable team that keeps what makes your business human."],
  ["Week 7. The economics of AI.", "Subscriptions, model and token costs, agent activity and integrations and how to tell whether the return justifies the spend.", "you know the real cost before you commit."],
  ["Week 8. Your next operating model.", "We go back to your roadmap with everything you’ve learned: what to start now, what to wait on and what you’ll need.", "the judgment to keep leading the change after the program ends."],
];

const MARKETING: [string, string][] = [
  ["Week 1. The new marketing landscape.", "How attention, platforms and customer discovery are shifting, and where you’re at risk of being outcompeted."],
  ["Week 2. Content that drives revenue.", "Connecting what you publish to leads, authority and sales."],
  ["Week 3. More content at a lower cost.", "Using AI for research, scripting, editing and repurposing without losing your voice."],
  ["Week 4. Your brand in the company brain.", "Your voice, expertise, content pillars and assets, organized so your marketing systems sound like you."],
  ["Week 5. Your first marketing agents.", "Agents for research, content planning, copy and repurposing."],
  ["Week 6. Your marketing team.", "Agents working alongside your people or contractors as one content operation."],
  ["Week 7. Distribution and growth.", "Getting content in front of the right people, testing, measuring and finding the openings your competitors miss."],
  ["Week 8. Your 90-day marketing plan.", "A practical plan to run from March onward."],
];

const INCLUDED: [string, string][] = [
  ["Your personal blueprint ($7,500 value):", "four private Zoom calls with me, starting the day you join; three personal assessments (CEO, company and AI implementation); your Key Findings Report; and your built-out 30/60/90-day roadmap, reviewed with you privately"],
  ["Eight weeks with me as your Chief AI Officer ($20,000 value)", ""],
  ["16 live CEO and AI leadership sessions, two a week ($6,000 value)", ""],
  ["Eight live marketing and content sessions, one a week ($3,000 value)", ""],
  ["Direct email access to me from the day you join through the end of February ($2,500 value)", ""],
  ["Your seat in the eight-CEO founding group ($3,000 value)", ""],
  ["Lifetime founding member access:", "join future groups’ live training calls and get every new training we add on these subjects, free ($3,000 value)"],
  ["Questions answered when you can’t attend, and every session recorded (included)", ""],
  ["A look inside how we’ve built The Be Human Company (included)", ""],
];

function CeoPage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO — recreated from the approved mockup */}
      <section className="relative isolate overflow-hidden bg-ink">
        <img
          src={boardroom}
          alt=""
          width={1920}
          height={960}
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_50%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/0 md:via-ink/55" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-ink/0" />
        <div className={`${SHELL} flex min-h-[78svh] flex-col justify-center py-24 md:min-h-[640px] lg:min-h-[720px]`}>
          <h1 className="font-display text-[clamp(3.25rem,9vw,8.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-cream">
            The Next
            <br />
            Generation CEO
          </h1>
          <p className="type-body-lg mt-5 max-w-md text-cream/70 sm:mt-6">
            A private founding program for 8 CEOs
          </p>
          <div className="mt-10">
            <Ctas />
          </div>
        </div>
        <div className="border-t border-cream/15 bg-ink/80 backdrop-blur-sm">
          <dl className={`${SHELL} grid grid-cols-2 divide-cream/15 lg:grid-cols-4 lg:divide-x`}>
            {[
              ["Seats", "8 CEOs"],
              ["Your guide", "Your own Chief AI Officer"],
              ["Format", "24 live sessions"],
              ["Enrollment closes", "Friday, December 11"],
            ].map(([k, v]) => (
              <div key={k} className="py-5 lg:px-6 lg:first:pl-0">
                <dt className="type-label-caps text-lime">{k}</dt>
                <dd className="mt-1.5 font-display text-lg uppercase tracking-wide text-cream sm:text-xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* INTRO */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-10 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:py-20`}>
          <div>
            <span className="type-eyebrow-rule mt-0 block" aria-hidden />
            <h2 className="type-h2-prose mt-5 font-medium text-ink">
              When someone tells you to spend more on AI, do you actually know if they’re right?
            </h2>
            <p className="type-body-lg mt-5 max-w-[46ch] text-ink/80">
              <B>Stop paying for AI activity.</B> Start building a company that moves faster, costs less to run and gives you your time back.
            </p>
          </div>
          <div className="space-y-5 text-ink/80">
            <P>
              I’m personally taking eight CEOs through this. The day you join, we assess you and your company, then build your AI strategy and 30/60/90-day roadmap. Then, for eight weeks in January and February, I sit beside you as your Chief AI Officer while you put it into motion, with a marketing and content track, direct email access to me and seven other CEOs going through the same change.
            </P>
            <p className="type-h4-caps text-ink">Eight CEOs. Your own Chief AI Officer. 24 live sessions</p>
            <P>
              Only eight seats, and only one company per industry. Enrollment closes Friday, December 11, and your assessments start the day you join.
            </P>
            <Ctas tone="cream" />
          </div>
        </div>
        <div className={`${SHELL} pb-16 lg:pb-20`}>
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-sm bg-ink">
            <img src={boardroom} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="relative px-6 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-ink" aria-hidden>▶</span>
              <p className="type-h3-caps-light mt-6 text-cream">“Your next competitor might have half your staff.”</p>
              <p className="type-label-caps mt-3 text-cream/60">Video from Shane · coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAMILIAR */}
      <section className="section-ink">
        <div className={`${SHELL} grid gap-10 py-20 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:py-28`}>
          <div>
            <Label>The signs</Label>
            <h2 className="type-h2-caps-light mt-4">Does any of this sound familiar?</h2>
          </div>
          <div>
            <Bullets items={FAMILIAR} />
            <PersuasionStatement className="mt-12" emphasis="this program was built for you.">
              If you nodded at even two of these,
            </PersuasionStatement>
          </div>
        </div>
      </section>

      {/* THE TRAP */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16 lg:py-28`}>
          <div className="lg:col-span-2">
            <Label tone="muted">The problem</Label>
            <h2 className="type-h2-caps mt-4 max-w-none md:!text-[min(4.4vw,4.5rem)]"><span className="block">You’re using AI</span> <span className="mt-4 block">Is your business actually getting better?</span></h2>
          </div>
          <div>
            <div className="border-t border-ink/15 pt-8">
              <div className="grid grid-cols-2 gap-6 sm:gap-10">
                <div className="min-w-0">
                  <p className="font-display !text-[56px] md:!text-[72px] lg:!text-[96px] !font-bold !leading-none tracking-[-0.01em] text-ink">88%</p>
                  <p className="mt-4 font-sans !text-[14px] lg:!text-[18px] font-normal leading-snug text-ink/70">of organizations use AI.</p>
                  <div className="mt-5 h-2 w-full bg-ink/10" role="img" aria-label="88%">
                    <div className="h-full bg-ink" style={{ width: "88%" }} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-display !text-[56px] md:!text-[72px] lg:!text-[96px] !font-bold !leading-none tracking-[-0.01em] text-ink">6%</p>
                  <p className="mt-4 font-sans !text-[14px] lg:!text-[18px] font-normal leading-snug text-ink/70">are AI high performers.</p>
                  <div className="mt-5 h-2 w-full bg-ink/10" role="img" aria-label="6%">
                    <div className="h-full bg-lime" style={{ width: "6%" }} />
                  </div>
                </div>
              </div>
              <p className="type-body-sm mt-8 text-ink/50">McKinsey, 2025 State of AI</p>
              <div className="mt-7 space-y-1.5">
                <p className="font-sans !text-[22px] lg:!text-[26px] font-normal leading-tight text-ink">Almost everyone is using AI.</p>
                <p className="font-sans !text-[22px] lg:!text-[26px] !font-bold leading-tight text-ink">Few are actually getting ahead.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6 text-ink/80">
            <P>Maybe you’re in ChatGPT every day. Maybe your team is too, or you’ve paid for a few subscriptions, tried some automations, or hired someone to build an agent. It feels productive. There’s more content, more reports and more ideas than ever.</P>
            <P>And that’s the trap. Most CEOs believe it’s working because it feels like it’s working, but very few can actually show it. Are your costs down? Are customers getting served faster? Is the business executing better, or is it just producing more?</P>
            <P>The research backs this up. McKinsey’s 2025 State of AI report found that 88% of companies now use AI, but only about 6% see it make a real difference to their profits. Almost everyone is using it. Almost no one is winning with it.</P>
            <P>Using AI and getting results from AI are not the same thing, and almost every CEO I talk to has a hard time telling the difference. They see an answer that looks good and assume it is. When I sit down with a CEO and look at how they’re using it, I can usually see right away that they could be getting about 40% better output than they are today. And it doesn’t stop with them. When the person at the top can’t tell great output from average, that standard trickles down to everyone in the company.</P>
            <P>And when someone recommends the next AI investment, whether it’s a vendor, a consultant, or someone on your own team, can you answer the questions that matter? What should it cost? What will it replace? Who checks the work? What happens when it goes wrong? How will you know it’s paying off?</P>
            <P className="font-semibold text-ink">If you can’t judge the work you’re paying for, it’s very hard to lead the change. That’s the real problem most CEOs are facing. They aren’t short on AI. They’re short on a way to turn it into a better business.</P>
          </div>
        </div>
      </section>

      {/* FASTEST WINS */}
      <section className="section-ink grain">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Label>The shift</Label>
          <h2 className="type-h1-caps-light mt-4 max-w-[18ch]">The fastest company in your market wins, not the biggest</h2>
          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6 text-foreground/80">
              <P>Your next competitor might have half your staff and still outrun you. They don’t need a bigger team or a bigger budget anymore. Someone can now start a business in your space in weeks, for a fraction of what yours cost to build, and move faster than you on day one. Meanwhile, most companies your size run without a CTO, a chief of staff, or a real marketing lead because they’ve never been able to justify the hire.</P>
              <P>Now ask yourself a harder question. If you were building your company from scratch today, knowing what AI agents can do, would you organize it the same way? Would you hire for the same roles, build the same departments and spend the same money? Probably not. We’re entering a time when a company of 10 people can have the operating capability that used to take 30 or 40. Here’s what that starts to look like:</P>
            </div>
            <div>
              <ul className="border-t border-border">
                {AGENTS.map(([k, v]) => (
                  <li key={k} className="grid gap-1 border-b border-border py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                    <span className="type-label-caps pt-1 text-lime">{k}</span>
                    <span className="type-body text-foreground/80">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="type-body-sm mt-5 text-foreground/60">All of it works from the same company knowledge, with your people providing the judgment, relationships and accountability.</p>
            </div>
          </div>
          <div className="mt-16 grid gap-6 border-t border-border pt-12 text-foreground/80 lg:grid-cols-2 lg:gap-16">
            <P>And it’s still early. Most companies use AI one person and one tool at a time, with nothing connected to how the business actually runs. In most of them, the people are ready. The systems around them aren’t. The companies that fix that now get a head start that compounds. The ones that don’t may end up competing against someone with lower costs, quicker execution and more capacity than their current model can match.</P>
            <P>And this is where the real advantage lives. Your competitors can buy the same AI tools you can. What they can’t copy overnight is a company that has organized its knowledge, redesigned its workflows and learned how its people and agents work together. That takes strategy, the right sequence and leadership from the top.</P>
          </div>
          <PersuasionStatement
            className="mt-16"
            emphasis="And every hour you spend trying to figure this out alone is an hour your competitors get to use."
          >
            When you and your company move faster and get better results, you win.
          </PersuasionStatement>
        </div>
      </section>

      {/* OPERATOR */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-12 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-28`}>
          <div className="lg:col-span-2">
            <Label tone="muted">Your Chief AI Officer</Label>
            <h2 className="type-h2-caps mt-4 max-w-none"><span className="block">I’ve always been an operator</span> <span className="mt-4 block">That’s exactly how I approach AI</span></h2>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <img src={shaneBookshelf.url} alt="Shane Jeremy James in front of his bookshelf" loading="lazy" className="aspect-[4/5] w-full object-cover object-[50%_30%]" />
          </div>
          <div>
            <P className="text-ink/80">I’m Shane Jeremy James, founder and CEO of The Be Human Company. I’ve spent more than 20 years building, running and growing businesses. A few highlights:</P>
            <div className="mt-8">
              <Bullets items={HIGHLIGHTS} dark={false} variant="dot" />
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <figure>
                <img src={curvesTruck.url} alt="Shane with colleagues in front of a Curves franchise truck" loading="lazy" className="aspect-square w-full object-cover" />
                <figcaption className="type-label-caps mt-3 text-ink/50">The Curves years</figcaption>
              </figure>
              <figure>
                <img src={shaneTeaching.url} alt="Shane teaching a room of business owners" loading="lazy" className="aspect-square w-full object-cover" />
                <figcaption className="type-label-caps mt-3 text-ink/50">Teaching business owners</figcaption>
              </figure>
            </div>
            <div className="mt-10 space-y-6 text-ink/80">
              <P>Each of those taught me the same lesson: results come from how a business operates, not how many tools it owns.</P>
              <P>When AI started taking off, I went all in. I studied the models, tested platforms and generated an enormous amount of output. And I made the same mistake I now see in almost every company I talk to: I confused more AI output with better business performance.</P>
              <P>What changed was looking hard at my own decisions, workflows and priorities, and asking a different question. Not how much AI could produce, but how it could help us operate better. That’s when it clicked. AI isn’t a technology game. It’s an operations game, and using AI is a completely different skill from leading a company through it.</P>
              <P className="font-semibold text-ink">That’s why I built this program.</P>
            </div>
          </div>
        </div>
      </section>

      {/* BUILDING IT OURSELVES */}
      <section className="section-ink">
        <div className={`${SHELL} grid gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:py-28`}>
          <div>
            <Label>Proof in our own house</Label>
            <h2 className="type-h2-caps-light mt-4 max-w-[18ch]">We’re building this kind of company ourselves</h2>
            <div className="mt-10 grid grid-cols-3 divide-x divide-border border-t border-border pt-8">
              {[["15–20", "podcast interviews a week"], ["150–200", "pieces of content a week"], ["600–800", "pieces a month"]].map(([n, l]) => (
                <div key={l} className="min-w-0 px-2 text-center sm:px-4">
                  <p className="whitespace-nowrap font-display text-[clamp(1.35rem,4vw,3rem)] font-bold leading-none text-lime">{n}</p>
                  <p className="type-body-sm mt-2 text-foreground/60">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6 text-foreground/80">
            <P>I’m not teaching this from the sidelines. At The Be Human Company, we’re building our own operations around the same changes we help CEOs through: agents, organized company knowledge, AI-supported functions and new ways for people and systems to work together. We’re applying the same approach in the companies I own, too.</P>
            <P>We’ve tested different models and platforms, hit their limits and changed direction when something wasn’t paying off. And we’ve learned that the order you build in matters enormously. Great technology still gets poor results when processes are broken, information is a mess, or people don’t understand how the system is supposed to work.</P>
            <P>And here’s what surprised even me. Of all the businesses I’ve built and helped grow, The Be Human Company has broken into its market faster than I ever imagined, and I can tie that directly to how well we’ve learned to use the technology. That’s why I’m so passionate about this right now. I believe every CEO can do this if they take the time to get it right, and that’s exactly what this program is for.</P>
            <P>Here’s one example. We now record 15 to 20 podcast interviews a week, at about half of what it used to cost us, with a fast turnaround. Each interview becomes around 10 pieces of high-quality content, which is 150 to 200 pieces a week, or roughly 600 to 800 a month, from that alone.</P>
          </div>
        </div>
        <div className={`${SHELL} pb-20 lg:pb-28`}>
          <OperatingSystem />
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,36fr)_minmax(0,62fr)] lg:gap-16">
            <div>
              <img src={brettPhoto} alt="Brett Christoffel, Founder, All Y’alls Foods" loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
            </div>
            <div>
              <Label tone="muted">Client story</Label>
              <h2 className="type-h2-caps mt-4">Case study: All Y’alls Foods</h2>
              <P className="mt-5 text-ink/80">All Y’alls Foods is a Texas plant-protein food company. I’m an equity partner, so I have a real stake in how it runs.</P>
              <dl className="mt-8 border-t border-ink/15">
                {[
                  ["The challenge", "All Y’alls was growing with a small team. There weren’t enough people to keep up with marketing, content and operations, and too much depended on too few hands."],
                  ["What we found", "Systems and operations didn’t connect, and the business was still running the old way, with no foundation for AI or agents to build on."],
                  ["What we changed", "We streamlined systems and operations so the business runs more simply, then built a new AI operations division to move the company toward an agentic operating model."],
                  ["The results", "Less operational complexity and a company that moves faster. And All Y’alls recently secured a major Walmart contract, with operations built to handle the growth."],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-2 border-b border-ink/15 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                    <dt className="type-label-caps pt-1 text-ink">{k}</dt>
                    <dd className="type-body text-ink/80">{v}</dd>
                  </div>
                ))}
              </dl>
              <blockquote className="mt-10 border-l-2 border-lime pl-6 sm:ml-6 lg:pl-8">
                <p className="type-body-lg text-ink">“I’ve worked with Shane for over three years. He’s helped scale our business with marketing and content and helped build our operations, so it was great to have him and his team come in and build a completely new AI operations division. He’s someone I trust completely, and I recently gave him more equity in our company.”</p>
                <footer className="type-label-caps mt-5 text-ink/60">Brett Christoffel, Founder, All Y’alls Foods</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE BEHIND THE PROGRAM */}
      <section className="section-cream border-t border-ink/10">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <h2 className="type-h2-caps max-w-[20ch] text-ink">The experience behind the program</h2>
          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:mt-10 sm:gap-6">
            <figure>
              <img src={shanePlaid.url} alt="Shane Jeremy James" loading="lazy" className="aspect-[4/5] w-full object-cover object-top" />
              <figcaption className="type-label-caps mt-3 text-ink/50">Shane Jeremy James</figcaption>
            </figure>
            <figure className="mt-10 sm:mt-16">
              <img src={kanePhoto.url} alt="Kane Minkus" loading="lazy" className="aspect-[4/5] w-full object-cover object-top" />
              <figcaption className="type-label-caps mt-3 text-ink/50">Kane Minkus</figcaption>
            </figure>
          </div>
          <P className="mt-10 text-ink/80 sm:mt-12">Shane has worked closely with Kane Minkus, co-founder of Industry Rockstar, an AI-focused business mentoring company ranked No. 298 on the 2026 Inc. 5000 list of America’s fastest-growing private companies. Kane also co-founded MyGentic, an AI platform built to help companies put their knowledge to work.</P>
        </div>
      </section>

      {/* INTRODUCING */}
      <section className="section-ink grain">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Label>Introducing</Label>
          <h2 className="type-hero-caps-light mt-4 max-w-[14ch]">
            The Next Generation <span className="text-lime">CEO</span>
          </h2>
          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
            <h3 className="font-sans text-[clamp(1.25rem,1.6vw,1.5rem)] font-semibold leading-[1.4] tracking-[-0.02em]">We don’t start with AI. We start with your business</h3>
            <div className="space-y-6 text-foreground/80">
              <P>Most AI programs start with generic training. Everyone watches the same demos, then goes home trying to work out what applies to their company. We do it the other way around, because the right strategy for a professional services firm can look nothing like the right one for a manufacturer or a growing consumer brand.</P>
              <P>Most consultants start by asking which agent you should build. We start by asking where your business is losing value. You wouldn’t build a house by buying materials and hoping they fit together. You’d start with the blueprint, and that’s what we build first.</P>
              <P>And there’s a reason this program is for CEOs only. McKinsey found that the companies getting real results from AI are three times more likely to have senior leaders who personally own the work. When the CEO leads it, it works.</P>
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 1 */}
      <section className="section-cream">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <p className="type-label-caps text-ink/50">Phase 1 (starts the day you join)</p>
          <h2 className="type-h1-caps mt-4 max-w-[18ch]">Your CEO and company blueprint</h2>
          <p className="type-h4-caps mt-6 text-ink">Three assessments. Four consulting steps. One clear plan</p>
          <P className="mt-6 text-ink/80">From day one, you get four private Zoom calls with me. The first three are your assessments, where we dig into where your company stands, where it’s losing value and what needs to happen next. On the fourth, we walk through your Key Findings Report and 30/60/90-day roadmap together. We do the heavy lifting in between, so you can focus on the conversations that matter.</P>

          <div className="mt-14 border-t border-ink/15 pt-10">
            <h3 className="type-h3-caps">Step 1. Your three assessments</h3>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                ["CEO assessment.", "How you lead, decide, spend your time and use AI. What still depends on you, and where better systems would make you more effective. We also want to hear your vision for the business, what’s weighing on you and what you’ve wanted to do but haven’t had the resources for."],
                ["Company assessment.", "Ten areas of your business: your business model, revenue engine, customer journey, team structure, technology, critical workflows, information flow, decision bottlenecks, growth constraints and risk exposure. We also look at what the work feels like for your team, because a better company should be a better place to work too."],
                ["AI implementation assessment.", "Your current technology, data, workflows and real readiness to bring in AI and agents, including what needs fixing before anything gets built."],
              ].map(([t, b], i) => (
                <div key={t} className="border-t-2 border-ink pt-5">
                  <p className="font-display text-[18px] font-bold text-lime-dark">0{i + 1}</p>
                  <details className="group mt-3">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="type-h4-caps">{t.replace(/\.$/, "")}</span>
                      <span aria-hidden="true" className="shrink-0 text-[20px] font-light leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="type-body-sm mt-3 text-ink/75">{b}</p>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 border-t border-ink/15">
            {STEPS.map(([t, b]) => (
              <div key={t} className="grid gap-3 border-b border-ink/15 py-7 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-12">
                <h3 className="type-h3-caps">{t.replace(/\.$/, "")}</h3>
                <p className="type-body text-ink/80">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-ink p-8 text-cream sm:p-12">
            <p className="type-label-caps text-lime">What you walk away with</p>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              <div>
                <h4 className="type-h3-caps-light">Your Key Findings Report</h4>
                <p className="type-body mt-3 text-cream/75">A personal executive report on your findings, opportunities, readiness, risks and recommended priorities.</p>
              </div>
              <div>
                <h4 className="type-h3-caps-light">Your 30/60/90-day roadmap</h4>
                <p className="type-body mt-3 text-cream/75">The complete plan, built out for your company: what happens in each phase, in what order, with what resources, owned by whom and measured how.</p>
              </div>
            </div>
            <figure className="mt-10 border-t border-cream/15 pt-8">
              <ReportShowcase />
              <figcaption className="mt-4 font-sans text-xs font-normal leading-relaxed text-cream/50">Illustrative example, not client data. All metrics are samples, not actual client results or guaranteed outcomes.</figcaption>
            </figure>
            <p className="type-body mt-10 border-t border-cream/15 pt-8 text-cream/80">We walk you through both on your fourth call. Before January even starts, you’ll know exactly where your business stands and what comes next.</p>
          </div>
          <div className="mt-12 w-full max-w-6xl border-l-2 border-lime pl-6 sm:pl-8">
            <p className="max-w-[44ch] font-sans text-[clamp(1.25rem,2vw,1.625rem)] font-bold leading-[1.25] tracking-[-0.02em] text-ink">
              The sooner you join, the sooner we start.
            </p>
            <p className="type-body mt-4 max-w-[58ch] font-medium text-ink">
              Your assessments begin <strong className="font-bold">the day you reserve your seat</strong>, so you’ll be further ahead when the group starts.
            </p>
            <div className="mt-8">
              <p className="type-label-caps text-ink/55">Live program begins</p>
              <p className="mt-2 whitespace-nowrap font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold uppercase leading-none text-ink">Monday, January 4</p>
              <p className="mt-1 font-display text-[clamp(1.125rem,1.8vw,1.375rem)] font-bold uppercase leading-none text-ink/70">2027</p>
              <span aria-hidden="true" className="mt-4 block h-[2px] w-12 bg-lime" />
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 2 */}
      <section className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Label>Phase 2 (January and February)</Label>
          <h2 className="type-h1-caps-light mt-4 max-w-none !font-bold !text-[clamp(1.9rem,7.6vw,5.5rem)] !leading-[0.95]"><span className="block whitespace-nowrap">For eight weeks, I’m</span><span className="block whitespace-nowrap">your Chief AI Officer</span></h2>
          <div className="mt-10 grid gap-6 text-foreground/80 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <P>Most consulting engagements end when you get the report, and you’re left working out how to make it happen. This one doesn’t.</P>
              <P>For eight weeks, I work alongside you as your Chief AI Officer. We start with your actual business, your findings and your roadmap, so nothing is generic. I’ll help you decide which opportunities to chase, which systems to build first, how to organize your company’s knowledge, where agents earn their keep and how to avoid the expensive mistakes.</P>
            </div>
            <P>When you’re stuck, you have someone to ask. When you’re not sure whether a platform, agent, or investment makes sense, you have another operator to think it through with. You don’t need to become a programmer. You need to become the CEO who knows what to build, what to buy, what to question and how to lead it.</P>
          </div>

          <h3 className="mt-12 font-sans text-[24px] font-semibold normal-case leading-tight tracking-normal text-foreground md:text-[28px]">The Eight-Week CEO Curriculum</h3>
          <span aria-hidden="true" className="mt-3 block h-[2px] w-12 bg-lime" />
          <div className="mt-8 border-t border-border">
            {WEEKS.map(([t, b, adv], i) => (
              <details key={t} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="type-label-caps block !text-[15px] text-lime">Week {i + 1}</span>
                    <span className="type-h4-caps-light mt-2 block">{t.replace(/^Week \d+\.\s*/, "").replace(/\.$/, "")}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 pt-1 text-[22px] font-light leading-none text-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="max-w-3xl pb-8">
                  <p className="type-body text-foreground/80">{b}</p>
                  <p className="type-body mt-3 text-foreground"><span className="font-semibold text-lime">Your advantage:</span> {adv}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE CALLS */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28`}>
          <div>
            <h2 className="type-h2-caps max-w-[18ch]">Three live calls every week, and a direct line to me</h2>
            <P className="mt-6 text-ink/80">This isn’t a course where you watch videos and hope it sticks. Starting Monday, January 4, and running through the end of February, you get:</P>
          </div>
          <ul>
            <li className="border-b border-ink/15 py-7 last:border-b-0 first:pt-0">
              <div className="border-l-2 border-lime pl-5">
                <p className="type-body font-semibold text-ink">Two CEO and AI leadership calls every week.</p>
                <p className="type-body mt-1 font-normal text-ink/75">We teach, demonstrate real systems and work through the problems you bring from your own company.</p>
              </div>
            </li>
            <li className="border-b border-ink/15 py-7 last:border-b-0 first:pt-0">
              <div className="border-l-2 border-lime pl-5">
                <p className="type-body font-semibold text-ink">One marketing and content call every week.</p>
                <p className="type-body mt-1 font-normal text-ink/75">More on that below.</p>
              </div>
            </li>
            <li className="border-b border-ink/15 py-7 last:border-b-0 first:pt-0">
              <div className="border-l-2 border-lime pl-5">
                <p className="type-body font-semibold text-ink">We answer your questions even when you can’t attend.</p>
                <p className="type-body mt-1 font-normal text-ink/75">Send them in ahead of time, and we’ll answer them on the call.</p>
              </div>
            </li>
            <li className="border-b border-ink/15 py-7 last:border-b-0 first:pt-0">
              <div className="border-l-2 border-lime pl-5">
                <p className="type-body font-semibold text-ink">Every session is recorded,</p>
                <p className="type-body mt-1 font-normal text-ink/75">so you can rewatch whenever you need to.</p>
              </div>
            </li>
            <li className="border-b border-ink/15 py-7 last:border-b-0 first:pt-0">
              <div className="border-l-2 border-lime pl-5">
                <p className="type-body font-semibold text-ink">Direct email access to me.</p>
                <p className="type-body mt-1 font-normal text-ink/75">For these eight founding CEOs only, you can email me between calls when you’re working through your roadmap, weighing a platform, or stuck on a decision. I don’t normally offer this, and I won’t offer it at this level again.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* MARKETING */}
      <section className="section-ink grain">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <p className="font-display text-[clamp(1.125rem,2vw,1.5rem)] font-bold uppercase leading-tight tracking-[0.04em] text-lime">Included: eight weeks of marketing and content</p>
          <span aria-hidden="true" className="mt-3 block h-[2px] w-12 bg-lime" />
          <h2 className="type-h2-caps-light mt-6 max-w-[24ch] !font-semibold"><span className="block">Your competitors are learning to produce more marketing at a fraction of the cost</span><span className="mt-[18px] block">Are you?</span></h2>
          <div className="mt-10 grid gap-6 text-foreground/80 lg:grid-cols-2 lg:gap-16">
            <P>Marketing is usually where CEOs feel this shift first. The way customers find you, trust you and buy from you is changing fast, and AI has rewritten content economics. A small team can now research, create and distribute what used to take an agency, and the companies that figure it out first will take attention from everyone who doesn’t.</P>
            <div>
              <P>The weekly marketing call takes what you’re learning in the CEO curriculum and applies it to the part of your business that brings customers in.</P>
              <P className="mt-6 hidden lg:block">This isn’t about flooding the internet with more content. It’s about a marketing operation that connects with the right people and grows your business without your costs growing at the same rate. I’ve been building brands since social media began, and we run these systems in our own businesses today.</P>
            </div>
          </div>
          <div className="mt-12 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {MARKETING.map(([t, b], i) => (
              <div key={t} className="border-b border-border py-6 sm:pr-6 lg:[&:nth-child(-n+4)]:border-b">
                <p className="font-display text-[18px] font-bold uppercase leading-none tracking-[0.04em] text-lime md:text-[19px]">Week {i + 1}</p>
                <p className="mt-2 font-display text-[24px] font-semibold uppercase leading-[1.05] text-foreground md:text-[26px]">{t.replace(/^Week \d+\.\s*/, "").replace(/\.$/, "")}</p>
                <p className="type-body-sm mt-2 text-foreground/70">{b}</p>
              </div>
            ))}
          </div>
          <P className="mt-12 text-foreground/80 lg:hidden">This isn’t about flooding the internet with more content. It’s about a marketing operation that connects with the right people and grows your business without your costs growing at the same rate. I’ve been building brands since social media began, and we run these systems in our own businesses today.</P>
        </div>
      </section>

      {/* PEERS */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-8 py-20 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:py-24`}>
          <h2 className="type-h1-condensed max-w-[16ch]">Seven other CEOs in your corner</h2>
          <P className="text-ink/80">Running a company can be lonely. People depend on you, and the hardest calls still land on your shoulders. In this program, you’ll be in the room with seven other CEOs going through the same change, bringing real problems, hearing how others are handling them and sharing what’s working. Some of the most valuable conversations will happen between the CEOs themselves.</P>
        </div>
      </section>

      {/* VALUE */}
      <section className="section-ink">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <h2 className="type-h1-condensed max-w-[16ch] lg:max-w-none">What this is worth to you</h2>
          <P className="mt-6 text-foreground/80">Let’s talk about the return, because that’s what a CEO should be asking.</P>
          <div className="mt-12 grid gap-10 border-t border-border pt-10 md:grid-cols-3">
            {[
              ["Your time.", "Our goal is to get you back at least 10 to 20 hours a week. Put a price on your time. At $200 an hour, 10 hours a week is $2,000 a week, or more than $100,000 a year. At that rate, the program pays for itself in the first two weeks, and that’s before you count the work your team gets back."],
              ["Your money.", "Every roadmap I build is designed to find savings and growth worth many times what you invest. Across the businesses I look at, I expect the opportunities we uncover to be worth 30 to 40 times the cost of this program."],
              ["The mistakes you don’t make.", "One wrong platform, one agent nobody uses, one hire for a role that’s about to change. Any one of those can cost more than this entire program, and most CEOs are making those calls right now without knowing it. Knowing what not to spend money on may be the most valuable thing you take away."],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="type-h3-caps-light text-lime lg:text-[clamp(1.25rem,2.4vw,2.125rem)]!">{t.replace(/\.$/, "")}</h3>
                <p className="type-body mt-4 text-foreground/80">{b}</p>
              </div>
            ))}
          </div>
          <PersuasionStatement className="mt-16" matchSize emphasis="That’s the trade.">
            $3,500 against 10 to 20 hours of your week and the most expensive mistakes in this space.
          </PersuasionStatement>
        </div>
      </section>

      {/* WHY 3500 */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-12 py-20 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:py-28`}>
          <h2 className="type-h2-caps">Why $3,500, and why only eight</h2>
          <div className="space-y-6 text-ink/80">
            <P>Add it up. Four private calls with me, a personal assessment of you and your company, your AI strategy, your Key Findings Report and a built-out 30/60/90-day roadmap. Then, eight weeks with me as your Chief AI Officer: 24 live sessions and direct email access.</P>
            <P>The Phase 1 work alone (your assessments, Key Findings Report and roadmap) normally runs $5,000 to $15,000, depending on the size of the company. At $3,500, you’re getting it for less than my lowest price, with eight weeks of training, the marketing track and me as your Chief AI Officer included. And if you hired someone genuinely good to do personalized AI strategy and implementation work at this level today, you’d be paying $25,000 and up. The people charging less are usually learning on your dime.</P>
            <P>So why $3,500? Because right now, eight strong success stories are worth more to me than the margin on this first group. We’re taking this program to a much bigger market at its full price, and before we do, I want real businesses and real results behind it. With your permission, yours will be one of them. Some of you may keep working with us afterward. That’s entirely your call.</P>
            <P>It’s eight because the personal work takes real time, and I won’t take on more CEOs than I can serve properly. I want the right eight, not just the first eight, so if you’d like to talk before you join, I’m happy to get on a short call. This is the founding group, and it won’t run at this price again.</P>
            <P className="font-semibold text-ink">And because you’re a founding member, your access never ends. As more groups come through, you’re welcome to join their live training calls, and every new training we add on these subjects is yours for free. You’ll stay up to date on everything we’re building and learning. Founding members get lifetime access.</P>
          </div>
        </div>
      </section>

      {/* ENROLL */}
      <section id="enroll" className="section-ink grain scroll-mt-20">
        <div className={`${SHELL} py-20 lg:py-28`}>
          <Label>Enrollment closes Friday, December 11</Label>
          <P className="mt-4 text-foreground/80">Or sooner, the moment all eight seats are filled. Your personal assessments start the day you join, and the live group sessions begin Monday, January 4. Seats are confirmed in the order they’re reserved, and only one company per industry gets in.</P>
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 className="type-h2-caps-light">Everything included</h2>
              <ul className="mt-6 border-t border-border">
                {INCLUDED.map(([t, b]) => (
                  <li key={t} className="type-body grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border-b border-border py-4 text-foreground/80">
                    <span className="text-lime" aria-hidden>✓</span>
                    <span><span className="font-semibold text-foreground">{t}</span>{b ? ` ${b}` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="self-start border-2 border-lime p-8 sm:p-10 lg:sticky lg:top-28">
              <p className="type-label-caps text-foreground/60">Total comparable value</p>
              <p className="font-display text-4xl font-bold text-foreground/50 line-through decoration-2">$45,000</p>
              <p className="type-label-caps mt-8 text-lime">Your founding investment</p>
              <p className="font-display text-[clamp(4rem,8vw,6rem)] font-bold leading-none text-foreground">$3,500</p>
              <p className="type-body mt-3 text-foreground/80">paid in full, or two payments of $1,800. Eight seats.</p>
              <p className="type-body-sm mt-6 text-foreground/70">Reserve your seat now, and we’ll get started with you right away. You can begin your assessments as soon as you join. I care a lot more about you winning than about waiting for a start date.</p>
              <div className="mt-8"><Ctas reserveOnly /></div>
            </div>
          </div>
        </div>
      </section>

      {/* WHERE THIS FITS */}
      <section className="section-cream">
        <div className={`${SHELL} grid gap-8 py-20 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:py-24`}>
          <h2 className="type-h2-caps">Where this fits</h2>
          <div className="space-y-6">
            <P className="text-ink/80">This program gives you what should come before any big AI investment: a clear picture of your business, a strategy and roadmap built on your real opportunities, an operator beside you as you start and the knowledge to lead it yourself. Larger custom builds and integrations come after, and when you’re ready, we can help with those too.</P>
            <PersuasionStatement
              tone="cream"
              matchSize
              emphasisClassName="text-ink"
              emphasis="The capability stays with you."
            >
              The transformation starts with your business.
            </PersuasionStatement>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative isolate overflow-hidden bg-ink">
        <img src={boardroom} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/35 lg:to-ink/20" />
        <div className={`${SHELL} py-24 lg:py-32`}>
          <h2 className="w-full max-w-[1100px] font-display normal-case tracking-[0.005em] text-cream">
            <span className="block text-[clamp(2.25rem,3.4vw,3rem)] font-normal leading-[1.05]">
              <span className="lg:block">The next generation of companies</span>{" "}
              <span className="lg:block">is being built right now.</span>
            </span>
            <span className="mt-6 block text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-[1.05] lg:mt-8 lg:whitespace-nowrap">Make sure yours is one of them.</span>
          </h2>
          <span aria-hidden className="mt-6 block h-[2px] w-14 bg-lime" />
          <div className="mt-10 max-w-[64ch] space-y-6 leading-[1.75] text-cream/80">
            <P>The way companies run is changing, and the way CEOs lead is changing with it. You can continue experimenting with tools and hoping the pieces come together. Or you can start with a real diagnosis, a well-defined roadmap and an operator beside you while you build what’s next.</P>
            <P>If you’re reading this, it’s because I chose you. I’ve looked at you and your business, and I’ve looked at the competitors in your field, some of whom I may know. I’m taking only one company per industry, so you get this before your competitors do, and no similar business will be in the room with you. If you want to cut waste, move faster and build a company ready for what’s coming, let’s talk.</P>
          </div>
          <div className="mt-6 max-w-[80ch] border-l-2 border-lime pl-5 leading-[1.65] text-cream/80">
            <p className="font-sans text-[clamp(1rem,1.3vw,1.125rem)] font-semibold leading-[1.65] text-pretty">
              Enrollment closes <span className="font-bold text-lime">Friday, December 11</span>, or sooner when the eight seats fill.
            </p>
            <p className="mt-3 font-sans text-[clamp(1rem,1.3vw,1.125rem)] font-normal leading-[1.65]">
              Your assessments start the day you join.
            </p>
          </div>
          <dl className="mt-14 grid grid-cols-2 border-y border-cream/20 lg:mt-16 lg:grid-cols-4">
            {[
              ["8 CEOs", "One company per industry"],
              ["8 Weeks", "Shane as your Chief AI Officer"],
              ["24 Sessions", "Live executive training"],
              ["$3,500", "Founding investment"],
            ].map(([value, description], i) => (
              <div
                key={value}
                className={`border-cream/15 p-4 sm:p-6 lg:px-8 lg:py-10 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`}
              >
                <dt className="whitespace-nowrap font-display text-[clamp(1.75rem,3.2vw,3.25rem)] font-bold uppercase leading-none text-lime">{value}</dt>
                <dd className="mt-3 font-sans text-[13px] leading-relaxed text-cream/75 sm:text-sm">{description}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 lg:mt-12"><Ctas /></div>
        </div>
      </section>
    </main>
  );
}
