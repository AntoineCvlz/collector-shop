import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/render";
import LoginForm from "./LoginForm";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const login = vi.fn();
vi.mock("../services/auth.service", () => ({
  login: (...a: unknown[]) => login(...a),
}));

beforeEach(() => {
  navigate.mockReset();
  login.mockReset();
});
afterEach(() => localStorage.clear());

const fill = async () => {
  await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
  await userEvent.type(screen.getByLabelText("Password"), "secret12");
};

describe("LoginForm", () => {
  it("connecte, sauvegarde la session et redirige vers l'accueil", async () => {
    login.mockResolvedValue({
      token: "tok",
      user_info: { id: 1, name: "Alice", email: "a@b.co", roles: ["buyer"] },
    });
    renderWithProviders(<LoginForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(login.mock.calls[0][0]).toEqual({
      email: "a@b.co",
      password: "secret12",
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"));
    expect(localStorage.getItem("auth_token")).toBe("tok");
  });

  it("passe le bouton en état de chargement pendant la soumission", async () => {
    // Mutation qui ne se résout jamais → on observe l'état pending.
    login.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LoginForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("button", { name: /logging in/i })).toBeDisabled();
  });

  it("affiche une alerte si les identifiants sont invalides", async () => {
    login.mockRejectedValue(new Error("401"));
    renderWithProviders(<LoginForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
