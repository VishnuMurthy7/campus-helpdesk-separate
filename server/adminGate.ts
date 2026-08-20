import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_GATE_COOKIE = "campus_helpdesk_admin_verified";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export function isAdminPasswordValid(password: string, configuredPassword: string) {
  if (!configuredPassword) return false;
  const candidate = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createAdminGateToken(userId: number, secret: string, now = Date.now()) {
  const expiresAt = now + SESSION_DURATION_MS;
  const signature = createHmac("sha256", secret).update(`${userId}:${expiresAt}`).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function isAdminGateTokenValid(token: string | undefined, userId: number, secret: string, now = Date.now()) {
  if (!token || !secret) return false;
  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${userId}:${expiresAt}`).digest("hex");
  const candidate = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer);
}

export function getCookieValue(cookieHeader: string | string[] | undefined, name: string) {
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join(";") : cookieHeader ?? "";
  return raw.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

export const ADMIN_GATE_MAX_AGE_MS = SESSION_DURATION_MS;
