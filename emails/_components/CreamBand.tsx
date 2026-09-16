import * as React from "react";
import { Section, Text } from "react-email";

import { CREAM, CREAM_MUTED, CREAM_TEXT, FONT_SANS, type EmailStyle } from "./brand";
import { Eyebrow } from "./Eyebrow";

export interface CreamBandProps {
  eyebrow: string;
  /** Paragraphs, plain strings; all but the last get a 14px bottom gap. */
  paragraphs: readonly string[];
}

/** The full-width cream inversion band. */
export function CreamBand({ eyebrow, paragraphs }: CreamBandProps) {
  const paragraph: EmailStyle = {
    fontFamily: FONT_SANS,
    fontSize: 16,
    lineHeight: "26px",
    msoLineHeightRule: "exactly",
    color: CREAM_TEXT,
    margin: 0,
  };
  return (
    <Section style={{ backgroundColor: CREAM, padding: "44px 32px" }}>
      <Eyebrow color={CREAM_MUTED}>{eyebrow}</Eyebrow>
      {paragraphs.map((text, at) => (
        <Text
          key={text.slice(0, 24)}
          style={{ ...paragraph, paddingBottom: at === paragraphs.length - 1 ? 0 : 14 }}
        >
          {text}
        </Text>
      ))}
    </Section>
  );
}
