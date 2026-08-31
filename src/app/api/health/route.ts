import { readApplicationName } from "@/lib/supabase/app-config";

const FALLBACK_APPLICATION_NAME = "StudyCraft";
const UNAVAILABLE_MESSAGE =
  "StudyCraft cannot reach its study service right now.";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const appName = await readApplicationName();

    return Response.json({
      appName,
      message: `${appName} is connected`,
      status: "ok",
    });
  } catch {
    return Response.json(
      {
        appName: FALLBACK_APPLICATION_NAME,
        message: UNAVAILABLE_MESSAGE,
        status: "degraded",
      },
      { status: 503 },
    );
  }
}
