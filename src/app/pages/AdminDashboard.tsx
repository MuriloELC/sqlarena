import { useEffect, useMemo, useState } from "react";
import { Users, Database, Zap, FileWarning, LineChart, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";

type AttemptRow = {
  challenge_id: string;
  is_correct: boolean;
  challenges?: { title: string; modules?: { title: string } | { title: string }[] | null } | { title: string; modules?: { title: string } | { title: string }[] | null }[] | null;
};

type ActiveEventRow = {
  title: string;
  description: string | null;
  multiplier: number | null;
  ends_at: string;
};

export function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activeChallenges: 0,
    attemptsToday: 0,
    accuracyRate: 0,
  });
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date().toISOString();

      const [
        usersResult,
        challengesResult,
        attemptsTodayResult,
        attemptsResult,
        activeEventResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("challenges").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("attempts").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("attempts").select("challenge_id, is_correct, challenges(title, modules(title))").order("created_at", { ascending: false }).limit(500),
        supabase
          .from("platform_events")
          .select("title, description, multiplier, ends_at")
          .eq("is_active", true)
          .eq("type", "points_multiplier")
          .lte("starts_at", now)
          .gte("ends_at", now)
          .order("ends_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const firstError = usersResult.error ?? challengesResult.error ?? attemptsTodayResult.error ?? attemptsResult.error ?? activeEventResult.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const rows = (attemptsResult.data ?? []) as AttemptRow[];
      const accuracyRate = rows.length ? Math.round((rows.filter((attempt) => attempt.is_correct).length / rows.length) * 100) : 0;
      setStats({
        users: usersResult.count ?? 0,
        activeChallenges: challengesResult.count ?? 0,
        attemptsToday: attemptsTodayResult.count ?? 0,
        accuracyRate,
      });
      setAttempts(rows);
      setActiveEvent(activeEventResult.data as ActiveEventRow | null);
      setLoading(false);
    };

    load();
  }, []);

  const hardestChallenges = useMemo(() => {
    const grouped = new Map<string, { title: string; module: string; total: number; errors: number }>();
    for (const attempt of attempts) {
      const challenge = Array.isArray(attempt.challenges) ? attempt.challenges[0] : attempt.challenges;
      if (!challenge) continue;
      const module = Array.isArray(challenge.modules) ? challenge.modules[0] : challenge.modules;
      const current = grouped.get(attempt.challenge_id) ?? { title: challenge.title, module: module?.title ?? "-", total: 0, errors: 0 };
      current.total += 1;
      if (!attempt.is_correct) current.errors += 1;
      grouped.set(attempt.challenge_id, current);
    }

    return [...grouped.values()]
      .filter((item) => item.total > 0)
      .sort((a, b) => (b.errors / b.total) - (a.errors / a.total))
      .slice(0, 4);
  }, [attempts]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando admin...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
          <LineChart className="w-8 h-8 text-purple-600" />
          Dashboard Admin
        </h1>
        <p className="text-zinc-500 mt-2">Visao geral da plataforma e atividades recentes.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total de Usuarios", value: String(stats.users), icon: Users, color: "text-blue-600 bg-blue-50" },
          { title: "Desafios Ativos", value: String(stats.activeChallenges), icon: Database, color: "text-indigo-600 bg-indigo-50" },
          { title: "Tentativas Hoje", value: String(stats.attemptsToday), icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { title: "Taxa de Acerto", value: `${stats.accuracyRate}%`, icon: Zap, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <Card key={stat.title} className="rounded-2xl border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">{stat.title}</p>
                  <p className="text-3xl font-extrabold text-zinc-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-zinc-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-red-500" />
              Desafios com Mais Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hardestChallenges.length ? hardestChallenges.map((item) => (
                <div key={`${item.title}-${item.module}`} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div>
                    <p className="font-bold text-zinc-900">{item.title}</p>
                    <p className="text-xs text-zinc-500">{item.module}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {Math.round((item.errors / item.total) * 100)}% erros
                  </span>
                </div>
              )) : (
                <p className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm font-semibold text-zinc-500">Ainda nao ha tentativas suficientes.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" fill="currentColor" />
              Evento Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeEvent ? (
              <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl font-extrabold">{activeEvent.multiplier ?? 1}x</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{activeEvent.title}</h3>
                    <p className="text-amber-50 text-sm mt-1">{activeEvent.description ?? "Multiplicador global de pontos ativo."}</p>
                  </div>
                </div>
                <div className="mt-6 text-sm font-semibold bg-black/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  Termina em: {new Date(activeEvent.ends_at).toLocaleString("pt-BR")}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center">
                <p className="text-sm font-semibold text-zinc-500">Nenhum evento ativo agora.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
