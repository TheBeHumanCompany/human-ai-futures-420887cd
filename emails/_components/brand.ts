/**
 * Brand tokens for email templates — the sRGB renderings used by the
 * send-ready reference email (`Voes and Co Blueprint Email - send-ready.html`)
 * of the design-system oklch tokens in `Be_Human_Design_System/tokens/colors.css`.
 * Copy these values; do not re-derive them from oklch.
 */

import type { CSSProperties } from "react";

/** CSSProperties plus Outlook's non-standard `mso-line-height-rule`. */
export type EmailStyle = CSSProperties & { msoLineHeightRule?: "exactly" };

// Grounds
export const INK = "#1c1b18"; // page + header background
export const CREAM = "#f3efe6"; // cream band background, wordmark colour
export const LIME = "#d4f04a"; // eyebrows, numerals, pill fill, links, "Stay Human."
export const HAIRLINE = "#3a3934"; // 1px rules on ink

// Text on ink
export const TEXT_STRONG = "#ffffff";
export const TEXT_BODY = "#e6e2d8";
export const TEXT_MUTED = "#9a988f";
export const TEXT_FAINT = "#7d7b72";

// Text on cream
export const CREAM_TEXT = "#2e2d28";
export const CREAM_MUTED = "#6b695f";

// Font stacks. `Font`'s typed fallback union has no "Arial Narrow", so the
// full stacks live here and ride on inline styles; the <Font> components in
// Layout pass their own typed fallbacks for the @font-face mso-alt only.
export const FONT_DISPLAY = "'Oswald','Arial Narrow',Arial,Helvetica,sans-serif";
export const FONT_SANS = "'Work Sans',Arial,Helvetica,sans-serif";
export const FONT_HAND = "'Caveat',Georgia,'Times New Roman',serif";

export const SITE_URL = "https://thebehumancompany.ca/";
export const SITE_LABEL = "thebehumancompany.ca";
export const STUDIOS = "Sydney · London · New York";

export const SIGNER_NAME = "Shane James";
export const SIGNER_TITLE = "Founder, The Be Human Company";

/**
 * Same address as MAGIC_LINK_FROM's default in
 * src/lib/client-portal/magic-link-email.ts. Deliberately not imported: that
 * module drags the fs-based email catcher into the preview bundle.
 */
export const TEMPLATE_FROM = "The Be Human Company <website@updates.thebehumancompany.ca>";

import { CONTACT_EMAIL } from "../../src/lib/brand";

export { CONTACT_EMAIL };

export const UNSUBSCRIBE_HREF = `mailto:${CONTACT_EMAIL}?subject=Please%20remove%20me`;
