import { apiFetch } from "../api/client";
import type { Paginated } from "./article.service";

export interface Review {
  id: number;
  order_id: number;
  author_id: number;
  subject_id: number;
  type: "of_seller" | "of_buyer";
  rating: number;
  comment: string | null;
  created_at: string;
  author?: { id: number; name: string };
}

interface CreateReviewResponse {
  response_code: number;
  status: string;
  message: string;
  data: Review;
}

interface UserReviewsResponse {
  response_code: number;
  status: string;
  message: string;
  data: Paginated<Review>;
  meta: {
    average_rating: number | null;
    total_reviews: number;
  };
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const createReview = async (
  token: string,
  orderId: number,
  payload: { rating: number; comment?: string },
): Promise<Review> => {
  const res = await apiFetch<CreateReviewResponse>(
    `/api/orders/${orderId}/review`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
  return res.data;
};

export const getUserReviews = async (
  userId: number,
): Promise<UserReviewsResponse> => {
  return apiFetch<UserReviewsResponse>(`/api/users/${userId}/reviews`);
};
