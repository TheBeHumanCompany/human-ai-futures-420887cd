/**
 * The Google Fonts links, defined once for every surface that ships a `<head>`.
 *
 * The app's root document is one such surface; `scripts/export-blueprint.ts`,
 * which assembles a standalone HTML file from the same components and the same
 * compiled stylesheet, is the other. A second hand-typed copy of the `css2?`
 * URL there would be a blueprint that prints in a fallback face while the
 * portal prints in Oswald — the exact font defect the structured renderer
 * exists to remove.
 *
 * Work Sans 200 backs the type scale's `-prose` register (the largest
 * reflective statements in Maya's mockups). Adding it costs nothing: Google
 * serves Work Sans as a variable font, so `wght@200;300;400;500;600` and
 * `wght@300;400;500;600` return a byte-identical set of woff2 URLs — the
 * multiple URLs are `unicode-range` subsets, not per-weight files. The same is
 * true of Oswald, which is why its weight list is not trimmed.
 */

export interface FontLink {
  rel: "preconnect" | "stylesheet";
  href: string;
  crossOrigin?: "anonymous";
}

export const FONT_LINKS: readonly FontLink[] = [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;700;800&family=Caveat:wght@500&family=Work+Sans:wght@200;300;400;500;600&display=swap",
  },
];

/**
 * The faces a blueprint is composed in, as `document.fonts.check` specifiers.
 * The export refuses to print a PDF unless the browser reports every one as
 * loaded, so a network hiccup cannot silently ship a Helvetica blueprint (the
 * same probe `podcasts/src/podcasts/gtm_pdf.py` makes).
 *
 * The WEIGHTS are the ones the document actually sets, not a representative
 * sample: `document.fonts.check` answers for the faces the page caused to
 * load, so probing Oswald 300 — a weight the type scale never asks for —
 * reports a missing font on a page whose fonts all arrived. The scale's
 * uppercase register is 200 (`-caps-light`) and 700 (`-caps`); body copy is
 * Work Sans 400.
 */
export const REQUIRED_FONT_SPECIFIERS = [
  "200 1em Oswald",
  "700 1em Oswald",
  '400 1em "Work Sans"',
] as const;
