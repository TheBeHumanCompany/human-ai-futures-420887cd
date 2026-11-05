import type { SanityEpisode } from "./episode";

/**
 * The external links shown under "Explore more" on an episode page.
 *
 * Lives here rather than in the route file so the labelling rules can be tested
 * directly — route modules cannot be imported by the test runner.
 */

export interface GuestLink {
  label: string;
  href: string;
}

/**
 * Some guest names arrive with a role appended ("Name, Founder | Speaker").
 * Split at the first comma so the name and the role render separately.
 */
export function splitGuest(raw: string | null): { name: string | null; role: string | null } {
  if (!raw) return { name: null, role: null };
  const i = raw.indexOf(",");
  if (i === -1) return { name: raw, role: null };
  return { name: raw.slice(0, i).trim(), role: raw.slice(i + 1).trim() || null };
}

/**
 * The network an address actually belongs to, read off the address itself.
 *
 * The Studio fields are named after the network they were created for, but the
 * link a guest actually wants shown is not always on that network — an address
 * typed into the "Instagram" field may be a TikTok profile. Naming the link
 * after the address rather than the field keeps the label true whatever is
 * pasted in, with no per-episode exception to remember.
 */
const PLATFORMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/instagram\.com/i, "Instagram"],
  [/(?:^|\.)tiktok\.com/i, "TikTok"],
  [/linkedin\.com/i, "LinkedIn"],
  [/facebook\.com|fb\.com/i, "Facebook"],
  [/youtube\.com|youtu\.be/i, "YouTube"],
  [/(?:^|\.)x\.com|(?:^|\.)twitter\.com/i, "X"],
];

export function platformOf(url: string): string | null {
  for (const [pattern, name] of PLATFORMS) {
    if (pattern.test(url)) return name;
  }
  return null;
}

/**
 * Two addresses that point at the same account.
 *
 * Compared on host and path with `www.` and a trailing slash ignored, so
 * `https://www.instagram.com/shopilovechamoy/` and
 * `https://instagram.com/shopilovechamoy` are recognised as one account.
 */
function accountKey(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * The account name at the end of an address: `instagram.com/shopilovechamoy`
 * and `tiktok.com/@shopilovechamoy` both reduce to `shopilovechamoy`.
 *
 * Handles are how a brand shows up on more than one network, so this is what
 * reveals a "personal" field that is really the company's account on a second
 * network rather than the guest's own profile.
 */
function handleOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    if (!last) return null;
    // Underscores and dots are decoration, not identity: a brand's handle is
    // often `skipperotto` on one network and `skipper_otto` on another.
    return decodeURIComponent(last).replace(/^@/, "").replace(/[._]/g, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The handle as it actually appears on the network — `instagram.com/vetmedspharmacy`
 * gives `vetmedspharmacy`. Unlike `handleOf` (a matching key with underscores
 * and dots stripped), this keeps the account's real spelling for display.
 */
function displayHandleOf(url: string): string | null {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last).replace(/^@/, "") : null;
  } catch {
    return null;
  }
}

/**
 * The site an address belongs to, minus `www.` — `vetmeds.ca`. The honest
 * fallback name for a destination nobody has named: better to show the domain
 * itself than to invent a brand name or guess at a capitalization.
 */
function siteNameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

/** "@handle on Platform" — the fallback when no verified name owns the account. */
function handleLabel(url: string, platform: string): string {
  const handle = displayHandleOf(url);
  return handle ? `@${handle} on ${platform}` : platform;
}

/**
 * The external links for an episode, built from its optional Sanity fields.
 * A field with no value produces no link — no placeholder, no empty line —
 * and an episode with none populated produces an empty list, which the caller
 * renders as nothing at all.
 *
 * The labelling priority, per destination:
 *
 *   1. A custom link's label is shown exactly as authored in Studio.
 *   2. A book shows its display label, else "Explore [title]".
 *   3. A link is named after the network its address is actually on, so a
 *      TikTok profile sitting in the "Instagram" field reads "… on TikTok",
 *      and a plain website in a social field reads "Visit [domain]".
 *   4. A company-owned account is named after the company when one is on
 *      file (Sanity `companyName` first, the on-file profile as fallback).
 *   5. Otherwise the account's own handle or the site's domain names it —
 *      never a generic "Company Instagram", never an invented name.
 *
 * Two more rules keep the list honest:
 *
 *   - A personal field holding the same account as a company field is not a
 *     personal account. It is dropped, and the company label covers it —
 *     otherwise the same profile is listed twice under two different names.
 *   - A personal field carrying the company's handle on a different network
 *     (the brand's TikTok next to the brand's Instagram) is the company's
 *     too, so it is named after the company rather than the guest.
 */
export function guestLinks(
  episode: SanityEpisode,
  businessName: string | undefined,
): GuestLink[] {
  // Personal links use the guest's first name only — never a role or title.
  const first = splitGuest(episode.guestName).name?.trim().split(/\s+/)[0];

  // Accounts claimed by a company field: a personal field repeating one of
  // these is not personal, so its link is dropped or renamed.
  const companyUrls = [
    episode.companyInstagramUrl,
    episode.companyLinkedinUrl,
    episode.facebookUrl,
  ].filter((url): url is string => Boolean(url));
  const companyAccounts = new Set(companyUrls.map(accountKey));
  const companyHandles = new Set(
    companyUrls.map(handleOf).filter((handle): handle is string => Boolean(handle)),
  );

  const companyLabel = (url: string, platform: string) =>
    businessName ? `${businessName} on ${platform}` : handleLabel(url, platform);

  // A personal field is personal only when it is neither the same account as a
  // company field nor the company's handle on another network.
  const personalLabel = (url: string, platform: string) => {
    const handle = handleOf(url);
    if (handle !== null && companyHandles.has(handle)) return companyLabel(url, platform);
    return first ? `${first} on ${platform}` : handleLabel(url, platform);
  };

  // The Facebook field is company-ish, but only named after the company when
  // its account actually belongs to it — a second business's profile pasted
  // here (a VetMeds Instagram next to Pace Pharmacy's) keeps its own name.
  // Ownership is judged against the DECLARED company fields only: the Facebook
  // field's own handle cannot be evidence for itself. When no other company
  // account exists to contradict it, the Facebook field is the company's.
  const declaredCompanyHandles = new Set(
    [episode.companyInstagramUrl, episode.companyLinkedinUrl]
      .filter((url): url is string => Boolean(url))
      .map(handleOf)
      .filter((handle): handle is string => Boolean(handle)),
  );
  const facebookLabel = (url: string, platform: string) => {
    const handle = handleOf(url);
    const belongsToCompany =
      declaredCompanyHandles.size === 0 ||
      (handle !== null && declaredCompanyHandles.has(handle));
    return businessName && belongsToCompany
      ? `${businessName} on ${platform}`
      : handleLabel(url, platform);
  };

  const links: GuestLink[] = [];
  const seen = new Set<string>();
  const push = (label: string, href: string) => {
    const key = accountKey(href);
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ label, href });
  };

  // A social field holding a plain website is a website link, not a profile.
  const socialOrSite = (url: string, labelFor: (url: string, platform: string) => string) => {
    const platform = platformOf(url);
    if (platform) push(labelFor(url, platform), url);
    else push(`Visit ${siteNameOf(url)}`, url);
  };

  if (episode.businessWebsiteUrl) {
    push(
      businessName ? `Visit ${businessName}` : `Visit ${siteNameOf(episode.businessWebsiteUrl)}`,
      episode.businessWebsiteUrl,
    );
  }

  if (episode.guestInstagramUrl && !companyAccounts.has(accountKey(episode.guestInstagramUrl))) {
    socialOrSite(episode.guestInstagramUrl, personalLabel);
  }

  if (episode.companyInstagramUrl) {
    socialOrSite(episode.companyInstagramUrl, companyLabel);
  }

  if (episode.facebookUrl) {
    socialOrSite(episode.facebookUrl, facebookLabel);
  }

  if (episode.guestLinkedinUrl && !companyAccounts.has(accountKey(episode.guestLinkedinUrl))) {
    socialOrSite(episode.guestLinkedinUrl, personalLabel);
  }

  if (episode.companyLinkedinUrl) {
    socialOrSite(episode.companyLinkedinUrl, companyLabel);
  }

  for (const book of episode.books ?? []) {
    if (!book?.url || !book.title) continue;
    push(book.displayLabel?.trim() || `Explore ${book.title}`, book.url);
  }

  for (const link of episode.customLinks ?? []) {
    if (!link?.url || !link.label) continue;
    push(link.label, link.url);
  }

  return links;
}
