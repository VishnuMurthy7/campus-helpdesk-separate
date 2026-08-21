import crypto from "node:crypto";
import { promisify } from "node:util";
import { parse } from "cookie";
import { and, eq, gt, isNull } from "drizzle-orm";
import { adminAccounts, adminPasswordResets, adminSessions, colleges } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";

const scrypt = promisify(crypto.scrypt);
export const ADMIN_SESSION_COOKIE = "campus_admin_session";
export const ADMIN_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_TOKEN_MAX_AGE_MS = 1000 * 60 * 30;
const UPPERCASE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE_CODE_CHARS = "abcdefghijkmnopqrstuvwxyz";
const NUMBER_CODE_CHARS = "23456789";
const CODE_ALPHABET = `${UPPERCASE_CODE_CHARS}${LOWERCASE_CODE_CHARS}${NUMBER_CODE_CHARS}`;

export type AdminIdentity = {
  id: number;
  email: string;
  collegeId: number;
  collegeName: string;
  collegeCode: string;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export function generateCollegeCode() {
  const characters = [
    UPPERCASE_CODE_CHARS[crypto.randomInt(UPPERCASE_CODE_CHARS.length)],
    LOWERCASE_CODE_CHARS[crypto.randomInt(LOWERCASE_CODE_CHARS.length)],
    NUMBER_CODE_CHARS[crypto.randomInt(NUMBER_CODE_CHARS.length)],
    ...Array.from({ length: 7 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]),
  ];
  for (let index = characters.length - 1; index > 0; index--) {
    const swapIndex = crypto.randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

export function createResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function getAdminFromRequest(req: { headers: { cookie?: string } }): Promise<AdminIdentity | null> {
  const rawToken = parse(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
  if (!rawToken) return null;
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ account: adminAccounts, college: colleges })
    .from(adminSessions)
    .innerJoin(adminAccounts, eq(adminSessions.adminId, adminAccounts.id))
    .innerJoin(colleges, eq(adminAccounts.collegeId, colleges.id))
    .where(and(eq(adminSessions.tokenHash, sha256(rawToken)), gt(adminSessions.expiresAt, new Date()), eq(adminAccounts.isActive, true)))
    .limit(1);
  if (!row) return null;
  return { id: row.account.id, email: row.account.email, collegeId: row.college.id, collegeName: row.college.name, collegeCode: row.college.code };
}

export async function createAdminSession(adminId: number, req: any, res: any) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const token = crypto.randomBytes(32).toString("base64url");
  await db.insert(adminSessions).values({ adminId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ADMIN_SESSION_MAX_AGE_MS) });
  res.cookie(ADMIN_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: ADMIN_SESSION_MAX_AGE_MS });
}

export async function destroyAdminSession(req: any, res: any) {
  const rawToken = parse(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
  const db = await getDb();
  if (db && rawToken) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(rawToken)));
  res.clearCookie(ADMIN_SESSION_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export async function createPasswordReset(adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const token = createResetToken();
  await db.insert(adminPasswordResets).values({ adminId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS) });
  return token;
}

export async function consumePasswordReset(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [reset] = await db.select().from(adminPasswordResets)
    .where(and(eq(adminPasswordResets.tokenHash, sha256(token)), gt(adminPasswordResets.expiresAt, new Date()), isNull(adminPasswordResets.usedAt)))
    .limit(1);
  return reset ?? null;
}
