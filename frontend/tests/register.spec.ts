import { test, expect } from "@playwright/test";

// Force English so the UI copy matches the assertions regardless of locale.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lang", "en");
  });
});

test.describe("Écran d'inscription", () => {
  test("affiche le formulaire d'inscription", async ({ page }) => {
    await page.goto("/register");

    const form = page.getByRole("form", { name: "Create account form" });
    await expect(
      page.getByRole("heading", { name: "Join Collector.shop" }),
    ).toBeVisible();
    await expect(form.getByLabel("Full name")).toBeVisible();
    await expect(form.getByLabel("Email")).toBeVisible();
    await expect(form.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      form.getByRole("button", { name: "Create my account" }),
    ).toBeVisible();
  });

  test("navigue entre connexion et inscription", async ({ page }) => {
    await page.goto("/login");
    // Lien interne au formulaire de connexion vers l'inscription.
    await page
      .getByRole("form", { name: "Sign in form" })
      .getByRole("link", { name: "Sign up" })
      .click();
    await expect(page).toHaveURL(/\/register$/);

    // Lien interne au formulaire d'inscription vers la connexion.
    await page
      .getByRole("form", { name: "Create account form" })
      .getByRole("link", { name: "Log in" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("affiche une erreur quand la création échoue", async ({ page }) => {
    // On force l'API à répondre en erreur pour rendre le test déterministe.
    await page.route("**/api/register", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ message: "Validation error" }),
      }),
    );

    await page.goto("/register");

    const form = page.getByRole("form", { name: "Create account form" });
    await form.getByLabel("Full name").fill("Jean Dupont");
    await form.getByLabel("Email").fill("jean@example.com");
    await form.getByLabel("Password", { exact: true }).fill("password123");
    await form.getByRole("button", { name: "Create my account" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });
});
