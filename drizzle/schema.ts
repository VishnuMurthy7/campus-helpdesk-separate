import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const colleges = mysqlTable("colleges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 48 }).notNull(),
  location: varchar("location", { length: 160 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [unique("colleges_code_unq").on(table.code)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  collegeId: int("collegeId").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 48 }).default("CircleHelp").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("categories_college_idx").on(table.collegeId)]);

export const subcategories = mysqlTable(
  "subcategories",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    sortOrder: int("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("subcategories_category_idx").on(table.categoryId)],
);

export const knowledgeBaseEntries = mysqlTable(
  "knowledgeBaseEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    subcategoryId: int("subcategoryId").notNull().references(() => subcategories.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    imageKey: varchar("imageKey", { length: 512 }),
    imageUrl: varchar("imageUrl", { length: 768 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("knowledge_subcategory_idx").on(table.subcategoryId)],
);

export const adminAccounts = mysqlTable("adminAccounts", {
  id: int("id").autoincrement().primaryKey(),
  collegeId: int("collegeId").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
}, table => [index("admin_accounts_college_idx").on(table.collegeId)]);

export const adminSessions = mysqlTable("adminSessions", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => adminAccounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
}, table => [index("admin_sessions_admin_idx").on(table.adminId), index("admin_sessions_expiry_idx").on(table.expiresAt)]);

export const adminPasswordResets = mysqlTable("adminPasswordResets", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => adminAccounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("admin_resets_admin_idx").on(table.adminId), index("admin_resets_expiry_idx").on(table.expiresAt)]);

export const complaints = mysqlTable(
  "complaints",
  {
    id: int("id").autoincrement().primaryKey(),
    trackingId: varchar("trackingId", { length: 32 }).notNull(),
    collegeId: int("collegeId").notNull().references(() => colleges.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["complaint", "enquiry"]).notNull(),
    categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
    subcategoryId: int("subcategoryId").references(() => subcategories.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 200 }).notNull(),
    description: text("description").notNull(),
    contactName: varchar("contactName", { length: 120 }).notNull(),
    contactEmail: varchar("contactEmail", { length: 320 }),
    contactPhone: varchar("contactPhone", { length: 32 }),
    status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
    adminNotes: text("adminNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    unique("complaints_tracking_id_unq").on(table.trackingId),
    index("complaints_college_idx").on(table.collegeId),
    index("complaints_status_idx").on(table.status),
    index("complaints_category_idx").on(table.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type College = typeof colleges.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type KnowledgeBaseEntry = typeof knowledgeBaseEntries.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type AdminAccount = typeof adminAccounts.$inferSelect;
