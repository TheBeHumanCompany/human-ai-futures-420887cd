/**
 * The client's own "Save as PDF" (US-006), which is the browser's.
 *
 * `window.print()` plus the `@media print` block in `src/styles.css` produces
 * the same document `bun run blueprint:export --pdf` produces, because both
 * print the same components through the same stylesheet. A server-side PDF for
 * a client-facing download is deliberately not built: the app deploys to
 * Nitro/Cloudflare, where Chromium does not exist, and the operator script
 * already covers the emailed-PDF case.
 *
 * `data-print="hide"` keeps the control out of its own output.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      data-print="hide"
      data-testid="blueprint-print"
      onClick={() => window.print()}
      className="eyebrow link-underline cursor-pointer border border-current/30 px-4 py-2 text-current/70 transition-colors hover:text-current"
    >
      Save as PDF
    </button>
  );
}
