import { createFileRoute } from "@tanstack/react-router";

/**
 * The Human Archive — held back, on purpose (Sid, 2026-08-19).
 *
 * The four entries are real and still ship: `HumanArchiveSection` on the
 * homepage and the portrait row on `/the-new-human-era` both render them from
 * `ARCHIVE`. What is deferred is this page as a *destination* — the full grid
 * and the per-person entries at `/human-archive/$slug`, which were placeholder
 * pages that promised a conversation the site could not yet show.
 *
 * So the page keeps its hero and says plainly that the rest is coming. The
 * route stays live rather than being pulled from the nav: it is linked from
 * the bar, from the homepage section and from `/the-new-human-era`, and a
 * destination that admits it is not ready is better than three dead ends.
 *
 * Restoring it is a revert, not a rebuild — the grid and the `$slug` route are
 * intact in git at the commit before this one, and `ARCHIVE` never moved.
 */
export const Route = createFileRoute("/the-human-archive")({
  head: () => ({
    meta: [
      { title: "The Human Archive — Coming Soon" },
      {
        name: "description",
        content:
          "A growing archive of conversations, experiences and perspectives exploring what it means to be human. Being prepared now — published here soon.",
      },
      { property: "og:title", content: "The Human Archive — Coming Soon" },
      {
        property: "og:description",
        content: "Documentary portraits and conversations from around the world. Coming soon.",
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">The Human Archive</p>
          <h1 className="type-h1-caps-light mt-6 text-ink">
            Real stories.
            <br />
            Real humans.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
            We ask people around the world one question: what does it mean to be human? These are
            some of the answers.
          </p>
        </div>
      </section>

      {/* The deferral itself. Deliberately headingless — the page's outline is
          the h1 above plus the footer, and a second heading here would change
          the document structure the typography gate pins. */}
      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-lime" aria-hidden />
            <p className="type-label-caps text-cream">To be released soon</p>
          </div>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-cream/70">
            We are still putting this together. The portraits, the conversations and the answers
            will be published here as one archive rather than in pieces.
          </p>
        </div>
      </section>
    </>
  );
}
