"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { assertAdmin, audit, getCurrentAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { clientIp, rateLimit, underLimit } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";
import { changePasswordSchema, fieldErrors, loginSchema, type FormState } from "@/lib/validation";

/**
 * A real bcrypt hash of a random string. Compared against when the username
 * does not exist, so a wrong username takes as long as a wrong password and
 * response times do not reveal which usernames exist.
 */
const DUMMY_HASH = "$2b$12$OQ9PPYcLTUv08.TyEPeXCef79GJ7m4/s0vGnaMPkNM3Wl8LDkGsVq";

const GENERIC_ERROR = "Wrong username or password.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  const username = typeof formData.get("username") === "string" ? String(formData.get("username")) : "";
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: { username } };
  }

  // Two limits: every attempt per network address, and failed attempts per
  // account (stops guessing spread over many addresses). Signing in
  // successfully never counts against the account.
  const ip = await clientIp();
  const userKey = `login-fail:${parsed.data.username}`;
  const [ipOk, userOk] = await Promise.all([
    rateLimit(`login-ip:${ip}`, 20, 15 * 60),
    underLimit(userKey, 5, 15 * 60),
  ]);
  if (!ipOk || !userOk) {
    await audit(null, "login.blocked", parsed.data.username);
    return {
      message: "Too many sign-in attempts. Wait 15 minutes and try again.",
      values: { username },
    };
  }

  await connectDb();
  const admin = await Admin.findOne({ username: parsed.data.username });
  const valid = await bcrypt.compare(parsed.data.password, admin?.password ?? DUMMY_HASH);

  if (!admin || !valid || !admin.active) {
    await rateLimit(userKey, 5, 15 * 60);
    await audit(null, "login.failed", parsed.data.username);
    return { message: GENERIC_ERROR, values: { username } };
  }

  admin.last_login_at = new Date();
  admin.last_login_ip = ip;
  await admin.save();

  await createSession(String(admin._id), admin.token_version ?? 0);
  await audit({ id: String(admin._id), username: admin.username }, "login.ok");
  redirect("/");
}

export async function logoutAction() {
  const admin = await getCurrentAdmin();
  if (admin) await audit(admin, "logout");
  await destroySession();
  redirect("/login");
}

/** Ends this admin's sessions on every device, including this one. */
export async function logoutEverywhereAction() {
  const admin = await assertAdmin();
  await connectDb();
  await Admin.updateOne({ _id: admin.id }, { $inc: { token_version: 1 }, updated_at: new Date() });
  await audit(admin, "logout.everywhere");
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await assertAdmin();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!(await rateLimit(`password:${me.id}`, 5, 15 * 60))) {
    return { message: "Too many attempts. Wait 15 minutes and try again." };
  }

  await connectDb();
  const admin = await Admin.findById(me.id);
  if (!admin) return { message: "Account not found." };
  if (!(await bcrypt.compare(parsed.data.currentPassword, admin.password))) {
    return { errors: { currentPassword: "That is not your current password." } };
  }

  admin.password = await bcrypt.hash(parsed.data.newPassword, 12);
  admin.token_version = (admin.token_version ?? 0) + 1; // sign out other devices
  admin.updated_at = new Date();
  await admin.save();

  // Keep this browser signed in with the new version.
  await createSession(me.id, admin.token_version);
  await audit(me, "password.changed");
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}
