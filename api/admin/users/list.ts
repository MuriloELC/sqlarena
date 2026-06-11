import { assertMethod, sendError } from "../../_lib/http.js";
import { queryAdminDb } from "../../_lib/admin-db.js";
import { requireAdmin } from "../../_lib/supabase-admin.js";

type AdminUserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: "student" | "admin";
  total_points: number;
  created_at: string;
  email: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
};

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "GET");
    await requireAdmin(req);

    const { rows } = await queryAdminDb<AdminUserRow>(`
      select
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.role,
        p.total_points,
        p.created_at,
        u.email,
        u.email_confirmed_at,
        u.last_sign_in_at
      from public.profiles p
      left join auth.users u on u.id = p.id
      order by
        case when p.role = 'admin' then 0 else 1 end,
        p.username asc
    `);

    return res.status(200).json({ users: rows });
  } catch (error) {
    return sendError(res, error);
  }
}
