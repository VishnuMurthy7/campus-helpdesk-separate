import { describe, expect, it } from "vitest";

describe("CampAssist application title", () => {
  it("serves the configured CampAssist browser title from the local application endpoint", async () => {
    const response = await fetch("http://127.0.0.1:3000/");

    expect(response.ok).toBe(true);
    await expect(response.text()).resolves.toContain("<title>CampAssist</title>");
  });
});
