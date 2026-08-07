import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import catalogue from "./catalogue.snapshot.json";
import {
  MAX_TOPICS_PER_EPISODE,
  TAXONOMY_MAX_TOPICS,
  TAXONOMY_MIN_TOPICS,
  TAXONOMY_RELATIVE_PATH,
  TOPIC_MIN_EVIDENCE,
  TOPIC_NAME_MAX_LENGTH,
  type TopicApplyDeps,
  type TopicDocument,
  type TopicEntry,
  applyTopics,
  buildTopicMutations,
  parseTaxonomy,
  topicDocId,
  topicDocument,
  validateTaxonomy,
} from "./topics";

/**
 * The taxonomy is read off disk rather than `import`ed.
 *
 * `content/` sits outside `src/`, and a static import would pull a review
 * artifact into whatever bundle walks this tree. Nothing at runtime needs the
 * taxonomy — the site reads topics from Sanity, and `apply-topics.ts` is the
 * only thing that reads the file for real. `layering.test.ts` already reads
 * source this way, so the pattern is precedented rather than novel.
 */
const REPO_ROOT = path.join(import.meta.dir, "..", "..", "..");
const TAXONOMY_FILE = path.join(REPO_ROOT, TAXONOMY_RELATIVE_PATH);

const parsed = parseTaxonomy(JSON.parse(readFileSync(TAXONOMY_FILE, "utf8")));
const TOPICS = parsed.taxonomy?.topics ?? [];

describe("topicDocId", () => {
  test("is exactly `topic-<slug>` for an already-valid slug", () => {
    expect(topicDocId("mental-health")).toBe("topic-mental-health");
    expect(topicDocId("ai-and-technology")).toBe("topic-ai-and-technology");
  });

  /**
   * Determinism, and what it actually buys.
   *
   * An earlier version of this comment claimed a random id would churn
   * `topics[]._key` and make Decision F's content comparison report a change on
   * every republish. That was **wrong**: `publish.ts`'s `STRIPPED_KEYS`
   * (line 109) drops `_key` before comparing, so `_key` churn is invisible
   * there — and a random id generated once and stored would be stable anyway.
   *
   * What a *regenerated* id would really break, and what these rows guard:
   *   - `createIfNotExists` idempotency (a fresh id exists-checks false every
   *     run, so the verb degrades to `create` and duplicates the taxonomy)
   *   - deriving a `_ref` from a slug with no lookup
   *   - one slug meaning one document
   * And, stated correctly this time: a regenerated id WOULD surface in the
   * content comparison — through `_ref`, which `strip()` preserves, not `_key`.
   */
  test("is deterministic across repeated calls", () => {
    const first = topicDocId("leadership");
    for (let i = 0; i < 100; i += 1) {
      expect(topicDocId("leadership")).toBe(first);
    }
  });

  test("is deterministic across a freshly loaded module instance", () => {
    // Guards the one form the loop above cannot see: state captured at module
    // scope (a seeded prefix, a load-time salt) would be stable within a
    // process and different in the next one — which is precisely the shape of
    // bug that shows up as churn in CI and never locally. Bun genuinely
    // re-evaluates on a cache-busting query string (verified, not assumed).
    const before = TOPICS.map((topic) => topicDocId(topic.slug));

    return import(`./topics?fresh=${Math.random()}`).then((fresh) => {
      const freshTopicDocId = fresh.topicDocId as typeof topicDocId;
      const after = TOPICS.map((topic) => freshTopicDocId(topic.slug));
      expect(after).toEqual(before);
      expect(after.length).toBeGreaterThanOrEqual(TAXONOMY_MIN_TOPICS);
    });
  });

  test("sanitises anything outside [a-zA-Z0-9_-], including '.'", () => {
    // Same substitution and the same reason as `episodeDocId`: Sanity's
    // path()-glob ACL grants treat '.' as a path-segment separator, so an id
    // containing one silently falls outside a single-segment grant.
    expect(topicDocId("food & beverage")).toBe("topic-food---beverage");
    expect(topicDocId("a.b")).toBe("topic-a-b");
    expect(topicDocId("a.b")).not.toContain(".");
  });

  test("is total — never throws, always returns a `topic-` prefixed string", () => {
    for (const input of ["", "!!!///:::", "a".repeat(600), "topic-\u{1F399}\u{FE0F}"]) {
      let result = "";
      expect(() => {
        result = topicDocId(input);
      }).not.toThrow();
      expect(typeof result).toBe("string");
      expect(result.startsWith("topic-")).toBe(true);
    }
  });

  test("every id built from the real taxonomy matches /^topic-[a-zA-Z0-9_-]+$/", () => {
    // Asserted over the whole shipped vocabulary rather than a couple of
    // hand-picked slugs, since it is the id format the Sanity ACL grants
    // actually depend on.
    for (const topic of TOPICS) {
      expect(topicDocId(topic.slug)).toMatch(/^topic-[a-zA-Z0-9_-]+$/);
    }
    expect(TOPICS.length).toBeGreaterThanOrEqual(TAXONOMY_MIN_TOPICS);
  });
});

describe("the committed content/topic-taxonomy.json", () => {
  test("parses and passes shape validation", () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.taxonomy).not.toBeNull();
  });

  test("passes every value-level rule in validateTaxonomy", () => {
    // The single assertion that would go red for any of: wrong size, an
    // over-long name, a malformed slug, a duplicate, thin evidence, or an id
    // collision.
    expect(validateTaxonomy(TOPICS)).toEqual([]);
  });

  test("sits inside the plan's size band with room on both sides", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(TAXONOMY_MIN_TOPICS);
    expect(TOPICS.length).toBeLessThanOrEqual(TAXONOMY_MAX_TOPICS);
  });

  test("every name is within the 16-character ceiling", () => {
    const overLong = TOPICS.filter((topic) => topic.name.length > TOPIC_NAME_MAX_LENGTH).map(
      (topic) => `${topic.name} (${topic.name.length})`,
    );
    expect(overLong).toEqual([]);
  });

  test("records the longest name, which is what queries.test.ts measures against", () => {
    // Not a redundant restatement of the ceiling. `queries.test.ts` builds its
    // maximal episode from the largest REAL topics, so this is the number that
    // actually feeds the payload bound. If a taxonomy edit moves it, the payload
    // test is the thing to re-read.
    const longest = TOPICS.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    expect(longest.name.length).toBe(15);
  });

  test("has more topics than one episode may carry, or the cap would be moot", () => {
    expect(TOPICS.length).toBeGreaterThan(MAX_TOPICS_PER_EPISODE);
  });

  test("slugs are lowercase, well-formed, and distinct", () => {
    const malformed = TOPICS.filter((topic) => !/^[a-z0-9-]+$/.test(topic.slug));
    expect(malformed).toEqual([]);

    const slugs = TOPICS.map((topic) => topic.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("topicDocId is injective over the real taxonomy", () => {
    // Distinct slugs do not imply distinct ids — the substitution is lossy. A
    // collision would mean one topic's `createIfNotExists` silently resolves to
    // another's document and that topic never exists at all.
    const ids = TOPICS.map((topic) => topicDocId(topic.slug));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(TAXONOMY_MIN_TOPICS);
  });

  test("the substitution is the identity over the real slugs", () => {
    for (const topic of TOPICS) {
      expect(topicDocId(topic.slug)).toBe(`topic-${topic.slug}`);
    }
  });

  test("topicDocument matches the Studio's topic schema, slug object and all", () => {
    // studio/schemaTypes/topic.ts declares `slug` as Sanity's `slug` type, which
    // is `{_type: "slug", current}` — not a bare string. A bare string would be
    // accepted by the write API and then fail validation in the Studio, which is
    // the worst place to discover it.
    const doc = topicDocument({
      name: "Leadership",
      slug: "leadership",
      evidence: [{ episodeNumber: 1, quote: "x" }],
    });
    expect(doc).toEqual({
      _id: "topic-leadership",
      _type: "topic",
      name: "Leadership",
      slug: { _type: "slug", current: "leadership" },
    });
  });
});

/**
 * Task 9's governing constraint, enforced instead of promised.
 *
 * The vocabulary may be proposed ONLY from the 39 committed `title` and
 * `description` values — the same no-outside-research rule that governs guest
 * bios in Task 10.
 *
 * **Checked per episode, not against the corpus as a whole.** An earlier version
 * searched one concatenated string, which let a real quote be attributed to the
 * wrong episode and still pass. Evidence is now `{episodeNumber, quote}` and
 * each quote is checked against that episode's own text.
 *
 * What this proves: every topic is supported by at least four *named* episodes
 * whose own words are quoted accurately. What it does NOT prove: that the topic
 * is the right label for those episodes. That stays a human judgement made
 * against the PR diff — which is why the artifact is a committed, reviewable
 * file. The label here is "the citations are real", never "the taxonomy is
 * correct".
 */
describe("evidence is grounded in the corpus, per episode", () => {
  /** Typographic apostrophes and quotes in the corpus, folded to ASCII. */
  const fold = (text: string) =>
    text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ");

  const byEpisodeNumber = new Map(
    catalogue.episodes.map((episode) => [
      episode.episodeNumber,
      fold(`${episode.title} ${episode.description}`).toLowerCase(),
    ]),
  );

  test("the corpus fixture is the real 39 episodes", () => {
    // Floor first: every assertion below is a lookup into this map, and all of
    // them would pass vacuously against an empty one.
    expect(catalogue.episodes.length).toBe(39);
    expect(byEpisodeNumber.size).toBe(39);
  });

  test("every quote appears verbatim in the episode it is attributed to", () => {
    const missing: string[] = [];
    let checked = 0;

    for (const topic of TOPICS) {
      for (const { episodeNumber, quote } of topic.evidence) {
        checked += 1;
        const episodeText = byEpisodeNumber.get(episodeNumber);
        if (episodeText === undefined) {
          missing.push(`${topic.name}: episode ${episodeNumber} does not exist`);
          continue;
        }
        if (!episodeText.includes(fold(quote).toLowerCase())) {
          missing.push(`${topic.name}: "${quote}" is not in episode ${episodeNumber}`);
        }
      }
    }

    expect(missing).toEqual([]);
    // Floor: proves the loop ran over real evidence rather than empty lists.
    expect(checked).toBeGreaterThanOrEqual(TOPICS.length * TOPIC_MIN_EVIDENCE);
  });

  test("the per-episode check is strict enough to catch a misattribution", () => {
    // The exact failure the old corpus-wide search let through, pinned so the
    // check cannot quietly regress to a substring scan over everything.
    // "Cheekbone Beauty" is real, and belongs to episode 5 — not to episode 1.
    const episode1 = byEpisodeNumber.get(1)!;
    const episode5 = byEpisodeNumber.get(5)!;

    expect(episode5).toContain("cheekbone beauty");
    expect(episode1).not.toContain("cheekbone beauty");
  });

  test("every topic cites at least four distinct real episodes", () => {
    const realNumbers = new Set(catalogue.episodes.map((episode) => episode.episodeNumber));
    const thin: string[] = [];

    for (const topic of TOPICS) {
      const cited = new Set(topic.evidence.map((item) => item.episodeNumber));
      const allReal = [...cited].every((number) => realNumbers.has(number));
      if (cited.size < TOPIC_MIN_EVIDENCE || !allReal) {
        thin.push(`${topic.name}: ${cited.size} distinct, all real: ${allReal}`);
      }
    }

    expect(thin).toEqual([]);
  });
});

/**
 * The validators, proven to actually reject.
 *
 * Every check against the real file above asserts an EMPTY error list, and a
 * `validateTaxonomy` that unconditionally returned `[]` would satisfy all of
 * them. So would a `parseTaxonomy` that never looked at its argument. These
 * rows are what make the clean results above mean something — one per rule,
 * each built by breaking a valid taxonomy in exactly one way.
 */
describe("parseTaxonomy and validateTaxonomy reject what they claim to", () => {
  const evidence = () =>
    Array.from({ length: TOPIC_MIN_EVIDENCE }, (_unused, index) => ({
      episodeNumber: index + 1,
      quote: "quoted from that episode",
    }));

  const valid = (): TopicEntry[] =>
    Array.from({ length: TAXONOMY_MIN_TOPICS }, (_unused, index) => ({
      name: `Topic ${index}`,
      slug: `topic-${index}`,
      evidence: evidence(),
    }));

  test("the baseline fixture is itself valid — otherwise every row below is vacuous", () => {
    expect(validateTaxonomy(valid())).toEqual([]);
  });

  test("rejects a taxonomy below the size band", () => {
    expect(validateTaxonomy(valid().slice(0, 5))).not.toEqual([]);
  });

  test("rejects a taxonomy above the size band", () => {
    const tooMany = Array.from({ length: TAXONOMY_MAX_TOPICS + 1 }, (_unused, index) => ({
      name: `Topic ${index}`,
      slug: `topic-${index}`,
      evidence: evidence(),
    }));
    expect(validateTaxonomy(tooMany)).not.toEqual([]);
  });

  test("rejects a name over the character ceiling", () => {
    const topics = valid();
    topics[0].name = "A".repeat(TOPIC_NAME_MAX_LENGTH + 1);
    const errors = validateTaxonomy(topics);

    expect(errors.length).toBe(1);
    expect(errors[0]).toContain(String(TOPIC_NAME_MAX_LENGTH));
  });

  test("accepts a name exactly at the ceiling — the boundary is inclusive", () => {
    // Off-by-one guard. A ceiling that rejected 16 would quietly make the
    // decided limit 15, and nothing else in the suite would notice.
    const topics = valid();
    topics[0].name = "A".repeat(TOPIC_NAME_MAX_LENGTH);
    expect(validateTaxonomy(topics)).toEqual([]);
  });

  test("rejects an uppercase or otherwise malformed slug", () => {
    const topics = valid();
    topics[0].slug = "Mental Health";
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects a duplicate slug", () => {
    const topics = valid();
    topics[1].slug = topics[0].slug;
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects a duplicate name differing only in case", () => {
    const topics = valid();
    topics[1].name = topics[0].name.toUpperCase();
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects a name with surrounding whitespace", () => {
    const topics = valid();
    topics[0].name = " Leadership ";
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects a topic with too little evidence", () => {
    const topics = valid();
    topics[0].evidence = topics[0].evidence.slice(0, TOPIC_MIN_EVIDENCE - 1);
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects evidence that cites one episode repeatedly to reach the count", () => {
    // Four citations of the same episode is one episode's worth of support
    // wearing a disguise, and satisfies a naive length check.
    const topics = valid();
    topics[0].evidence = topics[0].evidence.map((item) => ({ ...item, episodeNumber: 7 }));
    expect(validateTaxonomy(topics)).not.toEqual([]);
  });

  test("rejects two slugs that collapse onto one document id", () => {
    // Reachable only past the slug-shape rule, so it is asserted directly
    // rather than assumed unreachable: `topicDocId` is lossy, and a rule that
    // can never fire is a rule nobody should trust.
    const errors = validateTaxonomy([
      { name: "A", slug: "a.b", evidence: evidence() },
      { name: "B", slug: "a:b", evidence: evidence() },
    ]);
    expect(errors.some((error) => error.includes("collapse onto one document id"))).toBe(true);
  });

  test("parseTaxonomy rejects a non-object, an array, and a missing topics list", () => {
    for (const raw of [null, 42, "a string", [], {}, { source: "s", constraint: "c" }]) {
      expect(parseTaxonomy(raw).taxonomy).toBeNull();
      expect(parseTaxonomy(raw).errors.length).toBeGreaterThan(0);
    }
  });

  test("parseTaxonomy rejects a numeric name, which every value-level rule would miss", () => {
    // The exact hole a bare type assertion leaves: `(123).length` is
    // `undefined`, which is neither `> 16` nor `=== 0`, so a numeric name sails
    // through `validateTaxonomy` and only fails inside a Sanity mutation.
    const raw = {
      source: "s",
      constraint: "c",
      usageGuidanceForEnrichment: "g",
      topics: [{ name: 123, slug: "leadership", evidence: [] }],
    };
    expect(parseTaxonomy(raw).taxonomy).toBeNull();
    expect(parseTaxonomy(raw).errors.join(" ")).toContain("name");
  });

  test("parseTaxonomy rejects malformed evidence entries", () => {
    const base = { source: "s", constraint: "c", usageGuidanceForEnrichment: "g" };
    const bad = [
      { ...base, topics: [{ name: "A", slug: "a", evidence: "not an array" }] },
      {
        ...base,
        topics: [{ name: "A", slug: "a", evidence: [{ episodeNumber: "1", quote: "q" }] }],
      },
      {
        ...base,
        topics: [{ name: "A", slug: "a", evidence: [{ episodeNumber: 1.5, quote: "q" }] }],
      },
      { ...base, topics: [{ name: "A", slug: "a", evidence: [{ episodeNumber: 1, quote: "" }] }] },
    ];
    for (const raw of bad) {
      expect(parseTaxonomy(raw).taxonomy).toBeNull();
      expect(parseTaxonomy(raw).errors.length).toBeGreaterThan(0);
    }
  });

  test("parseTaxonomy accepts the real file — the positive control for all of the above", () => {
    expect(parseTaxonomy(JSON.parse(readFileSync(TAXONOMY_FILE, "utf8"))).taxonomy).not.toBeNull();
  });
});

describe("buildTopicMutations — re-runnable, and never a clobber", () => {
  test("every mutation is a createIfNotExists, never a create or createOrReplace", () => {
    const verbs = buildTopicMutations(TOPICS).flatMap((mutation) => Object.keys(mutation));

    expect(new Set(verbs)).toEqual(new Set(["createIfNotExists"]));
    // Floor: `new Set([])` would also contain no forbidden verb.
    expect(verbs.length).toBe(TOPICS.length);
    expect(verbs.length).toBeGreaterThanOrEqual(TAXONOMY_MIN_TOPICS);
  });

  test("the transaction is byte-identical across builds", () => {
    // The operator-facing half of determinism: a diff between two dry runs of
    // an unchanged file must be empty, or nobody can use a dry run to review
    // what a live run will do.
    expect(JSON.stringify(buildTopicMutations(TOPICS))).toBe(
      JSON.stringify(buildTopicMutations(TOPICS)),
    );
  });

  /**
   * The idempotency claim, demonstrated rather than asserted in a comment.
   *
   * `applyCreateIfNotExists` models Sanity's documented semantics for the verb —
   * write when the `_id` is absent, no-op when it is present — and the scenarios
   * walk the sequence that actually matters: apply, an editor renames a topic in
   * the Studio, apply again.
   *
   * Honest about what this is: a model of the documented behaviour, not Sanity
   * itself. What it genuinely proves is that this script's *mutation set* has
   * the property the story requires — it never carries a verb or a payload that
   * could overwrite an existing document — which is the half that lives in this
   * repo and the half a regression here would break.
   */
  function applyCreateIfNotExists(
    dataset: Map<string, TopicDocument>,
    mutations: { createIfNotExists: TopicDocument }[],
  ): Map<string, TopicDocument> {
    const next = new Map(dataset);
    for (const { createIfNotExists: doc } of mutations) {
      if (!next.has(doc._id)) next.set(doc._id, doc);
    }
    return next;
  }

  test("a second run against an applied dataset changes nothing", () => {
    const mutations = buildTopicMutations(TOPICS);

    const afterFirst = applyCreateIfNotExists(new Map(), mutations);
    expect(afterFirst.size).toBe(TOPICS.length);

    const afterSecond = applyCreateIfNotExists(afterFirst, mutations);
    expect([...afterSecond.entries()]).toEqual([...afterFirst.entries()]);
  });

  test("a name an editor corrected in the Studio survives a re-run", () => {
    // The failure `createOrReplace` would cause, pinned so nobody "simplifies"
    // the verb later. The taxonomy file is a proposal; the Studio is where the
    // name gets fixed afterwards, and a re-run must not undo that fix.
    const mutations = buildTopicMutations(TOPICS);
    const applied = applyCreateIfNotExists(new Map(), mutations);

    const [firstId, firstDoc] = [...applied.entries()][0];
    const edited = new Map(applied);
    edited.set(firstId, { ...firstDoc, name: "Renamed" });

    const afterRerun = applyCreateIfNotExists(edited, mutations);
    expect(afterRerun.get(firstId)?.name).toBe("Renamed");
  });

  test("a topic added to the file lands on the next run, without touching the rest", () => {
    // The other half of re-runnability: the script's purpose is to be run again
    // after the taxonomy grows, not only once at seed time.
    const applied = applyCreateIfNotExists(new Map(), buildTopicMutations(TOPICS));

    const grown = [
      ...TOPICS,
      {
        name: "Manufacturing",
        slug: "manufacturing",
        evidence: [{ episodeNumber: 1, quote: "x" }],
      },
    ];
    const afterGrowth = applyCreateIfNotExists(applied, buildTopicMutations(grown));

    expect(afterGrowth.size).toBe(applied.size + 1);
    expect(afterGrowth.get("topic-manufacturing")?.name).toBe("Manufacturing");
    for (const [id, doc] of applied) expect(afterGrowth.get(id)).toEqual(doc);
  });
});

/**
 * The write path itself, which nothing covered until now.
 *
 * `buildTopicMutations` was well tested, but it is pure — it proves what the
 * transaction *would* say, not that anything sends it. Replacing the whole
 * `--apply` branch with a no-op would have left every other row in this file
 * green and the dry run green too. These rows close that: they assert a dry run
 * touches neither transport method, an apply submits exactly one transaction,
 * and a write failure is not swallowed.
 */
describe("applyTopics — the wiring, not just the payload", () => {
  interface Recorder {
    deps: TopicApplyDeps;
    reads: string[][];
    writes: unknown[][];
  }

  const recorder = (overrides: Partial<TopicApplyDeps> = {}): Recorder => {
    const reads: string[][] = [];
    const writes: unknown[][] = [];
    return {
      reads,
      writes,
      deps: {
        getDocuments: async (ids) => {
          reads.push(ids);
          return [];
        },
        mutate: async (mutations) => {
          writes.push(mutations);
          return { transactionId: "test" };
        },
        ...overrides,
      },
    };
  };

  test("a dry run reads nothing and writes nothing", () => {
    const rec = recorder();
    return applyTopics(TOPICS, { dryRun: true }, rec.deps).then((report) => {
      expect(rec.reads).toEqual([]);
      expect(rec.writes).toEqual([]);
      expect(report.transactionsSubmitted).toBe(0);
      // Still plans the real transaction, which is what a dry run is for.
      expect(report.mutations.length).toBe(TOPICS.length);
    });
  });

  test("an apply submits exactly one transaction containing every topic", () => {
    const rec = recorder();
    return applyTopics(TOPICS, { dryRun: false }, rec.deps).then((report) => {
      expect(rec.writes.length).toBe(1);
      expect((rec.writes[0] as unknown[]).length).toBe(TOPICS.length);
      expect(report.transactionsSubmitted).toBe(1);
      expect(rec.writes[0]).toEqual(buildTopicMutations(TOPICS));
    });
  });

  test("a write failure propagates rather than being reported as success", () => {
    const rec = recorder({
      mutate: async () => {
        throw new Error("sanity said no");
      },
    });
    return expect(applyTopics(TOPICS, { dryRun: false }, rec.deps)).rejects.toThrow(
      "sanity said no",
    );
  });

  test("a failed pre-read does NOT block the write — it is reporting only", () => {
    // The failure mode this shape exists to avoid: refusing an otherwise valid
    // write because an informational read failed.
    const rec = recorder({
      getDocuments: async () => {
        throw new Error("read timed out");
      },
    });
    return applyTopics(TOPICS, { dryRun: false }, rec.deps).then((report) => {
      expect(report.preReadFailed).toBe(true);
      expect(report.preReadError).toContain("read timed out");
      expect(rec.writes.length).toBe(1);
      expect(report.transactionsSubmitted).toBe(1);
    });
  });

  test("the pre-read reports what was present and what was missing at that moment", () => {
    const ids = TOPICS.map((topic) => topicDocId(topic.slug));
    const rec = recorder({
      getDocuments: async () => [{ _id: ids[0] }, { _id: ids[1] }],
    });
    return applyTopics(TOPICS, { dryRun: false }, rec.deps).then((report) => {
      expect(report.presentAtPreRead).toEqual([ids[0], ids[1]]);
      expect(report.missingAtPreRead.length).toBe(TOPICS.length - 2);
      expect(report.presentAtPreRead).not.toContain(ids[2]);
      // The write goes ahead in full regardless — createIfNotExists is what
      // decides per document, not this observation.
      expect((rec.writes[0] as unknown[]).length).toBe(TOPICS.length);
    });
  });
});
