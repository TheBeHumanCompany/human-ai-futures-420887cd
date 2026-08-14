import { createFileRoute } from "@tanstack/react-router";

import { PillarPage } from "@/components/sales/pillar-page";
import { pillarBySlug } from "@/lib/sales/pillars";

const pillar = pillarBySlug("ai-strategy");

export const Route = createFileRoute("/be-human-ai/ai-strategy")({
  head: () => ({
    meta: [
      { title: "AI Strategy & Transformation — Transform your business | Be Human AI" },
      {
        name: "description",
        content:
          "AI opportunities ranked by business value, effort and long-term advantage, with a 90-day roadmap — not by what is trending.",
      },
      { property: "og:title", content: "AI Strategy & Transformation — Transform your business" },
      {
        property: "og:description",
        content: "Use AI where it creates leverage. Keep humans where they create advantage.",
      },
    ],
  }),
  component: () => <PillarPage pillar={pillar} />,
});
