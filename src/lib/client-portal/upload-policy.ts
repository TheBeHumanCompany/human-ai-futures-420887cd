/**
 * What a client may upload, and under what name it is stored.
 *
 * The audit needs documents, so documents are what this accepts. The list is an
 * ALLOWLIST rather than a denylist of dangerous types: a denylist is a promise
 * to have thought of everything, and the cost of being wrong here is a file the
 * portal will later hand back to a browser.
 *
 * HTML and SVG are absent deliberately, not by oversight. Both are executable in
 * a browser context, and a stored SVG served from our own origin is stored XSS
 * on the domain that also runs the Clerk session — the exact class of defect the
 * structured blueprint renderer exists to remove. Archives are absent because
 * their contents cannot be judged without unpacking untrusted input.
 *
 * Extension AND declared type must both be allowed, and they must agree. A
 * browser's declared `type` is attacker-controlled and so is the filename, so
 * neither is trusted alone; requiring agreement costs an honest user nothing and
 * removes the `invoice.pdf` that announces itself as `text/html`.
 *
 * None of this makes a stored file safe to execute. It narrows what arrives; the
 * download path still serves every object off-origin as an attachment.
 */

/** Per-file ceiling. Large enough for a scanned contract, small enough to bound abuse. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Extension → the content types we will accept for it. */
const ALLOWED: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  csv: ["text/csv", "application/csv"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED);

/** The `accept` attribute for the file input, derived so it cannot drift. */
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export type UploadRejection =
  | "empty"
  | "too-large"
  | "no-extension"
  | "type-not-allowed"
  | "type-mismatch"
  | "name-too-long";

export type UploadVerdict =
  | { ok: true; extension: string; storedName: string }
  | { ok: false; reason: UploadRejection };

const MAX_NAME_LENGTH = 200;

export const extensionOf = (filename: string): string | null => {
  const base = filename.slice(filename.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return null;
  return base.slice(dot + 1).toLowerCase();
};

/**
 * A storage key that cannot escape its prefix or collide.
 *
 * The client's filename is never used as a path. It is reduced to safe
 * characters for legibility in the bucket, then prefixed with a random id, so a
 * name like `../../secrets` or two files called `scan.pdf` are both non-events.
 * The original name is kept in the database column, not in the key.
 */
export const storageKeyFor = (clientId: string, filename: string, id: string): string => {
  const extension = extensionOf(filename) ?? "bin";
  const stem = filename
    .slice(0, filename.lastIndexOf(".") === -1 ? undefined : filename.lastIndexOf("."))
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 60);
  return `${clientId}/${id}-${stem || "file"}.${extension}`;
};

export const judgeUpload = (file: { name: string; size: number; type: string }): UploadVerdict => {
  if (file.size <= 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "too-large" };
  if (file.name.length > MAX_NAME_LENGTH) return { ok: false, reason: "name-too-long" };

  const extension = extensionOf(file.name);
  if (!extension) return { ok: false, reason: "no-extension" };

  const permitted = ALLOWED[extension];
  if (!permitted) return { ok: false, reason: "type-not-allowed" };

  // An empty declared type is accepted: some browsers send none for less common
  // office formats, and the extension is already on the allowlist. A type that
  // is present and disagrees is refused.
  const declared = file.type.split(";")[0]!.trim().toLowerCase();
  if (declared.length > 0 && !permitted.includes(declared)) {
    return { ok: false, reason: "type-mismatch" };
  }

  return { ok: true, extension, storedName: file.name };
};

export const explain = (reason: UploadRejection): string => {
  switch (reason) {
    case "empty":
      return "That file is empty.";
    case "too-large":
      return `Files must be ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB or smaller.`;
    case "no-extension":
      return "That file has no extension, so we cannot tell what it is.";
    case "name-too-long":
      return "That filename is too long.";
    case "type-not-allowed":
    case "type-mismatch":
      return `We accept documents and images: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
};
