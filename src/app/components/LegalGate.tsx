import { useState } from "react";
import { Link } from "react-router";
import { FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/InputCardBadge";
import { useAuth } from "../../features/auth/AuthProvider";
import { LEGAL_ENTITY_NAME, PRIVACY_VERSION, TERMS_VERSION } from "../../features/legal/constants";
import { getFriendlyAuthError } from "../../features/auth/auth-errors";

export function LegalGate() {
  const { acceptLatestTerms, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    try {
      setError(null);
      setLoading(true);
      await acceptLatestTerms();
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <Card className="w-full max-w-lg rounded-lg border-zinc-200 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Termos e privacidade atualizados</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Para continuar usando a {LEGAL_ENTITY_NAME}, aceite os Termos de Uso e a Politica de Privacidade atuais.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/terms" target="_blank" className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700 hover:border-indigo-200 hover:text-indigo-700">
              <FileText className="h-4 w-4" />
              Termos v{TERMS_VERSION}
            </Link>
            <Link to="/privacy" target="_blank" className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700 hover:border-indigo-200 hover:text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              Privacidade v{PRIVACY_VERSION}
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => signOut()} disabled={loading}>
              Sair
            </Button>
            <Button onClick={accept} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Aceitar e continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
