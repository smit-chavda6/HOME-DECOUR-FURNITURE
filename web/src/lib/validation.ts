import { z } from "zod";

/** Shared form rules. Server actions validate with these before touching the database. */

const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s-]{10,15}$/, "Enter a valid phone number (10 to 15 digits)");

const pin = z.string().trim().regex(/^[0-9]{6}$/, "PIN code must be 6 digits");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use only letters, numbers, dot, dash or underscore"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
  password,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the receiver's full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
  address1: z.string().trim().min(5, "Enter your address").max(160),
  address2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  postal: pin,
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  phone,
  addressLine1: z.string().trim().max(160).default(""),
  addressLine2: z.string().trim().max(160).default(""),
  city: z.string().trim().max(60).default(""),
  state: z.string().trim().max(60).default(""),
  postalCode: z.union([pin, z.literal("")]).default(""),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.union([phone, z.literal("")]).default(""),
  subject: z.string().trim().min(2, "Choose a subject").max(120),
  message: z.string().trim().min(10, "Write at least 10 characters").max(4000),
});

export const reviewSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/i),
  rating: z.coerce.number().min(1).max(5).multipleOf(0.5),
  comment: z.string().trim().max(1500).default(""),
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

/** Turn a zod error into { fieldName: "first message" } for showing next to inputs. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
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
