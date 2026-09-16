import * as React from "react";
import { Text } from "react-email";

import { FONT_SANS, TEXT_BODY, TEXT_MUTED, type EmailStyle } from "./brand";

/** Work Sans body paragraph. Muted variant is the small 13px note style. */
export function BodyText({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const style: EmailStyle = muted
    ? {
        fontFamily: FONT_SANS,
        fontSize: 13,
        lineHeight: "20px",
        msoLineHeightRule: "exactly",
        color: TEXT_MUTED,
        margin: 0,
      }
    : {
        fontFamily: FONT_SANS,
        fontSize: 17,
        lineHeight: "27px",
        msoLineHeightRule: "exactly",
        color: TEXT_BODY,
        margin: 0,
      };
  return <Text style={style}>{children}</Text>;
}
