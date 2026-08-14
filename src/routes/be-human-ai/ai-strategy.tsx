import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Placeholder for the AI Strategy & Transformation pillar page —
 * "Transform your business". Throws rather than rendering blank; see
 * `blueprint.tsx` for why. Replaced wholesale in the pillar content commit.
 */
export const Route = createFileRoute("/be-human-ai/ai-strategy")({
  component: () => {
    throw notFound();
  },
});
