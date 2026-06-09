import { createClient } from "@supabase/supabase-js";
import { getBearerToken, HttpError } from "./http";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new HttpError(500, "Supabase server-side nao configurado.");
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export async function authenticateRequest(req: any) {
  const token = getBearerToken(req);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Sessao ausente ou invalida.");
  }

  return data.user;
}

export async function requireAdmin(req: any) {
  const user = await authenticateRequest(req);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  const profile = data as { role?: string } | null;
  if (!profile || profile.role !== "admin") {
    throw new HttpError(403, "Acesso restrito a administradores.");
  }

  return user;
}
