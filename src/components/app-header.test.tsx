import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "./app-header";

describe("AppHeader logout", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it.each([
    ["parent", "/api/parent/logout"],
    ["child", "/api/child/logout"],
  ] as const)("preserves trusted-device access when a %s logs out", async (role, endpoint) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ signedOut: true })));
    render(<AppHeader role={role} childName="Asha" />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(endpoint, { method: "POST" }));
    expect(fetchMock).not.toHaveBeenCalledWith("/api/family/logout", expect.anything());
  });
});
