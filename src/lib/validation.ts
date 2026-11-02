import { z } from "zod";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .regex(/^\+?[0-9 ()-]+$/, "Enter a valid phone number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const signupSchema = z.object({
  fullName: trimmed(2, 120, "Full name"),
  phone: phoneSchema,
  email: z.email("Enter a valid email").max(254),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const checkoutSchema = z.object({
  customerName: trimmed(2, 120, "Name"),
  phone: phoneSchema,
  address: trimmed(5, 500, "Address"),
  notes: z.string().trim().max(1000).optional().default(""),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "Your cart is empty")
    .max(50),
});

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: trimmed(1, 80, "Name"),
  slug,
  description: z.string().trim().max(500).optional().default(""),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
});

/** Prices arrive in major units from the form and are converted to minor units. */
const money = z.number().nonnegative().max(10_000_000);

export const variantSchema = z.object({
  id: z.uuid().optional(),
  name: trimmed(1, 80, "Variant name"),
  sku: z.string().trim().max(64).optional().default(""),
  price: money,
  compareAtPrice: money.nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000),
});

export const productSchema = z.object({
  id: z.uuid().optional(),
  name: trimmed(1, 160, "Name"),
  slug,
  description: z.string().trim().max(5000).default(""),
  categoryId: z.uuid().nullable().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add at least one variant").max(100),
});

export type ProductInput = z.infer<typeof productSchema>;

export const uuidSchema = z.uuid();

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
