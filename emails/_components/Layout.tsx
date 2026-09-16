import * as React from "react";
import { Body, Container, Font, Head, Html, Preview } from "react-email";

import { FONT_SANS, INK } from "./brand";
import { Footer } from "./Footer";
import { Header } from "./Header";

export interface LayoutProps {
  /** Inbox preview text; rendered first inside <Body> (and as <title>). */
  preview: string;
  /** Right-hand header chip, e.g. "Preliminary · Sep 2026". */
  headerLabel: string;
  /** First sentence of the footer legal block, template-specific. */
  footerNote: string;
  children: React.ReactNode;
}

/**
 * The shared 600px ink shell. <Font> emits `* { font-family: … }` per
 * declaration, so order matters: Work Sans last becomes the page default.
 * Every text element still carries its own full font stack inline, because
 * clients that drop <style> (Gmail) only see inline styles.
 */
export function Layout({ preview, headerLabel, footerNote, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Oswald"
          fallbackFontFamily={["Arial", "sans-serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/oswald/v57/TK3iWkUHHAIjg752GT8Gl-1PKw.woff2",
            format: "woff2",
          }}
          fontWeight="200 700"
        />
        <Font
          fontFamily="Caveat"
          fallbackFontFamily={["Georgia", "serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjcB9eIWpYT5Kmgq3sw.woff2",
            format: "woff2",
          }}
          fontWeight={500}
        />
        <Font
          fontFamily="Work Sans"
          fallbackFontFamily={["Arial", "sans-serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/worksans/v24/QGYsz_wNahGAdqQ43Rh_fKDptfpA4Q.woff2",
            format: "woff2",
          }}
          fontWeight="400 600"
        />
      </Head>
      <Body style={{ margin: 0, padding: 0, backgroundColor: INK, fontFamily: FONT_SANS }}>
        <Preview>{preview}</Preview>
        <Container style={{ width: 600, maxWidth: 600, backgroundColor: INK }}>
          <Header label={headerLabel} />
          {children}
          <Footer note={footerNote} />
        </Container>
      </Body>
    </Html>
  );
}
