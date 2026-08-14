import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Placeholder for the Human Readiness pillar page — "Prepare your people".
 * Throws rather than rendering blank; see `blueprint.tsx` for why.
 * Replaced wholesale in the pillar content commit.
 */
export const Route = createFileRoute("/be-human-ai/human-readiness")({
  component: () => {
    throw notFound();
  },
});
