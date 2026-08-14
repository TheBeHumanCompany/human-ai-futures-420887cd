/**
 * The company's social presence — one list, two consumers.
 *
 * Before this module there were two lists that disagreed with each other:
 * `site-footer.tsx` carried six platform names as bare strings, and
 * `social-section.tsx` carried seven entries with icon components. One listed
 * Spotify, the other listed Facebook and Snapchat. Neither had a working link.
 * Anything edited in one place silently drifted from the other, which is how
 * they got into that state.
 *
 * This module owns **name and URL only**. The SVG icon components stay in
 * `social-section.tsx`, which joins them to this list by name — the footer
 * renders text links and has no reason to pull the icon set into its bundle.
 */

export interface SocialLink {
  /** Display name, and the key `social-section.tsx` joins its icon on. */
  name: string;
  /** Profile URL, or `null` while the handle is still unconfirmed. */
  href: string | null;
}

/**
 * TODO: fill in the URLs, and settle the platform set while you are here.
 *
 * The two prior lists disagreed about Facebook, Spotify, and Snapchat. Every
 * platform the company actually posts to should be listed with a URL; anything
 * it does not should be **deleted from this array** rather than left `null`, so
 * `null` unambiguously means "URL pending" and never "we might not use this".
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { name: "YouTube", href: null },
  { name: "LinkedIn", href: null },
  { name: "Instagram", href: null },
  { name: "TikTok", href: null },
  { name: "Facebook", href: null },
  { name: "Snapchat", href: null },
  { name: "X", href: null },
] as const;

/**
 * Placeholder target for a platform whose URL has not been supplied yet.
 *
 * **This is a known, deliberate exception, not an oversight.** The spec (AC-55)
 * says no `href="#"` should remain, and the preferred behaviour is to omit an
 * entry with no URL rather than render a dead one. Applied literally today that
 * would empty the homepage's "Follow the journey" section and the footer's
 * Follow column entirely, because none of the seven URLs are known yet —
 * trading a dead link for a missing section.
 *
 * The call was made to keep the icons visible until the real URLs arrive, so
 * nothing visibly regresses in the meantime. AC-55 is therefore **outstanding,
 * not satisfied**, and stays on the open-items list until `SOCIAL_LINKS` is
 * filled in. When it is, delete this constant and switch both consumers to
 * `activeSocialLinks()`, which is already written and already omits the rest.
 */
export const PLACEHOLDER_HREF = "#";

/** A social link whose URL is known, and is therefore safe to render. */
export type ActiveSocialLink = SocialLink & { href: string };

/**
 * The subset with real URLs — the destination behaviour, per AC-55.
 *
 * Switch both consumers to this the moment `SOCIAL_LINKS` carries real URLs. An
 * entry still pending then costs a missing icon rather than a dead link.
 */
export function activeSocialLinks(links: readonly SocialLink[] = SOCIAL_LINKS): ActiveSocialLink[] {
  return links.filter((link): link is ActiveSocialLink => Boolean(link.href));
}

/**
 * Every platform, with pending entries falling back to {@link PLACEHOLDER_HREF}.
 *
 * The interim accessor described above. It exists as a named function rather
 * than an inline `?? "#"` at two call sites so that the exception is greppable
 * and has exactly one place to delete.
 */
export function displaySocialLinks(
  links: readonly SocialLink[] = SOCIAL_LINKS,
): ActiveSocialLink[] {
  return links.map((link) => ({ ...link, href: link.href ?? PLACEHOLDER_HREF }));
}
