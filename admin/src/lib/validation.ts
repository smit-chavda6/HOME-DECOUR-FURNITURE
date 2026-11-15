import { z } from "zod";

/** Form rules. Server actions validate with these before touching the database. */

/** Admin passwords: long, since this account controls the whole shop. */
export const adminPassword = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(200, "Password is too long");

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Enter your username").max(60),
  password: z.string().min(1, "Enter your password").max(200),
});

export const newAdminSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_.-]+$/, "Use only letters, numbers, dot, dash or underscore"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: adminPassword,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: adminPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "The two passwords do not match",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(140),
  category: z.string().trim().toLowerCase().min(2, "Enter a category").max(40),
  brand: z.string().trim().max(80).default(""),
  shortDescription: z.string().trim().max(300).default(""),
  description: z.string().trim().max(6000).default(""),
  price: z.coerce.number().int("Use whole rupees").min(1, "Enter a price"),
  originalPrice: z.union([z.coerce.number().int().min(0), z.literal("")]).default(""),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  badge: z.string().trim().max(30).default(""),
  material: z.string().trim().max(120).default(""),
  length: z.coerce.number().min(0).default(0),
  width: z.coerce.number().min(0).default(0),
  height: z.coerce.number().min(0).default(0),
  colors: z.string().trim().max(300).default(""),
  thumbnail: z.string().trim().max(500).default(""),
  gallery: z.string().trim().max(4000).default(""),
  modelUrl: z.string().trim().max(500).default(""),
});

export type FieldErrors = Record<string, string>;

/** Turn a zod error into { "field.path": "first message" } for showing next to inputs. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** What every form action returns. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  /** Echo of submitted values so the form keeps them after an error. */
  values?: Record<string, string>;
};

export function formValues(formData: FormData, omit: string[] = []) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !omit.includes(key) && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}
