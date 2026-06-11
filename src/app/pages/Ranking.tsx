import { useEffect, useState } from "react";
import { Crown, Loader2, Trophy } from "lucide-react";
import { Badge, Card } from "../components/ui/InputCardBadge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { formatXp } from "../../features/learning/utils/format";
import { fetchCurrentProfile, fetchRanking } from "../../features/learning/data/supabase-catalog";
import { useAuth } from "../../features/auth/AuthProvider";

type RankingRow = Awaited<ReturnType<typeof fetchRanking>>[number];

export function Ranking() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overall" | "weekly">("weekly");
  const [users, setUsers] = useState<RankingRow[]>([]);
  const [currentXp, setCurrentXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchRanking(tab), fetchCurrentProfile(user.id)])
      .then(([ranking, profile]) => {
        setUsers(ranking);
        setCurrentXp(tab === "weekly" ? profile.weeklyXp : profile.totalXp);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o ranking."))
      .finally(() => setLoading(false));
  }, [tab, user]);

  const userPosition = users.findIndex((item) => item.id === user?.id) + 1;

  if (loading) return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando ranking...</div>;
  if (error) return <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-zinc-900"><Trophy className="h-8 w-8 text-orange-500" />Ranking</h1>
          <p className="mt-2 text-zinc-500">Veja os melhores jogadores da SQL Arena.</p>
        </div>

        <div className="flex self-stretch rounded-lg bg-zinc-100 p-1 shadow-inner md:self-auto">
          <button onClick={() => setTab("overall")} className={`flex-1 rounded-md px-6 py-2 text-center text-sm font-bold transition-all md:flex-none ${tab === "overall" ? "bg-white text-indigo-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>Geral</button>
          <button onClick={() => setTab("weekly")} className={`flex-1 rounded-md px-6 py-2 text-center text-sm font-bold transition-all md:flex-none ${tab === "weekly" ? "bg-white text-indigo-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>Semanal</button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <div>
            <p className="text-sm font-semibold text-indigo-100">Sua posicao {tab === "weekly" ? "nesta semana" : "geral"}</p>
            <p className="flex items-center gap-2 text-2xl font-bold">
              {userPosition > 0 ? `#${userPosition}` : "Fora do top"}
              <span className="text-base font-medium text-indigo-200">{formatXp(currentXp)} XP</span>
            </p>
          </div>
          <Crown className="h-8 w-8 text-yellow-300 opacity-80" />
        </div>

        <table className="w-full text-left">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr><th className="w-16 px-6 py-4 text-center">#</th><th className="px-6 py-4">Usuario</th><th className="px-6 py-4 text-right">XP</th><th className="hidden px-6 py-4 text-right sm:table-cell">Desafios</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((rankingUser, index) => {
              const position = index + 1;
              const isCurrentUser = rankingUser.id === user?.id;
              const xp = tab === "weekly" ? rankingUser.weeklyXp : rankingUser.totalXp;

              return (
                <tr key={rankingUser.id} className={`transition-colors hover:bg-zinc-50/50 ${isCurrentUser ? "bg-indigo-50/30" : ""}`}>
                  <td className="px-6 py-4 text-center">{position <= 3 ? <Crown className={`mx-auto h-5 w-5 ${position === 1 ? "text-yellow-500" : position === 2 ? "text-zinc-400" : "text-amber-600"}`} /> : <span className="font-bold text-zinc-400">{position}</span>}</td>
                  <td className="flex items-center gap-4 px-6 py-4">
                    <Avatar className={`h-10 w-10 border ${isCurrentUser ? "border-indigo-200" : "border-zinc-200"}`}>
                      {rankingUser.avatarUrl && <AvatarImage src={rankingUser.avatarUrl} alt={rankingUser.name} />}
                      <AvatarFallback className={`text-sm font-bold ${isCurrentUser ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>{rankingUser.avatar}</AvatarFallback>
                    </Avatar>
                    <p className={`flex items-center gap-2 font-bold ${isCurrentUser ? "text-indigo-700" : "text-zinc-900"}`}>
                      {rankingUser.name}
                      {isCurrentUser && <Badge variant="secondary" className="bg-indigo-100 px-1.5 py-0 text-[10px] text-indigo-700">Voce</Badge>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right"><span className="font-mono font-bold text-indigo-600">{formatXp(xp)}</span></td>
                  <td className="hidden px-6 py-4 text-right sm:table-cell"><span className="font-medium text-zinc-500">{"completedChallenges" in rankingUser ? rankingUser.completedChallenges : "-"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
