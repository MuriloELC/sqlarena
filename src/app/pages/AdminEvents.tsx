import { useEffect, useMemo, useState } from "react";
import { Clock, Edit, Loader2, Pause, Plus, Save, Trash2, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge, Card, CardContent, Input } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";

type PlatformEventRow = {
  id: string;
  title: string;
  description: string | null;
  type: "points_multiplier" | "special_challenge";
  multiplier: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type EventForm = {
  id: string | null;
  title: string;
  description: string;
  type: "points_multiplier" | "special_challenge";
  multiplier: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyForm: EventForm = {
  id: null,
  title: "",
  description: "",
  type: "points_multiplier",
  multiplier: 2,
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export function AdminEvents() {
  const [events, setEvents] = useState<PlatformEventRow[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("platform_events")
      .select("id, title, description, type, multiplier, starts_at, ends_at, is_active")
      .order("starts_at", { ascending: false });

    if (error) setError(error.message);
    else setEvents((data ?? []) as PlatformEventRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const activeEvent = useMemo(() => {
    const now = Date.now();
    return events.find((event) => event.is_active && new Date(event.starts_at).getTime() <= now && new Date(event.ends_at).getTime() >= now) ?? null;
  }, [events]);

  const updateForm = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startNew = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    setForm({
      ...emptyForm,
      startsAt: toDatetimeLocal(now.toISOString()),
      endsAt: toDatetimeLocal(end.toISOString()),
    });
    setShowForm(true);
  };

  const editEvent = (event: PlatformEventRow) => {
    setForm({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      type: event.type,
      multiplier: Number(event.multiplier ?? 1),
      startsAt: toDatetimeLocal(event.starts_at),
      endsAt: toDatetimeLocal(event.ends_at),
      isActive: event.is_active,
    });
    setShowForm(true);
  };

  const saveEvent = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Informe um titulo para o evento.");
      return;
    }
    if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
      setError("A data de fim deve ser maior que a data de inicio.");
      return;
    }
    if (form.type === "points_multiplier" && Number(form.multiplier) <= 1) {
      setError("Eventos de multiplicador precisam ter multiplicador maior que 1.");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      multiplier: form.type === "points_multiplier" ? Number(form.multiplier) : null,
      starts_at: new Date(form.startsAt).toISOString(),
      ends_at: new Date(form.endsAt).toISOString(),
      is_active: form.isActive,
      updated_at: new Date().toISOString(),
    };

    const result = form.id
      ? await supabase.from("platform_events").update(payload).eq("id", form.id)
      : await supabase.from("platform_events").insert(payload);

    if (result.error) setError(result.error.message);
    else {
      setShowForm(false);
      setForm(emptyForm);
      await loadEvents();
    }
    setSaving(false);
  };

  const toggleActive = async (event: PlatformEventRow) => {
    const { error } = await supabase.from("platform_events").update({ is_active: !event.is_active }).eq("id", event.id);
    if (error) setError(error.message);
    else await loadEvents();
  };

  const removeEvent = async (event: PlatformEventRow) => {
    const { error } = await supabase.from("platform_events").delete().eq("id", event.id);
    if (error) setError(error.message);
    else await loadEvents();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" fill="currentColor" />
            Eventos
          </h1>
          <p className="text-zinc-500 mt-2">Crie eventos temporarios para engajar os alunos.</p>
        </div>
        <Button onClick={startNew} className="shrink-0 gap-2 h-11 px-6 text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200">
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      {showForm && (
        <Card className="rounded-2xl border-zinc-200 shadow-sm">
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Titulo</span>
              <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Semana do SQL" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Tipo</span>
              <select value={form.type} onChange={(event) => updateForm("type", event.target.value as EventForm["type"])} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="points_multiplier">Multiplicador de pontos</option>
                <option value="special_challenge">Desafio especial</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Multiplicador</span>
              <Input type="number" step="0.1" value={form.multiplier} onChange={(event) => updateForm("multiplier", Number(event.target.value))} disabled={form.type !== "points_multiplier"} />
            </label>
            <label className="flex items-end gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
              Evento ativo
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Inicio</span>
              <Input type="datetime-local" value={form.startsAt} onChange={(event) => updateForm("startsAt", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900">Fim</span>
              <Input type="datetime-local" value={form.endsAt} onChange={(event) => updateForm("endsAt", event.target.value)} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-900">Descricao</span>
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="min-h-[88px] w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={saveEvent} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar evento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-amber-200 shadow-sm border-2 overflow-hidden relative">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 z-10 relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
            <Zap className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none mb-2 border border-amber-200 font-bold uppercase tracking-wider text-[10px]">
              {activeEvent ? "Evento ativo agora" : "Nenhum evento ativo"}
            </Badge>
            <h2 className="text-2xl font-bold text-zinc-900">{activeEvent?.title ?? "Sem evento vigente"}</h2>
            <p className="text-zinc-600 mt-1">
              {activeEvent ? `${eventTypeLabel(activeEvent.type)} - ${activeEvent.multiplier ?? 1}x XP` : "Crie ou ative um evento com periodo vigente para aparecer aos alunos."}
            </p>
          </div>
          {activeEvent && (
            <div className="shrink-0 flex flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-amber-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                <Clock className="w-4 h-4" /> Termina em
              </div>
              <div className="text-sm font-mono font-bold text-zinc-900">{new Date(activeEvent.ends_at).toLocaleString("pt-BR")}</div>
              <Button variant="outline" size="sm" className="mt-2 w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => toggleActive(activeEvent)}>
                <Pause className="w-3 h-3 mr-1.5" fill="currentColor" /> Pausar Evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 shadow-sm">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 font-bold text-sm text-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Historico e agendados
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando eventos...</div>
        ) : (
          <div className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Titulo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-center">Multiplicador</th>
                  <th className="px-6 py-4">Periodo</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors cursor-pointer">{event.title}</p>
                      {event.description && <p className="mt-0.5 text-xs text-zinc-500">{event.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{eventTypeLabel(event.type)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">{event.multiplier ?? "-"}x</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-900 font-medium mb-0.5">{new Date(event.starts_at).toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-zinc-500">{new Date(event.ends_at).toLocaleString("pt-BR")}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={`${statusClass(event)} shadow-none border`}>{eventStatus(event)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600" onClick={() => editEvent(event)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-amber-600" onClick={() => toggleActive(event)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => removeEvent(event)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function eventTypeLabel(type: PlatformEventRow["type"]) {
  return type === "points_multiplier" ? "Multiplicador global" : "Desafio especial";
}

function eventStatus(event: PlatformEventRow) {
  if (!event.is_active) return "Inativo";
  const now = Date.now();
  if (new Date(event.starts_at).getTime() > now) return "Agendado";
  if (new Date(event.ends_at).getTime() < now) return "Finalizado";
  return "Ativo";
}

function statusClass(event: PlatformEventRow) {
  const status = eventStatus(event);
  if (status === "Ativo") return "bg-green-50 text-green-700 hover:bg-green-50 border-green-200";
  if (status === "Agendado") return "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200";
  return "bg-zinc-100 text-zinc-500 hover:bg-zinc-100 border-zinc-200";
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
