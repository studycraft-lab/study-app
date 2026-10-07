import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/components/html-css-scratch-lesson", () => ({ HtmlCssScratchLesson: ({ childName }: { childName: string }) => <div>ICSO lesson for {childName}</div> }));

import { childFromRequest } from "@/lib/family/request";
import HtmlCssScratchPage from "./page";

const child = { id: "child-1", familyId: "family-1", displayName: "Asha", board: "ICSE", grade: 6, active: true };

describe("HtmlCssScratchPage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires a Grade 6 child session", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(null);
    await expect(HtmlCssScratchPage()).rejects.toThrow("redirect:/login?role=child");
    vi.mocked(childFromRequest).mockResolvedValue({ ...child, grade: 5 });
    await expect(HtmlCssScratchPage()).rejects.toThrow("redirect:/login?role=child");
  });

  it("opens the lesson for a Grade 6 child", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(child);
    render(await HtmlCssScratchPage());
    expect(screen.getByText("ICSO lesson for Asha")).toBeInTheDocument();
    expect(vi.mocked(childFromRequest).mock.calls[0][0].url).toContain("/study/icso/html-css-scratch");
  });
});
