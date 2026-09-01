import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const reports = vi.hoisted(() => ({ dismissQuestionReport: vi.fn(), listOpenQuestionReports: vi.fn(), patchReportedQuestion: vi.fn() }));
vi.mock("@/lib/question-bank/reports", () => reports);

import { GET, PATCH } from "./route";

describe("parent question reports", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("rejects a parent request with the wrong passphrase", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const response = await GET(new Request("http://localhost", { headers: { "x-studycraft-parent-passphrase": "wrong" } }));
    expect(response.status).toBe(401);
  });

  it("creates a corrected bank version for an authorized patch", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    reports.patchReportedQuestion.mockResolvedValue({ bankId: "new-bank", bankVersion: 2 });
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" }, body: JSON.stringify({ reportId: "report", action: "patch", question: { prompt: "Corrected" } }) }));
    expect(response.status).toBe(200);
    expect(reports.patchReportedQuestion).toHaveBeenCalledWith("report", { prompt: "Corrected" });
  });
});
