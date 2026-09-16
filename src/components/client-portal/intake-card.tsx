import { useState } from "react";

import {
  ACCEPT_ATTRIBUTE,
  submitIntakeUpload,
  type IntakeQuestion,
} from "@/lib/client-portal/intake";
import {
  thankYouBooking,
  THANKYOU_OUTREACH,
  type ThankYouBooking,
} from "@/lib/client-portal/thankyou";

/**
 * The report-driven intake card (todo 10, G4, extracted from the portal
 * route so `/c/$token` can render it too): one question per final-tier
 * section of the client's blueprint, DERIVED rather than authored, so the
 * form is generated from the investigations the blueprint itself names.
 *
 * Identity is the caller's: the portal passes no `token` and the upload
 * resolves the client from the Clerk session; the token page passes the
 * URL's token and the upload resolves — and paywall-gates — through it.
 * A `questions` set that is empty renders nothing at all.
 */
export function IntakeCard({
  questions,
  token,
}: {
  questions: readonly IntakeQuestion[];
  token?: string;
}) {
  const [state, setState] = useState<IntakeCardState>({ kind: "idle" });
  const [uploading, setUploading] = useState(false);

  if (questions.length === 0) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (token !== undefined) data.append("token", token);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: "error", message: "Choose a file to upload first." });
      return;
    }
    setUploading(true);
    try {
      const outcome = await submitIntakeUpload({ data });
      switch (outcome.status) {
        case "stored":
          setState({ kind: "confirmed", name: file.name });
          form.reset();
          break;
        case "rejected":
          setState({ kind: "rejected", message: outcome.message });
          break;
      }
    } catch {
      setState({ kind: "error", message: INTAKE_UNAVAILABLE_MESSAGE });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section data-testid="intake-card" className="mt-12 border-t border-current/20 pt-10">
      <p className="eyebrow">Supporting documents</p>
      <h2 className="type-h3-caps-light mt-3">Send us what the audit still needs</h2>
      <ul className="mt-6 max-w-[58ch] space-y-3 text-base leading-relaxed text-ink/80">
        {questions.map((question) => (
          <li key={question.sectionKey} data-testid="intake-question">
            {question.prompt}
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-6 max-w-[58ch]">
        <input
          type="file"
          name="file"
          accept={ACCEPT_ATTRIBUTE}
          data-testid="intake-file-input"
          className="block w-full text-base text-ink/80"
        />
        <button
          type="submit"
          disabled={uploading}
          data-testid="intake-submit"
          className="eyebrow mt-6 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload document"}
        </button>
      </form>
      {state.kind === "rejected" && (
        <p
          data-testid="intake-rejection"
          role="alert"
          className="mt-6 max-w-[58ch] border border-current/20 px-4 py-3 text-base text-ink/80"
        >
          {state.message}
        </p>
      )}
      {state.kind === "error" && (
        <p
          data-testid="intake-error"
          role="alert"
          className="mt-6 max-w-[58ch] border border-current/20 px-4 py-3 text-base text-ink/80"
        >
          {state.message}
        </p>
      )}
      {state.kind === "confirmed" && (
        <>
          <div
            data-testid="intake-confirm"
            className="mt-6 max-w-[58ch] border border-current/20 px-4 py-3"
          >
            <p className="eyebrow">Received</p>
            <p className="mt-2 text-base leading-relaxed text-ink/80">
              {state.name} is uploaded. Your audit team has it — we will be in touch about what
              comes next.
            </p>
          </div>
          <ThankYouCard booking={thankYouBooking()} />
        </>
      )}
    </section>
  );
}

type IntakeCardState =
  | { kind: "idle" }
  | { kind: "confirmed"; name: string }
  | { kind: "rejected"; message: string }
  | { kind: "error"; message: string };

const INTAKE_UNAVAILABLE_MESSAGE = "The upload could not be completed. Please try again shortly.";

/**
 * The closing surface (todo 11, G5): the thank-you and the 24-hour outreach
 * promise, plus the booking CTA when a booking destination resolves. A
 * `null` booking renders the copy alone — no anchor, no dead link. Stateless
 * and exported so the funnel suite's contracts can render it offline.
 */
export function ThankYouCard({ booking }: { booking: ThankYouBooking | null }) {
  return (
    <section data-testid="thankyou" className="mt-10 border-t border-current/20 pt-10">
      <p className="eyebrow">What happens next</p>
      <h3 className="type-h4-caps mt-3">Thank you — your document is with the team.</h3>
      <p
        data-testid="thankyou-copy"
        className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink/80"
      >
        {THANKYOU_OUTREACH}
      </p>
      {booking !== null && (
        <a
          href={booking.href}
          data-testid="booking-cta"
          className="eyebrow mt-6 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream"
        >
          {booking.label}
        </a>
      )}
    </section>
  );
}
