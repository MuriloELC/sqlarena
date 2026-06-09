# Blueprint — Prompt Mestre para IA Desenvolvedora

## 1. Objetivo

Este documento contém o prompt principal para orientar uma IA desenvolvedora na criação da SQL Arena.

Use este prompt com ferramentas como Codex, Cursor, Claude Code ou outro agente de desenvolvimento.

---

# 2. Prompt mestre

```text
Você é uma IA desenvolvedora sênior. Desenvolva uma plataforma web chamada SQL Arena, semelhante ao SQLBolt, com gamificação estilo Duolingo, voltada para estudantes de banco de dados.

A plataforma deve permitir que usuários resolvam desafios SQL, executem consultas em ambiente seguro, recebam feedback imediato, ganhem pontos e disputem ranking geral e semanal.

Stack obrigatória:
- Next.js com TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- CodeMirror 6 como editor SQL
- Backend intermediário para executar queries SQL com segurança

Contexto do produto:
- Público-alvo: estudantes de banco de dados
- Uso inicial: ferramenta interna gratuita
- Estilo: SQLBolt educativo + Duolingo gamificado
- Dataset educacional: e-commerce realista
- MVP: apenas desafios de SELECT livre

Funcionalidades do MVP:
1. autenticação com email/senha, Google e GitHub;
2. criação automática de profile após cadastro;
3. dashboard do usuário;
4. trilha SQL com módulos;
5. tela de desafio SQL;
6. editor SQL com highlight de sintaxe;
7. painel com estrutura das tabelas disponíveis;
8. dicas por desafio;
9. botão executar SQL;
10. tabela de resultado;
11. validação por igualdade exata do resultado;
12. registro de tentativas;
13. pontuação na primeira conclusão correta;
14. ranking geral;
15. ranking semanal;
16. perfil público;
17. painel admin para trilhas, módulos, desafios e eventos;
18. eventos manuais de multiplicador de pontos.

Regras críticas de segurança:
1. Nunca executar SQL diretamente do frontend.
2. Criar endpoint backend /api/sql/execute.
3. Permitir apenas SELECT ou WITH no MVP.
4. Bloquear múltiplas statements.
5. Bloquear palavras perigosas:
   INSERT, UPDATE, DELETE, MERGE, DROP, ALTER, CREATE, TRUNCATE, GRANT, REVOKE, COPY, CALL, DO, VACUUM, ANALYZE, EXPLAIN ANALYZE.
6. Executar queries com role PostgreSQL somente leitura.
7. Usar schema separado para dados dos desafios: challenge_data.
8. Usar transação read-only.
9. Aplicar statement_timeout de 10 segundos.
10. Limitar resultado exibido a 500 linhas.
11. Registrar todas as tentativas.
12. Não expor credenciais do banco no frontend.

Validação:
- Executar a query do usuário.
- Executar a query esperada cadastrada no desafio.
- Normalizar os dois resultados.
- Comparar exatamente:
  - quantidade de colunas;
  - nomes das colunas;
  - ordem das colunas;
  - quantidade de linhas;
  - ordem das linhas;
  - valores.
- Se forem iguais, marcar como correto.
- Se o usuário ainda não concluiu o desafio, conceder pontos.
- Se já concluiu, não conceder pontos novamente.

Banco educacional:
Criar schema challenge_data com tabelas:
- customers
- categories
- products
- orders
- order_items
- payments
- shipments
- financial_transactions

Gamificação:
- Fácil: 10 XP
- Médio: 25 XP
- Difícil: 50 XP
- Especial: 100 XP
- Ranking geral por pontos totais
- Ranking semanal por pontos da semana
- Eventos manuais de multiplicador de pontos

Telas obrigatórias:
1. Login
2. Cadastro
3. Dashboard
4. Trilha SQL
5. Desafio SQL
6. Ranking
7. Perfil público
8. Admin Dashboard
9. Admin Lista de Desafios
10. Admin Criar/Editar Desafio
11. Admin Eventos

Componentes principais:
- AppLayout
- Topbar
- Sidebar
- ChallengeCard
- ModuleCard
- ProgressBar
- DifficultyBadge
- SqlEditor
- ResultTable
- SchemaExplorer
- HintPanel
- FeedbackBox
- RankingTable
- ProfileSummaryCard
- ActiveEventBanner
- AdminChallengeForm
- AdminEventForm

Entregue:
1. estrutura de pastas limpa;
2. schema SQL das tabelas;
3. seeds iniciais;
4. páginas principais;
5. componentes reutilizáveis;
6. endpoints principais;
7. validações;
8. tratamento de erro;
9. instruções de setup local;
10. README com variáveis de ambiente.

Prioridade máxima:
- Segurança na execução SQL.
- Tela de desafio bem feita.
- Fluxo de validação confiável.
- Gamificação simples funcionando.

Não implemente no MVP:
- comandos INSERT/UPDATE/DELETE livres;
- certificados;
- pagamento;
- turmas;
- IA corretora obrigatória;
- antiabuso avançado;
- casos ocultos.
```

---

# 3. Ordem recomendada para pedir implementação à IA

Não peça tudo de uma vez.

Use esta ordem:

## Etapa 1

```text
Crie a estrutura inicial do projeto Next.js com TypeScript, Tailwind, shadcn/ui e Supabase.
Implemente autenticação, layout base, rotas protegidas e tabela profiles.
```

## Etapa 2

```text
Implemente o schema da aplicação: tracks, modules, challenges, challenge_hints, attempts, user_challenge_progress, point_events e platform_events.
Crie seeds iniciais de trilha, módulos e alguns desafios.
```

## Etapa 3

```text
Implemente o schema challenge_data com dataset de e-commerce e role read-only challenge_runner.
```

## Etapa 4

```text
Implemente a tela de desafio com CodeMirror, painel de enunciado, dicas, estrutura das tabelas e tabela de resultado.
```

## Etapa 5

```text
Implemente o endpoint /api/sql/execute com validação SELECT-only, timeout, execução read-only, comparação exata de resultados, registro de tentativa e pontuação.
```

## Etapa 6

```text
Implemente dashboard, trilha, ranking geral, ranking semanal e perfil público.
```

## Etapa 7

```text
Implemente painel admin para criar/editar/testar desafios e criar eventos de multiplicador de pontos.
```

---

# 4. Prompt específico para tela de desafio

```text
Implemente a tela de desafio SQL da plataforma SQL Arena.

Ela deve ser a tela mais importante do produto.

Layout desktop:
- header com título, módulo, dificuldade, pontos e evento ativo;
- coluna esquerda com enunciado, dicas e estrutura das tabelas;
- coluna direita com editor SQL, botão executar, resultado em tabela e feedback;
- usar CodeMirror 6 para editor SQL;
- usar Ctrl+Enter para executar;
- mostrar loading durante execução;
- mostrar erro SQL quando houver;
- mostrar feedback correto/incorreto;
- mostrar botão para próximo desafio quando correto;
- não mostrar solução automaticamente.

Layout mobile:
- organizar em abas: Enunciado, Tabelas, Editor, Resultado.

Componentes:
- SqlEditor
- SchemaExplorer
- HintPanel
- ResultTable
- FeedbackBox
- DifficultyBadge
- ActiveEventBanner

A tela deve ser moderna, limpa, responsiva e com sensação de jogo.
```

---

# 5. Prompt específico para SQL Runner

```text
Implemente o endpoint /api/sql/execute da SQL Arena.

Entrada:
- challenge_id
- sql

Fluxo:
1. verificar autenticação;
2. buscar desafio ativo;
3. validar se SQL começa com SELECT ou WITH;
4. bloquear múltiplas statements;
5. bloquear palavras perigosas;
6. validar tabelas permitidas;
7. executar SQL do usuário com role read-only;
8. usar transação read-only;
9. aplicar statement_timeout de 10 segundos;
10. limitar resultado a 500 linhas;
11. executar query esperada do desafio;
12. normalizar resultados;
13. comparar exatamente;
14. salvar tentativa;
15. se correto e ainda não concluído, conceder pontos;
16. aplicar evento ativo de multiplicador, se existir;
17. retornar resultado, feedback e pontos.

Nunca exponha credenciais no frontend.
```

---

# 6. Prompt específico para admin de desafios

```text
Implemente o painel admin de desafios da SQL Arena.

Funcionalidades:
- listar desafios;
- filtrar por módulo, dificuldade e status;
- criar desafio;
- editar desafio;
- ativar/desativar;
- testar query esperada;
- exibir preview do resultado esperado.

Campos do desafio:
- título;
- slug;
- módulo;
- tipo;
- dificuldade;
- pontos base;
- enunciado;
- tabelas permitidas;
- query esperada;
- dicas;
- explicação pós-acerto;
- tags;
- status;
- ordem.

O campo de query esperada deve usar editor SQL.
O botão testar deve executar a query esperada e mostrar colunas, linhas, tempo de execução e erros.
```

---

# 7. Alerta estratégico

Não comece pelo visual bonito.

Comece pelo motor:

```text
auth → schema → desafio → sql runner → validação → pontuação
```

Depois embeleze.

Se fizer o contrário, você terá uma casca bonita e um núcleo fraco.
