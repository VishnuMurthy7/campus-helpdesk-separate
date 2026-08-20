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

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 48 }).default("CircleHelp").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
    sortOrder: int("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("knowledge_subcategory_idx").on(table.subcategoryId)],
);

export const complaints = mysqlTable(
  "complaints",
  {
    id: int("id").autoincrement().primaryKey(),
    trackingId: varchar("trackingId", { length: 32 }).notNull(),
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
    index("complaints_status_idx").on(table.status),
    index("complaints_category_idx").on(table.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type KnowledgeBaseEntry = typeof knowledgeBaseEntries.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
