import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Cas défensif isolé : quand i18n n'a pas encore résolu de langue
// (resolvedLanguage === undefined), le composant retombe sur "en".
// On mocke react-i18next uniquement pour ce fichier afin de forcer cet état.
vi.mock("react-i18next", async (orig) => ({
  ...(await orig<typeof import("react-i18next")>()),
  useTranslation: () => ({
    i18n: { resolvedLanguage: undefined, changeLanguage: vi.fn() },
  }),
}));

import LanguageSwitcher from "./LanguageSwitcher";

describe("LanguageSwitcher (fallback langue)", () => {
  it('considère "en" courant quand resolvedLanguage est undefined', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "en" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "fr" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
