import { and, asc, count, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  complaints,
  InsertUser,
  knowledgeBaseEntries,
  subcategories,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getPublicCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getPublicSubcategories(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subcategories).where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.isActive, true))).orderBy(asc(subcategories.sortOrder), asc(subcategories.name));
}

export async function getPublicKnowledgeBaseEntries(subcategoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.subcategoryId, subcategoryId), eq(knowledgeBaseEntries.isActive, true))).orderBy(asc(knowledgeBaseEntries.sortOrder), asc(knowledgeBaseEntries.id));
}

export async function getAdminComplaints(input: { status?: "open" | "in_progress" | "resolved" | "closed"; categoryId?: number; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (input.status) conditions.push(eq(complaints.status, input.status));
  if (input.categoryId) conditions.push(eq(complaints.categoryId, input.categoryId));
  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    conditions.push(or(like(complaints.trackingId, term), like(complaints.subject, term), like(complaints.contactName, term))!);
  }
  return db.select({ complaint: complaints, categoryName: categories.name, subcategoryName: subcategories.name })
    .from(complaints)
    .leftJoin(categories, eq(complaints.categoryId, categories.id))
    .leftJoin(subcategories, eq(complaints.subcategoryId, subcategories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(complaints.createdAt));
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, categoryBreakdown: [] as { name: string; total: number }[] };
  const [totals] = await db.select({
    total: count(),
    open: sql<number>`coalesce(sum(case when ${complaints.status} = 'open' then 1 else 0 end), 0)`,
    inProgress: sql<number>`coalesce(sum(case when ${complaints.status} = 'in_progress' then 1 else 0 end), 0)`,
    resolved: sql<number>`coalesce(sum(case when ${complaints.status} = 'resolved' then 1 else 0 end), 0)`,
    closed: sql<number>`coalesce(sum(case when ${complaints.status} = 'closed' then 1 else 0 end), 0)`,
  }).from(complaints);
  const categoryBreakdown = await db.select({ name: categories.name, total: count(complaints.id) })
    .from(categories).leftJoin(complaints, eq(complaints.categoryId, categories.id))
    .groupBy(categories.id, categories.name).orderBy(desc(count(complaints.id))).limit(6);
  return { ...totals, categoryBreakdown: categoryBreakdown.map(item => ({ name: item.name, total: Number(item.total) })) };
}
