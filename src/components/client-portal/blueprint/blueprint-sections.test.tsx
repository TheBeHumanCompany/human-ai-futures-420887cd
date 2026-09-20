import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  applyTier,
  parseSections,
  type BlueprintSection,
} from "@/lib/client-portal/blueprint-schema";

import { BlueprintSections, groundsFor } from "./blueprint-sections";

/**
 * Rendered with `react-dom/server`, the same idiom as `client-reports.test.tsx`:
 * static markup is exactly what SSR emits before hydration, which is the thing
 * that must not contain withheld content.
 */

const PAID = "PAID-BODY-MARKER-9f1c22";
const FREE = "FREE-BODY-MARKER-4a0d13";

const SECTIONS: BlueprintSection[] = parseSections([
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    section_key: "operating-reality",
    ordinal: 1,
    tier: "preliminary",
    title: "The operating reality",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: [FREE] }] },
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    section_key: "implementation",
    ordinal: 2,
    tier: "final",
    title: "How to build it",
    teaser: "Eight more topics, in the order they bind.",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: [PAID] }] },
  },
]);

const render = (unlocked: boolean) =>
  renderToStaticMarkup(<BlueprintSections sections={applyTier(SECTIONS, unlocked)} />);

describe("the paywall, as it reaches the page", () => {
  test("locked: the paid body is absent from the rendered markup", () => {
    const html = render(false);
    expect(html).not.toContain(PAID);
    expect(html).toContain(FREE);
  });

  test("locked: the title and teaser ARE rendered — the lock is the pitch", () => {
    const html = render(false);
    expect(html).toContain("How to build it");
    expect(html).toContain("Eight more topics, in the order they bind.");
    expect(html).toContain("Included in the full blueprint");
  });

  test("locked sections are marked in the DOM for styling, not hidden", () => {
    const html = render(false);
    expect(html).toContain('data-locked="true"');
    // `hidden`/`display:none` would mean the body was sent and merely covered.
    expect(html).not.toContain("hidden");
  });

  test("unlocked: the paid body renders", () => {
    const html = render(true);
    expect(html).toContain(PAID);
    expect(html).toContain('data-locked="false"');
  });
});

describe("rendering is structured, never injected", () => {
  test("markup in authored content is escaped, not executed", () => {
    const hostile = parseSections([
      {
        id: "bbbbbbbb-0000-0000-0000-000000000001",
        section_key: "x",
        ordinal: 1,
        tier: "preliminary",
        title: "Title",
        band: "prose",
        body: {
          blocks: [{ type: "prose", paragraphs: ["<script>alert(1)</script>"] }],
        },
      },
    ]);
    const html = renderToStaticMarkup(<BlueprintSections sections={hostile} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("an unrecognised block type renders nothing rather than crashing", () => {
    const future = parseSections([
      {
        id: "cccccccc-0000-0000-0000-000000000001",
        section_key: "x",
        ordinal: 1,
        tier: "preliminary",
        title: "Forward compatible",
        band: "somethingNew",
        body: { blocks: [{ type: "bandFromTheFuture", payload: 1 }] },
      },
    ]);
    const html = renderToStaticMarkup(<BlueprintSections sections={future} />);
    expect(html).toContain("Forward compatible");
  });
});

describe("bands", () => {
  test("sections alternate ground, and the question band is always ink", () => {
    const sections = parseSections([
      {
        id: "d1",
        section_key: "a",
        ordinal: 1,
        tier: "preliminary",
        title: "A",
        band: "prose",
        body: {},
      },
      {
        id: "d2",
        section_key: "b",
        ordinal: 2,
        tier: "preliminary",
        title: "B",
        band: "prose",
        body: {},
      },
      {
        id: "d3",
        section_key: "c",
        ordinal: 3,
        tier: "preliminary",
        title: "C",
        band: "question",
        body: {},
      },
    ]);
    const html = renderToStaticMarkup(<BlueprintSections sections={sections} />);
    expect(html).toContain("section-cream");
    expect(html).toContain("section-ink");
    // Third section is index 2 (would be cream by parity) but is a question band.
    const questionIndex = html.indexOf('id="section-c"');
    expect(html.lastIndexOf("section-ink", questionIndex)).toBeGreaterThan(-1);
  });

  test("each section carries a stable deep-link anchor", () => {
    const html = render(true);
    expect(html).toContain('id="section-operating-reality"');
    expect(html).toContain('id="section-implementation"');
  });
});

describe("the ground rule, ported from the designed deliverable", () => {
  const band = (band: string, ordinal: number) =>
    parseSections([
      {
        id: `g${ordinal}`,
        section_key: `g${ordinal}`,
        ordinal,
        tier: "preliminary",
        title: `G${ordinal}`,
        band,
        body: {},
      },
    ])[0]!;

  /** The canonical eleven-section template, in order. */
  const TEMPLATE = [
    "prose",
    "opportunities",
    "prose",
    "prose",
    "findings",
    "prose",
    "prose",
    "prose",
    "question",
    "questions",
    "sources",
  ].map((name, index) => band(name, index + 1));

  test("the four fixed registers keep their ground", () => {
    const grounds = groundsFor(TEMPLATE);
    expect(grounds[1]).toBe("ink"); // opportunities
    expect(grounds[8]).toBe("ink"); // question
    expect(grounds[9]).toBe("cream"); // questions
    expect(grounds[10]).toBe("ink"); // sources
  });

  test("two cream bands never touch — they would read as one over-long band", () => {
    const grounds = groundsFor(TEMPLATE);
    const adjacentCream = grounds.filter(
      (ground, index) => index > 0 && ground === "cream" && grounds[index - 1] === "cream",
    );
    expect(adjacentCream).toEqual([]);
  });

  test("alternation is measured against the ink hero, so band 1 is cream", () => {
    expect(groundsFor(TEMPLATE)[0]).toBe("cream");
  });

  test("a cream band that would collide with the fixed cream register falls to ink", () => {
    // prose, prose, questions(cream): the second prose would alternate to
    // cream and butt against the fixed cream band, so it takes ink instead.
    const grounds = groundsFor([band("prose", 1), band("prose", 2), band("questions", 3)]);
    expect(grounds).toEqual(["cream", "ink", "cream"]);
  });
});

describe("the hero band and the grids", () => {
  const sections = parseSections([
    {
      id: "h1",
      section_key: "hero",
      ordinal: 0,
      tier: "preliminary",
      title: "Masthead",
      band: "hero",
      body: { blocks: [{ type: "title", company: "Acme", thesis: "T" }] },
    },
    {
      id: "h2",
      section_key: "s10",
      ordinal: 10,
      tier: "preliminary",
      title: "Assumptions",
      band: "questions",
      body: {
        blocks: [
          { type: "unknown", text: "UNKNOWN-ONE" },
          { type: "unknown", text: "UNKNOWN-TWO" },
        ],
      },
    },
  ]);

  test("the hero row is not rendered here — it is the document's masthead", () => {
    const html = renderToStaticMarkup(<BlueprintSections sections={sections} />);
    expect(html).not.toContain("Masthead");
    expect(html).not.toContain('id="section-hero"');
  });

  test("the questions band is a grid of items, not a reading column", () => {
    const html = renderToStaticMarkup(<BlueprintSections sections={sections} />);
    expect(html).toContain("UNKNOWN-ONE");
    expect(html).toContain("UNKNOWN-TWO");
    expect(html).toMatch(/<ul class="[^"]*grid[^"]*grid-cols-2/);
  });
});
