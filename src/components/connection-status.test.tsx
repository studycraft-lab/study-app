import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionStatus } from "./connection-status";

describe("connection status", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the live application name and connected state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            appName: "StudyCraft",
            message: "StudyCraft is connected",
            status: "ok",
          }),
          { status: 200 },
        ),
      ),
    );

    render(<ConnectionStatus />);

    expect(screen.getByText("Checking the study service…")).toBeInTheDocument();
    expect(await screen.findByText("StudyCraft is connected")).toBeInTheDocument();
    expect(screen.getByText("Live configuration: StudyCraft")).toBeInTheDocument();
  });

  it("shows a safe error state when the health check fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            appName: "StudyCraft",
            message: "StudyCraft cannot reach its study service right now.",
            status: "degraded",
          }),
          { status: 503 },
        ),
      ),
    );

    render(<ConnectionStatus />);

    expect(
      await screen.findByText(
        "StudyCraft cannot reach its study service right now.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument();
  });
});
