import * as React from "react";
import { Section } from "react-email";

import { BodyText } from "./_components/BodyText";
import { CreamBand } from "./_components/CreamBand";
import { Display } from "./_components/Display";
import { Eyebrow } from "./_components/Eyebrow";
import { FindingRow } from "./_components/FindingRow";
import { Layout } from "./_components/Layout";
import { PillButton } from "./_components/PillButton";
import { SignOff } from "./_components/SignOff";

export type BlueprintDeliveryProps = {
  recipientFirstName: string;
  companyName: string;
  /** Right-hand header chip after "Preliminary · ", e.g. "Sep 2026". */
  dateLabel: string;
  previewText: string;
  portalUrl: string;
  readMinutes: string | number;
  /** The top two finding titles — the click teaser; bodies live on the page. */
  topFindings: [string, string];
};

const FOOTER_NOTE =
  "Sent to you personally following our recorded conversation. Human readiness, security and governance, and intelligence strategy.";

/** The preliminary-blueprint envelope: two finding titles, portal CTA, cream band, sign-off. */
export default function BlueprintDelivery({
  recipientFirstName,
  companyName,
  dateLabel,
  previewText,
  portalUrl,
  readMinutes,
  topFindings,
}: BlueprintDeliveryProps) {
  return (
    <Layout
      preview={previewText}
      headerLabel={`Preliminary · ${dateLabel}`}
      footerNote={FOOTER_NOTE}
    >
      <Section style={{ padding: "56px 32px 40px" }}>
        <div style={{ paddingBottom: 22 }}>
          <Eyebrow>Strategic intelligence — outside-in</Eyebrow>
        </div>
        <div style={{ paddingBottom: 26 }}>
          <Display>
            {recipientFirstName},<br />
            we did the homework first.
          </Display>
        </div>
        <div style={{ paddingBottom: 18 }}>
          <BodyText>
            Thank you for the conversation on The People-Driven CEO. Rather than follow it with a
            pitch deck, we followed it with a document: a preliminary blueprint for {companyName},
            built entirely from what you said on the record and what is public. No access to your
            numbers. Every claim carries its source.
          </BodyText>
        </div>
        <BodyText>Five findings inside. The first two:</BodyText>
      </Section>

      <Section style={{ padding: "0 32px 8px" }}>
        <Section style={{ borderTop: "1px solid #3a3934", borderStyle: "solid" }}>
          {topFindings.map((title, at) => (
            <FindingRow key={title} index={`0${at + 1}`} title={title} />
          ))}
        </Section>
      </Section>

      <Section style={{ padding: "36px 32px 16px" }}>
        <PillButton href={portalUrl}>Read the preliminary blueprint →</PillButton>
      </Section>
      <Section style={{ padding: "0 32px 48px" }}>
        <BodyText muted>
          About {readMinutes} minutes to read. Section 08 lists what we could not confirm from
          outside — corrections welcome.
        </BodyText>
      </Section>

      <CreamBand
        eyebrow="What this is, and is not"
        paragraphs={[
          "It is a point of view on where an engagement would earn its fee — with your judgment kept where you already keep it.",
          "It is not a proposal. No fees, timelines or deliverables are in it. The final blueprint is built inside a paid engagement, from facts we can only name as missing today.",
        ]}
      />

      <SignOff>
        If one of the five findings is wrong, tell us which. If one of them is right, thirty minutes
        on the discovery questions in Section 08 is the next step — and we will come back with a
        plan, not a deck.
      </SignOff>
    </Layout>
  );
}

const PREVIEW_TOKEN_URL = "https://portal.thebehumancompany.ca/c/preview-token";

BlueprintDelivery.PreviewProps = {
  recipientFirstName: "Desirée",
  companyName: "Voes & Co",
  dateLabel: "Sep 2026",
  previewText:
    "Five findings on the raise, the sneaker and the machine — built from outside, before we asked you anything.",
  readMinutes: 15,
  portalUrl: PREVIEW_TOKEN_URL,
  topFindings: [
    "The bottleneck is demand and execution, not production.",
    "The raise is decided, not yet live.",
  ],
} satisfies BlueprintDeliveryProps;
