import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Database, Edit, Loader2, Play, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge, Card, Input } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";

type AdminChallengeRow = {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard" | "special";
  base_points: number;
  is_active: boolean;
  sort_order: number;
  modules?: { title: string } | { title: string }[] | null;
};

const difficultyLabels: Record<string, string> = {
  easy: "Facil",
  medium: "Medio",
  hard: "Dificil",
  special: "Especial",
};

export function AdminChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<AdminChallengeRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("challenges")
      .select("id, title, slug, difficulty, base_points, is_active, sort_order, modules(title)")
      .order("sort_order", { ascending: true });

    if (error) setError(error.message);
    else setChallenges((data ?? []) as AdminChallengeRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesSearch = !search || `${challenge.title} ${challenge.slug}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || (status === "active" ? challenge.is_active : !challenge.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [challenges, search, status]);

  const toggleActive = async (challenge: AdminChallengeRow) => {
    const { error } = await supabase.from("challenges").update({ is_active: !challenge.is_active }).eq("id", challenge.id);
    if (error) setError(error.message);
    else await loadChallenges();
  };

  const archiveChallenge = async (challenge: AdminChallengeRow) => {
    const { error } = await supabase.from("challenges").update({ is_active: false }).eq("id", challenge.id);
    if (error) setError(error.message);
    else await loadChallenges();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            Desafios
          </h1>
          <p className="text-zinc-500 mt-2">Gerencie e crie novos desafios para a plataforma.</p>
        </div>
        <Button onClick={() => navigate("/admin/challenges/new")} className="shrink-0 gap-2 h-11 px-6 text-sm">
          <Plus className="w-4 h-4" /> Criar Desafio
        </Button>
      </div>

      <Card className="rounded-2xl border-zinc-200 shadow-sm">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar desafios..." className="pl-9 bg-white" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 w-full md:w-40 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <option value="">Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando desafios...
          </div>
        ) : (
          <div className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">Ordem</th>
                  <th className="px-6 py-4">Titulo</th>
                  <th className="px-6 py-4">Modulo</th>
                  <th className="px-6 py-4">Dificuldade</th>
                  <th className="px-6 py-4 text-center">XP</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredChallenges.map((challenge) => {
                  const module = Array.isArray(challenge.modules) ? challenge.modules[0] : challenge.modules;
                  return (
                    <tr key={challenge.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4 text-center text-sm text-zinc-400 font-mono">{challenge.sort_order}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/admin/challenges/edit/${challenge.id}`)}>
                          {challenge.title}
                        </p>
                        <p className="mt-0.5 text-xs font-mono text-zinc-400">{challenge.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{module?.title ?? "-"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-zinc-100 text-xs font-semibold text-zinc-700">
                          {difficultyLabels[challenge.difficulty] ?? challenge.difficulty}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-indigo-600">{challenge.base_points}</td>
                      <td className="px-6 py-4 text-center">
                        {challenge.is_active ? (
                          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 shadow-none">Ativo</Badge>
                        ) : (
                          <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100 shadow-none">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600" onClick={() => navigate(`/admin/challenges/edit/${challenge.id}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-green-600" onClick={() => toggleActive(challenge)}>
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => archiveChallenge(challenge)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-sm text-zinc-500">
          Mostrando {filteredChallenges.length} de {challenges.length} desafios
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled>Proxima</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
