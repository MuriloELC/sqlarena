import { assertMethod, HttpError, readBody, sendError } from "../../_lib/http.js";
import { withAdminDbClient } from "../../_lib/admin-db.js";
import { requireAdmin } from "../../_lib/supabase-admin.js";

type SetRoleBody = {
  user_id?: string;
  role?: "student" | "admin";
};

export default async function handler(req: any, res: any) {
  try {
    assertMethod(req, "POST");
    await requireAdmin(req);

    const body = readBody<SetRoleBody>(req);
    if (typeof body.user_id !== "string" || !body.user_id) {
      throw new HttpError(400, "user_id e obrigatorio.");
    }
    if (body.role !== "student" && body.role !== "admin") {
      throw new HttpError(400, "role invalida.");
    }

    const user = await withAdminDbClient(async (client) => {
      await client.query("begin");
      try {
        const current = await client.query<{ id: string; role: "student" | "admin" }>(
          "select id, role from public.profiles where id = $1 for update",
          [body.user_id],
        );
        if (!current.rowCount) throw new HttpError(404, "Usuario nao encontrado.");

        if (current.rows[0].role === "admin" && body.role === "student") {
          await client.query("select id from public.profiles where role = 'admin' for update");
          const admins = await client.query<{ count: string }>("select count(*)::text as count from public.profiles where role = 'admin'");
          if (Number(admins.rows[0].count) <= 1) {
            throw new HttpError(400, "Nao e possivel remover o ultimo administrador.");
          }
        }

        const updated = await client.query<{
          id: string;
          username: string;
          display_name: string;
          role: "student" | "admin";
        }>(
          `
            update public.profiles
            set role = $2, updated_at = now()
            where id = $1
            returning id, username, display_name, role
          `,
          [body.user_id, body.role],
        );
        await client.query("commit");
        return updated.rows[0];
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      }
    });

    return res.status(200).json({ user });
  } catch (error) {
    return sendError(res, error);
  }
}
