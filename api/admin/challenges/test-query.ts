import { SqlValidationError } from "../../../src/shared/sql-security.js";
import { assertMethod, readBody, sendError } from "../../_lib/http.js";
import { runExpectedQuery } from "../../_lib/query-runner.js";
import { requireAdmin } from "../../_lib/supabase-admin.js";

type TestQueryBody = {
  sql?: string;
  type?: string;
  allowed_tables?: string[];
  setup_sql?: string | null;
  validation_sql?: string | null;
};

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "POST");
    await requireAdmin(req);

    const body = readBody<TestQueryBody>(req);
    const sql = typeof body.sql === "string" ? body.sql : "";
    const type = typeof body.type === "string" ? body.type : "free_select";
    const allowedTables = Array.isArray(body.allowed_tables) ? body.allowed_tables.filter((item) => typeof item === "string") : [];
    const setupSql = typeof body.setup_sql === "string" ? body.setup_sql : null;
    const validationSql = typeof body.validation_sql === "string" ? body.validation_sql : null;

    const result = await runExpectedQuery(sql, {
      type,
      allowedTables,
      setupSql,
      validationSql,
    });
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
