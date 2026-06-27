import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Loader2, Medal, Play, Trophy, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../components/ui/InputCardBadge";
import { DifficultyBadge } from "../../features/learning/components/DifficultyBadge";
import { formatXp } from "../../features/learning/utils/format";
import { getModuleProgress } from "../../features/learning/utils/progress";
import { fetchActiveEvent, fetchCurrentProfile, fetchLearningModules, fetchRanking } from "../../features/learning/data/supabase-catalog";
import type { LearningModule, PlatformEvent, UserProfile } from "../../shared/types/sql-arena";
import { useAuth } from "../../features/auth/AuthProvider";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null);
  const [weeklyPosition, setWeeklyPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchCurrentProfile(user.id), fetchLearningModules(user.id), fetchRanking("weekly"), fetchActiveEvent()])
      .then(([profile, nextModules, ranking, event]) => {
        setCurrentUser(profile);
        setModules(nextModules);
        setActiveEvent(event);
        setWeeklyPosition(ranking.findIndex((item) => item.id === user.id) + 1 || 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o dashboard."))
      .finally(() => setLoading(false));
  }, [user]);

  const nextChallenge = useMemo(() => modules.flatMap((module) => module.challenges).find((challenge) => challenge.status === "available") ?? modules[0]?.challenges[0], [modules]);
  const currentModule = modules.find((module) => module.id === nextChallenge?.moduleId);
  const moduleProgress = currentModule ? getModuleProgress(currentModule) : 0;
  const eventMultiplier = activeEvent?.active ? activeEvent.multiplier : 1;

  if (loading) return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando dashboard...</div>;
  if (error) return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>;
  if (!currentUser || !nextChallenge) return <div className="m-6 rounded-lg border border-zinc-200 bg-white p-6 text-zinc-600">Nenhuma trilha ativa encontrada no banco.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-10">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Bom ver voce de volta, {currentUser.name.split(" ")[0]}.</h1>
          <p className="mt-1 text-zinc-500">Continue de onde parou e avance mais um passo na trilha SQL.</p>
        </div>
        <Button size="lg" className="shrink-0 gap-2" onClick={() => navigate(`/challenge/${nextChallenge.id}`)}>
          Continuar trilha
          <Play className="h-4 w-4 fill-current" />
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-lg border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-zinc-600">Seu progresso</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100"><Zap className="h-4 w-4 text-indigo-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900">{formatXp(currentUser.totalXp)}</span>
              <span className="text-lg font-medium text-zinc-500">XP</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">Ganhos na semana</p>
                <p className="mt-1 text-lg font-bold text-zinc-900">+{formatXp(currentUser.weeklyXp)} XP</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">Desafios concluidos</p>
                <p className="mt-1 text-lg font-bold text-zinc-900">{currentUser.completedChallengeIds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-zinc-600">Ranking semanal</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100"><Trophy className="h-4 w-4 text-orange-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900">{weeklyPosition || "-"}o</span>
              <span className="text-lg font-medium text-zinc-500">Lugar</span>
            </div>
            <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-zinc-900"><Medal className="h-4 w-4 text-zinc-400" />Proxima meta</span>
                <span className="font-bold text-indigo-600">+40 XP</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-4/5 rounded-full bg-indigo-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-zinc-200 shadow-sm md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">{currentModule?.title ?? "Trilha SQL"}</Badge>
                  <DifficultyBadge difficulty={nextChallenge.difficulty} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{nextChallenge.title}</h3>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${moduleProgress}%` }} /></div>
                <p className="text-xs font-medium text-zinc-500">{moduleProgress}% do modulo concluido</p>
              </div>

              <div className="flex shrink-0 items-center gap-4 border-zinc-100 md:border-l md:pl-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">Proximo desafio</p>
                  <p className="text-xs text-zinc-500">Vale {nextChallenge.baseXp * eventMultiplier} XP{activeEvent?.active ? " com evento" : ""}</p>
                </div>
                <Button className="h-12 w-12 rounded-full p-0" onClick={() => navigate(`/challenge/${nextChallenge.id}`)}>
                  <Play className="ml-1 h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeEvent?.active && (
        <section className="flex flex-col items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white shadow-md sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-full bg-white/20 p-3"><Zap className="h-6 w-6 text-white" fill="currentColor" /></div>
            <div><h3 className="text-lg font-bold">{activeEvent.title}</h3><p className="mt-1 text-sm text-orange-50">Todos os desafios disponiveis estao valendo {activeEvent.multiplier}x XP.</p></div>
          </div>
          <div className="whitespace-nowrap rounded-lg bg-black/20 px-4 py-2 font-mono text-sm font-medium backdrop-blur-sm">Termina em {activeEvent.endsAtLabel}</div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Desafios recomendados</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {currentModule?.challenges.filter((challenge) => challenge.status !== "locked").slice(0, 3).map((challenge) => (
            <Card key={challenge.id} className="cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md" onClick={() => navigate(`/challenge/${challenge.id}`)}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between"><Badge variant="secondary" className="bg-zinc-100 text-xs font-medium text-zinc-600">{currentModule.title}</Badge><DifficultyBadge difficulty={challenge.difficulty} /></div>
                <h4 className="mb-1 font-bold text-zinc-900 transition-colors hover:text-indigo-600">{challenge.title}</h4>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm font-bold text-indigo-600"><Zap className="h-3.5 w-3.5" fill="currentColor" />{challenge.baseXp * eventMultiplier} XP</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400"><ChevronRight className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
