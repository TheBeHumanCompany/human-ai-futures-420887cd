import { FORM_ENDPOINT } from "@/lib/config";

/**
 * Posting the contact form.
 *
 * **This lives in `src/lib/` rather than in the route, and that is enforced.**
 * `src/lib/layering.test.ts` asserts that no file under `src/routes/` contains
 * a `fetch(` call — routes describe what a page is, not how it talks to the
 * network. Putting the POST inline in `contact.tsx` would turn that suite red.
 * It also makes this unit-testable without rendering a route.
 *
 * Errors are returned, never thrown. A form submission failing is an ordinary
 * outcome the UI has to render, not an exception — and a thrown error inside a
 * submit handler is the classic way a form ends up silently doing nothing,
 * which is the exact defect this replaces.
 */

export interface LeadPayload {
  name: string;
  email: string;
  organization: string;
  message: string;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "validation" | "network" | "rejected"; detail: string };

/** Minimal shape check — the real validation is the form service's. */
function validate(payload: LeadPayload): string | null {
  if (!payload.name.trim()) return "Please enter your name.";
  if (!payload.email.trim()) return "Please enter your email address.";
  // Deliberately permissive. A stricter pattern rejects valid addresses far more
  // often than it catches typos, and the only authority on whether an address
  // works is whether mail to it arrives.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    return "That email address does not look right.";
  }
  if (!payload.message.trim()) return "Please tell us what you are working on.";
  return null;
}

export async function submitLead(
  payload: LeadPayload,
  endpoint: string = FORM_ENDPOINT,
): Promise<SubmitResult> {
  const invalid = validate(payload);
  if (invalid) return { ok: false, reason: "validation", detail: invalid };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        organization: payload.organization.trim(),
        message: payload.message.trim(),
      }),
    });
  } catch (error) {
    // Offline, DNS failure, CORS rejection. The visitor can retry; what they
    // must not get is a form that appears to have worked.
    return {
      ok: false,
      reason: "network",
      detail: error instanceof Error ? error.message : "Network request failed.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "rejected",
      detail: `The form service returned ${response.status}.`,
    };
  }

  return { ok: true };
}
