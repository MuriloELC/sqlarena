export type SqlValue = string | number | boolean | null;
export type SqlRunStatus = "correct" | "incorrect" | "blocked" | "error";

export type SqlRunResult = {
  status: SqlRunStatus;
  message: string;
  awardedXp: number;
  alreadyCompleted: boolean;
  columns: string[];
  rows: Record<string, SqlValue>[];
  executionTimeMs: number;
  limited: boolean;
};

type ApiQueryResult = {
  columns: string[];
  rows: Record<string, SqlValue>[];
  execution_time_ms: number;
  limited: boolean;
};

type ExecuteResponse = {
  status: SqlRunStatus;
  message?: string;
  points_awarded?: number;
  already_completed?: boolean;
  execution_time_ms?: number;
  result?: ApiQueryResult;
};

export async function executeChallengeSql(challengeId: string, sql: string, accessToken: string): Promise<SqlRunResult> {
  const response = await fetch("/api/sql/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ challenge_id: challengeId, sql }),
  });

  const payload = await response.json().catch(() => null) as ExecuteResponse | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Nao foi possivel executar a query.");
  }

  return mapRunResult(payload);
}

export async function testExpectedSql(sql: string, allowedTables: string[], accessToken: string) {
  const response = await fetch("/api/admin/challenges/test-query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ sql, allowed_tables: allowedTables }),
  });

  const payload = await response.json().catch(() => null) as { status?: string; message?: string; result?: ApiQueryResult; warning?: string | null } | null;
  if (!response.ok || payload?.status === "blocked" || !payload?.result) {
    throw new Error(payload?.message ?? "Nao foi possivel testar a query.");
  }

  return {
    columns: payload.result.columns,
    rows: payload.result.rows,
    executionTimeMs: payload.result.execution_time_ms,
    limited: payload.result.limited,
    warning: payload.warning ?? null,
  };
}

function mapRunResult(payload: ExecuteResponse | null): SqlRunResult {
  const result = payload?.result;

  return {
    status: payload?.status ?? "error",
    message: payload?.message ?? "Nao foi possivel executar a query.",
    awardedXp: payload?.points_awarded ?? 0,
    alreadyCompleted: Boolean(payload?.already_completed),
    columns: result?.columns ?? [],
    rows: result?.rows ?? [],
    executionTimeMs: payload?.execution_time_ms ?? result?.execution_time_ms ?? 0,
    limited: Boolean(result?.limited),
  };
}
