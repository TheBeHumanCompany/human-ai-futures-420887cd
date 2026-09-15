/**
 * Operator checkout links (US-010).
 *
 * usage: bun scripts/create-audit-checkout.ts --client <id> [--price <price-id>]
 *
 * Creates a one-time audit-fee Checkout Session and prints its URL — the URL
 * goes into the magic-link email beside the portal link (US-006 block), so
 * the client pays and then reads on the link they already hold. Prints the
 * URL and nothing else sensitive: session ids are single-use operator
 * artifacts, never credentials.
 *
 * The amount lives in the Price object, named by --price or
 * STRIPE_AUDIT_PRICE_ID. There is deliberately no --amount flag: inventing
 * money at the keyboard is the one error here that cannot be diffed away.
 */
import { createAuditCheckoutSession } from "../src/lib/billing/audit-checkout";

function usage(): string {
  return [
    "usage: bun scripts/create-audit-checkout.ts --client <id> [--price <price-id>]",
    "",
    "  --client  portal client id, carried as metadata so fulfillment maps back",
    "  --price   test-mode Price id (default: STRIPE_AUDIT_PRICE_ID)",
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

const clientId = takeValue(process.argv.slice(2), "--client");
const priceId = takeValue(process.argv.slice(2), "--price") ?? process.env["STRIPE_AUDIT_PRICE_ID"];

if (!clientId) throw new Error(usage());
if (!priceId) {
  throw new Error("[billing] no price: pass --price or set STRIPE_AUDIT_PRICE_ID");
}

const session = await createAuditCheckoutSession({ clientId, priceId });
console.log(session.url);
