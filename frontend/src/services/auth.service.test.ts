import { describe, it, expect } from "vitest";
import { fetchMock, ok, okRaw, fail, urlOf, optsOf } from "../test/fetch-mock";
import { login, register, getMe, updateProfile, logout } from "./auth.service";

const user = { id: 1, name: "Alice", email: "a@b.co", roles: ["buyer"] as const };

describe("auth.service", () => {
  it("login POST /api/login avec le payload sérialisé", async () => {
    fetchMock.mockReturnValueOnce(
      okRaw({ response_code: 200, status: "ok", message: "", user_info: user, token: "tok" }),
    );

    const res = await login({ email: "a@b.co", password: "secret12" });

    expect(urlOf()).toBe("/api/login");
    expect(optsOf().method).toBe("POST");
    expect(optsOf().body).toBe(JSON.stringify({ email: "a@b.co", password: "secret12" }));
    expect(res.token).toBe("tok");
  });

  it("register POST /api/register", async () => {
    fetchMock.mockReturnValueOnce(
      okRaw({ response_code: 200, status: "ok", message: "", user_info: user }),
    );

    const res = await register({ name: "Alice", email: "a@b.co", password: "secret12" });

    expect(urlOf()).toBe("/api/register");
    expect(optsOf().method).toBe("POST");
    expect(res.user_info).toEqual(user);
  });

  it("getMe GET /api/me avec le Bearer token", async () => {
    fetchMock.mockReturnValueOnce(
      okRaw({ response_code: 200, status: "ok", message: "", user_info: user }),
    );

    await getMe("tok");

    expect(urlOf()).toBe("/api/me");
    expect(optsOf().method).toBe("GET");
    expect((optsOf().headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("updateProfile PUT /api/profile", async () => {
    fetchMock.mockReturnValueOnce(
      okRaw({ response_code: 200, status: "ok", message: "", user_info: user }),
    );

    await updateProfile("tok", { name: "Bob" });

    expect(urlOf()).toBe("/api/profile");
    expect(optsOf().method).toBe("PUT");
    expect(optsOf().body).toBe(JSON.stringify({ name: "Bob" }));
  });

  it("logout POST /api/logout", async () => {
    fetchMock.mockReturnValueOnce(ok(null));

    await logout("tok");

    expect(urlOf()).toBe("/api/logout");
    expect(optsOf().method).toBe("POST");
  });

  it("propage une erreur HTTP", async () => {
    fetchMock.mockReturnValueOnce(fail(401));
    await expect(login({ email: "x", password: "y" })).rejects.toThrow("401");
  });
});
