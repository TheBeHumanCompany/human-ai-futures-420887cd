import * as React from "react";
import { Button } from "react-email";

import { FONT_SANS, INK, LIME } from "./brand";

/**
 * The brand pill: the only curve in the system. Labels end with the arrow
 * glyph " →" — the one non-icon glyph the design system allows.
 */
export function PillButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        boxSizing: "border-box",
        padding: "16px 30px",
        backgroundColor: LIME,
        color: INK,
        borderRadius: 9999,
        fontFamily: FONT_SANS,
        fontSize: 13,
        lineHeight: "16px",
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
