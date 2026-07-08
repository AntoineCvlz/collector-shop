import { describe, it, expect } from "vitest";
import {
  articleSchema,
  catalogueResponseSchema,
  loginResponseSchema,
  categoryListResponseSchema,
  userInfoSchema,
} from "./schemas";


const validArticle = {
  id: 1,
  title: "Charizard 1st edition",
  description: "Near mint",
  price: "120.00",
  shipping_cost: "5.00",
  status: "published",
  published_at: "2026-01-01T00:00:00Z",
  category_id: 2,
  category: { id: 2, name: "Cards", slug: "cards" },
  seller: { id: 3, name: "Ash" },
  images: [{ id: 10, url: "https://x/img.jpg", position: 0 }],
};

describe("articleSchema", () => {
  it("accepte un article conforme", () => {
    expect(() => articleSchema.parse(validArticle)).not.toThrow();
  });

  it("accepte category/seller absents (optionnels)", () => {
    const { category, seller, ...rest } = validArticle;
    void category;
    void seller;
    expect(() => articleSchema.parse(rest)).not.toThrow();
  });

  it("rejette un prix numérique (le backend renvoie une string)", () => {
    expect(() =>
      articleSchema.parse({ ...validArticle, price: 120 }),
    ).toThrow();
  });

  it("rejette un status inconnu", () => {
    expect(() =>
      articleSchema.parse({ ...validArticle, status: "archived" }),
    ).toThrow();
  });

  it("rejette un champ obligatoire manquant (title)", () => {
    const { title, ...rest } = validArticle;
    void title;
    expect(() => articleSchema.parse(rest)).toThrow();
  });
});

describe("catalogueResponseSchema (enveloppe + pagination)", () => {
  const validCatalogue = {
    response_code: 200,
    status: "success",
    message: "",
    data: {
      data: [validArticle],
      current_page: 1,
      last_page: 3,
      total: 42,
    },
  };

  it("accepte une réponse catalogue conforme", () => {
    expect(() => catalogueResponseSchema.parse(validCatalogue)).not.toThrow();
  });

  it("rejette une enveloppe sans response_code", () => {
    const { response_code, ...rest } = validCatalogue;
    void response_code;
    expect(() => catalogueResponseSchema.parse(rest)).toThrow();
  });

  it("rejette une pagination sans total", () => {
    const broken = {
      ...validCatalogue,
      data: { ...validCatalogue.data, total: undefined },
    };
    expect(() => catalogueResponseSchema.parse(broken)).toThrow();
  });
});

describe("loginResponseSchema", () => {
  it("accepte user_info + token au niveau racine", () => {
    expect(() =>
      loginResponseSchema.parse({
        response_code: 200,
        status: "success",
        message: "",
        user_info: { id: 1, name: "A", email: "a@b.c", roles: ["buyer"] },
        token: "abc",
      }),
    ).not.toThrow();
  });

  it("rejette un token manquant", () => {
    expect(() =>
      loginResponseSchema.parse({
        response_code: 200,
        status: "success",
        message: "",
        user_info: { id: 1, name: "A", email: "a@b.c", roles: ["buyer"] },
      }),
    ).toThrow();
  });
});

describe("userInfoSchema", () => {
  it("rejette un rôle inconnu", () => {
    expect(() =>
      userInfoSchema.parse({
        id: 1,
        name: "A",
        email: "a@b.c",
        roles: ["superadmin"],
      }),
    ).toThrow();
  });
});

describe("categoryListResponseSchema", () => {
  it("accepte une liste de catégories enveloppée", () => {
    expect(() =>
      categoryListResponseSchema.parse({
        response_code: 200,
        status: "success",
        message: "",
        data: [{ id: 1, name: "Cards", slug: "cards" }],
      }),
    ).not.toThrow();
  });
});
