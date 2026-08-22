/**
 * The three people, as data.
 *
 * Separated from the page that renders it for one stated reason: per-member
 * detail pages are coming, and the decision was that adding them later must
 * not be a restructuring job. A card built inline in JSX has to be taken
 * apart before it can also feed a `/who-we-are/<member>` route; this does not.
 * `id` is the React key today and the route segment when that day arrives.
 *
 * ── On the surnames ────────────────────────────────────────────────────────
 *
 * The source document (Blueprint PDF v4, pp. 9–10) reads "Sid [Last Name]"
 * and "Maya [Last Name]". Those brackets are a designer's placeholder for a
 * name nobody supplied. They are stripped, not filled: a plausible surname on
 * a team page is a fabricated fact about a real person, and it is the kind
 * that survives review because it reads correctly. A test asserts no
 * `[Last Name]` string reaches the DOM; nothing asserts a surname, because
 * there is no surname to assert.
 *
 * The credentials below ("certified cybersecurity professional", "certified
 * counsellor") are personal qualifications held by individuals. They are
 * deliberately exempt from the prohibited-claim rule that bars certification
 * language from product copy — that rule exists to stop the *service* from
 * claiming accreditation it does not have, not to erase people's real
 * training.
 */

export type TeamMember = {
  /** Stable key; also the route segment if per-member pages are added. */
  id: string;
  /** Exactly as it should be printed. No surname is inferred. */
  name: string;
  /** The discipline this person leads, verbatim from the source document. */
  role: string;
  /** Short descriptors under the name, where the source supplies them. */
  descriptors: readonly string[];
  /** Card body, one entry per paragraph. */
  bio: readonly string[];
  /**
   * A long-form page for this person, when one exists.
   *
   * Optional on purpose: only Shane has one (`/about-the-founder`, built from
   * Maya's 2026-08-18 brief). Carried as data rather than an `id === "shane"`
   * branch in the card, so the second and third profiles are a field each and
   * not another special case.
   */
  profile?: string;
};

export const TEAM: readonly TeamMember[] = [
  {
    id: "shane-james",
    name: "Shane James",
    profile: "/about-the-founder",
    role: "Founder & CEO",
    descriptors: ["Entrepreneur", "Business strategist", "Executive advisor"],
    bio: [
      "As a multi-business entrepreneur, Shane brings an operator's perspective to this transformation. He works directly with founders and leadership teams to determine where machine intelligence can create lasting business advantage — and where human judgment must remain central.",
    ],
  },
  {
    id: "sid",
    name: "Sid",
    role: "Machine Intelligence, Cybersecurity & Governance",
    descriptors: [
      "Machine intelligence implementation",
      "Cybersecurity",
      "Governance",
      "Data sovereignty",
    ],
    bio: [
      "Sid leads machine intelligence implementation, cybersecurity, governance, and data sovereignty. As a certified cybersecurity professional, he brings the discipline most adoption is missing entirely — the same rigor that protects a network, now applied to protecting your data, your decisions, and your systems as these tools enter them.",
      "He builds the secure foundation, defines the guardrails, and protects the information, systems, and decisions that matter most.",
    ],
  },
  {
    id: "maya",
    name: "Maya",
    role: "Human Readiness & Organizational Change",
    descriptors: ["Behaviour", "Communication", "Trust", "Change adoption"],
    bio: [
      "Maya leads the human side of transformation. As a certified counsellor, she brings a deep understanding of behaviour, communication, trust, and resistance to change — helping leaders and employees build the confidence and alignment that make adoption stick.",
    ],
  },
] as const;
