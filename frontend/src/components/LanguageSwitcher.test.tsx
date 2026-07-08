import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/render";
import i18n from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("LanguageSwitcher", () => {
  it("rend un bouton par langue supportée", () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "en" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "fr" })).toBeInTheDocument();
  });

  it("marque la langue courante via aria-pressed", () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "en" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("change la langue au clic", async () => {
    renderWithProviders(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "fr" }));

    expect(i18n.resolvedLanguage).toBe("fr");
  });
});
