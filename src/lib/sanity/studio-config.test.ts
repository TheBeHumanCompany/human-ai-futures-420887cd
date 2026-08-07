import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import config from "../../../studio/sanity.config";
import { syncFromPodbeanAction } from "../../../studio/actions/sync-from-podbean";

/**
 * The Studio-config half of the slugLock lockout (US-005).
 *
 * `slugLock` is infrastructure, not content (see studio/schemaTypes/slugLock.ts):
 * a mutex written only by publishEpisode(), inside the transaction that
 * arbitrates a slug. schema.contract.test.ts already pins the schema half
 * ("every field is readOnly"). This file pins the other half — that
 * sanity.config.ts actually keeps a lock out of the sidebar, out of "Create
 * new", and out of the document actions menu — by exercising the real
 * exported config object, not a re-implementation of its logic. A change
 * that quietly re-exposes slugLock to Studio authors should fail here.
 */

// `structureTool({structure: fn})` (from `sanity/structure`) stores the exact
// options object passed to it at `<plugin>.tools[0].options` — confirmed by
// reading structureTool's own source under studio/node_modules/sanity/lib.
// That makes `.structure` there the identical function sanity.config.ts
// wrote, not a stand-in re-derived for the test.
type StructurePlugin = {
  name?: string;
  tools?: Array<{ options?: { structure?: (S: unknown) => unknown } }>;
};

type MockListItem = { id: string; itemTitle?: string };
type MockList = { listTitle?: string; items: MockListItem[] };

/** Minimal stand-in for Sanity's StructureBuilder — just enough of the
 * `S.list().title(...).items([S.documentTypeListItem(id).title(...), ...])`
 * chain that sanity.config.ts's `structure` resolver actually calls. */
const makeMockStructureBuilder = () => ({
  documentTypeListItem: (id: string) => {
    const item: MockListItem = { id };
    return {
      title: (t: string) => {
        item.itemTitle = t;
        return item;
      },
    };
  },
  list: () => {
    const built: Partial<MockList> = {};
    const builder = {
      title: (t: string) => {
        built.listTitle = t;
        return builder;
      },
      items: (arr: MockListItem[]) => {
        built.items = arr;
        return built as MockList;
      },
    };
    return builder;
  },
});

describe("structure: slugLock is absent from the sidebar", () => {
  test("the structureTool resolver lists exactly episode and topic — no third item for slugLock", () => {
    const plugins = (config.plugins ?? []) as StructurePlugin[];
    const structurePlugin = plugins.find((p) => p.name === "sanity/structure");
    const structureFn = structurePlugin?.tools?.[0]?.options?.structure;
    expect(typeof structureFn).toBe("function");

    const resolved = (structureFn as (S: unknown) => MockList)(makeMockStructureBuilder());
    const ids = resolved.items.map((item) => item.id);

    expect(ids).toEqual(["episode", "topic"]);
    expect(ids).not.toContain("slugLock");
  });
});

describe("document.newDocumentOptions: slugLock is not offered in 'Create new'", () => {
  test("filters slugLock out of a synthetic template list, keeping episode and topic", () => {
    const prev = [{ templateId: "episode" }, { templateId: "topic" }, { templateId: "slugLock" }];

    const newDocumentOptions = config.document?.newDocumentOptions as unknown as
      | ((p: typeof prev, ctx: unknown) => typeof prev)
      | undefined;
    expect(typeof newDocumentOptions).toBe("function");

    const result = newDocumentOptions!(prev, {} as never);

    expect(result.map((item) => item.templateId)).toEqual(["episode", "topic"]);
  });
});

describe("document.actions: slugLock has no publish/delete/duplicate/restore actions", () => {
  const actions = config.document?.actions as unknown as
    | ((p: string[], ctx: { schemaType: string }) => string[])
    | undefined;

  test("returns [] when the schema type is slugLock", () => {
    expect(typeof actions).toBe("function");
    expect(
      actions!(["publish", "delete", "duplicate", "restore"], { schemaType: "slugLock" }),
    ).toEqual([]);
  });

  test("leaves another type's actions untouched — the filter is scoped to slugLock only", () => {
    const prev = ["publish", "delete"];
    expect(actions!(prev, { schemaType: "topic" })).toEqual(prev);
  });
});

describe("document.actions: episode's built-in publish is replaced (US-004)", () => {
  type MockAction = { action: string };

  const actions = config.document?.actions as unknown as
    | ((p: MockAction[], ctx: { schemaType: string }) => MockAction[])
    | undefined;

  test("swaps only the 'publish' entry for schemaType 'episode', leaving 'delete' untouched", () => {
    const originalPublish: MockAction = { action: "publish" };
    const originalDelete: MockAction = { action: "delete" };
    const prev = [originalPublish, originalDelete];

    expect(typeof actions).toBe("function");
    const result = actions!(prev, { schemaType: "episode" });

    // Two built-ins in, two built-ins out — plus the appended sync action,
    // which the next describe block owns.
    expect(result.slice(0, 2)).toHaveLength(2);
    expect(result[0]).not.toBe(originalPublish);
    expect(result[0].action).toBe("publish");
    expect(result[1]).toBe(originalDelete);
  });

  test("passes a synthetic action list through entirely unchanged for schemaType 'topic'", () => {
    const originalPublish: MockAction = { action: "publish" };
    const originalDelete: MockAction = { action: "delete" };
    const prev = [originalPublish, originalDelete];

    const result = actions!(prev, { schemaType: "topic" });

    expect(result).toBe(prev);
    expect(result[0]).toBe(originalPublish);
    expect(result[1]).toBe(originalDelete);
  });
});

/**
 * Task 8's registration half (US-107, AC-5.1).
 *
 * The action's own logic is tested through `planSyncDrafts` in
 * `src/lib/podcast/sync.test.ts` — the shell is React and lives outside
 * `bun test src/`. What can still be wrong here, and what nothing else would
 * catch, is the wiring: an action registered on the wrong type, or appended in
 * a way that drops a built-in, or a rename that leaves the button off the
 * menu entirely while every other test stays green.
 */
describe("document.actions: episode gains 'Sync from Podbean' (US-107)", () => {
  type MockAction = { action?: string };

  const actions = config.document?.actions as unknown as
    | ((p: MockAction[], ctx: { schemaType: string }) => MockAction[])
    | undefined;

  test("appends the real sync action for schemaType 'episode', after the built-ins", () => {
    const prev: MockAction[] = [{ action: "publish" }, { action: "delete" }];

    const result = actions!(prev, { schemaType: "episode" });

    expect(result).toHaveLength(3);
    // Identity, not a name match: this is the exact component sanity.config.ts
    // imported, so a rename or a stale import cannot pass this.
    expect(result[2]).toBe(syncFromPodbeanAction as unknown as MockAction);
  });

  test("is not added to any other type", () => {
    const prev: MockAction[] = [{ action: "publish" }];

    expect(actions!(prev, { schemaType: "topic" })).not.toContain(syncFromPodbeanAction);
    expect(actions!(prev, { schemaType: "slugLock" })).toEqual([]);
  });

  test("never carries a built-in action's identity — it is an addition, not a replacement", () => {
    // A document action that declared `.action = 'publish'` would silently
    // take the publish slot in Studio's menu and AC-5.2's "never publishes"
    // would become a claim about a button labelled Publish.
    expect((syncFromPodbeanAction as { action?: string }).action).toBeUndefined();
  });
});

/**
 * AC-5.2, structurally: the sync path cannot publish, because it never loads
 * the only function that can. Read off the file text rather than the module
 * graph so it stays true of a lazily-imported `publishEpisode` too.
 */
describe("the sync action never publishes (US-107, AC-5.2)", () => {
  const STUDIO_DIR = path.join(import.meta.dir, "..", "..", "..", "studio");

  /**
   * Both files below discuss publishing, and the feed host they must not
   * fetch, at length in their own prose — a rule read off raw text would be a
   * rule a comment can break, which is a rule someone deletes rather than
   * satisfies. So the rules run against code with comments removed.
   *
   * The `[^:]` guard on the line-comment pattern is what keeps `https://` from
   * being read as the start of a comment. It can only ever leave *more* text
   * behind, never less, so a miss makes an assertion stricter — it cannot make
   * one pass vacuously.
   */
  function stripComments(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((line) => line.replace(/(^|[^:])\/\/.*$/, "$1"))
      .join("\n");
  }

  for (const relative of ["actions/sync-from-podbean.ts", "lib/podbean-feed.ts"]) {
    test(`${relative} never names publishEpisode or slugLock in code`, () => {
      const code = stripComments(readFileSync(path.join(STUDIO_DIR, relative), "utf8"));

      // Proves the stripper left real code behind before any rule below claims
      // a clean bill of health — every one of them is vacuous against "".
      expect(code).toContain("export");

      expect(code).not.toMatch(/\bpublishEpisode\b/);
      expect(code).not.toMatch(/\bslugLock\b/);
      // The module is the only route to either, so the import is the rule.
      expect(code).not.toMatch(/from\s+['"][^'"]*sanity\/publish['"]/);
      expect(code).not.toMatch(/\bimport\s*\(/);
    });
  }

  test("studio/lib/podbean-feed.ts fetches the CORS-safe canonical host, not the redirecting one", () => {
    const code = stripComments(readFileSync(path.join(STUDIO_DIR, "lib/podbean-feed.ts"), "utf8"));

    expect(code).toContain("https://feed.podbean.com/shanejjamesgroup/feed.xml");
    // `PODBEAN_FEED_URL` (src/lib/podbean/feed.ts) — 302, no
    // access-control-allow-origin, blocked by the browser before the redirect
    // is followed. It is named in this file's prose on purpose; what it must
    // never be is imported, because importing it is the only way to fetch it.
    expect(code).not.toMatch(/\bPODBEAN_FEED_URL\b/);
    expect(code).not.toMatch(/from\s+['"][^'"]*podbean\/feed['"]/);
    expect(code).not.toContain("shanejjamesgroup.podbean.com");
  });
});
