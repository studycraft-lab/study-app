import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const store = vi.hoisted(() => ({ deleteQuestionBankVersion: vi.fn(), listLibrary: vi.fn() }));
vi.mock("@/lib/question-bank/store", () => store);
vi.mock("@/lib/family/store", () => ({ getFamilyWorkspace: vi.fn().mockResolvedValue({ family: { id: "family" } }) }));

import { DELETE, GET } from "./route";

describe("GET /api/library", () => {
  afterEach(() => {
    delete process.env.PARENT_IMPORT_PASSPHRASE;
    vi.clearAllMocks();
  });

  it("lists imported chapters for an authorized parent", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    store.listLibrary.mockResolvedValue([{ id: "1", board: "ICSE", grade: 6, subject: "History", chapterTitle: "Early Vedic", questionCount: 12 }]);
    const response = await GET(new Request("http://localhost/api/library", { headers: { "x-studycraft-parent-passphrase": "secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ chapters: [{ questionCount: 12 }] });
  });

  it("deletes one exact bank version for an authorized parent", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    store.deleteQuestionBankVersion.mockResolvedValue({ id: "bank-v1", bankVersion: 1, chapterTitle: "The Cell" });

    const response = await DELETE(new Request("http://localhost/api/library", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ id: "bank-v1" }),
    }));

    expect(response.status).toBe(200);
    expect(store.deleteQuestionBankVersion).toHaveBeenCalledWith({ id: "bank-v1", familyId: "family" });
    await expect(response.json()).resolves.toMatchObject({ deleted: true, bankVersion: 1, chapterTitle: "The Cell" });
  });

  it("refuses to delete a bank version with study history", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    store.deleteQuestionBankVersion.mockRejectedValue(new Error("A bank with study history cannot be deleted."));

    const response = await DELETE(new Request("http://localhost/api/library", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ id: "bank-v1" }),
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ deleted: false, error: expect.stringMatching(/study history/i) });
  });
});
