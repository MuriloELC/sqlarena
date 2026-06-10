# SQL Arena

MVP de plataforma gamificada para praticar SQL, seguindo os blueprints em `blueprint/`.

## Rodar localmente

```bash
npm install
npm run dev
```

O projeto atual roda em Vite/React com Supabase Auth, trilha, desafios, perfil, ranking, eventos e admin vindos do banco. A execucao SQL publica passa por funcoes server-side em `/api`.

## Build

```bash
npm run build
npm run typecheck
```

## Banco/Supabase

Os artefatos iniciais estao em:

- `supabase/schema.sql`: tabelas da aplicacao, schema `challenge_data`, views, RLS e grants do runner.
- `supabase/seed.sql`: trilha, modulos, desafios e dataset pequeno de e-commerce.

Variaveis esperadas para a integracao real com Supabase/Backend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHALLENGE_DATABASE_URL=
CHALLENGE_RUNNER_DATABASE_URL=
```

Regra importante: `CHALLENGE_RUNNER_DATABASE_URL` deve usar uma role somente leitura, com acesso apenas ao schema `challenge_data`. O frontend nunca deve receber essa variavel.

`CHALLENGE_DATABASE_URL` fica somente no backend e executa consultas privilegiadas da API. `SUPABASE_SERVICE_ROLE_KEY` e opcional neste projeto; se nao for configurada, a API usa a publishable key apenas para validar o token do usuario no Supabase Auth.

No frontend Vite, use `VITE_SUPABASE_PUBLISHABLE_KEY` ou `VITE_SUPABASE_ANON_KEY`. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, senha do banco ou qualquer `DATABASE_URL` em variaveis com prefixo `VITE_`.

### Cadastro em desenvolvimento

Em projetos hospedados no Supabase, a confirmacao de email fica ativada por padrao e usa o servico de email interno do Supabase. Esse servico tem limite baixo de envio, entao cadastros repetidos podem retornar `Email rate limit exceeded`.

Para testar o cadastro sem depender de envio de email:

1. Abra o painel do Supabase do projeto.
2. Va em `Authentication > Providers > Email`.
3. Desative `Confirm email`.
4. Salve e tente criar a conta novamente.

Para producao, reative a confirmacao de email e configure um provedor SMTP proprio se o volume de usuarios passar do limite do email padrao do Supabase.

## Acessos de teste

As contas Auth de teste existentes tiveram uma senha temporaria comum definida para QA. A senha e os emails completos ficam fora do Git, no `.env` local:

```env
TEST_ADMIN_EMAIL=
TEST_STUDENT_EMAILS=
TEST_USERS_PASSWORD=
```

Contas atuais:

| Username | Papel |
| --- | --- |
| `muriloelc` | `admin` |
| `batata` | `student` |
| `murilo` | `student` |
| `user_a286b799` | `student` |

## Deploy em producao

1. Crie o projeto Supabase de producao.
2. Aplique `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Configure a role `challenge_runner` com login e senha forte fora do codigo:

```sql
alter role challenge_runner login password 'senha-forte-gerada';
```

4. Configure Auth no Supabase: email/senha, Google, GitHub, URL da Vercel e redirects.
5. Configure na Vercel as variaveis:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
CHALLENGE_DATABASE_URL=
CHALLENGE_RUNNER_DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

6. Faca deploy pela Vercel. O `vercel.json` ja define o build Vite, output `dist`, fallback SPA e funcoes Node em `/api`.

`SUPABASE_SERVICE_ROLE_KEY` e opcional. Ao usar o Supabase pooler com uma role customizada, o usuario da URL deve incluir o project ref, por exemplo `challenge_runner.<project-ref>`, embora a role no Postgres continue sendo `challenge_runner`.

## Estado atual

- Autenticacao usa Supabase Auth com email/senha, Google e GitHub.
- Trilha, desafios, perfil, ranking semanal/geral e eventos leem dados reais do Supabase.
- `POST /api/sql/execute` autentica o usuario, valida SQL `SELECT`/`WITH`, executa com role read-only, compara com a query esperada e registra tentativa/pontos.
- Pontuacao real e idempotente acontece em `record_challenge_attempt`, com `attempts`, `user_challenge_progress`, `point_events` e `profiles.total_points`.
- Admin lista/cria/edita desafios, testa query esperada server-side e gerencia eventos de pontuacao.
- O dataset inicial ainda e pequeno; para beta, expanda `supabase/seed.sql` com mais dados realistas e novos desafios.
