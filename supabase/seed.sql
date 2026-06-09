insert into tracks (id, title, description, slug, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', 'Trilha SQL', 'Do primeiro SELECT a analises de vendas.', 'trilha-sql', 1)
on conflict (slug) do nothing;

insert into modules (id, track_id, title, description, slug, sort_order, unlock_rule)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Primeiros SELECTs', 'Aprenda a consultar dados de uma tabela.', 'primeiros-selects', 1, null),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Filtros', 'Use WHERE para encontrar exatamente o que voce precisa.', 'filtros', 2, '{"type":"previous_module_completion","percentage":70}'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'Ordenacao e LIMIT', 'Ordene resultados e retorne recortes pequenos.', 'ordenacao-limit', 3, '{"type":"previous_module_completion","percentage":70}')
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

insert into challenges (id, module_id, title, slug, difficulty, prompt, expected_sql, allowed_tables, base_points, explanation, sort_order)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Selecionando colunas especificas', 'selecionando-colunas-especificas', 'easy', 'Liste apenas nome completo e email dos clientes. Limite o resultado a 4 linhas.', 'SELECT full_name, email FROM challenge_data.customers LIMIT 4;', array['customers'], 10, 'Selecionar somente as colunas necessarias deixa a consulta mais clara e barata.', 1),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 'Clientes de Rondonia', 'clientes-rondonia', 'easy', 'Liste o nome, email e cidade dos clientes que moram no estado de Rondonia. Ordene pelo nome.', 'SELECT full_name, email, city FROM challenge_data.customers WHERE state = ''Rondonia'' ORDER BY full_name;', array['customers'], 10, 'WHERE limita os registros retornados e ORDER BY garante a ordem esperada.', 1),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000202', 'Produtos sem estoque', 'produtos-sem-estoque', 'medium', 'Liste nome, SKU e preco dos produtos ativos com estoque igual a zero. Ordene pelo nome.', 'SELECT name, sku, price FROM challenge_data.products WHERE active = true AND stock_quantity = 0 ORDER BY name;', array['products'], 25, 'Filtros combinados ajudam a transformar uma tabela grande em uma resposta especifica.', 2)
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
