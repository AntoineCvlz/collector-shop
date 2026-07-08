import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
