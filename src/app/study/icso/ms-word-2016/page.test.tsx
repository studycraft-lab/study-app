import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/components/word-2016-lesson", () => ({ Word2016Lesson: ({ childName }: { childName: string }) => <div>Word lesson for {childName}</div> }));

import { childFromRequest } from "@/lib/family/request";
import Word2016Page from "./page";

const child = { id: "child-1", familyId: "family-1", displayName: "Asha", board: "ICSE", grade: 6, active: true };

describe("Word2016Page", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sends a visitor without a child session to child login", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(null);
    await expect(Word2016Page()).rejects.toThrow("redirect:/login?role=child");
  });

  it("limits this lesson to Grade 6 children", async () => {
    vi.mocked(childFromRequest).mockResolvedValue({ ...child, grade: 5 });
    await expect(Word2016Page()).rejects.toThrow("redirect:/login?role=child");
  });

  it("opens the lesson with the child's name", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(child);
    render(await Word2016Page());
    expect(screen.getByText("Word lesson for Asha")).toBeInTheDocument();
    expect(vi.mocked(childFromRequest).mock.calls[0][0].url).toContain("/study/icso/ms-word-2016");
  });
});
