import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const sidebarStorageKey = "sql-arena-sidebar-collapsed";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(sidebarStorageKey) === "true");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(sidebarStorageKey, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 font-sans text-zinc-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
