import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import ArticleCard from "./ArticleCard";
import type { Article } from "../services/article.service";

const base: Article = {
  id: 3,
  title: "Charizard",
  description: "…",
  price: "120.00",
  shipping_cost: "5.00",
  status: "published",
  published_at: null,
  category_id: 1,
  images: [],
};

describe("ArticleCard", () => {
  it("lie vers la fiche article et affiche le titre", () => {
    renderWithProviders(<ArticleCard article={base} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/articles/3");
    expect(screen.getByText("Charizard")).toBeInTheDocument();
  });

  it("affiche le prix et le total (prix + livraison)", () => {
    renderWithProviders(<ArticleCard article={base} />);
    expect(screen.getByText("€120.00")).toBeInTheDocument();
    expect(screen.getByText(/€125\.00/)).toBeInTheDocument();
  });

  it("affiche le nom du vendeur quand présent", () => {
    renderWithProviders(
      <ArticleCard article={{ ...base, seller: { id: 2, name: "Ash" } }} />,
    );
    expect(screen.getByText("Ash")).toBeInTheDocument();
  });

  it("retombe sur 0 quand shipping_cost est absent", () => {
    const { shipping_cost: _omit, ...noShip } = base;
    void _omit;
    renderWithProviders(<ArticleCard article={noShip as Article} />);
    expect(screen.getByText("+€0.00 ship")).toBeInTheDocument();
    expect(screen.getByText(/€120\.00 total/)).toBeInTheDocument();
  });

  it("montre le placeholder image quand aucune cover", () => {
    const { container } = renderWithProviders(<ArticleCard article={base} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("rend l'image de couverture quand disponible", () => {
    renderWithProviders(
      <ArticleCard
        article={{ ...base, images: [{ id: 1, url: "http://x/c.png", position: 0 }] }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "http://x/c.png");
  });
});
