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
      <path d="M12 1 13.4 4.3 16.3 3.2 15.4 7 18.6 6.4 17.9 8.7 22 12 21.1 13 21.8 15.5 17.2 14.6 16.6 15.9 13.1 15.2 13.8 21.5 12 20.8 10.2 21.5 10.9 15.2 7.4 15.9 6.8 14.6 2.2 15.5 2.9 13 2 12 6.1 8.7 5.4 6.4 8.6 7 7.7 3.2 10.6 4.3 Z" />
    </svg>
  );
}
