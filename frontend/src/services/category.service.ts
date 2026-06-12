import { apiFetch } from "../api/client";

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Category[];
}

interface CategoryResponse {
  response_code: number;
  status: string;
  message: string;
  data: Category;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const listCategories = async (): Promise<Category[]> => {
  const res = await apiFetch<CategoryListResponse>("/api/categories");
  return res.data;
};

export const createCategory = async (
  token: string,
  name: string,
): Promise<Category> => {
  const res = await apiFetch<CategoryResponse>("/api/categories", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  return res.data;
};

export const updateCategory = async (
  token: string,
  id: number,
  name: string,
): Promise<Category> => {
  const res = await apiFetch<CategoryResponse>(`/api/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  return res.data;
};

export const deleteCategory = async (
  token: string,
  id: number,
): Promise<void> => {
  await apiFetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};
