import type { Challenge, ChallengeType, Difficulty, LearningModule, ModuleStatus, PlatformEvent, UserProfile } from "../../../shared/types/sql-arena";
import { supabase } from "../../../lib/supabase";
import type { AppProfile } from "../../auth/AuthProvider";

type DbHint = {
  hint_order: number;
  content: string;
};

type DbChallenge = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  type: ChallengeType;
  difficulty: Difficulty;
  prompt: string;
  starter_sql: string | null;
  expected_sql: string;
  allowed_tables: string[];
  setup_sql: string | null;
  validation_sql: string | null;
  base_points: number;
  explanation: string | null;
  sort_order: number;
  challenge_hints?: DbHint[];
};

type DbModule = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  challenges?: DbChallenge[];
};

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
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, total_points")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

  return fetchCurrentProfile(profile.id);
}

export async function fetchLearningModules(userId: string): Promise<LearningModule[]> {
  const [{ data: modules, error }, { data: progress, error: progressError }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, description, sort_order, challenges(id, module_id, title, slug, type, difficulty, prompt, starter_sql, expected_sql, allowed_tables, setup_sql, validation_sql, base_points, explanation, sort_order, challenge_hints(hint_order, content))")
      .eq("is_active", true)
      .eq("challenges.is_active", true)
      .order("sort_order", { ascending: true })
      .order("sort_order", { ascending: true, referencedTable: "challenges" }),
    supabase
      .from("user_challenge_progress")
      .select("challenge_id")
      .eq("user_id", userId),
  ]);

  if (error) throw error;
  if (progressError) throw progressError;

  const completedIds = new Set((progress ?? []).map((item) => item.challenge_id as string));
  const mappedModules = ((modules ?? []) as DbModule[]).map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description ?? "",
    status: "locked" as ModuleStatus,
    challenges: (module.challenges ?? []).map((challenge) => mapChallenge(challenge, completedIds)),
  }));

  return applyUnlockRules(mappedModules);
}

export async function fetchChallenge(challengeId: string, userId: string) {
  const modules = await fetchLearningModules(userId);
  return modules.flatMap((module) => module.challenges).find((challenge) => challenge.id === challengeId) ?? null;
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

export async function fetchRanking(scope: "overall" | "weekly") {
  if (scope === "overall") {
    const { data, error } = await supabase
      .from("ranking_general")
      .select("user_id, username, display_name, avatar_url, points, completed_challenges")
      .limit(20);

    if (error) throw error;

    return (data ?? []).map((item) => ({
      id: item.user_id,
      name: item.display_name,
      username: item.username,
      avatar: item.display_name?.charAt(0)?.toUpperCase() || "U",
      avatarUrl: item.avatar_url,
      totalXp: Number(item.points ?? 0),
      weeklyXp: 0,
      completedChallenges: Number(item.completed_challenges ?? 0),
    }));
  }

  const weekStart = getWeekStartIso();
  const { data, error } = await supabase
    .from("point_events")
    .select("points, profiles(id, username, display_name, avatar_url)")
    .gte("created_at", weekStart);

  if (error) throw error;

  const grouped = new Map<string, { id: string; name: string; username: string; avatar: string; avatarUrl: string | null; weeklyXp: number; totalXp: number }>();
  for (const row of data ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) continue;
    const current = grouped.get(profile.id) ?? {
      id: profile.id,
      name: profile.display_name,
      username: profile.username,
      avatar: profile.display_name?.charAt(0)?.toUpperCase() || "U",
      avatarUrl: profile.avatar_url,
      weeklyXp: 0,
      totalXp: 0,
    };
    current.weeklyXp += Number(row.points ?? 0);
    grouped.set(profile.id, current);
  }

  return [...grouped.values()].sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 20);
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

function mapChallenge(challenge: DbChallenge, completedIds: Set<string>): Challenge {
  const type = challenge.type ?? "free_select";

  return {
    id: challenge.id,
    slug: challenge.slug,
    moduleId: challenge.module_id,
    type,
    title: challenge.title,
    statement: challenge.prompt,
    orderingHint: undefined,
    explanation: challenge.explanation ?? undefined,
    difficulty: challenge.difficulty,
    baseXp: challenge.base_points,
    status: completedIds.has(challenge.id) ? "completed" : "available",
    starterSql: challenge.starter_sql ?? getDefaultStarterSql(type, challenge.allowed_tables ?? []),
    expectedSql: challenge.expected_sql,
    setupSql: challenge.setup_sql,
    validationSql: challenge.validation_sql,
    expectedColumns: [],
    expectedRows: [],
    allowedTables: challenge.allowed_tables ?? [],
    hints: [...(challenge.challenge_hints ?? [])].sort((a, b) => a.hint_order - b.hint_order).map((hint) => hint.content),
  };
}

function getDefaultStarterSql(type: ChallengeType, allowedTables: string[]) {
  const table = allowedTables[0] ?? "customers";

  switch (type) {
    case "insert_rows":
      return `INSERT INTO ${table} (...)\nVALUES (...);`;
    case "update_rows":
      return `UPDATE ${table}\nSET ...\nWHERE ...;`;
    case "delete_rows":
      return `DELETE FROM ${table}\nWHERE ...;`;
    case "create_table":
      return `CREATE TABLE ${table} (\n  id uuid PRIMARY KEY\n);`;
    case "alter_table":
      return `ALTER TABLE ${table}\nADD COLUMN ...;`;
    case "drop_table":
      return `DROP TABLE ${table};`;
    case "free_select":
    default:
      return `SELECT \nFROM ${table}\nLIMIT 10;`;
  }
}

function applyUnlockRules(modules: LearningModule[]): LearningModule[] {
  return modules.map((module, moduleIndex) => {
    const previous = modules[moduleIndex - 1];
    const previousProgress = previous ? getModuleProgress(previous) : 100;
    const moduleUnlocked = moduleIndex === 0 || previousProgress >= 70;
    const challenges = module.challenges.map((challenge, challengeIndex) => {
      if (challenge.status === "completed") return challenge;
      if (!moduleUnlocked) return { ...challenge, status: "locked" as const };
      const previousChallengeDone = challengeIndex === 0 || module.challenges[challengeIndex - 1].status === "completed";
      return { ...challenge, status: previousChallengeDone ? "available" as const : "locked" as const };
    });
    const completed = challenges.filter((challenge) => challenge.status === "completed").length;
    const status: ModuleStatus = !moduleUnlocked ? "locked" : completed === challenges.length ? "completed" : "in-progress";
    return { ...module, status, challenges };
  });
}

function getModuleProgress(module: LearningModule) {
  if (!module.challenges.length) return 0;
  return Math.round((module.challenges.filter((challenge) => challenge.status === "completed").length / module.challenges.length) * 100);
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
