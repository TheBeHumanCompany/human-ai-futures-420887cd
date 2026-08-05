import { describe, expect, test } from "bun:test";

import config from "../../../studio/sanity.config";

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

    expect(result).toHaveLength(2);
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
