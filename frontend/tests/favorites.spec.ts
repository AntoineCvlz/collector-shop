import { test, expect } from "@playwright/test";

const buyer = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  roles: ["buyer"],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    window.localStorage.setItem("lang", "en");
    window.localStorage.setItem("auth_token", "fake-token");
    window.localStorage.setItem("auth_user", JSON.stringify(user));
  }, buyer);
});

const article = (id: number, title: string) => ({
  id,
  title,
  description: "…",
  price: "20.00",
  shipping_cost: "4.00",
  status: "published",
  published_at: "2026-01-01T00:00:00Z",
  category_id: 1,
  seller: { id: 2, name: "Seller" },
  images: [],
});

const favorites = (articles: ReturnType<typeof article>[]) => ({
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

test.describe("Favoris", () => {
  test("affiche les articles favoris de l'utilisateur", async ({ page }) => {
    await page.route("**/api/me/favorites**", (route) =>
      route.fulfill({ json: favorites([article(1, "Saved card")]) }),
    );

    await page.goto("/favorites");

    await expect(page.getByRole("heading", { name: "Favourites" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Saved card/ })).toBeVisible();
  });

  test("état vide avec lien vers le catalogue", async ({ page }) => {
    await page.route("**/api/me/favorites**", (route) =>
      route.fulfill({ json: favorites([]) }),
    );

    await page.goto("/favorites");

    await expect(
      page.getByText("No favourites yet — tap the heart on any item to save it."),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Browse the catalogue" }),
    ).toBeVisible();
  });
});

test.describe("Favoris — accès non authentifié", () => {
  test("redirige vers /login sans session", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    });

    await page.goto("/favorites");

    await expect(page).toHaveURL(/\/login$/);
  });
});
