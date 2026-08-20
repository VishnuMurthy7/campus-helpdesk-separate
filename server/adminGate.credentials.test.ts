import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { ADMIN_GATE_COOKIE } from "./adminGate";

describe("configured administrator password", () => {
  it("requires private password verification before protected administrator procedures run", async () => {
    const ctx: TrpcContext = {
      user: { id: 99, openId: "private-admin-test", name: "Private Admin", email: null, loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).admin.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("unlocks the server-side administrator gate through its verification endpoint", async () => {
    expect(ENV.adminAccessPassword).not.toBe("");
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: { id: 99, openId: "private-admin-test", name: "Private Admin", email: null, loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"],
    };

    const result = await appRouter.createCaller(ctx).adminGate.verify({ password: ENV.adminAccessPassword });

    expect(result).toEqual({ verified: true });
    expect(cookies[0]?.name).toBe(ADMIN_GATE_COOKIE);
    expect(cookies[0]?.value).toContain(".");
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none" });
  });

  it("validates the selected-college filter after private administrator verification", async () => {
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const user = { id: 99, openId: "private-admin-test", name: "Private Admin", email: null, loginMethod: "test", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const verifyContext: TrpcContext = { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"] };
    await appRouter.createCaller(verifyContext).adminGate.verify({ password: ENV.adminAccessPassword });

    const verifiedContext: TrpcContext = { user, req: { protocol: "https", headers: { cookie: `${ADMIN_GATE_COOKIE}=${cookies[0]?.value}` } } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    await expect(appRouter.createCaller(verifiedContext).admin.stats({ collegeId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("allows a privately verified administrator to reach topic, area, and answer management contracts", async () => {
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const user = { id: 99, openId: "private-admin-test", name: "Private Admin", email: null, loginMethod: "test", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const verifyContext: TrpcContext = { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"] };
    await appRouter.createCaller(verifyContext).adminGate.verify({ password: ENV.adminAccessPassword });

    const verifiedContext: TrpcContext = { user, req: { protocol: "https", headers: { cookie: `${ADMIN_GATE_COOKIE}=${cookies[0]?.value}` } } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const caller = appRouter.createCaller(verifiedContext);

    await expect(caller.admin.categories.create({ name: "", description: null })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.admin.subcategories.create({ categoryId: 0, name: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.admin.knowledge.create({ subcategoryId: 0, question: "x", answer: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
