import { describe, expect, test } from "bun:test";

import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  extensionOf,
  judgeUpload,
  storageKeyFor,
} from "./upload-policy";

const file = (name: string, type = "application/pdf", size = 1024) => ({
  name,
  type,
  size,
});

describe("the allowlist", () => {
  test("accepts the document formats an audit actually receives", () => {
    for (const [name, type] of [
      ["contract.pdf", "application/pdf"],
      ["notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["model.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      ["export.csv", "text/csv"],
      ["scan.png", "image/png"],
    ] as const) {
      expect(judgeUpload(file(name, type)).ok).toBe(true);
    }
  });

  test("refuses the formats that execute in a browser", () => {
    // These are the reason the policy is an allowlist: a stored SVG or HTML
    // served back from our own origin is stored XSS on the Clerk session's domain.
    expect(judgeUpload(file("payload.svg", "image/svg+xml")).ok).toBe(false);
    expect(judgeUpload(file("payload.html", "text/html")).ok).toBe(false);
    expect(judgeUpload(file("payload.htm", "text/html")).ok).toBe(false);
  });

  test("refuses archives and executables", () => {
    expect(judgeUpload(file("bundle.zip", "application/zip")).ok).toBe(false);
    expect(judgeUpload(file("tool.exe", "application/octet-stream")).ok).toBe(false);
    expect(judgeUpload(file("script.js", "text/javascript")).ok).toBe(false);
  });

  test("an allowed extension with a disagreeing type is refused", () => {
    // `invoice.pdf` announcing itself as text/html.
    const verdict = judgeUpload(file("invoice.pdf", "text/html"));
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toBe("type-mismatch");
  });

  test("an empty declared type is tolerated — some browsers send none for office formats", () => {
    expect(judgeUpload(file("deck.pptx", "")).ok).toBe(true);
  });

  test("parameters on the content type do not defeat the match", () => {
    expect(judgeUpload(file("notes.csv", "text/csv; charset=utf-8")).ok).toBe(true);
  });
});

describe("size and shape", () => {
  test("an empty file is refused", () => {
    const verdict = judgeUpload(file("empty.pdf", "application/pdf", 0));
    expect(verdict.ok === false && verdict.reason).toBe("empty");
  });

  test("the ceiling is enforced at the boundary", () => {
    expect(judgeUpload(file("big.pdf", "application/pdf", MAX_UPLOAD_BYTES)).ok).toBe(true);
    expect(judgeUpload(file("big.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1)).ok).toBe(false);
  });

  test("a file with no extension is refused rather than sniffed", () => {
    const verdict = judgeUpload(file("README", "text/plain"));
    expect(verdict.ok === false && verdict.reason).toBe("no-extension");
  });

  test("an absurd filename is refused", () => {
    expect(judgeUpload(file("a".repeat(300) + ".pdf")).ok).toBe(false);
  });
});

describe("extensionOf", () => {
  test("takes the last extension, lowercased", () => {
    expect(extensionOf("Report.FINAL.PDF")).toBe("pdf");
  });

  test("a dotfile has no extension", () => {
    expect(extensionOf(".env")).toBeNull();
    expect(extensionOf("trailing.")).toBeNull();
    expect(extensionOf("none")).toBeNull();
  });
});

describe("storageKeyFor", () => {
  test("a hostile filename cannot escape the client's prefix", () => {
    const key = storageKeyFor("voes-and-co", "../../../etc/passwd.pdf", "abc123");
    expect(key.startsWith("voes-and-co/")).toBe(true);
    expect(key).not.toContain("..");
    // One separator after the client id, and no deeper nesting.
    expect(key.split("/")).toHaveLength(2);
  });

  test("two files with the same name do not collide", () => {
    const a = storageKeyFor("c", "scan.pdf", "id-one");
    const b = storageKeyFor("c", "scan.pdf", "id-two");
    expect(a).not.toBe(b);
  });

  test("the extension survives so the object is servable with the right type", () => {
    expect(storageKeyFor("c", "deck.pptx", "x").endsWith(".pptx")).toBe(true);
  });

  test("a name made entirely of unsafe characters still yields a usable key", () => {
    const key = storageKeyFor("c", "€€€.pdf", "x");
    expect(key).toBe("c/x-file.pdf");
  });
});

describe("the input contract stays in sync with the policy", () => {
  test("the accept attribute is derived from the allowlist, so it cannot drift", () => {
    for (const ext of ALLOWED_EXTENSIONS) {
      expect(ACCEPT_ATTRIBUTE).toContain(`.${ext}`);
    }
  });
});
