import { describe, it, expect } from "vitest";
import { fetchMock, ok, urlOf, optsOf } from "../test/fetch-mock";
import { checkout, listMyOrders, listMySales } from "./order.service";

const paginated = { data: [], current_page: 1, last_page: 1, total: 0 };
const card = {
  card_number: "4242424242424242",
  card_name: "Alice",
  expiry_month: 12,
  expiry_year: 2030,
  cvv: "123",
};

describe("order.service", () => {
  it("checkout POST /api/articles/:id/checkout avec la carte", async () => {
    fetchMock.mockReturnValueOnce(ok({ id: 1 }));

    await checkout("tok", 5, card);

    expect(urlOf()).toBe("/api/articles/5/checkout");
    expect(optsOf().method).toBe("POST");
    expect(optsOf().body).toBe(JSON.stringify(card));
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("listMyOrders GET /api/my/orders", async () => {
    fetchMock.mockReturnValueOnce(ok(paginated));
    expect(await listMyOrders("tok")).toEqual(paginated);
    expect(urlOf()).toBe("/api/my/orders");
  });

  it("listMySales GET /api/my/sales", async () => {
    fetchMock.mockReturnValueOnce(ok(paginated));
    expect(await listMySales("tok")).toEqual(paginated);
    expect(urlOf()).toBe("/api/my/sales");
  });
});
