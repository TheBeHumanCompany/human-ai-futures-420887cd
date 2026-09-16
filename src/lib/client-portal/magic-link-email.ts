/**
 * Magic-link email delivery for the private client portal (US-006).
 *
 * Default send is the HTML link only. This module composes and delivers that
 * email through the existing Resend path (`updates.thebehumancompany.ca`
 * sender, plain `fetch` POST to the Resend API — the `lib/contact.ts`
 * no-SDK idiom), and it deliberately has no attachment step: there is no
 * `attachments` field anywhere in the payload, and a fixture send is asserted
 * to carry the client URL with zero PDF bytes. A PDF exists only through the
 * explicit on-request action in `report-pdf.ts` / `scripts/generate-client-pdf.ts`.
 *
 * Operator-initiated only. There is intentionally no `createServerFn`
 * wrapper here: no browser-facing form may trigger a magic-link send (an
 * anonymous endpoint that mails links on demand is a spam oracle), so the
 * caller is the operator tooling holding `RESEND_API_KEY`, not a route.
 */

import { CONTACT_EMAIL } from "../brand";
import { CATCHER_DIR_ENV, writeCatcherPayload } from "./email-catcher";

/** Canonical apex origin. No `www` variant anywhere on this path. */
export const CLIENT_PORTAL_ORIGIN = "https://thebehumancompany.ca";

/** The sender: the existing Resend-verified updates subdomain. */
export const MAGIC_LINK_FROM =
  process.env.RESEND_FROM ?? "The Be Human Company <website@updates.thebehumancompany.ca>";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Funnel-tier capture seam: when this env var names a directory, a "send"
 * is written there as one JSON file (the exact Resend request body, per
 * `email-catcher.ts`) instead of any network call — so the smoke suite can
 * read the magic link back with zero real email. Unset/empty means the
 * default behaviour is untouched. Checked BEFORE the API-key gate: the
 * funnel run is deliberately unconfigured for Resend, and a capture must
 * not require a key that would never be used.
 */
export { CATCHER_DIR_ENV };

function activeCatcherDir(): string | undefined {
  const dir = process.env[CATCHER_DIR_ENV];
  return typeof dir === "string" && dir.trim().length > 0 ? dir : undefined;
}

/** A provider call that never returns must not hold a request open forever. */
const SEND_TIMEOUT_MS = 10_000;

export interface MagicLinkRequest {
  /** Display name rendered in the greeting. */
  clientName: string;
  /** Recipient mailbox. */
  to: string;
  /** The client's long-lived portal URL (apex origin, `/c/<token>`). */
  clientUrl: string;
}

export interface MagicLinkResult {
  ok: boolean;
  reason?: "invalid" | "unconfigured" | "failed";
  message?: string;
}

function fail(reason: "invalid" | "unconfigured" | "failed", message: string): MagicLinkResult {
  return { ok: false, reason, message };
}

/**
 * The client's portal URL for a token. The single place the path shape is
 * built, so the template block, the fixture send, and any later caller share
 * one spelling — and that spelling carries the apex origin only.
 */
export function clientUrlForToken(token: string): string {
  return `${CLIENT_PORTAL_ORIGIN}/c/${token}`;
}

/** Minimal HTML escaping for the interpolated name and URL. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The email the client receives. HTML link plus a plain-text fallback, and
 * nothing else: no `attachments` key exists on this payload by construction,
 * so the default send cannot grow a PDF without someone adding the field —
 * which is exactly what the tests pin.
 */
export function composeMagicLinkEmail(request: MagicLinkRequest) {
  const name = escapeHtml(request.clientName.trim());
  const url = escapeHtml(request.clientUrl);
  return {
    from: MAGIC_LINK_FROM,
    to: [request.to.trim()],
    reply_to: CONTACT_EMAIL,
    subject: `${request.clientName.trim()} — your private blueprint link`,
    html: [
      `<p>Hi ${name},</p>`,
      `<p><strong>[Placeholder copy — final wording TBD.]</strong> Your preliminary blueprint is ready to read online:</p>`,
      `<p><a href="${request.clientUrl}">Open your private blueprint &rarr;</a></p>`,
      `<p>If the button does not work, paste this link into your browser:<br><a href="${request.clientUrl}">${url}</a></p>`,
      `<p>This link is personal to you — please do not forward it. If you would like a PDF copy, just reply to this email and we will send one.</p>`,
    ].join("\n"),
    text: [
      `Hi ${request.clientName.trim()},`,
      ``,
      `[Placeholder copy — final wording TBD.] Your preliminary blueprint is ready to read online:`,
      ``,
      request.clientUrl,
      ``,
      `This link is personal to you — please do not forward it. If you would like a PDF copy, just reply to this email and we will send one.`,
    ].join("\n"),
  };
}

/**
 * The delivery decision, mirroring `deliverEnquiry(data, deps)` in
 * `lib/contact.ts`: `deps` is the seam so every branch is exercisable
 * without a network, and `{ ok: true }` is reachable only after the
 * provider answered 2xx.
 */
export async function deliverMagicLinkEmail(
  request: MagicLinkRequest,
  deps: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    /** Test seam for the capture dir; defaults to the env var. Empty = unset. */
    catcherDir?: string;
  } = {},
): Promise<MagicLinkResult> {
  const apiKey = "apiKey" in deps ? deps.apiKey : process.env.RESEND_API_KEY;
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (request == null || typeof request !== "object") {
    return fail("invalid", "That request was not readable.");
  }
  if (typeof request.clientName !== "string" || request.clientName.trim().length === 0) {
    return fail("invalid", "A client name is required.");
  }
  if (typeof request.to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.to.trim())) {
    return fail("invalid", "A recipient address is required.");
  }
  if (
    typeof request.clientUrl !== "string" ||
    !request.clientUrl.startsWith(`${CLIENT_PORTAL_ORIGIN}/c/`)
  ) {
    return fail("invalid", "The client URL must be an apex client-portal link.");
  }

  const catcherDir = "catcherDir" in deps ? deps.catcherDir : activeCatcherDir();
  if (catcherDir) {
    try {
      await writeCatcherPayload(catcherDir, RESEND_ENDPOINT, composeMagicLinkEmail(request));
      return { ok: true };
    } catch (error) {
      console.error(
        `[client-portal] ${CATCHER_DIR_ENV} write failed: ${error instanceof Error ? error.message : error}`,
      );
      return fail(
        "failed",
        `Something went wrong sending that. Please email ${CONTACT_EMAIL} directly.`,
      );
    }
  }

  if (!apiKey) {
    return fail(
      "unconfigured",
      `Our mailer isn't connected yet — please email ${CONTACT_EMAIL} directly.`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(composeMagicLinkEmail(request)),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[client-portal] Resend ${response.status}: ${await response.text()}`);
      return fail(
        "failed",
        `Something went wrong sending that. Please email ${CONTACT_EMAIL} directly.`,
      );
    }
    return { ok: true };
  } catch (error) {
    console.error(`[client-portal] send failed: ${error instanceof Error ? error.message : error}`);
    return fail(
      "failed",
      `Something went wrong sending that. Please email ${CONTACT_EMAIL} directly.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
