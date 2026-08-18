import portrait1Asset from "@/assets/archive-adewolf.png.asset.json";
import portrait2Asset from "@/assets/archive-bella.png.asset.json";
import portrait3Asset from "@/assets/archive-anton.png.asset.json";
import portrait4Asset from "@/assets/archive-arlina.png.asset.json";

const portrait1 = portrait1Asset.url;
const portrait2 = portrait2Asset.url;
const portrait3 = portrait3Asset.url;
const portrait4 = portrait4Asset.url;

export const SERVICES = [
  {
    n: "01",
    title: "AI Readiness & Strategy",
    body: "We assess where your organization actually stands, then build a sequenced roadmap tied to business outcomes rather than experiments.",
    points: ["Readiness assessment", "Use-case prioritisation", "Investment roadmap"],
  },
  {
    n: "02",
    title: "Human + AI Transformation",
    body: "We redesign how work gets done so people and AI complement each other — with adoption that survives the pilot phase.",
    points: ["Operating model design", "Change & adoption", "AI literacy programs"],
  },
  {
    n: "03",
    title: "Security, Privacy & Governance",
    body: "We protect what matters: your data, your customers and your license to operate, with governance leaders can actually enforce.",
    points: ["Risk & controls", "Policy frameworks", "Regulatory alignment"],
  },
  {
    n: "04",
    title: "AI Agents & Workflow Design",
    body: "We design, build and deploy agents into real workflows, measured on cycle time, quality and cost — not novelty.",
    points: ["Agent architecture", "Workflow automation", "Measurement & ROI"],
  },
] as const;

/**
 * The six principle titles — the ONE definition, consumed by `HOME_PRINCIPLES`
 * below, by `/the-new-human-era`, and by the tests that prove them (AC-5.4b).
 *
 * Verbatim from the manifesto PDF p.9, and **period-free** (AC-5.9a; Maya,
 * 2026-08-15). Three competing forms had been in circulation at once — the PDF's
 * `"Built in the Reps."`, this file's `"Build the reps."`, and AC-5.4's
 * period-free listing — precisely because each consumer kept its own hand-typed
 * copy. A second list anywhere is how that recurs, so there is exactly one.
 */
export const PRINCIPLE_TITLES = [
  "Fully Here",
  "Keep Your Own Mind",
  "Your Word Carries Weight",
  "Real Is Rare",
  "Know What Matters",
  "Built in the Reps",
] as const;

/**
 * The six principles, short and chant-like — culture, not service copy. Titles
 * come from `PRINCIPLE_TITLES`; only the bodies are defined here.
 *
 * The longer six-item const that used to sit above this one ("Presence is the
 * new luxury", "Wisdom is the new intelligence", …) was superseded by the
 * manifesto and is deleted (AC-5.5). These six are the only principles.
 * Its name is deliberately not written here: the AC-5.5 proof greps the source
 * for that bare identifier and expects zero hits, so naming it in prose would
 * fail the gate exactly as a surviving reference would.
 */
export const HOME_PRINCIPLES = [
  { n: "01", title: PRINCIPLE_TITLES[0], body: "Presence is the new luxury." },
  { n: "02", title: PRINCIPLE_TITLES[1], body: "Think for yourself. Always." },
  { n: "03", title: PRINCIPLE_TITLES[2], body: "Say it. Mean it. Live it." },
  { n: "04", title: PRINCIPLE_TITLES[3], body: "Authenticity is how we stand out." },
  { n: "05", title: PRINCIPLE_TITLES[4], body: "Clarity comes from what you value." },
  { n: "06", title: PRINCIPLE_TITLES[5], body: "Small daily actions shape who we become." },
] as const;

export const ARCHIVE = [
  {
    image: portrait1,
    name: "ADEWOLF",
    location: "Vancouver, Canada",
    no: "046",
    slug: "adewolf",
    quote: "Love.\nLove each other.",
  },
  {
    image: portrait2,
    name: "BELLA",
    location: "Vancouver, Canada",
    no: "026",
    slug: "bella",
    quote: "Fun.\nEnjoying your life\nto the end.",
  },
  {
    image: portrait3,
    name: "ANTON",
    location: "Toronto, Canada",
    no: "010",
    slug: "anton",
    quote: "Passion, compassion\nand patience towards\nyour fellow humans.",
  },
  {
    image: portrait4,
    name: "ARLINA",
    location: "Chitre, Panama",
    no: "037",
    slug: "arlina",
    quote: "Empathy.\nWith people and\nanything you do in life.",
  },
] as const;

// Episodes are no longer hardcoded here. They come live from the PodBean RSS
// feed — see `src/lib/podbean`.
