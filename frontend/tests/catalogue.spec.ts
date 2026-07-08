import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lang", "en");
  });
});

const article = (id: number, title: string, categoryId = 1) => ({
  id,
  title,
  description: "…",
  price: "12.00",
  shipping_cost: "3.00",
  status: "published",
  published_at: "2026-01-01T00:00:00Z",
  category_id: categoryId,
  seller: { id: 1, name: "Seller" },
  images: [],
});

const catalogue = (articles: ReturnType<typeof article>[]) => ({
  response_code: 200,
  status: "ok",
  message: "",
  data: {
    data: articles,
    current_page: 1,
    last_page: 1,
    total: articles.length,
  },
});

const categories = {
  response_code: 200,
  status: "ok",
  message: "",
  data: [
    { id: 1, name: "Cards", slug: "cards" },
    { id: 2, name: "Figurines", slug: "figurines" },
  ],
};

test.describe("Catalogue (accueil)", () => {
  test("affiche la grille d'articles renvoyée par l'API", async ({ page }) => {
    await page.route("**/api/categories", (route) =>
      route.fulfill({ json: categories }),
    );
    await page.route("**/api/articles**", (route) =>
      route.fulfill({
        json: catalogue([article(1, "Charizard 1st edition"), article(2, "Pikachu promo")]),
      }),
    );

    await page.goto("/");

    await expect(page.getByRole("link", { name: /Charizard 1st edition/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Pikachu promo/ })).toBeVisible();
  });

  test("filtre par catégorie : re-requête avec category_id", async ({ page }) => {
    await page.route("**/api/categories", (route) =>
      route.fulfill({ json: categories }),
    );

    await page.route("**/api/articles**", (route) => {
      const url = route.request().url();
      if (url.includes("category_id=2")) {
        return route.fulfill({ json: catalogue([article(3, "Goku figurine", 2)]) });
      }
      return route.fulfill({ json: catalogue([article(1, "Charizard 1st edition")]) });
    });

    await page.goto("/");
    await expect(page.getByRole("link", { name: /Charizard/ })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Categories" })
      .getByRole("button", { name: "Figurines" })
      .click();

    await expect(page.getByRole("link", { name: /Goku figurine/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Charizard/ })).toBeHidden();
  });

  test("état vide quand aucune catégorie ne contient d'articles", async ({ page }) => {
    await page.route("**/api/categories", (route) =>
      route.fulfill({ json: categories }),
    );
    await page.route("**/api/articles**", (route) =>
      route.fulfill({ json: catalogue([]) }),
    );

    await page.goto("/");

    await expect(page.getByText("No items in this category yet.")).toBeVisible();
  });

  test("erreur API sur le catalogue : pas de crash, état vide affiché", async ({ page }) => {
    await page.route("**/api/categories", (route) =>
      route.fulfill({ json: categories }),
    );
    await page.route("**/api/articles**", (route) =>
      route.fulfill({ status: 500, json: { message: "Server error" } }),
    );

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Find the piece you've been hunting for." }),
    ).toBeVisible();
    await expect(page.getByText("No items in this category yet.")).toBeVisible();
  });
});
