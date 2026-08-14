/**
 * Outbound destinations that are not yet provisioned.
 *
 * Both values below are placeholders. They exist as named constants so the pages
 * that reference them can be built, reviewed, and shipped before the accounts
 * exist — swapping in the real URLs is a one-line edit here and nowhere else.
 *
 * REPLACE BOTH BEFORE THE SALES PAGES GO LIVE.
 */

/**
 * Destination for every "Book Your Blueprint" call to action.
 *
 * The offer is a *booking*, not an enquiry: the source copy says "Book Your
 * Blueprint" and step 1 of the process is a discovery conversation. So this
 * should point at a real scheduler (Cal.com, Calendly, SavvyCal) landing
 * directly on the discovery call, not at a contact form.
 *
 * TODO: replace with the real scheduler link.
 */
export const BOOKING_URL = "https://cal.com/TODO/blueprint-discovery";

/**
 * Where the general contact form POSTs.
 *
 * ASSUMPTION, AND IT CONSTRAINS THE CHOICE OF SERVICE. `submitLead` runs in the
 * browser, so this constant ships inside the client bundle and is readable by
 * anyone. That is fine for a public form-service endpoint of the Formspree /
 * Tally / Basin shape, which is what this is written against.
 *
 * If the service you pick instead needs an API key, a signed request, or a
 * private webhook URL, then this constant is the wrong home for it: move
 * `submitLead` behind a TanStack Start server function and keep the secret in
 * the server environment. Decide that when the endpoint is chosen — retrofitting
 * it after the form is live means a leaked credential, not a refactor.
 *
 * TODO: replace with the real form endpoint.
 */
export const FORM_ENDPOINT = "https://formspree.io/f/TODO";
