import { Link, useLocation } from "react-router";
import {
  BookOpen,
  Database,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Button, cn } from "./ui/Button";
import { Sheet, SheetContent } from "./ui/sheet";
import { useAuth } from "../../features/auth/AuthProvider";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onToggleCollapsed: () => void;
};

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export function Sidebar({ collapsed, mobileOpen, onMobileOpenChange, onToggleCollapsed }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trilha SQL", href: "/trail", icon: Map },
    { name: "Ranking", href: "/ranking", icon: Trophy },
    { name: "Perfil", href: `/profile/${profile?.username ?? "me"}`, icon: User },
  ];

  const adminItems: NavItem[] = [
    { name: "Admin Geral", href: "/admin", icon: Settings },
    { name: "Modulos", href: "/admin/modules", icon: BookOpen },
    { name: "Desafios", href: "/admin/challenges", icon: Database },
    { name: "Eventos", href: "/admin/events", icon: Zap },
    { name: "Usuarios", href: "/admin/users", icon: Users },
  ];

  const content = (isMobile = false) => (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <Link to="/dashboard" onClick={() => isMobile && onMobileOpenChange(false)} className="flex min-w-0 items-center gap-2 font-bold tracking-tight text-white">
          <Database className="h-6 w-6 shrink-0 text-indigo-400" />
          {(!collapsed || isMobile) && <span className="truncate text-lg">SQL Arena</span>}
        </Link>
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggleCollapsed} title={collapsed ? "Expandir sidebar" : "Recolher sidebar"} className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
        <SectionLabel collapsed={collapsed && !isMobile}>Menu</SectionLabel>
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed && !isMobile}
            active={isItemActive(location.pathname, item.href)}
            onNavigate={() => isMobile && onMobileOpenChange(false)}
          />
        ))}

        {profile?.role === "admin" && (
          <>
            <SectionLabel collapsed={collapsed && !isMobile} className="mt-8">Admin</SectionLabel>
            {adminItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                collapsed={collapsed && !isMobile}
                active={isItemActive(location.pathname, item.href)}
                admin
                onNavigate={() => isMobile && onMobileOpenChange(false)}
              />
            ))}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className={cn("hidden h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-300 transition-[width] duration-200 md:flex", collapsed ? "w-20" : "w-64")}>
        {content(false)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 gap-0 border-zinc-800 bg-zinc-900 p-0 text-zinc-300">
          {content(true)}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarLink({ item, active, collapsed, admin = false, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; admin?: boolean; onNavigate: () => void }) {
  return (
    <Link
      to={item.href}
      title={collapsed ? item.name : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
        collapsed ? "justify-center" : "gap-3",
        active
          ? admin
            ? "bg-purple-600/10 text-purple-300"
            : "bg-indigo-600/10 text-indigo-300"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );
}

function SectionLabel({ children, collapsed, className }: { children: string; collapsed: boolean; className?: string }) {
  if (collapsed) return <div className={cn("my-2 h-px bg-zinc-800", className)} />;

  return (
    <div className={cn("mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500", className)}>
      {children}
    </div>
  );
}

function isItemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href.startsWith("/profile")) return pathname.startsWith("/profile");
  return pathname === href || pathname.startsWith(`${href}/`);
}
