# Roadmap

## Open

- **Episode summary (Any a & Niki).** The page already shows Sanity's current
  text word for word, so it needs Maya's new wording (or the field she wrote it
  in) before it can change.
- **Business names on other episodes.** Only Mint Cleaning (6) and I Love
  Chamoy (71) have one on file, so other episodes' links read "Company
  Instagram" / "LinkedIn" instead of naming the business. Waiting on Maya for
  the rest.

## Done

- Annie Leal's episode now reads "I Love Chamoy on TikTok" for
  `tiktok.com/@shopilovechamoy`, which she pasted into the Studio field herself.
- Link labels on every episode page name the network the address is on
  (`src/lib/podcast/guest-links.ts`): a TikTok address reads "… on TikTok" even
  if it was typed into the Instagram field.
- A personal field holding the company's account — same profile, or the
  company's handle on another network — is named after the company, not the
  guest, and never listed twice.
- Guest bio shows on the Anya & Niki episode page even with no guest name set.
