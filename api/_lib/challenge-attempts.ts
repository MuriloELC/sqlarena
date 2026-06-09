import { getSupabaseAdmin } from "./supabase-admin";

export type DbChallenge = {
  id: string;
  title: string;
  expected_sql: string;
  allowed_tables: string[];
  base_points: number;
  is_active: boolean;
};

export type AttemptRecord = {
  attempt_id: string;
  points_awarded: number;
  already_completed: boolean;
  active_event_id: string | null;
};

export async function fetchActiveChallenge(challengeId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("challenges")
    .select("id, title, expected_sql, allowed_tables, base_points, is_active")
    .eq("id", challengeId)
    .maybeSingle();

  if (error) throw error;
  return data as DbChallenge | null;
}

export async function recordChallengeAttempt(input: {
  userId: string;
  challengeId: string;
  submittedSql: string;
  isCorrect: boolean;
  executionTimeMs: number;
  errorMessage?: string | null;
}) {
  const { data, error } = await (getSupabaseAdmin() as any).rpc("record_challenge_attempt", {
    p_user_id: input.userId,
    p_challenge_id: input.challengeId,
    p_submitted_sql: input.submittedSql,
    p_is_correct: input.isCorrect,
    p_execution_time_ms: input.executionTimeMs,
    p_error_message: input.errorMessage ?? null,
  });

  if (error) throw error;
  return data as AttemptRecord;
}
