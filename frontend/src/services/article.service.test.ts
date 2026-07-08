import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listArticles, getArticle } from "./article.service";

// Fabrique une réponse fetch JSON réussie.
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

// Article complet conforme au contrat (article.service.ts valide désormais
// les réponses via les schémas Zod — cf. api/schemas.ts).
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
    // Le service "déballe" res.data → on récupère bien le paginé.
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
