/**
 * The funnel fixture tier's data: the fixture client source and the exact rows
 * seed writes. Split from the transport in funnel-db.ts so each file owns
 * one thing.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { hashToken } from "../../src/lib/client-portal/supabase-tokens";

import {
  DEFAULT_FIXTURE_STORE,
  FUNNEL_CLIENT_ID,
  FUNNEL_CLIENT_NAME,
  STORE_PATH_ENV,
} from "./funnel-db";

export interface FixtureClient {
  id: string;
  name: string;
  token: string;
}

/**
 * The funnel fixture client, from FUNNEL_STORE_PATH or the in-repo fixture
 * store — the same resolution rule the app seam applies. The token guard is
 * local rather than an import of tokens.ts: that module wires
 * `createServerFn` at load time and must stay out of bare bun scripts.
 */
export async function readFixtureClient(
  env: Record<string, string | undefined> = process.env,
): Promise<FixtureClient> {
  const override = env[STORE_PATH_ENV]?.trim();
  const storePath = resolve(process.cwd(), override || DEFAULT_FIXTURE_STORE);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(storePath, "utf8"));
  } catch (error) {
    console.error(
      `[funnel] cannot read the fixture store at ${storePath}: ${error instanceof Error ? error.message : error}`,
    );
    process.exit(1);
  }
  const client = Array.isArray(parsed)
    ? parsed.find((entry): entry is FixtureClient => {
        const candidate = entry as Partial<FixtureClient> | null;
        return (
          typeof candidate === "object" &&
          candidate !== null &&
          candidate.id === FUNNEL_CLIENT_ID &&
          typeof candidate.name === "string" &&
          typeof candidate.token === "string"
        );
      })
    : undefined;
  if (!client || !/^[A-Za-z0-9_-]{32,}$/.test(client.token)) {
    console.error(
      `[funnel] fixture store ${storePath} has no usable ${FUNNEL_CLIENT_ID} record (43+ base64url token required)`,
    );
    process.exit(1);
  }
  return client;
}

export interface SeedState {
  tokenHash: string;
  paidReport: Record<string, unknown>;
  sections: Record<string, unknown>[];
}

/**
 * The rows seed writes, derived from the fixture client so the token digest
 * always matches the store the suite will drive. Final sections are
 * published and gated by `client_paid_reports.unlocked=false` — the RLS
 * pattern of migration 20260915000000 (publish + paywall, not drafts).
 */
export async function buildSeedState(client: FixtureClient, runId: string): Promise<SeedState> {
  const section = (
    sectionKey: string,
    ordinal: number,
    tier: "preliminary" | "final",
    title: string,
    teaser: string | null,
    band: string,
    blocks: unknown[],
  ): Record<string, unknown> => ({
    client_id: FUNNEL_CLIENT_ID,
    section_key: sectionKey,
    ordinal,
    tier,
    status: "published",
    supersedes_section_id: null,
    title,
    teaser,
    band,
    body: { runId, blocks },
  });

  return {
    tokenHash: await hashToken(client.token),
    paidReport: {
      client_id: FUNNEL_CLIENT_ID,
      title: `${FUNNEL_CLIENT_NAME} — Final Blueprint`,
      html: `<p>FUNNEL-FIXTURE-PAID-MARKER-9d2e4f — final findings for ${FUNNEL_CLIENT_NAME}.</p>`,
      unlocked: false,
      unlocked_at: null,
      stripe_customer_id: null,
      stripe_session_id: null,
      clerk_user_id: null,
    },
    sections: [
      section("sec-pre-1", 1, "preliminary", "Fixture Finding Overview", null, "findings", [
        {
          type: "finding",
          kind: "fact",
          claim: "FUNNEL-FIXTURE-FINDING-4c2a — fictional preliminary finding.",
        },
      ]),
      section("sec-pre-2", 2, "preliminary", "Fixture Method Notes", null, "prose", [
        { type: "prose", paragraphs: ["Fictional fixture prose for the funnel run."] },
      ]),
      section(
        "sec-fin-1",
        3,
        "final",
        "Final Opportunity Map",
        "Unlocks with checkout — the full opportunity map.",
        "opportunities",
        [
          {
            type: "opportunity",
            label: "O1",
            title: "Fixture opportunity",
            bullets: [{ label: "Play", text: "Fictional fixture play." }],
          },
        ],
      ),
      section(
        "sec-fin-2",
        4,
        "final",
        "Final Playbook Detail",
        "Unlocks with checkout — the complete playbook detail.",
        "playbook",
        [{ type: "prose", paragraphs: ["Fictional final playbook detail."] }],
      ),
    ],
  };
}
