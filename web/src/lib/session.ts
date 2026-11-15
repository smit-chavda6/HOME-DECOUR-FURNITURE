import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Login sessions.
 *
 * The session is a signed token (JWT) stored in an httpOnly cookie, so it
 * needs no server memory or database lookups and works on serverless hosting.
 * JavaScript in the browser cannot read the cookie, and nobody can change it
 * without AUTH_SECRET.
 */
const COOKIE_NAME = "hdf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionData = { userId: string };

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a random value of 32+ characters in web/.env.local.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionData | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId }
      : null;
  } catch {
    // Expired or tampered token: treat as signed out.
    return null;
  }
}
