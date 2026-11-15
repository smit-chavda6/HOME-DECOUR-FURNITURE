import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/cookie-name";

/**
 * Admin login sessions: a signed token (JWT) in an httpOnly cookie.
 *
 * - Signed with ADMIN_AUTH_SECRET, which is separate from the shop's secret,
 *   so a shop cookie can never be turned into an admin cookie.
 * - sameSite "strict": the browser never sends it on requests that start on
 *   another site, which blocks cross-site request forgery.
 * - Expires after 8 hours; the admin then signs in again.
 */
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSession = { adminId: string; version: number };

function secretKey() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_AUTH_SECRET is missing or too short. Set a random value of 32+ characters in admin/.env.local.",
    );
  }
  if (secret === process.env.AUTH_SECRET) {
    throw new Error("ADMIN_AUTH_SECRET must be different from the shop's AUTH_SECRET.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(adminId: string, version: number) {
  const token = await new SignJWT({ v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setAudience("hdf-admin")
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function readSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      audience: "hdf-admin",
    });
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") return null;
    return { adminId: payload.sub, version: payload.v };
  } catch {
    // Expired or tampered token: treat as signed out.
    return null;
  }
}
