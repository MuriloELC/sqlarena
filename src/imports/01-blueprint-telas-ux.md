# Blueprint de Telas e UX — SQL Arena

## 1. Objetivo deste blueprint

Este documento descreve as telas, componentes, fluxo visual e comportamento de interface da SQL Arena.

Este é o blueprint mais importante para o frontend. Ele deve orientar a IA desenvolvedora a criar uma experiência consistente, gamificada, clara e agradável.

A interface deve parecer uma plataforma de aprendizado técnico com energia de jogo, não um sistema administrativo seco.

---

## 2. Direção visual

## 2.1 Personalidade da interface

A interface deve ser:

- moderna;
- limpa;
- gamificada;
- responsiva;
- visualmente leve;
- com bons espaços em branco;
- com feedback imediato;
- com sensação de progresso;
- com cards arredondados;
- com componentes reutilizáveis.

## 2.2 Referências de sensação

A experiência deve lembrar:

- SQLBolt na objetividade dos exercícios;
- Duolingo na progressão e motivação;
- plataformas de coding challenge na área de execução;
- dashboard moderno nos rankings e perfis.

## 2.3 Estilo recomendado

Usar:

- Tailwind CSS;
- shadcn/ui;
- cards com bordas suaves;
- ícones simples;
- badges de dificuldade;
- barra de progresso;
- animação leve ao ganhar pontos;
- contraste bom para leitura de código.

## 2.4 Tom da experiência

A plataforma deve fazer o usuário sentir:

```text
Estou avançando.
Estou ficando melhor.
Só mais um desafio.
```

Esse é o ponto central da UX.

---

# 3. Layout global

## 3.1 Estrutura base

Todas as telas autenticadas devem usar um layout comum:

```text
┌──────────────────────────────────────────────┐
│ Topbar                                       │
├──────────────┬───────────────────────────────┤
│ Sidebar      │ Conteúdo principal             │
│              │                               │
└──────────────┴───────────────────────────────┘
```

## 3.2 Topbar

A topbar deve conter:

- logo/nome SQL Arena;
- botão para alternar tema claro/escuro, se implementado;
- indicador de pontos do usuário;
- avatar do usuário;
- menu do usuário;
- alerta de evento ativo quando houver.

Exemplo:

```text
SQL Arena                       Evento 2x ativo  |  1.240 XP  |  Avatar
```

## 3.3 Sidebar

A sidebar deve conter:

- Dashboard;
- Trilha SQL;
- Ranking;
- Perfil;
- Admin, apenas se o usuário for administrador.

Exemplo:

```text
[Logo]
Dashboard
Trilha SQL
Ranking
Perfil

Admin
```

## 3.4 Responsividade

Em telas menores:

- sidebar vira menu lateral recolhível;
- editor SQL fica acima da tabela de resultado;
- painel de enunciado fica em abas;
- evitar layout espremido.

---

# 4. Tela de Login

## 4.1 Objetivo

Permitir que o usuário entre na plataforma de forma simples.

## 4.2 Componentes

- logo;
- título;
- subtítulo;
- campo email;
- campo senha;
- botão Entrar;
- botão Entrar com Google;
- botão Entrar com GitHub;
- link para criar conta;
- mensagem de erro.

## 4.3 Texto sugerido

Título:

```text
Entre na SQL Arena
```

Subtítulo:

```text
Resolva desafios SQL, ganhe pontos e suba no ranking.
```

Botão principal:

```text
Entrar
```

Botões sociais:

```text
Continuar com Google
Continuar com GitHub
```

## 4.4 Comportamentos

- Se login falhar, mostrar erro claro.
- Após login, redirecionar para Dashboard.
- Se usuário não tiver profile criado, criar profile automaticamente.

---

# 5. Tela de Cadastro

## 5.1 Objetivo

Permitir criação de conta.

## 5.2 Campos

- nome de exibição;
- username;
- email;
- senha;
- confirmar senha.

## 5.3 Regras

- username deve ser único;
- username deve ser usado no perfil público;
- senha deve ter validação mínima;
- após cadastro, redirecionar para onboarding ou dashboard.

## 5.4 Texto sugerido

Título:

```text
Crie sua conta
```

Subtítulo:

```text
Comece sua jornada prática em SQL.
```

---

# 6. Tela de Dashboard

## 6.1 Objetivo

Ser a tela inicial do usuário autenticado.

Deve mostrar o estado atual do usuário e incentivá-lo a continuar praticando.

## 6.2 Layout

```text
┌──────────────────────────────────────────────┐
│ Saudação + botão Continuar                   │
├────────────────────┬─────────────────────────┤
│ Card XP total      │ Card ranking semanal     │
├────────────────────┼─────────────────────────┤
│ Progresso da trilha│ Evento ativo             │
├────────────────────┴─────────────────────────┤
│ Desafios recomendados                         │
└──────────────────────────────────────────────┘
```

## 6.3 Componentes

### Saudação

Exemplo:

```text
Bom ver você de volta, Murilo.
```

Texto complementar:

```text
Continue de onde parou e avance mais um passo na trilha SQL.
```

### Card de pontos

Mostrar:

- pontos totais;
- pontos ganhos na semana;
- desafios concluídos.

### Card de ranking semanal

Mostrar:

- posição atual;
- pontos semanais;
- diferença para o próximo colocado.

### Progresso da trilha

Mostrar:

- módulo atual;
- porcentagem concluída;
- próximo desafio recomendado.

### Evento ativo

Se houver evento:

```text
Dobro de pontos ativo
Termina em 42 minutos
```

Se não houver evento:

```text
Nenhum evento ativo agora.
```

### Desafios recomendados

Cards com:

- título;
- módulo;
- dificuldade;
- pontos;
- botão Começar.

## 6.4 Estado vazio

Se usuário novo:

```text
Você ainda não começou sua trilha.
Comece pelo primeiro desafio de SELECT.
```

Botão:

```text
Iniciar trilha
```

---

# 7. Tela da Trilha SQL

## 7.1 Objetivo

Mostrar a progressão completa de aprendizado.

## 7.2 Layout

A trilha deve parecer um caminho ou sequência de módulos.

```text
Módulo 1 — Primeiros SELECTs
[Desafio] [Desafio] [Desafio]

Módulo 2 — Filtros
[Desafio] [Desafio] [Bloqueado]

Módulo 3 — Ordenação
[Bloqueado]
```

## 7.3 Módulo

Cada módulo deve mostrar:

- título;
- descrição;
- progresso;
- número de desafios;
- status.

Status possíveis:

```text
Não iniciado
Em andamento
Concluído
Bloqueado
```

## 7.4 Card de desafio

Cada card deve conter:

- título;
- dificuldade;
- pontos;
- status;
- botão.

Status do desafio:

```text
Disponível
Concluído
Bloqueado
Especial
```

## 7.5 Dificuldades

Usar badges:

```text
Fácil
Médio
Difícil
Especial
```

## 7.6 Regras de desbloqueio

Para MVP:

- Módulo 1 liberado;
- módulos seguintes desbloqueados ao concluir 70% do módulo anterior;
- admin pode liberar tudo futuramente.

---

# 8. Tela de Desafio SQL

## 8.1 Objetivo

Esta é a tela central do produto.

O usuário deve conseguir:

- entender a pergunta;
- consultar as tabelas disponíveis;
- escrever SQL;
- executar;
- ver resultado;
- receber feedback;
- pedir dicas.

## 8.2 Layout desktop recomendado

```text
┌─────────────────────────────────────────────────────────────┐
│ Header do desafio: título, dificuldade, pontos, status       │
├──────────────────────────────┬──────────────────────────────┤
│ Painel esquerdo               │ Painel direito               │
│ - Enunciado                   │ - Editor SQL                 │
│ - Dicas                       │ - Botão executar             │
│ - Estrutura das tabelas       │ - Resultado                  │
│ - Explicação após acerto      │ - Feedback                   │
└──────────────────────────────┴──────────────────────────────┘
```

## 8.3 Layout mobile

No mobile, usar abas:

```text
[Enunciado] [Tabelas] [Editor] [Resultado]
```

## 8.4 Header do desafio

Deve mostrar:

- título;
- módulo;
- dificuldade;
- pontos base;
- pontos com evento ativo, se houver;
- status de conclusão.

Exemplo:

```text
Clientes de Rondônia
Módulo: Filtros | Fácil | 10 XP
```

Se houver evento:

```text
Evento ativo: 2x pontos — este desafio vale 20 XP agora.
```

## 8.5 Painel de enunciado

Mostrar:

- enunciado claro;
- objetivo esperado;
- observações sobre ordenação quando necessário.

Exemplo:

```text
Liste o nome, email e cidade dos clientes que moram no estado de Rondônia.
```

Quando a ordem importar, o enunciado deve dizer explicitamente:

```text
Ordene o resultado pelo nome do cliente em ordem alfabética.
```

## 8.6 Dicas

As dicas devem ficar escondidas inicialmente.

Comportamento:

- botão "Ver dica";
- ao clicar, revela a próxima dica;
- registrar que o usuário abriu dica, se quiser estatística futura;
- no MVP, abrir dica não reduz pontos.

Exemplo:

```text
Dica 1: Use WHERE para filtrar registros.
Dica 2: A coluna de estado se chama state.
```

## 8.7 Estrutura das tabelas

A tela deve exibir as tabelas permitidas para o desafio.

Exemplo:

```text
customers
- id: uuid
- full_name: text
- email: text
- city: text
- state: text
- created_at: timestamp
```

Para relacionamentos:

```text
orders.customer_id → customers.id
order_items.order_id → orders.id
order_items.product_id → products.id
```

A estrutura deve ser clara o suficiente para o usuário montar a query sem sair da tela.

## 8.8 Editor SQL

Usar CodeMirror 6.

Recursos obrigatórios:

- highlight SQL;
- fonte monoespaçada;
- botão executar;
- atalho Ctrl+Enter para executar;
- estado de loading durante execução;
- preservar query digitada ao trocar entre abas da tela.

Query inicial opcional por desafio:

```sql
SELECT 
FROM 
WHERE ;
```

## 8.9 Botões

Botão principal:

```text
Executar SQL
```

Botões secundários:

```text
Limpar
Resetar exemplo
Ver dica
Próximo desafio
```

## 8.10 Resultado da execução

Mostrar em tabela:

- cabeçalho com nomes das colunas;
- linhas retornadas;
- tempo de execução;
- quantidade de linhas;
- aviso se resultado foi limitado.

Exemplo:

```text
Resultado: 8 linhas retornadas em 42ms
```

## 8.11 Feedback correto

Quando correto:

```text
Resposta correta! Você ganhou 10 XP.
```

Se evento ativo:

```text
Resposta correta! Evento 2x aplicado. Você ganhou 20 XP.
```

Mostrar:

- animação leve de pontos;
- botão para próximo desafio;
- explicação pós-acerto, se cadastrada.

## 8.12 Feedback incorreto

Quando resultado não bater:

```text
O resultado ainda não está correto.
Compare as colunas, a ordem das linhas e os filtros usados.
```

Não mostrar a resposta correta automaticamente.

## 8.13 Feedback de erro SQL

Exemplo:

```text
Erro na query: coluna "total" não existe.
```

A mensagem deve ser útil, mas não excessivamente técnica.

## 8.14 Sem mostrar solução automática

No MVP, o usuário não verá solução após errar várias vezes.

Isso foi uma decisão de produto.

## 8.15 Histórico de tentativas

No MVP, pode não aparecer na interface.

Mas o backend deve salvar tentativas.

Futuro: mostrar últimas tentativas do usuário.

---

# 9. Tela de Ranking

## 9.1 Objetivo

Estimular competição saudável.

## 9.2 Abas

- Ranking geral;
- Ranking semanal.

## 9.3 Layout

```text
# Ranking

[ Geral ] [ Semanal ]

1. Ana — 4.200 XP
2. João — 3.900 XP
3. Murilo — 3.500 XP
```

## 9.4 Colunas

- posição;
- avatar;
- nome;
- pontos;
- desafios concluídos;
- badge de nível, se implementado futuramente.

## 9.5 Destaque do usuário atual

A linha do usuário logado deve ser destacada.

Se ele não estiver no top 10, mostrar:

```text
Sua posição: #27 — 820 XP
```

## 9.6 Ranking semanal

Semana definida como:

```text
Segunda-feira 00:00 até domingo 23:59
Timezone: America/Sao_Paulo
```

---

# 10. Tela de Perfil Público

## 10.1 Objetivo

Mostrar progresso e identidade do usuário.

## 10.2 Componentes

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

## 10.3 Layout

```text
┌─────────────────────────────────────┐
│ Avatar  Nome do usuário             │
│ @username                           │
├─────────────────────────────────────┤
│ XP total | Ranking geral | Semana    │
├─────────────────────────────────────┤
│ Progresso por módulo                │
├─────────────────────────────────────┤
│ Atividade recente                   │
└─────────────────────────────────────┘
```

## 10.4 Privacidade

Perfil público deve mostrar apenas dados educacionais.

Não mostrar:

- email;
- SQL submetido;
- erros;
- dados sensíveis;
- informações administrativas.

---

# 11. Tela Admin — Visão Geral

## 11.1 Objetivo

Permitir que administradores gerenciem conteúdo e eventos sem mexer no código.

## 11.2 Menu Admin

- Dashboard Admin;
- Trilhas;
- Módulos;
- Desafios;
- Eventos;
- Tentativas;
- Usuários.

## 11.3 Dashboard Admin

Mostrar:

- total de usuários;
- desafios ativos;
- tentativas no dia;
- taxa de acerto;
- evento ativo;
- desafios mais errados.

---

# 12. Tela Admin — Lista de Desafios

## 12.1 Objetivo

Listar e gerenciar desafios.

## 12.2 Componentes

- busca;
- filtro por módulo;
- filtro por dificuldade;
- filtro por status;
- tabela de desafios;
- botão criar desafio.

## 12.3 Colunas da tabela

- título;
- módulo;
- tipo;
- dificuldade;
- pontos;
- status;
- ordem;
- ações.

Ações:

```text
Editar
Testar
Ativar/Desativar
Excluir
```

---

# 13. Tela Admin — Criar/Editar Desafio

## 13.1 Objetivo

Permitir cadastro completo de um desafio.

## 13.2 Campos

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

## 13.3 Layout recomendado

```text
┌─────────────────────────┬─────────────────────────┐
│ Formulário do desafio   │ Preview do desafio       │
└─────────────────────────┴─────────────────────────┘
```

## 13.4 Campo de query esperada

Usar editor SQL também no admin.

Botão:

```text
Testar query esperada
```

## 13.5 Teste de desafio

Ao testar, o sistema deve:

- executar query esperada;
- mostrar resultado;
- mostrar quantidade de linhas;
- mostrar tempo de execução;
- alertar se resultado é grande demais;
- alertar se query quebra.

---

# 14. Tela Admin — Eventos

## 14.1 Objetivo

Criar eventos temporários manualmente.

## 14.2 Tipos iniciais

- multiplicador global de pontos;
- desafio especial manual.

## 14.3 Campos

- título;
- descrição;
- tipo;
- multiplicador;
- data/hora de início;
- data/hora de fim;
- ativo/inativo.

## 14.4 Lista de eventos

Colunas:

- título;
- tipo;
- início;
- fim;
- status;
- multiplicador;
- ações.

## 14.5 Exemplo visual de evento ativo

No dashboard e na tela de desafio:

```text
🔥 Dobro de pontos ativo
Termina em 38 minutos
```

---

# 15. Componentes reutilizáveis

A IA desenvolvedora deve criar componentes reutilizáveis.

## 15.1 Componentes principais

- `AppLayout`
- `Topbar`
- `Sidebar`
- `ChallengeCard`
- `ModuleCard`
- `ProgressBar`
- `DifficultyBadge`
- `SqlEditor`
- `ResultTable`
- `SchemaExplorer`
- `HintPanel`
- `FeedbackBox`
- `RankingTable`
- `ProfileSummaryCard`
- `ActiveEventBanner`
- `AdminChallengeForm`
- `AdminEventForm`

---

# 16. Estados importantes da UI

Cada tela deve lidar com:

- loading;
- erro;
- vazio;
- sucesso;
- sem permissão;
- usuário não autenticado;
- evento ativo;
- desafio já concluído;
- query executando;
- query com erro;
- resposta correta;
- resposta incorreta.

---

# 17. Microinterações

Aplicar microinterações simples:

- animação ao ganhar XP;
- transição ao abrir dica;
- destaque visual em desafio concluído;
- confete leve opcional ao concluir módulo;
- loading no botão executar;
- badge pulsando em evento ativo.

Não exagerar. A interface deve continuar profissional.

---

# 18. Cores e semântica

Recomendação sem fixar paleta obrigatória:

- cor principal: azul, roxo ou verde tecnológico;
- sucesso: verde;
- erro: vermelho;
- alerta/evento: amarelo ou laranja;
- fundo: neutro claro/escuro;
- código: fundo escuro confortável.

---

# 19. Regras finais de UX

1. O usuário nunca deve ficar sem saber o próximo passo.
2. O botão principal deve ser óbvio.
3. O desafio deve caber visualmente na tela sem confusão.
4. A estrutura das tabelas deve estar sempre acessível.
5. A tela de desafio é mais importante que o dashboard.
6. O ranking deve motivar, não confundir.
7. O admin deve ser prático, não bonito demais.
8. Feedback deve ser imediato.
9. Não entregar solução automaticamente.
10. O produto deve parecer jogo, mas ensinar de verdade.
