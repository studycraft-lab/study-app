import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ adminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: mocks.adminClient }));

import { deleteQuestionBankVersion } from "./store";

function maybeSingleQuery(data: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.limit.mockReturnValue(query);
  return query;
}

describe("deleteQuestionBankVersion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an unused bank version owned by the family", async () => {
    const visible = maybeSingleQuery({ id: "bank-v1", bank_version: 1, chapter_title: "The Cell" });
    const emptyHistory = ["study_sessions", "study_attempts", "review_items", "question_reports"].map(() => maybeSingleQuery(null));
    const deletion = { delete: vi.fn(), eq: vi.fn().mockResolvedValue({ error: null }) };
    deletion.delete.mockReturnValue(deletion);
    let historyIndex = 0;
    mocks.adminClient.mockReturnValue({
      from: vi.fn((table: string) => table === "library_chapters" ? visible : table === "question_banks" ? deletion : emptyHistory[historyIndex++]),
    });

    await expect(deleteQuestionBankVersion({ id: "bank-v1", familyId: "family" }))
      .resolves.toEqual({ id: "bank-v1", bankVersion: 1, chapterTitle: "The Cell" });
    expect(deletion.eq).toHaveBeenCalledWith("id", "bank-v1");
  });

  it("preserves a bank version that has study history", async () => {
    const visible = maybeSingleQuery({ id: "bank-v1", bank_version: 1, chapter_title: "The Cell" });
    const histories = [maybeSingleQuery({ id: "session" }), maybeSingleQuery(null), maybeSingleQuery(null), maybeSingleQuery(null)];
    const deletion = { delete: vi.fn(), eq: vi.fn() };
    deletion.delete.mockReturnValue(deletion);
    let historyIndex = 0;
    mocks.adminClient.mockReturnValue({
      from: vi.fn((table: string) => table === "library_chapters" ? visible : table === "question_banks" ? deletion : histories[historyIndex++]),
    });

    await expect(deleteQuestionBankVersion({ id: "bank-v1", familyId: "family" }))
      .rejects.toThrow("A bank with study history cannot be deleted.");
    expect(deletion.delete).not.toHaveBeenCalled();
  });
});
