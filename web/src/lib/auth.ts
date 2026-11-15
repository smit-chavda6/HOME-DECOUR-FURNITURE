import "server-only";
import { cache } from "react";
import { isValidObjectId } from "mongoose";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { readSession } from "@/lib/session";

/** The signed-in user, without the password hash. */
export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

/**
 * Who is making this request, or null. Shop customers only: the admin panel
 * is a separate app (admin/) with its own accounts and login. Wrapped in
 * cache() so one request loads the user once.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session || !isValidObjectId(session.userId)) return null;

  await connectDb();
  const user = await User.findById(session.userId).select("-password").lean();
  if (!user) return null;

  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    addressLine1: user.address_line1 ?? "",
    addressLine2: user.address_line2 ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    country: user.country ?? "India",
    postalCode: user.postal_code ?? "",
  };
});

/** For pages: send signed-out visitors to the login page, then back here. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}


/** Only allow redirects to paths on this site (blocks "//evil.com" tricks). */
export function safeNextPath(next: unknown, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
