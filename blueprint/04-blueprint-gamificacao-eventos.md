# Blueprint de Gamificação e Eventos — SQL Arena

## 1. Objetivo

Este documento define o sistema de pontos, rankings, progresso e eventos temporários da SQL Arena.

A gamificação deve aumentar frequência de uso e motivação, sem atrapalhar o aprendizado.

---

# 2. Princípio da gamificação

A gamificação deve reforçar o comportamento certo:

```text
Praticar SQL com consistência.
```

Não deve recompensar apenas cliques, repetição inútil ou ações artificiais.

---

# 3. Pontuação

## 3.1 Pontos por dificuldade

Sugestão inicial:

```text
Fácil: 10 XP
Médio: 25 XP
Difícil: 50 XP
Especial: 100 XP
```

## 3.2 Regra de pontuação

O usuário ganha pontos apenas na primeira conclusão correta de cada desafio.

Se repetir um desafio já concluído:

- pode executar;
- pode receber feedback;
- não ganha XP novamente.

## 3.3 Pontos com evento ativo

Se houver evento de multiplicador ativo:

```text
pontos finais = pontos base * multiplicador
```

Exemplo:

```text
10 XP * 2 = 20 XP
```

---

# 4. Progresso

## 4.1 Progresso por desafio

Status:

```text
não iniciado
tentado
concluído
```

## 4.2 Progresso por módulo

Calcular:

```text
desafios concluídos / total de desafios ativos do módulo
```

## 4.3 Desbloqueio de módulos

Regra inicial:

```text
Módulo seguinte desbloqueia ao concluir 70% do módulo anterior.
```

## 4.4 Progresso da trilha

Calcular:

```text
desafios concluídos / total de desafios ativos da trilha
```

---

# 5. Ranking geral

## 5.1 Objetivo

Mostrar desempenho histórico total.

## 5.2 Ordenação

Ordenar por:

1. maior total de pontos;
2. maior número de desafios concluídos;
3. data de entrada mais antiga, se empatar.

## 5.3 Campos exibidos

- posição;
- avatar;
- nome;
- username;
- pontos totais;
- desafios concluídos.

---

# 6. Ranking semanal

## 6.1 Objetivo

Dar chance de competição recorrente.

Mesmo usuários novos conseguem competir semanalmente.

## 6.2 Período

Semana:

```text
Segunda-feira 00:00 até domingo 23:59
Timezone: America/Sao_Paulo
```

## 6.3 Ordenação

Ordenar por:

1. pontos obtidos na semana;
2. desafios concluídos na semana;
3. menor tempo médio de execução, futuramente se desejado.

---

# 7. Perfil público

## 7.1 Informações exibidas

- avatar;
- nome;
- username;
- pontos totais;
- posição no ranking geral;
- posição no ranking semanal;
- desafios concluídos;
- módulos concluídos;
- data de entrada;
- atividade recente.

## 7.2 Informações não exibidas

- email;
- SQL enviado;
- erros;
- dados privados;
- permissões internas.

---

# 8. Eventos temporários

## 8.1 Objetivo

Permitir que administradores criem eventos manuais para aumentar engajamento.

Tipos iniciais:

1. multiplicador global de pontos;
2. desafio especial manual.

---

## 8.2 Evento de multiplicador global

Exemplo:

```text
Dobro de pontos na próxima hora
```

Campos:

```text
título
descrição
multiplicador
início
fim
ativo
criado por
```

Regras:

- aplicado a todos os usuários;
- válido apenas dentro da janela de tempo;
- criado manualmente por admin;
- não recorrente no MVP.

---

## 8.3 Evento de desafio especial

Exemplo:

```text
Desafio Corujão
```

Regras:

- criado manualmente por admin;
- visível durante período definido;
- pode ter pontuação especial;
- aparece em destaque no dashboard.

---

# 9. Exibição de evento ativo

## 9.1 Dashboard

Banner:

```text
🔥 Dobro de pontos ativo
Todos os desafios concluídos agora valem 2x XP.
Termina em 38 minutos.
```

## 9.2 Tela de desafio

Mensagem no topo:

```text
Evento ativo: este desafio vale 20 XP agora.
```

## 9.3 Ranking

Opcionalmente mostrar aviso:

```text
Evento 2x ativo — o ranking semanal pode mudar rápido.
```

---

# 10. Regras de cálculo de pontos

Pseudocódigo:

```ts
function calculatePoints(basePoints, activeEvent) {
  if (!activeEvent) return basePoints

  if (activeEvent.type === "points_multiplier") {
    return Math.round(basePoints * activeEvent.multiplier)
  }

  return basePoints
}
```

---

# 11. Prevenção mínima de abuso

O usuário decidiu que antiabuso não será prioridade no MVP.

Mesmo assim, manter:

- registro de tentativas;
- registro de pontos;
- conclusão única por desafio;
- histórico de eventos ativos;
- data e hora de cada ação.

Isso evita perda de controle no futuro.

---

# 12. Futuras melhorias

Após MVP:

- streak diário;
- badges;
- níveis;
- missões diárias;
- desafios semanais;
- conquistas por tema;
- recompensas por consistência;
- estatísticas pessoais;
- ranking por turma;
- painel professor.

---

# 13. Regra de produto

Gamificação não pode compensar conteúdo fraco.

A plataforma só será boa se os desafios forem bons.

Pontos e ranking são aceleradores. O motor real do produto é a qualidade da prática.
