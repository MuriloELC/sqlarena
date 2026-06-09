# Blueprint Admin e Conteúdo — SQL Arena

## 1. Objetivo

Este documento define o painel administrativo e a estrutura de criação de conteúdo da SQL Arena.

O admin deve permitir que desafios sejam criados, testados e publicados sem alteração no código.

---

# 2. Perfis de acesso

## 2.1 Student

Pode:

- resolver desafios;
- ver trilha;
- ver ranking;
- ver perfil.

Não pode:

- criar desafios;
- editar conteúdo;
- ver tentativas de outros usuários;
- criar eventos.

## 2.2 Admin

Pode:

- criar trilhas;
- criar módulos;
- criar desafios;
- editar desafios;
- testar query esperada;
- ativar/desativar conteúdo;
- criar eventos;
- ver tentativas;
- consultar usuários.

---

# 3. Áreas do painel admin

Menu:

```text
Dashboard Admin
Trilhas
Módulos
Desafios
Eventos
Tentativas
Usuários
```

---

# 4. Dashboard Admin

Mostrar:

- total de usuários;
- usuários ativos na semana;
- total de desafios;
- desafios ativos;
- tentativas no dia;
- taxa média de acerto;
- desafios mais errados;
- evento ativo;
- últimos desafios criados.

---

# 5. Admin de Trilhas

## 5.1 Campos

- título;
- slug;
- descrição;
- ordem;
- ativo/inativo.

## 5.2 Ações

- criar;
- editar;
- ativar/desativar;
- reordenar.

---

# 6. Admin de Módulos

## 6.1 Campos

- trilha;
- título;
- slug;
- descrição;
- ordem;
- regra de desbloqueio;
- ativo/inativo.

## 6.2 Regra de desbloqueio

Para MVP:

```json
{
  "type": "previous_module_completion",
  "percentage": 70
}
```

---

# 7. Admin de Desafios

## 7.1 Lista de desafios

A lista deve conter:

- busca;
- filtro por trilha;
- filtro por módulo;
- filtro por dificuldade;
- filtro por status;
- botão criar desafio.

Colunas:

```text
Título
Módulo
Tipo
Dificuldade
Pontos
Status
Ordem
Ações
```

Ações:

```text
Editar
Testar
Ativar/Desativar
Excluir
```

---

## 7.2 Criar/editar desafio

Campos obrigatórios:

```text
Título
Slug
Módulo
Tipo
Dificuldade
Pontos base
Enunciado
Tabelas permitidas
Query esperada
Status
Ordem
```

Campos opcionais:

```text
Dicas
Explicação pós-acerto
Tags
```

## 7.3 Tipos iniciais

No MVP:

```text
free_select
```

Preparar para futuro:

```text
quiz
fill_blank
fix_query
order_blocks
```

---

# 8. Formulário de desafio

## 8.1 Título

Exemplo:

```text
Clientes de Rondônia
```

## 8.2 Slug

Exemplo:

```text
clientes-de-rondonia
```

## 8.3 Enunciado

Deve ser claro e objetivo.

Exemplo bom:

```text
Liste o nome, email e cidade dos clientes que moram no estado de Rondônia. Ordene o resultado pelo nome em ordem alfabética.
```

Exemplo ruim:

```text
Mostre os clientes de RO.
```

A validação é exata. Portanto, o enunciado precisa deixar explícito:

- colunas esperadas;
- filtros;
- ordenação;
- limite, quando houver.

## 8.4 Tabelas permitidas

Exemplo:

```json
["customers"]
```

Ou:

```json
["orders", "order_items", "products"]
```

## 8.5 Query esperada

Exemplo:

```sql
SELECT full_name, email, city
FROM challenge_data.customers
WHERE state = 'RO'
ORDER BY full_name;
```

## 8.6 Dicas

Exemplo:

```text
Dica 1: Use WHERE para filtrar o estado.
Dica 2: A coluna do estado se chama state.
Dica 3: Use ORDER BY para ordenar pelo nome.
```

## 8.7 Explicação pós-acerto

Exemplo:

```text
A cláusula WHERE limita os registros retornados. O ORDER BY garante que o resultado esteja na mesma ordem esperada pela validação.
```

---

# 9. Testador de desafio

## 9.1 Objetivo

Evitar publicação de desafios quebrados.

## 9.2 Botão

```text
Testar query esperada
```

## 9.3 Ao testar, o sistema deve mostrar

- se a query executou;
- tempo de execução;
- número de linhas;
- nomes das colunas;
- preview do resultado;
- alerta se retornar mais de 500 linhas;
- erro SQL, se houver.

## 9.4 Critérios para publicar

Um desafio só deve ser publicado se:

- a query esperada executa sem erro;
- retorna resultado adequado;
- tem título;
- tem enunciado;
- tem módulo;
- tem pontos;
- tem tabelas permitidas;
- está com status ativo.

---

# 10. Admin de Eventos

## 10.1 Lista de eventos

Colunas:

```text
Título
Tipo
Multiplicador
Início
Fim
Status
Ações
```

Ações:

```text
Editar
Ativar/Desativar
Excluir
```

## 10.2 Criar evento

Campos:

```text
Título
Descrição
Tipo
Multiplicador
Data/hora de início
Data/hora de fim
Ativo/Inativo
```

## 10.3 Tipos

```text
points_multiplier
special_challenge
```

## 10.4 Validações

- fim deve ser maior que início;
- multiplicador deve ser maior que 1 para eventos de multiplicador;
- não permitir evento sem título;
- permitir eventos sobrepostos apenas se for decisão consciente do admin.

---

# 11. Admin de Tentativas

## 11.1 Objetivo

Permitir auditoria e análise pedagógica.

## 11.2 Campos exibidos

- usuário;
- desafio;
- correto/incorreto;
- tempo de execução;
- pontos;
- data/hora;
- erro, se houver.

## 11.3 Detalhe da tentativa

Mostrar:

- SQL enviado;
- resultado, se armazenado futuramente;
- erro;
- evento ativo;
- pontos concedidos.

---

# 12. Admin de Usuários

## 12.1 Campos

- nome;
- username;
- email, apenas se permitido no contexto interno;
- role;
- pontos;
- desafios concluídos;
- data de criação.

## 12.2 Ações

- alterar role;
- desativar usuário, futuramente;
- visualizar perfil;
- visualizar tentativas.

---

# 13. Padrão de conteúdo dos desafios

## 13.1 Desafio bom

Um desafio bom tem:

- objetivo claro;
- contexto simples;
- colunas esperadas explícitas;
- ordenação explícita;
- uma dificuldade coerente;
- dicas progressivas;
- explicação curta.

## 13.2 Desafio ruim

Um desafio ruim:

- é ambíguo;
- permite muitos resultados corretos diferentes;
- não informa ordenação;
- exige conhecimento ainda não ensinado;
- retorna linhas demais;
- tem query esperada complexa demais para o módulo.

---

# 14. Checklist antes de publicar desafio

Antes de ativar um desafio, verificar:

- [ ] título claro;
- [ ] enunciado específico;
- [ ] módulo correto;
- [ ] dificuldade correta;
- [ ] pontos definidos;
- [ ] query esperada testada;
- [ ] tabelas permitidas corretas;
- [ ] resultado não passa de 500 linhas;
- [ ] ordenação explícita no enunciado;
- [ ] pelo menos uma dica cadastrada;
- [ ] explicação pós-acerto cadastrada.

---

# 15. Regra final

O painel admin deve ser simples e eficiente.

Não gastar energia exagerada deixando o admin bonito no MVP.

A experiência do aluno é prioridade.
