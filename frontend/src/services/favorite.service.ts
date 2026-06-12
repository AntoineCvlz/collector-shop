import { apiFetch } from "../api/client";
import type { Article, Paginated } from "./article.service";
import type { Category } from "./category.service";

interface CategoryListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Category[];
}

interface ArticleListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Article[];
}

interface WishlistResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Article>;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── Interests ──

export const getInterests = async (token: string): Promise<Category[]> => {
  const res = await apiFetch<CategoryListResponse>("/api/me/interests", {
    headers: authHeaders(token),
  });
  return res.data;
};

export const syncInterests = async (
  token: string,
  categoryIds: number[],
): Promise<Category[]> => {
  const res = await apiFetch<CategoryListResponse>("/api/me/interests", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ category_ids: categoryIds }),
  });
  return res.data;
};

export const getRecommendations = async (
  token: string,
): Promise<Article[]> => {
  const res = await apiFetch<ArticleListResponse>("/api/recommendations", {
    headers: authHeaders(token),
  });
  return res.data;
};

// ── Wishlist ──

export const getFavorites = async (
  token: string,
): Promise<Paginated<Article>> => {
  const res = await apiFetch<WishlistResponse>("/api/me/favorites", {
    headers: authHeaders(token),
  });
  return res.data;
};

export const addFavorite = async (
  token: string,
  articleId: number,
): Promise<void> => {
  await apiFetch(`/api/articles/${articleId}/favorite`, {
    method: "POST",
    headers: authHeaders(token),
  });
};

export const removeFavorite = async (
  token: string,
  articleId: number,
): Promise<void> => {
  await apiFetch(`/api/articles/${articleId}/favorite`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};
