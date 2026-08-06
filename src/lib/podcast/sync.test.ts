import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import type { Episode } from "../podbean/types";
import { SanityHttpError } from "../sanity/http";
import { publishEpisode, type PublishResult } from "../sanity/publish";
import { episodeDocId } from "./doc-id";
import {
  buildSeedDocuments,
  planSyncDrafts,
  syncProbeIds,
  STUDIO_SYNC_SEEDED_BY,
  type SeedDocument,
  type SlugProposal,
} from "./sync";

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    guid: "guid-1",
    episodeNumber: 1,
    title: "Episode 1: Some Title",
    guest: "Jane Doe",
    description: "Full show notes.",
    excerpt: "Short excerpt.",
    pubDate: "2026-01-01T00:00:00.000Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/ep1.mp3",
    podbeanUrl: "https://example.podbean.com/e/ep1",
    ...overrides,
  };
}

describe("buildSeedDocuments", () => {
  test("maps a normal episode with a guest to the expected fields, omitting enrichment/computed fields", () => {
    const episode = makeEpisode();
    const proposal = { guid: "guid-1", _id: "episode-guid-1", slug: "jane-doe-some-title" };

    const [result] = buildSeedDocuments([episode], [proposal]);

    expect(result.slug).toBe("jane-doe-some-title");
    expect(result.episodeDoc).toEqual({
      _id: "episode-guid-1",
      _type: "episode",
      guid: "guid-1",
      title: "Episode 1: Some Title",
      description: "Full show notes.",
      excerpt: "Short excerpt.",
      guestName: "Jane Doe",
      podbeanUrl: "https://example.podbean.com/e/ep1",
      audioUrl: "https://cdn.example.com/ep1.mp3",
      durationSeconds: 1800,
      publishedAt: "2026-01-01T00:00:00.000Z",
      episodeNumber: 1,
      seededBy: "backfill-v1",
    });

    for (const omitted of [
      "topics",
      "guestPhoto",
      "coverArtwork",
      "guestKey",
      "slug",
      "slugFrozenAt",
      "searchText",
    ]) {
      expect(Object.hasOwn(result.episodeDoc, omitted)).toBe(false);
    }
  });

  test("leaves guestName undefined, not a placeholder, when the episode has no parsed guest", () => {
    const episode = makeEpisode({ guid: "guid-2", guest: undefined });
    const proposal = { guid: "guid-2", _id: "episode-guid-2", slug: "some-title" };

    const [result] = buildSeedDocuments([episode], [proposal]);

    expect(result.episodeDoc.guestName).toBeUndefined();
    expect(Object.hasOwn(result.episodeDoc, "guestName")).toBe(true);
  });

  test("throws naming the guid when an episode has no matching slug proposal", () => {
    const episode = makeEpisode({ guid: "orphan-episode" });

    expect(() => buildSeedDocuments([episode], [])).toThrow(/orphan-episode/);
  });

  test("throws naming the guid when a slug proposal has no matching episode", () => {
    const proposal = { guid: "orphan-proposal", _id: "episode-orphan-proposal", slug: "orphan" };

    expect(() => buildSeedDocuments([], [proposal])).toThrow(/orphan-proposal/);
  });

  test("returns all matched episodes, order preserved", () => {
    const episodeA = makeEpisode({ guid: "guid-a", title: "Title A", episodeNumber: 1 });
    const episodeB = makeEpisode({ guid: "guid-b", title: "Title B", episodeNumber: 2 });
    const episodeC = makeEpisode({ guid: "guid-c", title: "Title C", episodeNumber: 3 });

    // Proposals deliberately out of order to prove the output follows the
    // episodes array, not the proposals array.
    const proposals = [
      { guid: "guid-c", _id: "episode-guid-c", slug: "slug-c" },
      { guid: "guid-a", _id: "episode-guid-a", slug: "slug-a" },
      { guid: "guid-b", _id: "episode-guid-b", slug: "slug-b" },
    ];

    const results = buildSeedDocuments([episodeA, episodeB, episodeC], proposals);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.episodeDoc.title)).toEqual(["Title A", "Title B", "Title C"]);
  });
});

/**
 * Task 8 — the Studio "Sync from Podbean" plan.
 *
 * The Studio action itself is a React shell over these two functions and
 * `bun test src/` cannot see `studio/**` (Principle 2), so everything that can
 * be wrong in an interesting way is decided here and asserted here: which
 * episodes count as new, what a new draft contains, and the two feed anomalies
 * (a repeated guid, two guids collapsing to one document id) that would
 * otherwise be discovered as a lost write.
 */
describe("syncProbeIds", () => {
  test("asks about both the published id and the draft id for every guid", () => {
    const ids = syncProbeIds([{ guid: "guid-1" }, { guid: "guid-2" }]);

    expect(ids).toEqual([
      "episode-guid-1",
      "drafts.episode-guid-1",
      "episode-guid-2",
      "drafts.episode-guid-2",
    ]);
  });

  test("deduplicates a repeated guid rather than probing it twice", () => {
    expect(syncProbeIds([{ guid: "guid-1" }, { guid: "guid-1" }])).toEqual([
      "episode-guid-1",
      "drafts.episode-guid-1",
    ]);
  });
});

describe("planSyncDrafts", () => {
  test("plans a draft for an unseen guid, pre-filled from the feed and stamped with its provenance", () => {
    const episode = makeEpisode();

    const plan = planSyncDrafts([episode], []);

    expect(plan.create).toHaveLength(1);
    expect(plan.create[0]).toEqual({
      _id: "drafts.episode-guid-1",
      _type: "episode",
      guid: "guid-1",
      title: "Episode 1: Some Title",
      description: "Full show notes.",
      excerpt: "Short excerpt.",
      guestName: "Jane Doe",
      podbeanUrl: "https://example.podbean.com/e/ep1",
      audioUrl: "https://cdn.example.com/ep1.mp3",
      durationSeconds: 1800,
      publishedAt: "2026-01-01T00:00:00.000Z",
      episodeNumber: 1,
      seededBy: STUDIO_SYNC_SEEDED_BY,
    });
    expect(plan.existingGuids).toEqual([]);
    expect(plan.collisions).toEqual([]);
  });

  test("never proposes a slug — the permanent URL stays a human decision", () => {
    const [draft] = planSyncDrafts([makeEpisode()], []).create;

    for (const omitted of ["slug", "slugFrozenAt", "searchText", "topics", "guestBio"]) {
      expect(Object.hasOwn(draft, omitted)).toBe(false);
    }
  });

  test("leaves guestName undefined, not a placeholder, when the title had no parseable guest", () => {
    const [draft] = planSyncDrafts([makeEpisode({ guest: undefined })], []).create;

    expect(draft.guestName).toBeUndefined();
    expect(Object.hasOwn(draft, "guestName")).toBe(true);
  });

  test("carries exactly the same feed-derived field set as the backfill's seed document", () => {
    const episode = makeEpisode();
    const proposal = { guid: "guid-1", _id: "episode-guid-1", slug: "jane-doe-some-title" };

    const [draft] = planSyncDrafts([episode], []).create;
    const [seed] = buildSeedDocuments([episode], [proposal]);

    const feedFieldsOf = (doc: object) =>
      Object.keys(doc)
        .filter((key) => !["_id", "_type", "seededBy"].includes(key))
        .sort();

    expect(feedFieldsOf(draft)).toEqual(feedFieldsOf(seed.episodeDoc));
  });

  /**
   * The one that matters most. `createIfNotExists("drafts.episode-x")` against
   * an episode that is published but has no draft does NOT no-op — it creates
   * a draft, and a live episode silently acquires unpublished changes. A plan
   * that probed only the draft id would do that to all 39 on its first run.
   */
  test("skips an episode that is already PUBLISHED — the phantom-draft case", () => {
    const plan = planSyncDrafts([makeEpisode()], ["episode-guid-1"]);

    expect(plan.create).toEqual([]);
    expect(plan.existingGuids).toEqual(["guid-1"]);
  });

  test("skips an episode that already has a DRAFT — a second press creates nothing", () => {
    const plan = planSyncDrafts([makeEpisode()], ["drafts.episode-guid-1"]);

    expect(plan.create).toEqual([]);
    expect(plan.existingGuids).toEqual(["guid-1"]);
  });

  test("skips an episode that has both a published document and a draft", () => {
    const plan = planSyncDrafts([makeEpisode()], ["episode-guid-1", "drafts.episode-guid-1"]);

    expect(plan.create).toEqual([]);
    expect(plan.existingGuids).toEqual(["guid-1"]);
  });

  test("over a mixed feed, plans only the episodes Sanity has never seen", () => {
    const episodes = [
      makeEpisode({ guid: "guid-published" }),
      makeEpisode({ guid: "guid-drafted" }),
      makeEpisode({ guid: "guid-new" }),
    ];

    const plan = planSyncDrafts(episodes, [
      "episode-guid-published",
      "drafts.episode-guid-drafted",
      // A document belonging to no feed item at all — an episode that has
      // aged out of the feed. It must not perturb the plan.
      "episode-guid-long-gone",
    ]);

    expect(plan.create.map((draft) => draft.guid)).toEqual(["guid-new"]);
    expect(plan.create[0]._id).toBe("drafts.episode-guid-new");
    expect(plan.existingGuids).toEqual(["guid-published", "guid-drafted"]);
  });

  test("counts a guid repeated within one feed once, and creates it once", () => {
    const episodes = [makeEpisode(), makeEpisode({ title: "The same episode again" })];

    const plan = planSyncDrafts(episodes, []);

    expect(plan.create).toHaveLength(1);
    expect(plan.create[0].title).toBe("Episode 1: Some Title");
    expect(plan.duplicateGuids).toEqual(["guid-1"]);
  });

  /**
   * `episodeDocId` substitutes every character outside [A-Za-z0-9_-], so two
   * guids differing only in punctuation land on one `_id`. `scripts/backfill.ts`
   * treats that as fatal; the plan reports it and — belt and braces — withholds
   * both episodes from `create`, so a caller that ignored `collisions` still
   * could not write one document standing in for two episodes.
   */
  test("reports two guids that sanitise to one document id, and plans neither", () => {
    expect(episodeDocId("show/42")).toBe(episodeDocId("show-42"));

    const episodes = [
      makeEpisode({ guid: "show/42" }),
      makeEpisode({ guid: "show-42" }),
      makeEpisode({ guid: "guid-fine" }),
    ];

    const plan = planSyncDrafts(episodes, []);

    expect(plan.create.map((draft) => draft.guid)).toEqual(["guid-fine"]);
    expect(plan.collisions).toEqual([{ _id: "episode-show-42", guids: ["show/42", "show-42"] }]);
    expect(plan.existingGuids).toEqual([]);
  });

  test("an empty feed plans nothing rather than throwing", () => {
    expect(planSyncDrafts([], ["episode-guid-1"])).toEqual({
      create: [],
      existingGuids: [],
      duplicateGuids: [],
      collisions: [],
    });
  });
});

/**
 * Step 6 — the real backfill path (`scripts/backfill.ts`).
 *
 * The tests above only prove `buildSeedDocuments`'s field mapping; nothing
 * here previously drove the actual seeding transactions it feeds into. In
 * particular, "run twice -> second run emits zero" is meaningless unless the
 * first run is proven to have actually stored something (false-green audit
 * row 6) — counting mutations alone proves nothing if the fake never wrote
 * anything down.
 *
 * These tests drive `publishEpisode({ mode: "seed" })` directly, exactly as
 * `scripts/backfill.ts` does, over the 39 real `{guid, _id, slug}` triples
 * committed in `slugs.snapshot.json` — not a hand-picked handful — so the
 * fixture is the real stored shape by construction.
 */

const SNAPSHOT_PATH = path.join(import.meta.dirname, "slugs.snapshot.json");

/** The committed slug proposals — the real 39 the backfill will actually seed. */
const SNAPSHOT: SlugProposal[] = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as SlugProposal[];

/** Pinned clock so every `publishEpisode` call in these tests sees the same `now()`. */
const NOW = "2026-02-01T00:00:00.000Z";

/**
 * One synthetic `Episode` per committed slug proposal, matched by `guid` so
 * `buildSeedDocuments` accepts the pair without a single orphan on either
 * side. Content is distinct per episode (title, guest, dates) so a
 * cross-episode mix-up in the seeding loop would surface as a wrong title or
 * slug rather than passing by coincidence.
 */
function makeFixtureEpisodes(proposals: SlugProposal[]): Episode[] {
  return proposals.map((proposal, index) => ({
    guid: proposal.guid,
    episodeNumber: index + 1,
    title: `Episode ${index + 1}: Fixture Guest ${index + 1}`,
    guest: `Fixture Guest ${index + 1}`,
    description: `Full show notes for fixture episode ${index + 1}.`,
    excerpt: `Short excerpt for fixture episode ${index + 1}.`,
    pubDate: new Date(Date.UTC(2024, 0, index + 1)).toISOString(),
    durationSeconds: 1800 + index,
    audioUrl: `https://cdn.example.com/fixture-${index + 1}.mp3`,
    podbeanUrl: `https://example.podbean.com/e/fixture-${index + 1}`,
  }));
}

const FIXTURE_EPISODES = makeFixtureEpisodes(SNAPSHOT);
const SEEDS = buildSeedDocuments(FIXTURE_EPISODES, SNAPSHOT);

/**
 * A fake Sanity client with a REAL store, not a permissive stub. It mirrors
 * `publish.test.ts`'s `sharedDataset()`: a `create` against an `_id` already
 * in the store throws the real 409, and a mutation array is staged and
 * swapped in wholesale — all-or-nothing. A fake that accepted every mutation
 * unconditionally would make every assertion below vacuous, because nothing
 * would distinguish "seeded correctly" from "seeded nothing at all".
 */
interface FakeClient {
  store: Map<string, Record<string, unknown>>;
  /** Every mutation array actually submitted, in order — the network-call count. */
  submitted: unknown[][];
  getDocuments: (ids: string[]) => Promise<Record<string, unknown>[]>;
  mutate: (mutations: unknown[]) => Promise<unknown>;
}

function makeFakeClient(): FakeClient {
  const store = new Map<string, Record<string, unknown>>();
  const submitted: unknown[][] = [];

  const getDocuments = async (ids: string[]): Promise<Record<string, unknown>[]> =>
    ids
      .map((id) => store.get(id))
      .filter((doc): doc is Record<string, unknown> => doc !== undefined);

  const mutate = async (mutations: unknown[]): Promise<unknown> => {
    submitted.push(mutations);

    const staged = new Map(store);
    for (const mutation of mutations as Record<string, Record<string, unknown>>[]) {
      if (mutation.create) {
        const id = String(mutation.create._id);
        if (staged.has(id)) {
          throw new SanityHttpError(
            `[sanity] mutation failed (409): document already exists: ${id}`,
            409,
          );
        }
        staged.set(id, mutation.create);
      } else if (mutation.createOrReplace) {
        staged.set(String(mutation.createOrReplace._id), mutation.createOrReplace);
      } else if (mutation.delete) {
        staged.delete(String(mutation.delete.id));
      }
    }

    store.clear();
    for (const [id, doc] of staged) store.set(id, doc);
    return { transactionId: `txn-${submitted.length}` };
  };

  return { store, submitted, getDocuments, mutate };
}

/** Runs every seed document through `publishEpisode({ mode: "seed" })`, in order, exactly as `scripts/backfill.ts` does. */
async function runAll(fake: FakeClient, seeds: SeedDocument[]): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  for (const seed of seeds) {
    results.push(
      await publishEpisode(
        { episodeDoc: seed.episodeDoc, slug: seed.slug, mode: "seed" },
        { getDocuments: fake.getDocuments, mutate: fake.mutate, now: () => NOW },
      ),
    );
  }
  return results;
}

describe('seeding via publishEpisode({ mode: "seed" }) — the real backfill path (Step 6)', () => {
  test("first run over the 39 committed seed documents emits exactly 78 mutations, and the store holds exactly 78 documents afterwards", async () => {
    const fake = makeFakeClient();

    const results = await runAll(fake, SEEDS);

    expect(results).toHaveLength(39);
    expect(results.every((result) => result.outcome === "created")).toBe(true);
    expect(results.every((result) => result.mutations.length === 2)).toBe(true);
    const totalMutations = results.reduce((sum, result) => sum + result.mutations.length, 0);
    expect(totalMutations).toBe(78);

    // The mutation count alone proves nothing if the fake never actually
    // stored what it was told to (false-green audit row 6) — this is the
    // assertion that makes the count meaningful.
    expect(fake.store.size).toBe(78);
    const storedEpisodes = [...fake.store.values()].filter((doc) => doc._type === "episode");
    const storedLocks = [...fake.store.values()].filter((doc) => doc._type === "slugLock");
    expect(storedEpisodes).toHaveLength(39);
    expect(storedLocks).toHaveLength(39);
  });

  test("second run against that populated store emits zero mutations and makes no network call at all", async () => {
    const fake = makeFakeClient();
    await runAll(fake, SEEDS);
    const submittedAfterFirstRun = fake.submitted.length;

    const results = await runAll(fake, SEEDS);

    expect(results.every((result) => result.outcome === "unchanged")).toBe(true);
    expect(results.every((result) => result.mutations.length === 0)).toBe(true);
    // publishEpisode short-circuits BEFORE constructing a transaction when the
    // mutation list is empty, so the fake's `mutate` must never have been
    // invoked a second time at all — not merely invoked and no-op'd.
    expect(fake.submitted.length).toBe(submittedAfterFirstRun);
    expect(fake.store.size).toBe(78);
  });

  test("AC-3: a GUID that already exists is skipped even when its feed title has changed, and its slug is unchanged", async () => {
    const fake = makeFakeClient();
    await runAll(fake, SEEDS);
    const submittedAfterFirstRun = fake.submitted.length;

    const originalEpisode = FIXTURE_EPISODES[0];
    const proposal = SNAPSHOT[0];
    const retitledEpisode: Episode = {
      ...originalEpisode,
      title: "Episode Retitled: A Completely Different Name",
    };
    const [retitledSeed] = buildSeedDocuments([retitledEpisode], [proposal]);

    const result = await publishEpisode(
      { episodeDoc: retitledSeed.episodeDoc, slug: retitledSeed.slug, mode: "seed" },
      { getDocuments: fake.getDocuments, mutate: fake.mutate, now: () => NOW },
    );

    expect(result.outcome).toBe("unchanged");
    expect(result.mutations).toEqual([]);
    expect(fake.submitted.length).toBe(submittedAfterFirstRun);

    const storedEpisode = fake.store.get(proposal._id) as Record<string, unknown>;
    expect(storedEpisode.title).toBe(originalEpisode.title);
    expect((storedEpisode.slug as { current: string }).current).toBe(proposal.slug);
  });

  test("AC-32: a third run after one stored document has been manually enriched also emits zero mutations and leaves the enrichment intact", async () => {
    const fake = makeFakeClient();
    await runAll(fake, SEEDS);

    const enrichedProposal = SNAPSHOT[10];
    const beforeEnrichment = fake.store.get(enrichedProposal._id) as Record<string, unknown>;
    const guestPhoto = {
      _type: "image",
      asset: { _type: "reference", _ref: "image-manually-added-800x800-jpg" },
      alt: "Manually added in Studio",
    };
    const guestBio = "Manually written by Shane in Studio.";
    // Simulates Shane's Studio edit landing directly in Sanity — not through
    // `publishEpisode` — which is what a third backfill run must not clobber.
    fake.store.set(enrichedProposal._id, { ...beforeEnrichment, guestPhoto, guestBio });
    const submittedAfterEnrichment = fake.submitted.length;

    const results = await runAll(fake, SEEDS);

    expect(results.every((result) => result.mutations.length === 0)).toBe(true);
    expect(fake.submitted.length).toBe(submittedAfterEnrichment);

    const stillStored = fake.store.get(enrichedProposal._id) as Record<string, unknown>;
    expect(stillStored.guestPhoto).toEqual(guestPhoto);
    expect(stillStored.guestBio).toBe(guestBio);
  });
});
