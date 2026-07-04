import { assertMethod, HttpError, sendError } from "../_lib/http.js";
import { getPublicProfileByUsername } from "../_lib/learning.js";
import { authenticateRequest } from "../_lib/supabase-admin.js";

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "GET");
    const user = await authenticateRequest(req);

    const username = Array.isArray(req.query?.username) ? req.query.username[0] : req.query?.username;
    if (typeof username !== "string" || !username.trim()) {
      throw new HttpError(400, "username e obrigatorio.");
    }

    const profile = await getPublicProfileByUsername(username.trim(), user.id);
    return res.status(200).json({ profile });
  } catch (error) {
    return sendError(res, error);
  }
}
