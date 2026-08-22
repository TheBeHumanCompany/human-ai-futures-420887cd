import { createFileRoute } from "@tanstack/react-router";

import { PillarPage, type PillarSection } from "@/components/pillar-page";
import { POSITIONING_DISCLAIMER } from "@/lib/brand";

export const Route = createFileRoute("/be-human-ai/governance")({
  head: () => ({
    meta: [
      { title: "Governance & Sovereignty — Protect Your Organization | Be Human Intelligence" },
      {
        name: "description",
        content:
          "Governance gaps, shadow tool exposure, data flows, and the data-handling practices that keep an organization in control as these systems enter it.",
      },
      { property: "og:title", content: "Governance & Sovereignty — Protect Your Organization" },
      {
        property: "og:description",
        content: "Governance does not slow innovation. It protects it.",
      },
    ],
  }),
  component: Governance,
});

/**
 * ── Two copy constraints this page is written under ────────────────────────
 *
 * 1. **No definition of sovereignty is asserted.** The governance framework's
 *    own spine records a declared, signed-off divergence: it rescoped
 *    sovereignty from hosting geography to data handling, and its stated
 *    source of truth has not been updated to match. While those two disagree,
 *    any definition published here would contradict one of them. So this page
 *    describes *practices* — the specific things that are done and evidenced —
 *    and asserts no domain definition at all.
 *
 * 2. **No compliance or certification claim.** `controls.yaml`'s positioning
 *    line is explicit that the framework is readiness and assurance, not a
 *    compliance guarantee, and that its Maturity Score is not a certification.
 *    Public copy that overclaims here is a promise the framework itself
 *    refuses to make, so a prohibited-claim test runs against this page's
 *    rendered text as well as the Blueprint's.
 *
 * The practice list below is the framework's sovereignty theme vocabulary, not
 * a marketing paraphrase of it.
 */
const SECTIONS: readonly PillarSection[] = [
  {
    id: "visibility",
    heading: "You are losing visibility, not control of the tools",
    body: (
      <>
        <p>
          As these systems spread through an organization, it becomes harder to see where
          information is going, which systems touch it, and who is accountable for the decisions it
          influences.
        </p>
        <p>
          Most organizations do not discover how much visibility they have lost. They find out when
          something goes wrong. Governance does not slow innovation — it protects it.
        </p>
      </>
    ),
  },
  {
    id: "shadow-ai",
    heading: "Shadow tooling is a data-flow question",
    body: (
      <p>
        Tools adopted without review are not a discipline problem. They are an unmapped path
        business information now travels along. We trace how data actually moves through the systems
        in use — approved or not — and define the safeguards that close the gaps we find.
      </p>
    ),
  },
  {
    id: "practices",
    heading: "Sovereignty, described as practices",
    body: (
      <>
        <p>
          We do not offer you a definition of sovereignty to agree with. We look at whether a
          specific set of practices is in place, and whether there is evidence that they are:
        </p>
        <ul className="mt-2 space-y-2">
          <li>
            <strong className="text-ink">No-train and no-retention terms</strong> — contractual
            limits on what a provider may do with your prompts, uploads, and outputs.
          </li>
          <li>
            <strong className="text-ink">Redaction at the model boundary</strong> — personal and
            confidential data detected and masked by a control, not by an instruction in a policy
            document.
          </li>
          <li>
            <strong className="text-ink">A call-level audit trail</strong> — a record of what was
            sent, what came back, how long it is kept, and who can review it.
          </li>
          <li>
            <strong className="text-ink">Key management</strong> — control of the encryption keys
            that ultimately decide who can read your data.
          </li>
          <li>
            <strong className="text-ink">Exit and portability</strong> — the ability to retrieve
            your data on the way out, and to have the provider's copy deleted.
          </li>
        </ul>
        <p>
          Where processing happens, and under which jurisdiction, is one recorded and rationalized
          factor in a data-handling decision. It is a real factor. It is not the whole question, and
          treating it as the whole question is how organizations end up confident and exposed at the
          same time.
        </p>
      </>
    ),
  },
  {
    id: "leadership-questions",
    heading: "These are leadership questions before they are technical ones",
    body: (
      <>
        <p>As these systems become part of everyday business, leaders face real questions:</p>
        <ul className="mt-2 space-y-1.5">
          <li>Where is our data going?</li>
          <li>Who controls it?</li>
          <li>Which systems have access to it?</li>
          <li>Who is accountable when a machine influences a decision, or gets one wrong?</li>
          <li>What information should never leave our organization?</li>
        </ul>
        <p>
          That is why every engagement begins by mapping governance, data flows, and exposure before
          a single agent is designed or deployed.
        </p>
      </>
    ),
  },
  {
    id: "assessment-spine",
    heading: "What the review actually covers",
    body: (
      <>
        <p>
          The review runs against a documented control framework rather than a checklist assembled
          per engagement. It covers eight domains: governance; privacy and data handling;
          cybersecurity; vendor and third-party risk; sovereignty; operational risk; workforce
          readiness; and transparency and auditability.
        </p>
        <p className="type-body-sm border-l-2 border-ink/20 pl-4 text-ink/60">
          {POSITIONING_DISCLAIMER}
        </p>
      </>
    ),
  },
];

const FOCUS = [
  "Governance",
  "Security",
  "Shadow tool exposure",
  "Data flows",
  "Sovereignty practices",
] as const;

function Governance() {
  return (
    <PillarPage
      kicker="Be Human Intelligence · Protect your organization"
      title="Governance & Sovereignty"
      lede="We uncover governance gaps, trace how data actually moves through these systems, and define the safeguards that close them — before the technology is embedded in the business, not after."
      question="Are you still in control of your data, your decisions, and your future?"
      sections={SECTIONS}
      focusAreas={FOCUS}
    />
  );
}
