import { describe, expect, it } from "vitest";
import { createResetToken, generateCollegeCode, hashPassword, verifyPassword } from "./adminAuth";

describe("administrator credentials", () => {
  it("generates unique-looking 10-character codes with uppercase, lowercase, and numeric characters", () => {
    const codes = Array.from({ length: 100 }, () => generateCollegeCode());
    expect(new Set(codes).size).toBe(100);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Za-z0-9]{10}$/);
      expect(code).toMatch(/[A-Z]/);
      expect(code).toMatch(/[a-z]/);
      expect(code).toMatch(/[0-9]/);
    }
  });

  it("creates high-entropy one-time reset tokens and verifies hashed credentials safely", async () => {
    const one = createResetToken(); const two = createResetToken();
    expect(one).not.toBe(two); expect(one.length).toBeGreaterThanOrEqual(40);
    const hash = await hashPassword("CampusAdmin7");
    await expect(verifyPassword("CampusAdmin7", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
