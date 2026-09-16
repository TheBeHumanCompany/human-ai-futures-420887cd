import { Column, Link, Row, Section } from "react-email";

import { CREAM, FONT_DISPLAY, FONT_SANS, HAIRLINE, SITE_URL, TEXT_MUTED } from "./brand";

export function Header({ label }: { label: string }) {
  return (
    <Section
      style={{
        padding: "22px 32px",
        borderBottom: `1px solid ${HAIRLINE}`,
        borderStyle: "solid",
      }}
    >
      <Row>
        <Column style={{ verticalAlign: "top" }}>
          <Link
            href={SITE_URL}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 14,
              lineHeight: "18px",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: CREAM,
              textDecoration: "none",
            }}
          >
            The Be Human Company
          </Link>
        </Column>
        <Column align="right" style={{ verticalAlign: "top" }}>
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 10,
              lineHeight: "14px",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: TEXT_MUTED,
            }}
          >
            {label}
          </span>
        </Column>
      </Row>
    </Section>
  );
}
