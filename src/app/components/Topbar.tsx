import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, Menu, Zap } from "lucide-react";
import { Button } from "./ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatXp } from "../../features/learning/utils/format";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchActiveEvent } from "../../features/learning/data/supabase-catalog";
import type { PlatformEvent } from "../../shared/types/sql-arena";

type TopbarProps = {
  onOpenMobileSidebar: () => void;
};

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null);
  const totalPoints = profile?.total_points ?? 0;
  const avatarFallback = profile?.display_name?.charAt(0)?.toUpperCase() ?? "U";

  useEffect(() => {
    fetchActiveEvent().then(setActiveEvent).catch(() => setActiveEvent(null));
  }, []);

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onOpenMobileSidebar} title="Abrir menu" className="h-9 w-9 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="truncate text-lg font-bold tracking-tight text-zinc-900 md:hidden">SQL Arena</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {activeEvent?.active && (
          <div className="hidden items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 sm:flex">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            <span>Evento {activeEvent.multiplier}x ativo</span>
          </div>
        )}

        <div className="hidden h-8 w-px bg-zinc-200 sm:block" />

        <div className="hidden flex-col text-right sm:flex">
          <span className="text-sm font-semibold text-zinc-900">{formatXp(totalPoints)} XP</span>
          <span className="text-xs text-zinc-500">Nivel {Math.max(1, Math.floor(totalPoints / 250))}</span>
        </div>

        <button
          onClick={() => navigate(`/profile/${profile?.username ?? "me"}`)}
          title="Abrir perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 transition-colors hover:bg-indigo-100"
        >
          <Avatar className="h-9 w-9">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
            <AvatarFallback className="bg-indigo-100 font-bold text-indigo-700">{avatarFallback}</AvatarFallback>
          </Avatar>
        </button>

        <Button variant="ghost" size="icon" onClick={logout} title="Sair" className="h-9 w-9 text-zinc-500 hover:text-red-600">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
