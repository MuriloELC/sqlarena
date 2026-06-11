import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Database, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";
import { getFriendlyAuthError } from "../../features/auth/auth-errors";

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(Boolean(session));
        setReady(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const updatePassword = async () => {
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("A confirmacao de senha nao confere.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess("Senha atualizada. Voce ja pode continuar usando sua conta.");
      setTimeout(() => navigate("/dashboard", { replace: true }), 800);
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-200">
            <Database className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Nova senha</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-500">Defina uma nova senha para sua conta da SQL Arena.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {!ready && <div className="flex items-center justify-center py-4 text-sm text-zinc-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando link...</div>}
          {ready && !hasRecoverySession && <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Abra esta pagina pelo link enviado no email de recuperacao.</div>}
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{success}</div>}
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Nova senha</span>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!hasRecoverySession} />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Confirmar senha</span>
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!hasRecoverySession} onKeyDown={(event) => event.key === "Enter" && updatePassword()} />
          </label>
          <Button className="h-11 w-full gap-2" onClick={updatePassword} disabled={loading || !hasRecoverySession}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            Atualizar senha
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 text-sm text-zinc-500">
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Voltar ao login</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
