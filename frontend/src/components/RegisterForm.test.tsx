import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/render";
import RegisterForm from "./RegisterForm";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const register = vi.fn();
vi.mock("../services/auth.service", () => ({
  register: (...a: unknown[]) => register(...a),
}));

beforeEach(() => {
  navigate.mockReset();
  register.mockReset();
});

const fill = async () => {
  await userEvent.type(screen.getByLabelText("Full name"), "Jane Collector");
  await userEvent.type(screen.getByLabelText("Email"), "jane@x.co");
  await userEvent.type(screen.getByLabelText("Password"), "supersecret");
};

describe("RegisterForm", () => {
  it("crée le compte et redirige vers /login", async () => {
    register.mockResolvedValue({ user_info: { id: 1 } });
    renderWithProviders(<RegisterForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /create my account/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());
    expect(register.mock.calls[0][0]).toEqual({
      name: "Jane Collector",
      email: "jane@x.co",
      password: "supersecret",
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"));
  });

  it("affiche une alerte en cas d'échec", async () => {
    register.mockRejectedValue(new Error("422"));
    renderWithProviders(<RegisterForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /create my account/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
