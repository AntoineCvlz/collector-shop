import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/render";
import FavoriteButton from "./FavoriteButton";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const addFavorite = vi.fn();
const removeFavorite = vi.fn();
vi.mock("../services/favorite.service", () => ({
  addFavorite: (...a: unknown[]) => addFavorite(...a),
  removeFavorite: (...a: unknown[]) => removeFavorite(...a),
}));

beforeEach(() => {
  navigate.mockReset();
  addFavorite.mockReset().mockResolvedValue(undefined);
  removeFavorite.mockReset().mockResolvedValue(undefined);
});
afterEach(() => localStorage.clear());

describe("FavoriteButton", () => {
  it("redirige un invité vers /login sans appeler l'API", async () => {
    renderWithProviders(<FavoriteButton articleId={1} />);

    await userEvent.click(screen.getByRole("button"));

    expect(navigate).toHaveBeenCalledWith("/login");
    expect(addFavorite).not.toHaveBeenCalled();
  });

  it("ajoute en favori (optimiste) pour un utilisateur connecté", async () => {
    localStorage.setItem("auth_token", "tok");
    renderWithProviders(<FavoriteButton articleId={7} />);

    const btn = screen.getByRole("button");
    await userEvent.click(btn);

    expect(btn).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith("tok", 7));
  });

  it("retire un favori déjà présent", async () => {
    localStorage.setItem("auth_token", "tok");
    renderWithProviders(<FavoriteButton articleId={7} initialFavorited />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith("tok", 7));
  });

  it("revient à l'état précédent si l'API échoue", async () => {
    localStorage.setItem("auth_token", "tok");
    addFavorite.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<FavoriteButton articleId={7} />);

    const btn = screen.getByRole("button");
    await userEvent.click(btn);

    await waitFor(() => expect(btn).toHaveAttribute("aria-pressed", "false"));
  });
});
