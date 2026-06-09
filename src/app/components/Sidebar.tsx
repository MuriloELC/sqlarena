import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Map, 
  Trophy, 
  User, 
  Settings,
  Database,
  Zap
} from "lucide-react";
import { cn } from "./ui/Button";
import { useAuth } from "../../features/auth/AuthProvider";

export function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trilha SQL", href: "/trail", icon: Map },
    { name: "Ranking", href: "/ranking", icon: Trophy },
    { name: "Perfil", href: `/profile/${profile?.username ?? "me"}`, icon: User },
  ];

  const adminItems = [
    { name: "Admin Geral", href: "/admin", icon: Settings },
    { name: "Desafios", href: "/admin/challenges", icon: Database },
    { name: "Eventos", href: "/admin/events", icon: Zap },
  ];

  return (
    <div className="w-64 bg-zinc-900 text-zinc-300 flex flex-col h-full shrink-0 border-r border-zinc-800 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          <Database className="w-6 h-6 text-indigo-400" />
          <span>SQL Arena</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {profile?.role === "admin" && <div className="mt-8 text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider px-2">Admin</div>}
        {profile?.role === "admin" && adminItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href) && (item.href !== "/admin" || location.pathname === "/admin");
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-purple-600/10 text-purple-400" 
                  : "hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
