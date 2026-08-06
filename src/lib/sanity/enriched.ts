/**
 * The `isEnriched` predicate — GROQ, not a stored field.
 *
 * Deviation D1 (plan §"Deviations register"): AC-8 lists `isEnriched` as a
 * schema field, which literally reads as a *stored* boolean. This is
 * deliberately **derived** instead. A stored flag drifts the moment someone
 * adds a guest photo and forgets to flip the toggle, which breaks AC-28's
 * promise that enrichment happens "automatically" and silently reopens
 * AC-34's guarantee. Deriving it means there is nothing to drift: the value
 * is recomputed from the document's actual content on every read.
 *
 * The cost, stated in the deviations register: this one fragment has to stay
 * correct, so it is pinned by a truth table executed over this exact
 * exported string via `groq-js` (`enriched.test.ts`) rather than a
 * hand-written JavaScript mirror of what it "should" do.
 *
 * The predicate itself: `defined(guestPhoto.asset._ref) && length(guestBio) > 0`.
 *
 * - `defined(guestPhoto.asset._ref)` — true only once an image asset is
 *   actually attached. An empty `guestPhoto` wrapper with no `asset._ref`
 *   (the shape Studio leaves behind before an image is uploaded) must not
 *   count, so the check reaches through to the ref rather than stopping at
 *   `defined(guestPhoto)`.
 * - `length(guestBio) > 0` — correct, and cheap, *because* `guestBio` is a
 *   plain `text` field, not Portable Text (see projection-map.ts and
 *   Decision A's guestBio note). A Portable Text value is a block array, and
 *   `length()` on it would count blocks, not characters — a non-empty array
 *   of empty blocks would satisfy the predicate wrongly. As plain text,
 *   `length(guestBio)` is a character count, so `> 0` means "actually wrote
 *   something." `length(null) > 0` — a bio never authored, or authored then
 *   cleared to null — evaluates to `null`, which GROQ does not treat as
 *   truthy, so an absent bio correctly does not match.
 *
 * **Known and accepted, not a bug:** GROQ has no `trim()`, so a
 * whitespace-only bio (`"   "`) has `length > 0` and reads as enriched. The
 * practical guard against that is Studio-side: `Rule.required().min(20)` on
 * `guestBio`. `enriched.test.ts`'s truth table lists this row explicitly as
 * *documented enriched* so a future reader doesn't mistake it for a defect
 * and "fix" it by reaching for GROQ string trimming that doesn't exist.
 */
export const IS_ENRICHED_FRAGMENT = "defined(guestPhoto.asset._ref) && length(guestBio) > 0";
