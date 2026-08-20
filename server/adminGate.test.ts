import { describe, expect, it } from "vitest";
import { ADMIN_GATE_COOKIE, createAdminGateToken, getCookieValue, isAdminGateTokenValid, isAdminPasswordValid } from "./adminGate";

describe("private administrator gate", () => {
  it("validates the private password with a non-leaking comparison", () => {
    expect(isAdminPasswordValid("private-pass", "private-pass")).toBe(true);
    expect(isAdminPasswordValid("incorrect", "private-pass")).toBe(false);
  });

  it("creates a user-bound, expiring verification token", () => {
    const now = 1_700_000_000_000;
    const token = createAdminGateToken(7, "session-secret", now);
    expect(isAdminGateTokenValid(token, 7, "session-secret", now + 1)).toBe(true);
    expect(isAdminGateTokenValid(token, 8, "session-secret", now + 1)).toBe(false);
    expect(isAdminGateTokenValid(token, 7, "session-secret", now + 1000 * 60 * 60 * 9)).toBe(false);
  });

  it("reads the private verification token from request cookies", () => {
    expect(getCookieValue(`theme=light; ${ADMIN_GATE_COOKIE}=verified-token; analytics=yes`, ADMIN_GATE_COOKIE)).toBe("verified-token");
  });
});
