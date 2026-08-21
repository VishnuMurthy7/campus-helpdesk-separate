import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("administrator reset-email credentials", () => {
  it("accepts the configured Resend API credential and sender configuration", async () => {
    expect(ENV.resendApiKey).toBeTruthy();
    expect(ENV.resendFromEmail).toBeTruthy();
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${ENV.resendApiKey}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15_000);
});
