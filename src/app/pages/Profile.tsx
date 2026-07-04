import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Calendar, Camera, Code2, Loader2, Map, Medal, Save, Trophy, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge, Card, CardContent, Input } from "../components/ui/InputCardBadge";
import { fetchAttempts, fetchCurrentProfile, fetchLearningModules, fetchProfileByUsername, fetchRanking } from "../../features/learning/data/supabase-catalog";
import { formatXp } from "../../features/learning/utils/format";
import { getModuleProgress } from "../../features/learning/utils/progress";
import { useAuth } from "../../features/auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import type { LearningModule, UserProfile } from "../../shared/types/sql-arena";

const avatarMimeTypes = ["image/png", "image/jpeg", "image/webp"];
const maxAvatarSize = 2 * 1024 * 1024;

export function Profile() {
  const { user, refreshProfile } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [overallPosition, setOverallPosition] = useState(0);
  const [weeklyPosition, setWeeklyPosition] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwnProfile = Boolean(user && profile?.id === user.id);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    const profilePromise = username && username !== "me" ? fetchProfileByUsername(username) : fetchCurrentProfile(user.id);

    try {
      const nextProfile = await profilePromise;
      if (!nextProfile) throw new Error("Perfil nao encontrado.");
      const isOwnProfileData = nextProfile.id === user.id;
      const [nextModules, nextAttempts, overall, weekly] = await Promise.all([
        isOwnProfileData ? fetchLearningModules(nextProfile.id) : Promise.resolve([]),
        isOwnProfileData ? fetchAttempts(nextProfile.id) : Promise.resolve([]),
        fetchRanking("overall"),
        fetchRanking("weekly"),
      ]);

      setProfile(nextProfile);
      setDisplayName(nextProfile.name);
      setModules(nextModules);
      setAttempts(nextAttempts);
      setOverallPosition(overall.findIndex((item) => item.id === nextProfile.id) + 1 || 0);
      setWeeklyPosition(weekly.findIndex((item) => item.id === nextProfile.id) + 1 || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user, username]);

  const saveProfile = async () => {
    if (!user || !profile) return;

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setError("Informe um nome de exibicao.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        if (!avatarMimeTypes.includes(avatarFile.type)) {
          throw new Error("A foto precisa ser PNG, JPEG ou WebP.");
        }
        if (avatarFile.size > maxAvatarSize) {
          throw new Error("A foto precisa ter no maximo 2 MB.");
        }

        const extension = avatarExtension(avatarFile.type);
        const path = `${user.id}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, {
          contentType: avatarFile.type,
          upsert: true,
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      const payload: { display_name: string; updated_at: string; avatar_url?: string } = {
        display_name: trimmedDisplayName,
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl) payload.avatar_url = avatarUrl;

      const { error: updateError } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarFile(null);
      setSuccess("Perfil atualizado.");
      await refreshProfile();
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando perfil...</div>;
  if (error && !profile) return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-10">
      <Card className="overflow-hidden rounded-lg border-zinc-200 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500" />
        <CardContent className="relative px-8 pb-8 pt-0">
          <div className="relative z-10 -mt-14 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <Avatar className="h-28 w-28 border-4 border-white bg-indigo-100 shadow-md">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
              <AvatarFallback className="bg-indigo-100 text-4xl font-extrabold text-indigo-600">{profile.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{profile.name}</h1>
              <p className="mt-1 flex items-center justify-center gap-2 font-medium text-zinc-500 sm:justify-start">@{profile.username}<span className="h-1 w-1 rounded-full bg-zinc-300" /><Calendar className="h-3.5 w-3.5" />Perfil educacional</p>
            </div>
            <Badge variant="secondary" className="mb-2 bg-indigo-50 px-4 py-1 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100">Nivel {Math.max(1, Math.floor(profile.totalXp / 250))}</Badge>
          </div>
        </CardContent>
      </Card>

      {isOwnProfile && (
        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Editar perfil</h2>
              <p className="mt-1 text-sm text-zinc-500">Atualize seu nome de exibicao e foto publica.</p>
            </div>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
            {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{success}</div>}
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-zinc-900">Nome de exibicao</span>
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-zinc-900">Foto</span>
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
                <p className="text-xs text-zinc-500">PNG, JPEG ou WebP ate 2 MB.</p>
              </label>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : avatarFile ? <Camera className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                Salvar perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          {isOwnProfile && (
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
          )}

          {isOwnProfile && (
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
          )}
        </div>
      </div>
    </div>
  );
}

function avatarExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}
