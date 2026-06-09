import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Calendar, Code2, Loader2, Map, Medal, Trophy, Zap } from "lucide-react";
import { Badge, Card, CardContent } from "../components/ui/InputCardBadge";
import { getModuleProgress } from "../../features/learning/data/catalog";
import { fetchAttempts, fetchCurrentProfile, fetchLearningModules, fetchProfileByUsername, fetchRanking } from "../../features/learning/data/supabase-catalog";
import { formatXp } from "../../features/learning/utils/format";
import { useAuth } from "../../features/auth/AuthProvider";
import type { LearningModule, UserProfile } from "../../shared/types/sql-arena";

export function Profile() {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [overallPosition, setOverallPosition] = useState(0);
  const [weeklyPosition, setWeeklyPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const profilePromise = username && username !== "me" ? fetchProfileByUsername(username) : fetchCurrentProfile(user.id);
    profilePromise.then(async (nextProfile) => {
      if (!nextProfile) throw new Error("Perfil nao encontrado.");
      const [nextModules, nextAttempts, overall, weekly] = await Promise.all([
        fetchLearningModules(nextProfile.id),
        nextProfile.id === user.id ? fetchAttempts(nextProfile.id) : Promise.resolve([]),
        fetchRanking("overall"),
        fetchRanking("weekly"),
      ]);
      return { nextProfile, nextModules, nextAttempts, overall, weekly };
    })
      .then(({ nextProfile, nextModules, nextAttempts, overall, weekly }) => {
        setProfile(nextProfile);
        setModules(nextModules);
        setAttempts(nextAttempts);
        setOverallPosition(overall.findIndex((item) => item.id === nextProfile.id) + 1 || 0);
        setWeeklyPosition(weekly.findIndex((item) => item.id === nextProfile.id) + 1 || 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o perfil."))
      .finally(() => setLoading(false));
  }, [user, username]);

  if (loading) return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando perfil...</div>;
  if (error) return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-10">
      <Card className="overflow-hidden rounded-lg border-zinc-200 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500" />
        <CardContent className="relative px-8 pb-8 pt-0">
          <div className="relative z-10 -mt-14 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-indigo-100 shadow-md"><span className="text-4xl font-extrabold text-indigo-600">{profile.avatar}</span></div>
            <div className="flex-1 pb-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{profile.name}</h1>
              <p className="mt-1 flex items-center justify-center gap-2 font-medium text-zinc-500 sm:justify-start">@{profile.username}<span className="h-1 w-1 rounded-full bg-zinc-300" /><Calendar className="h-3.5 w-3.5" />Perfil educacional</p>
            </div>
            <Badge variant="secondary" className="mb-2 bg-indigo-50 px-4 py-1 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100">Nivel {Math.max(1, Math.floor(profile.totalXp / 250))}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500"><Trophy className="h-4 w-4 text-orange-500" />Estatisticas</h3>
            <div className="space-y-6">
              {[
                { label: "XP Total", value: `${formatXp(profile.totalXp)} XP`, icon: Zap, color: "bg-blue-50 text-blue-600" },
                { label: "Ranking Geral", value: overallPosition ? `#${overallPosition}` : "-", icon: Medal, color: "bg-amber-50 text-amber-600" },
                { label: "Semana", value: weeklyPosition ? `#${weeklyPosition}` : "-", icon: Trophy, color: "bg-orange-50 text-orange-600" },
                { label: "Desafios", value: String(profile.completedChallengeIds.length), icon: Code2, color: "bg-green-50 text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
                  <div><p className="text-xs font-semibold text-zinc-500">{stat.label}</p><p className="text-xl font-bold text-zinc-900">{stat.value}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 md:col-span-2">
          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500"><Map className="h-4 w-4 text-indigo-500" />Progresso por modulo</h3>
              <div className="space-y-5">
                {modules.map((module) => {
                  const progress = getModuleProgress(module);
                  return (
                    <div key={module.id}>
                      <div className="mb-2 flex justify-between text-sm font-medium"><span className="text-zinc-700">{module.title}</span><span className="text-zinc-500">{progress}%</span></div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${progress === 100 ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${progress}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500"><Zap className="h-4 w-4 text-yellow-500" />Atividade recente</h3>
              <div className="space-y-4">
                {attempts.length ? attempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${attempt.is_correct ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}><Code2 className="h-4 w-4" /></div>
                    <div><p className="text-sm font-medium text-zinc-900">{attempt.is_correct ? "Acertou" : "Tentou"} um desafio</p><p className="mt-0.5 text-xs text-zinc-500">{new Date(attempt.created_at).toLocaleString("pt-BR")} - {attempt.points_awarded} XP</p></div>
                  </div>
                )) : <p className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm font-medium text-zinc-500">Nenhuma tentativa registrada ainda.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
