import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Shield, ShieldOff, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge, Card, Input } from "../components/ui/InputCardBadge";
import { useAuth } from "../../features/auth/AuthProvider";

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

type ApiError = {
  message?: string;
};

export function AdminUsers() {
  const { session, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/list", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error((payload as ApiError).message ?? "Nao foi possivel carregar usuarios.");
      setUsers((payload.users ?? []) as AdminUserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [session?.access_token]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((item) => {
      if (!term) return true;
      return `${item.username} ${item.display_name} ${item.email ?? ""}`.toLowerCase().includes(term);
    });
  }, [search, users]);

  const setRole = async (target: AdminUserRow, role: AdminUserRow["role"]) => {
    if (!session?.access_token) return;

    setSavingUserId(target.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: target.id, role }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error((payload as ApiError).message ?? "Nao foi possivel alterar permissao.");

      setUsers((current) => current.map((item) => item.id === target.id ? { ...item, role } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel alterar permissao.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-zinc-900">
            <Users className="h-8 w-8 text-indigo-600" />
            Usuarios
          </h1>
          <p className="mt-2 text-zinc-500">Pesquise usuarios e altere permissao administrativa com protecao contra remover o ultimo admin.</p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border-zinc-200 shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50/50 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por username, nome ou email..." className="bg-white pl-9" />
          </div>
        </div>

        {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando usuarios...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">XP</th>
                  <th className="px-6 py-4 text-center">Role</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((item) => {
                  const fallback = item.display_name?.charAt(0)?.toUpperCase() || "U";
                  const isCurrentUser = item.id === currentUser?.id;
                  const saving = savingUserId === item.id;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-zinc-200">
                            {item.avatar_url && <AvatarImage src={item.avatar_url} alt={item.display_name} />}
                            <AvatarFallback className="bg-indigo-100 font-bold text-indigo-700">{fallback}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-zinc-900">
                              {item.display_name}
                              {isCurrentUser && <Badge variant="secondary" className="ml-2 bg-indigo-100 px-1.5 py-0 text-[10px] text-indigo-700">Voce</Badge>}
                            </p>
                            <p className="text-xs font-mono text-zinc-400">@{item.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        <p>{item.email ?? "-"}</p>
                        <p className="mt-0.5 text-xs">{item.email_confirmed_at ? "Confirmado" : "Pendente"}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">{item.total_points}</td>
                      <td className="px-6 py-4 text-center">
                        {item.role === "admin" ? (
                          <Badge className="bg-purple-50 text-purple-700 shadow-none hover:bg-purple-50">Admin</Badge>
                        ) : (
                          <Badge className="bg-zinc-100 text-zinc-600 shadow-none hover:bg-zinc-100">Aluno</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.role === "admin" ? (
                          <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setRole(item, "student")} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                            Remover admin
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800" onClick={() => setRole(item, "admin")} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                            Promover admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      </Card>
    </div>
  );
}
