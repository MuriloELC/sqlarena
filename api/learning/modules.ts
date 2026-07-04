import { assertMethod, sendError } from "../_lib/http.js";
import { getLearningModulesForUser } from "../_lib/learning.js";
import { authenticateRequest } from "../_lib/supabase-admin.js";

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "GET");
    const user = await authenticateRequest(req);
    const modules = await getLearningModulesForUser(user.id);
    return res.status(200).json({ modules });
  } catch (error) {
    return sendError(res, error);
  }
}
