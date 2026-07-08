import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import RoleBadge from "./RoleBadge";

describe("RoleBadge", () => {
  it("affiche le libellé traduit du rôle", () => {
    renderWithProviders(<RoleBadge role="buyer" />);
    expect(screen.getByText("Collector")).toBeInTheDocument();
  });

  it("accentue (coral) admin et moderator", () => {
    const { container } = renderWithProviders(<RoleBadge role="admin" />);
    expect(container.firstChild).toHaveClass("text-coral");
  });

  it("reste neutre pour buyer/seller", () => {
    const { container } = renderWithProviders(<RoleBadge role="seller" />);
    expect(container.firstChild).toHaveClass("text-secondary-foreground");
  });

  it("propage className", () => {
    const { container } = renderWithProviders(
      <RoleBadge role="moderator" className="mt-2" />,
    );
    expect(container.firstChild).toHaveClass("mt-2");
  });
});
