import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  clearSession,
  getToken,
  getUser,
  isAuthenticated,
  hasRole,
  isAdmin,
  isSeller,
  isBuyer,
  isModerator,
  canModerate,
} from "./auth";
import type { UserInfo } from "../services/auth.service";

const buyer: UserInfo = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  roles: ["buyer"],
};

const adminUser: UserInfo = {
  id: 2,
  name: "Bob",
  email: "bob@example.com",
  roles: ["admin", "seller"],
};

describe("session persistence", () => {
  beforeEach(() => localStorage.clear());

  it("saveSession stocke le token et l'utilisateur, getToken/getUser les relisent", () => {
    saveSession("tok-123", buyer);
    expect(getToken()).toBe("tok-123");
    expect(getUser()).toEqual(buyer);
  });

  it("clearSession efface token et utilisateur", () => {
    saveSession("tok-123", buyer);
    clearSession();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });

  it("getUser renvoie null si aucune session", () => {
    expect(getUser()).toBeNull();
  });

  it("getUser renvoie null (sans crash) si le JSON stocké est corrompu", () => {
    localStorage.setItem("auth_user", "{not-json");
    expect(getUser()).toBeNull();
  });

  it("isAuthenticated reflète la présence d'un token", () => {
    expect(isAuthenticated()).toBe(false);
    saveSession("tok", buyer);
    expect(isAuthenticated()).toBe(true);
  });
});

describe("rôles", () => {
  it("hasRole vrai si le rôle est présent", () => {
    expect(hasRole("buyer", buyer)).toBe(true);
    expect(hasRole("admin", buyer)).toBe(false);
  });

  it("hasRole gère un utilisateur null sans crash", () => {
    expect(hasRole("buyer", null)).toBe(false);
  });

  it("helpers de rôle dédiés", () => {
    expect(isBuyer(buyer)).toBe(true);
    expect(isAdmin(buyer)).toBe(false);
    expect(isAdmin(adminUser)).toBe(true);
    expect(isSeller(adminUser)).toBe(true);
    expect(isModerator(adminUser)).toBe(false);
  });

  it("canModerate vrai pour admin ou moderator", () => {
    expect(canModerate(adminUser)).toBe(true);
    expect(canModerate(buyer)).toBe(false);
    expect(canModerate({ ...buyer, roles: ["moderator"] })).toBe(true);
  });

  it("les helpers lisent la session courante par défaut", () => {
    localStorage.clear();
    saveSession("tok", adminUser);
    expect(isAdmin()).toBe(true);
    expect(canModerate()).toBe(true);
  });
});
