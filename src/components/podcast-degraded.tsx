const PODBEAN_SHOW_URL = "https://shanejjamesgroup.podbean.com/";

/**
 * The body a visitor sees when Sanity cannot be reached.
 *
 * It exists so an outage is *visible* rather than silent. The alternative —
 * rendering an empty catalogue, or a 404 — makes a false claim: one says the
 * show has no episodes, the other says this episode is gone, and the second is
 * a permanent instruction to a crawler about a URL someone has already shared.
 *
 * So this page says the true thing, and then does the useful thing: it sends
 * the visitor to Podbean, where every episode is playable regardless of what
 * our CMS is doing. Someone who followed a link to hear an episode can still
 * hear it.
 *
 * Shared by the episode route and the directory route, which is why the copy is
 * about the archive rather than about one episode — the episode route reaches
 * here without loader data, so it does not know which episode was asked for.
 */
export function PodcastDegraded() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-ink/60">Temporarily unavailable</p>

        <h1 className="mt-4 font-display text-3xl sm:text-4xl">
          Episodes are temporarily unavailable
        </h1>

        <p className="mt-6 text-base leading-relaxed text-ink/80">
          We could not reach the episode archive just now. This is a problem on our side and it is
          usually brief — the episode has not gone anywhere, and this link will keep working.
        </p>

        <p className="mt-4 text-base leading-relaxed text-ink/80">
          In the meantime, every episode is available on Podbean.
        </p>

        <a
          className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90"
          href={PODBEAN_SHOW_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen on Podbean
        </a>
      </div>
    </section>
  );
}
