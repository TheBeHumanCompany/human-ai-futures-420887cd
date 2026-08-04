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



export const EPISODES = [
  { n: "12", title: "The CEO who fired the roadmap", guest: "Marta Nilsen", length: "48 min" },
  { n: "11", title: "Governance is a growth strategy", guest: "Devon Wallace", length: "52 min" },
  { n: "10", title: "Teaching 8,000 people to use AI", guest: "Priya Ramesh", length: "41 min" },
] as const;
