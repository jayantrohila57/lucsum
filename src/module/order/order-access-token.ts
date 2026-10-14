import "server-only";

import crypto from "node:crypto";
import { serverEnv } from "@/shared/config/env.server";

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function signingSecret(): string | null {
  const secret = serverEnv.BETTER_AUTH_SECRET?.trim();
  return secret || null;
}

function signPayload(payload: string): string {
  const secret = signingSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Signed token for guest order links (confirmation email, share URL). */
export function createOrderAccessToken(orderId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${orderId}.${exp}`;
  const sig = signPayload(payload);
  if (!sig) return "";
  return Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
}

export function verifyOrderAccessToken(token: string, orderId: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [id, expStr, sig] = decoded.split(".");
    if (!id || !expStr || !sig || id !== orderId) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    const expected = signPayload(`${id}.${expStr}`);
    if (!expected) return false;
    return timingSafeEqualString(sig, expected);
  } catch {
    return false;
  }
}
