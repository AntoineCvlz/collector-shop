import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lang", "en");
  });
});

test.describe("Écran de connexion", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");

    const form = page.getByRole("form", { name: "Sign in form" });
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(form.getByLabel("Email")).toBeVisible();
    await expect(form.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(form.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("affiche une erreur avec des identifiants invalides", async ({
    page,
  }) => {
    await page.route("**/api/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      }),
    );

    await page.goto("/login");

    const form = page.getByRole("form", { name: "Sign in form" });
    await form.getByLabel("Email").fill("inconnu@example.com");
    await form.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await form.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("redirige vers la connexion depuis l'accueil", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
