import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Copy fidelity, as a gate rather than a claim.
 *
 * ── Why this file exists ───────────────────────────────────────────────────
 *
 * Two pages are built from documents Maya supplied, and both were described as
 * carrying her copy verbatim. The first external review of that work could not
 * check either statement — the PDFs were in a WhatsApp store outside the repo —
 * and it was right not to take the claim on trust. It was also right on the
 * substance: an earlier draft of the founder page had silently expanded every
 * contraction in Shane's first-person voice ("I've built" → "I have built"),
 * and `/why-we-exist` was missing four paragraphs of the document outright.
 * Both read perfectly well. Neither is something a reviewer catches by eye.
 *
 * So the documents are committed under `docs/source/` and this test holds the
 * pages to them, sentence by sentence.
 *
 * ── Why the divergences are a list and not a threshold ─────────────────────
 *
 * A "95% of sentences match" gate passes while any one sentence is quietly
 * rewritten, which is the failure mode being prevented. Instead every accepted
 * difference is named below with its reason, and the test asserts in BOTH
 * directions: each listed sentence must genuinely still be absent, so the list
 * cannot rot into a permanent excuse after the page changes.
 */

const REPO_ROOT = path.resolve(import.meta.dir, "..", "..");

/**
 * The page source reduced to the words a visitor reads.
 *
 * Comparing against the rendered DOM would need a browser and would make this a
 * slow test that only runs when a dev server is up. The JSX is a good enough
 * proxy — every one of the defects above is visible in it — provided the tags,
 * entities, className strings and comments are stripped first, which is what
 * makes this a text comparison rather than a source grep.
 */
function renderedText(routeFile: string): string {
  let s = readFileSync(path.join(REPO_ROOT, routeFile), "utf8");
  s = s.replace(/\/\*[\s\S]*?\*\//g, " "); // block comments, including the JSX ones
  s = s.replace(/^\s*\/\/.*$/gm, " "); // line comments
  s = s.replace(/className=("[^"]*"|\{[^}]*\})/g, " "); // class soup
  s = s.replace(/<[^>]+>/g, " "); // tags
  s = s.replace(/&mdash;|&ndash;/g, "-");
  s = s.replace(/&rsquo;|&lsquo;/g, "'");
  s = s.replace(/&ldquo;|&rdquo;/g, '"');
  s = s.replace(/&eacute;/g, "é");
  s = s.replace(/&amp;/g, "&");
  return normalise(s);
}

/**
 * Aggressive normalisation, so the comparison is about WORDS.
 *
 * PDF extraction hyphenates across line breaks, uses en/em dashes
 * interchangeably and emits curly quotes; JSX wraps lines wherever prettier
 * decided. None of that is a copy change, and a comparison that flags it finds
 * so much noise that the real drift hides inside it.
 */
function normalise(s: string): string {
  return s
    .replace(/[‘’']/g, "'")
    .replace(/[“”"]/g, "")
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9' ]/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/** Sentences worth asserting on. Short fragments match by accident. */
function sentencesOf(sourceFile: string): string[] {
  const raw = readFileSync(path.join(REPO_ROOT, sourceFile), "utf8");
  return raw
    .split(/(?<=[.?!])\s+/)
    .map(normalise)
    .filter((s) => s.split(" ").length >= 8);
}

type Case = {
  label: string;
  source: string;
  route: string;
  /**
   * Sentences the page deliberately does not carry.
   *
   * `instead` is what the page says in that sentence's place, and it is not
   * optional documentation — it is the half of the check that stops this list
   * rotting. Review demonstrated the hole: with only "the source sentence is
   * absent" asserted, the approved replacement could be swapped for arbitrary
   * prose and every test stayed green. Absence proves a divergence exists; only
   * the replacement proves it is still the AGREED one.
   */
  accepted: Array<{ startsWith: string; instead: string; because: string }>;
  /**
   * Whole passages the page no longer carries at all.
   *
   * A deletion has no replacement, so it cannot be described by `accepted`
   * (whose third check demands the approved substitute be on the page). It is
   * still held to two directions: every span must name real source sentences,
   * and each of those sentences must genuinely be absent — so the exemption
   * dies the moment the copy comes back.
   */
  removed?: Array<{ from: string; to: string; because: string }>;
};

const CASES: Case[] = [
  {
    label: "/about-the-founder",
    source: "docs/source/meet-the-founder.txt",
    route: "src/routes/about-the-founder.tsx",
    // Nothing rewritten. Her document is the page, in Shane's own voice.
    accepted: [],
    removed: [
      {
        from: "around the same time another shift was beginning to reshape business",
        to: "those lessons continue to shape how i build organizations today",
        because:
          "The 2026-08-22 restructure cuts the page to four chapters (hero, early years, " +
          "building at scale, human performance + compassion). The MEDIA · LEADERSHIP · " +
          "TRAINING chapter came off the page whole, at Maya's request.",
      },
      {
        from: "when i look back i don't see a resume",
        to: "and i'm grateful to be doing it alongside people who care about where we go from here",
        because:
          "Same pass: everything below the ink 'Businesses don't grow because of products' " +
          "pause was removed, including that pause and the closing 'What I've learned' chapter.",
      },
    ],
  },

  {
    label: "/why-we-exist",
    source: "docs/source/why-we-exist.txt",
    route: "src/routes/why-we-exist.tsx",
    accepted: [
      {
        startsWith: "we started going out into the world",
        instead: "We started asking people one question",
        because:
          "Her own 08-19 screens shorten this to 'We started asking people one question:'. " +
          "Where her design and her document disagree, the design she drew wins.",
      },
      {
        startsWith: "almost nobody answers with their job title",
        instead:
          "Almost nobody talks about their job title, how productive they've been, or what they've built",
        because: "Same screens: 'Almost nobody talks about their job title...'.",
      },
      {
        startsWith: "treat each other and yourself with respect and compassion",
        instead: "Treat each other, and yourself, with respect and compassion",
        because:
          "Present on the page as Lindsay's pull quote. Only the sentence SPLIT differs — the " +
          "extractor joins the attribution to the following sentence, so the joined string " +
          "cannot appear anywhere. The quote itself is asserted separately below.",
      },
      {
        startsWith: "time to actually experience the life",
        instead: "Time to actually experience the life we've spent so long building",
        because:
          "Her screens trim the third Time line at 'building.', dropping 'instead of managing " +
          "it from a distance'. A typographic decision in her design, kept.",
      },
      {
        startsWith: "as an indigenous founded company",
        instead:
          "As an Indigenous-led company, we grew up understanding something the rest of the world is only now circling back to",
        because:
          "'Indigenous-founded' is a superseded variant that layering.test.ts bans outright; the " +
          "page says 'Indigenous-led', matching INDIGENOUS_LINE. Flagged to Maya, not silent.",
      },
      {
        startsWith: "what kind of humans are these systems actually helping us become",
        instead: "What kind of humans are we becoming?",
        because:
          "The 2026-08-21 redesign of The Real Question lifts this sentence out of the body copy " +
          "and shortens it into the section's display heading, at Maya's request.",
      },
      {

        startsWith: "right now that infrastructure is four connected pieces",
        instead: "Four parts. One mission.",
        because:
          "The 2026-08-20 redesign of the four-pieces section replaces this heading with a shorter " +
          "editorial statement while keeping the four offerings and closing paragraph intact.",
      },
    ],
  },
];

/** The source sentences covered by a named `removed` span, in document order. */
function removedSentences(c: Case, sentences: string[]): string[] {
  const out: string[] = [];
  for (const span of c.removed ?? []) {
    const start = sentences.findIndex((s) => s.startsWith(normalise(span.from)));
    const end = sentences.findIndex((s) => s.startsWith(normalise(span.to)));
    if (start === -1 || end === -1 || end < start) continue;
    out.push(...sentences.slice(start, end + 1));
  }
  return out;
}

for (const c of CASES) {
  describe(`${c.label} carries its source document`, () => {
    const page = renderedText(c.route);
    const sentences = sentencesOf(c.source);

    test("the source fixture is populated", () => {
      // Every assertion below is against this file; an empty one makes them all
      // vacuously true, which is the classic way a fidelity gate dies quietly.
      expect(sentences.length).toBeGreaterThan(20);
    });

    test("every sentence is on the page, except the ones named as divergent", () => {
      const accepted = c.accepted.map((a) => normalise(a.startsWith));
      const cut = new Set(removedSentences(c, sentences));
      const missing = sentences
        .filter((s) => !page.includes(s))
        .filter((s) => !accepted.some((a) => s.startsWith(a)))
        .filter((s) => !cut.has(s));
      expect(missing, `unaccounted copy drift in ${c.label}:\n  ${missing.join("\n  ")}`).toEqual(
        [],
      );
    });

    test("each removed passage is real, and is genuinely gone", () => {
      for (const span of c.removed ?? []) {
        const start = sentences.findIndex((s) => s.startsWith(normalise(span.from)));
        const end = sentences.findIndex((s) => s.startsWith(normalise(span.to)));
        expect(start, `no source sentence starts with "${span.from}"`).toBeGreaterThanOrEqual(0);
        expect(end, `no source sentence starts with "${span.to}"`).toBeGreaterThanOrEqual(start);
      }
      for (const s of removedSentences(c, sentences)) {
        expect(page.includes(s), `back on the page, so drop its removal entry: ${s}`).toBe(false);
      }
    });


    test("each named divergence is still real, and its replacement still stands", () => {
      // Three directions, not two. The source sentence must still be absent;
      // the entry must still describe a real source sentence; and the approved
      // replacement must still be on the page. Without that third check the
      // exemption covers ANY text in that slot — proven in review by swapping
      // an approved line for invented prose with every test still green.
      for (const { startsWith, instead, because } of c.accepted) {
        const match = sentences.find((s) => s.startsWith(normalise(startsWith)));
        expect(match, `no source sentence starts with "${startsWith}"`).toBeDefined();
        expect(page.includes(match!), `${startsWith} — now present, so remove it: ${because}`).toBe(
          false,
        );
        expect(
          page.includes(normalise(instead)),
          `the approved replacement for "${startsWith}" is gone. Expected: "${instead}"`,
        ).toBe(true);
      }
    });
  });
}

describe("/why-we-exist keeps the parts its divergence list depends on", () => {
  const page = renderedText("src/routes/why-we-exist.tsx");

  test("Lindsay's quote and attribution are both on the page", () => {
    // Named as a split artifact above, so it has to be asserted somewhere or
    // the exemption would hide a genuine deletion.
    expect(page).toContain(normalise("To love one another"));
    expect(page).toContain(
      normalise("Treat each other, and yourself, with respect and compassion"),
    );
    expect(page).toContain(normalise("Lindsay, Vancouver"));
  });

  test("the four connected pieces are all named", () => {
    for (const piece of [
      "Be Human AI",
      "The New Human Era",
      "The Human Archive",
      "The People-Driven CEO Podcast",
    ]) {
      expect(page).toContain(normalise(piece));
    }
  });

  test("the closing sequence is intact", () => {
    expect(page).toContain(normalise("One Human Rep won't change the world"));
    expect(page).toContain(normalise("That's not a hope. That's the plan."));
  });
});

describe("/about-the-founder ships photographs, not placeholders", () => {
  const source = readFileSync(path.join(REPO_ROOT, "src/routes/about-the-founder.tsx"), "utf8");
  /**
   * Structural assertions run against the CODE, with comments removed.
   *
   * The docblocks in that route quote `<img>` and discuss Maya's mockup while
   * explaining why the photographs are handled the way they are. Scanning the
   * raw file counts those quotes as markup and fails on the prose describing
   * the very rule being enforced.
   */
  const code = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  /**
   * This block used to assert the opposite — no `<img>` at all — because the
   * photographs existed only flattened inside Maya's mockups and an empty frame
   * waiting for one is the placeholder the release gates exist to keep out.
   * They were supplied on 2026-08-19, so the criterion inverts: pictures are
   * now required, and what must not exist is a frame without one behind it.
   */
  test("every photograph is a bundled asset, never a hand-written path", () => {
    const imports = [...source.matchAll(/from "(@\/assets\/[^"]+)"/g)].map((m) => m[1]);
    // 2026-08-20: the page dropped three photographs (the KITV studio shot, the
    // mural/cameraman frame, the posed Actions of Compassion portrait) so the
    // biography leads and the pictures support it. Eight remain.
    expect(imports.length, "the page renders photographs").toBeGreaterThanOrEqual(8);
    for (const spec of imports) {
      expect(spec).toMatch(/\.(webp|png|jpe?g|avif)$/);
      // The production 404 this repo was rebuilt to fix.
      expect(spec).not.toContain("__l5e");
      expect(spec).not.toContain(".asset.json");
    }
    expect(code, "no src= built from a string").not.toMatch(/src="\/[^"]*\.(webp|png|jpe?g)"/);
  });

  test("no photograph ships without alt text", () => {
    // A decorative-image exemption would be wrong here: every one of these is a
    // photograph of real people, and none is decoration.
    // `Archival` forwards its own props to `<Shot ... alt={alt} />`; that call
    // site carries no literal to check, and the two <Archival> tags it renders
    // are checked as literals below.
    const shots = [
      ...code.matchAll(/<(?:Shot|Archival)\b[\s\S]*?\/>/g),
    ]
      .map((m) => m[0])
      .filter((tag) => !tag.includes("alt={alt}"));
    expect(shots.length).toBeGreaterThanOrEqual(7);
    for (const shot of shots) {
      const alt = /alt="([^"]*)"/.exec(shot)?.[1] ?? "";
      expect(alt.trim().length, `alt too short in: ${shot.slice(0, 70)}`).toBeGreaterThan(15);
    }
  });

  test("there is exactly one img element, and it carries a src", () => {
    // Every photograph goes through <Shot>, so a second bare <img> means one
    // slipped past the shared treatment — the route where a missing lazy
    // attribute or an empty alt gets in.
    const imgs = [...code.matchAll(/<img\b/g)];
    expect(imgs.length, "photographs render through <Shot>, not by hand").toBe(1);
    expect(code).toMatch(/<img\s+src=\{src\}/);
    expect(code).not.toMatch(/<figure[^>]*>\s*<\/figure>/);
  });

  test("the design mockup itself is not shipped as content", () => {
    // PHOTO-...-11-52-38 is the page design Maya drew, not a photograph of
    // anything. Shipping it would put a picture of the page on the page.
    // Scoped to what is IMPORTED — the prose above deliberately discusses her
    // mockup, and a naive scan of the whole file flags that instead.
    const imports = [...source.matchAll(/from "(@\/assets\/[^"]+)"/g)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec).not.toMatch(/mockup|11-52-38|screenshot/i);
    }
  });
});
