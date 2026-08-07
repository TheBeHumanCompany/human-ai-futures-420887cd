import { readFile } from "node:fs/promises";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import type { ShareCardModel } from "../../src/lib/podcast/share-card";

/**
 * Renders a share card to PNG bytes.
 *
 * Node-only, and that is the point of the whole design. Rasterizing needs a
 * font file and a native rasterizer; doing it in a request handler would mean
 * shipping satori, a WASM rasterizer and an embedded face into a deployed
 * function that is otherwise about a hundred lines of `fetch`. Here the native
 * dependency is free, and the deployed `og:image` is a plain CDN URL that a
 * crawler fetches directly — no cold start, no redirect, on infrastructure this
 * project already trusts.
 *
 * **Fonts are loaded explicitly and awaited before any text is laid out.** The
 * brand faces are Oswald and Work Sans, and neither is present in a bare Node
 * process. A renderer that names a font it has not loaded does not error — it
 * silently substitutes a fallback and draws every card off-brand, forever,
 * with nothing going red. The files are committed under `scripts/` for that
 * reason, and they must never be imported from `src/`.
 */

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/**
 * The brand palette, converted from the `oklch()` values in `src/styles.css`.
 *
 * Converted rather than referenced because neither satori nor resvg parses
 * `oklch`, and an unparsed colour is not an error — it is a silent fallback to
 * black on transparent. Recorded here with their sources so the two can be
 * checked against each other by eye:
 *   ink   oklch(0.16  0.005 90) → #0e0d0b
 *   cream oklch(0.955 0.014 85) → #f4f0e6
 */
const INK = "#0e0d0b";
const CREAM = "#f4f0e6";
const INK_SOFT = "#1c1a17";

const FONT_DIR = path.join(import.meta.dirname, "..", "assets", "fonts");

let fontCache: Array<{ name: string; data: Buffer; weight: 400 | 600; style: "normal" }> | null =
  null;

/** Loaded once per process — the backfill renders 39 cards in a loop. */
async function loadFonts() {
  if (fontCache) return fontCache;

  const [oswald, workSans] = await Promise.all([
    readFile(path.join(FONT_DIR, "Oswald.ttf")),
    readFile(path.join(FONT_DIR, "WorkSans.ttf")),
  ]);

  fontCache = [
    { name: "Oswald", data: oswald, weight: 600, style: "normal" },
    { name: "Work Sans", data: workSans, weight: 400, style: "normal" },
  ];
  return fontCache;
}

/**
 * The card layout, as satori's element tree.
 *
 * Plain objects rather than JSX: this file is a Node script, and adding a JSX
 * pipeline to `scripts/` to draw three lines of text would be a build step for
 * nothing.
 *
 * Absent elements are omitted from the tree rather than rendered empty. An
 * episode with no guest gets no guest line at all — not a blank one — which is
 * what keeps the layout from developing a hole two of the thirty-nine episodes
 * would fall into.
 */
function cardElement(model: ShareCardModel) {
  const children: unknown[] = [];

  if (model.episodeLabel) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Work Sans",
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: INK_SOFT,
          opacity: 0.7,
        },
        children: model.episodeLabel,
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        fontFamily: "Oswald",
        fontSize: model.title.length > 70 ? 62 : 76,
        lineHeight: 1.1,
        color: INK,
        marginTop: 28,
        // satori needs an explicit wrap width; without it long titles run off
        // the canvas rather than wrapping.
        maxWidth: 1000,
      },
      children: model.title,
    },
  });

  if (model.guestLine) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "Work Sans",
          fontSize: 34,
          color: INK_SOFT,
          marginTop: 28,
        },
        children: model.guestLine,
      },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: CREAM,
        padding: 72,
      },
      children: [
        { type: "div", props: { style: { display: "flex", flexDirection: "column" }, children } },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Work Sans",
              fontSize: 24,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: INK_SOFT,
              opacity: 0.65,
            },
            children: "The People-Driven CEO Podcast",
          },
        },
      ],
    },
  };
}

export async function renderShareCard(model: ShareCardModel): Promise<Uint8Array> {
  const fonts = await loadFonts();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(cardElement(model) as any, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_WIDTH },
  })
    .render()
    .asPng();

  return new Uint8Array(png);
}

export { CARD_WIDTH, CARD_HEIGHT };
