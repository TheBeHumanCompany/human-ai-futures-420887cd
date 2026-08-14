import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Placeholder for the Be Human AI Blueprint™ flagship sales page.
 *
 * **It throws rather than rendering an empty component on purpose.** This branch syncs to
 * Lovable and deploys to Vercel, so between the routing commit and the content commit this
 * URL is publicly reachable. A blank page reads as a broken product; a 404 reads as a page
 * that does not exist yet, which is the truth. The generated route tree is built from file
 * paths and never from component bodies, so the routing spike this file exists to prove is
 * unaffected either way.
 *
 * Replaced wholesale in the Blueprint content commit.
 */
export const Route = createFileRoute("/be-human-ai/blueprint")({
  component: () => {
    throw notFound();
  },
});
