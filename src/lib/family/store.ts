import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import { hashPin, verifyPin } from "./pin";

const FAMILY_KEY = "default-family";
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

export type ChildProfile = {
  id: string;
  displayName: string;
  board: string;
  grade: number;
  active: boolean;
};

type FamilyRow = { id: string; name: string };

function child(row: Record<string, unknown>): ChildProfile {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    board: String(row.board),
    grade: Number(row.grade),
    active: Boolean(row.active),
  };
}

export async function ensureFamily() {
  const client = adminClient();
  let { data: family, error: familyError } = await client.from("families").select("id,name").eq("family_key", FAMILY_KEY).maybeSingle();
  if (familyError) throw new Error(familyError.message);
  if (!family) {
    const created = await client.from("families").insert({ family_key: FAMILY_KEY, name: "Our family" }).select("id,name").single();
    family = created.data; familyError = created.error;
  }
  if (familyError || !family) throw new Error(familyError?.message ?? "Family could not be created.");

  const { error: parentError } = await client.from("parent_profiles")
    .upsert({ family_id: family.id, display_name: "Parent", role: "owner" }, { onConflict: "family_id", ignoreDuplicates: true });
  if (parentError) throw new Error(parentError.message);
  return family as FamilyRow;
}

export async function getFamilyWorkspace() {
  const family = await ensureFamily();
  const client = adminClient();
  const [{ data: parent, error: parentError }, { data: children, error: childError }] = await Promise.all([
    client.from("parent_profiles").select("display_name").eq("family_id", family.id).single(),
    client.from("child_profiles").select("id,display_name,board,grade,active").eq("family_id", family.id).order("created_at"),
  ]);
  if (parentError || childError) throw new Error(parentError?.message ?? childError?.message ?? "Family workspace is unavailable.");
  return { family: { id: family.id, name: family.name }, parent: { displayName: String(parent.display_name) }, children: (children ?? []).map(child) };
}

export async function listActiveChildren(): Promise<ChildProfile[]> {
  const family = await ensureFamily();
  const { data, error } = await adminClient().from("child_profiles")
    .select("id,display_name,board,grade,active").eq("family_id", family.id).eq("active", true).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(child);
}

export async function createChild(input: { displayName: string; board: string; grade: number; pin: string }): Promise<ChildProfile> {
  const family = await ensureFamily();
  const secured = hashPin(input.pin);
  const { data, error } = await adminClient().from("child_profiles").insert({
    family_id: family.id,
    display_name: input.displayName.trim(),
    board: input.board.trim(),
    grade: input.grade,
    pin_salt: secured.salt,
    pin_hash: secured.hash,
  }).select("id,display_name,board,grade,active").single();
  if (error || !data) throw new Error(error?.message ?? "Child could not be added.");
  return child(data);
}

export async function updateChild(input: { id: string; displayName: string; board: string; grade: number; active: boolean; pin?: string }): Promise<ChildProfile> {
  const family = await ensureFamily();
  const values: Record<string, unknown> = {
    display_name: input.displayName.trim(), board: input.board.trim(), grade: input.grade, active: input.active, updated_at: new Date().toISOString(),
  };
  if (input.pin) {
    const secured = hashPin(input.pin);
    values.pin_salt = secured.salt;
    values.pin_hash = secured.hash;
    values.failed_pin_attempts = 0;
    values.pin_locked_until = null;
  }
  const { data, error } = await adminClient().from("child_profiles").update(values)
    .eq("id", input.id).eq("family_id", family.id).select("id,display_name,board,grade,active").single();
  if (error || !data) throw new Error(error?.message ?? "Child could not be updated.");
  return child(data);
}

export async function authenticateChild(id: string, pin: string): Promise<ChildProfile | null> {
  const family = await ensureFamily();
  const client = adminClient();
  const { data, error } = await client.from("child_profiles")
    .select("id,display_name,board,grade,active,pin_salt,pin_hash,failed_pin_attempts,pin_locked_until")
    .eq("id", id).eq("family_id", family.id).eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.pin_locked_until && new Date(data.pin_locked_until).getTime() > Date.now()) throw new Error("Too many attempts. Try again in a few minutes.");

  if (!verifyPin(pin, data.pin_salt, data.pin_hash)) {
    const attempts = Number(data.failed_pin_attempts) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await client.from("child_profiles").update({ failed_pin_attempts: attempts >= MAX_FAILED_ATTEMPTS ? 0 : attempts, pin_locked_until: lockedUntil }).eq("id", id);
    return null;
  }

  await client.from("child_profiles").update({ failed_pin_attempts: 0, pin_locked_until: null }).eq("id", id);
  return child(data);
}

export async function authenticateChildByName(displayName: string, pin: string): Promise<ChildProfile | null> {
  const family = await ensureFamily();
  const client = adminClient();
  const { data, error } = await client.from("child_profiles")
    .select("id,display_name,board,grade,active,pin_salt,pin_hash,failed_pin_attempts,pin_locked_until")
    .eq("family_id", family.id).eq("active", true).ilike("display_name", displayName.trim()).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.pin_locked_until && new Date(data.pin_locked_until).getTime() > Date.now()) throw new Error("Too many attempts. Try again in a few minutes.");

  if (!verifyPin(pin, data.pin_salt, data.pin_hash)) {
    const attempts = Number(data.failed_pin_attempts) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await client.from("child_profiles").update({ failed_pin_attempts: attempts >= MAX_FAILED_ATTEMPTS ? 0 : attempts, pin_locked_until: lockedUntil }).eq("id", data.id);
    return null;
  }

  await client.from("child_profiles").update({ failed_pin_attempts: 0, pin_locked_until: null }).eq("id", data.id);
  return child(data);
}

export async function getActiveChild(id: string): Promise<(ChildProfile & { familyId: string }) | null> {
  const { data, error } = await adminClient().from("child_profiles")
    .select("id,family_id,display_name,board,grade,active").eq("id", id).eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ...child(data), familyId: String(data.family_id) } : null;
}
