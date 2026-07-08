import { describe, it, expect } from "vitest";
import { fetchMock, ok, urlOf, optsOf } from "../test/fetch-mock";
import {
  getInterests,
  syncInterests,
  getRecommendations,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "./favorite.service";

const cat = { id: 1, name: "Cards", slug: "cards" };
const paginated = { data: [], current_page: 1, last_page: 1, total: 0 };

describe("favorite.service", () => {
  it("getInterests GET /api/me/interests", async () => {
    fetchMock.mockReturnValueOnce(ok([cat]));
    expect(await getInterests("tok")).toEqual([cat]);
    expect(urlOf()).toBe("/api/me/interests");
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("syncInterests PUT avec category_ids", async () => {
    fetchMock.mockReturnValueOnce(ok([cat]));
    await syncInterests("tok", [1, 2]);
    expect(urlOf()).toBe("/api/me/interests");
    expect(optsOf().method).toBe("PUT");
    expect(optsOf().body).toBe(JSON.stringify({ category_ids: [1, 2] }));
  });

  it("getRecommendations GET /api/recommendations", async () => {
    fetchMock.mockReturnValueOnce(ok([]));
    expect(await getRecommendations("tok")).toEqual([]);
    expect(urlOf()).toBe("/api/recommendations");
  });

  it("getFavorites GET /api/me/favorites déballe le paginé", async () => {
    fetchMock.mockReturnValueOnce(ok(paginated));
    expect(await getFavorites("tok")).toEqual(paginated);
    expect(urlOf()).toBe("/api/me/favorites");
  });

  it("addFavorite POST /api/articles/:id/favorite", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await addFavorite("tok", 42);
    expect(urlOf()).toBe("/api/articles/42/favorite");
    expect(optsOf().method).toBe("POST");
  });

  it("removeFavorite DELETE /api/articles/:id/favorite", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await removeFavorite("tok", 42);
    expect(urlOf()).toBe("/api/articles/42/favorite");
    expect(optsOf().method).toBe("DELETE");
  });
});
