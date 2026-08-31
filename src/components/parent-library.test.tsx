import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParentLibrary } from "./parent-library";

describe("ParentLibrary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains the Codex-to-JSON MVP flow and accepts a prepared bank", () => {
    render(<ParentLibrary />);
    expect(screen.getByRole("heading", { name: /content library/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/question-bank json/i)).toBeInTheDocument();
    expect(screen.getByText(/Codex/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /validate/i })).toBeDisabled();
  });

  it("clears an earlier library error after a successful retry", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "permission denied for view library_chapters" }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ chapters: [] }), { status: 200 }));
    render(<ParentLibrary />);
    fireEvent.change(screen.getByLabelText(/parent passphrase/i), { target: { value: "secret" } });

    fireEvent.click(screen.getByRole("button", { name: /refresh library/i }));
    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /refresh library/i }));
    await waitFor(() => expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument());
  });
});
