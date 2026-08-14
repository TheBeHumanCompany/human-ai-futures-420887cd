import { createFileRoute } from "@tanstack/react-router";

import { PillarPage } from "@/components/sales/pillar-page";
import { pillarBySlug } from "@/lib/sales/pillars";

const pillar = pillarBySlug("human-readiness");

export const Route = createFileRoute("/be-human-ai/human-readiness")({
  head: () => ({
    meta: [
      { title: "Human Readiness — Prepare your people | Be Human AI" },
      {
        name: "description",
        content:
          "Leadership readiness, employee AI usage, culture and confidence — assessed against the Workforce Readiness domain of a 72-control governance spine.",
      },
      { property: "og:title", content: "Human Readiness — Prepare your people" },
      {
        property: "og:description",
        content: "Every successful AI transformation starts with leadership, not technology.",
      },
    ],
  }),
  component: () => <PillarPage pillar={pillar} />,
});
