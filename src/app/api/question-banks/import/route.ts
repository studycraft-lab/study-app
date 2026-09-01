import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";
import { importQuestionBank } from "@/lib/question-bank/store";
import { type BankMetadata, type ValidatedQuestionBank, validateQuestionBank } from "@/lib/question-bank/validate";

const MAX_VERSION_ADVANCES = 100;
const VERSION_COLLISION_MESSAGES = new Set([
  "A non-draft bank cannot be replaced. Increase the bank version.",
  "A bank with study history cannot be replaced. Increase the bank version.",
]);

function isVersionCollision(error: unknown) {
  return error instanceof Error && VERSION_COLLISION_MESSAGES.has(error.message);
}

function withBankVersion(bank: ValidatedQuestionBank, version: number): ValidatedQuestionBank {
  return { ...bank, bank: { ...bank.bank, version } };
}

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
    const requestedVersion = validation.preview.bankVersion;
    let importedVersion = requestedVersion;
    let result;
    for (let advance = 0; advance <= MAX_VERSION_ADVANCES; advance += 1) {
      importedVersion = requestedVersion + advance;
      try {
        result = await importQuestionBank(withBankVersion(validation.value, importedVersion), metadata);
        break;
      } catch (error) {
        if (!isVersionCollision(error) || advance === MAX_VERSION_ADVANCES) throw error;
      }
    }
    if (!result) throw new Error("Could not allocate a question-bank version.");
    return Response.json({
      imported: true,
      ...result,
      requestedVersion,
      importedVersion,
      versionAdjusted: importedVersion !== requestedVersion,
    }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return Response.json({ imported: false, error: message }, { status: 500 });
  }
}
