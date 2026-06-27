import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Check, CheckCircle2, Loader2, Lock, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/InputCardBadge";
import { DifficultyBadge } from "../../features/learning/components/DifficultyBadge";
import { fetchActiveEvent, fetchLearningModules } from "../../features/learning/data/supabase-catalog";
import { getModuleProgress } from "../../features/learning/utils/progress";
import type { LearningModule, PlatformEvent } from "../../shared/types/sql-arena";
import { useAuth } from "../../features/auth/AuthProvider";

export function Trail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchLearningModules(user.id), fetchActiveEvent()])
      .then(([modules, event]) => {
        setLearningModules(modules);
        setActiveEvent(event);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar a trilha."))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando trilha...</div>;
  }

  if (error) {
    return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>;
  }

  const eventMultiplier = activeEvent?.active ? activeEvent.multiplier : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6 lg:p-10">
      <div className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Trilha SQL</h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-500">Sua jornada do zero ao avancado. Complete desafios para desbloquear novos modulos.</p>
      </div>

      <div className="relative space-y-16 before:absolute before:inset-0 before:left-8 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-indigo-600 before:via-indigo-300 before:to-zinc-200 md:before:left-1/2 md:before:translate-x-0">
        {learningModules.map((module, moduleIndex) => {
          const progress = getModuleProgress(module);

          return (
            <section key={module.id} className="relative z-10">
              <div className="mb-8 md:mb-12 md:flex md:items-center md:justify-between">
                <div className="flex gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-4 shadow-sm md:w-2/3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${module.status === "completed" ? "bg-green-100 text-green-600" : module.status === "in-progress" ? "bg-indigo-100 text-indigo-600 ring-4 ring-indigo-50" : "bg-zinc-100 text-zinc-400"}`}>
                    {module.status === "completed" ? <Check className="h-6 w-6" /> : module.status === "locked" ? <Lock className="h-5 w-5" /> : <span className="text-lg font-bold">{moduleIndex + 1}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-zinc-900">Modulo {moduleIndex + 1}: {module.title}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{module.description}</p>
                    {module.status !== "locked" && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200">
                          <div className={`h-full rounded-full ${module.status === "completed" ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-zinc-500">{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pl-16 md:grid-cols-2 md:pl-0 lg:grid-cols-3">
                {module.challenges.map((challenge) => {
                  const isLocked = challenge.status === "locked";
                  const isCompleted = challenge.status === "completed";
                  const isAvailable = challenge.status === "available";

                  return (
                    <Card key={challenge.id} className={`transition-all ${isLocked ? "cursor-not-allowed bg-zinc-50 opacity-50 grayscale" : isAvailable ? "cursor-pointer bg-white ring-2 ring-transparent hover:border-indigo-400 hover:ring-indigo-100" : "cursor-pointer border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"}`} onClick={() => !isLocked && navigate(`/challenge/${challenge.id}`)}>
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <DifficultyBadge difficulty={challenge.difficulty} />
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {isLocked && <Lock className="h-4 w-4 text-zinc-400" />}
                        </div>
                        <h4 className="mb-4 flex-1 font-bold text-zinc-900">{challenge.title}</h4>
                        <div className="mt-auto flex items-center justify-between">
                          <span className={`flex items-center gap-1 text-sm font-bold ${isCompleted ? "text-zinc-500" : isLocked ? "text-zinc-400" : "text-indigo-600"}`}>
                            <Zap className="h-3.5 w-3.5" fill={isLocked ? "none" : "currentColor"} />
                            {challenge.baseXp * eventMultiplier} XP
                          </span>
                          {isAvailable && <Button size="sm" className="h-8 rounded-full px-4 text-xs font-bold">Comecar</Button>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
