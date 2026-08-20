import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { ADMIN_GATE_COOKIE, createAdminGateToken } from "./adminGate";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getPublicCategories: vi.fn(),
  searchPublicHelp: vi.fn(),
  getAdminStats: vi.fn(),
  getAdminComplaints: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...dbMocks };
});

import { appRouter } from "./routers";

function privateAdminContext(): TrpcContext {
  const user = {
    id: 501,
    openId: "college-scope-admin",
    name: "College Scope Admin",
    email: "admin@example.edu",
    loginMethod: "test",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const token = createAdminGateToken(user.id, ENV.cookieSecret);
  return {
    user,
    req: { protocol: "https", headers: { cookie: `${ADMIN_GATE_COOKIE}=${token}` } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("college-specific Campus Helpdesk behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns distinct public topics and search results for different college selections", async () => {
    dbMocks.getPublicCategories.mockImplementation(async (collegeId: number) => collegeId === 1
      ? [{ id: 11, collegeId, name: "Riverside finance" }]
      : [{ id: 22, collegeId, name: "Northfield laboratories" }]);
    dbMocks.searchPublicHelp.mockImplementation(async ({ collegeId }: { collegeId: number }) => collegeId === 1
      ? [{ id: 111, kind: "category", title: "Riverside finance", detail: "Fees" }]
      : [{ id: 222, kind: "question", title: "Northfield lab access", answer: "Bring your lab pass." }]);

    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const riversideTopics = await caller.catalog.categories({ collegeId: 1 });
    const northfieldTopics = await caller.catalog.categories({ collegeId: 30002 });
    const riversideSearch = await caller.catalog.search({ collegeId: 1, query: "fees" });
    const northfieldSearch = await caller.catalog.search({ collegeId: 30002, query: "labs" });

    expect(riversideTopics[0]?.name).toBe("Riverside finance");
    expect(northfieldTopics[0]?.name).toBe("Northfield laboratories");
    expect(riversideSearch[0]?.title).toBe("Riverside finance");
    expect(northfieldSearch[0]?.title).toBe("Northfield lab access");
    expect(dbMocks.getPublicCategories).toHaveBeenCalledWith(1);
    expect(dbMocks.getPublicCategories).toHaveBeenCalledWith(30002);
  });

  it("passes the selected college to private administrator statistics and request views", async () => {
    dbMocks.getAdminStats.mockImplementation(async (collegeId?: number) => ({ total: collegeId === 1 ? 4 : 9, open: 0, inProgress: 0, resolved: 0, closed: 0, categoryBreakdown: [] }));
    dbMocks.getAdminComplaints.mockImplementation(async ({ collegeId }: { collegeId?: number }) => [{ id: collegeId === 1 ? 401 : 902, collegeId }]);
    const caller = appRouter.createCaller(privateAdminContext());

    const riversideStats = await caller.admin.stats({ collegeId: 1 });
    const northfieldStats = await caller.admin.stats({ collegeId: 30002 });
    const riversideRequests = await caller.admin.complaints.list({ collegeId: 1 });
    const northfieldRequests = await caller.admin.complaints.list({ collegeId: 30002 });

    expect(riversideStats.total).toBe(4);
    expect(northfieldStats.total).toBe(9);
    expect(riversideRequests[0]?.id).toBe(401);
    expect(northfieldRequests[0]?.id).toBe(902);
    expect(dbMocks.getAdminStats).toHaveBeenCalledWith(1);
    expect(dbMocks.getAdminStats).toHaveBeenCalledWith(30002);
  });

  it("allows a privately verified administrator to create, update, and delete valid topics, areas, and predefined answers", async () => {
    const values = vi.fn(async () => undefined);
    const where = vi.fn(async () => undefined);
    const set = vi.fn(() => ({ where }));
    dbMocks.getDb.mockResolvedValue({
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set })),
      delete: vi.fn(() => ({ where })),
    });
    const caller = appRouter.createCaller(privateAdminContext());

    await caller.admin.categories.create({ collegeId: 30002, name: "Research support" });
    await caller.admin.categories.update({ id: 11, collegeId: 30002, name: "Research services" });
    await caller.admin.categories.delete({ id: 11 });
    await caller.admin.subcategories.create({ categoryId: 11, name: "Lab bookings" });
    await caller.admin.subcategories.update({ id: 21, categoryId: 11, name: "Laboratory bookings" });
    await caller.admin.subcategories.delete({ id: 21 });
    await caller.admin.knowledge.create({ subcategoryId: 21, question: "How do I reserve a lab?", answer: "Use the campus laboratory booking portal." });
    await caller.admin.knowledge.update({ id: 31, subcategoryId: 21, question: "How do I reserve a campus lab?", answer: "Use the campus laboratory booking portal." });
    await caller.admin.knowledge.delete({ id: 31 });

    expect(values).toHaveBeenCalledTimes(3);
    expect(set).toHaveBeenCalledTimes(3);
    expect(where).toHaveBeenCalledTimes(6);
  });
});
