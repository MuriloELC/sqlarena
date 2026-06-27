import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, CheckCircle2, Database, Eye, Loader2, Play, Save, XCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge, Card, CardContent, Input } from "../components/ui/InputCardBadge";
import { ResultTable } from "../../features/learning/components/ResultTable";
import { SchemaExplorer } from "../../features/learning/components/SchemaExplorer";
import { challengeSchema } from "../../features/learning/data/challenge-data";
import { testExpectedSql } from "../../features/sql-runner/api-runner";
import { useAuth } from "../../features/auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import type { ChallengeType } from "../../shared/types/sql-arena";

type ModuleOption = {
  id: string;
  title: string;
};

type ChallengeForm = {
  title: string;
  slug: string;
  moduleId: string;
  type: ChallengeType;
  difficulty: "easy" | "medium" | "hard" | "special";
  basePoints: number;
  prompt: string;
  explanation: string;
  hints: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: ChallengeForm = {
  title: "",
  slug: "",
  moduleId: "",
  type: "free_select",
  difficulty: "easy",
  basePoints: 10,
  prompt: "",
  explanation: "",
  hints: "",
  sortOrder: 1,
  isActive: false,
};

const challengeTypeOptions: { value: ChallengeType; label: string }[] = [
  { value: "free_select", label: "SELECT" },
  { value: "insert_rows", label: "INSERT" },
  { value: "update_rows", label: "UPDATE" },
  { value: "delete_rows", label: "DELETE" },
  { value: "create_table", label: "CREATE TABLE" },
  { value: "alter_table", label: "ALTER TABLE" },
  { value: "drop_table", label: "DROP TABLE" },
];

const starterDefaults: Record<ChallengeType, string> = {
  free_select: "SELECT \nFROM customers\nLIMIT 10;",
  insert_rows: "INSERT INTO products (...)\nVALUES (...);",
  update_rows: "UPDATE products\nSET ...\nWHERE ...;",
  delete_rows: "DELETE FROM products\nWHERE ...;",
  create_table: "CREATE TABLE suppliers (\n  id uuid PRIMARY KEY\n);",
  alter_table: "ALTER TABLE products\nADD COLUMN ...;",
  drop_table: "DROP TABLE staging_imports;",
};

function requiresValidationSql(type: ChallengeType) {
  return type !== "free_select";
}

export function AdminChallengeEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useAuth();
  const isNew = !id;

  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [form, setForm] = useState<ChallengeForm>(emptyForm);
  const [starterSql, setStarterSql] = useState(starterDefaults.free_select);
  const [expectedSql, setExpectedSql] = useState("SELECT full_name, email\nFROM customers\nLIMIT 5;");
  const [setupSql, setSetupSql] = useState("");
  const [validationSql, setValidationSql] = useState("");
  const [allowedTables, setAllowedTables] = useState(["customers"]);
  const [customAllowedTable, setCustomAllowedTable] = useState("");
  const [testResult, setTestResult] = useState<Awaited<ReturnType<typeof testExpectedSql>> | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: moduleRows, error: modulesError } = await supabase
        .from("modules")
        .select("id, title")
        .order("sort_order", { ascending: true });

      if (modulesError) {
        setSaveError(modulesError.message);
        setLoading(false);
        return;
      }

      const nextModules = (moduleRows ?? []) as ModuleOption[];
      setModules(nextModules);

      if (isNew) {
        setForm((current) => ({ ...current, moduleId: nextModules[0]?.id ?? "" }));
        setLoading(false);
        return;
      }

      const { data: challenge, error } = await supabase
        .from("challenges")
        .select("id, module_id, title, slug, type, difficulty, prompt, starter_sql, expected_sql, allowed_tables, setup_sql, validation_sql, base_points, explanation, is_active, sort_order, challenge_hints(hint_order, content)")
        .eq("id", id)
        .single();

      if (error) {
        setSaveError(error.message);
        setLoading(false);
        return;
      }

      const hints = [...(challenge.challenge_hints ?? [])]
        .sort((a, b) => Number(a.hint_order) - Number(b.hint_order))
        .map((hint) => hint.content)
        .join("\n");

      setForm({
        title: challenge.title,
        slug: challenge.slug,
        moduleId: challenge.module_id,
        type: challenge.type as ChallengeType,
        difficulty: challenge.difficulty,
        basePoints: challenge.base_points,
        prompt: challenge.prompt,
        explanation: challenge.explanation ?? "",
        hints,
        sortOrder: challenge.sort_order,
        isActive: challenge.is_active,
      });
      setStarterSql(challenge.starter_sql ?? starterDefaults[(challenge.type as ChallengeType) || "free_select"]);
      setExpectedSql(challenge.expected_sql);
      setSetupSql(challenge.setup_sql ?? "");
      setValidationSql(challenge.validation_sql ?? "");
      setAllowedTables(challenge.allowed_tables ?? []);
      setLoading(false);
    };

    load();
  }, [id, isNew]);

  const updateForm = <K extends keyof ChallengeForm>(key: K, value: ChallengeForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateType = (type: ChallengeType) => {
    setForm((current) => ({ ...current, type }));
    if (!starterSql.trim() || starterSql === starterDefaults[form.type]) {
      setStarterSql(starterDefaults[type]);
    }
  };

  const handleTest = async () => {
    if (!session?.access_token) return;
    try {
      setTestError(null);
      setTestResult(await testExpectedSql({
        sql: expectedSql,
        type: form.type,
        allowedTables,
        setupSql,
        validationSql,
      }, session.access_token));
    } catch (error) {
      setTestResult(null);
      setTestError(error instanceof Error ? error.message : "Nao foi possivel testar a query.");
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!form.title.trim() || !form.slug.trim() || !form.moduleId || !form.prompt.trim() || !expectedSql.trim() || !allowedTables.length) {
      setSaveError("Preencha titulo, slug, modulo, enunciado, solucao oficial e pelo menos uma tabela permitida.");
      return;
    }

    if (requiresValidationSql(form.type) && !validationSql.trim()) {
      setSaveError("Desafios INSERT/UPDATE/DELETE/DDL precisam de uma query de validacao.");
      return;
    }

    setSaving(true);
    const payload = {
      module_id: form.moduleId,
      title: form.title.trim(),
      slug: form.slug.trim(),
      type: form.type,
      difficulty: form.difficulty,
      prompt: form.prompt.trim(),
      starter_sql: starterSql.trim() || null,
      expected_sql: expectedSql.trim(),
      allowed_tables: allowedTables,
      setup_sql: setupSql.trim() || null,
      validation_sql: validationSql.trim() || null,
      base_points: Number(form.basePoints),
      explanation: form.explanation.trim() || null,
      is_active: form.isActive,
      sort_order: Number(form.sortOrder),
      updated_at: new Date().toISOString(),
    };

    const challengeResult = isNew
      ? await supabase.from("challenges").insert(payload).select("id").single()
      : await supabase.from("challenges").update(payload).eq("id", id).select("id").single();

    if (challengeResult.error) {
      setSaveError(challengeResult.error.message);
      setSaving(false);
      return;
    }

    const challengeId = challengeResult.data.id as string;
    const hints = form.hints.split("\n").map((hint) => hint.trim()).filter(Boolean);
    const deleteHints = await supabase.from("challenge_hints").delete().eq("challenge_id", challengeId);
    if (deleteHints.error) {
      setSaveError(deleteHints.error.message);
      setSaving(false);
      return;
    }

    if (hints.length) {
      const insertHints = await supabase.from("challenge_hints").insert(hints.map((hint, index) => ({
        challenge_id: challengeId,
        hint_order: index + 1,
        content: hint,
      })));
      if (insertHints.error) {
        setSaveError(insertHints.error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigate("/admin/challenges");
  };

  const toggleTable = (table: string) => {
    setAllowedTables((current) => current.includes(table) ? current.filter((item) => item !== table) : [...current, table]);
  };

  const addCustomAllowedTable = () => {
    const table = customAllowedTable.trim().toLowerCase();
    if (!/^[a-z_][a-z0-9_]*$/.test(table)) {
      setSaveError("Use nomes de tabela simples, com letras minusculas, numeros e underscore.");
      return;
    }
    setAllowedTables((current) => current.includes(table) ? current : [...current, table]);
    setCustomAllowedTable("");
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando desafio...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/challenges")} className="rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{isNew ? "Criar novo desafio" : "Editar desafio"}</h1>
            <p className="mt-1 text-sm text-zinc-500">Cadastre enunciado, seguranca, query esperada e teste antes de publicar.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="outline" className="h-10 gap-2 border-zinc-200 bg-white shadow-sm" onClick={handleTest}>
            <Eye className="h-4 w-4" /> Testar
          </Button>
          <Button className="h-10 gap-2 px-6 shadow-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar desafio
          </Button>
        </div>
      </div>

      {saveError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{saveError}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <div className="space-y-6">
          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 p-4 text-sm font-bold text-zinc-700">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Informacoes basicas
            </div>
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Titulo</span>
                  <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Ex: Clientes de Rondonia" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Slug</span>
                  <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="clientes-rondonia" />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-5">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-zinc-900">Modulo</span>
                  <select value={form.moduleId} onChange={(event) => updateForm("moduleId", event.target.value)} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Tipo</span>
                  <select value={form.type} onChange={(event) => updateType(event.target.value as ChallengeType)} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {challengeTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Dificuldade</span>
                  <select value={form.difficulty} onChange={(event) => updateForm("difficulty", event.target.value as ChallengeForm["difficulty"])} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="easy">Facil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Dificil</option>
                    <option value="special">Especial</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">XP base</span>
                  <Input type="number" value={form.basePoints} onChange={(event) => updateForm("basePoints", Number(event.target.value))} />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Ordem</span>
                  <Input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value))} />
                </label>
                <label className="flex items-end gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
                  Publicar desafio ativo
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-zinc-900">Enunciado</span>
                <textarea value={form.prompt} onChange={(event) => updateForm("prompt", event.target.value)} className="min-h-[120px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-zinc-900">SQL inicial do aluno</span>
                <textarea value={starterSql} onChange={(event) => setStarterSql(event.target.value)} className="min-h-[96px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" spellCheck={false} />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Dicas</span>
                  <textarea value={form.hints} onChange={(event) => updateForm("hints", event.target.value)} className="min-h-[96px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Uma dica por linha" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-900">Explicacao pos-acerto</span>
                  <textarea value={form.explanation} onChange={(event) => updateForm("explanation", event.target.value)} className="min-h-[96px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 p-4 text-sm font-bold text-zinc-700">
              <Database className="h-4 w-4 text-indigo-500" />
              Tabelas permitidas
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {challengeSchema.map((table) => (
                  <label key={table.name} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                    <input type="checkbox" checked={allowedTables.includes(table.name)} onChange={() => toggleTable(table.name)} />
                    {table.name}
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:flex-row">
                <Input value={customAllowedTable} onChange={(event) => setCustomAllowedTable(event.target.value)} placeholder="Tabela customizada: suppliers" className="bg-white" />
                <Button type="button" variant="outline" onClick={addCustomAllowedTable} className="shrink-0 bg-white">
                  Adicionar tabela
                </Button>
              </div>
              {allowedTables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedTables.map((table) => (
                    <Badge key={table} variant="secondary" className="bg-zinc-100 text-xs text-zinc-700">
                      {table}
                    </Badge>
                  ))}
                </div>
              )}
              <SchemaExplorer tables={challengeSchema.filter((table) => allowedTables.includes(table.name))} />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <Play className="h-4 w-4 text-green-500" fill="currentColor" />
              Validacao SQL
            </div>
            <Badge variant="secondary" className="bg-zinc-100 text-[10px] text-zinc-600">
              {challengeTypeOptions.find((option) => option.value === form.type)?.label ?? form.type}
            </Badge>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-900">Solucao oficial</label>
                <Button type="button" size="sm" onClick={handleTest} className="h-8 gap-1.5 bg-green-600 text-white hover:bg-green-500">
                  <Play className="h-3.5 w-3.5 fill-current" /> Testar query
                </Button>
              </div>
              <textarea value={expectedSql} onChange={(event) => setExpectedSql(event.target.value)} className="min-h-[260px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-relaxed text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" spellCheck={false} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900">Setup SQL do sandbox</label>
              <textarea value={setupSql} onChange={(event) => setSetupSql(event.target.value)} className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Opcional: CREATE TABLE staging_imports (...);" spellCheck={false} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900">Query de validacao final</label>
              <textarea value={validationSql} onChange={(event) => setValidationSql(event.target.value)} className="min-h-[160px] w-full resize-y rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Obrigatoria para INSERT/UPDATE/DELETE/DDL. Deve retornar o estado final esperado." spellCheck={false} />
            </div>

            {(testResult || testError) && (
              <div className={`rounded-lg border p-4 ${testError ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                <div className={`mb-3 flex items-center gap-2 text-sm font-bold ${testError ? "text-red-800" : "text-green-800"}`}>
                  {testError ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {testError ? "Query retornou erro" : "Query validada com sucesso"}
                </div>
                {testError ? (
                  <p className="text-sm text-red-700">{testError}</p>
                ) : testResult ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                      <div className="rounded border border-green-100 bg-white p-2 text-center">
                        <span className="mb-1 block text-zinc-500">Tempo</span>
                        <span className="font-mono text-green-700">{testResult.executionTimeMs}ms</span>
                      </div>
                      <div className="rounded border border-green-100 bg-white p-2 text-center">
                        <span className="mb-1 block text-zinc-500">Linhas</span>
                        <span className="font-mono text-green-700">{testResult.rows.length}</span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto rounded border border-green-100 bg-white">
                      <ResultTable columns={testResult.columns} rows={testResult.rows.slice(0, 5)} />
                    </div>
                    {testResult.warning && <p className="text-xs font-semibold text-amber-700">{testResult.warning}</p>}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
