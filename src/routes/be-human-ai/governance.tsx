import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Placeholder for the Security, Governance & Sovereignty pillar page —
 * "Protect your organization". Throws rather than rendering blank; see
 * `blueprint.tsx` for why. Replaced wholesale in the pillar content commit.
 */
export const Route = createFileRoute("/be-human-ai/governance")({
  component: () => {
    throw notFound();
  },
});
