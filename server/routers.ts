import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { categories, complaints, knowledgeBaseEntries, subcategories, users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getAdminComplaints, getAdminStats, getDb, getPublicCategories, getPublicColleges, getPublicKnowledgeBaseEntries, getPublicSubcategories, searchPublicHelp } from "./db";
import { ADMIN_GATE_COOKIE, ADMIN_GATE_MAX_AGE_MS, createAdminGateToken, getCookieValue, isAdminGateTokenValid, isAdminPasswordValid } from "./adminGate";

const categoryInput = z.object({ collegeId: z.number().int().positive().default(1), name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).nullable().optional(), icon: z.string().trim().min(1).max(48).default("CircleHelp"), sortOrder: z.number().int().min(0).default(0), isActive: z.boolean().default(true) });
const subcategoryInput = z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).nullable().optional(), sortOrder: z.number().int().min(0).default(0), isActive: z.boolean().default(true) });
const knowledgeInput = z.object({ subcategoryId: z.number().int().positive(), question: z.string().trim().min(5).max(2000), answer: z.string().trim().min(5).max(8000), sortOrder: z.number().int().min(0).default(0), isActive: z.boolean().default(true) });
const statusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  const verificationToken = getCookieValue(ctx.req.headers.cookie, ADMIN_GATE_COOKIE);
  if (!isAdminGateTokenValid(verificationToken, ctx.user.id, ENV.cookieSecret)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Verify your administrator password to continue." });
  return next({ ctx });
});

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The data service is unavailable. Please try again shortly." });
  return db;
}

async function createTrackingId() {
  const db = requireDb(await getDb());
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingId = `CH-${randomBytes(4).toString("hex").toUpperCase()}`;
    const existing = await db.select({ id: complaints.id }).from(complaints).where(eq(complaints.trackingId, trackingId)).limit(1);
    if (!existing.length) return trackingId;
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create a tracking number. Please resubmit your request." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  adminGate: router({
    status: protectedProcedure.query(({ ctx }) => ({ verified: ctx.user.role === "admin" && isAdminGateTokenValid(getCookieValue(ctx.req.headers.cookie, ADMIN_GATE_COOKIE), ctx.user.id, ENV.cookieSecret) })),
    verify: protectedProcedure.input(z.object({ password: z.string().min(1).max(512) })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      if (!ENV.adminAccessPassword) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The private administrator password has not been configured yet." });
      if (!isAdminPasswordValid(input.password, ENV.adminAccessPassword)) throw new TRPCError({ code: "UNAUTHORIZED", message: "The administrator password is incorrect." });
      ctx.res.cookie(ADMIN_GATE_COOKIE, createAdminGateToken(ctx.user.id, ENV.cookieSecret), { ...getSessionCookieOptions(ctx.req), maxAge: ADMIN_GATE_MAX_AGE_MS });
      return { verified: true };
    }),
    logout: protectedProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_GATE_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    }),
  }),
  catalog: router({
    colleges: publicProcedure.query(getPublicColleges),
    categories: publicProcedure.input(z.object({ collegeId: z.number().int().positive() })).query(({ input }) => getPublicCategories(input.collegeId)),
    subcategories: publicProcedure.input(z.object({ categoryId: z.number().int().positive() })).query(({ input }) => getPublicSubcategories(input.categoryId)),
    questions: publicProcedure.input(z.object({ subcategoryId: z.number().int().positive() })).query(({ input }) => getPublicKnowledgeBaseEntries(input.subcategoryId)),
    search: publicProcedure.input(z.object({ collegeId: z.number().int().positive(), query: z.string().trim().min(2).max(80) })).query(({ input }) => searchPublicHelp(input)),
  }),
  publicRequests: router({
    submit: publicProcedure.input(z.object({
      collegeId: z.number().int().positive(), type: z.enum(["complaint", "enquiry"]), categoryId: z.number().int().positive().nullable().optional(), subcategoryId: z.number().int().positive().nullable().optional(),
      subject: z.string().trim().min(5).max(200), description: z.string().trim().min(15).max(8000), contactName: z.string().trim().min(2).max(120),
      contactEmail: z.string().trim().email().max(320).nullable().optional(), contactPhone: z.string().trim().min(7).max(32).nullable().optional(),
    }).refine(data => Boolean(data.contactEmail || data.contactPhone), { message: "Provide an email address or phone number so the campus team can respond.", path: ["contactEmail"] }))
      .mutation(async ({ input }) => {
        const db = requireDb(await getDb());
        const trackingId = await createTrackingId();
        await db.insert(complaints).values({ ...input, trackingId, categoryId: input.categoryId ?? null, subcategoryId: input.subcategoryId ?? null, contactEmail: input.contactEmail || null, contactPhone: input.contactPhone || null });
        return { trackingId };
      }),
    track: publicProcedure.input(z.object({ collegeId: z.number().int().positive(), trackingId: z.string().trim().toUpperCase().regex(/^CH-[A-F0-9]{8}$/, "Enter a valid tracking ID, such as CH-1A2B3C4D.") }))
      .query(async ({ input }) => {
        const db = requireDb(await getDb());
        const [result] = await db.select({ trackingId: complaints.trackingId, type: complaints.type, subject: complaints.subject, status: complaints.status, createdAt: complaints.createdAt, updatedAt: complaints.updatedAt, categoryName: categories.name, subcategoryName: subcategories.name })
          .from(complaints).leftJoin(categories, eq(complaints.categoryId, categories.id)).leftJoin(subcategories, eq(complaints.subcategoryId, subcategories.id))
          .where(and(eq(complaints.trackingId, input.trackingId), eq(complaints.collegeId, input.collegeId))).limit(1);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "We could not find a request with that tracking ID." });
        return result;
      }),
  }),
  admin: router({
    stats: adminProcedure.input(z.object({ collegeId: z.number().int().positive().optional() }).optional()).query(({ input }) => getAdminStats(input?.collegeId)),
    categories: router({
      list: adminProcedure.input(z.object({ collegeId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => { const db = requireDb(await getDb()); return input?.collegeId ? db.select().from(categories).where(eq(categories.collegeId, input.collegeId)).orderBy(asc(categories.sortOrder), asc(categories.name)) : db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)); }),
      create: adminProcedure.input(categoryInput).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.insert(categories).values({ ...input, collegeId: input.collegeId ?? 1 }); return { success: true }; }),
      update: adminProcedure.input(categoryInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); const { id, ...changes } = input; await db.update(categories).set(changes).where(eq(categories.id, id)); return { success: true }; }),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.delete(categories).where(eq(categories.id, input.id)); return { success: true }; }),
    }),
    subcategories: router({
      list: adminProcedure.input(z.object({ collegeId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => { const db = requireDb(await getDb()); const query = db.select({ subcategory: subcategories, categoryName: categories.name }).from(subcategories).innerJoin(categories, eq(subcategories.categoryId, categories.id)); return input?.collegeId ? query.where(eq(categories.collegeId, input.collegeId)).orderBy(asc(categories.name), asc(subcategories.sortOrder), asc(subcategories.name)) : query.orderBy(asc(categories.name), asc(subcategories.sortOrder), asc(subcategories.name)); }),
      create: adminProcedure.input(subcategoryInput).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.insert(subcategories).values(input); return { success: true }; }),
      update: adminProcedure.input(subcategoryInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); const { id, ...changes } = input; await db.update(subcategories).set(changes).where(eq(subcategories.id, id)); return { success: true }; }),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.delete(subcategories).where(eq(subcategories.id, input.id)); return { success: true }; }),
    }),
    knowledge: router({
      list: adminProcedure.input(z.object({ collegeId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => { const db = requireDb(await getDb()); const query = db.select({ entry: knowledgeBaseEntries, subcategoryName: subcategories.name, categoryName: categories.name }).from(knowledgeBaseEntries).innerJoin(subcategories, eq(knowledgeBaseEntries.subcategoryId, subcategories.id)).innerJoin(categories, eq(subcategories.categoryId, categories.id)); return input?.collegeId ? query.where(eq(categories.collegeId, input.collegeId)).orderBy(asc(categories.name), asc(subcategories.name), asc(knowledgeBaseEntries.sortOrder)) : query.orderBy(asc(categories.name), asc(subcategories.name), asc(knowledgeBaseEntries.sortOrder)); }),
      create: adminProcedure.input(knowledgeInput).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.insert(knowledgeBaseEntries).values(input); return { success: true }; }),
      update: adminProcedure.input(knowledgeInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); const { id, ...changes } = input; await db.update(knowledgeBaseEntries).set(changes).where(eq(knowledgeBaseEntries.id, id)); return { success: true }; }),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.delete(knowledgeBaseEntries).where(eq(knowledgeBaseEntries.id, input.id)); return { success: true }; }),
    }),
    complaints: router({
      list: adminProcedure.input(z.object({ collegeId: z.number().int().positive().optional(), status: statusSchema.optional(), categoryId: z.number().int().positive().optional(), search: z.string().max(200).optional() })).query(({ input }) => getAdminComplaints(input)),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema, adminNotes: z.string().trim().max(8000).nullable().optional() })).mutation(async ({ input }) => { const db = requireDb(await getDb()); await db.update(complaints).set({ status: input.status, adminNotes: input.adminNotes ?? null }).where(eq(complaints.id, input.id)); return { success: true }; }),
    }),
    users: router({
      list: adminProcedure.query(async () => { const db = requireDb(await getDb()); return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(asc(users.name)); }),
      updateRole: adminProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(["user", "admin"]) })).mutation(async ({ input, ctx }) => { const db = requireDb(await getDb()); if (input.id === ctx.user.id && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own administrator access." }); await db.update(users).set({ role: input.role }).where(eq(users.id, input.id)); return { success: true }; }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
