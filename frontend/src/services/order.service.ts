import { apiFetch } from "../api/client";
import type { Paginated } from "./article.service";

export interface Order {
  id: number;
  article_id: number;
  amount: string;
  commission: string;
  seller_payout: string;
  status: string;
  card_last4: string;
  paid_at: string | null;
  article?: { id: number; title: string };
  buyer?: { id: number; name: string };
  seller?: { id: number; name: string };
}

interface OrderResponse {
  response_code: number;
  status: string;
  message: string;
  data: Order;
}

interface OrderListResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Order>;
}

export interface CardPayload {
  card_number: string;
  card_name: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const checkout = async (
  token: string,
  articleId: number,
  card: CardPayload,
): Promise<Order> => {
  const res = await apiFetch<OrderResponse>(
    `/api/articles/${articleId}/checkout`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(card),
    },
  );
  return res.data;
};

export const listMyOrders = async (
  token: string,
): Promise<Paginated<Order>> => {
  const res = await apiFetch<OrderListResponse>("/api/my/orders", {
    headers: authHeaders(token),
  });
  return res.data;
};

export const listMySales = async (token: string): Promise<Paginated<Order>> => {
  const res = await apiFetch<OrderListResponse>("/api/my/sales", {
    headers: authHeaders(token),
  });
  return res.data;
};
