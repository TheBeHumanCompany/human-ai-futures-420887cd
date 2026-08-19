import { createFileRoute } from "@tanstack/react-router";

import { PillarPage, type PillarSection } from "@/components/pillar-page";

export const Route = createFileRoute("/be-human-ai/human-readiness")({
  head: () => ({
    meta: [
      { title: "Human Readiness — Prepare Your People | Be Human AI" },
      {
        name: "description",
        content:
          "Leadership readiness, employee AI usage, culture and confidence. The people work that has to happen before AI adoption can stick.",
      },
      { property: "og:title", content: "Human Readiness — Prepare Your People" },
      {
        property: "og:description",
        content: "Every successful AI transformation starts with leadership, not technology.",
      },
    ],
  }),
  component: HumanReadiness,
});

const SECTIONS: readonly PillarSection[] = [
  {
    id: "leadership-first",
    heading: "Leadership readiness comes first",
    body: (
      <>
        <p>
          Every successful AI transformation starts with leadership — not technology. Before
          employees can adopt AI with confidence, leaders need clarity on where AI belongs, where
          judgment does not bend, and how the organization must evolve.
        </p>
        <p>
          Without that clarity, teams begin solving the same problems in different ways. Processes
          drift. Decisions become inconsistent. AI does not create that chaos. It accelerates it.
        </p>
      </>
    ),
  },
  {
    id: "shadow-usage",
    heading: "Your people are already using it",
    body: (
      <>
        <p>
          Employees are already using ChatGPT, Copilot, Claude and other tools — often without
          leadership knowing where, how, or why. Some are saving hours every week. Others are
          quietly creating risk.
        </p>
        <p>
          Without direction, every employee begins inventing their own way of working. We start by
          finding out what is actually happening, honestly, without it becoming an audit people
          learn to hide from.
        </p>
      </>
    ),
  },
  {
    id: "confidence",
    heading: "Confidence is the adoption problem",
    body: (
      <>
        <p>
          Resistance to AI is rarely a skills gap. It is uncertainty about what the technology means
          for a person's judgment, their standing, and their job. Training that ignores that
          produces attendance, not adoption.
        </p>
        <p>
          We build the confidence, understanding, and shared direction that make adoption hold —
          working with how people actually respond to change rather than around it.
        </p>
      </>
    ),
  },
  {
    id: "human-advantage",
    heading: "Where humans still create the advantage",
    body: (
      <p>
        Most organizations start by asking what they can automate. The more useful question is what
        humans should still own. We identify where your people create the greatest advantage first,
        and only then determine where AI creates the greatest leverage.
      </p>
    ),
  },
];

const FOCUS = ["Leadership readiness", "Employee AI usage", "Culture", "Confidence"] as const;

function HumanReadiness() {
  return (
    <PillarPage
      kicker="Be Human AI · Prepare your people"
      title="Human Readiness"
      lede="The people side of AI transformation: what leaders need to decide, what employees are already doing, and what has to be true before adoption sticks."
      question="Are your leaders and employees ready for the way AI is changing work?"
      sections={SECTIONS}
      focusAreas={FOCUS}
    />
  );
}
