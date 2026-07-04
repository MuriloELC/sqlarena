import { assertMethod, sendError } from "./_lib/http.js";
import { getRanking } from "./_lib/learning.js";
import { authenticateRequest } from "./_lib/supabase-admin.js";

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "GET");
    await authenticateRequest(req);

    const rawScope = Array.isArray(req.query?.scope) ? req.query.scope[0] : req.query?.scope;
    const scope = rawScope === "overall" || rawScope === "weekly" ? rawScope : "weekly";
    const ranking = await getRanking(scope);
    return res.status(200).json({ ranking });
  } catch (error) {
    return sendError(res, error);
  }
}
