/**
 * Revokes and re-issues client portal links (US-008).
 *
 * Links are long-lived: they end by revocation only, never by a clock. This
 * is the one action that ends or renews one:
 * - `revoke` kills the client's link. The stored value is rotated to a
 *   freshly minted one that is never disclosed — the old URL stops resolving
 *   and no new URL is handed out.
 * - `reissue` renews the client's link. The stored value is rotated to a
 *   freshly minted one and the new URL is printed for the operator to send.
 *   The old URL stays denied.
 *
 * Two tiers, mirroring the lookup. When `SUPABASE_URL` and
 * `SUPABASE_SERVICE_ROLE_KEY` are set the row in `client_portal_tokens` is
 * patched (revoke sets `revoked_at`; re-issue overwrites the digest and
 * clears it); otherwise the content store (`content/clients.json`,
 * overridable with `--store` for fixture runs against a copy) is rotated in
 * place with the store's own formatting. The store is the client registry in
 * both tiers: an unknown `--client` fails naming the known ids.
 *
 * Stdout discipline: revoke prints no token or URL at all; re-issue prints
 * only the new URL. The old token is never printed by either action.
 *
 * Run with:
 *   bun run portal:tokens -- revoke --client acme-industrial
 *   bun run portal:tokens -- reissue --client acme-industrial
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { clientUrlForToken } from "../src/lib/client-portal/magic-link-email";
import {
  mintToken,
  reissueClientTokenRow,
  revokeClientTokenRow,
  rotateClientToken,
} from "../src/lib/client-portal/token-admin";
import { hashToken, supabaseConfigFromEnv } from "../src/lib/client-portal/supabase-tokens";
import type { ClientRecord } from "../src/lib/client-portal/tokens";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STORE = path.join(REPO_ROOT, "content", "clients.json");

type Action = "revoke" | "reissue";

interface Options {
  action: Action;
  clientId: string;
  store: string;
}

function usage(): string {
  return [
    "usage: bun scripts/manage-client-token.ts (revoke | reissue) --client <id>",
    "         [--store <path>]",
    "",
    "  revoke      kill the client's link; the old URL stops resolving",
    "  reissue     renew the client's link; prints the new URL to send",
    "  --client    existing client id in the content store (e.g. acme-industrial)",
    `  --store     content-store path (default: ${path.relative(process.cwd(), DEFAULT_STORE)})`,
  ].join("\n");
}

function takeValue(args: string[], flag: string): string | undefined {
  const at = args.indexOf(flag);
  if (at === -1) return undefined;
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} needs a value`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const [action] = argv;
  const clientId = takeValue(argv, "--client");
  if ((action !== "revoke" && action !== "reissue") || !clientId) {
    throw new Error(usage());
  }
  return { action, clientId, store: takeValue(argv, "--store") ?? DEFAULT_STORE };
}

async function readRegistry(storePath: string): Promise<ClientRecord[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(storePath, "utf8"));
  } catch {
    throw new Error(`[client-portal] cannot read the content store at ${storePath}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`[client-portal] the content store at ${storePath} is not a client list`);
  }
  return parsed as ClientRecord[];
}

function knownIds(clients: readonly ClientRecord[]): string {
  return clients
    .map((candidate) => (typeof candidate?.id === "string" ? candidate.id : null))
    .filter((id): id is string => id !== null)
    .join(", ");
}

async function main(): Promise<void> {
  let options: Options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  let clients: ClientRecord[];
  try {
    clients = await readRegistry(options.store);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  if (!clients.some((candidate) => candidate?.id === options.clientId)) {
    console.error(
      `[client-portal] unknown client ${JSON.stringify(options.clientId)} (known: ${knownIds(clients)})`,
    );
    process.exitCode = 1;
    return;
  }

  const config = supabaseConfigFromEnv();
  const replacement = mintToken();

  if (config) {
    try {
      if (options.action === "revoke") {
        const matched = await revokeClientTokenRow(options.clientId, config);
        console.log(
          matched > 0
            ? `[client-portal] revoked token for ${JSON.stringify(options.clientId)} — the old link no longer resolves`
            : `[client-portal] no token row for ${JSON.stringify(options.clientId)} — no link was live, old tokens already deny`,
        );
      } else {
        const row = await reissueClientTokenRow(
          options.clientId,
          await hashToken(replacement),
          config,
        );
        if (!row) {
          console.error(
            `[client-portal] re-issue for ${JSON.stringify(options.clientId)} returned no row — investigate`,
          );
          process.exitCode = 1;
          return;
        }
        console.log(
          `[client-portal] re-issued token for ${JSON.stringify(options.clientId)} — the old link stays denied`,
        );
        console.log(`[client-portal] new link: ${clientUrlForToken(replacement)}`);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
    return;
  }

  // Unconfigured: rotate the fixture store. Revoke discards the replacement
  // undisclosed; re-issue prints the new link for the operator to send.
  let rotated: ClientRecord[];
  try {
    rotated = rotateClientToken(clients, options.clientId, replacement);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  await writeFile(options.store, `${JSON.stringify(rotated, null, 2)}\n`, "utf8");
  if (options.action === "revoke") {
    console.log(
      `[client-portal] revoked token for ${JSON.stringify(options.clientId)} in ${options.store} — the old link no longer resolves`,
    );
  } else {
    console.log(
      `[client-portal] re-issued token for ${JSON.stringify(options.clientId)} in ${options.store} — the old link stays denied`,
    );
    console.log(`[client-portal] new link: ${clientUrlForToken(replacement)}`);
  }
}

await main();
