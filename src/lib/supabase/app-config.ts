import "server-only";

import { createClient } from "@supabase/supabase-js";

const APPLICATION_NAME_KEY = "application_name";

export async function readApplicationName(): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", APPLICATION_NAME_KEY)
    .single();

  if (error || typeof data?.value !== "string" || data.value.length === 0) {
    throw new Error("Application configuration is unavailable");
  }

  return data.value;
}
