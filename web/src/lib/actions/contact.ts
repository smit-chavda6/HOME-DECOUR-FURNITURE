"use server";

import { getCurrentUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { ContactMessage } from "@/lib/models/contact-message";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  contactSchema,
  fieldErrors,
  formValues,
  type FormState,
} from "@/lib/validation";

export async function sendMessageAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["website"]);

  // "website" is a hidden field real visitors never see. Bots fill it in, so
  // a value here means spam: pretend it worked and store nothing.
  if (formData.get("website")) {
    return { ok: true, message: "Thank you. We will be in touch shortly." };
  }

  if (!(await rateLimit(`contact:${await clientIp()}`, 5, 60 * 60))) {
    return { message: "You have sent several messages already. Please try again later.", values };
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const user = await getCurrentUser();
  await connectDb();
  await ContactMessage.create({ ...parsed.data, user_id: user?.id });

  return { ok: true, message: "Thank you. We have your message and will be in touch shortly." };
}
