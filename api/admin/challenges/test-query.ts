import { SqlValidationError } from "../../../src/shared/sql-security";
import { assertMethod, readBody, sendError } from "../../_lib/http";
import { runExpectedQuery } from "../../_lib/query-runner";
import { requireAdmin } from "../../_lib/supabase-admin";

type TestQueryBody = {
  sql?: string;
  allowed_tables?: string[];
};

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "POST");
    await requireAdmin(req);

    const body = readBody<TestQueryBody>(req);
    const sql = typeof body.sql === "string" ? body.sql : "";
    const allowedTables = Array.isArray(body.allowed_tables) ? body.allowed_tables.filter((item) => typeof item === "string") : [];

    const result = await runExpectedQuery(sql, allowedTables);
    return res.status(200).json({
      status: "ok",
      result,
      warning: result.limited ? "Resultado limitado a 500 linhas. Revise o desafio antes de publicar." : null,
    });
  } catch (error) {
    if (error instanceof SqlValidationError) {
      return res.status(200).json({ status: "blocked", message: error.message });
    }

    return sendError(res, error);
  }
}
