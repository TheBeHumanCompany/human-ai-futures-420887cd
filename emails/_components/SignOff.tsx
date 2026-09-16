import * as React from "react";
import { Link, Section, Text } from "react-email";

import {
  FONT_SANS,
  LIME,
  SITE_LABEL,
  SITE_URL,
  SIGNER_NAME,
  SIGNER_TITLE,
  TEXT_MUTED,
  TEXT_STRONG,
  type EmailStyle,
} from "./brand";
import { BodyText } from "./BodyText";

export interface SignOffProps {
  /** Optional lead paragraph above the name. */
  children?: React.ReactNode;
}

/** Signature block: optional lead, bold name, muted title + site link. */
export function SignOff({ children }: SignOffProps) {
  const name: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 16,
    lineHeight: "24px",
    msoLineHeightRule: "exactly",
    fontWeight: 700,
    color: TEXT_STRONG,
    margin: 0,
  };
  const title: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 14,
    lineHeight: "22px",
    msoLineHeightRule: "exactly",
    color: TEXT_MUTED,
    margin: 0,
  };
  return (
    <Section style={{ padding: "44px 32px 20px" }}>
      {children ? (
        <div style={{ paddingBottom: 22 }}>
          <BodyText>{children}</BodyText>
        </div>
      ) : null}
      <Text style={name}>{SIGNER_NAME}</Text>
      <Text style={title}>
        {SIGNER_TITLE}
        <br />
        <Link href={SITE_URL} style={{ color: LIME, textDecoration: "none" }}>
          {SITE_LABEL}
        </Link>
      </Text>
    </Section>
  );
}
