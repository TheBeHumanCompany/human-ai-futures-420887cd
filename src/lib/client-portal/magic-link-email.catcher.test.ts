import { afterEach, describe, expect, test } from "bun:test";

import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CATCHER_DIR_ENV } from "./email-catcher";
import {
  clientUrlForToken,
  deliverMagicLinkEmail,
  type MagicLinkRequest,
} from "./magic-link-email";

/**
 * The FUNNEL_EMAIL_CATCHER_DIR seam (funnel plan todo 12).
 *
 * When the env var is set, `deliverMagicLinkEmail` writes the send body as a
 * JSON file into that directory instead of calling Resend — the funnel tier's
 * deterministic email capture. When it is unset, the module behaves exactly
 * as before: same validation, same unconfigured gate, same provider call.
 * The existing default-path pins live in `magic-link-email.test.ts` and stay
 * untouched; this file pins only the seam.
 */

const TOKEN = "d5PLdS3fF5OFFaC-LO9HVcmphoi746VR19aH9hs4Uhs";

const request: MagicLinkRequest = {
  clientName: "Funnel Fixture Co",
  to: "funnel-test@example.test",
  clientUrl: clientUrlForToken(TOKEN),
};

function noFetch(): typeof fetch {
  return (async () => {
    throw new Error("the catcher path must never reach the network");
  }) as unknown as typeof fetch;
}

const NO_SEND = noFetch();

describe("the email catcher seam", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function captureDir(): string {
    const dir = join(
      tmpdir(),
      `funnel-catcher-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    dirs.push(dir);
    return dir;
  }

  test("a capture replaces the provider send with one JSON file", async () => {
    const dir = captureDir();
    const out = await deliverMagicLinkEmail(request, { catcherDir: dir, fetchImpl: NO_SEND });
    expect(out).toEqual({ ok: true });

    const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
    expect(files).toHaveLength(1);

    const payload = JSON.parse(readFileSync(join(dir, files[0]), "utf8")) as {
      capturedAt: string;
      endpoint: string;
      body: { from: string; to: string[]; subject: string; html: string; text: string };
    };
    expect(typeof payload.capturedAt).toBe("string");
    expect(payload.endpoint).toBe("https://api.resend.com/emails");
    expect(payload.body.from).toContain("updates.thebehumancompany.ca");
    expect(payload.body.to).toEqual([request.to]);
    expect(payload.body.subject).toContain(request.clientName);
    expect(payload.body.html).toContain(request.clientUrl);
    expect(payload.body.text).toContain(request.clientUrl);
    expect(Object.keys(payload.body)).not.toContain("attachments");
  });

  test("the capture works with no API key — the funnel tier has none", async () => {
    const dir = captureDir();
    const out = await deliverMagicLinkEmail(request, { catcherDir: dir, fetchImpl: NO_SEND });
    expect(out).toEqual({ ok: true });
    expect(readdirSync(dir)).toHaveLength(1);
  });

  test("two captures land as two files", async () => {
    const dir = captureDir();
    await deliverMagicLinkEmail(request, { catcherDir: dir, fetchImpl: NO_SEND });
    await deliverMagicLinkEmail(request, { catcherDir: dir, fetchImpl: NO_SEND });
    expect(readdirSync(dir).filter((name) => name.endsWith(".json"))).toHaveLength(2);
  });

  test("env unset keeps the default provider path", async () => {
    delete process.env[CATCHER_DIR_ENV];
    let called = 0;
    const out = await deliverMagicLinkEmail(request, {
      apiKey: "re_test",
      fetchImpl: (async (_url: unknown, init?: RequestInit) => {
        called += 1;
        expect(String(init?.body ?? "")).toContain(request.clientUrl);
        return new Response('{"id":"fixture"}', { status: 200 });
      }) as unknown as typeof fetch,
    });
    expect(out).toEqual({ ok: true });
    expect(called).toBe(1);
  });

  test(`${CATCHER_DIR_ENV} set through the environment is honoured`, async () => {
    const dir = captureDir();
    process.env[CATCHER_DIR_ENV] = dir;
    try {
      const out = await deliverMagicLinkEmail(request, { fetchImpl: NO_SEND });
      expect(out).toEqual({ ok: true });
      expect(readdirSync(dir).filter((name) => name.endsWith(".json"))).toHaveLength(1);
    } finally {
      delete process.env[CATCHER_DIR_ENV];
    }
  });

  test(`an empty ${CATCHER_DIR_ENV} means unset, not "write to ''"`, async () => {
    process.env[CATCHER_DIR_ENV] = "";
    try {
      let called = 0;
      const out = await deliverMagicLinkEmail(request, {
        apiKey: "re_test",
        fetchImpl: (async () => {
          called += 1;
          return new Response("{}", { status: 200 });
        }) as unknown as typeof fetch,
      });
      expect(out).toEqual({ ok: true });
      expect(called).toBe(1);
    } finally {
      delete process.env[CATCHER_DIR_ENV];
    }
  });

  test("a failed capture fails honestly instead of claiming a send", async () => {
    const blocker = captureDir();
    // A plain file where the directory should be: the write cannot succeed.
    writeFileSync(blocker, "not a directory");
    const out = await deliverMagicLinkEmail(request, { catcherDir: blocker, fetchImpl: NO_SEND });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.reason).toBe("failed");
    rmSync(blocker, { force: true });
  });

  test("mkdir -p semantics: a missing capture directory is created", async () => {
    const parent = captureDir();
    const nested = join(parent, "run-fw1", "emails");
    const out = await deliverMagicLinkEmail(request, { catcherDir: nested, fetchImpl: NO_SEND });
    expect(out).toEqual({ ok: true });
    expect(readdirSync(nested)).toHaveLength(1);
  });
});
