import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Database, Github, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from "../components/ui/InputCardBadge";
import { useAuth } from "../../features/auth/AuthProvider";
import { getFriendlyAuthError } from "../../features/auth/auth-errors";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signInWithProvider } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPassword(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-200">
            <Database className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Entre na SQL Arena</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-500">
            Resolva desafios SQL, ganhe pontos e suba no ranking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900" htmlFor="email">Email</label>
            <Input id="email" type="email" placeholder="nome@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900" htmlFor="password">Senha</label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleLogin()} />
          </div>
          <Button className="h-11 w-full" onClick={handleLogin} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-500">Ou continue com</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full bg-white" onClick={() => signInWithProvider("google")}>
              Google
            </Button>
            <Button variant="outline" className="w-full bg-white" onClick={() => signInWithProvider("github")}>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 text-sm text-zinc-500">
          Nao tem uma conta?
          <Link to="/register" className="ml-1 font-semibold text-indigo-600 hover:underline">Crie agora</Link>
        </CardFooter>
      </Card>
    </div>
  );
}


