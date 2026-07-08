import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lang", "en");
  });

  await page.route("**/api/categories", (route) =>
    route.fulfill({
      json: {
        response_code: 200,
        status: "ok",
        message: "",
        data: [{ id: 1, name: "Cards", slug: "cards" }],
      },
    }),
  );
  await page.route("**/api/articles**", (route) =>
    route.fulfill({
      json: {
        response_code: 200,
        status: "ok",
        message: "",
        data: {
          data: [
            {
              id: 1,
              title: "Charizard 1st edition",
              description: "…",
              price: "120.00",
              shipping_cost: "5.00",
              status: "published",
              published_at: "2026-01-01T00:00:00Z",
              category_id: 1,
              seller: { id: 2, name: "Seller" },
              images: [],
            },
          ],
          current_page: 1,
          last_page: 1,
          total: 1,
        },
      },
    }),
  );
});

const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

test.describe("Accessibilité (WCAG 2 A/AA)", () => {
  test("page d'accueil sans violation", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Charizard/ }),
    ).toBeVisible();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("page de connexion sans violation", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("form", { name: "Sign in form" }),
    ).toBeVisible();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("page d'inscription sans violation", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("form", { name: "Create account form" }),
    ).toBeVisible();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });
});
