import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  adminClient: vi.fn(),
  validateQuestionBank: vi.fn((value: unknown) => ({ valid: true, value, errors: [] })),
}));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: mocks.adminClient }));
vi.mock("./validate", () => ({ validateQuestionBank: mocks.validateQuestionBank }));
vi.mock("./store", () => ({ getQuestionBankForChild: vi.fn() }));

import { disableReportedQuestion } from "./reports";

function singleResult(value: unknown) {
  const chain = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: value, error: null }) };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
  return chain;
}

describe("disableReportedQuestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes and resolves the disable in one database transaction", async () => {
    const reportQuery = singleResult({ id: "report", question_bank_id: "old-bank", question_id: "q1", question_version: 1 });
    const reportedBankQuery = singleResult({ external_id: "bank", version: 1, payload: {} });
    const latestBankQuery = {
      select: vi.fn(), eq: vi.fn(), order: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: "old-bank", version: 1, payload: {
        schemaVersion: "1.0", bank: { id: "bank", version: 1, status: "reviewed" },
        questions: [{ id: "q1", version: 1, status: "active" }], sources: [], topics: [],
      } }], error: null }),
    };
    latestBankQuery.select.mockReturnValue(latestBankQuery); latestBankQuery.eq.mockReturnValue(latestBankQuery); latestBankQuery.order.mockReturnValue(latestBankQuery);
    let bankCalls = 0;
    const rpc = vi.fn().mockResolvedValue({ data: { bankId: "new-bank", bankVersion: 2 }, error: null });
    mocks.adminClient.mockReturnValue({
      from: vi.fn((table: string) => table === "question_reports" ? reportQuery : bankCalls++ === 0 ? reportedBankQuery : latestBankQuery),
      rpc,
    });

    await expect(disableReportedQuestion({ reportId: "report", familyId: "family", resolverName: "Parent" }))
      .resolves.toEqual({ bankId: "new-bank", bankVersion: 2 });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("disable_reported_question", expect.objectContaining({ p_report_id: "report", p_family_id: "family" }));
  });
});
