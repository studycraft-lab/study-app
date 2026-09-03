import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ adminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: mocks.adminClient }));

import { childLearningHistory } from "./store";

function query(result: unknown, terminal: "limit" | "lte" | "in") {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), lte: vi.fn(), in: vi.fn(),
  };
  Object.values(chain).forEach((method) => method.mockReturnValue(chain));
  chain[terminal].mockResolvedValue({ data: result, error: null });
  return chain;
}

describe("childLearningHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds chapter metadata and computes progress separately for each subject", async () => {
    const sessions = query([
      { id: "s1", question_bank_id: "history-bank", status: "completed", started_at: "2026-09-01", completed_at: "2026-09-01", total_questions: 1, question_ids: ["h1"] },
      { id: "s2", question_bank_id: "geography-bank", status: "in_progress", started_at: "2026-09-02", completed_at: null, total_questions: 2, question_ids: ["g1", "g2"] },
    ], "limit");
    const attempts = query([
      { id: "a2", session_id: "s2", question_bank_id: "geography-bank", question_id: "g1", question_prompt: "Water?", topic_ids: [], response: "", correct: false, earned_marks: 1, max_marks: 2, feedback: { reviewRequired: true }, attempted_at: "2026-09-02" },
      { id: "a1", session_id: "s1", question_bank_id: "history-bank", question_id: "h1", question_prompt: "Vedas?", topic_ids: [], response: "", correct: true, earned_marks: 1, max_marks: 1, feedback: {}, attempted_at: "2026-09-01" },
    ], "limit");
    const reviews = query([{ id: "r1", question_bank_id: "geography-bank" }], "lte");
    const chapters = query([
      { id: "history-bank", subject: "History", chapter_title: "Early Vedic" },
      { id: "geography-bank", subject: "Geography", chapter_title: "Major Water Bodies" },
    ], "in");
    mocks.adminClient.mockReturnValue({
      from: vi.fn((table: string) => ({ study_sessions: sessions, study_attempts: attempts, review_items: reviews, library_chapters: chapters })[table]),
    });

    const history = await childLearningHistory({ id: "child", displayName: "Asha", board: "ICSE", grade: 6, active: true, familyId: "family" });

    expect(history.sessions[0]).toMatchObject({ subject: "History", chapterTitle: "Early Vedic" });
    expect(history.sessions[1]).toMatchObject({ subject: "Geography", chapterTitle: "Major Water Bodies" });
    expect(history.subjects).toEqual([
      { subject: "Geography", completedSessions: 0, attempts: 1, accuracy: 50, mastery: 50, readyToPractice: 1, answersNeedingReview: 1 },
      { subject: "History", completedSessions: 1, attempts: 1, accuracy: 100, mastery: 100, readyToPractice: 0, answersNeedingReview: 0 },
    ]);
  });
});
