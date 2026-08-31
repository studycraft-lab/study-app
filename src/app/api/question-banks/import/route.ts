import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";
import { importQuestionBank } from "@/lib/question-bank/store";
import { type BankMetadata, validateQuestionBank } from "@/lib/question-bank/validate";

function metadataFrom(value: unknown, fallback: BankMetadata): BankMetadata | null {
  if (typeof value !== "object" || value === null) return null;
  const input = value as Record<string, unknown>;
  const grade = Number(input.grade);
  if (!Number.isInteger(grade) || grade < 1) return null;
  const text = (key: string, fallbackValue: string) =>
    typeof input[key] === "string" && input[key].trim() ? input[key].trim() : fallbackValue;
  return {
    board: text("board", fallback.board),
    grade,
    subject: text("subject", fallback.subject),
    bookTitle: typeof input.bookTitle === "string" && input.bookTitle.trim() ? input.bookTitle.trim() : null,
    chapterNumber: Number.isInteger(input.chapterNumber) && Number(input.chapterNumber) > 0 ? Number(input.chapterNumber) : null,
    chapterTitle: text("chapterTitle", fallback.chapterTitle),
  };
}

export async function POST(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent import is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });

  try {
    const body = await request.json();
    const validation = validateQuestionBank(body?.bank);
    if (!validation.valid || !validation.value || !validation.preview) {
      return Response.json({ imported: false, errors: validation.errors }, { status: 422 });
    }
    const metadata = metadataFrom(body.metadata, validation.preview);
    if (!metadata) return Response.json({ imported: false, errors: ["Confirm a valid grade and chapter metadata."] }, { status: 422 });
    const result = await importQuestionBank(validation.value, metadata);
    return Response.json({ imported: true, ...result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return Response.json({ imported: false, error: message }, { status: 500 });
  }
}
