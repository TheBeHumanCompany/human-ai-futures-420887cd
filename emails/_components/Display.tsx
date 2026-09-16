import * as React from "react";
import { Heading } from "react-email";

import { FONT_DISPLAY, TEXT_STRONG, type EmailStyle } from "./brand";

/** Oswald 200 uppercase display line, the editorial voice at email scale. */
export function Display({ children, size = 54 }: { children: React.ReactNode; size?: number }) {
  const style: EmailStyle = {
    fontFamily: FONT_DISPLAY,
    fontWeight: 200,
    fontSize: size,
    lineHeight: `${size}px`,
    msoLineHeightRule: "exactly",
    textTransform: "uppercase",
    letterSpacing: 0,
    color: TEXT_STRONG,
    margin: 0,
  };
  return (
    <Heading as="h1" style={style}>
      {children}
    </Heading>
  );
}
