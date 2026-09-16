import * as React from "react";
import { Text } from "react-email";

import { FONT_SANS, LIME, type EmailStyle } from "./brand";

export function Eyebrow({ children, color = LIME }: { children: React.ReactNode; color?: string }) {
  const style: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: "14px",
    msoLineHeightRule: "exactly",
    letterSpacing: 3,
    textTransform: "uppercase",
    color,
    margin: 0,
  };
  return <Text style={style}>{children}</Text>;
}
