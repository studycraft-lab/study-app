import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/components/icso-foundations-lesson", () => ({ IcsoFoundationsLesson: ({ childName }: { childName: string }) => <div>History lesson for {childName}</div> }));

import { childFromRequest } from "@/lib/family/request";
import HistoryGenerationsPage from "./page";

const child = { id: "child-1", familyId: "family-1", displayName: "Asha", board: "ICSE", grade: 6, active: true };

describe("HistoryGenerationsPage", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires a Grade 6 child and renders the lesson", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(null);
    await expect(HistoryGenerationsPage()).rejects.toThrow("redirect:/login?role=child");
    vi.mocked(childFromRequest).mockResolvedValue({ ...child, grade: 5 });
    await expect(HistoryGenerationsPage()).rejects.toThrow("redirect:/login?role=child");
    vi.mocked(childFromRequest).mockResolvedValue(child);
    render(await HistoryGenerationsPage());
    expect(screen.getByText("History lesson for Asha")).toBeInTheDocument();
  });
});
