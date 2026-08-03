import { describe, expect, test } from "bun:test";

import {
  decodeEntities,
  formatDuration,
  parseFeed,
  parseGuest,
  selectFeatured,
  stripHtml,
} from "./parse";

describe("formatDuration", () => {
  test("renders the feed's integer seconds as minutes", () => {
    // itunes:duration on this feed is a count of seconds, not HH:MM:SS.
    expect(formatDuration(2773)).toBe("46 min");
  });

  test("rolls over to hours", () => {
    expect(formatDuration(3600)).toBe("1 hr");
    expect(formatDuration(4320)).toBe("1 hr 12 min");
  });

  test("returns empty for junk rather than 'NaN min'", () => {
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(Number.NaN)).toBe("");
    expect(formatDuration(-5)).toBe("");
  });
});

describe("decodeEntities / stripHtml", () => {
  test("decodes the entities present in this feed's titles", () => {
    expect(decodeEntities("Beauty &amp; Belonging")).toBe("Beauty & Belonging");
    expect(decodeEntities("Rviita&#8217;s Rise")).toBe("Rviita’s Rise");
  });

  test("strips the leaked utility classes out of show notes", () => {
    const html = '<p class="whitespace-normal break-words">Hello  <em>there</em></p>';
    expect(stripHtml(html)).toBe("Hello there");
  });

  test("drops script content entirely", () => {
    expect(stripHtml("<script>alert(1)</script>safe")).toBe("safe");
  });
});

describe("parseGuest", () => {
  test.each([
    [
      "Episode 39: Leading with Heart: Jill De Chavez on Building a People-First Business",
      "Jill De Chavez",
    ],
    [
      "Episode 30: Creating Wellness from Within: A Conversation with Maria Porcellato",
      "Maria Porcellato",
    ],
    ["Episode 34: Owning Your Voice: The Creative Journey of Mia Fiona Kut", "Mia Fiona Kut"],
    ["Episode 31: From Passion to Impact: How Glyn Lewis Creates Community", "Glyn Lewis"],
    [
      "Episode 2: From Lululemon to Launching a Sustainable Brand with Alexandra Dean",
      "Alexandra Dean",
    ],
  ])("extracts the guest from %s", (title, expected) => {
    expect(parseGuest(title)).toBe(expected);
  });

  test("prefers the possessive subject over a trailing brand", () => {
    // The hazard: a naive `with <X>` match yields the company, not the person.
    expect(
      parseGuest(
        "Episode 15: From Banana Brownies to a National Brand: Joao Ribeiro’s Journey with Elements Brazil",
      ),
    ).toBe("Joao Ribeiro");
    expect(
      parseGuest(
        "Episode 4: Food as Medicine: Elizabeth Fisher’s Mission with Lavva Cultured Superfood",
      ),
    ).toBe("Elizabeth Fisher");
  });

  test("handles the possessive form", () => {
    expect(
      parseGuest("Episode 5: From Vision to Victory: Jenn Harper's Cheekbone Beauty Journey"),
    ).toBe("Jenn Harper");
    expect(parseGuest("Episode 9: From Sponsorships to Purpose: Christine Monahan’s Pivot")).toBe(
      "Christine Monahan",
    );
  });

  test("stops at a co-subject that is a brand", () => {
    expect(
      parseGuest(
        "Episode 18: Bleeding-Edge Innovation: How Linda Biggs and Joni Are Disrupting Period Care",
      ),
    ).toBe("Linda Biggs");
  });

  test("declines rather than returning a brand phrase", () => {
    expect(
      parseGuest("Episode 6: Minting Success: The Story of Plant-Based Cleaning Revolutionaries"),
    ).toBeUndefined();
    expect(
      parseGuest("Episode 1: From Frustration to a 30-Person Team: The Story Behind CAYA"),
    ).toBeUndefined();
  });
});

const FIXTURE = `<rss><channel>
<item>
  <title><![CDATA[Episode 2: Second &amp; Best with Alexandra Dean]]></title>
  <pubDate>Tue, 01 Jul 2025 12:34:39 -0300</pubDate>
  <guid isPermaLink="false">show.podbean.com/abc-123</guid>
  <description><![CDATA[<p class="x">Notes two</p>]]></description>
  <itunes:duration>2773</itunes:duration>
  <itunes:episode>2</itunes:episode>
  <enclosure url="https://mcdn.podbean.com/mf/web/aaa/two.mp3" length="1" type="audio/mpeg"/>
</item>
<item>
  <title><![CDATA[Episode 3: Third: Tyler McCombs on Building]]></title>
  <pubDate>Wed, 02 Jul 2025 12:00:00 -0300</pubDate>
  <guid isPermaLink="false">show.podbean.com/def-456</guid>
  <description><![CDATA[Notes three]]></description>
  <itunes:duration>600</itunes:duration>
  <itunes:episode>3</itunes:episode>
  <enclosure url="https://mcdn.podbean.com/mf/web/bbb/three.mp3" length="1" type="audio/mpeg"/>
</item>
<item>
  <title>Broken — no enclosure</title>
  <pubDate>Wed, 02 Jul 2025 12:00:00 -0300</pubDate>
  <guid isPermaLink="false">show.podbean.com/ghi-789</guid>
  <itunes:duration>600</itunes:duration>
</item>
</channel></rss>`;

describe("parseFeed", () => {
  const episodes = parseFeed(FIXTURE);

  test("skips items missing required fields instead of emitting partials", () => {
    expect(episodes).toHaveLength(2);
  });

  test("sorts newest first regardless of document order", () => {
    expect(episodes.map((e) => e.episodeNumber)).toEqual([3, 2]);
  });

  test("normalises every field", () => {
    const two = episodes.find((e) => e.episodeNumber === 2)!;
    expect(two.title).toBe("Episode 2: Second & Best with Alexandra Dean");
    expect(two.guest).toBe("Alexandra Dean");
    expect(two.description).toBe("Notes two");
    expect(two.audioUrl).toBe("https://mcdn.podbean.com/mf/web/aaa/two.mp3");
    expect(two.audioType).toBe("audio/mpeg");
    expect(two.durationSeconds).toBe(2773);
    expect(two.guid).toBe("show.podbean.com/abc-123");
    expect(two.pubDate).toBe(new Date("Tue, 01 Jul 2025 12:34:39 -0300").toISOString());
  });

  test("returns empty for junk input rather than throwing", () => {
    expect(parseFeed("")).toEqual([]);
    expect(parseFeed("<html>not a feed</html>")).toEqual([]);
  });
});

describe("selectFeatured", () => {
  test("takes the three newest", () => {
    const made = Array.from({ length: 10 }, (_, i) => ({ episodeNumber: 10 - i })) as never[];
    expect(selectFeatured(made)).toHaveLength(3);
    expect(selectFeatured(made).map((e: { episodeNumber: number }) => e.episodeNumber)).toEqual([
      10, 9, 8,
    ]);
  });

  test("does not pad when the feed is short", () => {
    expect(selectFeatured([{ episodeNumber: 1 }] as never[])).toHaveLength(1);
    expect(selectFeatured([])).toHaveLength(0);
  });
});
