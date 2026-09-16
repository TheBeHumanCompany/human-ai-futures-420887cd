import * as React from "react";
import { Link, Section } from "react-email";

import { BodyText } from "./_components/BodyText";
import { Display } from "./_components/Display";
import { Eyebrow } from "./_components/Eyebrow";
import { Layout } from "./_components/Layout";
import { LIME } from "./_components/brand";
import { PillButton } from "./_components/PillButton";
import { SignOff } from "./_components/SignOff";

export type MagicLinkProps = {
  recipientFirstName: string;
  companyName: string;
  portalUrl: string;
};

const FOOTER_NOTE =
  "Sent to you personally. The link above is private to you — please do not forward it.";

/** The short private-portal-link send: one CTA, paste fallback, PDF-on-request line. */
export default function MagicLink({ recipientFirstName, companyName, portalUrl }: MagicLinkProps) {
  return (
    <Layout
      preview={`Your preliminary blueprint for ${companyName} is ready to read online.`}
      headerLabel="Private client link"
      footerNote={FOOTER_NOTE}
    >
      <Section style={{ padding: "56px 32px 32px" }}>
        <div style={{ paddingBottom: 22 }}>
          <Eyebrow>Your preliminary blueprint</Eyebrow>
        </div>
        <div style={{ paddingBottom: 18 }}>
          <Display size={40}>
            {recipientFirstName},<br />
            your blueprint is ready.
          </Display>
        </div>
        <BodyText>
          Your preliminary blueprint for {companyName} is ready to read online. The link below is
          personal to you — please do not forward it.
        </BodyText>
      </Section>

      <Section style={{ padding: "8px 32px 16px" }}>
        <PillButton href={portalUrl}>Read your preliminary blueprint →</PillButton>
      </Section>

      <Section style={{ padding: "0 32px 40px" }}>
        <div style={{ paddingBottom: 18 }}>
          <BodyText muted>
            If the button does not work, paste this link into your browser:
            <br />
            <Link
              href={portalUrl}
              style={{ color: LIME, textDecoration: "none", wordBreak: "break-all" }}
            >
              {portalUrl}
            </Link>
          </BodyText>
        </div>
        <BodyText>If you would like a PDF copy, reply to this email and we will send one.</BodyText>
      </Section>

      <SignOff />
    </Layout>
  );
}

MagicLink.PreviewProps = {
  recipientFirstName: "Desirée",
  companyName: "Voes & Co",
  portalUrl: "https://thebehumancompany.ca/c/preview-token",
} satisfies MagicLinkProps;
