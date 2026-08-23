/**
 * Fault injection for `prod-acceptance.sh`.
 *
 * ── Why ────────────────────────────────────────────────────────────────────
 *
 * During review, Codex ran an isolated version of the production check — a
 * `fetch_ok` plus a "no `__l5e` substring" assertion — against Wikipedia. It
 * PASSED. Any large HTML page with no `__l5e` in it satisfies that sub-gate,
 * so it established neither the site's identity nor its correctness. A
 * production check that green-lights Wikipedia is not a production check.
 *
 * A gate that has never been observed failing is a gate of unknown strength.
 * These cases are the minimum evidence that it can fail at all: each serves a
 * deliberately broken site from a local server and asserts the real script
 * exits non-zero on it, FOR THE STATED REASON.
 *
 * The headline case is the first one. Correct, byte-for-byte copied DOM served
 * from a disallowed host must fail — because ORIGIN, not content, is what
 * proves identity, and that is exactly the case a content-only gate cannot
 * catch no matter how many content assertions it accumulates.
 *
 * ── One note on how this file spawns ───────────────────────────────────────
 *
 * `spawnSync` is deliberately NOT used. The fixture server runs in this
 * process, and a synchronous spawn blocks the event loop that would have
 * answered its requests — so curl times out, the gate exits non-zero, and
 * every "the gate rejected it" assertion passes. It passes because nothing was
 * ever served. That was observed here before this comment existed: the origin
 * case went green on the string `FAIL[origin of …]` produced by a connection
 * timeout rather than by a host mismatch, which is the same false green this
 * whole file exists to prevent, reproduced inside the file preventing it.
 *
 * Hence async spawn; hence `served` is asserted on every case; and hence every
 * assertion names the REASON rather than settling for a non-zero exit.
 *
 * Run: bun test scripts/
 */

import { afterAll, describe, expect, test } from "bun:test";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "verify", "prod-acceptance.sh");

/** The gate makes ~30 requests across 8 surfaces and starts `bun` three times. */
const TEST_TIMEOUT = 120_000;

/**
 * Fixture content that the gate derives rather than hardcodes must be derived
 * here too, from the same source.
 *
 * AC-2.8b's requirement is that implementation and proof consume ONE shared
 * constant — "neither may hardcode the copy independently". A fixture with its
 * own copy of the Indigenous line would be a third hardcoding, and the day the
 * constant changed, this suite would start failing for a reason that has
 * nothing to do with the faults it injects.
 *
 * These load lazily because the modules they read are owned by later phases.
 * Absent, the gate reports SKIP and the fixture simply omits the section.
 */
async function optionalConstant<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

const brand = await optionalConstant(
  async () => (await import("../../src/lib/brand.ts")) as { INDIGENOUS_LINE: string },
);

const principles = await optionalConstant(async () => {
  const file = Bun.file(path.join(REPO_ROOT, "docs", "principles.json"));
  return (await file.json()) as string[];
});

const blueprintSections = await optionalConstant(async () => {
  const file = Bun.file(path.join(REPO_ROOT, "docs", "blueprint-sections.json"));
  const doc = (await file.json()) as { sections?: Array<{ id: string; tier: number }> };
  // The fixture is `{ $comment, sections: [...] }`, not a bare array. Asserted
  // rather than assumed: an earlier version of this file destructured it as an
  // array, and the resulting `.map is not a function` surfaced as a fixture
  // crash mid-suite rather than as anything legible.
  if (!Array.isArray(doc.sections))
    throw new Error("blueprint-sections.json has no sections array");
  return doc.sections;
});

/** A minimally correct page: enough that the real gate passes on it unmutated. */
function goodPage(pathname: string): string {
  const nav = `<nav aria-label="Main"><a href="/">Home</a></nav>`;
  const subnav =
    pathname === "/be-human-ai"
      ? `<nav aria-label="On this page"><a href="#hero">Hero</a></nav>`
      : "";
  const filler = "<p>" + "The future belongs to the most human. ".repeat(400) + "</p>";
  const images = ["one", "two", "three", "four"]
    .map((n) => `<img src="/assets/${n}.webp" alt="${n}">`)
    .join("");

  // ── the archive, as it is actually laid out since the 2026-08-19 deferral ──
  //
  // The four entries render on the homepage section and on /the-new-human-era;
  // /the-human-archive is a teaser that names none of them. The fixture has to
  // model that split rather than stamping the entries onto every page: with the
  // entries everywhere, the component's "the deferred page lists no entries"
  // assertion would fail the control, and with them nowhere the AC-7.1 case
  // would pass vacuously.
  const deferred = pathname === "/the-human-archive";
  const archive = deferred
    ? `<p>To be released soon</p>`
    : ["ADEWOLF", "BELLA", "ANTON", "ARLINA"].map((n) => `<h3>${n}</h3>`).join("");
  // Fingerprinted the way the bundler emits them — the stem is what the gate
  // counts, because a bare <img> floor passes on the collage alone.
  const portraits = deferred
    ? ""
    : ["adewolf", "bella", "anton", "arlina"]
        .map((n) => `<img src="/assets/archive-${n}-a1b2c3d4.png" alt="${n}">`)
        .join("");
  // The good page carries NO price. AC-6.3 was inverted on 2026-08-22: the
  // Blueprint is no longer sold from the website, so a rate rendering here is
  // the regression rather than the requirement. What the page must carry
  // instead is the exclusivity line, which is what replaced the offer.
  const positioning = `<p>We work with a small number of organizations at a time.</p>`;
  const footer = brand ? `<footer><p>🍁 ${brand.INDIGENOUS_LINE}</p></footer>` : "";
  const principleList = principles
    ? `<ul>${principles.map((p) => `<li>${p}</li>`).join("")}</ul>`
    : "";
  // Only tier-2 sections are collapsed, matching what the gate derives from the
  // fixture. Wrapping all 16 in <details> would make the fixture disagree with
  // the page it stands in for, and the control test would fail for a reason
  // that has nothing to do with the injected faults.
  //
  // `data-section-id` is not decoration: blueprint.sh counts section-level
  // disclosures by that attribute precisely so the FAQ's nine nested <details>
  // do not inflate the count. Without it the control failed on
  // "AC-6.9b/c: got 0 want 7" — and because the driver exits at the first
  // failure, every fault case after it was passing on the WRONG rejection.
  const sections =
    blueprintSections && pathname === "/be-human-ai"
      ? blueprintSections
          .map((s) =>
            s.tier === 2
              ? `<section id="${s.id}"><details data-section-id="${s.id}"><summary>${s.id}</summary>${filler}</details></section>`
              : `<section id="${s.id}">${filler}</section>`,
          )
          .join("")
      : "";
  return [
    `<!doctype html><html><head><title>The Be Human Company</title></head><body>`,
    nav,
    subnav,
    `<main data-path="${pathname}">`,
    images,
    portraits,
    archive,
    positioning,
    principleList,
    sections,
    filler,
    `</main>`,
    footer,
    `</body></html>`,
  ].join("");
}

type Mutator = (pathname: string, html: string) => string;

const servers: Array<{ stop: (force?: boolean) => void }> = [];
afterAll(() => {
  for (const s of servers) s.stop(true);
});

type GateResult = { code: number; output: string; served: number };

/**
 * Serves `goodPage`, optionally mutated, and runs the real gate against it.
 *
 * `served` counts requests the fixture actually answered — a gate that failed
 * without ever reaching the fixture proves nothing about the fixture's fault.
 */
async function runAgainstFixture(
  mutate?: Mutator,
  env: Record<string, string> = {},
): Promise<GateResult> {
  let served = 0;
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      served += 1;
      const { pathname } = new URL(req.url);
      const base = goodPage(pathname);
      return new Response(mutate ? mutate(pathname, base) : base, {
        headers: { "content-type": "text/html" },
      });
    },
  });
  servers.push(server);
  const url = `http://localhost:${server.port}`;

  try {
    const proc = Bun.spawn(["bash", SCRIPT, url], {
      cwd: REPO_ROOT,
      env: { ...process.env, CURL_MAX_TIME: "10", ...env },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { code, output: stdout + stderr, served };
  } finally {
    server.stop(true);
  }
}

/** Every rejection must be a real rejection: reached, served, then refused. */
function expectRejected(result: GateResult, because: string) {
  expect(result.served).toBeGreaterThan(0);
  expect(result.output).not.toContain("Operation timed out");
  expect(result.code).not.toBe(0);
  expect(result.output).toContain(because);
}

describe("prod-acceptance.sh fails on seeded faults", () => {
  test(
    "correct DOM served from a disallowed host is rejected on origin, not content",
    async () => {
      // Nothing about the CONTENT is wrong here — it is the same DOM the gate
      // accepts from the real origin. Only the host is wrong.
      const r = await runAgainstFixture(undefined, { EXPECTED_HOST: "www.thebehumancompany.ca" });
      expectRejected(r, "FAIL[origin of");
      expect(r.output).toContain("www.thebehumancompany.ca");
      // And it must refuse BEFORE reading content: no component assertion ran.
      expect(r.output).not.toContain("AC-7.1");
    },
    TEST_TIMEOUT,
  );

  test(
    "an unrelated 200 page is rejected",
    async () => {
      const r = await runAgainstFixture(
        () =>
          "<!doctype html><html><body><h1>Something else</h1>" +
          "<p>An unrelated page. </p>".repeat(1200) +
          "</body></html>",
      );
      expectRejected(r, "FAIL[");
    },
    TEST_TIMEOUT,
  );

  test(
    "a soft-404 — 200 status with a not-found body — is rejected",
    async () => {
      const r = await runAgainstFixture(
        () =>
          `<!doctype html><html><head><title>404 — Page not found</title></head><body><p>` +
          "not here ".repeat(2000) +
          "</p></body></html>",
      );
      expectRejected(r, "soft-404");
    },
    TEST_TIMEOUT,
  );

  test(
    "a component's content removed is rejected",
    async () => {
      const r = await runAgainstFixture((_p, html) => html.replace("<h3>ARLINA</h3>", ""));
      expectRejected(r, "ARLINA");
    },
    TEST_TIMEOUT,
  );

  test(
    "the deferred archive page quietly regrowing its entries is rejected (AC-7.3)",
    async () => {
      // The deferral is a decision, and the only thing standing between a
      // decision and a silent revert is a check that has been seen failing.
      // This is that check: the grid coming back on /the-human-archive — the
      // exact shape of the regression — must be refused.
      const r = await runAgainstFixture((pathname, html) =>
        pathname === "/the-human-archive"
          ? html.replace("</main>", "<h3>ADEWOLF</h3></main>")
          : html,
      );
      expectRejected(r, "ADEWOLF");
    },
    TEST_TIMEOUT,
  );

  test(
    "duplicated nav on a non-Blueprint surface is rejected (AC-3.3)",
    async () => {
      const r = await runAgainstFixture((pathname, html) =>
        pathname === "/be-human-ai"
          ? html
          : html.replace("</main>", `<nav aria-label="Duplicate"></nav></main>`),
      );
      expectRejected(r, "AC-3.3");
    },
    TEST_TIMEOUT,
  );

  test(
    "the Blueprint page losing its sub-nav is rejected (AC-3.4)",
    async () => {
      const r = await runAgainstFixture((pathname, html) =>
        pathname === "/be-human-ai"
          ? html.replace(/<nav aria-label="On this page">.*?<\/nav>/, "")
          : html,
      );
      expectRejected(r, "AC-3.4");
    },
    TEST_TIMEOUT,
  );

  test(
    "a Lovable pointer path surviving into the deploy is rejected (AC-1.6)",
    async () => {
      const r = await runAgainstFixture((_p, html) =>
        html.replace('src="/assets/one.webp"', 'src="/__l5e/assets-v1/abc/one.png"'),
      );
      expectRejected(r, "Lovable");
    },
    TEST_TIMEOUT,
  );

  test(
    "a page with no images at all is rejected, so 'no 404s' is never vacuous",
    async () => {
      const r = await runAgainstFixture((_p, html) => html.replace(/<img[^>]*>/g, ""));
      expectRejected(r, "AC-1.6");
    },
    TEST_TIMEOUT,
  );

  test(
    "the fictitious office list reappearing is rejected (AC-2.2)",
    async () => {
      const r = await runAgainstFixture((_p, html) =>
        html.replace("</main>", "<p>Sydney · London · New York</p></main>"),
      );
      expectRejected(r, "AC-2.2");
    },
    TEST_TIMEOUT,
  );

  test(
    "a Calendly reference reappearing is rejected (AC-2.5)",
    async () => {
      const r = await runAgainstFixture((_p, html) =>
        html.replace("</main>", '<a href="https://calendly.com/x">Book</a></main>'),
      );
      expectRejected(r, "AC-2.5");
    },
    TEST_TIMEOUT,
  );

  test(
    "a compliance-guarantee claim on the Blueprint page is rejected (AC-6.11a)",
    async () => {
      const r = await runAgainstFixture((pathname, html) =>
        pathname === "/be-human-ai"
          ? html.replace(
              "</main>",
              "<p>Our platform guarantees compliance with every framework.</p></main>",
            )
          : html,
      );
      expectRejected(r, "AC-6.11a");
    },
    TEST_TIMEOUT,
  );

  /**
   * The inverse of the case this replaced.
   *
   * It used to seed a WRONG price and prove the gate caught the drift. With
   * nothing on the page to buy, the failure that matters runs the other way:
   * the old offer growing back. That is the one-way door this direction cannot
   * take back — going public later is easy, going exclusive again is not — so
   * the gate is proven against a price reappearing, not against a wrong one.
   */
  test(
    "a price reappearing on the Blueprint page is rejected (AC-6.3)",
    async () => {
      const r = await runAgainstFixture((pathname, html) =>
        pathname === "/be-human-ai"
          ? html.replace(
              "<p>We work with a small number",
              "<p>$795 CAD founding rate.</p><p>We work with a small number",
            )
          : html,
      );
      expectRejected(r, "AC-6.3");
    },
    TEST_TIMEOUT,
  );

  // ── the non-vacuity control ──────────────────────────────────────────────
  //
  // Without this, every case above could be green because the script fails on
  // everything — which is indistinguishable from a strong gate by looking at
  // the results.
  test(
    "the unmutated good page passes every check that is implementable today",
    async () => {
      const r = await runAgainstFixture();
      expect(r.served).toBeGreaterThan(0);
      expect(r.output).not.toContain("Operation timed out");
      expect(r.code).toBe(0);

      // The checks that do not depend on a later phase's fixture must have
      // actually RUN, not merely not-failed. Without this, the control would
      // stay green if the gate degraded into skipping everything.
      expect(r.output).toContain("PASS[origin:");
      expect(r.output).toContain("PASS[AC-3.3/AC-3.4");
      expect(r.output).toContain("PASS[prod-acceptance:");

      // Phase-owned fixtures either drive a real check or are reported as
      // SKIP — never silently absent. Asserted per fixture, from the same
      // presence test the fixture builder used, so a fixture landing mid-branch
      // flips this from one arm to the other rather than breaking the suite.
      expect(r.output).toContain(brand ? "AC-2.1b" : "SKIP[AC-2.1b]");
      expect(r.output).toContain(blueprintSections ? "AC-6.2" : "SKIP[AC-6.2]");
      expect(r.output).toContain(principles ? "AC-5.4b" : "SKIP[AC-5.4b]");
    },
    TEST_TIMEOUT,
  );
});
