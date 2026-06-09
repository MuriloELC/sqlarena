# Blueprint do SQL Runner e Validação — SQL Arena

## 1. Objetivo

Este documento define como a plataforma deve executar SQL enviado por usuários e validar se a resposta do desafio está correta.

Este é o núcleo técnico mais sensível do projeto.

Erro aqui compromete segurança, estabilidade e confiabilidade da plataforma.

---

# 2. Princípio central

O usuário nunca deve executar SQL diretamente contra o banco pelo frontend.

Sempre usar backend intermediário.

Fluxo:

```text
Frontend
  ↓
POST /api/sql/execute
  ↓
Backend
  ↓
Validação de segurança
  ↓
Banco de desafios com role read-only
  ↓
Comparação com query esperada
  ↓
Registro de tentativa e pontuação
```

---

# 3. Endpoint principal

## POST /api/sql/execute

### Request

```json
{
  "challenge_id": "uuid",
  "sql": "SELECT name, price FROM products ORDER BY price DESC;"
}
```

### Response correta

```json
{
  "status": "correct",
  "is_correct": true,
  "points_awarded": 20,
  "execution_time_ms": 48,
  "result": {
    "columns": ["name", "price"],
    "rows": [
      ["Produto A", "199.90"],
      ["Produto B", "149.90"]
    ]
  },
  "message": "Resposta correta!"
}
```

### Response incorreta

```json
{
  "status": "incorrect",
  "is_correct": false,
  "points_awarded": 0,
  "execution_time_ms": 42,
  "result": {
    "columns": ["name", "price"],
    "rows": [
      ["Produto C", "99.90"]
    ]
  },
  "message": "O resultado ainda não corresponde ao esperado."
}
```

### Response com erro

```json
{
  "status": "error",
  "is_correct": false,
  "points_awarded": 0,
  "error": "column \"total\" does not exist"
}
```

---

# 4. Regras do MVP

No MVP, permitir apenas:

```text
SELECT
WITH
```

Bloquear:

```text
INSERT
UPDATE
DELETE
MERGE
DROP
ALTER
CREATE
TRUNCATE
GRANT
REVOKE
COPY
CALL
DO
VACUUM
ANALYZE
EXPLAIN ANALYZE
```

---

# 5. Timeout

Toda query deve ter timeout máximo de 10 segundos.

Aplicar em duas camadas:

1. timeout da aplicação;
2. timeout do PostgreSQL.

Exemplo:

```sql
set local statement_timeout = '10s';
```

---

# 6. Transação read-only

Toda execução deve ocorrer dentro de transação somente leitura.

Exemplo:

```sql
begin read only;
set local statement_timeout = '10s';
-- query do usuário
commit;
```

Se der erro:

```sql
rollback;
```

---

# 7. Role de execução

A API deve conectar ao banco de desafios usando uma role limitada:

```text
challenge_runner
```

Essa role só pode:

- acessar schema `challenge_data`;
- executar `SELECT` nas tabelas educacionais.

Não pode:

- acessar tabelas da aplicação;
- alterar dados;
- criar objetos;
- apagar objetos;
- acessar autenticação;
- conceder permissões.

---

# 8. Validação inicial da query

A validação inicial pode ser pragmática.

## 8.1 Etapas

1. Remover comentários SQL.
2. Normalizar espaços.
3. Verificar se existe apenas uma statement.
4. Exigir que comece com `SELECT` ou `WITH`.
5. Bloquear palavras perigosas.
6. Bloquear schemas não permitidos.
7. Verificar tabelas permitidas para o desafio.
8. Executar com timeout.

## 8.2 Comentários a remover

Remover:

```sql
-- comentário de linha
/* comentário de bloco */
```

## 8.3 Múltiplas statements

Bloquear queries com múltiplos comandos.

Exemplo proibido:

```sql
SELECT * FROM products; DROP TABLE products;
```

## 8.4 Observação importante

Validação por regex não é perfeita.

Para MVP interno, pode ser aceitável com role read-only e transação read-only.

Para produto público, usar parser SQL apropriado.

---

# 9. Tabelas permitidas por desafio

Cada desafio terá um campo:

```text
allowed_tables
```

Exemplo:

```json
["customers", "orders"]
```

O backend deve impedir consultas a tabelas fora dessa lista.

Exemplo proibido:

```sql
SELECT * FROM payments;
```

Se `payments` não estiver nas tabelas permitidas do desafio, bloquear.

---

# 10. Execução da query do usuário

Pseudocódigo:

```ts
async function runUserSql(userSql: string, allowedTables: string[]) {
  const cleanSql = sanitizeSql(userSql)

  validateSingleStatement(cleanSql)
  validateSelectOnly(cleanSql)
  validateNoDangerousKeywords(cleanSql)
  validateAllowedTables(cleanSql, allowedTables)

  return await runReadOnlyQuery(cleanSql, {
    statementTimeoutMs: 10000,
    maxRows: 500
  })
}
```

---

# 11. Execução da query esperada

A query esperada fica cadastrada no desafio.

Ela também deve ser executada no backend.

Pseudocódigo:

```ts
const expectedResult = await runReadOnlyQuery(challenge.expected_sql, {
  statementTimeoutMs: 10000,
  maxRows: 500
})
```

A query esperada deve ser testada pelo admin antes de publicar o desafio.

---

# 12. Limite de linhas

O resultado exibido ao usuário deve ser limitado.

Regra inicial:

```text
máximo de 500 linhas
```

Se um desafio retorna mais de 500 linhas, o problema não é o usuário. O desafio foi mal desenhado.

O admin deve receber alerta ao testar uma query esperada muito grande.

---

# 13. Normalização de resultado

Antes de comparar, converter os resultados para estrutura canônica.

Exemplo:

```json
{
  "columns": ["name", "price"],
  "rows": [
    ["Notebook", "3500.00"],
    ["Monitor", "1200.00"]
  ]
}
```

## 13.1 Regras

- preservar ordem das colunas;
- preservar nomes das colunas;
- preservar ordem das linhas;
- converter datas para ISO;
- converter decimal para string padronizada;
- converter null para null JSON;
- não ordenar automaticamente;
- não renomear colunas automaticamente.

---

# 14. Comparação exata

A resposta é correta apenas se o resultado do usuário for exatamente igual ao resultado esperado.

Comparar:

1. quantidade de colunas;
2. nomes das colunas;
3. ordem das colunas;
4. quantidade de linhas;
5. ordem das linhas;
6. valores.

## 14.1 Consequência para os enunciados

Como a ordem importa, os enunciados devem ser específicos.

Exemplo ruim:

```text
Liste os produtos.
```

Exemplo bom:

```text
Liste o nome e preço dos produtos ativos, ordenando pelo preço do maior para o menor.
```

---

# 15. Pontuação

Se correto:

1. verificar se usuário já concluiu o desafio;
2. se não concluiu, calcular pontos;
3. aplicar evento ativo, se houver;
4. salvar em `point_events`;
5. salvar em `user_challenge_progress`;
6. atualizar `profiles.total_points`, se for usar contador materializado.

Se já concluiu:

- feedback correto;
- pontos iguais a zero;
- informar que o desafio já foi concluído.

---

# 16. Eventos de multiplicador

Antes de pontuar, verificar se há evento ativo.

Regra:

```text
starts_at <= now <= ends_at
is_active = true
type = points_multiplier
```

Cálculo:

```text
points_awarded = base_points * multiplier
```

Exemplo:

```text
10 XP base * 2 = 20 XP
```

---

# 17. Registro de tentativas

Toda tentativa deve ser salva, correta ou incorreta.

Salvar:

- usuário;
- desafio;
- SQL enviado;
- correto/incorreto;
- erro, se houver;
- tempo de execução;
- pontos ganhos;
- evento ativo;
- timestamp.

Isso será útil para:
- auditoria;
- estatísticas;
- melhorias futuras;
- IA pedagógica.

---

# 18. Pseudocódigo completo

```ts
async function executeChallengeSql(userId, challengeId, submittedSql) {
  const challenge = await getChallenge(challengeId)

  if (!challenge || !challenge.is_active) {
    throw new Error("Desafio não encontrado ou inativo")
  }

  try {
    const validatedSql = validateSql({
      sql: submittedSql,
      allowedTables: challenge.allowed_tables
    })

    const start = Date.now()

    const userResult = await runReadOnlyQuery(validatedSql, {
      timeoutMs: 10000,
      maxRows: 500
    })

    const expectedResult = await runReadOnlyQuery(challenge.expected_sql, {
      timeoutMs: 10000,
      maxRows: 500
    })

    const executionTimeMs = Date.now() - start

    const normalizedUser = normalizeResult(userResult)
    const normalizedExpected = normalizeResult(expectedResult)

    const isCorrect = deepEqual(normalizedUser, normalizedExpected)

    let pointsAwarded = 0
    let activeEvent = null

    if (isCorrect) {
      const alreadyCompleted = await hasCompletedChallenge(userId, challengeId)

      if (!alreadyCompleted) {
        activeEvent = await getActivePointsEvent()
        pointsAwarded = calculatePoints(challenge.base_points, activeEvent)

        await markChallengeCompleted({
          userId,
          challengeId,
          pointsAwarded,
          executionTimeMs
        })

        await createPointEvent({
          userId,
          challengeId,
          points: pointsAwarded,
          source: "challenge_completed"
        })
      }
    }

    await saveAttempt({
      userId,
      challengeId,
      submittedSql,
      isCorrect,
      executionTimeMs,
      pointsAwarded,
      activeEventId: activeEvent?.id ?? null
    })

    return {
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      result: normalizedUser
    }

  } catch (error) {
    await saveAttempt({
      userId,
      challengeId,
      submittedSql,
      isCorrect: false,
      errorMessage: error.message,
      pointsAwarded: 0
    })

    return {
      status: "error",
      is_correct: false,
      points_awarded: 0,
      error: error.message
    }
  }
}
```

---

# 19. Erros tratados

A API deve tratar:

- query vazia;
- query não permitida;
- múltiplas statements;
- tabela não permitida;
- timeout;
- erro de sintaxe SQL;
- coluna inexistente;
- desafio inexistente;
- usuário não autenticado;
- usuário sem permissão;
- query esperada inválida.

---

# 20. Decisão final

Para MVP:

```text
Validação por resultado exato + execução segura + SELECT only
```

Não tentar resolver todos os casos avançados agora.

A qualidade do projeto depende mais de executar bem essa base do que de empilhar funcionalidades.
