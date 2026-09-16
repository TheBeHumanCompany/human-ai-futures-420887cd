import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

import {
  deriveIntakeQuestions,
  fetchClerkScopedBlueprintSections,
  handleIntakeUpload,
  loadIntakeQuestions,
  storeIntakeUpload,
} from "./intake";
import { MAX_UPLOAD_BYTES } from "./upload-policy";
import type { ClerkSupabaseConfig } from "./supabase-clerk";

/**
 * The portal intake (todo 10, G4), pinned without Clerk or Supabase.
 *
 * Three contracts: the question set is DERIVED, deterministically, from the
 * client's final-tier blueprint sections (no model in the loop, so the funnel
 * suite can snapshot it); the upload policy is consumed exactly as
 * `upload-policy.ts` wrote it, with a rejection answering before any storage
 * call exists to make; and the storage write lands at `storageKeyFor`'s key in
 * the `client-uploads` bucket through one injected fetch, counted.
 */

const CONFIG: ClerkSupabaseConfig = {
  url: "https://xyzcompany.supabase.co",
  anonKey: "anon-for-tests-only",
};

/* ------------------------------------------------------------------ */
/* The seeded fixture sections (scripts/verify/funnel-rows.ts)          */
/* ------------------------------------------------------------------ */

const section = (
  sectionKey: string,
  ordinal: number,
  tier: "preliminary" | "final",
  title: string,
): BlueprintSection => ({
  id: `uuid-${sectionKey}`,
  sectionKey,
  ordinal,
  tier,
  title,
  band: "findings",
  blocks: [],
  locked: false,
});

const FIXTURE_SECTIONS: BlueprintSection[] = [
  section("sec-pre-1", 1, "preliminary", "Fixture Finding Overview"),
  section("sec-pre-2", 2, "preliminary", "Fixture Method Notes"),
  section("sec-fin-1", 3, "final", "Final Opportunity Map"),
  section("sec-fin-2", 4, "final", "Final Playbook Detail"),
];

/** The seed is the source of truth for the titles the snapshot pins. */
const SEED_SOURCE = readFileSync(
  new URL("../../../scripts/verify/funnel-rows.ts", import.meta.url).pathname,
  "utf8",
);

/* ------------------------------------------------------------------ */
/* Question derivation — deterministic, snapshot-able                   */
/* ------------------------------------------------------------------ */

describe("deriveIntakeQuestions", () => {
  test("one question per FINAL section, in ordinal order, exact template", () => {
    expect(deriveIntakeQuestions(FIXTURE_SECTIONS)).toEqual([
      {
        sectionKey: "sec-fin-1",
        title: "Final Opportunity Map",
        prompt: "For the section 'Final Opportunity Map', upload the supporting document.",
      },
      {
        sectionKey: "sec-fin-2",
        title: "Final Playbook Detail",
        prompt: "For the section 'Final Playbook Detail', upload the supporting document.",
      },
    ]);
  });

  test("preliminary sections never produce a question", () => {
    expect(deriveIntakeQuestions(FIXTURE_SECTIONS.slice(0, 2))).toEqual([]);
  });

  test("the derivation is order-independent — input order cannot move the output", () => {
    const shuffled = [
      FIXTURE_SECTIONS[3],
      FIXTURE_SECTIONS[0],
      FIXTURE_SECTIONS[2],
      FIXTURE_SECTIONS[1],
    ];
    expect(deriveIntakeQuestions(shuffled)).toEqual(deriveIntakeQuestions(FIXTURE_SECTIONS));
  });

  test("an empty section list answers an empty question set", () => {
    expect(deriveIntakeQuestions([])).toEqual([]);
  });

  test("the snapshot's titles are the seeded titles — seed drift turns this red", () => {
    for (const pinned of FIXTURE_SECTIONS) {
      expect(SEED_SOURCE).toContain(`"${pinned.title}"`);
    }
    expect(SEED_SOURCE).toContain('"sec-pre-1"');
    expect(SEED_SOURCE).toContain('"sec-pre-2"');
    expect(SEED_SOURCE).toContain('"sec-fin-1"');
    expect(SEED_SOURCE).toContain('"sec-fin-2"');
  });
});

/* ------------------------------------------------------------------ */
/* Upload recording — policy first, storage second                      */
/* ------------------------------------------------------------------ */

const SERVICE = {
  url: "https://xyzcompany.supabase.co",
  serviceRoleKey: "service-for-tests-only",
};

const PDF = { name: "report.pdf", size: 1024, type: "application/pdf" };

function recordingFetch(ok = true, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: url.toString(), init });
    return { ok, status } as Response;
  }) as typeof fetch & { calls: typeof calls };
  impl.calls = calls;
  return impl;
}

describe("storeIntakeUpload", () => {
  test("a rejected oversize file answers the exact policy message with ZERO storage calls", async () => {
    const fetchImpl = recordingFetch();
    const outcome = await storeIntakeUpload(
      "funnel-fixture",
      { ...PDF, size: MAX_UPLOAD_BYTES + 1 },
      new Blob(["x"]),
      SERVICE,
      { fetchImpl },
    );
    expect(outcome).toEqual({
      status: "rejected",
      reason: "too-large",
      message: "Files must be 25 MB or smaller.",
    });
    expect(fetchImpl.calls.length).toBe(0);
  });

  test("a rejected wrong-MIME file answers the exact policy message with ZERO storage calls", async () => {
    const fetchImpl = recordingFetch();
    const outcome = await storeIntakeUpload(
      "funnel-fixture",
      { name: "invoice.pdf", size: 10, type: "text/html" },
      new Blob(["x"]),
      SERVICE,
      { fetchImpl },
    );
    expect(outcome).toEqual({
      status: "rejected",
      reason: "type-mismatch",
      message:
        "We accept documents and images: pdf, doc, docx, xls, xlsx, ppt, pptx, csv, txt, md, png, jpg, jpeg, webp.",
    });
    expect(fetchImpl.calls.length).toBe(0);
  });

  test("a happy upload writes once, at the storageKeyFor key, in the client-uploads bucket", async () => {
    const fetchImpl = recordingFetch();
    const bytes = new Blob(["PDF-BYTES"], { type: "application/pdf" });
    const outcome = await storeIntakeUpload("funnel-fixture", PDF, bytes, SERVICE, {
      fetchImpl,
      newId: () => "0f0e0d0c-0b0a-49d8-8c7b-6a5b4c3d2e1f",
    });
    expect(outcome).toEqual({
      status: "stored",
      key: "funnel-fixture/0f0e0d0c-0b0a-49d8-8c7b-6a5b4c3d2e1f-report.pdf",
      bucket: "client-uploads",
    });
    expect(fetchImpl.calls.length).toBe(1);
    const { url, init } = fetchImpl.calls[0]!;
    expect(url).toBe(
      `${SERVICE.url}/storage/v1/object/client-uploads/funnel-fixture/0f0e0d0c-0b0a-49d8-8c7b-6a5b4c3d2e1f-report.pdf`,
    );
    const headers = new Headers(init.headers);
    expect(headers.get("apikey")).toBe(SERVICE.serviceRoleKey);
    expect(headers.get("authorization")).toBe(`Bearer ${SERVICE.serviceRoleKey}`);
    expect(headers.get("content-type")).toBe("application/pdf");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(bytes);
  });

  test("the client's filename is sanitized into the key, never used as a path", async () => {
    const fetchImpl = recordingFetch();
    const outcome = await storeIntakeUpload(
      "funnel-fixture",
      { name: "Q3 report final.pdf", size: 10, type: "application/pdf" },
      new Blob(["x"]),
      SERVICE,
      { fetchImpl, newId: () => "id-1" },
    );
    expect(outcome.status === "stored" && outcome.key).toBe(
      "funnel-fixture/id-1-Q3-report-final.pdf",
    );
  });

  test("the stored outcome exists only after the write is verified — a failed write throws, never confirms", async () => {
    const fetchImpl = recordingFetch(false, 500);
    await expect(
      storeIntakeUpload("funnel-fixture", PDF, new Blob(["x"]), SERVICE, { fetchImpl }),
    ).rejects.toThrow("answered 500");
    expect(fetchImpl.calls.length).toBe(1);
  });

  test("each upload mints a fresh key, so a re-upload never overwrites the prior object", async () => {
    const fetchImpl = recordingFetch();
    let n = 0;
    const newId = () => `id-${++n}`;
    await storeIntakeUpload("funnel-fixture", PDF, new Blob(["x"]), SERVICE, { fetchImpl, newId });
    await storeIntakeUpload("funnel-fixture", PDF, new Blob(["x"]), SERVICE, { fetchImpl, newId });
    const urls = fetchImpl.calls.map((call) => call.url);
    expect(urls[0]).not.toBe(urls[1]);
  });
});

/* ------------------------------------------------------------------ */
/* The Clerk-scoped sections read behind the question set               */
/* ------------------------------------------------------------------ */

const ROWS = [
  {
    id: "u1",
    section_key: "sec-pre-1",
    ordinal: 1,
    tier: "preliminary",
    title: "Fixture Finding Overview",
    band: "findings",
  },
  {
    id: "u2",
    section_key: "sec-pre-2",
    ordinal: 2,
    tier: "preliminary",
    title: "Fixture Method Notes",
    band: "prose",
  },
  {
    id: "u3",
    section_key: "sec-fin-1",
    ordinal: 3,
    tier: "final",
    title: "Final Opportunity Map",
    band: "opportunities",
  },
  {
    id: "u4",
    section_key: "sec-fin-2",
    ordinal: 4,
    tier: "final",
    title: "Final Playbook Detail",
    band: "playbook",
  },
];

describe("fetchClerkScopedBlueprintSections", () => {
  test("reads the blueprint table with the Clerk token, anon key in the apikey header", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const stub = (async (url: string | URL, init: RequestInit = {}) => {
      calls.push({ url: url.toString(), init });
      return { ok: true, status: 200, json: async () => ROWS } as Response;
    }) as typeof fetch;
    const sections = await fetchClerkScopedBlueprintSections("clerk-token", CONFIG, stub);
    expect(calls.length).toBe(1);
    const { url, init } = calls[0]!;
    expect(url.startsWith(`${CONFIG.url}/rest/v1/client_blueprint_sections`)).toBe(true);
    expect(url).toContain("order=ordinal.asc");
    const headers = new Headers(init.headers);
    expect(headers.get("apikey")).toBe(CONFIG.anonKey);
    expect(headers.get("authorization")).toBe("Bearer clerk-token");
    expect(sections.map((s) => s.sectionKey)).toEqual([
      "sec-pre-1",
      "sec-pre-2",
      "sec-fin-1",
      "sec-fin-2",
    ]);
  });

  test("a denied read throws — the caller decides how to degrade", async () => {
    const stub = (async () => ({ ok: false, status: 403 }) as Response) as typeof fetch;
    await expect(fetchClerkScopedBlueprintSections("clerk-token", CONFIG, stub)).rejects.toThrow(
      "answered 403",
    );
  });
});

describe("loadIntakeQuestions", () => {
  const authed = { userId: "user_paid_1", getToken: async () => "clerk-session-token" };
  const rowsFetch = (async () =>
    ({ ok: true, status: 200, json: async () => ROWS }) as Response) as typeof fetch;

  test("a paid session gets the final-section questions", async () => {
    const { questions } = await loadIntakeQuestions(authed, {
      supabaseConfig: CONFIG,
      fetchImpl: rowsFetch,
    });
    expect(questions.map((q) => q.sectionKey)).toEqual(["sec-fin-1", "sec-fin-2"]);
    expect(questions[0]?.prompt).toBe(
      "For the section 'Final Opportunity Map', upload the supporting document.",
    );
  });

  test("no signed-in user answers empty without any request", async () => {
    let calls = 0;
    const { questions } = await loadIntakeQuestions(
      {
        userId: null,
        getToken: async () => {
          calls++;
          return "never";
        },
      },
      { supabaseConfig: CONFIG, fetchImpl: rowsFetch },
    );
    expect(questions).toEqual([]);
    expect(calls).toBe(0);
  });

  test("a denied read degrades to an empty set — questions are additive, never page-breaking", async () => {
    const { questions } = await loadIntakeQuestions(authed, {
      supabaseConfig: CONFIG,
      fetchImpl: (async () => ({ ok: false, status: 403 }) as Response) as typeof fetch,
    });
    expect(questions).toEqual([]);
  });

  test("a missing configuration degrades to an empty set without a request", async () => {
    let calls = 0;
    const { questions } = await loadIntakeQuestions(authed, {
      supabaseConfig: null,
      fetchImpl: (async () => {
        calls++;
        return { ok: true, status: 200, json: async () => [] } as Response;
      }) as typeof fetch,
    });
    expect(questions).toEqual([]);
    expect(calls).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* The route pins the selectors the funnel stage S5 drives              */
/* ------------------------------------------------------------------ */

describe("the portal route pins the intake contract", () => {
  const ROUTE_SOURCE = readFileSync(
    new URL("../../components/client-portal/intake-card.tsx", import.meta.url).pathname,
    "utf8",
  );
  const PORTAL_ROUTE_SOURCE = readFileSync(
    new URL("../../routes/portal.tsx", import.meta.url).pathname,
    "utf8",
  );

  test("the funnel stage asserts against these testids", () => {
    expect(ROUTE_SOURCE).toContain('data-testid="intake-card"');
    expect(ROUTE_SOURCE).toContain('data-testid="intake-question"');
    expect(ROUTE_SOURCE).toContain('data-testid="intake-file-input"');
    expect(ROUTE_SOURCE).toContain('data-testid="intake-submit"');
    expect(ROUTE_SOURCE).toContain('data-testid="intake-error"');
    expect(ROUTE_SOURCE).toContain('data-testid="intake-confirm"');
  });

  test("the file input accepts exactly the policy's allowlist", () => {
    expect(ROUTE_SOURCE).toContain("ACCEPT_ATTRIBUTE");
  });

  test("rejections render as alerts, and the confirmation exists only on a stored outcome", () => {
    expect(ROUTE_SOURCE).toContain('role="alert"');
    expect(ROUTE_SOURCE).toContain('case "stored"');
  });

  test("a policy rejection renders the inline intake-rejection alert, distinct from system errors", () => {
    expect(ROUTE_SOURCE).toContain('data-testid="intake-rejection"');
    // The policy branch, not the catch-all: the exact explain() text is
    // surfaced as its own state so the funnel stage S5 can pin it.
    expect(ROUTE_SOURCE).toContain('case "rejected"');
    expect(ROUTE_SOURCE).toContain('kind: "rejected"');
  });

  test("the portal renders the shared card with session identity", () => {
    expect(PORTAL_ROUTE_SOURCE).toContain("<IntakeCard");
    expect(PORTAL_ROUTE_SOURCE).not.toContain('data-testid="intake-card"');
  });

  test("a caller-provided token rides the upload form for link identity", () => {
    expect(ROUTE_SOURCE).toContain('data.append("token", token)');
  });
});

/* ------------------------------------------------------------------ */
/* Token-identity uploads — the /c/$token path, without a Clerk session */
/* ------------------------------------------------------------------ */

describe("handleIntakeUpload — token identity", () => {
  const TOKEN = "t".repeat(43);
  const STORE = [
    {
      id: "token-upload-client",
      name: "Token Upload Co",
      token: TOKEN,
      title: "Token Upload Co — Preliminary Blueprint",
      html: "<p>fixture</p>",
    },
  ];
  const SERVICE = { url: "https://service.test", serviceRoleKey: "service-key-tests" };
  const fileOf = () => new File(["document-bytes"], "doc.txt", { type: "text/plain" });

  const stubFetch = (
    paid: { title: string | null; html: string | null; unlocked: boolean } | null,
    seen: { storageHits: number; storageKeys: string[] },
  ) =>
    (async (url: string | URL | Request) => {
      const target = String(url);
      if (target.includes("client_portal_tokens")) {
        return new Response(
          JSON.stringify([{ client_id: "token-upload-client", revoked_at: null }]),
          { status: 200 },
        );
      }
      if (target.includes("client_paid_reports")) {
        return new Response(JSON.stringify(paid ? [paid] : []), { status: 200 });
      }
      if (target.includes("/storage/v1/object/")) {
        seen.storageHits += 1;
        seen.storageKeys.push(target);
        return new Response("{}", { status: 200 });
      }
      return new Response(JSON.stringify({ message: "unexpected url" }), { status: 500 });
    }) as typeof fetch;

  test("an unlocked link stores the document under the resolved client", async () => {
    const seen = { storageHits: 0, storageKeys: [] as string[] };
    const outcome = await handleIntakeUpload(
      { file: fileOf(), token: TOKEN },
      {
        fetchImpl: stubFetch({ title: "Final", html: "<p>final</p>", unlocked: true }, seen),
        serviceConfig: SERVICE,
        readStore: async () => STORE as never,
      },
    );
    expect(outcome.status).toBe("stored");
    expect(seen.storageHits).toBe(1);
    expect(seen.storageKeys[0]).toContain("token-upload-client");
  });

  test("a locked link is refused before any storage dial", async () => {
    const seen = { storageHits: 0, storageKeys: [] as string[] };
    await expect(
      handleIntakeUpload(
        { file: fileOf(), token: TOKEN },
        {
          fetchImpl: stubFetch({ title: "Final", html: "<p>final</p>", unlocked: false }, seen),
          serviceConfig: SERVICE,
          readStore: async () => STORE as never,
        },
      ),
    ).rejects.toThrow("not unlocked an audit yet");
    expect(seen.storageHits).toBe(0);
  });

  test("a token resolving to no client refuses with zero storage dials", async () => {
    const seen = { storageHits: 0, storageKeys: [] as string[] };
    const emptyLookup = (async (url: string | URL | Request) => {
      const target = String(url);
      if (target.includes("client_portal_tokens")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response(JSON.stringify({ message: "unexpected url" }), { status: 500 });
    }) as typeof fetch;
    await expect(
      handleIntakeUpload(
        { file: fileOf(), token: TOKEN },
        {
          fetchImpl: emptyLookup,
          serviceConfig: SERVICE,
          readStore: async () => STORE as never,
        },
      ),
    ).rejects.toThrow("no client page to upload against");
    expect(seen.storageHits).toBe(0);
  });
});
