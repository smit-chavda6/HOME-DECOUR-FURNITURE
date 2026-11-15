"use server";

import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { assertAdmin, audit } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, formValues, newAdminSchema, type FormState } from "@/lib/validation";

/** Managing admin accounts. Customers ("users") can never be turned into admins. */

export async function createAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await assertAdmin();
  const values = formValues(formData, ["password"]);
  const parsed = newAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  if (!(await rateLimit(`create-admin:${me.id}`, 10, 60 * 60))) {
    return { message: "Too many new accounts in a short time. Try again later.", values };
  }

  await connectDb();
  if (await Admin.exists({ username: parsed.data.username })) {
    return { errors: { username: "That username is taken." }, values };
  }

  await Admin.create({
    name: parsed.data.name,
    username: parsed.data.username,
    email: parsed.data.email,
    password: await bcrypt.hash(parsed.data.password, 12),
    created_by: me.username,
  });
  await audit(me, "admin.created", parsed.data.username);
  return { ok: true, message: `Admin "${parsed.data.username}" created. Share the password with them privately.` };
}

/** Disable or re-enable another admin. Disabling signs them out at once. */
export async function setAdminActiveAction(id: string, active: boolean): Promise<FormState> {
  const me = await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown admin." };
  if (id === me.id) return { message: "You cannot disable your own account." };

  await connectDb();
  if (!active) {
    const others = await Admin.countDocuments({ active: true, _id: { $ne: id } });
    if (others === 0) return { message: "At least one admin must stay active." };
  }
  const admin = await Admin.findByIdAndUpdate(
    id,
    { $set: { active, updated_at: new Date() }, ...(active ? {} : { $inc: { token_version: 1 } }) },
  )
    .select("username")
    .lean();
  if (!admin) return { message: "Unknown admin." };
  await audit(me, active ? "admin.enabled" : "admin.disabled", admin.username);
  return { ok: true };
}
