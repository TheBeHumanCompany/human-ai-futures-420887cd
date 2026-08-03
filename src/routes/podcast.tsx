import { createFileRoute } from "@tanstack/react-router";
import podcastImage from "@/assets/podcast.jpg";
import { EpisodePlayer } from "@/components/episode-player";
import { formatDuration, getEpisodes } from "@/lib/podbean";

export const Route = createFileRoute("/podcast")({
  loader: async () => ({ episodes: await getEpisodes() }),
  head: () => ({
    meta: [
      { title: "The People-Driven CEO Podcast — The Be Human Company" },
      {
        name: "description",
        content:
          "Conversations on leadership, AI, culture and building organizations where humanity becomes the competitive advantage.",
      },
      { property: "og:title", content: "The People-Driven CEO Podcast" },
      {
        property: "og:description",
        content: "Where leaders prepare for the New Human Era.",
      },
    ],
  }),
  component: Podcast,
});

const PUBLISHED = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
});

function Podcast() {
  const { episodes } = Route.useLoaderData();

  return (
    <>
      <section className="section-ink grain border-b border-border">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <p className="eyebrow text-lime">The People-Driven CEO Podcast</p>
            <h1 className="display mt-6 text-[clamp(2.5rem,6vw,5rem)]">
              Where leaders prepare for the New Human Era.
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Conversations on leadership, AI, culture and building organizations where humanity
              becomes the competitive advantage.
            </p>
            <a
              href="#episodes"
              className="eyebrow mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-ink"
            >
              Listen now <span aria-hidden>→</span>
            </a>
          </div>
          <img
            src={podcastImage}
            alt="Studio condenser microphone lit in a dark recording room"
            loading="lazy"
            width={1200}
            height={900}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>

      <section id="episodes" className="section-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="eyebrow text-ink/50">All episodes</h2>
            {episodes.length > 0 && (
              <span className="eyebrow text-ink/40">{episodes.length} episodes</span>
            )}
          </div>

          {episodes.length === 0 ? (
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/60">
              Episodes are taking a moment to load. Please refresh, or listen on your usual podcast
              app.
            </p>
          ) : (
            <ul className="mt-8 border-t border-hairline-dark">
              {episodes.map((episode) => (
                <li key={episode.guid} className="border-b border-hairline-dark py-6">
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-8">
                    <span className="eyebrow text-ink/40">{episode.episodeNumber ?? "—"}</span>
                    <div className="min-w-0">
                      <h3 className="display text-2xl text-ink sm:text-3xl">{episode.title}</h3>
                      <p className="mt-1 text-sm text-ink/60">
                        {episode.guest ? `With ${episode.guest} · ` : ""}
                        {PUBLISHED.format(new Date(episode.pubDate))}
                      </p>
                    </div>
                    <span className="eyebrow text-ink/50">
                      {formatDuration(episode.durationSeconds)}
                    </span>
                  </div>
                  <EpisodePlayer
                    src={episode.audioUrl}
                    title={episode.title}
                    durationSeconds={episode.durationSeconds}
                    tone="cream"
                    className="mt-4 max-w-xl"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
