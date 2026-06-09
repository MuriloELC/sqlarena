import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { formatXp } from "../../features/learning/utils/format";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchActiveEvent } from "../../features/learning/data/supabase-catalog";
import type { PlatformEvent } from "../../shared/types/sql-arena";

export function Topbar() {
  const { profile, signOut } = useAuth();
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null);
  const totalPoints = profile?.total_points ?? 0;
  const avatar = profile?.display_name?.charAt(0)?.toUpperCase() ?? "U";

  useEffect(() => {
    fetchActiveEvent().then(setActiveEvent).catch(() => setActiveEvent(null));
  }, []);

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div className="flex items-center gap-4 md:hidden">
        <span className="text-lg font-bold tracking-tight text-zinc-900">SQL Arena</span>
      </div>

      <div className="hidden flex-1 md:flex" />

      <div className="flex items-center gap-6">
        {activeEvent?.active && (
          <div className="hidden items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 sm:flex">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            <span>Evento {activeEvent.multiplier}x ativo</span>
          </div>
        )}

        <div className="mx-2 hidden h-8 w-px bg-zinc-200 sm:block" />

        <div className="flex items-center gap-4">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-semibold text-zinc-900">{formatXp(totalPoints)} XP</span>
            <span className="text-xs text-zinc-500">Nivel {Math.max(1, Math.floor(totalPoints / 250))}</span>
          </div>

          <button
            onClick={() => signOut()}
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 font-bold text-indigo-700 transition-colors hover:bg-indigo-200"
          >
            {avatar}
          </button>
        </div>
      </div>
    </div>
  );
}
