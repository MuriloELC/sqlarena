import { useState } from "react";
import { Link } from "react-router";
import { Database, Loader2, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../components/ui/InputCardBadge";
import { supabase } from "../../lib/supabase";
import { getFriendlyAuthError } from "../../features/auth/auth-errors";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendReset = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess("Se esse email existir na SQL Arena, enviaremos um link para redefinir a senha.");
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
          <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-500">Informe o email da conta para receber o link de recuperacao.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{success}</div>}
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Email</span>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" onKeyDown={(event) => event.key === "Enter" && sendReset()} />
          </label>
          <Button className="h-11 w-full gap-2" onClick={sendReset} disabled={loading || !email.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar link
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 text-sm text-zinc-500">
          Lembrou a senha?
          <Link to="/login" className="ml-1 font-semibold text-indigo-600 hover:underline">Entrar</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
