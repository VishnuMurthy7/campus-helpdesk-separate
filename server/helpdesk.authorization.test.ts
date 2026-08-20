import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: 42,
      openId: "test-user",
      name: "Test User",
      email: "test@example.edu",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Campus Helpdesk access controls", () => {
  it("rejects an ordinary signed-in user from the administrator statistics route", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an ordinary signed-in user from every administrator management procedure", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.admin.categories.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.categories.create({ name: "Finance", description: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.categories.update({ id: 1, name: "Finance", description: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.categories.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.subcategories.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.subcategories.create({ categoryId: 1, name: "Payments", description: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.subcategories.update({ id: 1, categoryId: 1, name: "Payments", description: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.subcategories.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.knowledge.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.knowledge.create({ subcategoryId: 1, question: "Where can I pay tuition fees?", answer: "Use the approved payment portal." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.knowledge.update({ id: 1, subcategoryId: 1, question: "Where can I pay tuition fees?", answer: "Use the approved payment portal." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.knowledge.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.complaints.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.complaints.update({ id: 1, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.users.updateRole({ id: 1, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permits anonymous visitors to reach the public complaint routes, while validating a tracking ID before a database lookup", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.publicRequests.track({ trackingId: "not-a-tracking-id" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.catalog.search({ query: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a contact method when an anonymous visitor submits a public request", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.publicRequests.submit({
      type: "enquiry",
      subject: "Library access question",
      description: "I need help understanding the library access process.",
      contactName: "Sample Student",
      contactEmail: null,
      contactPhone: null,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
