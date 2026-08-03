/**
 * A single podcast episode, normalised from the PodBean RSS feed.
 *
 * Every field except `guest` and `episodeNumber` is present on 100% of the
 * live feed's items (verified 2026-08-03 across all 39 episodes), so the
 * parser drops any item that is missing one rather than emitting a partial.
 */
export interface Episode {
  /** Stable PodBean UUID. Use as the React key and as episode identity. */
  guid: string;
  /** From `<itunes:episode>`. Null when absent. */
  episodeNumber: number | null;
  /** Entity-decoded plain text. */
  title: string;
  /**
   * Guest name parsed out of the title.
   *
   * Deliberately `undefined` rather than a guess: the feed has titles that
   * name only a brand, and rendering "Elements Brazil" as a person is worse
   * than rendering no guest at all. See `parseGuest`.
   */
  guest?: string;
  /** Show notes with markup stripped. Safe to render as text. */
  description: string;
  /** ISO 8601. */
  pubDate: string;
  /** `<itunes:duration>` is an integer count of seconds on this feed. */
  durationSeconds: number;
  /** Direct https URL on PodBean's CDN. Playable in an `<audio>` element. */
  audioUrl: string;
  /** Enclosure MIME type, e.g. `audio/mpeg`. */
  audioType: string;
}
