/**
 * The Be Human AI Blueprint™ sales page, as data.
 *
 * **This copy is approved and reproduced verbatim.** It comes from the V4
 * design-ready document; the reference extraction used to verify it lives
 * outside this repo at `.omc/artifacts/blueprint-v4-source.txt`. Treat every
 * string here as quoted material: fix a typo if you find one, but do not
 * rewrite, tighten, or "improve" a sentence without the copy being re-approved.
 * Several of these are commercial claims — the price, the turnaround, the
 * training-data answer, the credit-toward-implementation offer — and rewording
 * them changes what the company has promised.
 *
 * The layout lives in `src/routes/be-human-ai/blueprint.tsx`. Nothing readable
 * belongs in that file, and nothing structural belongs in this one.
 *
 * **Placeholder slots stay empty rather than filled with stand-ins.** The source
 * document marks seven of them — a product mockup, Brett's headshot, the All
 * Y'all Foods logo, his testimonial, an optional video, the team portraits, and
 * two surnames. None of that content exists yet. Every consumer of these fields
 * renders nothing when they are unset, so the page is honest today and complete
 * the moment they are filled in, with no code change.
 */

export interface BlueprintSection {
  eyebrow?: string;
  heading: string;
  body?: readonly string[];
}

export interface Receivable {
  n: string;
  title: string;
  question: string;
  body: string;
}

export interface TeamMember {
  firstName: string;
  /**
   * Optional on purpose. The source document leaves two of the three as
   * bracketed placeholders, and the renderer joins these two fields so an
   * unfilled surname produces "Sid" rather than "Sid [Last Name]".
   */
  surname?: string;
  role: string;
  /**
   * Optional, and empty for two of the three on purpose. The source document
   * gives a credentials line only for Shane; Sid's and Maya's qualifications
   * appear inside their bios instead. Writing one for them would be inventing
   * approved copy, so the renderer omits the line when it is unset.
   */
  credentials?: string;
  bio: string;
  /** Unset today — no portrait set exists for these three. */
  portraitUrl?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export const BLUEPRINT_META = {
  eyebrow: "Human + AI Transformation",
  productName: "The Be Human AI Blueprint™",
  ctaLabel: "Book Your Blueprint",
} as const;

export const HERO = {
  heading: "Artificial Intelligence Will Change Every Business.",
  standfirst:
    "The organizations that thrive will not simply adopt AI. They will redesign themselves around it - with human judgment still leading every decision that matters.",
  body: [
    "Artificial intelligence is already inside your business. Your employees are using it. Your competitors are investing in it. New tools are being released every week.",
    "The question is no longer whether AI becomes part of your organization. It already has.",
    "The real question is whether your organization is intentionally shaping AI - or whether AI is quietly reshaping your organization without a clear strategy.",
    "Without clear leadership, teams begin solving the same problems in different ways. Processes drift. Decisions become inconsistent. Customer experiences vary.",
    "AI does not create that chaos. It accelerates it.",
    "The greatest risk is not falling behind. It is moving forward without a strategy.",
    "That is why we created The Be Human AI Blueprint™ - a clear starting point for leadership before implementation begins.",
  ],
  pullQuote: "Human judgment leads. AI accelerates execution.",
  provenance:
    "Indigenous-founded. Canadian-built. Designed to help organizations stay in control of their data, their decisions, and their future.",
  kicker: "Not smarter tools. A stronger organization.",
} as const;

export const PROBLEM = {
  eyebrow: "The problem",
  heading: "Most companies are implementing AI backwards.",
  intro: [
    'They start by asking, "What can we automate?"',
    'They should be asking, "What should humans still own?"',
    "The distinction sounds simple. The organizational difference is enormous.",
    "The companies creating the greatest advantage with AI are not adopting the most tools. They are redesigning how people, process, and technology work together. Most organizations have not done that yet.",
  ],
  points: [
    {
      heading: "AI is already inside your organization.",
      body: "Employees are already using ChatGPT, Copilot, Claude, and other AI tools - often without leadership knowing where, how, or why. Some are saving hours every week. Others are quietly creating risk. Without direction, every employee begins inventing their own way of working.",
    },
    {
      heading: "You are losing visibility and control.",
      body: "As AI spreads, it becomes harder to see where information is going, which tools touch it, and who is accountable for the decisions it influences. Governance does not slow innovation. It protects it. Most organizations do not discover how much control they have lost. They find out when something goes wrong.",
    },
    {
      heading: "You have AI tools - but no AI strategy.",
      body: "Experimentation is not a strategy. Without one, opportunities are missed, investments are duplicated, employees remain uncertain, and leaders cannot clearly say where AI creates value - or where judgment still has to lead.",
    },
  ],
  close: [
    "AI does not improve organizations. It reveals them.",
    "Align the organization first, and AI compounds that alignment. Leave it fragmented, and AI compounds the fragmentation just as quickly.",
    "That is why transformation does not start with technology. It starts with leadership.",
  ],
} as const;

export const APPROACH = {
  eyebrow: "Our approach",
  heading: "Three moments every organization must get right.",
  intro: [
    'Most AI companies ask, "What should we build?"',
    'We ask a different question: "What kind of organization are we building?"',
    "Because that answer determines everything that follows.",
    "We begin with your business, your leaders, and your people - before touching a single tool. We identify where humans create the greatest advantage first, then determine where AI creates the greatest leverage.",
  ],
  pullQuote: "Prepare your people. Protect your organization. Transform your business.",
  kicker:
    "Not three disconnected services. One complete approach to becoming a human-first, AI-powered organization.",
} as const;

export const SOVEREIGNTY = {
  eyebrow: "Canadian trust, sovereignty & stewardship",
  heading: "Speed without trust is not transformation. It is exposure.",
  body: [
    "The Be Human Company was built around one shared belief: successful AI transformation is not simply a technology challenge. It is an organizational one.",
    "We are an Indigenous-founded Canadian company. Trust, responsibility, and stewardship are not features we add after the technology. They are the foundation we build from.",
    "We define sovereignty as control - over your data, your decisions, your operations, and your future. That is a leadership question long before it becomes a compliance question.",
    "For Canadian organizations, it also means understanding how PIPEDA, Quebec's Law 25, and the implications of the U.S. CLOUD Act may affect the way AI systems handle information. Those conversations need to happen before AI becomes embedded in the business - not after.",
  ],
  disciplines: "Business leadership. Technology and governance. Human behaviour.",
  questionsHeading: "As AI becomes part of everyday business, leaders face real questions:",
  questions: [
    "Where is our data going?",
    "Who controls it?",
    "Which systems have access to it?",
    "Who is accountable when AI influences or gets a decision wrong?",
    "What information should never leave our organization?",
  ],
  close: [
    "These are not merely technology questions. They are leadership questions.",
    "That is why every engagement begins by mapping governance, data flows, and sovereignty exposure before a single AI agent is designed or deployed.",
  ],
  pullQuote:
    "AI adoption without trust is not transformation. It is exposure - of your data, your decisions, your operations, and your future.",
} as const;

export const COMMITMENTS = {
  eyebrow: "Our commitments",
  heading: "Accountability should never belong to software.",
  items: [
    {
      n: "01",
      title: "Human review before client delivery",
      body: "No client-facing output is delivered without a human who has reviewed it, approved it, and stands behind it. No exceptions.",
    },
    {
      n: "02",
      title: "Humans make the final call",
      body: "AI can inform a decision. It never owns the judgment. The decisions that shape your organization remain human responsibilities.",
    },
    {
      n: "03",
      title: "Transparency around Canadian data",
      body: "If your information will pass through non-Canadian AI infrastructure, you will know before it happens - not after.",
    },
    {
      n: "04",
      title: "Every AI system has a human owner",
      body: "Every system we build or recommend has a named person responsible for its direction, oversight, and outcomes.",
    },
  ],
} as const;

export const OFFER_INTRO = {
  heading: "Your executive AI assessment and 90-day transformation plan.",
  standfirst:
    "A concise executive briefing built to be read quickly, discussed live, and acted on immediately.",
  body: [
    "The challenge is not whether to adopt AI. It is deciding where AI creates real value, where judgment must remain human, and how to move forward with confidence.",
    "The Be Human AI Blueprint™ is a focused executive assessment built to answer those questions before you invest significant time, money, or resources in implementation.",
    "We begin with how your organization operates today, how AI is already being used, where the greatest opportunities exist, and where governance, security, and sovereignty need attention.",
    "By the end, you will know where AI creates the greatest leverage, what must be protected, what to do first, and which priorities will matter most over the next 90 days.",
    "Implement the roadmap internally or bring us in to build it. Either way, the strategy is built around your organization - not someone else's template.",
  ],
  pullQuote: "Technology is not the starting point. Leadership is.",
  audience: {
    heading: "Who It Is For",
    body: [
      "Canadian organizations that want to adopt AI intentionally rather than reactively. Leaders who want clarity before they commit, confidence before they invest, and a roadmap that does not trade governance for speed.",
      "Whether you are just beginning or already using AI across the business, the Blueprint gives leadership a shared starting point: the truth about where the organization actually stands.",
    ],
  },
  why: {
    heading: "Why We Start Here",
    body: [
      "The fastest way to waste money on AI is to implement before you understand.",
      "You do not need another presentation. You need a decision.",
      "That is exactly what the Be Human AI Blueprint™ was built to provide.",
    ],
  },
} as const;

export const RECEIVABLES = {
  eyebrow: "What you'll receive",
  heading: "Four decisions. Not a hundred pages.",
  standfirst:
    "Not a report that sits in a folder. A concise executive briefing designed to be read in fifteen minutes, walked through live with your leadership team, and acted on the same week.",
  note: "Every Blueprint closes with our direct recommendation on where to start.",
  items: [
    {
      n: "01",
      title: "Executive Findings",
      question: "Where are we today?",
      body: "Leadership readiness, employee AI usage, the organization's real strengths, and its most important risks - stated plainly and specifically.",
    },
    {
      n: "02",
      title: "AI Opportunity Map",
      question: "What should we do first?",
      body: "The highest-impact AI opportunities, ranked by effort and business value, each with a recommended human owner.",
    },
    {
      n: "03",
      title: "Risk & Governance Review",
      question: "What should we protect?",
      body: "Shadow AI exposure, data flows, governance gaps, cybersecurity concerns, and Canadian sovereignty considerations - with what to address first.",
    },
    {
      n: "04",
      title: "90-Day Action Plan",
      question: "What happens next, in order?",
      body: "The first 30 days, the next 30, and the final 30. Every priority has an owner and an expected outcome. Actionable even if we are not in the room.",
    },
  ] as readonly Receivable[],
  kicker: "Not a list of findings. A decision.",
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  heading: "From conversation to clarity in three business days.",
  steps: [
    {
      n: "01",
      title: "Discovery",
      body: "A conversation, not a pitch. We learn your business, your team, and where AI already shows up in the organization - approved or not.",
    },
    {
      n: "02",
      title: "Assessment",
      body: "We assess leadership and employee readiness, governance and data flow, risk exposure, and where AI creates meaningful leverage in your specific workflows.",
    },
    {
      n: "03",
      title: "Executive Strategy Session",
      body: "We bring the findings back to your leadership team live. Not a document that sits in an inbox - a working conversation that ends with a clear recommendation on where to start.",
    },
  ],
  kicker: "Three business days. No long-term contract.",
} as const;

export const COST_OF_WAITING = {
  eyebrow: "What waiting actually costs",
  heading: "AI adoption does not pause while leadership decides what to do next.",
  body: [
    "Employees continue testing tools. New workflows emerge. Business information moves through systems that may not have been reviewed, approved, or governed consistently.",
    "Over time, those individual decisions become organizational habits.",
    "The real cost is not simply that another company moves faster. It is that the distance between using AI and controlling AI keeps growing inside your own business.",
    "The longer ownership remains unclear, the harder it becomes to create one strategy, one standard, and one accountable way forward.",
  ],
  pullQuote:
    "The Blueprint does not manufacture urgency. It reveals the exposure, opportunity, and decisions that already exist.",
} as const;

export const OFFER = {
  eyebrow: "The offer",
  heading: "The Be Human AI Blueprint™",
  rateLabel: "Founding Organization Rate",
  intro:
    "We remain intentionally small so every Blueprint is led directly by the people responsible for the engagement - not passed to a junior consultant or rotating account team.",
  availability:
    "For a limited number of founding organizations, the complete Be Human AI Blueprint™ is available at:",
  price: "$795 CAD",
  priceNote: "Founding organization rate",
  compareAtPrice: "$1,500 CAD",
  compareAtNote: "Future rate",
  turnaround: "3 business days",
  turnaroundNote: "From discovery to clarity",
  inclusionsLabel: "Your Blueprint includes:",
  inclusions: [
    "Executive Findings",
    "AI Opportunity Map",
    "Risk & Governance Review",
    "90-Day Action Plan",
    "Live Executive Strategy Session",
    "Completion in approximately three business days",
  ],
  credit:
    "If you choose to have us build any of the recommended AI systems, workflows, or agents, your full Blueprint investment will be credited toward the implementation.",
  terms: "No long-term contract. No obligation to continue.",
} as const;

export const TEAM = {
  eyebrow: "Built for human-first AI transformation",
  heading: "No single discipline can lead AI transformation alone.",
  intro: [
    "AI is changing how organizations lead, decide, govern, and grow - all at once. That is why The Be Human Company brings business leadership, cybersecurity, governance, and human behaviour together.",
    "Not one generalist. Not the latest tool. A team built around the full challenge.",
    "Our role is not simply to implement AI. It is to help you build a stronger organization because of it.",
  ],
  membersHeading: "The Team Behind Your Transformation",
  membersIntro: [
    "We stay intentionally small so every client works directly with the people leading the engagement - not a rotating account team or junior consultants.",
    "AI helps us research faster, analyze more deeply, and execute more efficiently. It expands our capability. It never replaces our accountability.",
  ],
  members: [
    {
      firstName: "Shane",
      surname: "James",
      role: "Founder & CEO",
      credentials: "Entrepreneur · Business strategist · Executive advisor",
      bio: "As a multi-business entrepreneur, Shane brings an operator's perspective to AI transformation. He works directly with founders and leadership teams to determine where AI can create lasting business advantage - and where human judgment must remain central.",
    },
    {
      firstName: "Sid",
      role: "AI, Cybersecurity & Governance",
      bio: "Sid leads AI implementation, cybersecurity, governance, and data sovereignty. As a certified cybersecurity professional, he brings the discipline most AI adoption is missing entirely - the same rigor that protects a network now applied to protecting your data, your decisions, and your systems as AI enters them. He builds the secure foundation, defines the guardrails, and protects the information, systems, and decisions that matter most.",
    },
    {
      firstName: "Maya",
      role: "Human Readiness & Organizational Change",
      bio: "Maya leads the human side of transformation. As a certified counsellor, she brings a deep understanding of behaviour, communication, trust, and resistance to change - helping leaders and employees build the confidence and alignment that make AI adoption stick.",
    },
  ] as readonly TeamMember[],
  close: {
    heading: "One team. One shared purpose.",
    body: "AI will continue to evolve. Human leadership will continue to matter. Together, we help Canadian organizations adopt AI responsibly, strengthen their people, protect what matters, and build for what comes next.",
  },
} as const;

export const FIT = {
  eyebrow: "Who we work best with",
  heading: "The Blueprint works best for leaders who want AI on purpose - not by accident.",
  goodFitHeading: "We do our strongest work with leaders who:",
  goodFit: [
    "Want AI adopted intentionally, not chased tool by tool.",
    "Believe governance, security, and trust matter as much as speed.",
    "See their people as the advantage - not simply a cost to reduce.",
    "Want a clear strategy first, followed by implementation that actually serves it.",
    "Want a trusted advisor, not another software vendor.",
  ],
  poorFitHeading: "We may not be the right fit if...",
  poorFit: [
    "You are looking for the cheapest possible implementation, a contractor to build an agent without understanding the business, or a vendor who simply executes instructions without challenging the decisions behind them.",
    "We would rather say that upfront. The right partnership creates better outcomes for everyone.",
  ],
} as const;

export const FAQS: readonly FaqEntry[] = [
  {
    question: "How long does the Blueprint take?",
    answer:
      "Most Blueprints are completed in approximately three business days, followed by a live Executive Strategy Session with your leadership team.",
  },
  {
    question: "How much time is required from our team?",
    answer:
      "A discovery conversation, plus input from a small number of key people. We do the heavy lifting so your team can stay focused on the business.",
  },
  {
    question: "What happens after the Blueprint?",
    answer:
      "Nothing you do not choose. Implement the roadmap internally, bring in another partner, or continue with us for implementation or ongoing advisory support. Our job is to create clarity - not lock you into a long-term engagement.",
  },
  {
    question: "Can you work alongside our existing IT provider or software vendors?",
    answer:
      "Yes. The Blueprint is strategy and governance first. We often help organizations get more value from the systems, vendors, and technology they already have.",
  },
  {
    question: "What size organizations do you work with?",
    answer:
      "Our primary focus is Canadian organizations with approximately 5 to 100 employees, where founders or leadership teams remain close to strategic decisions. Larger organizations are welcome to reach out; the scope may simply expand.",
  },
  {
    question: "What if we are already using AI across the business?",
    answer:
      "That is common. The Blueprint brings structure, ownership, governance, and prioritization to what is already happening.",
  },
  {
    question: "What if we have never used AI before?",
    answer:
      "That is also fine. The Blueprint meets the organization where it is and establishes an honest starting point.",
  },
  {
    question: "Is our data used to train AI models?",
    answer:
      "No. Your information is used solely to complete your Blueprint. It is not used to train our systems or anyone else's.",
  },
  {
    question: "Can you work with us remotely or on-site?",
    answer:
      "Yes. Most Blueprint work can be completed remotely without sacrificing quality. On-site work is available where it adds value.",
  },
];

export const THRIVE = {
  eyebrow: "The organizations that will thrive",
  heading: "AI will become available to everyone. Human judgment will not.",
  body: [
    "The organizations that thrive will not be the ones that adopted AI fastest.",
    "They will be the ones that built leaders who decide well, teams that change with confidence, and trust that holds while everything else accelerates.",
  ],
  pullQuote:
    "Technology will keep moving. The advantage belongs to the organizations that move human judgment forward with it.",
} as const;

export const CLOSING = {
  eyebrow: "Ready to build a stronger organization?",
  heading:
    "The Be Human AI Blueprint™ gives your leadership team the clarity to know where you stand, what to protect, and what to do next - in three business days, not three months.",
  standfirst: "Book your Blueprint. Build an organization the AI era cannot shake.",
  terms:
    "Founding organization rate: $795 CAD · Future rate: $1,500 CAD · Full Blueprint investment credited toward eligible implementation",
} as const;

/**
 * Client proof.
 *
 * Deliberately empty. The source document reserves this section for Brett
 * Christoffel of All Y'all Foods with a headshot, a company logo, an optional
 * video, and a quote — and marks the quote itself as a placeholder. None of it
 * has been supplied or approved for publication, and a testimonial is precisely
 * the kind of content that must not be approximated. The proof sections render
 * nothing while this is empty and appear complete the moment it is filled in.
 */
export const CLIENT_PROOF = {
  eyebrow: "Client proof",
  heading: "Built for Real Business Decisions",
  standfirst:
    "The strongest proof will come from the leaders who have used the Blueprint to make clearer, more confident decisions.",
  testimonial: {
    quote: null,
    author: null,
    role: null,
    organization: null,
    headshotUrl: null,
    logoUrl: null,
    videoUrl: null,
  },
} as const;
