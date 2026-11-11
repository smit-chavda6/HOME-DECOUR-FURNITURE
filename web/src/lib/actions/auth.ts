"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";
import {
  fieldErrors,
  formValues,
  loginSchema,
  registerSchema,
  type FormState,
} from "@/lib/validation";

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["password"]);

  if (!(await rateLimit(`register:${await clientIp()}`, 10, 60 * 60))) {
    return { message: TOO_MANY, values };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  await connectDb();
  const existing = await User.findOne({
    $or: [
      { username: data.username },
      { email: data.email },
      { phone: data.phone },
    ],
  })
    .select("username email phone")
    .lean();

  if (existing) {
    const errors: Record<string, string> = {};
    if (existing.username === data.username) errors.username = "This username is taken";
    if (existing.email === data.email) errors.email = "This email is already registered";
    if (existing.phone === data.phone) errors.phone = "This phone number is already registered";
    return { errors, values };
  }

  let userId: string;
  try {
    const user = await User.create({
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, 12),
      full_name: data.fullName,
      phone: data.phone,
    });
    userId = String(user._id);
  } catch (error) {
    // Two people registering the same details at the same moment.
    if ((error as { code?: number }).code === 11000) {
      return { message: "An account with these details already exists.", values };
    }
    throw error;
  }

  await createSession(userId);
  redirect(safeNextPath(formData.get("next")));
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["password"]);

  if (!(await rateLimit(`login:${await clientIp()}`, 10, 15 * 60))) {
    return { message: TOO_MANY, values };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { identifier, password } = parsed.data;

  await connectDb();
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  })
    .select("password")
    .lean();

  // Same message for "no such user" and "wrong password", so the form does
  // not reveal which usernames exist.
  const valid = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !valid) {
    return { message: "Wrong username or password.", values };
  }

  await createSession(String(user._id));
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
