import { describe, it, expect } from "vitest";
import { profileStrength } from "./profileStrength";
import type { UserInfo } from "../services/auth.service";

const base: UserInfo = {
  id: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  roles: ["buyer"],
};

describe("profileStrength", () => {
  it("renvoie 0 et tous les champs manquants pour un user null", () => {
    expect(profileStrength(null)).toEqual({
      score: 0,
      missing: ["name", "email", "roles"],
    });
  });

  it("renvoie 100 quand tout est renseigné", () => {
    expect(profileStrength(base)).toEqual({ score: 100, missing: [] });
  });

  it("compte un nom vide (ou espaces) comme manquant", () => {
    expect(profileStrength({ ...base, name: "   " })).toEqual({
      score: 67,
      missing: ["name"],
    });
  });

  it("compte un email vide comme manquant", () => {
    expect(profileStrength({ ...base, email: "" })).toEqual({
      score: 67,
      missing: ["email"],
    });
  });

  it("compte l'absence de rôle comme manquant", () => {
    expect(profileStrength({ ...base, roles: [] })).toEqual({
      score: 67,
      missing: ["roles"],
    });
  });

  it("arrondit le score quand plusieurs champs manquent", () => {
    expect(profileStrength({ ...base, email: "", roles: [] })).toEqual({
      score: 33,
      missing: ["email", "roles"],
    });
  });
});
