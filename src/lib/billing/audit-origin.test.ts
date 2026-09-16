import { describe, expect, test } from "bun:test";

import { auditCancelUrl, auditSuccessUrl } from "./audit-checkout";

describe("audit checkout origin", () => {
  test("keeps the production portal host when AUDIT_ORIGIN is unset", () => {
    const saved = process.env.AUDIT_ORIGIN;
    delete process.env.AUDIT_ORIGIN;
    try {
      expect(auditSuccessUrl()).toBe(
        "https://portal.thebehumancompany.ca/audit/success?session_id={CHECKOUT_SESSION_ID}",
      );
      expect(auditCancelUrl()).toBe("https://portal.thebehumancompany.ca/audit/cancelled");
    } finally {
      if (saved === undefined) delete process.env.AUDIT_ORIGIN;
      else process.env.AUDIT_ORIGIN = saved;
    }
  });

  test("uses an explicit AUDIT_ORIGIN override for funnel return URLs", () => {
    const saved = process.env.AUDIT_ORIGIN;
    process.env.AUDIT_ORIGIN = "http://portal.localhost:5180";
    try {
      expect(auditSuccessUrl()).toBe(
        "http://portal.localhost:5180/audit/success?session_id={CHECKOUT_SESSION_ID}",
      );
    } finally {
      if (saved === undefined) delete process.env.AUDIT_ORIGIN;
      else process.env.AUDIT_ORIGIN = saved;
    }
  });
});
