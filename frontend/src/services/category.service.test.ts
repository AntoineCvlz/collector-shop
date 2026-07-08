import { describe, it, expect } from "vitest";
import { fetchMock, ok, fail, urlOf, optsOf } from "../test/fetch-mock";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.service";

const cat = { id: 1, name: "Cards", slug: "cards" };

describe("category.service", () => {
  it("listCategories GET /api/categories et déballe data", async () => {
    fetchMock.mockReturnValueOnce(ok([cat]));

    const res = await listCategories();

    expect(urlOf()).toBe("/api/categories");
    expect(res).toEqual([cat]);
  });

  it("createCategory POST avec name + Bearer", async () => {
    fetchMock.mockReturnValueOnce(ok(cat));

    const res = await createCategory("tok", "Cards");

    expect(urlOf()).toBe("/api/categories");
    expect(optsOf().method).toBe("POST");
    expect(optsOf().body).toBe(JSON.stringify({ name: "Cards" }));
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(res).toEqual(cat);
  });

  it("updateCategory PUT /api/categories/:id", async () => {
    fetchMock.mockReturnValueOnce(ok(cat));

    await updateCategory("tok", 7, "Coins");

    expect(urlOf()).toBe("/api/categories/7");
    expect(optsOf().method).toBe("PUT");
    expect(optsOf().body).toBe(JSON.stringify({ name: "Coins" }));
  });

  it("deleteCategory DELETE /api/categories/:id", async () => {
    fetchMock.mockReturnValueOnce(ok(null));

    await deleteCategory("tok", 7);

    expect(urlOf()).toBe("/api/categories/7");
    expect(optsOf().method).toBe("DELETE");
  });

  it("propage une erreur HTTP", async () => {
    fetchMock.mockReturnValueOnce(fail(500));
    await expect(listCategories()).rejects.toThrow("500");
  });
});
