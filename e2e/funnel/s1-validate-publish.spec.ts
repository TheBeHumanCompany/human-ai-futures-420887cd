import { execFile } from "node:child_process";
import { access, copyFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

import { ensureFunnelSeeded, prospectUrl, readFixtureToken } from "./suite-setup.ts";

/**
 * Stage 1 — the operator handoff (plan todo 13, S1): the podcasts runner
 * chain (deterministic `gtm validate` → `gtm blueprint`) produces its
 * artifacts, `portal:publish` pastes the fixture report onto the client's
 * page, and the prospect URL serves it. The failure case proves the runner
 * fails fast on missing fixture inputs rather than faking a pass.
 *
 * The publish targets the fixture store through the script's documented
 * `--store` flag: under the funnel tier the app resolves
 * `FUNNEL_STORE_PATH`, so the default `content/clients.json` is neither the
 * store the suite reads nor one a fixture publish may touch. The store's
 * bytes are backed up before the write and restored after, so the tracked
 * fixture and every later run start from the committed state.
 */
const run = promisify(execFile);

const STAGE = "s1-validate-publish";
const FIXTURE_STORE = "e2e/funnel/fixtures/clients.json";
const PODCASTS_DIR =
  process.env["FUNNEL_PODCASTS_DIR"] ??
  "/Users/siddicky/Projects/BeHuman_Company/podcasts-wt/e2e-smoke-blueprint-funnel-w1";

interface Stage1Payload {
  package: string;
  verdictPath: string;
  blueprintHtml: string;
}

test.beforeAll(async () => {
  await ensureFunnelSeeded();
});

test("the runner chain produces verdict and blueprint artifacts", async () => {
  const workDir = await mkdtemp(join(tmpdir(), "funnel-stage1-"));
  const { stdout } = await run(
    "uv",
    [
      "run",
      "--frozen",
      "python",
      "scripts/funnel_stage1.py",
      "--work-dir",
      workDir,
      "--timeout",
      "240",
    ],
    { cwd: PODCASTS_DIR, timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  );

  const payload = JSON.parse(stdout) as Partial<Stage1Payload>;
  expect(payload.package).toMatch(/funnel-fixture\/blueprint-draft-1\.md$/);
  expect(payload.verdictPath).toMatch(/verdict\.md$/);
  expect(payload.blueprintHtml).toMatch(/blueprint\/index\.html$/);
  await access(payload.verdictPath);
  await access(payload.blueprintHtml);
});

test("a missing fixture input fails the runner with a named path", async () => {
  const missingDir = join(tmpdir(), `funnel-missing-${Date.now()}`);
  try {
    await run(
      "uv",
      [
        "run",
        "--frozen",
        "python",
        "scripts/funnel_stage1.py",
        "--fixture-dir",
        missingDir,
        "--timeout",
        "60",
      ],
      { cwd: PODCASTS_DIR, timeout: 120_000 },
    );
    throw new Error("funnel: the runner exited 0 on missing fixture inputs");
  } catch (error) {
    const failure = error as { stderr?: string; message?: string };
    if (failure.stderr === undefined) throw error;
    expect(failure.stderr).toContain("missing");
    expect(failure.stderr).toContain("funnel-missing");
  }
});

test("portal:publish pastes the report and /c/$token serves it", async ({ request }) => {
  const token = await readFixtureToken();
  const storePath = resolve(process.cwd(), FIXTURE_STORE);
  const backupPath = join(tmpdir(), `funnel-store-${Date.now()}.json`);
  await copyFile(storePath, backupPath);

  try {
    const published = await run(
      "bun",
      [
        "run",
        "portal:publish",
        "--",
        "--client",
        "funnel-fixture",
        "--report",
        "funnel-fixture-report",
        "--title",
        "Funnel Fixture Report",
        "--html-file",
        "e2e/funnel/fixtures/report.html",
        "--store",
        FIXTURE_STORE,
      ],
      { timeout: 60_000 },
    );
    expect(published.stdout).toContain('"funnel-fixture-report"');
    expect(published.stdout).toContain("token unchanged: yes");

    const response = await request.get(prospectUrl(token));
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("The Funnel Fixture Co");
    expect(body).toContain("sec-pre-1");
  } finally {
    await copyFile(backupPath, storePath);
  }
});
