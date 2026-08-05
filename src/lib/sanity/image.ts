import { SANITY_DATASET, SANITY_IMAGE_HOST, SANITY_PROJECT_ID } from "./config";

/**
 * Sanity image reference → CDN URL.
 *
 * A Sanity image asset `_ref` encodes everything needed to build the URL:
 * `image-<assetId>-<width>x<height>-<format>`. Hand-rolled for the same reason
 * as the query transport — this reaches the deployed bundle, and it is a string
 * split.
 *
 * Returns `null` rather than a broken URL for anything malformed. A missing
 * image should render nothing; a 404'd `og:image` is worse than no `og:image`,
 * because a share card with a broken image looks like a broken site.
 */

export interface ImageTransform {
  width?: number;
  height?: number;
  /** Sanity's crop behaviour. `crop` respects the hotspot set in Studio. */
  fit?: "crop" | "clip" | "fill" | "max" | "min" | "scale";
  quality?: number;
}

const REF_PATTERN = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/;

export interface SanityImageLike {
  asset?: { _ref?: string } | null;
}

/** Extracts the `_ref` from an image field, tolerating an empty wrapper. */
export function imageRef(image: SanityImageLike | null | undefined): string | null {
  // Studio can leave the image object present with no asset attached, which is
  // exactly why enrichment is tested on `asset._ref` rather than on the field.
  return image?.asset?._ref ?? null;
}

export function imageUrl(
  image: SanityImageLike | string | null | undefined,
  transform: ImageTransform = {},
): string | null {
  const ref = typeof image === "string" ? image : imageRef(image);
  if (!ref) return null;

  const match = REF_PATTERN.exec(ref);
  if (!match) return null;

  const [, assetId, dimensions, format] = match;
  const url = new URL(
    `${SANITY_IMAGE_HOST}/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}-${dimensions}.${format}`,
  );

  if (transform.width) url.searchParams.set("w", String(transform.width));
  if (transform.height) url.searchParams.set("h", String(transform.height));
  if (transform.fit) url.searchParams.set("fit", transform.fit);
  if (transform.quality) url.searchParams.set("q", String(transform.quality));
  // Serves webp/avif to browsers that accept them, jpeg to those that don't.
  url.searchParams.set("auto", "format");

  return url.toString();
}

/**
 * The Open Graph variant: 1200×630, hotspot-aware, absolute.
 *
 * LinkedIn is the whole reason this project exists, and it wants a 1.91:1 card.
 */
export function ogImageUrl(image: SanityImageLike | string | null | undefined): string | null {
  return imageUrl(image, { width: 1200, height: 630, fit: "crop" });
}
