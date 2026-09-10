import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/parent-session-review", () => ({
  ParentSessionReview: () => <div>Score appeal review workspace</div>,
}));

import ParentSessionReviewPage from "./page";

describe("ParentSessionReviewPage", () => {
  it("renders the score appeal review instead of redirecting to family profiles", () => {
    render(<ParentSessionReviewPage />);
    expect(screen.getByText("Score appeal review workspace")).toBeInTheDocument();
  });
});
