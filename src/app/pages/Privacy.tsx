import { Link } from "react-router";
import { Database } from "lucide-react";
import { Card, CardContent } from "../components/ui/InputCardBadge";
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, PRIVACY_VERSION } from "../../features/legal/constants";

const sections: [string, string][] = [
  ["Controlador e contato", `${LEGAL_ENTITY_NAME} e a identidade operacional da plataforma. Pedidos sobre privacidade, acesso, correcao, exclusao ou informacoes sobre tratamento podem ser enviados para ${LEGAL_CONTACT_EMAIL}.`],
  ["Dados coletados", "Coletamos dados de cadastro e autenticacao, como nome de exibicao, username, email, identificador de usuario, avatar, datas de criacao/acesso e metadados necessarios para manter a sessao. Tambem tratamos dados de uso educacional, como tentativas, respostas SQL, progresso, pontos, ranking e participacao em eventos."],
  ["Finalidades", "Os dados sao usados para autenticar usuarios, operar desafios e trilhas, registrar progresso, calcular pontuacao, exibir ranking, administrar conteudo, proteger a plataforma, resolver suporte e cumprir obrigacoes legais ou regulatorias aplicaveis."],
  ["Bases legais", "O tratamento pode se apoiar na execucao de contrato ou procedimentos preliminares, legitimo interesse para seguranca e melhoria da plataforma, cumprimento de obrigacao legal quando aplicavel e consentimento quando a funcionalidade depender de escolha especifica do usuario."],
  ["Armazenamento e seguranca", "Os dados ficam armazenados em infraestrutura de aplicacao e banco de dados com controles de acesso, politicas de seguranca e segregacao por permissao. Mantemos dados pelo tempo necessario para cumprir as finalidades descritas ou enquanto a conta estiver ativa, salvo obrigacao legal ou necessidade de preservacao de evidencias."],
  ["Compartilhamento", "Usamos provedores de infraestrutura e operacao, incluindo Supabase para autenticacao, banco e armazenamento de arquivos, e Vercel para hospedagem, deploy e execucao da aplicacao. Esses provedores processam dados para viabilizar a prestacao do servico."],
  ["Direitos do titular", "Nos termos da LGPD, o titular pode solicitar confirmacao de tratamento, acesso, correcao, anonimizacao, bloqueio ou eliminacao de dados desnecessarios, portabilidade quando aplicavel, informacoes sobre compartilhamento, revisao de decisoes automatizadas quando existentes e revogacao de consentimento."],
  ["Cookies e armazenamento local", "A plataforma usa mecanismos necessarios de sessao do Supabase e preferencias locais, como estado da sidebar. Nao ha cookies opcionais ou analytics ativados neste baseline."],
  ["Atualizacoes", "Esta politica pode ser atualizada para acompanhar mudancas do produto, da infraestrutura ou da legislacao. Quando necessario, usuarios autenticados deverao aceitar a nova versao para continuar usando a plataforma."],
];

export function Privacy() {
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
              <p className="text-sm font-semibold text-indigo-600">Versao {PRIVACY_VERSION}</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">Politica de Privacidade</h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Este aviso segue a estrutura recomendada pela ANPD para informar, de forma clara, quais dados pessoais sao tratados e com quais finalidades.
              </p>
            </div>
            {sections.map(([title, body]) => (
              <section key={title} className="space-y-2">
                <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
                <p className="leading-relaxed text-zinc-600">{body}</p>
              </section>
            ))}
            <div className="border-t border-zinc-200 pt-5 text-sm text-zinc-500">
              Consulte tambem os <Link to="/terms" className="font-semibold text-indigo-600 hover:underline">Termos de Uso</Link>.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
