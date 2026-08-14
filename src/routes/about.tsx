import { createFileRoute } from "@tanstack/react-router";

/**
 * The company page — team, story and press.
 *
 * This page used to state the company's positioning: a headline and lede
 * making a claim about what being human is, and a section splitting the
 * business into a commercial arm and a cultural one. All of it is deleted —
 * that split is the model `/why-we-exist` replaces, and leaving a second
 * positioning statement live on
 * a page sitting beside one literally named "Why We Exist" would reproduce the
 * drift this work exists to end — two statements that must never disagree.
 *
 * What remains is deliberately a stub: the page name, the eyebrow and the
 * brand sign-off. It is awaiting Shane's team, story and press copy, and no
 * copy is invented for it here. The <h1> element is kept carrying the plain
 * page name rather than removed, because a page name is a fact rather than a
 * claim and deleting the heading would leave the route with no <h1> at all.
 *
 * `src/assets/manifesto.jpg` lost its only consumer with the deleted section.
 * The asset is left in place; deciding its fate is a follow-up.
 */
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Be Human Company" },
      {
        name: "description",
        content:
          "The team, the story and the press behind The Be Human Company. Indigenous and Canadian-owned.",
      },
      { property: "og:title", content: "About — The Be Human Company" },
      {
        property: "og:description",
        content: "Who we are and how we got here.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="section-cream border-b border-border">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:py-28">
        <p className="eyebrow text-ink/50">About</p>
        <h1 className="display mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] text-ink">
          About The Be Human Company
        </h1>
        <p className="font-hand mt-10 text-3xl text-ink/70">Stay Human.</p>
      </div>
    </section>
  );
}
