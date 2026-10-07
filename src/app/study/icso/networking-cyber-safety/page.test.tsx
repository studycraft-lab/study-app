import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/components/icso-concept-lesson", () => ({ IcsoConceptLesson: ({ childName }: { childName: string }) => <div>ICSO lesson for {childName}</div> }));

import { childFromRequest } from "@/lib/family/request";
import NetworkingCyberSafetyPage from "./page";

const child = { id: "child-1", familyId: "family-1", displayName: "Asha", board: "ICSE", grade: 6, active: true };

describe("NetworkingCyberSafetyPage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires a Grade 6 child session and opens the lesson for that child", async () => {
    vi.mocked(childFromRequest).mockResolvedValue(null);
    await expect(NetworkingCyberSafetyPage()).rejects.toThrow("redirect:/login?role=child");
    vi.mocked(childFromRequest).mockResolvedValue({ ...child, grade: 5 });
    await expect(NetworkingCyberSafetyPage()).rejects.toThrow("redirect:/login?role=child");
    vi.mocked(childFromRequest).mockResolvedValue(child);
    render(await NetworkingCyberSafetyPage());
    expect(screen.getByText("ICSO lesson for Asha")).toBeInTheDocument();
  });
});
