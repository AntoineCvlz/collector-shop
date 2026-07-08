import { apiFetch } from "../api/client";
import type { Article, Paginated } from "./article.service";

export interface Seller {
  id: number;
  name: string;
  email: string;
  banned_at: string | null;
  articles_count: number;
}

interface ArticleListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Article>;
}

interface SellerListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Seller>;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });


export const listPendingArticles = async (
  token: string,
): Promise<Paginated<Article>> => {
  const res = await apiFetch<ArticleListResponse>("/api/moderation/articles", {
    headers: authHeaders(token),
  });
  return res.data;
};

export const approveArticle = async (
  token: string,
  id: number,
): Promise<void> => {
  await apiFetch(`/api/articles/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
};

export const rejectArticle = async (
  token: string,
  id: number,
): Promise<void> => {
  await apiFetch(`/api/articles/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
};

export const removeArticle = async (
  token: string,
  id: number,
): Promise<void> => {
  await apiFetch(`/api/moderation/articles/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};


export const listSellers = async (
  token: string,
): Promise<Paginated<Seller>> => {
  const res = await apiFetch<SellerListResponse>("/api/moderation/sellers", {
    headers: authHeaders(token),
  });
  return res.data;
};

export const banSeller = async (token: string, id: number): Promise<void> => {
  await apiFetch(`/api/sellers/${id}/ban`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
};

export const unbanSeller = async (token: string, id: number): Promise<void> => {
  await apiFetch(`/api/sellers/${id}/unban`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
};
