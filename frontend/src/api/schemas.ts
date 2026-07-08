import { z } from "zod";

/** Enveloppe standard des réponses API. `data` est typé par chaque endpoint. */
export function envelope<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    response_code: z.number(),
    status: z.string(),
    message: z.string(),
    data,
  });
}

/** Pagination Laravel (sous-ensemble consommé par le front). */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    current_page: z.number(),
    last_page: z.number(),
    total: z.number(),
  });
}


export const roleSchema = z.enum(["buyer", "seller", "admin", "moderator"]);

export const userInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  roles: z.array(roleSchema),
});

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const articleImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  position: z.number(),
});

export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  price: z.string(),
  shipping_cost: z.string(),
  status: z.enum(["pending", "published", "rejected"]),
  published_at: z.string().nullable(),
  category_id: z.number(),
  category: z
    .object({ id: z.number(), name: z.string(), slug: z.string() })
    .optional(),
  seller: z.object({ id: z.number(), name: z.string() }).optional(),
  images: z.array(articleImageSchema),
});


export const loginResponseSchema = z.object({
  response_code: z.number(),
  status: z.string(),
  message: z.string(),
  user_info: userInfoSchema,
  token: z.string(),
});

export const meResponseSchema = z.object({
  response_code: z.number(),
  status: z.string(),
  message: z.string(),
  user_info: userInfoSchema,
});

export const catalogueResponseSchema = envelope(paginated(articleSchema));
export const articleResponseSchema = envelope(articleSchema);
export const categoryListResponseSchema = envelope(z.array(categorySchema));

export type UserInfo = z.infer<typeof userInfoSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Article = z.infer<typeof articleSchema>;
