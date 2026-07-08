import { test, expect } from "@playwright/test";

const buyer = {
  id: 7,
  name: "Alice Martin",
  email: "alice@example.com",
  roles: ["buyer"],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    window.localStorage.setItem("lang", "en");
    window.localStorage.setItem("auth_token", "fake-token");
    window.localStorage.setItem("auth_user", JSON.stringify(user));
  }, buyer);

  // GET /api/me — profil courant.
  await page.route("**/api/me", (route) =>
    route.fulfill({
      json: {
        response_code: 200,
        status: "success",
        message: "",
        user_info: buyer,
      },
    }),
  );
  // Endpoints secondaires de la page profil (intérêts buyer) — réponses vides.
  await page.route("**/api/me/interests", (route) =>
    route.fulfill({ json: { response_code: 200, status: "ok", message: "", data: [] } }),
  );
});

test.describe("Profil", () => {
  test("affiche les informations de l'utilisateur connecté", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: "Alice Martin" }),
    ).toBeVisible();
    await expect(page.getByText("alice@example.com").first()).toBeVisible();
    // Le formulaire d'édition est pré-rempli.
    await expect(page.getByLabel("Full name")).toHaveValue("Alice Martin");
  });

  test("redirige un invité vers /login", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    });

    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("met à jour le profil avec succès", async ({ page }) => {
    await page.route("**/api/profile", (route) =>
      route.fulfill({
        json: {
          response_code: 200,
          status: "success",
          message: "",
          user_info: { ...buyer, name: "Alice Dupont" },
        },
      }),
    );

    await page.goto("/profile");

    await page.getByLabel("Full name").fill("Alice Dupont");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Profile updated.")).toBeVisible();
  });

  test("affiche une erreur si la mise à jour échoue (422)", async ({ page }) => {
    await page.route("**/api/profile", (route) =>
      route.fulfill({ status: 422, json: { message: "Validation error" } }),
    );

    await page.goto("/profile");

    await page.getByLabel("Full name").fill("Al");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });
});
