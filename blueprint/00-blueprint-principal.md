# Blueprint Principal — SQL Arena

## 1. Visão geral

A **SQL Arena** é uma plataforma web gamificada para estudantes de banco de dados praticarem SQL por meio de desafios práticos, semelhantes ao SQLBolt, mas com progressão, ranking e eventos de pontuação inspirados em jogos educacionais.

A plataforma deve permitir que o usuário:
- crie conta;
- acesse uma trilha de aprendizado;
- resolva desafios SQL;
- execute consultas em um ambiente seguro;
- receba feedback imediato;
- ganhe pontos;
- suba no ranking geral e semanal;
- participe de eventos temporários criados manualmente por administradores.

O produto é voltado inicialmente para uso interno gratuito.

---

## 2. Público-alvo

Estudantes de banco de dados, principalmente iniciantes e intermediários.

Perfil esperado:
- alunos de faculdade, curso técnico ou bootcamp;
- pessoas aprendendo SQL do zero;
- estudantes que precisam praticar consultas reais;
- usuários que aprendem melhor com prática, visualização e repetição.

---

## 3. Referência de produto

A experiência deve misturar:

- **SQLBolt**: lições curtas, práticas e progressivas;
- **Duolingo**: sensação de jogo, progresso, pontos e ranking.

O sistema não deve parecer um CRUD acadêmico. Deve parecer uma plataforma de treino técnico com aparência moderna, leve e motivadora.

---

## 4. Escopo do MVP

A primeira versão deve conter:

1. autenticação com email/senha, Google e GitHub;
2. trilha de aprendizado SQL;
3. módulos organizados por dificuldade;
4. desafios de `SELECT` livre;
5. editor SQL com highlight de sintaxe;
6. painel lateral com estrutura das tabelas disponíveis;
7. dicas por desafio;
8. botão para executar query;
9. tabela com resultado retornado;
10. validação por igualdade exata do resultado;
11. pontuação por primeira conclusão correta;
12. ranking geral;
13. ranking semanal;
14. perfil público do usuário;
15. painel administrativo para criar desafios;
16. painel administrativo para criar eventos manuais de pontuação.

---

## 5. Fora do escopo do MVP

Não implementar inicialmente:

- comandos `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP` ou DDL livre;
- validação semântica profunda da query;
- casos ocultos;
- antiabuso avançado;
- certificado;
- assinatura paga;
- turmas;
- modo professor;
- IA obrigatória para corrigir respostas.

Esses recursos podem ser preparados na arquitetura, mas não devem travar o MVP.

---

## 6. Stack recomendada

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- CodeMirror 6 para editor SQL

### Backend

- Next.js Route Handlers ou API backend separada em Node.js/Fastify
- Camada intermediária obrigatória para executar SQL do usuário

### Banco principal

- Supabase PostgreSQL
- Supabase Auth
- Row Level Security para dados da aplicação

### Banco dos desafios

Opção recomendada para MVP interno:

- mesmo projeto Supabase;
- schema separado chamado `challenge_data`;
- role específica somente leitura para execução das queries.

Opção mais robusta para futuro público:

- PostgreSQL separado apenas para execução dos desafios.

---

## 7. Decisão arquitetural crítica

O SQL enviado pelo usuário nunca deve ser executado direto do frontend.

Fluxo correto:

```text
Usuário escreve SQL
        ↓
Frontend envia para /api/sql/execute
        ↓
Backend autentica o usuário
        ↓
Backend valida se a query é permitida
        ↓
Backend executa com role read-only
        ↓
Backend executa a query esperada
        ↓
Backend compara os resultados
        ↓
Backend registra tentativa e pontuação
        ↓
Frontend mostra feedback
```

---

## 8. Modelo de aprendizagem

A trilha principal será baseada em um banco de e-commerce realista.

Módulos sugeridos:

1. Primeiros SELECTs
2. Filtros com WHERE
3. Ordenação e LIMIT
4. Agregações
5. GROUP BY e HAVING
6. JOINs
7. Subqueries
8. CTEs
9. Window Functions
10. SQL aplicado a análise de vendas e financeiro

---

## 9. Tipos de desafio

### MVP

Apenas:

```text
SELECT livre
```

O usuário escreve uma query completa para responder ao enunciado.

### Futuro

Preparar arquitetura para:

- quiz;
- SQL com lacunas;
- corrigir query com erro;
- ordenar blocos SQL;
- interpretar resultado;
- desafios com comandos de manipulação em sandbox.

---

## 10. Validação inicial

A validação será por resultado exato.

O sistema deve comparar:

- quantidade de colunas;
- nomes das colunas;
- ordem das colunas;
- quantidade de linhas;
- ordem das linhas;
- valores retornados.

Isso permite várias queries corretas, desde que retornem exatamente o resultado esperado.

---

## 11. Gamificação inicial

O MVP terá:

- pontos por desafio;
- ranking geral;
- ranking semanal;
- perfil público;
- eventos manuais de multiplicador de pontos.

Regras iniciais:

- o usuário só ganha pontos na primeira vez que conclui corretamente um desafio;
- repetir desafio já concluído não gera pontos novamente;
- evento ativo pode multiplicar os pontos;
- ranking semanal considera pontos obtidos na semana atual.

---

## 12. Administração

O sistema deve ter painel admin para:

- criar trilhas;
- criar módulos;
- criar desafios;
- cadastrar dicas;
- definir query esperada;
- definir pontuação;
- ativar/desativar desafios;
- criar eventos de pontuação;
- visualizar tentativas.

---

## 13. Regras de segurança obrigatórias

1. Não expor credenciais no frontend.
2. Executar SQL apenas via backend.
3. Permitir apenas `SELECT` e `WITH` no MVP.
4. Bloquear múltiplas statements.
5. Bloquear palavras perigosas.
6. Usar role PostgreSQL somente leitura.
7. Usar transação read-only.
8. Aplicar timeout de 10 segundos.
9. Limitar quantidade de linhas retornadas.
10. Registrar todas as tentativas.

---

## 14. Fases de desenvolvimento

### Fase 1 — Base

- Next.js;
- Supabase;
- autenticação;
- layout base;
- rotas protegidas;
- tabela `profiles`.

### Fase 2 — Trilha e desafios

- tabelas de trilha, módulos e desafios;
- tela de trilha;
- tela de desafio;
- dataset e-commerce inicial.

### Fase 3 — Execução SQL

- editor SQL;
- endpoint `/api/sql/execute`;
- execução segura;
- timeout;
- resultado em tabela.

### Fase 4 — Validação e pontos

- execução da query esperada;
- comparação exata;
- registro de tentativa;
- pontuação;
- progresso;
- ranking.

### Fase 5 — Admin

- CRUD de desafios;
- CRUD de módulos;
- CRUD de eventos;
- teste de query esperada.

### Fase 6 — Polimento

- animações;
- experiência de jogo;
- perfil público;
- cards de progresso;
- eventos ativos em destaque.

---

## 15. Critério de MVP pronto

O MVP está pronto quando:

- usuário consegue se cadastrar;
- usuário consegue fazer login;
- usuário acessa a trilha;
- usuário abre um desafio;
- usuário vê estrutura das tabelas;
- usuário escreve SQL;
- backend executa a query com segurança;
- sistema compara o resultado;
- sistema mostra feedback;
- sistema salva a tentativa;
- sistema pontua corretamente;
- ranking geral funciona;
- ranking semanal funciona;
- admin consegue criar desafio;
- admin consegue criar evento;
- evento altera pontuação corretamente.
