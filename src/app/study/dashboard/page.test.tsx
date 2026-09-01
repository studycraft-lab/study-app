import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/child-dashboard", () => ({ ChildDashboard: () => <div>Child progress dashboard</div> }));

import StudyDashboardPage from "./page";

describe("StudyDashboardPage", () => {
  it("renders the child progress dashboard instead of redirecting to study", () => {
    render(<StudyDashboardPage />);
    expect(screen.getByText("Child progress dashboard")).toBeInTheDocument();
  });
});
