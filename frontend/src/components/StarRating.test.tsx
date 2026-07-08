import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("affiche toujours 5 étoiles", () => {
    const { container } = render(<StarRating value={3} />);
    // 5 svg d'étoiles (lucide rend un <svg>).
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("mode lecture seule : aucun bouton cliquable", () => {
    render(<StarRating value={4} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("mode interactif : rend 5 boutons avec un aria-label lisible", () => {
    render(<StarRating value={0} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(screen.getByLabelText("1 star")).toBeInTheDocument();
    expect(screen.getByLabelText("5 stars")).toBeInTheDocument();
  });

  it("appelle onChange avec la note cliquée", async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("4 stars"));

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
