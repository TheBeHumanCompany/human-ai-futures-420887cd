import { UserProfile, useClerk } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

import { requireSignedIn } from "@/lib/client-portal/portal";

/**
 * The signed-in client's Clerk account page, served on the portal host only.
 *
 * A splat route because Clerk's path-routed `UserProfile` renders subpaths
 * like `/profile/security` — the same reason `sign-in.$.tsx` is a splat.
 * The loader is the gate: an unsigned visitor is redirected to sign-in
 * before anything renders. `noindex` plus `X-Robots-Tag` mirror
 * `portal.tsx` — an account page is never an advertising surface.
 */
export const Route = createFileRoute("/profile/$")({
  loader: async () => await requireSignedIn(),

  head: () => ({
    meta: [{ title: "Your profile" }, { name: "robots", content: "noindex" }],
  }),

  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: ProfilePage,
});

function ProfilePage() {
  const { signOut } = useClerk();
  return (
    <section className="section-cream">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-12 sm:px-8">
        <p className="eyebrow">Your account</p>
        <UserProfile routing="path" path="/profile" />
        {/* Sign-out is page content, not chrome — the portal header carries
            exactly two controls (Portal, Profile), so the session exit lives
            here. Redirect back into the portal, never to the marketing
            homepage. */}
        <button
          type="button"
          data-testid="profile-sign-out"
          onClick={() => void signOut({ redirectUrl: "/portal" })}
          className="eyebrow mt-10 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream"
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
