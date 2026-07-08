import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listArticles,
  getArticle,
  createArticle,
  deleteArticle,
  listMyArticles,
} from "./article.service";

function jsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const fullArticle = {
  id: 1,
  title: "Carte rare",
  description: "…",
  price: "12.00",
  shipping_cost: "3.00",
  status: "published",
  published_at: null,
  category_id: 1,
  images: [],
};

describe("listArticles", () => {
  const paginated = {
    data: [fullArticle],
    current_page: 1,
    last_page: 1,
    total: 1,
  };

  it("appelle /api/articles sans query string quand aucun filtre", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: paginated }),
    );

    const res = await listArticles();

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("/api/articles");
    expect(res).toEqual(paginated);
  });

  it("sérialise categoryId, search et page en query params", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: paginated }),
    );

    await listArticles({ categoryId: 3, search: "pokemon", page: 2 });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("category_id=3");
    expect(url).toContain("search=pokemon");
    expect(url).toContain("page=2");
  });

  it("ignore categoryId null / page absente", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: paginated }),
    );

    await listArticles({ categoryId: null, search: "abc" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).not.toContain("category_id");
    expect(url).not.toContain("page");
    expect(url).toContain("search=abc");
  });

  it("propage une erreur HTTP (réponse non ok)", async () => {
    fetchMock.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 500 } as Response),
    );

    await expect(listArticles()).rejects.toThrow("500");
  });
});

describe("getArticle", () => {
  it("cible /api/articles/:id et renvoie l'article déballé", async () => {
    const article = { ...fullArticle, id: 42, title: "Figurine" };
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: article }),
    );

    const res = await getArticle(42);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/42");
    expect(res).toEqual(article);
  });
});

describe("listMyArticles", () => {
  it("GET /api/my/articles avec le Bearer token", async () => {
    const paginated = { data: [fullArticle], current_page: 1, last_page: 1, total: 1 };
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: paginated }),
    );

    const res = await listMyArticles("tok");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/my/articles");
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(res).toEqual(paginated);
  });
});

describe("createArticle", () => {
  it("POST multipart /api/articles avec un FormData (sans Content-Type JSON)", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: fullArticle }),
    );

    const image = new File(["x"], "card.png", { type: "image/png" });
    await createArticle("tok", {
      category_id: 1,
      title: "Carte",
      description: "desc",
      price: 12,
      shipping_cost: 3,
      images: [image],
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles");
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    const form = opts.body as FormData;
    expect(form.get("title")).toBe("Carte");
    expect(form.get("category_id")).toBe("1");
    expect(form.get("shipping_cost")).toBe("3");
    expect(form.getAll("images[]")).toHaveLength(1);
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("omet shipping_cost quand absent", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: fullArticle }),
    );

    await createArticle("tok", {
      category_id: 1,
      title: "Carte",
      description: "desc",
      price: 12,
    });

    const form = (fetchMock.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.has("shipping_cost")).toBe(false);
  });

  it("lève sur réponse non ok", async () => {
    fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false, status: 422 } as Response));

    await expect(
      createArticle("tok", { category_id: 1, title: "x", description: "y", price: 1 }),
    ).rejects.toThrow("422");
  });
});

describe("deleteArticle", () => {
  it("DELETE /api/articles/:id", async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ response_code: 200, status: "ok", message: "", data: null }),
    );

    await deleteArticle("tok", 9);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/9");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("DELETE");
  });
});
