import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
  return { useRouter: () => router, useSearchParams: () => new URLSearchParams(globalThis.window?.location.search ?? "") };
});
