import { describe, it, expect } from "vitest";
import { fetchMock, ok, okRaw, urlOf, optsOf } from "../test/fetch-mock";
import { createReview, getUserReviews } from "./review.service";

describe("review.service", () => {
  it("createReview POST /api/orders/:id/review avec rating + comment", async () => {
    fetchMock.mockReturnValueOnce(ok({ id: 1, rating: 5 }));

    await createReview("tok", 9, { rating: 5, comment: "Top" });

    expect(urlOf()).toBe("/api/orders/9/review");
    expect(optsOf().method).toBe("POST");
    expect(optsOf().body).toBe(JSON.stringify({ rating: 5, comment: "Top" }));
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("getUserReviews GET /api/users/:id/reviews et renvoie l'enveloppe complète (meta)", async () => {
    fetchMock.mockReturnValueOnce(
      okRaw({
        response_code: 200,
        status: "ok",
        message: "",
        data: { data: [], current_page: 1, last_page: 1, total: 0 },
        meta: { average_rating: 4.5, total_reviews: 2 },
      }),
    );

    const res = await getUserReviews(3);

    expect(urlOf()).toBe("/api/users/3/reviews");
    expect(res.meta.average_rating).toBe(4.5);
  });
});
