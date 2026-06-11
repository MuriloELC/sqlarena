import { useEffect, useMemo, useState } from "react";
import { BookOpen, Edit, Loader2, Pause, Play, Plus, Save, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge, Card, CardContent, Input } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";

type TrackRow = {
  id: string;
  title: string;
  slug: string;
};

type ModuleRow = {
  id: string;
  track_id: string;
  title: string;
  description: string | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  tracks?: { title: string } | { title: string }[] | null;
};

type ModuleForm = {
  id: string | null;
  trackId: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: ModuleForm = {
  id: null,
  trackId: "",
  title: "",
  slug: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export function AdminModules() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [tracksResult, modulesResult] = await Promise.all([
      supabase.from("tracks").select("id, title, slug").order("sort_order", { ascending: true }),
      supabase
        .from("modules")
        .select("id, track_id, title, description, slug, sort_order, is_active, tracks(title)")
        .order("sort_order", { ascending: true }),
    ]);

    if (tracksResult.error) setError(tracksResult.error.message);
    else setTracks((tracksResult.data ?? []) as TrackRow[]);

    if (modulesResult.error) setError(modulesResult.error.message);
    else setModules((modulesResult.data ?? []) as ModuleRow[]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const track = Array.isArray(module.tracks) ? module.tracks[0] : module.tracks;
      const searchable = `${module.title} ${module.slug} ${track?.title ?? ""}`.toLowerCase();
      const matchesSearch = !search || searchable.includes(search.toLowerCase());
      const matchesStatus = !status || (status === "active" ? module.is_active : !module.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [modules, search, status]);

  const updateForm = <K extends keyof ModuleForm>(key: K, value: ModuleForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startNew = () => {
    setForm({ ...emptyForm, trackId: tracks[0]?.id ?? "", sortOrder: nextSortOrder(modules) });
    setShowForm(true);
  };

  const editModule = (module: ModuleRow) => {
    setForm({
      id: module.id,
      trackId: module.track_id,
      title: module.title,
      slug: module.slug,
      description: module.description ?? "",
      sortOrder: module.sort_order,
      isActive: module.is_active,
    });
    setShowForm(true);
  };

  const saveModule = async () => {
    setError(null);
    const title = form.title.trim();
    const slug = (form.slug.trim() || slugify(title)).toLowerCase();

    if (!title) {
      setError("Informe um titulo para o modulo.");
      return;
    }
    if (!slug) {
      setError("Informe um slug valido para o modulo.");
      return;
    }
    if (!form.trackId) {
      setError("Selecione a trilha do modulo.");
      return;
    }

    setSaving(true);
    const payload = {
      track_id: form.trackId,
      title,
      slug,
      description: form.description.trim() || null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
      updated_at: new Date().toISOString(),
    };

    const result = form.id
      ? await supabase.from("modules").update(payload).eq("id", form.id)
      : await supabase.from("modules").insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setShowForm(false);
      setForm(emptyForm);
      await loadData();
    }
    setSaving(false);
  };

  const toggleActive = async (module: ModuleRow) => {
    const { error } = await supabase.from("modules").update({ is_active: !module.is_active, updated_at: new Date().toISOString() }).eq("id", module.id);
    if (error) setError(error.message);
    else await loadData();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-zinc-900">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            Modulos
          </h1>
          <p className="mt-2 text-zinc-500">Gerencie a estrutura das trilhas e a visibilidade de cada modulo.</p>
        </div>
        <Button onClick={startNew} className="h-11 gap-2 px-6">
          <Plus className="h-4 w-4" />
          Criar modulo
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      {showForm && (
        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Titulo</span>
              <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Consultas fundamentais" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Slug</span>
              <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="consultas-fundamentais" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Trilha</span>
              <select value={form.trackId} onChange={(event) => updateForm("trackId", event.target.value)} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione uma trilha</option>
                {tracks.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Ordem</span>
              <Input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value))} />
            </label>
            <label className="flex items-end gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
              Modulo ativo
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-900">Descricao</span>
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="min-h-[88px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={saveModule} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar modulo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-lg border-zinc-200 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50/50 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por titulo, slug ou trilha..." className="bg-white pl-9" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 md:w-40">
            <option value="">Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando modulos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="w-20 px-6 py-4 text-center">Ordem</th>
                  <th className="px-6 py-4">Modulo</th>
                  <th className="px-6 py-4">Trilha</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredModules.map((module) => {
                  const track = Array.isArray(module.tracks) ? module.tracks[0] : module.tracks;
                  return (
                    <tr key={module.id} className="group transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-4 text-center font-mono text-sm text-zinc-400">{module.sort_order}</td>
                      <td className="px-6 py-4">
                        <p className="cursor-pointer font-bold text-zinc-900 transition-colors group-hover:text-indigo-600" onClick={() => editModule(module)}>{module.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-400">{module.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{track?.title ?? "-"}</td>
                      <td className="px-6 py-4 text-center">
                        {module.is_active ? (
                          <Badge className="bg-green-50 text-green-700 shadow-none hover:bg-green-50">Ativo</Badge>
                        ) : (
                          <Badge className="bg-zinc-100 text-zinc-600 shadow-none hover:bg-zinc-100">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600" onClick={() => editModule(module)} title="Editar modulo">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-green-600" onClick={() => toggleActive(module)} title={module.is_active ? "Inativar modulo" : "Ativar modulo"}>
                            {module.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
        <div className="border-t border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Mostrando {filteredModules.length} de {modules.length} modulos
        </div>
      </Card>
    </div>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextSortOrder(modules: ModuleRow[]) {
  if (!modules.length) return 1;
  return Math.max(...modules.map((module) => module.sort_order ?? 0)) + 1;
}
