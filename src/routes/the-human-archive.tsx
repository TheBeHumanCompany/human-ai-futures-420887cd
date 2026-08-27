import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ARCHIVE_PLAYLIST_URL } from "@/lib/brand";
import { HUMAN_ARCHIVE_VIDEOS } from "@/lib/content";

/**
 * The one video this page will mount a player for at a time — module-level on
 * purpose, so "one player, ever" is a property of the page rather than of any
 * one component render. Hover, focus or tap sets it; leaving or blurring
 * clears it and the iframe UNMOUNTS (destroy, not hide — the stream stops).
 */
let activeVideo: string | null = null;

export const Route = createFileRoute("/the-human-archive")({
  head: () => ({
    meta: [
      { title: "The Human Archive — Real Stories. Real Humans." },
      {
        name: "description",
        content:
          "A growing archive of conversations, experiences and perspectives exploring what it means to be human.",
      },
      { property: "og:title", content: "The Human Archive — Real Stories. Real Humans." },
      {
        property: "og:description",
        content: "Documentary portraits and conversations from around the world.",
      },
    ],
  }),
  component: Archive,
});

function ArchiveVideoCard({
  name,
  no,
  location,
  youtubeId,
  still,
  active,
  muted,
  onActivate,
  onDeactivate,
  onToggleMute,
}: {
  name: string;
  no: string;
  location: string;
  youtubeId: string;
  still: string;
  active: boolean;
  muted: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onToggleMute: (iframe: HTMLIFrameElement | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <figure
      data-muted={muted ? "true" : "false"}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={(e) => {
        // Focus moving to the unmute button (inside this card) is not a leave.
        if (e.currentTarget.contains(e.relatedTarget)) return;
        onDeactivate();
      }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Play ${name}'s Human Archive video`}
    >
      <div className="relative overflow-hidden">
        <img
          src={still}
          alt={`Video still of ${name} from ${location}`}
          loading="lazy"
          width={800}
          height={1000}
          className="aspect-[4/5] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
        />
        {active && (
          <>
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&enablejsapi=1&rel=0`}
              allow="autoplay; encrypted-media"
              title={`${name} — Human Archive ${no}`}
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
            <button
              type="button"
              aria-label={muted ? "Unmute video" : "Mute"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute(iframeRef.current);
              }}
              className="absolute bottom-4 right-4 border border-cream/50 bg-ink/55 px-3 py-2 font-mono text-[9.5px] uppercase leading-none tracking-[0.24em] text-cream backdrop-blur-sm transition-colors hover:border-cream hover:bg-ink/80"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          </>
        )}
      </div>
      <figcaption className="mt-4">
        <p className="type-h4-caps-light">{name}</p>
        <p className="eyebrow mt-1 text-muted-foreground">
          No. {no} — {location}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Restored 2026-08-26 from the pre-deferral design (`0666fda^`): the cream
 * hero and the four-up ink grid are that page, now rendering
 * `HUMAN_ARCHIVE_VIDEOS` with hover-to-play embeds instead of stills-only
 * portraits. Captions stay styled `<p>`s — the page's pinned outline is the
 * h1 plus the footer's h3s, and a heading here would change it.
 */
function Archive() {
  const [active, setActive] = useState<string | null>(activeVideo);
  const [muted, setMuted] = useState(true);

  // A stale player id must not outlive the page: navigating away and back
  // would otherwise mount an un-hovered autoplaying iframe at load.
  useEffect(() => {
    return () => {
      activeVideo = null;
    };
  }, []);

  const activate = (youtubeId: string) => {
    // Idempotent while the same card plays: the unmute button's bubbled click
    // re-enters here, and re-activating would restart the video muted.
    if (activeVideo === youtubeId) return;
    activeVideo = youtubeId;
    setActive(youtubeId);
    setMuted(true);
  };

  const deactivate = () => {
    activeVideo = null;
    setActive(null);
    setMuted(true);
  };

  const toggleMute = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    // Synchronous with the click: this handler IS the user gesture Chrome's
    // autoplay policy requires before an embed may make sound.
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: muted ? "unMute" : "mute" }),
      "*",
    );
    setMuted(!muted);
  };

  return (
    <>
      <section className="section-cream border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
          <p className="type-label-caps text-ink/50">The Human Archive</p>
            <h1 className="type-h1-caps-light mt-6 text-ink">
              Real people
              <br />
              Real answers
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
              The Human Archive keeps real human voices inside the conversation as technology
              reshapes how we live, work, and connect. It helps us listen to what people across
              different lives and backgrounds say matters most — and allows those answers to help
              shape the future we’re building. We ask one question: <strong>what does it mean to be human?</strong>
            </p>
        </div>
      </section>

      <section className="section-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {HUMAN_ARCHIVE_VIDEOS.map((video) => (
              <ArchiveVideoCard
                key={video.no}
                name={video.name}
                no={video.no}
                location={video.location}
                youtubeId={video.youtubeId}
                still={video.still}
                active={active === video.youtubeId}
                muted={muted}
                onActivate={() => activate(video.youtubeId)}
                onDeactivate={deactivate}
                onToggleMute={toggleMute}
              />
            ))}
          </div>

          <a
            href={ARCHIVE_PLAYLIST_URL}
            target="_blank"
            rel="noreferrer"
            className="group mt-14 inline-flex w-fit items-center gap-2 whitespace-nowrap py-1 text-sm font-semibold uppercase leading-none tracking-[0.12em] text-cream sm:mt-16 lg:mt-20"
          >
            <span className="border-b border-lime pb-0.5">Watch the Human Archives</span>
            <span aria-hidden className="text-lime transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
