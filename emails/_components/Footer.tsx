import { Column, Link, Row, Section, Text } from "react-email";

import {
  FONT_HAND,
  FONT_SANS,
  HAIRLINE,
  LIME,
  STUDIOS,
  TEXT_FAINT,
  TEXT_MUTED,
  UNSUBSCRIBE_HREF,
  type EmailStyle,
} from "./brand";

export interface FooterProps {
  /** First sentence, template-specific, before the studios line. */
  note: string;
}

const hand: EmailStyle = {
  fontFamily: FONT_HAND,
  fontStyle: "italic", // reaches the Georgia fallback; Caveat renders upright (the brand's handwritten form)
  fontSize: 24,
  lineHeight: "28px",
  msoLineHeightRule: "exactly",
  color: LIME,
  margin: 0,
  paddingBottom: 20,
};

const stamp: EmailStyle = {
  fontFamily: FONT_SANS,
  fontSize: 10,
  lineHeight: "14px",
  msoLineHeightRule: "exactly",
  letterSpacing: 3,
  textTransform: "uppercase",
  color: TEXT_MUTED,
  margin: 0,
  paddingBottom: 20,
};

const legal: EmailStyle = {
  fontFamily: FONT_SANS,
  fontSize: 12,
  lineHeight: "18px",
  msoLineHeightRule: "exactly",
  color: TEXT_FAINT,
  margin: 0,
};

export function Footer({ note }: FooterProps) {
  return (
    <Section
      style={{
        padding: "28px 32px 36px",
        borderTop: `1px solid ${HAIRLINE}`,
        borderStyle: "solid",
      }}
    >
      <Row>
        <Column style={{ width: 300, verticalAlign: "top" }}>
          <Text style={hand}>Stay Human.</Text>
        </Column>
        <Column align="right" style={{ width: 300, verticalAlign: "top" }}>
          <Text style={stamp}>
            The future belongs
            <br />
            to the most human
          </Text>
        </Column>
      </Row>
      <Row>
        <Column style={{ verticalAlign: "top" }}>
          <Text style={legal}>
            {note} {STUDIOS}.
            <br />
            The Be Human Company ·{" "}
            <Link
              href={UNSUBSCRIBE_HREF}
              style={{ color: TEXT_MUTED, textDecoration: "underline" }}
            >
              Prefer not to hear from us again?
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
