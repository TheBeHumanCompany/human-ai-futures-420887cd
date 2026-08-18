import { createFileRoute } from "@tanstack/react-router";

import { PillarPage, type PillarSection } from "@/components/pillar-page";

export const Route = createFileRoute("/be-human-ai/ai-strategy")({
  head: () => ({
    meta: [
      { title: "AI Strategy — Transform Your Business | Be Human AI" },
      {
        name: "description",
        content:
          "AI opportunity ranking, workflow transformation and a 90-day roadmap — ranked by business value and effort, not by what is trending.",
      },
      { property: "og:title", content: "AI Strategy — Transform Your Business" },
      {
        property: "og:description",
        content: "Use AI where it creates leverage. Keep humans where they create advantage.",
      },
    ],
  }),
  component: AiStrategy,
});

const SECTIONS: readonly PillarSection[] = [
  {
    id: "sequence",
    heading: "Strategy comes third, on purpose",
    body: (
      <p>
        Only after your people are prepared and what matters most is protected do we identify where
        AI creates the greatest impact. Run in the other order, an opportunity map becomes a list of
        things the organization is not yet able to do safely.
      </p>
    ),
  },
  {
    id: "ranking",
    heading: "Ranked by value and effort, not by what is trending",
    body: (
      <>
        <p>
          We rank opportunities across workflows, operations, and customer experience by business
          value, implementation effort, and long-term advantage. Each one carries a recommended
          human owner, because an opportunity without a name attached is a slide, not a plan.
        </p>
        <p>
          Experimentation is not a strategy. Without one, investments get duplicated, employees stay
          uncertain, and leaders cannot say clearly where AI creates value or where judgment still
          has to lead.
        </p>
      </>
    ),
  },
  {
    id: "workflows",
    heading: "Transformation happens in workflows, not in tools",
    body: (
      <p>
        The organizations creating the greatest advantage with AI are not the ones adopting the most
        tools. They are redesigning how people, process, and technology work together. That work
        happens inside specific workflows, with the people who run them.
      </p>
    ),
  },
  {
    id: "roadmap",
    heading: "A 90-day roadmap you can run without us",
    body: (
      <p>
        The first thirty days, the next thirty, and the final thirty. Every priority has an owner
        and an expected outcome. Implement it internally, bring in another partner, or continue with
        us — the roadmap is built around your organization, not someone else's template, and it is
        actionable even if we are not in the room.
      </p>
    ),
  },
];

const FOCUS = ["AI opportunity ranking", "Workflow transformation", "90-day roadmap"] as const;

function AiStrategy() {
  return (
    <PillarPage
      kicker="Be Human AI · Transform your business"
      title="AI Strategy"
      lede="Where AI creates real business leverage in your organization, ranked and sequenced — and where human judgment stays in charge."
      question="Where does AI create the greatest business leverage?"
      sections={SECTIONS}
      focusAreas={FOCUS}
    />
  );
}
