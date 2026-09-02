import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("@/components/connection-status", () => ({
  ConnectionStatus: () => <div>StudyCraft is connected</div>,
}));

it("introduces the working StudyCraft family learning experience", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "A calmer way to prepare, practise and remember.",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("StudyCraft is connected")).toBeInTheDocument();
  expect(screen.getByText("Grounded in their books")).toBeInTheDocument();
});
