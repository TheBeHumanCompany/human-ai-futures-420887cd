# Roadmap

## Open
- New episode summary wording for Anya & Niki — the page already mirrors Sanity word for word; waiting on Maya's new text (or the field she wrote it in).
- Studio redeploy: Maya runs `npm run deploy` in `studio/` so the new `companyName`, `books` and `customLinks` fields appear in the hosted episode editor.

## Done
- Episode 78 (Poet Comeau): her Instagram link — already in the Guest Instagram field, pointing at the company account — is labelled "Lake City Cider on Instagram". Account-level names (`GuestProfile.linkNames`) let one page name two brands without relabelling Darty Brewing's links.
- Dynamic guest/company link labels: platform read from the URL itself, company links named after the business (Sanity `companyName` first, on-file profile as fallback), domain/handle fallbacks instead of generic "Company Instagram".
- Schema: added optional `companyName`, repeatable `books` (title, url, subtitle, displayLabel, coverImage) and `customLinks` (label, url) to the episode type; all projected into the episode query.
- Books render as "Explore [title]" links (display label overrides); custom links show their authored label; duplicate destinations are listed once.
- Episode 76 (Adam Silvertown): Pace Pharmacy named as the business; VetMeds links keep their own names.
