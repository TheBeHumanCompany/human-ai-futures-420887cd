import { imageUrl } from "@/lib/sanity/image";

interface GuestAvatarProps {
  guestPhoto: string | null;
  guestName: string | null;
  className?: string;
}

/**
 * The guest's portrait, or nothing at all.
 *
 * Deliberately returns `null` rather than a silhouette placeholder when there
 * is no photo. Every one of the thirty-nine episodes is in that state today, so
 * a placeholder would not be a graceful edge case — it would be the entire
 * archive rendering an identical grey figure, which reads as broken rather than
 * as sparse. The page's layout drops to a single column instead, which reads as
 * a design.
 *
 * The `alt` names the guest when known. An avatar with no name behind it is
 * decorative, so it takes an empty `alt` rather than inventing a description a
 * screen reader would have to sit through.
 */
export function GuestAvatar({ guestPhoto, guestName, className }: GuestAvatarProps) {
  const src = imageUrl(guestPhoto, { width: 320, height: 320, fit: "crop" });
  if (!src) return null;

  return (
    <img
      className={className}
      src={src}
      alt={guestName ? `Portrait of ${guestName}` : ""}
      width={320}
      height={320}
      loading="lazy"
      decoding="async"
    />
  );
}
