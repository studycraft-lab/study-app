import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { listLibrary } = vi.hoisted(() => ({ listLibrary: vi.fn() }));
vi.mock("@/lib/question-bank/store", () => ({ listLibrary }));

import { GET } from "./route";

describe("GET /api/library", () => {
  afterEach(() => {
    delete process.env.PARENT_IMPORT_PASSPHRASE;
    vi.clearAllMocks();
  });

  it("lists imported chapters for an authorized parent", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    listLibrary.mockResolvedValue([{ id: "1", board: "ICSE", grade: 6, subject: "History", chapterTitle: "Early Vedic", questionCount: 12 }]);
    const response = await GET(new Request("http://localhost/api/library", { headers: { "x-studycraft-parent-passphrase": "secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ chapters: [{ questionCount: 12 }] });
  });
});
