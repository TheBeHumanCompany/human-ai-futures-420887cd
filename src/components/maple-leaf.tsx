/**
 * The maple leaf that sits beside the Indigenous line.
 *
 * Inline rather than an image file for two reasons. It has to inherit
 * `currentColor` — it renders on the ink footer and on the Blueprint hero,
 * which are different grounds — and AC-2.8b measures the DOM distance between
 * this node and the `INDIGENOUS_LINE` text node, which needs both to be real
 * nodes in the same subtree rather than one being a background image.
 *
 * `data-glyph="maple-leaf"` is the hook the gates locate it by; the class list
 * is styling and may change, so it is not what the proof reads. The `<title>`
 * is what makes it announceable — it is decorative beside the line it marks,
 * but the line is a statement about who this company is, and a screen reader
 * that reports the words without the flag reports less than the page says.
 */
export function MapleLeaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Maple leaf"
      data-glyph="maple-leaf"
      className={className}
      fill="currentColor"
    >
      <title>Maple leaf</title>
      <path d="M12 0.5 13.3 4.2 16.2 3 14 9 19.4 5.6 19.2 8.6 23.6 10.6 21.6 12 23 15.6 15.6 14 17.6 19.6 12.8 16.4 12.5 23.5 11.2 16.4 6.4 19.6 8.4 14 1 15.6 2.4 12 0.4 10.6 4.8 8.6 4.6 5.6 10 9 7.8 3 10.7 4.2 12 0.5 Z" />
    </svg>
  );
}
