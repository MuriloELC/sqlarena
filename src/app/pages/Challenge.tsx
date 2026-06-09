import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Info, Loader2, Play, ShieldCheck, XCircle, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/InputCardBadge";
import { DifficultyBadge } from "../../features/learning/components/DifficultyBadge";
import { ResultTable } from "../../features/learning/components/ResultTable";
import { SchemaExplorer } from "../../features/learning/components/SchemaExplorer";
import { challengeSchema } from "../../features/learning/data/catalog";
import { fetchActiveEvent, fetchChallenge, fetchLearningModules } from "../../features/learning/data/supabase-catalog";
import { executeChallengeSql, type SqlRunResult } from "../../features/sql-runner/api-runner";
import type { Challenge as ChallengeType, LearningModule, PlatformEvent } from "../../shared/types/sql-arena";
import { useAuth } from "../../features/auth/AuthProvider";

export function Challenge() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session, user, refreshProfile } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("statement");
  const [sql, setSql] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<SqlRunResult | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    setIsLoadingChallenge(true);
    Promise.all([fetchChallenge(id, user.id), fetchLearningModules(user.id), fetchActiveEvent()])
      .then(([nextChallenge, modules, event]) => {
        if (!nextChallenge) throw new Error("Desafio nao encontrado ou inativo.");
        setChallenge(nextChallenge);
        setModule(modules.find((item) => item.id === nextChallenge.moduleId) ?? null);
        setActiveEvent(event);
        setSql(nextChallenge.starterSql);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Nao foi possivel carregar o desafio."))
      .finally(() => setIsLoadingChallenge(false));
  }, [id, user]);

  const lineNumbers = useMemo(() => sql.split("\n").map((_, index) => index + 1), [sql]);
  const isCorrect = runResult?.status === "correct";

  const handleRun = async () => {
    if (!challenge || !session?.access_token) return;
    setIsRunning(true);
    setRunResult(null);

    try {
      const result = await executeChallengeSql(challenge.id, sql, session.access_token);
      setRunResult(result);
      if (result.status === "correct") await refreshProfile();
    } catch (error) {
      setRunResult({
        status: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel executar a query.",
        awardedXp: 0,
        alreadyCompleted: false,
        columns: [],
        rows: [],
        executionTimeMs: 0,
        limited: false,
      });
    } finally {
      setIsRunning(false);
      setActiveTab("result");
    }
  };

  if (isLoadingChallenge) {
    return <div className="flex h-full items-center justify-center bg-zinc-50 text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando desafio...</div>;
  }

  if (loadError || !challenge) {
    return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{loadError ?? "Desafio nao encontrado."}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-zinc-50">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/trail")} className="rounded-full">
              <ArrowLeft className="h-5 w-5 text-zinc-500" />
            </Button>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  {module?.title ?? "Trilha SQL"}
                </Badge>
                <DifficultyBadge difficulty={challenge.difficulty} />
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                  <Zap className="h-3.5 w-3.5" fill="currentColor" />
                  {challenge.baseXp} XP
                </span>
              </div>
              <h1 className="truncate text-lg font-bold leading-tight text-zinc-900">{challenge.title}</h1>
            </div>
          </div>

          {activeEvent?.active && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              <Zap className="h-3.5 w-3.5" fill="currentColor" />
              <span>Evento ativo: {activeEvent.multiplier}x pontos. Este desafio vale {challenge.baseXp * activeEvent.multiplier} XP.</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[minmax(320px,38%)_1fr] md:grid-rows-1">
        <nav className="flex border-b border-zinc-200 bg-white md:hidden">
          {[
            ["statement", "Enunciado"],
            ["schema", "Tabelas"],
            ["editor", "Editor"],
            ["result", "Resultado"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex-1 border-b-2 px-2 py-3 text-sm font-semibold transition-colors ${activeTab === value ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        <aside className={`min-h-0 overflow-y-auto border-r border-zinc-200 bg-white p-5 md:block ${activeTab === "statement" || activeTab === "schema" ? "block" : "hidden"}`}>
          <section className={activeTab === "statement" ? "block" : "hidden md:block"}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900">
              <Info className="h-4 w-4 text-indigo-500" />
              Objetivo
            </h2>
            <p className="text-base font-medium leading-relaxed text-zinc-700">{challenge.statement}</p>
            {challenge.orderingHint && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="mb-1 font-semibold">Regra de ordenacao</p>
                <p>{challenge.orderingHint}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setHintOpen(!hintOpen)}
                className="flex w-full items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-left text-sm font-semibold text-zinc-600 transition-colors hover:text-indigo-600"
              >
                {hintOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Precisa de uma dica?
              </button>

              {hintOpen && (
                <div className="mt-2 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  {challenge.hints.map((hint, index) => (
                    <div key={hint} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">{index + 1}</span>
                      <p>{hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className={`mt-8 ${activeTab === "schema" ? "block" : "hidden md:block"}`}>
            <SchemaExplorer tables={challengeSchema.filter((table) => challenge.allowedTables.includes(table.name))} />
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[minmax(260px,1fr)_minmax(230px,40%)] bg-zinc-950 text-zinc-50">
          <section className={`min-h-0 flex-col ${activeTab === "editor" ? "flex" : "hidden md:flex"}`}>
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-400">query.sql</span>
                <span className="hidden items-center gap-1 text-xs text-emerald-400 sm:flex">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  SELECT-only
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSql("")} className="h-8 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  Limpar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSql(challenge.starterSql)} className="h-8 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  Restaurar
                </Button>
                <Button size="sm" onClick={handleRun} disabled={isRunning} className="h-8 gap-1.5 bg-green-600 font-bold text-white shadow-md shadow-green-900/20 hover:bg-green-500">
                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  Executar SQL
                  <kbd className="ml-2 hidden items-center rounded border border-green-500/30 bg-green-700/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-green-100 md:inline-flex">
                    Ctrl+Enter
                  </kbd>
                </Button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 font-mono text-sm leading-relaxed">
              <div className="absolute inset-y-0 left-0 flex w-12 select-none flex-col items-center border-r border-zinc-800 bg-zinc-900 py-4 text-zinc-600">
                {lineNumbers.map((line) => <span key={line}>{line}</span>)}
              </div>
              <textarea
                value={sql}
                onChange={(event) => setSql(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    handleRun();
                  }
                }}
                className="h-full w-full resize-none bg-transparent py-4 pl-16 pr-4 text-zinc-100 placeholder-zinc-700 focus:outline-none"
                spellCheck={false}
              />
            </div>
          </section>

          <section className={`min-h-0 flex-col border-t border-zinc-800 bg-white text-zinc-900 ${activeTab === "result" ? "flex" : "hidden md:flex"}`}>
            {runResult && (
              <div className={`flex items-center justify-between border-b px-4 py-2.5 ${isCorrect ? "border-green-200 bg-green-50" : runResult.status === "blocked" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-center gap-2">
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : runResult.status === "blocked" ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                  <span className={`text-sm font-bold ${isCorrect ? "text-green-800" : runResult.status === "blocked" ? "text-amber-800" : "text-red-800"}`}>
                    {runResult.message}
                  </span>
                </div>
                {isCorrect && (
                  <Button size="sm" className="h-8 gap-1" onClick={() => navigate("/trail")}>
                    Proximo desafio <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-500">
              <span>Resultado: {runResult?.rows.length ?? 0} linhas retornadas em {runResult?.executionTimeMs ?? 0}ms</span>
              <span>{runResult?.limited ? "Resultado limitado a 500 linhas" : "Limite MVP: 500 linhas"}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-white">
              {runResult?.rows.length ? (
                <div>
                  <ResultTable columns={runResult.columns} rows={runResult.rows} />
                  {isCorrect && challenge.explanation && (
                    <div className="m-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                      <p className="mb-1 font-bold">Por que funcionou</p>
                      <p>{challenge.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-400">
                  {runResult ? <XCircle className="mb-3 h-12 w-12 text-red-200" /> : <Play className="mb-3 h-12 w-12 opacity-20" />}
                  <p className="font-semibold text-zinc-600">{runResult ? "Nenhum resultado aprovado ainda." : "Execute sua query para ver os resultados aqui."}</p>
                  <p className="mt-1 max-w-md text-sm text-zinc-500">
                    {runResult ? "A validacao compara colunas, ordem das colunas, linhas, ordem das linhas e valores." : "Esta simulacao representa o contrato do endpoint /api/sql/execute."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
