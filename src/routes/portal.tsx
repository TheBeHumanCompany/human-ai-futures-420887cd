import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { companyInitial, fetchPortalPage } from "@/lib/client-portal/portal";
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
 * The signed-in client portal (US-009).
 *
 * The loader's server function is the whole gate: an unsigned visitor is
 * redirected to sign-in before any data is fetched, and a signed-in
 * visitor reads exactly what RLS grants their Clerk token — this route
 * never holds a client id it could mistakenly share. Like `/c/$token`,
 * every state of this page is private, so `noindex` is unconditional
 * across branches rather than per-branch.
 */
export const Route = createFileRoute("/portal")({
  loader: async () => await fetchPortalPage(),

  head: () => ({
    meta: [{ title: "Your portal" }, { name: "robots", content: "noindex" }],
  }),

  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: PortalPage,
});

function PortalPage() {
  const { reports, company, intake } = Route.useLoaderData();

  return (
    <section className="section-cream">
      {/* Shell width matches the site's page vocabulary; the report body
          below stays width-unconstrained because the authored HTML is a
          self-contained document with its own `.page` max-width and
          gutters — a prose measure here was the "report too narrow"
          defect. The empty-state paragraph keeps the 58ch prose measure
          because it is site copy, not client content. */}
      <div className="mx-auto w-full max-w-[1180px] px-6 py-12 sm:px-8">
        {/* The company identity (todo 9, G3), mirroring /c/$token's header
            row: same avatar classes (US-004), initial resolved by the same
            rule. A client the store cannot name still gets the avatar —
            the "?" fallback — but no name line. */}
        <div className="flex items-center gap-3">
          <Avatar className="bg-ink text-cream" data-testid="portal-company-avatar">
            <AvatarFallback className="bg-ink text-cream">
              {companyInitial(company?.name)}
            </AvatarFallback>
          </Avatar>
          {company !== null && (
            <p className="eyebrow" data-testid="portal-company-name">
              {company.name}
            </p>
          )}
        </div>
        <p className="eyebrow mt-3">Client portal</p>
        <h1 className="type-h3-caps-light mt-3">Your reports</h1>
        {reports.length === 0 ? (
          <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink/80">
            No reports are linked to this account yet. If you recently paid, sign in with the email
            you used at checkout — your blueprint appears here once payment completes. Your magic
            link keeps working in the meantime.
          </p>
        ) : (
          reports.map((report) => (
            <article key={report.client_id} id={`report-${report.client_id}`} className="mt-8">
              <h2 className="type-h4-caps">{report.title}</h2>
              <div
                className="mt-6 max-w-none space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80"
                dangerouslySetInnerHTML={{ __html: report.html }}
              />
            </article>
          ))
        )}
        {/* The report-driven intake (todo 10, G4): one question per final
            section the session's RLS read can see, so the card exists only
            downstream of the paywall — before payment the set is empty and
            it renders nothing. */}
        <IntakeCard questions={intake.questions} />
      </div>
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
 * The supporting-document card. A rejection answers with the upload
 * policy's own message — the server judged the file, so the inline text is
 * `explain`'s, verbatim. The confirmation branch is reachable only on a
 * stored outcome: the server function returns it after the storage write
 * answered 2xx, never on a promise to write.
 *
 * Re-uploading is allowed: each submission mints a fresh storage key, so a
 * corrected document is a new object (the prior one stays in the bucket)
 * and the confirmation simply shows the newest upload.
 */
export function IntakeCard({ questions }: { questions: readonly IntakeQuestion[] }) {
  const [state, setState] = useState<IntakeCardState>({ kind: "idle" });
  const [uploading, setUploading] = useState(false);

  if (questions.length === 0) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
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
