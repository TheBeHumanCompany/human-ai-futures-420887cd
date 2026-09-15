import { describe, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { fetchClientPageByTokenFn } from "./tokens";
import {
  LEGACY_REPORT_ID,
  publishReportToFile,
  publishReportToStore,
  type PublishReportInput,
} from "./publish";
import store from "../../../content/clients.json";
import type { ClientRecord } from "./tokens";

/**
 * US-005 — the paste-HTML publisher, pinned without a server.
 *
 * The publisher upserts one report into the content store and nothing else:
 * a new report id appends, a known id updates in place, and the client's
 * token never moves — which is what keeps the URL stable across publishes
 * and edits. The file layer writes exactly one path (the store), proven by
 * counting the entries of a scratch directory before and after. The published
 * page resolving through the real token lookup (`fetchClientPageByTokenFn`,
 * Supabase tier forced off so the check is hermetic) is what the live
 * dev-server curl in `docs/client-portal-tokens.md` repeats over HTTP.
 */

const MARKER_NEW = "PUBLISHER-FIXTURE-ALPHA-9c41d7";
const MARKER_EDITED = "PUBLISHER-FIXTURE-BRAVO-51e80c";
const MARKER_B = "BEACON-FIXTURE-MARKER-44d2c8";

const freshStore = () => JSON.parse(JSON.stringify(store)) as ClientRecord[];

const tokenOf = (clients: readonly ClientRecord[], id: string) =>
  clients.find((client) => client.id === id)!.token;

const publishInput = (overrides: Partial<PublishReportInput> = {}): PublishReportInput => ({
  clientId: "acme-industrial",
  reportId: "publisher-fixture",
  title: "Publisher Fixture",
  html: `<p>${MARKER_NEW} — pasted report HTML.</p>`,
  ...overrides,
});

describe("publishReportToStore — a new report id appends", () => {
  test("the report lands last with its title and HTML, nothing else moves", () => {
    const before = freshStore();
    const { clients, created } = publishReportToStore(before, publishInput());

    expect(created).toBe(true);
    const acme = clients.find((client) => client.id === "acme-industrial")!;
    expect(acme.reports!.map((report) => report.id)).toEqual([
      "preliminary",
      "follow-up",
      "publisher-fixture",
    ]);
    const added = acme.reports!.at(-1)!;
    expect(added.title).toBe("Publisher Fixture");
    expect(added.html).toContain(MARKER_NEW);
    // The page the client already saw is untouched: earlier reports keep
    // their order and bodies, and the other client is identical.
    expect(acme.reports!.slice(0, 2)).toEqual(
      before.find((client) => client.id === "acme-industrial")!.reports,
    );
    expect(clients.find((client) => client.id === "beacon-health")).toEqual(
      before.find((client) => client.id === "beacon-health"),
    );
  });

  test("the client's identity is untouched — same id, name, and token", () => {
    const before = freshStore();
    const { clients } = publishReportToStore(before, publishInput());
    const acme = clients.find((client) => client.id === "acme-industrial")!;

    expect(acme.id).toBe("acme-industrial");
    expect(acme.name).toBe("Acme Industrial");
    expect(acme.token).toBe(tokenOf(before, "acme-industrial"));
  });

  test("the input store is never mutated", () => {
    const before = freshStore();
    const snapshot = JSON.stringify(before);
    publishReportToStore(before, publishInput());

    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("publishReportToStore — a known report id updates in place", () => {
  test("edited HTML replaces the body while the URL (token) is unchanged", () => {
    const once = publishReportToStore(freshStore(), publishInput()).clients;
    const token = tokenOf(once, "acme-industrial");
    const { clients, created } = publishReportToStore(
      once,
      publishInput({ html: `<p>${MARKER_EDITED} — edited report HTML.</p>` }),
    );

    expect(created).toBe(false);
    const acme = clients.find((client) => client.id === "acme-industrial")!;
    expect(acme.token).toBe(token);
    expect(acme.reports!.map((report) => report.id)).toEqual([
      "preliminary",
      "follow-up",
      "publisher-fixture",
    ]);
    expect(acme.reports!.at(-1)!.html).toContain(MARKER_EDITED);
    expect(acme.reports!.at(-1)!.html).not.toContain(MARKER_NEW);
  });
});

describe("publishReportToStore — legacy records keep their shape", () => {
  test(`publishing the ${LEGACY_REPORT_ID} report updates a legacy body in place`, () => {
    const { clients, created } = publishReportToStore(
      freshStore(),
      publishInput({
        clientId: "beacon-health",
        reportId: LEGACY_REPORT_ID,
        title: "Beacon — Updated",
      }),
    );

    expect(created).toBe(false);
    const beacon = clients.find((client) => client.id === "beacon-health")!;
    expect(beacon.title).toBe("Beacon — Updated");
    expect(beacon.html).toContain(MARKER_NEW);
    expect(beacon.reports).toBeUndefined();
    expect(beacon.token).toBe(tokenOf(freshStore(), "beacon-health"));
  });

  test("a new report id migrates a legacy record with its old body first", () => {
    const { clients, created } = publishReportToStore(
      freshStore(),
      publishInput({ clientId: "beacon-health" }),
    );

    expect(created).toBe(true);
    const beacon = clients.find((client) => client.id === "beacon-health")!;
    expect(beacon.reports!.map((report) => report.id)).toEqual([
      LEGACY_REPORT_ID,
      "publisher-fixture",
    ]);
    expect(beacon.reports![0]!.html).toContain(MARKER_B);
    expect(beacon.reports![1]!.html).toContain(MARKER_NEW);
  });
});

describe("publishReportToStore — refusals", () => {
  test("an unknown client id throws and names the known ids", () => {
    expect(() =>
      publishReportToStore(freshStore(), publishInput({ clientId: "no-such-client" })),
    ).toThrow(/unknown client.*acme-industrial.*beacon-health/);
  });

  test("empty HTML and a misshapen report id throw before anything is read", () => {
    expect(() => publishReportToStore(freshStore(), publishInput({ html: "" }))).toThrow();
    expect(() =>
      publishReportToStore(freshStore(), publishInput({ reportId: "has spaces" })),
    ).toThrow();
    expect(() => publishReportToStore(freshStore(), publishInput({ title: "" }))).toThrow();
  });

  test("a present-but-unrenderable reports list refuses instead of dropping entries", () => {
    // Shaped through JSON so the malformed entry is expressible: a record
    // whose reports list the page cannot render must never be rewritten.
    const broken = JSON.parse(JSON.stringify(freshStore())) as ClientRecord[];
    (
      broken.find((client) => client.id === "acme-industrial") as unknown as Record<string, unknown>
    ).reports = [{ id: "x" }];

    expect(() => publishReportToStore(broken, publishInput())).toThrow(/cannot render/);
  });
});

describe("publishReportToFile — the run touches the content store only", () => {
  const repoStore = path.join(import.meta.dir, "..", "..", "..", "content", "clients.json");

  const copyStoreToScratch = async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "client-portal-publish-"));
    const storePath = path.join(dir, "clients.json");
    await writeFile(storePath, await readFile(repoStore, "utf8"), "utf8");
    return { dir, storePath };
  };

  const readStore = async (storePath: string) =>
    JSON.parse(await readFile(storePath, "utf8")) as ClientRecord[];

  test("a publish writes exactly one path and the marker resolves through the token lookup", async () => {
    const { dir, storePath } = await copyStoreToScratch();
    const token = tokenOf(await readStore(storePath), "acme-industrial");

    const result = await publishReportToFile(storePath, publishInput());

    expect(result).toEqual({
      clientId: "acme-industrial",
      reportId: "publisher-fixture",
      created: true,
    });
    // Confinement: the run's only write is the store path it was given.
    expect(await readdir(dir)).toEqual(["clients.json"]);

    const after = await readStore(storePath);
    expect(tokenOf(after, "acme-industrial")).toBe(token);
    const page = await fetchClientPageByTokenFn(token, {
      supabaseConfig: null,
      readStore: () => readStore(storePath),
    });
    expect(page?.id).toBe("acme-industrial");
    expect(page?.html).toContain(MARKER_NEW);
    expect(page?.html).not.toContain(MARKER_B);
  });

  test("re-publishing edited HTML updates the page with the token unchanged", async () => {
    const { storePath } = await copyStoreToScratch();
    const token = tokenOf(await readStore(storePath), "acme-industrial");
    await publishReportToFile(storePath, publishInput());

    const result = await publishReportToFile(
      storePath,
      publishInput({ html: `<p>${MARKER_EDITED} — edited report HTML.</p>` }),
    );

    expect(result.created).toBe(false);
    expect(tokenOf(await readStore(storePath), "acme-industrial")).toBe(token);
    const page = await fetchClientPageByTokenFn(token, {
      supabaseConfig: null,
      readStore: () => readStore(storePath),
    });
    expect(page?.html).toContain(MARKER_EDITED);
    expect(page?.html).not.toContain(MARKER_NEW);
  });

  test("a missing store and an unknown client fail without writing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "client-portal-publish-"));
    const missing = path.join(dir, "no-store.json");

    await expect(publishReportToFile(missing, publishInput())).rejects.toThrow(/cannot read/);
    expect(await readdir(dir)).toEqual([]);

    const { storePath } = await copyStoreToScratch();
    await expect(
      publishReportToFile(storePath, publishInput({ clientId: "no-such-client" })),
    ).rejects.toThrow(/unknown client/);
  });
});
