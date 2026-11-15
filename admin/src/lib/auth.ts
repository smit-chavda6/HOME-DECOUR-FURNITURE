import "server-only";
import { cache } from "react";
import { isValidObjectId } from "mongoose";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Admin, Audit } from "@/lib/models/admin";
import { clientIp } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export type CurrentAdmin = {
  id: string;
  username: string;
  email: string;
  name: string;
};

/**
 * The signed-in admin, or null. The cookie alone is never trusted: the
 * account must still exist, be active, and have the same token version as
 * the cookie. Cached per request so a page loads the admin once.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await readSession();
  if (!session || !isValidObjectId(session.adminId)) return null;

  await connectDb();
  const admin = await Admin.findById(session.adminId).select("-password").lean();
  if (!admin || !admin.active || (admin.token_version ?? 0) !== session.version) return null;

  return {
    id: String(admin._id),
    username: admin.username,
    email: admin.email,
    name: admin.name,
  };
});

/** For pages: anyone not signed in goes to the login page. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

/**
 * For server actions and API routes. Server actions can be called directly,
 * so every one of them must start with this.
 */
export async function assertAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not allowed");
  return admin;
}

/** Write one line to the activity log. Never lets a logging failure break the action. */
export async function audit(
  admin: Pick<CurrentAdmin, "id" | "username"> | null,
  action: string,
  target = "",
) {
  try {
    await connectDb();
    await Audit.create({
      admin_id: admin?.id ?? "",
      username: admin?.username ?? "",
      action,
      target: target.slice(0, 200),
      ip: await clientIp(),
    });
  } catch (error) {
    console.error("[audit] could not write entry", error);
  }
}
