// Setup global des tests unitaires Vitest.
// - jest-dom : matchers DOM (toBeInTheDocument, toHaveTextContent, …)
// - cleanup : démonte les composants React entre chaque test (isolation)
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
