# Atualizacoes pendentes do app

Arquivo de apoio para registrar ajustes identificados durante testes. Cada item deve ser revisado antes de entrar em uma rodada de correcao.

## 1. Painel de teste de query oculta linhas retornadas

- Status: implementado
- Prioridade: alta
- Area: Admin > editar desafio > Validacao SQL > Testar query
- Problema: ao testar uma query, o painel informa o total correto de linhas retornadas, mas a tabela exibida mostra menos linhas.
- Evidencia: no teste citado, o painel informa `Linhas: 6`, mas a grade mostra apenas 5 linhas.
- Exemplo: desafio `margem-estimada-por-categoria`, modulo `JOINs intermediarios`.
- Impacto: a validacao visual fica incompleta, porque nao da para conferir se todas as linhas esperadas realmente foram retornadas.
- Observacao tecnica: em `src/app/pages/AdminChallengeEdit.tsx`, o resultado do teste e renderizado com `testResult.rows.slice(0, 5)`, ocultando linhas adicionais sem aviso claro.
- Resultado esperado: o painel deve permitir validar todas as linhas retornadas pela query. Pode exibir todas as linhas ou manter uma previa com aviso claro, por exemplo `Mostrando 5 de 6 linhas`, e um controle para expandir.
- Implementacao: o painel administrativo de teste agora renderiza todas as linhas retornadas por `testResult.rows`, mantendo o scroll do container e o aviso de limite quando o backend sinalizar truncamento.
- Criterios de aceite:
  - A contagem total de linhas nao deve divergir silenciosamente da tabela visivel.
  - No desafio `margem-estimada-por-categoria`, as 6 linhas retornadas devem estar acessiveis no painel.
  - Se houver truncamento, a UI deve informar explicitamente quantas linhas ficaram ocultas.

## 2. Enunciados incompletos em varios desafios

- Status: implementado para novas questoes; existentes preservados
- Prioridade: alta
- Area: conteudo dos desafios
- Problema: varios desafios nao deixam explicitos todos os requisitos que a query oficial exige, como alias de colunas, direcao de ordenacao, limites, filtros ou nomes finais dos campos.
- Impacto: o aluno pode montar uma query conceitualmente correta, mas falhar na validacao por detalhes que nao aparecem no enunciado.
- Abrangencia: auditar todos os desafios comparando `prompt`, `starter_sql`, `expected_sql` e validacao esperada.
- Implementacao: os desafios existentes nao foram alterados por restricao de escopo. As 100 novas questoes inativas foram criadas com enunciados completos, aliases obrigatorios, ordenacao, filtros, agrupamentos e limites descritos quando exigidos pela query oficial.

### Exemplo identificado

- Modulo: `JOINs intermediarios`
- Desafio: `margem-estimada-por-categoria`
- Enunciado atual: `Calcule estimated_margin por categoria usando sum((price - cost) * quantity). Ordene pela maior margem.`
- Lacunas apontadas:
  - O enunciado nao deixa claro que `categories.name` deve ser retornado com alias `category_name`.
  - A ordenacao deve ficar explicitamente descrita como ordem decrescente por `estimated_margin`.
  - O formato final das colunas esperadas deveria estar no texto do desafio.
- Query oficial esperada hoje:

```sql
SELECT c.name AS category_name, sum((p.price - p.cost) * oi.quantity) AS estimated_margin
FROM categories c
JOIN products p ON p.category_id = c.id
JOIN order_items oi ON oi.product_id = p.id
GROUP BY c.name
ORDER BY estimated_margin DESC;
```

### Texto sugerido para esse desafio

Calcule a margem estimada por categoria. Retorne `categories.name` como `category_name` e `sum((price - cost) * quantity)` como `estimated_margin`. Agrupe por categoria e ordene por `estimated_margin` em ordem decrescente.

### Criterios de aceite para a revisao dos enunciados

- Cada desafio deve informar os nomes das colunas finais quando a validacao depender deles.
- Todo alias obrigatorio deve aparecer no enunciado.
- Toda ordenacao obrigatoria deve informar coluna e direcao (`ASC` ou `DESC`, ou texto equivalente como crescente/decrescente).
- Todo `LIMIT`, filtro, agrupamento ou criterio de desempate exigido pela query oficial deve estar descrito no enunciado.
- O desafio citado deve deixar claro que a primeira coluna deve ser `category_name` e a segunda `estimated_margin`.

## 3. Dicas personalizadas para cada desafio

- Status: implementado para novas questoes; existentes preservados
- Prioridade: media
- Area: conteudo dos desafios e experiencia do aluno
- Objetivo: cada desafio deve ter dicas proprias, alinhadas ao enunciado, a query oficial e aos erros comuns daquele exercicio.
- Problema: sem dicas personalizadas, o aluno pode ficar travado sem receber orientacao especifica sobre o conceito que o desafio esta cobrando.
- Resultado esperado: cada desafio ativo deve ter uma sequencia curta de dicas progressivas, indo de uma orientacao conceitual ate um direcionamento mais pratico, sem entregar a resposta completa.
- Implementacao: as 100 novas questoes inativas foram criadas com pelo menos 2 dicas personalizadas e progressivas. Os desafios existentes nao tiveram dicas alteradas por restricao de escopo.
- Observacao de conteudo: as dicas tambem devem reforcar requisitos que costumam passar despercebidos, como aliases obrigatorios, direcao da ordenacao, `LIMIT`, filtros, agrupamentos e criterios de desempate.
- Criterios de aceite:
  - Todo desafio ativo deve ter pelo menos 2 dicas personalizadas.
  - As dicas devem seguir uma ordem progressiva de ajuda.
  - As dicas devem ser especificas do desafio, evitando textos genericos reaproveitados sem contexto.
  - Dicas de desafios com validacao sensivel a formato devem mencionar aliases, colunas finais e ordenacao quando isso for parte obrigatoria da resposta.
  - No desafio `margem-estimada-por-categoria`, as dicas devem orientar o uso de `JOIN` entre `categories`, `products` e `order_items`, a agregacao `sum((price - cost) * quantity)`, o alias `category_name` e a ordenacao decrescente por `estimated_margin`.

## 4. Filtros por modulo na aba de desafios

- Status: pendente
- Prioridade: media
- Area: Desafios
- Problema: na aba de desafios, hoje so e possivel filtrar a lista por status. Nao ha um filtro por modulo para visualizar todos os desafios de um modulo especifico.
- Impacto: fica dificil revisar, administrar ou estudar os desafios agrupados por modulo, porque o usuario precisa procurar manualmente na lista completa ou combinar informacoes fora da propria tela.
- Resultado esperado: a aba de desafios deve permitir filtrar por modulo, mantendo tambem o filtro atual por status.
- Criterios de aceite:
  - Deve existir um controle de filtro por modulo na aba de desafios.
  - Deve ser possivel selecionar um modulo especifico e visualizar todos os desafios associados a ele.
  - O filtro por modulo deve funcionar em conjunto com o filtro por status.
  - Deve existir uma opcao para voltar a visualizar desafios de todos os modulos.

## 5. Revisao das 110 questoes iniciais para o novo modelo de desafio

- Status: pendente
- Prioridade: alta
- Area: conteudo dos desafios, experiencia do aluno e modelo de validacao
- Objetivo: revisar as 110 questoes iniciais para o novo modelo de conteudo, com enunciados mais completos, dicas personalizadas, base de dados em portugues e um bloco separado de colunas esperadas junto do objetivo do desafio.
- Problema: quando o enunciado precisa informar todos os nomes exatos de colunas e aliases, o texto fica artificial e menos fluido. Alem disso, uma base de dados em ingles aumenta o atrito para alunos iniciantes que estao aprendendo SQL em portugues.
- Resultado esperado: cada desafio deve apresentar um objetivo claro e natural, um bloco estruturado de colunas esperadas e dicas progressivas especificas. O aluno deve entender o que precisa resolver sem depender de detalhes escondidos na query oficial.
- Modelo sugerido na tela do desafio:
  - Objetivo: texto natural explicando a tarefa de negocio ou analise.
  - Colunas esperadas: lista separada com nomes finais das colunas, ordem esperada e, quando util, uma descricao curta do que cada coluna representa.
  - Dicas: orientacoes personalizadas e progressivas, sem entregar a query completa.
  - Resultado/validacao: continua comparando a resposta com a estrutura esperada pela validacao.
- Observacao de produto: o bloco de colunas esperadas permite que o enunciado seja mais humano. Exemplo: em vez de escrever no objetivo que a coluna precisa se chamar exatamente `category_name`, o objetivo pode falar naturalmente de categorias, e o bloco "Colunas esperadas" informa o nome tecnico exigido.
- Observacao de conteudo: a revisao deve considerar tabelas, colunas e dados em portugues sempre que isso melhorar a aprendizagem. Exemplo: preferir nomes como `clientes`, `pedidos`, `produtos`, `categorias`, `itens_pedido`, `nome`, `preco`, `quantidade`, quando a migracao for viavel.
- Observacao tecnica: avaliar se as colunas esperadas devem virar um campo estruturado no banco, por exemplo `expected_columns`, ou se podem ser derivadas de uma fonte ja existente. O ideal e a UI nao depender de texto livre do enunciado para saber quais colunas exibir.
- Criterios de aceite:
  - As 110 questoes iniciais devem ser auditadas e ajustadas para o novo padrao.
  - Todo desafio deve ter um enunciado completo, natural e alinhado com a query oficial.
  - Todo desafio deve ter um bloco visivel de colunas esperadas junto do objetivo.
  - O bloco de colunas esperadas deve informar nome final da coluna, ordem esperada e descricao quando necessario.
  - Todo desafio deve ter dicas personalizadas, progressivas e especificas para a solucao esperada.
  - A base de dados usada pelos desafios deve ser revisada para nomenclatura em portugues, incluindo tabelas, colunas e exemplos de dados quando aplicavel.
  - A validacao deve continuar exigindo os nomes e a ordem correta das colunas, mas esses requisitos devem aparecer no bloco estruturado de colunas esperadas, nao escondidos apenas no enunciado ou na query oficial.
  - A tela do desafio deve manter o enunciado fluido, evitando textos mecanicos que listam aliases, formatos e nomes tecnicos dentro do paragrafo principal.

## 6. Reformulacao do modulo de UNION

- Status: pendente
- Prioridade: alta
- Area: conteudo dos desafios e progressao pedagogica
- Objetivo: reformular o modulo de `UNION` com desafios que ensinem uma ideia real de consolidacao de dados, e nao apenas a mecanica de juntar dois `SELECT`.
- Problema: desafios de `UNION` que pedem somente para empilhar dois resultados ficam artificiais e pouco memoraveis. O aluno aprende a sintaxe, mas nao entende quando ou por que usar `UNION`, `UNION ALL` ou padronizacao de colunas entre fontes diferentes.
- Resultado esperado: o modulo deve apresentar cenarios em que combinar consultas resolva um problema de negocio, analise ou organizacao de dados.
- Direcoes de conteudo:
  - Consolidar entidades parecidas vindas de tabelas diferentes, como clientes e fornecedores em uma lista unica de contatos.
  - Combinar eventos de naturezas diferentes em uma linha do tempo unica, como pedidos, pagamentos e entregas.
  - Comparar `UNION` e `UNION ALL`, mostrando quando remover duplicatas e quando preservar ocorrencias repetidas.
  - Padronizar colunas com aliases e valores fixos, como adicionar uma coluna `origem` para identificar de qual tabela cada linha veio.
  - Criar relatorios operacionais a partir de fontes distintas, como movimentacoes de entrada e saida, atividades de usuarios ou alertas de estoque.
  - Usar `ORDER BY` e filtros depois da uniao para transformar o resultado combinado em uma consulta util.
- Criterios de aceite:
  - Os desafios do modulo devem ter contexto claro e aplicacao pratica.
  - Nenhum desafio deve existir apenas para "juntar dois selects" sem uma finalidade compreensivel.
  - Cada desafio deve deixar claro por que a uniao de resultados e necessaria.
  - O modulo deve cobrir diferencas entre `UNION` e `UNION ALL`.
  - Os desafios devem exercitar compatibilidade de colunas, aliases, valores constantes e ordenacao do resultado final.
  - As dicas devem explicar a ideia por tras da uniao, nao apenas sugerir a palavra-chave `UNION`.
