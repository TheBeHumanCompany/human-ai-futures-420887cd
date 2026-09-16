import * as React from "react";
import { Column, Row, Text } from "react-email";

import { FONT_SANS, HAIRLINE, LIME, TEXT_BODY, TEXT_STRONG, type EmailStyle } from "./brand";

export interface FindingRowProps {
  /** Two-digit zero-padded numeral, e.g. "01". */
  index: string;
  title: string;
  /** Optional remainder after the bold claim — omitted in title-only lists. */
  body?: string;
}

/**
 * One numbered findings row: lime numeral in a 44px gutter, bold white claim
 * followed by the soft-white remainder, hairline underneath. The list wrapper
 * (border-top) belongs to the caller.
 */
export function FindingRow({ index, title, body }: FindingRowProps) {
  const numeral: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: "22px",
    msoLineHeightRule: "exactly",
    letterSpacing: 2,
    color: LIME,
  };
  const text: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 15,
    lineHeight: "22px",
    msoLineHeightRule: "exactly",
    color: TEXT_BODY,
    margin: 0,
  };
  return (
    <Row style={{ borderBottom: `1px solid ${HAIRLINE}`, borderStyle: "solid" }}>
      <Column style={{ width: 44, verticalAlign: "top", padding: "18px 0" }}>
        <Text style={numeral}>{index}</Text>
      </Column>
      <Column style={{ verticalAlign: "top", padding: "18px 0" }}>
        <Text style={text}>
          <span style={{ color: TEXT_STRONG, fontWeight: 700 }}>{title}</span>
          {body ? ` ${body}` : ""}
        </Text>
      </Column>
    </Row>
  );
}
