# Roadmap

## Open
- New episode summary wording for Anya & Niki — the page already mirrors Sanity word for word; waiting on Maya's new text (or the field she wrote it in).
- Studio redeploy: Maya runs `npm run deploy` in `studio/` so the new `companyName`, `books` and `customLinks` fields appear in the hosted episode editor.

## Found in headline-width audit — reported, not changed (Maya's scope limit)
- `/be-human-ai` "Canadian trust / Human accountability": heading box is 199px wide but its text needs 314px, so the last word is cut off. Real overflow, not just wrapping.
- `/next-generation-ceo` "Why $3,500, and why only eight": 4 lines at 72px in a 352px column, with "WHY" and "$3,500," each alone on a line.
- `/next-generation-ceo` "Does any of this sound familiar?": 3 lines, "FAMILIAR?" orphaned.
- `/next-generation-ceo` "Three live calls every week, and a direct line to me": 4 lines, "ME" orphaned.
- `/next-generation-ceo` "We don't start with AI. We start with your business": breaks mid-sentence instead of between the two sentences.
- Judged fine, left alone: "Where this fits" (2 lines), "Technology will keep advancing. Humanity has to advance with it." (deliberate stanzas), all `/about-the-founder` chapter headings (2 lines each).

## Done
- Closing-section enrollment note: simplified to two plain lines of body text — "Enrollment closes Friday, December 11, or sooner when the eight seats fill." (medium weight, 18px desktop, date bold and lime) and "Your assessments start the day you join." (regular weight), 12px apart, aligned with the body paragraphs. The vertical lime line, oversized date and uppercase label were removed. Verified at 1440, 820 and 393.
- Closing headline: added the final period and verified 32px desktop / 24px mobile statement spacing at 1440px, 1920px and 393px; typography, line breaks and underline unchanged.
- Episode 78 (Poet Comeau): her Instagram link — already in the Guest Instagram field, pointing at the company account — is labelled "Lake City Cider on Instagram". Account-level names (`GuestProfile.linkNames`) let one page name two brands without relabelling Darty Brewing's links.
- Dynamic guest/company link labels: platform read from the URL itself, company links named after the business (Sanity `companyName` first, on-file profile as fallback), domain/handle fallbacks instead of generic "Company Instagram".
- Schema: added optional `companyName`, repeatable `books` (title, url, subtitle, displayLabel, coverImage) and `customLinks` (label, url) to the episode type; all projected into the episode query.
- Books render as "Explore [title]" links (display label overrides); custom links show their authored label; duplicate destinations are listed once.
- Episode 76 (Adam Silvertown): Pace Pharmacy named as the business; VetMeds links keep their own names.
