import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/components/informal-letter-experience", () => ({
  InformalLetterExperience: ({ childId }: { childId: string }) => <div>Informal Letters for {childId}</div>,
}));

import { childFromRequest } from "@/lib/family/request";
import InformalLettersPage from "./page";

const child = { id: "child-1", familyId: "family-1", displayName: "Learner", board: "ICSE", grade: 6, active: true };

describe("InformalLettersPage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sends an unsigned visitor to child login", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(null);
    await expect(InformalLettersPage()).rejects.toThrow("redirect:/login?role=child");
  });

  it("limits the lesson to Grade 6 children", async () => {
    vi.mocked(childFromRequest).mockResolvedValue({ ...child, grade: 5 });
    await expect(InformalLettersPage()).rejects.toThrow("redirect:/login?role=child");
  });

  it("opens the lesson for a Grade 6 child", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(child);
    render(await InformalLettersPage());
    expect(screen.getByText("Informal Letters for child-1")).toBeInTheDocument();
  });
});
