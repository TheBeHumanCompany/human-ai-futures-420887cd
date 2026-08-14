import { createFileRoute } from "@tanstack/react-router";

import { PillarPage } from "@/components/sales/pillar-page";
import { pillarBySlug } from "@/lib/sales/pillars";

const pillar = pillarBySlug("governance");

export const Route = createFileRoute("/be-human-ai/governance")({
  head: () => ({
    meta: [
      { title: "Security, Governance & Sovereignty — Protect your organization | Be Human AI" },
      {
        name: "description",
        content:
          "Governance gaps, data flows, shadow AI exposure and sovereignty — assessed across six domains and 56 of the 72 controls in the governance spine.",
      },
      {
        property: "og:title",
        content: "Security, Governance & Sovereignty — Protect your organization",
      },
      {
        property: "og:description",
        content: "Are you still in control of your data, your decisions, and your future?",
      },
    ],
  }),
  component: () => <PillarPage pillar={pillar} />,
});
