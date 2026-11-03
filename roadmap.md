# Roadmap

## Open

- **Annie Leal episode — TikTok link.** The address stored in Annie's episode is
  the company's Instagram (`instagram.com/shopilovechamoy`), not TikTok. The
  page now lists it once as "Company Instagram". Waiting on Maya for the actual
  TikTok address (or for her to paste it into the same Studio field); the label
  will then read "Company TikTok" on its own.
- **Episode summary (Anya & Niki).** The page already shows Sanity's current
  text word for word, so it needs Maya's new wording (or the field she wrote it
  in) before it can change.

## Done

- Link labels on every episode page now name the network the address is on
  (`src/lib/podcast/guest-links.ts`): a TikTok address reads "… on TikTok"
  even if it was typed into the Instagram field.
- A personal field holding the same account as the company field no longer
  produces a duplicate link — the company label covers it.
- Guest bio shows on the Anya & Niki episode page even with no guest name set.
