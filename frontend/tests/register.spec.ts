import { test, expect } from "@playwright/test";

test.describe("Écran d'inscription", () => {
  test("affiche le formulaire d'inscription", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Créer un compte" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nom")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Créer mon compte" }),
    ).toBeVisible();
  });

  test("navigue entre connexion et inscription", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/register$/);

    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("affiche une erreur quand la création échoue", async ({ page }) => {
    // L'API n'est pas disponible en E2E front : la requête échoue,
    // ce qui doit déclencher le message d'erreur.
    await page.goto("/register");

    await page.getByLabel("Nom").fill("Jean Dupont");
    await page.getByLabel("Email").fill("jean@example.com");
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });
});
