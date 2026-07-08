import { describe, it, expect } from "vitest";
import { fetchMock, ok, urlOf, optsOf } from "../test/fetch-mock";
import {
  listPendingArticles,
  approveArticle,
  rejectArticle,
  removeArticle,
  listSellers,
  banSeller,
  unbanSeller,
} from "./admin.service";

const paginated = { data: [], current_page: 1, last_page: 1, total: 0 };

describe("admin.service", () => {
  it("listPendingArticles GET /api/moderation/articles", async () => {
    fetchMock.mockReturnValueOnce(ok(paginated));
    expect(await listPendingArticles("tok")).toEqual(paginated);
    expect(urlOf()).toBe("/api/moderation/articles");
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("approveArticle PATCH /api/articles/:id/approve", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await approveArticle("tok", 3);
    expect(urlOf()).toBe("/api/articles/3/approve");
    expect(optsOf().method).toBe("PATCH");
  });

  it("rejectArticle PATCH /api/articles/:id/reject", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await rejectArticle("tok", 3);
    expect(urlOf()).toBe("/api/articles/3/reject");
    expect(optsOf().method).toBe("PATCH");
  });

  it("removeArticle DELETE /api/moderation/articles/:id", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await removeArticle("tok", 3);
    expect(urlOf()).toBe("/api/moderation/articles/3");
    expect(optsOf().method).toBe("DELETE");
  });

  it("listSellers GET /api/moderation/sellers", async () => {
    fetchMock.mockReturnValueOnce(ok(paginated));
    expect(await listSellers("tok")).toEqual(paginated);
    expect(urlOf()).toBe("/api/moderation/sellers");
  });

  it("banSeller PATCH /api/sellers/:id/ban", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await banSeller("tok", 8);
    expect(urlOf()).toBe("/api/sellers/8/ban");
    expect(optsOf().method).toBe("PATCH");
  });

  it("unbanSeller PATCH /api/sellers/:id/unban", async () => {
    fetchMock.mockReturnValueOnce(ok(null));
    await unbanSeller("tok", 8);
    expect(urlOf()).toBe("/api/sellers/8/unban");
    expect(optsOf().method).toBe("PATCH");
  });
});
