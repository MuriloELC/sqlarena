import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../features/auth/AuthProvider";
import { hasAcceptedLatestLegal } from "../../features/legal/acceptance";
import { LegalGate } from "./LegalGate";

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando sessao...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando perfil...
      </div>
    );
  }

  if (!hasAcceptedLatestLegal(profile)) {
    return <LegalGate />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Verificando permissao...
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
