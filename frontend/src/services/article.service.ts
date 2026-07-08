import { apiFetch } from "../api/client";
import { catalogueResponseSchema, articleResponseSchema } from "../api/schemas";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type ArticleStatus = "pending" | "published" | "rejected";

export interface ArticleImage {
  id: number;
  url: string;
  position: number;
}

export interface Article {
  id: number;
  title: string;
  description: string;
  price: string;
  shipping_cost: string;
  status: ArticleStatus;
  published_at: string | null;
  category_id: number;
  category?: { id: number; name: string; slug: string };
  seller?: { id: number; name: string };
  images: ArticleImage[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

interface CatalogueResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Article>;
}

interface ArticleResponse {
  response_code: number;
  status: string;
  message: string;
  data: Article;
}

export interface CatalogueFilters {
  categoryId?: number | null;
  search?: string;
  page?: number;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const listArticles = async (
  filters: CatalogueFilters = {},
): Promise<Paginated<Article>> => {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("category_id", String(filters.categoryId));
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  const qs = params.toString();

  const res = await apiFetch<CatalogueResponse>(
    `/api/articles${qs ? `?${qs}` : ""}`,
  );
  return catalogueResponseSchema.parse(res).data;
};

export const getArticle = async (id: number): Promise<Article> => {
  const res = await apiFetch<ArticleResponse>(`/api/articles/${id}`);
  return articleResponseSchema.parse(res).data;
};

export const listMyArticles = async (
  token: string,
): Promise<Paginated<Article>> => {
  const res = await apiFetch<CatalogueResponse>("/api/my/articles", {
    headers: authHeaders(token),
  });
  return res.data;
};

export interface NewArticle {
  category_id: number;
  title: string;
  description: string;
  price: number;
  shipping_cost?: number;
  images?: File[];
}

/**
 * Multipart upload — we must let the browser set the multipart boundary,
 * so we bypass the JSON apiFetch helper here.
 */
export const createArticle = async (
  token: string,
  payload: NewArticle,
): Promise<Article> => {
  const form = new FormData();
  form.append("category_id", String(payload.category_id));
  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("price", String(payload.price));
  if (payload.shipping_cost != null) {
    form.append("shipping_cost", String(payload.shipping_cost));
  }
  (payload.images ?? []).forEach((file) => form.append("images[]", file));

  const response = await fetch(`${BASE_URL}/api/articles`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const json: ArticleResponse = await response.json();
  return json.data;
};

export const deleteArticle = async (
  token: string,
  id: number,
): Promise<void> => {
  await apiFetch(`/api/articles/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};
