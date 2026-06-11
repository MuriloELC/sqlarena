import { Link } from "react-router";
import { Database } from "lucide-react";
import { Card, CardContent } from "../components/ui/InputCardBadge";
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, TERMS_VERSION } from "../../features/legal/constants";

export function Terms() {
  return (
    <LegalDocument
      title="Termos de Uso"
      version={TERMS_VERSION}
      sections={[
        ["Uso da plataforma", `${LEGAL_ENTITY_NAME} e uma plataforma educacional para praticar SQL, acompanhar progresso, ranking, eventos e desafios. O usuario deve usar a aplicacao de forma licita, sem tentar contornar controles de seguranca ou executar automacoes abusivas.`],
        ["Conta e seguranca", "O usuario e responsavel por manter suas credenciais seguras. A plataforma pode bloquear acessos, desafios ou contas quando houver suspeita de abuso, fraude, tentativa de exploracao tecnica ou violacao destes termos."],
        ["Conteudo e progresso", "Pontuacoes, tentativas, ranking, respostas de desafios e historico de atividades podem ser recalculados, corrigidos ou removidos para preservar a integridade educacional e operacional da plataforma."],
        ["Disponibilidade", "A plataforma pode passar por indisponibilidades, manutencoes e ajustes de conteudo. O objetivo e manter o servico funcional, mas nao ha garantia de disponibilidade ininterrupta."],
        ["Privacidade", "O tratamento de dados pessoais relacionado ao uso da plataforma esta descrito na Politica de Privacidade, que integra estes termos."],
        ["Contato", `Solicitacoes sobre estes termos podem ser enviadas para ${LEGAL_CONTACT_EMAIL}.`],
      ]}
    />
  );
}

type LegalDocumentProps = {
  title: string;
  version: string;
  sections: [string, string][];
};

function LegalDocument({ title, version, sections }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <main className="mx-auto max-w-3xl space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-indigo-700">
          <Database className="h-5 w-5 text-indigo-600" />
          SQL Arena
        </Link>
        <Card className="rounded-lg border-zinc-200 shadow-sm">
          <CardContent className="space-y-7 p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Versao {version}</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Este documento e um baseline operacional da {LEGAL_ENTITY_NAME} e pode ser revisado para refletir novas funcionalidades, requisitos legais ou ajustes de negocio.
              </p>
            </div>
            {sections.map(([sectionTitle, body]) => (
              <section key={sectionTitle} className="space-y-2">
                <h2 className="text-lg font-bold text-zinc-900">{sectionTitle}</h2>
                <p className="leading-relaxed text-zinc-600">{body}</p>
              </section>
            ))}
            <div className="border-t border-zinc-200 pt-5 text-sm text-zinc-500">
              Consulte tambem a <Link to="/privacy" className="font-semibold text-indigo-600 hover:underline">Politica de Privacidade</Link>.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
