import { PILLAR_ROUTES } from "@/lib/sales/pillars";

import portrait1Asset from "@/assets/archive-adewolf.png.asset.json";
import portrait2Asset from "@/assets/archive-bella.png.asset.json";
import portrait3Asset from "@/assets/archive-anton.png.asset.json";
import portrait4Asset from "@/assets/archive-arlina.png.asset.json";

const portrait1 = portrait1Asset.url;
const portrait2 = portrait2Asset.url;
const portrait3 = portrait3Asset.url;
const portrait4 = portrait4Asset.url;

/**
 * The three service pillars.
 *
 * This replaced a four-item capability list — AI Readiness & Strategy, Human +
 * AI Transformation, Security Privacy & Governance, AI Agents & Workflow Design
 * — which described the same work but did not match the approved sales copy.
 * That copy frames the offering as three sequenced moments rather than four
 * parallel capabilities, and the sequence is the argument: prepare people first,
 * protect what matters second, and only then transform, because doing them in
 * any other order compounds whatever is already misaligned.
 *
 * `to` deep-links each card to its pillar page. Its literal type comes from
 * `PILLAR_ROUTES`, so renaming a route breaks the build rather than the link.
 */
export const SERVICES = [
  {
    n: "01",
    title: "Human Readiness",
    promise: "Prepare your people",
    body: "Every successful AI transformation starts with leadership, not technology. We build the clarity, confidence and shared direction that adoption depends on.",
    points: ["Leadership readiness", "Employee AI usage", "Culture & confidence"],
    to: PILLAR_ROUTES["human-readiness"],
  },
  {
    n: "02",
    title: "Security, Governance & Sovereignty",
    promise: "Protect your organization",
    body: "We uncover governance gaps, trace how data actually moves through AI systems, and define the safeguards that close them — before anything is deployed.",
    points: ["Governance & security", "Shadow AI exposure", "Data sovereignty"],
    to: PILLAR_ROUTES.governance,
  },
  {
    n: "03",
    title: "AI Strategy & Transformation",
    promise: "Transform your business",
    body: "We rank opportunities across workflows, operations and customer experience by business value, effort and long-term advantage — not by what is trending.",
    points: ["AI opportunity ranking", "Workflow transformation", "90-day roadmap"],
    to: PILLAR_ROUTES["ai-strategy"],
  },
] as const;

export const PRINCIPLES = [
  {
    n: "01",
    title: "Presence is the new luxury",
    body: "Attention is the scarcest resource of the decade. In a distracted world, being fully here is a competitive act.",
  },
  {
    n: "02",
    title: "Wisdom is the new intelligence",
    body: "Knowledge is abundant and cheap. Judgment — knowing what matters and what doesn't — is not.",
  },
  {
    n: "03",
    title: "Humanity is the advantage",
    body: "Empathy, courage and compassion are the capabilities machines cannot copy or counterfeit.",
  },
  {
    n: "04",
    title: "Real is rare",
    body: "As synthetic content becomes endless, authenticity stops being a value and becomes a currency.",
  },
  {
    n: "05",
    title: "Trust wins",
    body: "Trust compounds over time. It is the foundation of every lasting relationship, team and brand.",
  },
  {
    n: "06",
    title: "Character is earned",
    body: "Character isn't claimed in a statement. It's revealed in how you show up — every day.",
  },
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
