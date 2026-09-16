/**
 * The Resend Templates manifest: one entry per uploaded template, with the
 * dashboard metadata, the declared variables, and the placeholder props used
 * to render the uploaded HTML.
 *
 * `{{{KEY}}}` substitution on Resend is RAW (unescaped) — whoever sends with
 * `template.variables` must HTML-escape the values first.
 */
import type * as React from "react";

import BlueprintDelivery, { type BlueprintDeliveryProps } from "../blueprint-delivery";
import MagicLink, { type MagicLinkProps } from "../magic-link";
import { CONTACT_EMAIL, TEMPLATE_FROM } from "../_components/brand";

export type TemplateVariable = {
  key: string;
  type: "string" | "number";
  fallback_value?: string | number;
};

export type TemplateSpec<P> = {
  /** Stable Resend alias — the idempotency key for create-or-update. */
  alias: string;
  /** Dashboard display name. */
  name: string;
  from: string;
  subject: string;
  reply_to: string;
  component: (props: P) => React.JSX.Element;
  variables: TemplateVariable[];
  /** Props whose every leaf string is a `{{{KEY}}}` placeholder. */
  resendProps: P;
};

/** The P-erased view the upload script works with; `never` keeps variance sound. */
export type AnyTemplateSpec = Omit<TemplateSpec<never>, "component" | "resendProps"> & {
  component: (props: never) => React.JSX.Element;
  resendProps: object;
};

const blueprintDelivery: TemplateSpec<BlueprintDeliveryProps> = {
  alias: "blueprint-delivery",
  name: "Preliminary blueprint delivery",
  from: TEMPLATE_FROM,
  subject: "{{{COMPANY_NAME}}} — a preliminary blueprint from The Be Human Company",
  reply_to: CONTACT_EMAIL,
  component: BlueprintDelivery,
  variables: [
    { key: "RECIPIENT_FIRST_NAME", type: "string" },
    { key: "COMPANY_NAME", type: "string" },
    { key: "DATE_LABEL", type: "string" },
    {
      key: "PREVIEW_TEXT",
      type: "string",
      fallback_value: "Five findings, built from outside — before we asked you anything.",
    },
    { key: "PORTAL_URL", type: "string" },
    { key: "READ_MINUTES", type: "number", fallback_value: 15 },
    { key: "FINDING_1_TITLE", type: "string" },
    { key: "FINDING_2_TITLE", type: "string" },
  ],
  resendProps: {
    recipientFirstName: "{{{RECIPIENT_FIRST_NAME}}}",
    companyName: "{{{COMPANY_NAME}}}",
    dateLabel: "{{{DATE_LABEL}}}",
    previewText: "{{{PREVIEW_TEXT}}}",
    portalUrl: "{{{PORTAL_URL}}}",
    readMinutes: "{{{READ_MINUTES}}}",
    topFindings: ["{{{FINDING_1_TITLE}}}", "{{{FINDING_2_TITLE}}}"],
  },
};

const magicLink: TemplateSpec<MagicLinkProps> = {
  alias: "magic-link",
  name: "Private blueprint link",
  from: TEMPLATE_FROM,
  subject: "{{{COMPANY_NAME}}} — your private blueprint link",
  reply_to: CONTACT_EMAIL,
  component: MagicLink,
  variables: [
    { key: "RECIPIENT_FIRST_NAME", type: "string" },
    { key: "COMPANY_NAME", type: "string" },
    { key: "PORTAL_URL", type: "string" },
  ],
  resendProps: {
    recipientFirstName: "{{{RECIPIENT_FIRST_NAME}}}",
    companyName: "{{{COMPANY_NAME}}}",
    portalUrl: "{{{PORTAL_URL}}}",
  },
};

export const TEMPLATES: readonly AnyTemplateSpec[] = [blueprintDelivery, magicLink];
