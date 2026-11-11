"use server";

import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  fieldErrors,
  formValues,
  passwordChangeSchema,
  profileSchema,
  type FormState,
} from "@/lib/validation";

const SIGNED_OUT = "Your session has ended. Please log in again.";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const user = await getCurrentUser();
  if (!user) return { message: SIGNED_OUT, values };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  await connectDb();
  const phoneTaken = await User.exists({ phone: data.phone, _id: { $ne: user.id } });
  if (phoneTaken) {
    return {
      errors: { phone: "This phone number belongs to another account" },
      values,
    };
  }

  await User.updateOne(
    { _id: user.id },
    {
      full_name: data.fullName,
      phone: data.phone,
      address_line1: data.addressLine1,
      address_line2: data.addressLine2,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      address: [data.addressLine1, data.addressLine2, data.city, data.state, data.postalCode]
        .filter(Boolean)
        .join(", "),
      updated_at: new Date(),
    },
  );

  return { ok: true, message: "Profile saved.", values };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: SIGNED_OUT };

  if (!(await rateLimit(`password:${await clientIp()}`, 8, 15 * 60))) {
    return { message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDb();
  const record = await User.findById(user.id).select("password");
  if (!record) return { message: SIGNED_OUT };

  const matches = await bcrypt.compare(parsed.data.currentPassword, record.password);
  if (!matches) {
    return { errors: { currentPassword: "Current password is not correct" } };
  }

  record.password = await bcrypt.hash(parsed.data.newPassword, 12);
  record.updated_at = new Date();
  await record.save();

  return { ok: true, message: "Password changed." };
}
