insert into tracks (id, title, description, slug, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', 'Trilha SQL', 'Do primeiro SELECT a analises de vendas.', 'trilha-sql', 1)
on conflict (slug) do nothing;

insert into modules (id, track_id, title, description, slug, sort_order, unlock_rule)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Primeiros SELECTs', 'Aprenda a consultar dados de uma tabela.', 'primeiros-selects', 1, null),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Filtros', 'Use WHERE para encontrar exatamente o que voce precisa.', 'filtros', 2, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'Ordenacao e LIMIT', 'Ordene resultados e retorne recortes pequenos.', 'ordenacao-limit', 3, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000101', 'Inserindo dados', 'Use INSERT para criar novos registros.', 'inserindo-dados', 4, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'Atualizando dados', 'Use UPDATE com WHERE para corrigir informacoes.', 'atualizando-dados', 5, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000101', 'Deletando dados', 'Use DELETE com cuidado e filtros claros.', 'deletando-dados', 6, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000101', 'Criando tabelas', 'Use CREATE TABLE para modelar estruturas novas.', 'criando-tabelas', 7, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000101', 'Alterando tabelas', 'Use ALTER TABLE para evoluir o schema.', 'alterando-tabelas', 8, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000101', 'Removendo tabelas', 'Use DROP TABLE apenas em objetos descartaveis.', 'removendo-tabelas', 9, '{"type":"previous_module_completion","percentage":70}')
on conflict (slug) do nothing;

insert into challenge_data.customers (id, full_name, email, city, state, created_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Alice Silva', 'alice@exemplo.com', 'Porto Velho', 'Rondonia', '2026-01-05 10:00:00'),
  ('10000000-0000-0000-0000-000000000002', 'Beto Souza', 'beto@exemplo.com', 'Ariquemes', 'Rondonia', '2026-01-07 10:00:00'),
  ('10000000-0000-0000-0000-000000000003', 'Carla Mendes', 'carla@exemplo.com', 'Ji-Parana', 'Rondonia', '2026-01-09 10:00:00'),
  ('10000000-0000-0000-0000-000000000004', 'Daniel Lima', 'daniel@exemplo.com', 'Vilhena', 'Rondonia', '2026-01-11 10:00:00'),
  ('10000000-0000-0000-0000-000000000005', 'Helena Costa', 'helena@exemplo.com', 'Sao Paulo', 'SP', '2026-01-13 10:00:00'),
  ('10000000-0000-0000-0000-000000000006', 'Joao Pedro', 'joao@exemplo.com', 'Rio de Janeiro', 'RJ', '2026-01-15 10:00:00'),
  ('10000000-0000-0000-0000-000000000007', 'Marina Alves', 'marina@exemplo.com', 'Campinas', 'SP', '2026-01-17 10:00:00'),
  ('10000000-0000-0000-0000-000000000008', 'Rafael Nunes', 'rafael@exemplo.com', 'Niteroi', 'RJ', '2026-01-19 10:00:00')
on conflict (id) do nothing;

insert into challenge_data.categories (id, name)
values
  ('20000000-0000-0000-0000-000000000001', 'Informatica'),
  ('20000000-0000-0000-0000-000000000002', 'Casa'),
  ('20000000-0000-0000-0000-000000000003', 'Livros')
on conflict (id) do nothing;

insert into challenge_data.products (id, category_id, name, sku, price, cost, active, stock_quantity)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Notebook Pro 14', 'NB-PRO-14', 5200, 3900, true, 8),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Monitor 27', 'MON-27', 1400, 900, true, 0),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Teclado Mecanico', 'KEY-MEC', 420, 230, true, 0),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Cafeteira Smart', 'CAF-SM', 650, 350, true, 5),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'SQL na Pratica', 'BOOK-SQL', 120, 45, true, 18)
on conflict (id) do nothing;

insert into challenges (id, module_id, title, slug, type, difficulty, prompt, starter_sql, expected_sql, allowed_tables, setup_sql, validation_sql, base_points, explanation, sort_order)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Selecionando colunas especificas', 'selecionando-colunas-especificas', 'free_select', 'easy', 'Liste apenas nome completo e email dos clientes. Limite o resultado a 4 linhas.', 'SELECT full_name, email FROM customers LIMIT 4;', 'SELECT full_name, email FROM challenge_data.customers LIMIT 4;', array['customers'], null, null, 10, 'Selecionar somente as colunas necessarias deixa a consulta mais clara e barata.', 1),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 'Clientes de Rondonia', 'clientes-rondonia', 'free_select', 'easy', 'Liste o nome, email e cidade dos clientes que moram no estado de Rondonia. Ordene pelo nome.', 'SELECT full_name, email, city FROM customers WHERE state = ''Rondonia'' ORDER BY full_name;', 'SELECT full_name, email, city FROM challenge_data.customers WHERE state = ''Rondonia'' ORDER BY full_name;', array['customers'], null, null, 10, 'WHERE limita os registros retornados e ORDER BY garante a ordem esperada.', 1),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000202', 'Produtos sem estoque', 'produtos-sem-estoque', 'free_select', 'medium', 'Liste nome, SKU e preco dos produtos ativos com estoque igual a zero. Ordene pelo nome.', 'SELECT name, sku, price FROM products WHERE active = true AND stock_quantity = 0 ORDER BY name;', 'SELECT name, sku, price FROM challenge_data.products WHERE active = true AND stock_quantity = 0 ORDER BY name;', array['products'], null, null, 25, 'Filtros combinados ajudam a transformar uma tabela grande em uma resposta especifica.', 2),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000204', 'Inserindo uma categoria', 'inserindo-uma-categoria', 'insert_rows', 'easy', 'Insira uma nova categoria com id 20000000-0000-0000-0000-000000000090 e nome Games.', 'INSERT INTO categories (id, name) VALUES (...);', 'INSERT INTO categories (id, name) VALUES (''20000000-0000-0000-0000-000000000090'', ''Games'')', array['categories'], null, 'SELECT id::text, name FROM categories WHERE id = ''20000000-0000-0000-0000-000000000090''', 15, 'INSERT INTO adiciona uma nova linha informando colunas e valores na mesma ordem.', 1),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000204', 'Inserindo um produto', 'inserindo-um-produto', 'insert_rows', 'medium', 'Insira o produto Mouse Gamer na categoria Informatica com SKU MOU-GAME, preco 250, custo 120, ativo e estoque 12. Use o id 30000000-0000-0000-0000-000000000090.', 'INSERT INTO products (id, category_id, name, sku, price, cost, active, stock_quantity) VALUES (...);', 'INSERT INTO products (id, category_id, name, sku, price, cost, active, stock_quantity) VALUES (''30000000-0000-0000-0000-000000000090'', ''20000000-0000-0000-0000-000000000001'', ''Mouse Gamer'', ''MOU-GAME'', 250, 120, true, 12)', array['products'], null, 'SELECT id::text, name, sku, price::text, cost::text, active, stock_quantity FROM products WHERE id = ''30000000-0000-0000-0000-000000000090''', 25, 'Declarar colunas no INSERT deixa o comando previsivel mesmo quando a tabela evolui.', 2),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000204', 'Inserindo multiplas categorias', 'inserindo-multiplas-categorias', 'insert_rows', 'medium', 'Insira as categorias Games e Acessorios usando os ids 20000000-0000-0000-0000-000000000091 e 20000000-0000-0000-0000-000000000092.', 'INSERT INTO categories (id, name) VALUES (...), (...);', 'INSERT INTO categories (id, name) VALUES (''20000000-0000-0000-0000-000000000091'', ''Games''), (''20000000-0000-0000-0000-000000000092'', ''Acessorios'')', array['categories'], null, 'SELECT id::text, name FROM categories WHERE id IN (''20000000-0000-0000-0000-000000000091'', ''20000000-0000-0000-0000-000000000092'') ORDER BY id', 25, 'Um unico INSERT pode criar varias linhas separando grupos de valores por virgula.', 3),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000205', 'Corrigindo preco', 'corrigindo-preco', 'update_rows', 'easy', 'Atualize o preco do produto MON-27 para 1350. Use WHERE pelo SKU.', 'UPDATE products SET price = ... WHERE sku = ...;', 'UPDATE products SET price = 1350 WHERE sku = ''MON-27''', array['products'], null, 'SELECT sku, price::text FROM products WHERE sku = ''MON-27''', 15, 'UPDATE sem WHERE pode alterar a tabela inteira; por isso o desafio exige filtro.', 1),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000205', 'Repondo estoque', 'repondo-estoque', 'update_rows', 'medium', 'Atualize o estoque do produto KEY-MEC para 15 unidades. Use WHERE pelo SKU.', 'UPDATE products SET stock_quantity = ... WHERE sku = ...;', 'UPDATE products SET stock_quantity = 15 WHERE sku = ''KEY-MEC''', array['products'], null, 'SELECT sku, stock_quantity FROM products WHERE sku = ''KEY-MEC''', 20, 'Atualizacoes pontuais devem identificar exatamente qual linha muda.', 2),
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000206', 'Removendo produto descontinuado', 'removendo-produto-descontinuado', 'delete_rows', 'easy', 'Remova o produto BOOK-SQL pelo SKU. Use DELETE com WHERE.', 'DELETE FROM products WHERE sku = ...;', 'DELETE FROM products WHERE sku = ''BOOK-SQL''', array['products'], null, 'SELECT count(*)::int AS remaining FROM products WHERE sku = ''BOOK-SQL''', 15, 'DELETE tambem deve ser filtrado para evitar remocoes acidentais.', 1),
  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000206', 'Limpando pedidos cancelados', 'limpando-pedidos-cancelados', 'delete_rows', 'medium', 'Remova todos os pedidos com status cancelled.', 'DELETE FROM orders WHERE status = ...;', 'DELETE FROM orders WHERE status = ''cancelled''', array['orders'], null, 'SELECT count(*)::int AS cancelled_orders FROM orders WHERE status = ''cancelled''', 20, 'Filtros por status sao comuns em limpezas controladas de dados.', 2),
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000207', 'Criando tabela de fornecedores', 'criando-tabela-fornecedores', 'create_table', 'medium', 'Crie a tabela suppliers com id uuid primary key, name text not null, city text e active boolean default true.', 'CREATE TABLE suppliers (id uuid PRIMARY KEY, name text NOT NULL, city text, active boolean DEFAULT true);', 'CREATE TABLE suppliers (id uuid PRIMARY KEY, name text NOT NULL, city text, active boolean DEFAULT true)', array['suppliers'], null, 'SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ''suppliers'' ORDER BY ordinal_position', 30, 'CREATE TABLE define a estrutura antes de qualquer linha existir.', 1),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000208', 'Adicionando data de reposicao', 'adicionando-data-reposicao', 'alter_table', 'medium', 'Adicione a coluna restock_date do tipo date na tabela products.', 'ALTER TABLE products ADD COLUMN restock_date date;', 'ALTER TABLE products ADD COLUMN restock_date date', array['products'], null, 'SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ''products'' AND column_name = ''restock_date''', 25, 'ALTER TABLE permite evoluir uma tabela existente sem recria-la.', 1),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000209', 'Removendo tabela temporaria', 'removendo-tabela-temporaria', 'drop_table', 'medium', 'Remova a tabela temporaria staging_imports.', 'DROP TABLE staging_imports;', 'DROP TABLE staging_imports', array['staging_imports'], 'CREATE TABLE staging_imports (id uuid PRIMARY KEY, raw_payload text NOT NULL)', 'SELECT (to_regclass(current_schema() || ''.staging_imports'') IS NULL) AS table_removed', 25, 'DROP TABLE deve ser usado apenas quando a tabela pode desaparecer com seguranca.', 1)
on conflict (slug) do nothing;

insert into challenge_hints (challenge_id, hint_order, content)
values
  ('00000000-0000-0000-0000-000000000302', 1, 'Use WHERE para filtrar registros.'),
  ('00000000-0000-0000-0000-000000000302', 2, 'A coluna de estado se chama state.'),
  ('00000000-0000-0000-0000-000000000303', 1, 'Use AND para combinar filtros.'),
  ('00000000-0000-0000-0000-000000000303', 2, 'A coluna de estoque se chama stock_quantity.')
on conflict (challenge_id, hint_order) do nothing;

insert into platform_events (title, description, type, multiplier, starts_at, ends_at, is_active)
values ('Dobro de pontos ativo', 'Todos os desafios concluidos durante o evento valem 2x XP.', 'points_multiplier', 2, now() - interval '1 hour', now() + interval '1 day', true);
