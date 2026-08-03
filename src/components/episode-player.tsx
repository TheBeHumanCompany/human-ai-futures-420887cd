import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { formatDuration } from "@/lib/podbean";
import { cn } from "@/lib/utils";

/**
 * The audio element currently playing, if any.
 *
 * Module-level rather than context: the constraint is "one episode at a time
 * across the whole page", and every player mounts under the same document.
 */
let activeAudio: HTMLAudioElement | null = null;

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface EpisodePlayerProps {
  src: string;
  title: string;
  /** From the feed, so the duration shows before any audio is loaded. */
  durationSeconds: number;
  className?: string;
  tone?: "ink" | "cream";
}

/**
 * A brand-native audio player.
 *
 * Uses PodBean's direct CDN media URL rather than their iframe embed, so the
 * player matches the site's type and colour system. `preload="none"` means a
 * page of 39 of these costs nothing until someone presses play.
 */
export function EpisodePlayer({
  src,
  title,
  durationSeconds,
  className,
  tone = "cream",
}: EpisodePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Prefer the feed's duration until the browser reports its own.
  const [total, setTotal] = useState(durationSeconds);

  useEffect(() => {
    return () => {
      if (activeAudio === audioRef.current) activeAudio = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      activeAudio = audio;
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setElapsed(next);
  }, []);

  const onInk = tone === "ink";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`${isPlaying ? "Pause" : "Play"} — ${title}`}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          onInk
            ? "bg-lime text-ink focus-visible:outline-lime"
            : "bg-ink text-cream focus-visible:outline-ink",
        )}
      >
        {isPlaying ? (
          <Pause className="size-4" fill="currentColor" aria-hidden />
        ) : (
          <Play className="size-4 translate-x-px" fill="currentColor" aria-hidden />
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          type="range"
          min={0}
          max={total || 0}
          step={1}
          value={Math.min(elapsed, total || 0)}
          onChange={seek}
          aria-label={`Seek within ${title}`}
          className={cn(
            "h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full",
            "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:size-3",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0",
            onInk
              ? "bg-hairline [&::-moz-range-thumb]:bg-lime [&::-webkit-slider-thumb]:bg-lime"
              : "bg-hairline-dark [&::-moz-range-thumb]:bg-ink [&::-webkit-slider-thumb]:bg-ink",
          )}
        />
        <span
          className={cn(
            "eyebrow shrink-0 tabular-nums",
            onInk ? "text-muted-foreground" : "text-ink/50",
          )}
        >
          {isPlaying || elapsed > 0
            ? `${clock(elapsed)} / ${clock(total)}`
            : formatDuration(durationSeconds)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setElapsed(0);
        }}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const reported = e.currentTarget.duration;
          if (Number.isFinite(reported) && reported > 0) setTotal(reported);
        }}
      />
    </div>
  );
}
