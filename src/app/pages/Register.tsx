import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Database, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../components/ui/InputCardBadge";
import { useAuth } from "../../features/auth/AuthProvider";
import { getFriendlyAuthError } from "../../features/auth/auth-errors";

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("A confirmacao de senha nao confere.");
      return;
    }
    if (!acceptedTerms) {
      setError("Aceite os Termos de Uso e a Politica de Privacidade para criar a conta.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      const result = await signUp({ displayName, username, email, password, acceptedTerms });
      if (result.needsEmailConfirmation) {
        setSuccess("Conta criada. Confira seu email para confirmar o cadastro antes de entrar.");
        return;
      }
      navigate("/dashboard", { replace: true });
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
          <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-500">Comece sua jornada pratica em SQL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{success}</div>}
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Nome de exibicao</span>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Murilo Souza" />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Username</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="murilosouza" />
            <p className="mt-1 text-xs text-zinc-500">Isso sera usado no seu perfil publico.</p>
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Email</span>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Senha</span>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-zinc-900">Confirmar senha</span>
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Li e aceito os{" "}
              <Link to="/terms" target="_blank" className="font-semibold text-indigo-600 hover:underline">Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacy" target="_blank" className="font-semibold text-indigo-600 hover:underline">Politica de Privacidade</Link>.
            </span>
          </label>
          <Button className="h-11 w-full" onClick={handleRegister} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar conta
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 text-sm text-zinc-500">
          Ja tem uma conta?
          <Link to="/login" className="ml-1 font-semibold text-indigo-600 hover:underline">Entre aqui</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
