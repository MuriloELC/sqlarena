import { SqlValidationError } from "../../src/shared/sql-security.js";
import { fetchUnlockedChallenge, recordChallengeAttempt } from "../_lib/challenge-attempts.js";
import { assertMethod, HttpError, readBody, sendError } from "../_lib/http.js";
import { runChallengeQuery, runExpectedQuery, sameResult, type QueryResult } from "../_lib/query-runner.js";
import { authenticateRequest } from "../_lib/supabase-admin.js";

type ExecuteBody = {
  challenge_id?: string;
  sql?: string;
};

export default async function handler(req: any, res: any) {
  let userId: string | null = null;
  let challengeId: string | null = null;
  let submittedSql = "";
  let executionTimeMs = 1;
  let canRecordAttempt = false;

  try {
    assertMethod(req, "POST");
    const user = await authenticateRequest(req);
    userId = user.id;

    const body = readBody<ExecuteBody>(req);
    challengeId = typeof body.challenge_id === "string" ? body.challenge_id : null;
    submittedSql = typeof body.sql === "string" ? body.sql : "";

    if (!challengeId) throw new HttpError(400, "challenge_id e obrigatorio.");
    if (!submittedSql.trim()) throw new SqlValidationError("Consulta bloqueada: escreva uma query SQL antes de executar.");

    const challenge = await fetchUnlockedChallenge(challengeId, user.id);
    if (!challenge?.is_active) throw new HttpError(403, "Desafio bloqueado para este usuario.");
    canRecordAttempt = true;

    const executionConfig = {
      type: challenge.type,
      allowedTables: challenge.allowed_tables,
      setupSql: challenge.setup_sql,
      validationSql: challenge.validation_sql,
    };
    const userResult = await runChallengeQuery(submittedSql, executionConfig);
    executionTimeMs = userResult.execution_time_ms;
    const expectedResult = await runExpectedQuery(challenge.expected_sql, executionConfig);
    const isCorrect = sameResult(userResult, expectedResult);

    const attempt = await recordChallengeAttempt({
      userId,
      challengeId,
      submittedSql,
      isCorrect,
      executionTimeMs,
    });

    return res.status(200).json({
      status: isCorrect ? "correct" : "incorrect",
      is_correct: isCorrect,
      points_awarded: attempt.points_awarded,
      already_completed: attempt.already_completed,
      execution_time_ms: executionTimeMs,
      result: userResult,
      message: buildMessage(isCorrect, attempt.points_awarded, attempt.already_completed),
    });
  } catch (error) {
    if (canRecordAttempt && userId && challengeId && submittedSql) {
      await recordChallengeAttempt({
        userId,
        challengeId,
        submittedSql,
        isCorrect: false,
        executionTimeMs,
        errorMessage: error instanceof Error ? error.message : "Erro inesperado.",
      }).catch(() => undefined);
    }

    if (error instanceof SqlValidationError) {
      return res.status(200).json(emptyResult("blocked", error.message));
    }

    return sendError(res, error);
  }
}

function emptyResult(status: "blocked" | "error", message: string) {
  const result: QueryResult = {
    columns: [],
    rows: [],
    execution_time_ms: 1,
    limited: false,
  };

  return {
    status,
    is_correct: false,
    points_awarded: 0,
    already_completed: false,
    execution_time_ms: 1,
    result,
    message,
  };
}

function buildMessage(isCorrect: boolean, points: number, alreadyCompleted: boolean) {
  if (!isCorrect) {
    return "O resultado ainda nao corresponde ao esperado. Compare colunas, ordem das linhas e valores.";
  }
  if (alreadyCompleted) {
    return "Resposta correta. Este desafio ja foi concluido, entao nao gerou XP novamente.";
  }
  return `Resposta correta. Voce ganhou ${points} XP.`;
}
