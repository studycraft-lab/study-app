import { beforeEach, describe, expect, it, vi } from "vitest";

import { readApplicationName } from "@/lib/supabase/app-config";

import { GET } from "./route";

vi.mock("@/lib/supabase/app-config", () => ({
  readApplicationName: vi.fn(),
}));

const mockedReadApplicationName = vi.mocked(readApplicationName);

describe("GET /api/health", () => {
  beforeEach(() => {
    mockedReadApplicationName.mockReset();
  });

  it("returns the application name read from Supabase", async () => {
    mockedReadApplicationName.mockResolvedValue("StudyCraft");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      appName: "StudyCraft",
      message: "StudyCraft is connected",
      status: "ok",
    });
  });

  it("returns a safe degraded response when Supabase is unavailable", async () => {
    mockedReadApplicationName.mockRejectedValue(
      new Error("sensitive infrastructure detail"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      appName: "StudyCraft",
      message: "StudyCraft cannot reach its study service right now.",
      status: "degraded",
    });
  });
});
