import { test, expect } from "@playwright/test";

test.describe("Écran de connexion", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Connexion" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se connecter" }),
    ).toBeVisible();
  });

  test("affiche une erreur avec des identifiants invalides", async ({
    page,
  }) => {
    // On force l'API à répondre 401 pour rendre le test déterministe,
    // indépendamment de l'état réel du backend.
    await page.route("**/api/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      }),
    );

    await page.goto("/login");

    await page.getByLabel("Email").fill("inconnu@example.com");
    await page.getByLabel("Mot de passe").fill("wrongpassword");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("redirige vers la connexion depuis l'accueil", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
