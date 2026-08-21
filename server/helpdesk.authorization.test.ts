import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    admin: null,
    req: { protocol: "https", headers: {}, get: () => "localhost" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Campus Helpdesk custom administrator access controls", () => {
  it("rejects every administrator workflow without a persistent administrator session", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.categories.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.categories.create({ name: "Finance", description: null })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.subcategories.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.knowledge.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.complaints.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.adminAuth.changePassword({ currentPassword: "CampusAdmin7", password: "CampusAdmin8" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires a selected college before public searches and request tracking can query the database", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.catalog.search({ collegeId: 1, query: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.requests.track({ collegeId: 1, trackingId: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a college name, registered email, and secure password to create an administrator account", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.adminAuth.register({ collegeName: "", email: "not-an-email", password: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
