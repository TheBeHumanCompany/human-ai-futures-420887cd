import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { CONTACT_EMAIL } from "./brand";

/**
 * The contact form's delivery path.
 *
 * ── What was here before ──────────────────────────────────────────────────
 *
 * `onSubmit={(e) => e.preventDefault()}`. The form validated, cleared, and
 * looked like it had worked. Every enquiry anyone typed into it since the site
 * went up was discarded on the spot, and nothing anywhere said so — which is
 * the worst version of this bug, because a form that visibly fails at least
 * tells the sender to email instead.
 *
 * ── Why an HTTP API and not SMTP ──────────────────────────────────────────
 *
 * This deploys to Cloudflare Workers (`nitro` preset `cloudflare-module`).
 * Workers cannot open outbound TCP to port 25/465/587, so nodemailer and every
 * other SMTP client is unavailable by construction, not by preference. Mail has
 * to leave over HTTPS, which means a provider API.
 *
 * Resend is that provider here: one POST, no SDK, no build step. Swapping it
 * for Postmark or SendGrid is this file and nothing else — the route, the form
 * and the tests all speak `ContactEnquiry`, not Resend.
 *
 * ── What must be configured before this delivers ──────────────────────────
 *
 * 1. `RESEND_API_KEY` in the deploy environment. Set 2026-08-19; the key is
 *    send-only restricted, which is why it cannot list domains.
 * 2. `updates.thebehumancompany.ca` verified at resend.com/domains. A sending
 *    SUBDOMAIN, not the apex — which is the right call: the apex keeps its
 *    Google Workspace MX and its own SPF, and a deliverability problem caused
 *    by bulk website mail cannot bleed into the mailbox people actually read.
 *
 *    Its three records were published on 2026-08-19 and check out from here:
 *    MX `send.updates…` -> feedback-smtp.us-east-1.amazonses.com, TXT `send.…`
 *    -> `v=spf1 include:amazonses.com ~all`, and TXT `resend._domainkey.…`
 *    carrying the DKIM key. The API was still answering 403 at the time of
 *    writing, which is the dashboard not having run its check yet rather than
 *    anything missing in DNS.
 *
 * Until (2) is done the form cannot deliver to the shared mailbox, and says so
 * rather than pretending — the 403 lands in the `!response.ok` branch below.
 *
 * Until both exist the handler returns `{ ok: false, reason: "unconfigured" }`
 * and the form tells the visitor to email directly. That is deliberate: a
 * missing key must degrade to a visible fallback, never to a silent success,
 * because a silent success is exactly the defect being fixed.
 */

/**
 * The address enquiries are sent FROM. Must be on a Resend-verified domain.
 *
 * Overridable so that flipping between the sandbox sender and the real one is
 * configuration rather than a deploy of changed code — `onboarding@resend.dev`
 * works today without verification but can only reach the account owner, which
 * makes it useful for proving the path and useless for actual enquiries.
 */
const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "The Be Human Company <website@updates.thebehumancompany.ca>";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** A provider call that never returns must not hold a request open forever. */
const SEND_TIMEOUT_MS = 10_000;

/**
 * Rate limiting, and an honest account of what it is worth.
 *
 * Review fired 50 concurrent valid submissions and got 50 provider calls. The
 * honeypot does nothing there — a script simply omits the field — so the form
 * exposed the mailbox, the Resend quota, the bill, and the sending reputation
 * to anyone with a loop.
 *
 * This limiter is per instance and in memory. On Vercel that means it is real
 * for a burst hitting one warm instance and porous across a fan-out or a cold
 * start, so it RAISES THE COST of abuse rather than preventing it. That is
 * worth having and is not worth overstating: durable protection is the
 * platform firewall or a shared store (Upstash), both of which are account
 * decisions rather than code, and both are recorded as open items in the spec.
 *
 * The window is deliberately generous. A person sending a second enquiry, or a
 * couple from the same office NAT, must never be turned away — the cost of a
 * false positive here is a lost customer, which is worse than the spam.
 */
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000, sweepAt: 5_000 } as const;

const hits = new Map<string, number[]>();

/** Exported for tests; also the seam that keeps the clock out of the logic. */
export function rateLimited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  // Unbounded growth is a memory leak on a long-lived instance, so the map is
  // swept whenever it gets large rather than on a timer nothing else needs.
  if (hits.size > RATE_LIMIT.sweepAt) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(k);
    }
  }
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(key, recent);
    return true;
  }
  hits.set(key, [...recent, now]);
  return false;
}

/**
 * Every message the visitor can be shown when nothing was sent.
 *
 * One object rather than four template literals scattered through the branches
 * — and the client imports `FALLBACK.failed` instead of writing its own copy of
 * the sentence. The address inside them is the thing that matters: a drifted
 * copy sends someone to a mailbox that does not exist, and it is invisible
 * until a real enquiry goes missing.
 */
export const FALLBACK = {
  ignored: `We couldn't send that. Please email ${CONTACT_EMAIL} directly.`,
  throttled: `That's a few messages in a short while — please email ${CONTACT_EMAIL} directly.`,
  unconfigured: `Our form isn't connected yet — please email ${CONTACT_EMAIL} directly.`,
  failed: `Something went wrong sending that. Please email ${CONTACT_EMAIL} directly.`,
} as const;

/** Caps, so a scripted post cannot mail a megabyte into the inbox. */
const LIMITS = { name: 200, email: 320, org: 200, message: 5000 } as const;

export type ContactEnquiry = {
  name: string;
  email: string;
  org: string;
  message: string;
  /**
   * Honeypot. Real people never see this field, so anything in it is a bot.
   *
   * Named `fax` deliberately. The obvious name for a hidden decoy is `website`
   * or `url` — and those are exactly the names password managers and browser
   * autofill will happily complete, hidden or not. A real visitor whose manager
   * filled it would have their enquiry silently dropped, which is the original
   * defect wearing a security hat. Nothing autofills a fax number in 2026.
   */
  fax?: string;
};

/**
 * `ok: true` means the provider ACCEPTED the message for delivery — not that it
 * landed. Resend's send endpoint returns acceptance; delivery is a later
 * `email.delivered` webhook, and a message can still bounce or be suppressed
 * after a 2xx. The confirmation copy says "on its way" rather than "delivered"
 * for exactly that reason.
 *
 * `ignored` is the honeypot. It is NOT a success: telling a visitor their
 * enquiry arrived when it was dropped is the original defect, and a bot that
 * trips a honeypot is not owed a polite lie. It carries the same direct-email
 * fallback, so a real person who somehow trips it still has a way through.
 */
export type ContactResult =
  | { ok: true; state: "accepted" }
  | {
      ok: false;
      reason: "invalid" | "unconfigured" | "failed" | "ignored" | "throttled";
      message: string;
    };

/**
 * Server-side validation.
 *
 * Exported and tested directly: the browser's `required` and `type="email"`
 * are a convenience for the person filling the form in, and are absent from
 * every request that does not come from the form.
 */
export function validateEnquiry(input: ContactEnquiry): string | null {
  // Coerced, not trusted. `createServerFn().validator()` below is a TypeScript
  // identity function — it narrows the type for callers and parses nothing at
  // runtime, so a hand-rolled POST can put a number, an object or null in any
  // of these. `.trim()` on those throws, and a 500 is a worse answer than a
  // validation message.
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const name = str(input.name).trim();
  const email = str(input.email).trim();
  const message = str(input.message).trim();

  if (!name) return "Please tell us your name.";
  if (!email) return "Please give us an email address to reply to.";
  // Deliberately permissive. Anything stricter than "one @ with something
  // either side and a dot in the domain" starts rejecting valid addresses,
  // and the reply bouncing is a better failure than the form refusing a real
  // person who typed their real address.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email address looks incomplete.";
  if (!message) return "Please tell us what you're working on.";

  for (const [field, max] of Object.entries(LIMITS)) {
    if (str(input[field as keyof typeof LIMITS]).length > max) {
      return `That ${field} is too long.`;
    }
  }
  return null;
}

/** The email the mailbox receives. Plain text; this is a notification, not a newsletter. */
export function composeEnquiryEmail(input: ContactEnquiry) {
  const name = input.name.trim();
  const email = input.email.trim();
  const org = input.org?.trim() || "—";

  return {
    from: FROM_ADDRESS,
    to: [CONTACT_EMAIL],
    // So hitting Reply in Gmail answers the person, not the website.
    reply_to: email,
    subject: `Website enquiry — ${name}${org !== "—" ? `, ${org}` : ""}`,
    text: [
      `Name:         ${name}`,
      `Email:        ${email}`,
      `Organization: ${org}`,
      "",
      "What are you working on?",
      "",
      input.message.trim(),
      "",
      "—",
      "Sent from the contact form at thebehumancompany.ca/contact",
    ].join("\n"),
  };
}

/**
 * The delivery decision, separated from the server-function wrapper so every
 * branch can be exercised directly.
 *
 * `deps` is the seam. The property being proven is narrow and total: this
 * returns `{ ok: true }` for a real enquiry ONLY after the provider answered
 * 2xx. Everything else — no key, non-2xx, a throw — returns a visible failure
 * carrying the direct-email fallback. A test that cannot reach those branches
 * cannot prove that, and "cannot report success without delivery" is the whole
 * point of this module.
 */
export async function deliverEnquiry(
  data: ContactEnquiry,
  deps: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
    onBotDetected?: () => void;
    /** Caller identity for rate limiting. Omitted in tests that do not exercise it. */
    clientKey?: string;
    now?: number;
  } = {},
): Promise<ContactResult> {
  const apiKey = "apiKey" in deps ? deps.apiKey : process.env.RESEND_API_KEY;
  const fetchImpl = deps.fetchImpl ?? fetch;

  // `data` crosses the wire and the validator below is a TypeScript identity,
  // so a hand-rolled POST can send null. Reading `.fax` off it would throw
  // before any of the checks ran.
  if (data == null || typeof data !== "object") {
    return { ok: false, reason: "invalid", message: "That request was not readable." };
  }

  // Honeypot. Nothing is sent, so nothing is confirmed — the visitor gets the
  // direct-email fallback. An earlier version returned `ok` here on the theory
  // that a bot told "failed" simply retries; that traded a real person's
  // enquiry for a marginal anti-spam gain, which is the exact bargain this
  // module exists to refuse. Logged as well, so a false positive is findable.
  if (data.fax) {
    (deps.onBotDetected ?? (() => console.warn("[contact] honeypot tripped; enquiry dropped")))();
    return {
      ok: false,
      reason: "ignored",
      message: FALLBACK.ignored,
    };
  }

  const invalid = validateEnquiry(data);
  if (invalid) return { ok: false, reason: "invalid", message: invalid };

  // After validation, so a malformed flood is refused without occupying a slot
  // a real person might need.
  if (deps.clientKey && rateLimited(deps.clientKey, deps.now ?? Date.now())) {
    console.warn(`[contact] rate limited ${deps.clientKey}`);
    return { ok: false, reason: "throttled", message: FALLBACK.throttled };
  }

  if (!apiKey) {
    return {
      ok: false,
      reason: "unconfigured",
      message: FALLBACK.unconfigured,
    };
  }

  const failed = {
    ok: false,
    reason: "failed",
    message: FALLBACK.failed,
  } as const;

  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(composeEnquiryEmail(data)),
    });

    if (!response.ok) {
      // The provider's body is logged, never shown: it can echo the key prefix
      // and the recipient, and neither belongs on a public page.
      console.error(`[contact] Resend ${response.status}: ${await response.text()}`);
      return failed;
    }
    return { ok: true, state: "accepted" };
  } catch (error) {
    console.error(`[contact] send failed: ${error instanceof Error ? error.message : error}`);
    return failed;
  }
}

export const sendContactEnquiry = createServerFn({ method: "POST" })
  .validator((data: ContactEnquiry) => data)
  .handler(({ data }): Promise<ContactResult> => {
    // The caller's address, from the proxy header the platform sets. Absent
    // (or spoofed) it falls back to a single shared bucket, which throttles
    // everyone together rather than nobody — the safe direction for a form
    // whose whole purpose is to be low-volume.
    const request = getRequest();
    const forwarded = request?.headers.get("x-forwarded-for") ?? "";
    const clientKey = forwarded.split(",")[0]?.trim() || "unknown-client";
    return deliverEnquiry(data, { clientKey });
  });
