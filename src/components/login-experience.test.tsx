import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginExperience } from "./login-experience";

describe("LoginExperience", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("offers independent child name and PIN sign-in without loading a parent-unlocked profile list", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ children: [] })));
    render(<LoginExperience />);

    fireEvent.click(screen.getByRole("button", { name: "ChildStudy a chapter" }));

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([input]) => String(input) !== "/api/child/profiles")).toBe(true);
  });

  it("uses full-width, touch-friendly fields for both child and parent sign in", () => {
    render(<LoginExperience />);
    fireEvent.click(screen.getByRole("button", { name: "ChildStudy a chapter" }));
    expect(screen.getByLabelText("Name")).toHaveClass("login-input");
    expect(screen.getByLabelText("PIN")).toHaveClass("login-input");

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(screen.getByRole("button", { name: "ParentManage children and content" }));
    expect(screen.getByLabelText("Family password")).toHaveClass("login-input");
  });
});
