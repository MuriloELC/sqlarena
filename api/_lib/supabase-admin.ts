import { createClient } from "@supabase/supabase-js";
import { getBearerToken, HttpError } from "./http.js";
import { queryAdminDb } from "./admin-db.js";

let client: ReturnType<typeof createClient> | null = null;

function getSupabaseApiKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && (serviceRoleKey.startsWith("eyJ") || serviceRoleKey.startsWith("sb_secret_"))) {
    return serviceRoleKey;
  }

  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
}

export function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.VITE_SUPABASE_URL;
  const key = getSupabaseApiKey();
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
  const { rows } = await queryAdminDb<{ role: "student" | "admin" }>(
    "select role from public.profiles where id = $1 limit 1",
    [user.id],
  );
  const profile = rows[0] ?? null;
  if (!profile || profile.role !== "admin") {
    throw new HttpError(403, "Acesso restrito a administradores.");
  }

  return user;
}
