import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParentFamily } from "./parent-family";

describe("ParentFamily", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("opens the family workspace and exposes child profile management", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ family: { name: "Our family" }, parent: { displayName: "Parent" }, children: [{ id: "one", displayName: "Asha", board: "ICSE", grade: 6, active: true }] })));
    render(<ParentFamily />);
    fireEvent.change(screen.getByLabelText(/parent passphrase/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /open family workspace/i }));
    expect(await screen.findByText("Our family")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Asha")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /add a child/i })).toBeInTheDocument();
  });
});
