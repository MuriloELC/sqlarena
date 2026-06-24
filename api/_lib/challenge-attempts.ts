import { queryAdminDb } from "./admin-db.js";

export type DbChallenge = {
  id: string;
  title: string;
  type: string;
  expected_sql: string;
  allowed_tables: string[];
  setup_sql: string | null;
  validation_sql: string | null;
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
  const { rows } = await queryAdminDb<DbChallenge>(
    `
      select id, title, type, expected_sql, allowed_tables, setup_sql, validation_sql, base_points, is_active
      from public.challenges
      where id = $1
        and is_active = true
      limit 1
    `,
    [challengeId],
  );

  return rows[0] ?? null;
}

export async function recordChallengeAttempt(input: {
  userId: string;
  challengeId: string;
  submittedSql: string;
  isCorrect: boolean;
  executionTimeMs: number;
  errorMessage?: string | null;
}) {
  const { rows } = await queryAdminDb<{ result: AttemptRecord }>(
    `
      select public.record_challenge_attempt(
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::boolean,
        $5::int,
        $6::text
      ) as result
    `,
    [
      input.userId,
      input.challengeId,
      input.submittedSql,
      input.isCorrect,
      input.executionTimeMs,
      input.errorMessage ?? null,
    ],
  );

  return rows[0].result;
}
