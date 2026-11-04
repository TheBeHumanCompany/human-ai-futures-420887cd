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
 * The external links for an episode, built from its optional Sanity URL
 * fields. A field with no value produces no link — no placeholder, no empty
 * line — and an episode with none populated produces an empty list, which the
 * caller renders as nothing at all. Personal and company accounts are
 * independent: both, either, or neither may appear.
 *
 * Three rules keep the labels honest:
 *
 *   1. A link is named after the network its address is on, so a TikTok
 *      profile sitting in the "Instagram" field reads "… on TikTok".
 *   2. A personal field holding the same account as the company field is not
 *      a personal account. It is dropped, and the company label covers it —
 *      otherwise the same profile is listed twice under two different names.
 *   3. A personal field carrying the company's handle on a different network
 *      (the brand's TikTok next to the brand's Instagram) is the company's
 *      too, so it is named after the company rather than the guest.
 */
export function guestLinks(
  episode: SanityEpisode,
  businessName: string | undefined,
): GuestLink[] {
  // Personal links use the guest's first name only — never a role or title.
  const first = splitGuest(episode.guestName).name?.trim().split(/\s+/)[0];
  const bothInstagram = Boolean(episode.guestInstagramUrl && episode.companyInstagramUrl);
  const bothLinkedIn = Boolean(episode.guestLinkedinUrl && episode.companyLinkedinUrl);

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

  const companyLabel = (platform: string, both: boolean) =>
    businessName ? `${businessName} on ${platform}` : both ? `Company ${platform}` : platform;

  // A personal field is personal only when it is neither the same account as a
  // company field nor the company's handle on another network.
  const personalLabel = (url: string, platform: string, both: boolean) => {
    const handle = handleOf(url);
    const isCompanyAccount = handle !== null && companyHandles.has(handle);
    return isCompanyAccount
      ? companyLabel(platform, both)
      : `${first} on ${platform}`;
  };

  const links: GuestLink[] = [];

  if (episode.businessWebsiteUrl) {
    links.push({
      label: businessName ? `Visit ${businessName}` : "Visit the website",
      href: episode.businessWebsiteUrl,
    });
  }

  if (episode.guestInstagramUrl && first && !companyAccounts.has(accountKey(episode.guestInstagramUrl))) {
    const platform = platformOf(episode.guestInstagramUrl) ?? "Instagram";
    links.push({
      label: personalLabel(episode.guestInstagramUrl, platform, bothInstagram),
      href: episode.guestInstagramUrl,
    });
  }

  if (episode.companyInstagramUrl) {
    const platform = platformOf(episode.companyInstagramUrl) ?? "Instagram";
    links.push({
      label: companyLabel(platform, bothInstagram),
      href: episode.companyInstagramUrl,
    });
  }

  if (episode.facebookUrl) {
    links.push({ label: "Facebook", href: episode.facebookUrl });
  }

  if (episode.guestLinkedinUrl && first && !companyAccounts.has(accountKey(episode.guestLinkedinUrl))) {
    const platform = platformOf(episode.guestLinkedinUrl) ?? "LinkedIn";
    links.push({
      label: personalLabel(episode.guestLinkedinUrl, platform, bothLinkedIn),
      href: episode.guestLinkedinUrl,
    });
  }

  if (episode.companyLinkedinUrl) {
    const platform = platformOf(episode.companyLinkedinUrl) ?? "LinkedIn";
    links.push({
      label: companyLabel(platform, bothLinkedIn),
      href: episode.companyLinkedinUrl,
    });
  }

  return links;
}
