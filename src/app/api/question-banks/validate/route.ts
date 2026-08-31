import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";
import { validateQuestionBank } from "@/lib/question-bank/validate";

export async function POST(request: Request) {
  if (!parentAuthConfigured()) {
    return Response.json({ error: "Parent imports are not configured." }, { status: 503 });
  }
  if (!isParentAuthorized(request)) {
    return Response.json({ error: "Incorrect family admin passphrase." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ valid: false, errors: ["The uploaded file is not valid JSON."], warnings: [], preview: null }, { status: 400 });
  }

  const result = validateQuestionBank(input);
  return Response.json(
    { valid: result.valid, errors: result.errors, warnings: result.warnings, preview: result.preview },
    { status: result.valid ? 200 : 422 },
  );
}
