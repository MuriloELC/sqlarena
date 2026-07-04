import type { LearningModule, PlatformEvent, RankingUser, UserProfile } from "../../../shared/types/sql-arena";
import { supabase } from "../../../lib/supabase";
import type { AppProfile } from "../../auth/AuthProvider";

export async function fetchCurrentProfile(userId: string): Promise<UserProfile> {
  const [{ data: profile, error: profileError }, { data: completed }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, total_points")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_challenge_progress")
      .select("challenge_id")
      .eq("user_id", userId),
  ]);

  if (profileError) throw profileError;

  const weeklyXp = await fetchWeeklyPoints(userId);

  return {
    id: profile.id,
    name: profile.display_name,
    username: profile.username,
    avatar: profile.display_name?.charAt(0)?.toUpperCase() || "U",
    avatarUrl: profile.avatar_url,
    totalXp: profile.total_points ?? 0,
    weeklyXp,
    completedChallengeIds: (completed ?? []).map((item) => item.challenge_id as string),
  };
}

export async function fetchProfileByUsername(username: string): Promise<UserProfile | null> {
  const payload = await fetchAuthenticatedJson<{ profile: UserProfile | null }>(`/api/profiles/by-username?username=${encodeURIComponent(username)}`);
  return payload.profile;
}

export async function fetchLearningModules(userId: string): Promise<LearningModule[]> {
  void userId;
  const payload = await fetchAuthenticatedJson<{ modules: LearningModule[] }>("/api/learning/modules");
  return payload.modules;
}

export async function fetchChallenge(challengeId: string, userId: string) {
  const modules = await fetchLearningModules(userId);
  const challenge = modules.flatMap((module) => module.challenges).find((item) => item.id === challengeId) ?? null;
  return challenge?.status === "locked" ? null : challenge;
}

export async function fetchActiveEvent(): Promise<PlatformEvent | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("platform_events")
    .select("id, title, multiplier, ends_at, is_active")
    .eq("is_active", true)
    .eq("type", "points_multiplier")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("ends_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    multiplier: Number(data.multiplier ?? 1),
    endsAtLabel: new Date(data.ends_at).toLocaleString("pt-BR"),
    active: Boolean(data.is_active),
  };
}

export async function fetchRanking(scope: "overall" | "weekly"): Promise<RankingUser[]> {
  const payload = await fetchAuthenticatedJson<{ ranking: RankingUser[] }>(`/api/ranking?scope=${scope}`);
  return payload.ranking;
}

export async function fetchAttempts(userId: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("id, challenge_id, is_correct, execution_time_ms, error_message, points_awarded, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export function profileToUser(profile: AppProfile | null): UserProfile {
  return {
    id: profile?.id ?? "",
    name: profile?.display_name ?? "Usuario",
    username: profile?.username ?? "usuario",
    avatar: profile?.display_name?.charAt(0)?.toUpperCase() ?? "U",
    avatarUrl: profile?.avatar_url ?? null,
    totalXp: profile?.total_points ?? 0,
    weeklyXp: 0,
    completedChallengeIds: [],
  };
}

async function fetchWeeklyPoints(userId: string) {
  const { data, error } = await supabase
    .from("point_events")
    .select("points")
    .eq("user_id", userId)
    .gte("created_at", getWeekStartIso());

  if (error) return 0;
  return (data ?? []).reduce((sum, row) => sum + Number(row.points ?? 0), 0);
}

function getWeekStartIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

async function fetchAuthenticatedJson<T>(url: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessao expirada. Entre novamente.");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null) as (T & { message?: string }) | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Nao foi possivel carregar os dados.");
  }

  return payload as T;
}
