import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParentLibrary } from "./parent-library";

describe("ParentLibrary", () => {
  it("explains the Codex-to-JSON MVP flow and accepts a prepared bank", () => {
    render(<ParentLibrary />);
    expect(screen.getByRole("heading", { name: /content library/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/question-bank json/i)).toBeInTheDocument();
    expect(screen.getByText(/Codex/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /validate/i })).toBeDisabled();
  });
});
