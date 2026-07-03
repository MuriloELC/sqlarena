const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const contentId = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const dataId = (prefix, n) => `${prefix}0000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

const trackId = contentId(101);

const modules = [
  ["primeiros-selects", "Primeiros SELECTs", "Escolha colunas, aliases, LIMIT e expressoes simples."],
  ["filtros-where", "Filtros com WHERE", "Use comparacoes simples para separar as linhas certas."],
  ["operadores-where", "Operadores do WHERE", "Combine AND, OR, IN, BETWEEN, LIKE, NULL e NOT."],
  ["ordenacao-e-limit", "Ordenacao e LIMIT", "Controle a ordem, o topo e recortes de resultados."],
  ["agregacoes-select", "Agregacoes com SELECT", "Resuma dados com COUNT, SUM, AVG, MIN, MAX e HAVING."],
  ["joins-basicos", "JOINs basicos", "Cruze tabelas relacionadas por chaves estrangeiras."],
  ["joins-intermediarios", "JOINs intermediarios", "Use LEFT JOIN, multiplos JOINs e agregacoes relacionadas."],
  ["ctes", "CTEs", "Organize consultas em etapas com WITH."],
  ["union-combinacoes", "UNION e combinacoes", "Una consultas compativeis com UNION e UNION ALL."],
  ["revisao-select", "Revisao guiada SELECT", "Resolva desafios integrando filtros, joins, CTEs e union."],
  ["escrita-ddl-sandbox", "Escrita e DDL no sandbox", "Pratique CREATE, INSERT, DELETE e DROP com validacao isolada."],
  ["perguntas-de-negocio", "Perguntas de negocio", "Responda perguntas de negocio com consultas analiticas.", false],
].map(([slug, title, description, isActive = true], index) => ({
  id: contentId(201 + index),
  slug,
  title,
  description,
  sortOrder: index + 1,
  isActive,
}));

const customers = [
  [1, "Alice Silva", "alice@exemplo.com", "Porto Velho", "Rondonia", "2026-01-05 10:00:00"],
  [2, "Beto Souza", "beto@exemplo.com", "Ariquemes", "Rondonia", "2026-01-07 10:00:00"],
  [3, "Carla Mendes", "carla@exemplo.com", "Ji-Parana", "Rondonia", "2026-01-09 10:00:00"],
  [4, "Daniel Lima", "daniel@exemplo.com", "Vilhena", "Rondonia", "2026-01-11 10:00:00"],
  [5, "Helena Costa", "helena@exemplo.com", "Sao Paulo", "SP", "2026-01-13 10:00:00"],
  [6, "Joao Pedro", "joao@exemplo.com", "Rio de Janeiro", "RJ", "2026-01-15 10:00:00"],
  [7, "Marina Alves", "marina@exemplo.com", "Campinas", "SP", "2026-01-17 10:00:00"],
  [8, "Rafael Nunes", "rafael@exemplo.com", "Niteroi", "RJ", "2026-01-19 10:00:00"],
  [9, "Nadia Rocha", "nadia@exemplo.com", "Belo Horizonte", "MG", "2026-01-21 10:00:00"],
  [10, "Paulo Torres", "paulo@exemplo.com", "Curitiba", "PR", "2026-01-23 10:00:00"],
  [11, "Bianca Freitas", "bianca@exemplo.com", "Manaus", "AM", "2026-01-25 10:00:00"],
  [12, "Gustavo Ramos", "gustavo@exemplo.com", "Recife", "PE", "2026-01-27 10:00:00"],
].map(([n, fullName, email, city, state, createdAt]) => ({
  id: dataId("1", n),
  fullName,
  email,
  city,
  state,
  createdAt,
}));

const categories = [
  [1, "Informatica"],
  [2, "Casa"],
  [3, "Livros"],
  [4, "Games"],
  [5, "Acessorios"],
  [6, "Papelaria"],
].map(([n, name]) => ({ id: dataId("2", n), name }));

const products = [
  [1, 1, "Notebook Pro 14", "NB-PRO-14", 5200, 3900, true, 8],
  [2, 1, "Monitor 27", "MON-27", 1400, 900, true, 0],
  [3, 1, "Teclado Mecanico", "KEY-MEC", 420, 230, true, 0],
  [4, 2, "Cafeteira Smart", "CAF-SM", 650, 350, true, 5],
  [5, 3, "SQL na Pratica", "BOOK-SQL", 120, 45, true, 18],
  [6, 5, "Mouse Gamer", "MOU-GAME", 250, 120, true, 12],
  [7, 5, "Headset Cloud", "HEAD-CLOUD", 380, 210, true, 4],
  [8, 2, "Cadeira Ergo", "CAD-ERGO", 980, 620, true, 2],
  [9, 4, "Controle Wireless", "CTRL-WL", 320, 180, true, 10],
  [10, 4, "Console Mini", "CON-MINI", 2600, 1900, true, 3],
  [11, 3, "Livro Python Dados", "BOOK-PY", 150, 70, true, 30],
  [12, 2, "Garrafa Termica", "GAR-TERM", 90, 35, true, 25],
  [13, 1, "Webcam FullHD", "WEB-FHD", 310, 160, false, 6],
  [14, 5, "Mesa Digitalizadora", "MESA-DIG", 780, 500, true, 0],
  [15, 4, "Jogo Educativo SQL", "GAME-SQL", 180, 75, true, 16],
  [16, 6, "Kit Canetas Premium", "CAN-PREM", 45, 15, true, 40],
  [17, 5, "Suporte Notebook", "SUP-NB", 130, 55, true, 14],
].map(([n, categoryN, name, sku, price, cost, active, stockQuantity]) => ({
  id: dataId("3", n),
  categoryId: dataId("2", categoryN),
  name,
  sku,
  price,
  cost,
  active,
  stockQuantity,
}));

const orders = [
  [1, 5, "A1001", "paid", "2026-02-01 11:20:00", 5620, 40, 0],
  [2, 6, "A1002", "delivered", "2026-02-02 09:10:00", 1520, 35, 20],
  [3, 1, "A1003", "cancelled", "2026-02-03 16:45:00", 420, 25, 0],
  [4, 7, "A1004", "shipped", "2026-02-04 13:00:00", 900, 30, 50],
  [5, 2, "A1005", "delivered", "2026-02-05 10:15:00", 2600, 0, 100],
  [6, 9, "A1006", "paid", "2026-02-06 18:30:00", 470, 20, 0],
  [7, 11, "A1007", "pending", "2026-02-07 08:30:00", 90, 15, 0],
  [8, 8, "A1008", "refunded", "2026-02-08 14:10:00", 780, 40, 0],
  [9, 10, "A1009", "delivered", "2026-02-09 17:55:00", 270, 18, 0],
  [10, 12, "A1010", "paid", "2026-02-10 12:40:00", 1360, 45, 80],
  [11, 3, "A1011", "shipped", "2026-02-11 09:05:00", 545, 22, 0],
  [12, 4, "A1012", "delivered", "2026-02-12 15:25:00", 360, 12, 0],
  [13, 5, "A1013", "paid", "2026-02-13 20:10:00", 6600, 0, 200],
  [14, 6, "A1014", "cancelled", "2026-02-14 11:45:00", 310, 20, 0],
  [15, 7, "A1015", "delivered", "2026-02-15 10:50:00", 830, 25, 0],
  [16, 8, "A1016", "pending", "2026-02-16 16:35:00", 640, 30, 0],
  [17, 9, "A1017", "paid", "2026-02-17 19:00:00", 270, 12, 0],
  [18, 10, "A1018", "delivered", "2026-02-18 13:20:00", 2780, 55, 90],
  [19, 11, "A1019", "shipped", "2026-02-19 08:45:00", 630, 18, 0],
  [20, 12, "A1020", "refunded", "2026-02-20 09:30:00", 980, 45, 0],
].map(([n, customerN, orderNumber, status, orderDate, totalAmount, shippingAmount, discountAmount]) => ({
  id: dataId("4", n),
  customerId: dataId("1", customerN),
  orderNumber,
  status,
  orderDate,
  totalAmount,
  shippingAmount,
  discountAmount,
}));

const orderItems = [
  [1, 1, 1, 1, 5200, 5200],
  [2, 1, 3, 1, 420, 420],
  [3, 2, 2, 1, 1400, 1400],
  [4, 2, 5, 1, 120, 120],
  [5, 3, 3, 1, 420, 420],
  [6, 4, 4, 1, 650, 650],
  [7, 4, 6, 1, 250, 250],
  [8, 5, 10, 1, 2600, 2600],
  [9, 6, 9, 1, 320, 320],
  [10, 6, 11, 1, 150, 150],
  [11, 7, 12, 1, 90, 90],
  [12, 8, 14, 1, 780, 780],
  [13, 9, 15, 1, 180, 180],
  [14, 9, 16, 2, 45, 90],
  [15, 10, 8, 1, 980, 980],
  [16, 10, 7, 1, 380, 380],
  [17, 11, 6, 2, 250, 500],
  [18, 11, 16, 1, 45, 45],
  [19, 12, 5, 3, 120, 360],
  [20, 13, 1, 1, 5200, 5200],
  [21, 13, 2, 1, 1400, 1400],
  [22, 14, 13, 1, 310, 310],
  [23, 15, 4, 1, 650, 650],
  [24, 15, 12, 2, 90, 180],
  [25, 16, 9, 2, 320, 640],
  [26, 17, 11, 1, 150, 150],
  [27, 17, 5, 1, 120, 120],
  [28, 18, 10, 1, 2600, 2600],
  [29, 18, 15, 1, 180, 180],
  [30, 19, 7, 1, 380, 380],
  [31, 19, 6, 1, 250, 250],
  [32, 20, 8, 1, 980, 980],
].map(([n, orderN, productN, quantity, unitPrice, lineTotal]) => ({
  id: dataId("5", n),
  orderId: dataId("4", orderN),
  productId: dataId("3", productN),
  quantity,
  unitPrice,
  lineTotal,
}));

const payments = [
  [1, 1, "pix", "paid", 5620, "2026-02-01 11:25:00"],
  [2, 2, "credit_card", "paid", 1520, "2026-02-02 09:12:00"],
  [3, 3, "boleto", "failed", 420, null],
  [4, 4, "debit_card", "paid", 900, "2026-02-04 13:05:00"],
  [5, 5, "pix", "paid", 2600, "2026-02-05 10:18:00"],
  [6, 6, "wallet", "paid", 470, "2026-02-06 18:34:00"],
  [7, 8, "credit_card", "refunded", 780, "2026-02-08 14:12:00"],
  [8, 9, "pix", "paid", 270, "2026-02-09 17:58:00"],
  [9, 10, "credit_card", "paid", 1360, "2026-02-10 12:43:00"],
  [10, 11, "pix", "paid", 545, "2026-02-11 09:10:00"],
  [11, 12, "boleto", "paid", 360, "2026-02-12 15:30:00"],
  [12, 13, "credit_card", "paid", 6600, "2026-02-13 20:14:00"],
  [13, 14, "boleto", "failed", 310, null],
  [14, 15, "debit_card", "paid", 830, "2026-02-15 10:55:00"],
  [15, 17, "wallet", "paid", 270, "2026-02-17 19:02:00"],
  [16, 18, "pix", "paid", 2780, "2026-02-18 13:22:00"],
  [17, 19, "credit_card", "paid", 630, "2026-02-19 08:49:00"],
  [18, 20, "credit_card", "refunded", 980, "2026-02-20 09:33:00"],
].map(([n, orderN, paymentMethod, status, amount, paidAt]) => ({
  id: dataId("6", n),
  orderId: dataId("4", orderN),
  paymentMethod,
  status,
  amount,
  paidAt,
}));

const shipments = [
  [1, 2, "Rapido Norte", "delivered", "2026-02-03 10:00:00", "2026-02-05 15:30:00"],
  [2, 4, "Correios Express", "in_transit", "2026-02-05 09:00:00", null],
  [3, 5, "TransBrasil", "delivered", "2026-02-06 08:40:00", "2026-02-08 12:10:00"],
  [4, 8, "Rapido Norte", "returned", "2026-02-09 07:45:00", null],
  [5, 9, "Rapido Norte", "delivered", "2026-02-10 11:00:00", "2026-02-12 16:20:00"],
  [6, 11, "Azul Cargo", "in_transit", "2026-02-12 14:00:00", null],
  [7, 12, "Correios Express", "delivered", "2026-02-13 09:30:00", "2026-02-16 10:00:00"],
  [8, 15, "Rapido Norte", "delivered", "2026-02-16 11:40:00", "2026-02-17 18:20:00"],
  [9, 18, "Azul Cargo", "delivered", "2026-02-19 08:15:00", "2026-02-21 13:45:00"],
  [10, 19, "TransBrasil", "in_transit", "2026-02-20 09:10:00", null],
  [11, 20, "Rapido Norte", "returned", "2026-02-21 10:25:00", null],
].map(([n, orderN, carrier, status, shippedAt, deliveredAt]) => ({
  id: dataId("7", n),
  orderId: dataId("4", orderN),
  carrier,
  status,
  shippedAt,
  deliveredAt,
}));

const financialTransactions = [
  [1, 1, "revenue", 5620, "2026-02-01", "Venda A1001"],
  [2, 1, "fee", 168.6, "2026-02-01", "Taxa A1001"],
  [3, 2, "revenue", 1520, "2026-02-02", "Venda A1002"],
  [4, 2, "shipping_cost", 35, "2026-02-03", "Frete A1002"],
  [5, 3, "refund", 420, "2026-02-03", "Cancelamento A1003"],
  [6, 4, "revenue", 900, "2026-02-04", "Venda A1004"],
  [7, 5, "revenue", 2600, "2026-02-05", "Venda A1005"],
  [8, 6, "revenue", 470, "2026-02-06", "Venda A1006"],
  [9, 8, "revenue", 780, "2026-02-08", "Venda A1008"],
  [10, 8, "refund", 780, "2026-02-09", "Estorno A1008"],
  [11, 9, "revenue", 270, "2026-02-09", "Venda A1009"],
  [12, 10, "revenue", 1360, "2026-02-10", "Venda A1010"],
  [13, 11, "revenue", 545, "2026-02-11", "Venda A1011"],
  [14, 12, "revenue", 360, "2026-02-12", "Venda A1012"],
  [15, 13, "revenue", 6600, "2026-02-13", "Venda A1013"],
  [16, 13, "fee", 198, "2026-02-13", "Taxa A1013"],
  [17, 15, "revenue", 830, "2026-02-15", "Venda A1015"],
  [18, 17, "revenue", 270, "2026-02-17", "Venda A1017"],
  [19, 18, "revenue", 2780, "2026-02-18", "Venda A1018"],
  [20, 19, "revenue", 630, "2026-02-19", "Venda A1019"],
  [21, 20, "revenue", 980, "2026-02-20", "Venda A1020"],
  [22, 20, "refund", 980, "2026-02-21", "Estorno A1020"],
  [23, 18, "shipping_cost", 55, "2026-02-19", "Frete A1018"],
  [24, 5, "fee", 78, "2026-02-05", "Taxa A1005"],
  [25, 10, "shipping_cost", 45, "2026-02-11", "Frete A1010"],
].map(([n, orderN, type, amount, transactionDate, description]) => ({
  id: dataId("8", n),
  orderId: dataId("4", orderN),
  type,
  amount,
  transactionDate,
  description,
}));

const challengeDefinitions = [];
const initialChallengeStart = 301;
const initialChallengeEnd = 410;

function add(moduleIndex, input) {
  const module = modules[moduleIndex - 1];
  const moduleChallengeCount = challengeDefinitions.filter((item) => item.moduleId === module.id).length;
  challengeDefinitions.push({
    id: contentId(301 + challengeDefinitions.length),
    moduleId: module.id,
    type: "free_select",
    sortOrder: moduleChallengeCount + 1,
    points: input.points ?? pointsFor(input.difficulty),
    starterSql: input.starterSql ?? starterForTables(input.tables),
    hints: input.hints ?? defaultHints(input),
    ...input,
  });
}

function pointsFor(difficulty) {
  return difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : difficulty === "hard" ? 35 : 60;
}

function defaultHints(input) {
  return [
    `Use as tabelas permitidas: ${input.tables.join(", ")}.`,
    "Confira colunas, filtros e ORDER BY para bater com o resultado esperado.",
  ];
}

function starterForTables(tables) {
  const table = tables?.[0] ?? "customers";
  return `SELECT\nFROM ${table}\nLIMIT 10;`;
}

const starter = {
  customers: "SELECT full_name, email\nFROM customers\nORDER BY full_name\nLIMIT 5;",
  products: "SELECT name, price\nFROM products\nORDER BY name\nLIMIT 5;",
  orders: "SELECT order_number, status, total_amount\nFROM orders\nORDER BY order_date\nLIMIT 5;",
  payments: "SELECT payment_method, status, amount\nFROM payments\nORDER BY amount DESC\nLIMIT 5;",
  shipments: "SELECT carrier, status, shipped_at\nFROM shipments\nORDER BY shipped_at\nLIMIT 5;",
  financial: "SELECT type, amount, transaction_date\nFROM financial_transactions\nORDER BY transaction_date\nLIMIT 5;",
  join: "SELECT c.full_name, o.order_number\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nORDER BY c.full_name;",
  cte: "WITH dados AS (\n  SELECT name, price\n  FROM products\n)\nSELECT name, price\nFROM dados\nORDER BY price DESC;",
  union: "SELECT full_name AS name, 'customer' AS source\nFROM customers\nUNION ALL\nSELECT name, 'product'\nFROM products\nORDER BY source, name;",
};

add(1, {
  title: "Nomes e emails dos clientes",
  slug: "nomes-emails-clientes",
  difficulty: "easy",
  prompt: "Liste nome completo e email dos clientes. Ordene pelo nome e limite em 5 linhas.",
  starterSql: starter.customers,
  expectedSql: "SELECT full_name, email FROM challenge_data.customers ORDER BY full_name LIMIT 5",
  tables: ["customers"],
  explanation: "SELECT define as colunas, ORDER BY estabiliza a ordem e LIMIT reduz o retorno.",
});
add(1, {
  title: "Catalogo resumido de produtos",
  slug: "catalogo-resumido-produtos",
  difficulty: "easy",
  prompt: "Liste nome, SKU e preco dos produtos. Ordene pelo nome e limite em 8 linhas.",
  starterSql: starter.products,
  expectedSql: "SELECT name, sku, price FROM challenge_data.products ORDER BY name LIMIT 8",
  tables: ["products"],
  explanation: "Selecionar apenas colunas uteis deixa a consulta mais legivel.",
});
add(1, {
  title: "Apelidos para colunas",
  slug: "apelidos-para-colunas",
  difficulty: "easy",
  prompt: "Liste produtos com as colunas product_name e sale_price. Ordene pelo maior preco e limite em 5.",
  starterSql: "SELECT name AS product_name, price AS sale_price\nFROM products\nORDER BY sale_price DESC\nLIMIT 5;",
  expectedSql: "SELECT name AS product_name, price AS sale_price FROM challenge_data.products ORDER BY sale_price DESC LIMIT 5",
  tables: ["products"],
  explanation: "AS cria nomes de saida mais claros para quem le o resultado.",
});
add(1, {
  title: "Margem simples por produto",
  slug: "margem-simples-produto",
  difficulty: "easy",
  prompt: "Liste nome e margem bruta dos produtos usando price - cost como gross_margin. Ordene pela maior margem e limite em 5.",
  starterSql: "SELECT name, price - cost AS gross_margin\nFROM products\nORDER BY gross_margin DESC\nLIMIT 5;",
  expectedSql: "SELECT name, price - cost AS gross_margin FROM challenge_data.products ORDER BY gross_margin DESC LIMIT 5",
  tables: ["products"],
  explanation: "Expressoes calculadas podem aparecer diretamente no SELECT.",
});
add(1, {
  title: "Resumo dos primeiros pedidos",
  slug: "resumo-primeiros-pedidos",
  difficulty: "easy",
  prompt: "Liste numero, status e total dos pedidos. Ordene pela data do pedido e limite em 6 linhas.",
  starterSql: starter.orders,
  expectedSql: "SELECT order_number, status, total_amount FROM challenge_data.orders ORDER BY order_date LIMIT 6",
  tables: ["orders"],
  explanation: "Um SELECT pode montar uma visao curta de acompanhamento operacional.",
});
add(1, {
  title: "Estados sem repeticao",
  slug: "estados-sem-repeticao",
  difficulty: "easy",
  prompt: "Liste os estados dos clientes sem repeticao, em ordem alfabetica.",
  starterSql: "SELECT DISTINCT state\nFROM customers\nORDER BY state;",
  expectedSql: "SELECT DISTINCT state FROM challenge_data.customers ORDER BY state",
  tables: ["customers"],
  explanation: "DISTINCT remove valores duplicados da projecao escolhida.",
});
add(1, {
  title: "Tres pedidos mais recentes",
  slug: "tres-pedidos-mais-recentes",
  difficulty: "easy",
  prompt: "Liste numero e data dos 3 pedidos mais recentes.",
  starterSql: "SELECT order_number, order_date\nFROM orders\nORDER BY order_date DESC\nLIMIT 3;",
  expectedSql: "SELECT order_number, order_date FROM challenge_data.orders ORDER BY order_date DESC LIMIT 3",
  tables: ["orders"],
  explanation: "ORDER BY DESC junto com LIMIT retorna o topo cronologico.",
});
add(1, {
  title: "Metodos de pagamento disponiveis",
  slug: "metodos-pagamento-disponiveis",
  difficulty: "easy",
  prompt: "Liste os metodos de pagamento sem repeticao em ordem alfabetica.",
  starterSql: "SELECT DISTINCT payment_method\nFROM payments\nORDER BY payment_method;",
  expectedSql: "SELECT DISTINCT payment_method FROM challenge_data.payments ORDER BY payment_method",
  tables: ["payments"],
  explanation: "DISTINCT tambem e util para descobrir valores de dominio.",
});
add(1, {
  title: "Rotulo do pedido",
  slug: "rotulo-do-pedido",
  difficulty: "medium",
  prompt: "Crie a coluna order_label juntando order_number, espaco, hifen, espaco e status. Ordene pelo numero do pedido e limite em 5.",
  starterSql: "SELECT order_number || ' - ' || status AS order_label\nFROM orders\nORDER BY order_number\nLIMIT 5;",
  expectedSql: "SELECT order_number || ' - ' || status AS order_label FROM challenge_data.orders ORDER BY order_number LIMIT 5",
  tables: ["orders"],
  explanation: "O operador || concatena textos no PostgreSQL.",
});
add(1, {
  title: "Estoque em ordem de urgencia",
  slug: "estoque-ordem-urgencia",
  difficulty: "medium",
  prompt: "Liste nome, ativo e quantidade em estoque dos produtos. Ordene pelo menor estoque e depois pelo nome. Limite em 10.",
  starterSql: "SELECT name, active, stock_quantity\nFROM products\nORDER BY stock_quantity, name\nLIMIT 10;",
  expectedSql: "SELECT name, active, stock_quantity FROM challenge_data.products ORDER BY stock_quantity ASC, name ASC LIMIT 10",
  tables: ["products"],
  explanation: "Mais de uma coluna no ORDER BY resolve empates de forma previsivel.",
});

add(2, {
  title: "Clientes de Rondonia",
  slug: "clientes-de-rondonia-select",
  difficulty: "easy",
  prompt: "Liste nome, email e cidade dos clientes que moram em Rondonia. Ordene pelo nome.",
  starterSql: "SELECT full_name, email, city\nFROM customers\nWHERE state = 'Rondonia'\nORDER BY full_name;",
  expectedSql: "SELECT full_name, email, city FROM challenge_data.customers WHERE state = 'Rondonia' ORDER BY full_name",
  tables: ["customers"],
  explanation: "WHERE com igualdade encontra linhas com um valor especifico.",
});
add(2, {
  title: "Produtos ativos",
  slug: "produtos-ativos",
  difficulty: "easy",
  prompt: "Liste nome, SKU e estoque dos produtos ativos. Ordene pelo nome.",
  starterSql: "SELECT name, sku, stock_quantity\nFROM products\nWHERE active = true\nORDER BY name;",
  expectedSql: "SELECT name, sku, stock_quantity FROM challenge_data.products WHERE active = true ORDER BY name",
  tables: ["products"],
  explanation: "Colunas booleanas podem ser filtradas com true ou false.",
});
add(2, {
  title: "Produtos acima de 500",
  slug: "produtos-acima-500",
  difficulty: "easy",
  prompt: "Liste nome e preco dos produtos com preco maior que 500. Ordene do maior para o menor.",
  starterSql: "SELECT name, price\nFROM products\nWHERE price > 500\nORDER BY price DESC, name;",
  expectedSql: "SELECT name, price FROM challenge_data.products WHERE price > 500 ORDER BY price DESC, name",
  tables: ["products"],
  explanation: "Operadores de comparacao permitem filtrar faixas abertas.",
});
add(2, {
  title: "Pedidos pagos",
  slug: "pedidos-pagos",
  difficulty: "easy",
  prompt: "Liste numero, status e total dos pedidos com status paid. Ordene pela data.",
  starterSql: "SELECT order_number, status, total_amount\nFROM orders\nWHERE status = 'paid'\nORDER BY order_date;",
  expectedSql: "SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'paid' ORDER BY order_date",
  tables: ["orders"],
  explanation: "Filtros por status sao comuns em acompanhamentos de pedidos.",
});
add(2, {
  title: "Pedidos a partir de 10 de fevereiro",
  slug: "pedidos-a-partir-10-fevereiro",
  difficulty: "easy",
  prompt: "Liste numero, data e total dos pedidos feitos a partir de 2026-02-10. Ordene pela data.",
  starterSql: "SELECT order_number, order_date, total_amount\nFROM orders\nWHERE order_date >= '2026-02-10'\nORDER BY order_date;",
  expectedSql: "SELECT order_number, order_date, total_amount FROM challenge_data.orders WHERE order_date >= '2026-02-10' ORDER BY order_date",
  tables: ["orders"],
  explanation: "Comparacoes com datas funcionam como comparacoes de valores.",
});
add(2, {
  title: "Baixo estoque",
  slug: "baixo-estoque",
  difficulty: "easy",
  prompt: "Liste nome e estoque dos produtos com menos de 5 unidades. Ordene pelo estoque e depois pelo nome.",
  starterSql: "SELECT name, stock_quantity\nFROM products\nWHERE stock_quantity < 5\nORDER BY stock_quantity, name;",
  expectedSql: "SELECT name, stock_quantity FROM challenge_data.products WHERE stock_quantity < 5 ORDER BY stock_quantity, name",
  tables: ["products"],
  explanation: "O operador menor que ajuda a identificar prioridades de reposicao.",
});
add(2, {
  title: "Pedidos com frete gratis",
  slug: "pedidos-frete-gratis",
  difficulty: "easy",
  prompt: "Liste numero, total e frete dos pedidos com shipping_amount igual a zero. Ordene pelo numero.",
  starterSql: "SELECT order_number, total_amount, shipping_amount\nFROM orders\nWHERE shipping_amount = 0\nORDER BY order_number;",
  expectedSql: "SELECT order_number, total_amount, shipping_amount FROM challenge_data.orders WHERE shipping_amount = 0 ORDER BY order_number",
  tables: ["orders"],
  explanation: "Filtros numericos tambem podem usar igualdade.",
});
add(2, {
  title: "Clientes fora de Rondonia",
  slug: "clientes-fora-rondonia",
  difficulty: "easy",
  prompt: "Liste nome, cidade e estado dos clientes que nao moram em Rondonia. Ordene por estado e nome. Limite em 8.",
  starterSql: "SELECT full_name, city, state\nFROM customers\nWHERE state <> 'Rondonia'\nORDER BY state, full_name\nLIMIT 8;",
  expectedSql: "SELECT full_name, city, state FROM challenge_data.customers WHERE state <> 'Rondonia' ORDER BY state, full_name LIMIT 8",
  tables: ["customers"],
  explanation: "<> seleciona valores diferentes do informado.",
});
add(2, {
  title: "Pagamentos via pix aprovados",
  slug: "pagamentos-pix-aprovados",
  difficulty: "medium",
  prompt: "Liste metodo, status, valor e data dos pagamentos por pix com status paid. Ordene pelo maior valor.",
  starterSql: "SELECT payment_method, status, amount, paid_at\nFROM payments\nWHERE payment_method = 'pix' AND status = 'paid'\nORDER BY amount DESC;",
  expectedSql: "SELECT payment_method, status, amount, paid_at FROM challenge_data.payments WHERE payment_method = 'pix' AND status = 'paid' ORDER BY amount DESC",
  tables: ["payments"],
  explanation: "AND exige que todos os filtros sejam verdadeiros.",
});
add(2, {
  title: "Pedidos cancelados ou estornados",
  slug: "pedidos-cancelados-ou-estornados",
  difficulty: "medium",
  prompt: "Liste numero, status e total dos pedidos com status cancelled ou refunded. Ordene por status e numero.",
  starterSql: "SELECT order_number, status, total_amount\nFROM orders\nWHERE status = 'cancelled' OR status = 'refunded'\nORDER BY status, order_number;",
  expectedSql: "SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'cancelled' OR status = 'refunded' ORDER BY status, order_number",
  tables: ["orders"],
  explanation: "OR aceita linhas que atendem a pelo menos uma condicao.",
});

add(3, {
  title: "Clientes de estados selecionados",
  slug: "clientes-estados-selecionados",
  difficulty: "easy",
  prompt: "Liste nome, cidade e estado dos clientes de SP, RJ ou MG. Ordene por estado e nome.",
  starterSql: "SELECT full_name, city, state\nFROM customers\nWHERE state IN ('SP', 'RJ', 'MG')\nORDER BY state, full_name;",
  expectedSql: "SELECT full_name, city, state FROM challenge_data.customers WHERE state IN ('SP', 'RJ', 'MG') ORDER BY state, full_name",
  tables: ["customers"],
  explanation: "IN evita repetir varias comparacoes de igualdade.",
});
add(3, {
  title: "Produtos entre 100 e 500",
  slug: "produtos-entre-100-500",
  difficulty: "easy",
  prompt: "Liste nome e preco dos produtos com preco entre 100 e 500, inclusive. Ordene pelo preco e nome.",
  starterSql: "SELECT name, price\nFROM products\nWHERE price BETWEEN 100 AND 500\nORDER BY price, name;",
  expectedSql: "SELECT name, price FROM challenge_data.products WHERE price BETWEEN 100 AND 500 ORDER BY price, name",
  tables: ["products"],
  explanation: "BETWEEN inclui as duas pontas do intervalo.",
});
add(3, {
  title: "Produtos com SQL no nome",
  slug: "produtos-com-sql-no-nome",
  difficulty: "easy",
  prompt: "Liste nome, SKU e preco dos produtos cujo nome contem SQL. Ordene pelo nome.",
  starterSql: "SELECT name, sku, price\nFROM products\nWHERE name LIKE '%SQL%'\nORDER BY name;",
  expectedSql: "SELECT name, sku, price FROM challenge_data.products WHERE name LIKE '%SQL%' ORDER BY name",
  tables: ["products"],
  explanation: "LIKE com % procura trechos dentro de textos.",
});
add(3, {
  title: "Produtos inativos ou sem estoque",
  slug: "produtos-inativos-ou-sem-estoque",
  difficulty: "medium",
  prompt: "Liste nome, ativo e estoque dos produtos inativos ou com estoque zero. Ordene pelo nome.",
  starterSql: "SELECT name, active, stock_quantity\nFROM products\nWHERE active = false OR stock_quantity = 0\nORDER BY name;",
  expectedSql: "SELECT name, active, stock_quantity FROM challenge_data.products WHERE active = false OR stock_quantity = 0 ORDER BY name",
  tables: ["products"],
  explanation: "OR e util para unir dois criterios de alerta.",
});
add(3, {
  title: "Pagamentos nao aprovados",
  slug: "pagamentos-nao-aprovados",
  difficulty: "medium",
  prompt: "Liste metodo, status e valor dos pagamentos cujo status nao e paid. Ordene por status e maior valor.",
  starterSql: "SELECT payment_method, status, amount\nFROM payments\nWHERE status <> 'paid'\nORDER BY status, amount DESC;",
  expectedSql: "SELECT payment_method, status, amount FROM challenge_data.payments WHERE status <> 'paid' ORDER BY status, amount DESC",
  tables: ["payments"],
  explanation: "<> tambem funciona com textos.",
});
add(3, {
  title: "Entregas sem data final",
  slug: "entregas-sem-data-final",
  difficulty: "medium",
  prompt: "Liste transportadora, status e data de envio das entregas sem delivered_at. Ordene pela data de envio.",
  starterSql: "SELECT carrier, status, shipped_at\nFROM shipments\nWHERE delivered_at IS NULL\nORDER BY shipped_at;",
  expectedSql: "SELECT carrier, status, shipped_at FROM challenge_data.shipments WHERE delivered_at IS NULL ORDER BY shipped_at",
  tables: ["shipments"],
  explanation: "IS NULL encontra valores ausentes.",
});
add(3, {
  title: "Entregas finalizadas",
  slug: "entregas-finalizadas",
  difficulty: "medium",
  prompt: "Liste transportadora e delivered_at das entregas com delivered_at preenchido. Ordene pela entrega e limite em 5.",
  starterSql: "SELECT carrier, delivered_at\nFROM shipments\nWHERE delivered_at IS NOT NULL\nORDER BY delivered_at\nLIMIT 5;",
  expectedSql: "SELECT carrier, delivered_at FROM challenge_data.shipments WHERE delivered_at IS NOT NULL ORDER BY delivered_at LIMIT 5",
  tables: ["shipments"],
  explanation: "IS NOT NULL remove registros sem valor na coluna.",
});
add(3, {
  title: "Produtos ativos de preco medio",
  slug: "produtos-ativos-preco-medio",
  difficulty: "medium",
  prompt: "Liste nome, preco e estoque dos produtos ativos com preco entre 200 e 1000. Ordene pelo preco.",
  starterSql: "SELECT name, price, stock_quantity\nFROM products\nWHERE active = true AND price >= 200 AND price <= 1000\nORDER BY price;",
  expectedSql: "SELECT name, price, stock_quantity FROM challenge_data.products WHERE active = true AND price >= 200 AND price <= 1000 ORDER BY price",
  tables: ["products"],
  explanation: "AND permite combinar varios limites de negocio.",
});
add(3, {
  title: "Clientes que comecam com A ou B",
  slug: "clientes-comecam-a-ou-b",
  difficulty: "medium",
  prompt: "Liste nome, email e estado dos clientes cujo nome comeca com A ou B. Ordene pelo nome.",
  starterSql: "SELECT full_name, email, state\nFROM customers\nWHERE full_name LIKE 'A%' OR full_name LIKE 'B%'\nORDER BY full_name;",
  expectedSql: "SELECT full_name, email, state FROM challenge_data.customers WHERE full_name LIKE 'A%' OR full_name LIKE 'B%' ORDER BY full_name",
  tables: ["customers"],
  explanation: "LIKE 'A%' procura textos que iniciam com a letra A.",
});
add(3, {
  title: "Pedidos validos da primeira semana",
  slug: "pedidos-validos-primeira-semana",
  difficulty: "hard",
  prompt: "Liste numero, status e data dos pedidos entre 2026-02-01 e 2026-02-07 que nao foram cancelados. Ordene pela data.",
  starterSql: "SELECT order_number, status, order_date\nFROM orders\nWHERE order_date BETWEEN '2026-02-01' AND '2026-02-07 23:59:59'\n  AND status <> 'cancelled'\nORDER BY order_date;",
  expectedSql: "SELECT order_number, status, order_date FROM challenge_data.orders WHERE order_date BETWEEN '2026-02-01' AND '2026-02-07 23:59:59' AND status <> 'cancelled' ORDER BY order_date",
  tables: ["orders"],
  explanation: "BETWEEN, AND e <> juntos formam filtros de periodo com exclusao.",
});

add(4, {
  title: "Top 3 produtos mais caros",
  slug: "top-3-produtos-mais-caros",
  difficulty: "easy",
  prompt: "Liste nome e preco dos 3 produtos mais caros.",
  starterSql: "SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 3;",
  expectedSql: "SELECT name, price FROM challenge_data.products ORDER BY price DESC LIMIT 3",
  tables: ["products"],
  explanation: "DESC coloca maiores valores no topo.",
});
add(4, {
  title: "Cinco produtos mais baratos ativos",
  slug: "cinco-produtos-mais-baratos-ativos",
  difficulty: "easy",
  prompt: "Liste nome e preco dos 5 produtos ativos mais baratos.",
  starterSql: "SELECT name, price\nFROM products\nWHERE active = true\nORDER BY price ASC\nLIMIT 5;",
  expectedSql: "SELECT name, price FROM challenge_data.products WHERE active = true ORDER BY price ASC LIMIT 5",
  tables: ["products"],
  explanation: "ASC e a ordem crescente, util para rankings de menor valor.",
});
add(4, {
  title: "Quatro clientes mais novos",
  slug: "quatro-clientes-mais-novos",
  difficulty: "easy",
  prompt: "Liste nome e data de cadastro dos 4 clientes mais novos.",
  starterSql: "SELECT full_name, created_at\nFROM customers\nORDER BY created_at DESC\nLIMIT 4;",
  expectedSql: "SELECT full_name, created_at FROM challenge_data.customers ORDER BY created_at DESC LIMIT 4",
  tables: ["customers"],
  explanation: "Datas recentes aparecem primeiro com ORDER BY data DESC.",
});
add(4, {
  title: "Maiores pedidos",
  slug: "maiores-pedidos",
  difficulty: "easy",
  prompt: "Liste numero e total dos 5 pedidos de maior valor.",
  starterSql: "SELECT order_number, total_amount\nFROM orders\nORDER BY total_amount DESC\nLIMIT 5;",
  expectedSql: "SELECT order_number, total_amount FROM challenge_data.orders ORDER BY total_amount DESC LIMIT 5",
  tables: ["orders"],
  explanation: "Rankings numericos precisam de ORDER BY e LIMIT.",
});
add(4, {
  title: "Pedidos por status e data",
  slug: "pedidos-por-status-data",
  difficulty: "medium",
  prompt: "Liste numero, status e data dos pedidos. Ordene por status crescente e data decrescente. Limite em 10.",
  starterSql: "SELECT order_number, status, order_date\nFROM orders\nORDER BY status ASC, order_date DESC\nLIMIT 10;",
  expectedSql: "SELECT order_number, status, order_date FROM challenge_data.orders ORDER BY status ASC, order_date DESC LIMIT 10",
  tables: ["orders"],
  explanation: "Cada coluna do ORDER BY pode ter sua propria direcao.",
});
add(4, {
  title: "Prioridade de estoque",
  slug: "prioridade-de-estoque",
  difficulty: "medium",
  prompt: "Liste nome, estoque e preco dos produtos. Ordene pelo menor estoque e, em empate, maior preco. Limite em 8.",
  starterSql: "SELECT name, stock_quantity, price\nFROM products\nORDER BY stock_quantity ASC, price DESC\nLIMIT 8;",
  expectedSql: "SELECT name, stock_quantity, price FROM challenge_data.products ORDER BY stock_quantity ASC, price DESC LIMIT 8",
  tables: ["products"],
  explanation: "Ordenacoes compostas ajudam a transformar dados em filas de acao.",
});
add(4, {
  title: "Pagamentos recentes",
  slug: "pagamentos-recentes",
  difficulty: "medium",
  prompt: "Liste metodo, valor e data dos pagamentos com paid_at preenchido. Ordene do mais recente para o mais antigo e limite em 6.",
  starterSql: "SELECT payment_method, amount, paid_at\nFROM payments\nWHERE paid_at IS NOT NULL\nORDER BY paid_at DESC\nLIMIT 6;",
  expectedSql: "SELECT payment_method, amount, paid_at FROM challenge_data.payments WHERE paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 6",
  tables: ["payments"],
  explanation: "Filtrar nulos antes de ordenar evita datas vazias no ranking.",
});
add(4, {
  title: "Entregas por conclusao",
  slug: "entregas-por-conclusao",
  difficulty: "medium",
  prompt: "Liste transportadora, status e delivered_at das entregas finalizadas. Ordene pela data de entrega e limite em 5.",
  starterSql: "SELECT carrier, status, delivered_at\nFROM shipments\nWHERE delivered_at IS NOT NULL\nORDER BY delivered_at\nLIMIT 5;",
  expectedSql: "SELECT carrier, status, delivered_at FROM challenge_data.shipments WHERE delivered_at IS NOT NULL ORDER BY delivered_at LIMIT 5",
  tables: ["shipments"],
  explanation: "ORDER BY em datas tambem pode ser combinado com LIMIT.",
});
add(4, {
  title: "Segunda pagina de produtos caros",
  slug: "segunda-pagina-produtos-caros",
  difficulty: "hard",
  prompt: "Liste nome e preco dos produtos ordenados por preco decrescente. Pule os 3 primeiros e retorne os proximos 5.",
  starterSql: "SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 5 OFFSET 3;",
  expectedSql: "SELECT name, price FROM challenge_data.products ORDER BY price DESC LIMIT 5 OFFSET 3",
  tables: ["products"],
  explanation: "OFFSET pula linhas antes de aplicar o recorte final.",
});
add(4, {
  title: "Ranking por margem",
  slug: "ranking-por-margem",
  difficulty: "hard",
  prompt: "Liste nome e margem dos produtos usando price - cost como margin. Ordene por margin decrescente e nome. Limite em 5.",
  starterSql: "SELECT name, price - cost AS margin\nFROM products\nORDER BY margin DESC, name\nLIMIT 5;",
  expectedSql: "SELECT name, price - cost AS margin FROM challenge_data.products ORDER BY margin DESC, name LIMIT 5",
  tables: ["products"],
  explanation: "Aliases calculados podem ser usados no ORDER BY.",
});

add(5, {
  title: "Clientes por estado",
  slug: "clientes-por-estado",
  difficulty: "medium",
  prompt: "Conte clientes por estado usando customer_count como alias. Ordene pela maior contagem e depois pelo estado.",
  starterSql: "SELECT state, count(*) AS customer_count\nFROM customers\nGROUP BY state\nORDER BY customer_count DESC, state;",
  expectedSql: "SELECT state, count(*) AS customer_count FROM challenge_data.customers GROUP BY state ORDER BY customer_count DESC, state",
  tables: ["customers"],
  explanation: "GROUP BY cria um grupo para cada estado antes da contagem.",
});
add(5, {
  title: "Pedidos por status",
  slug: "pedidos-por-status",
  difficulty: "medium",
  prompt: "Conte pedidos por status usando order_count como alias. Ordene por maior contagem e status.",
  starterSql: "SELECT status, count(*) AS order_count\nFROM orders\nGROUP BY status\nORDER BY order_count DESC, status;",
  expectedSql: "SELECT status, count(*) AS order_count FROM challenge_data.orders GROUP BY status ORDER BY order_count DESC, status",
  tables: ["orders"],
  explanation: "COUNT(*) resume quantas linhas existem em cada grupo.",
});
add(5, {
  title: "Valor total por status",
  slug: "valor-total-por-status",
  difficulty: "medium",
  prompt: "Some total_amount por status dos pedidos usando total_amount_sum como alias. Ordene pelo maior total.",
  starterSql: "SELECT status, sum(total_amount) AS total_amount_sum\nFROM orders\nGROUP BY status\nORDER BY total_amount_sum DESC;",
  expectedSql: "SELECT status, sum(total_amount) AS total_amount_sum FROM challenge_data.orders GROUP BY status ORDER BY total_amount_sum DESC",
  tables: ["orders"],
  explanation: "SUM agrega valores numericos por categoria.",
});
add(5, {
  title: "Resumo por produto ativo",
  slug: "resumo-por-produto-ativo",
  difficulty: "medium",
  prompt: "Agrupe produtos por active, conte linhas e calcule preco medio como average_price. Ordene com ativos primeiro.",
  starterSql: "SELECT active, count(*) AS product_count, avg(price) AS average_price\nFROM products\nGROUP BY active\nORDER BY active DESC;",
  expectedSql: "SELECT active, count(*) AS product_count, avg(price) AS average_price FROM challenge_data.products GROUP BY active ORDER BY active DESC",
  tables: ["products"],
  explanation: "AVG calcula medias e pode ser combinado com COUNT.",
});
add(5, {
  title: "Faixa de precos",
  slug: "faixa-de-precos",
  difficulty: "medium",
  prompt: "Retorne o menor preco como min_price e o maior preco como max_price da tabela products.",
  starterSql: "SELECT min(price) AS min_price, max(price) AS max_price\nFROM products;",
  expectedSql: "SELECT min(price) AS min_price, max(price) AS max_price FROM challenge_data.products",
  tables: ["products"],
  explanation: "MIN e MAX resumem extremos sem precisar ordenar a tabela.",
});
add(5, {
  title: "Estoque por situacao",
  slug: "estoque-por-situacao",
  difficulty: "medium",
  prompt: "Some o estoque por active usando total_stock como alias. Ordene com ativos primeiro.",
  starterSql: "SELECT active, sum(stock_quantity) AS total_stock\nFROM products\nGROUP BY active\nORDER BY active DESC;",
  expectedSql: "SELECT active, sum(stock_quantity) AS total_stock FROM challenge_data.products GROUP BY active ORDER BY active DESC",
  tables: ["products"],
  explanation: "Agregacoes tambem funcionam sobre colunas inteiras.",
});
add(5, {
  title: "Transacoes por tipo",
  slug: "transacoes-por-tipo",
  difficulty: "medium",
  prompt: "Some amount por type em financial_transactions usando total_amount. Ordene pelo maior total.",
  starterSql: "SELECT type, sum(amount) AS total_amount\nFROM financial_transactions\nGROUP BY type\nORDER BY total_amount DESC;",
  expectedSql: "SELECT type, sum(amount) AS total_amount FROM challenge_data.financial_transactions GROUP BY type ORDER BY total_amount DESC",
  tables: ["financial_transactions"],
  explanation: "Agrupar transacoes por tipo separa receita, taxa, frete e estorno.",
});
add(5, {
  title: "Pagamentos por metodo",
  slug: "pagamentos-por-metodo",
  difficulty: "medium",
  prompt: "Agrupe pagamentos por metodo, contando payment_count e somando total_amount. Ordene pelo maior total.",
  starterSql: "SELECT payment_method, count(*) AS payment_count, sum(amount) AS total_amount\nFROM payments\nGROUP BY payment_method\nORDER BY total_amount DESC;",
  expectedSql: "SELECT payment_method, count(*) AS payment_count, sum(amount) AS total_amount FROM challenge_data.payments GROUP BY payment_method ORDER BY total_amount DESC",
  tables: ["payments"],
  explanation: "Varios agregadores podem aparecer no mesmo SELECT.",
});
add(5, {
  title: "Pedidos por dia",
  slug: "pedidos-por-dia",
  difficulty: "hard",
  prompt: "Agrupe pedidos por order_date::date como order_day e conte order_count. Ordene pelo dia.",
  starterSql: "SELECT order_date::date AS order_day, count(*) AS order_count\nFROM orders\nGROUP BY order_day\nORDER BY order_day;",
  expectedSql: "SELECT order_date::date AS order_day, count(*) AS order_count FROM challenge_data.orders GROUP BY order_day ORDER BY order_day",
  tables: ["orders"],
  explanation: "Converter timestamp para date permite agrupar por dia calendario.",
});
add(5, {
  title: "Status com volume",
  slug: "status-com-volume",
  difficulty: "hard",
  prompt: "Liste status com pelo menos 3 pedidos usando HAVING. Retorne status e order_count, ordenando pela maior contagem.",
  starterSql: "SELECT status, count(*) AS order_count\nFROM orders\nGROUP BY status\nHAVING count(*) >= 3\nORDER BY order_count DESC, status;",
  expectedSql: "SELECT status, count(*) AS order_count FROM challenge_data.orders GROUP BY status HAVING count(*) >= 3 ORDER BY order_count DESC, status",
  tables: ["orders"],
  explanation: "HAVING filtra grupos depois que a agregacao foi calculada.",
});

add(6, {
  title: "Produtos com categoria",
  slug: "produtos-com-categoria",
  difficulty: "medium",
  prompt: "Liste produto, categoria e preco usando JOIN entre products e categories. Ordene por categoria e produto.",
  starterSql: "SELECT p.name AS product_name, c.name AS category_name, p.price\nFROM products p\nJOIN categories c ON c.id = p.category_id\nORDER BY category_name, product_name;",
  expectedSql: "SELECT p.name AS product_name, c.name AS category_name, p.price FROM challenge_data.products p JOIN challenge_data.categories c ON c.id = p.category_id ORDER BY category_name, product_name",
  tables: ["products", "categories"],
  explanation: "JOIN conecta linhas quando a chave estrangeira encontra a chave primaria.",
});
add(6, {
  title: "Pedidos com cliente",
  slug: "pedidos-com-cliente",
  difficulty: "medium",
  prompt: "Liste numero do pedido, cliente e total usando JOIN entre orders e customers. Ordene pela data e limite em 10.",
  starterSql: "SELECT o.order_number, c.full_name, o.total_amount\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.order_date\nLIMIT 10;",
  expectedSql: "SELECT o.order_number, c.full_name, o.total_amount FROM challenge_data.orders o JOIN challenge_data.customers c ON c.id = o.customer_id ORDER BY o.order_date LIMIT 10",
  tables: ["orders", "customers"],
  explanation: "A tabela orders guarda o customer_id, que aponta para customers.id.",
});
add(6, {
  title: "Itens com produto",
  slug: "itens-com-produto",
  difficulty: "medium",
  prompt: "Liste produto, quantidade e total da linha usando JOIN entre order_items e products. Ordene pelo maior line_total e limite em 10.",
  starterSql: "SELECT p.name AS product_name, oi.quantity, oi.line_total\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nORDER BY oi.line_total DESC\nLIMIT 10;",
  expectedSql: "SELECT p.name AS product_name, oi.quantity, oi.line_total FROM challenge_data.order_items oi JOIN challenge_data.products p ON p.id = oi.product_id ORDER BY oi.line_total DESC LIMIT 10",
  tables: ["order_items", "products"],
  explanation: "JOIN tambem permite enriquecer itens com nomes de produtos.",
});
add(6, {
  title: "Pagamentos com pedido",
  slug: "pagamentos-com-pedido",
  difficulty: "medium",
  prompt: "Liste numero do pedido, metodo, status do pagamento e valor. Ordene pelo numero do pedido.",
  starterSql: "SELECT o.order_number, p.payment_method, p.status, p.amount\nFROM payments p\nJOIN orders o ON o.id = p.order_id\nORDER BY o.order_number;",
  expectedSql: "SELECT o.order_number, p.payment_method, p.status, p.amount FROM challenge_data.payments p JOIN challenge_data.orders o ON o.id = p.order_id ORDER BY o.order_number",
  tables: ["payments", "orders"],
  explanation: "Pagamentos se relacionam a pedidos por order_id.",
});
add(6, {
  title: "Entregas com pedido",
  slug: "entregas-com-pedido",
  difficulty: "medium",
  prompt: "Liste numero do pedido, transportadora e status da entrega. Ordene pelo numero.",
  starterSql: "SELECT o.order_number, s.carrier, s.status\nFROM shipments s\nJOIN orders o ON o.id = s.order_id\nORDER BY o.order_number;",
  expectedSql: "SELECT o.order_number, s.carrier, s.status FROM challenge_data.shipments s JOIN challenge_data.orders o ON o.id = s.order_id ORDER BY o.order_number",
  tables: ["shipments", "orders"],
  explanation: "A tabela shipments descreve a logistica ligada ao pedido.",
});
add(6, {
  title: "Pedidos de clientes de SP",
  slug: "pedidos-clientes-sp",
  difficulty: "medium",
  prompt: "Liste cliente, numero do pedido e status para clientes de SP. Ordene por cliente e pedido.",
  starterSql: "SELECT c.full_name, o.order_number, o.status\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE c.state = 'SP'\nORDER BY c.full_name, o.order_number;",
  expectedSql: "SELECT c.full_name, o.order_number, o.status FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE c.state = 'SP' ORDER BY c.full_name, o.order_number",
  tables: ["customers", "orders"],
  explanation: "Filtros podem usar colunas de qualquer tabela ja unida.",
});
add(6, {
  title: "Produtos de Informatica",
  slug: "produtos-de-informatica",
  difficulty: "medium",
  prompt: "Liste categoria, produto e preco dos produtos da categoria Informatica. Ordene pelo produto.",
  starterSql: "SELECT c.name AS category_name, p.name AS product_name, p.price\nFROM categories c\nJOIN products p ON p.category_id = c.id\nWHERE c.name = 'Informatica'\nORDER BY product_name;",
  expectedSql: "SELECT c.name AS category_name, p.name AS product_name, p.price FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id WHERE c.name = 'Informatica' ORDER BY product_name",
  tables: ["categories", "products"],
  explanation: "JOIN permite filtrar por uma tabela e retornar dados de outra.",
});
add(6, {
  title: "Pedidos entregues com cliente",
  slug: "pedidos-entregues-com-cliente",
  difficulty: "medium",
  prompt: "Liste cliente, numero e status dos pedidos delivered. Ordene pelo cliente.",
  starterSql: "SELECT c.full_name, o.order_number, o.status\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.status = 'delivered'\nORDER BY c.full_name;",
  expectedSql: "SELECT c.full_name, o.order_number, o.status FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.status = 'delivered' ORDER BY c.full_name",
  tables: ["customers", "orders"],
  explanation: "O status fica em orders, enquanto o nome do cliente fica em customers.",
});
add(6, {
  title: "Itens do pedido A1001",
  slug: "itens-pedido-a1001",
  difficulty: "hard",
  prompt: "Liste numero do pedido, produto, quantidade, preco unitario e total da linha para o pedido A1001. Ordene pelo produto.",
  starterSql: "SELECT o.order_number, p.name AS product_name, oi.quantity, oi.unit_price, oi.line_total\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nJOIN products p ON p.id = oi.product_id\nWHERE o.order_number = 'A1001'\nORDER BY product_name;",
  expectedSql: "SELECT o.order_number, p.name AS product_name, oi.quantity, oi.unit_price, oi.line_total FROM challenge_data.orders o JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_number = 'A1001' ORDER BY product_name",
  tables: ["orders", "order_items", "products"],
  explanation: "Dois JOINs levam do pedido aos itens e dos itens aos produtos.",
});
add(6, {
  title: "Maiores pagamentos com cliente",
  slug: "maiores-pagamentos-com-cliente",
  difficulty: "hard",
  prompt: "Liste cliente, pedido, metodo e valor dos pagamentos paid. Ordene pelo maior valor e limite em 8.",
  starterSql: "SELECT c.full_name, o.order_number, p.payment_method, p.amount\nFROM payments p\nJOIN orders o ON o.id = p.order_id\nJOIN customers c ON c.id = o.customer_id\nWHERE p.status = 'paid'\nORDER BY p.amount DESC\nLIMIT 8;",
  expectedSql: "SELECT c.full_name, o.order_number, p.payment_method, p.amount FROM challenge_data.payments p JOIN challenge_data.orders o ON o.id = p.order_id JOIN challenge_data.customers c ON c.id = o.customer_id WHERE p.status = 'paid' ORDER BY p.amount DESC LIMIT 8",
  tables: ["payments", "orders", "customers"],
  explanation: "JOINs em cadeia montam uma visao completa do pagamento.",
});

add(7, {
  title: "Quantidade de pedidos por cliente",
  slug: "quantidade-pedidos-por-cliente",
  difficulty: "hard",
  prompt: "Use LEFT JOIN para listar todos os clientes e sua order_count. Ordene pela maior contagem e depois pelo nome.",
  starterSql: "SELECT c.full_name, count(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.full_name\nORDER BY order_count DESC, c.full_name;",
  expectedSql: "SELECT c.full_name, count(o.id) AS order_count FROM challenge_data.customers c LEFT JOIN challenge_data.orders o ON o.customer_id = c.id GROUP BY c.id, c.full_name ORDER BY order_count DESC, c.full_name",
  tables: ["customers", "orders"],
  explanation: "LEFT JOIN preserva clientes mesmo quando nao ha pedidos.",
});
add(7, {
  title: "Produtos nunca comprados",
  slug: "produtos-nunca-comprados",
  difficulty: "hard",
  prompt: "Use LEFT JOIN para listar nome e SKU dos produtos que nao aparecem em order_items. Ordene pelo nome.",
  starterSql: "SELECT p.name, p.sku\nFROM products p\nLEFT JOIN order_items oi ON oi.product_id = p.id\nWHERE oi.id IS NULL\nORDER BY p.name;",
  expectedSql: "SELECT p.name, p.sku FROM challenge_data.products p LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL ORDER BY p.name",
  tables: ["products", "order_items"],
  explanation: "LEFT JOIN com IS NULL encontra registros sem relacionamento.",
});
add(7, {
  title: "Pedidos sem entrega",
  slug: "pedidos-sem-entrega",
  difficulty: "hard",
  prompt: "Liste numero e status dos pedidos que ainda nao possuem registro em shipments. Ordene pelo numero.",
  starterSql: "SELECT o.order_number, o.status\nFROM orders o\nLEFT JOIN shipments s ON s.order_id = o.id\nWHERE s.id IS NULL\nORDER BY o.order_number;",
  expectedSql: "SELECT o.order_number, o.status FROM challenge_data.orders o LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE s.id IS NULL ORDER BY o.order_number",
  tables: ["orders", "shipments"],
  explanation: "Nem todo pedido tem entrega; LEFT JOIN revela essa ausencia.",
});
add(7, {
  title: "Vendas por categoria",
  slug: "vendas-por-categoria",
  difficulty: "hard",
  prompt: "Some line_total por categoria como sales_total. Ordene pelo maior total.",
  starterSql: "SELECT c.name AS category_name, sum(oi.line_total) AS sales_total\nFROM categories c\nJOIN products p ON p.category_id = c.id\nJOIN order_items oi ON oi.product_id = p.id\nGROUP BY c.name\nORDER BY sales_total DESC;",
  expectedSql: "SELECT c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.name ORDER BY sales_total DESC",
  tables: ["categories", "products", "order_items"],
  explanation: "Agregacoes depois de JOINs calculam metricas por dimensao.",
});
add(7, {
  title: "Clientes que mais compraram",
  slug: "clientes-que-mais-compraram",
  difficulty: "hard",
  prompt: "Some total_amount por cliente apenas para pedidos paid, shipped ou delivered. Ordene pelo maior total e limite em 5.",
  starterSql: "SELECT c.full_name, sum(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.status IN ('paid', 'shipped', 'delivered')\nGROUP BY c.id, c.full_name\nORDER BY total_spent DESC\nLIMIT 5;",
  expectedSql: "SELECT c.full_name, sum(o.total_amount) AS total_spent FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name ORDER BY total_spent DESC LIMIT 5",
  tables: ["customers", "orders"],
  explanation: "O filtro evita somar pedidos cancelados, pendentes ou estornados.",
});
add(7, {
  title: "Pedido, pagamento e entrega",
  slug: "pedido-pagamento-entrega",
  difficulty: "hard",
  prompt: "Liste numero do pedido, payment_status e shipment_status usando JOIN em payments e LEFT JOIN em shipments. Ordene pelo numero e limite em 12.",
  starterSql: "SELECT o.order_number, p.status AS payment_status, s.status AS shipment_status\nFROM orders o\nJOIN payments p ON p.order_id = o.id\nLEFT JOIN shipments s ON s.order_id = o.id\nORDER BY o.order_number\nLIMIT 12;",
  expectedSql: "SELECT o.order_number, p.status AS payment_status, s.status AS shipment_status FROM challenge_data.orders o JOIN challenge_data.payments p ON p.order_id = o.id LEFT JOIN challenge_data.shipments s ON s.order_id = o.id ORDER BY o.order_number LIMIT 12",
  tables: ["orders", "payments", "shipments"],
  explanation: "LEFT JOIN mantem pagamentos mesmo quando a entrega ainda nao existe.",
});
add(7, {
  title: "Financeiro por cliente e tipo",
  slug: "financeiro-por-cliente-tipo",
  difficulty: "hard",
  prompt: "Some amount por cliente e tipo de transacao. Retorne full_name, type e total_amount. Ordene por cliente e tipo.",
  starterSql: "SELECT c.full_name, ft.type, sum(ft.amount) AS total_amount\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN financial_transactions ft ON ft.order_id = o.id\nGROUP BY c.full_name, ft.type\nORDER BY c.full_name, ft.type;",
  expectedSql: "SELECT c.full_name, ft.type, sum(ft.amount) AS total_amount FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id GROUP BY c.full_name, ft.type ORDER BY c.full_name, ft.type",
  tables: ["customers", "orders", "financial_transactions"],
  explanation: "Relatorios financeiros geralmente cruzam cliente, pedido e transacao.",
});
add(7, {
  title: "Unidades vendidas por produto",
  slug: "unidades-vendidas-por-produto",
  difficulty: "hard",
  prompt: "Some quantity por produto como units_sold. Ordene pelo maior volume e nome. Limite em 8.",
  starterSql: "SELECT p.name, sum(oi.quantity) AS units_sold\nFROM products p\nJOIN order_items oi ON oi.product_id = p.id\nGROUP BY p.id, p.name\nORDER BY units_sold DESC, p.name\nLIMIT 8;",
  expectedSql: "SELECT p.name, sum(oi.quantity) AS units_sold FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY p.id, p.name ORDER BY units_sold DESC, p.name LIMIT 8",
  tables: ["products", "order_items"],
  explanation: "Somar quantidades mede giro, nao faturamento.",
});
add(7, {
  title: "Ticket medio por estado",
  slug: "ticket-medio-por-estado",
  difficulty: "hard",
  prompt: "Calcule average_order_value e order_count por estado do cliente. Ordene pelo maior ticket medio.",
  starterSql: "SELECT c.state, avg(o.total_amount) AS average_order_value, count(o.id) AS order_count\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nGROUP BY c.state\nORDER BY average_order_value DESC;",
  expectedSql: "SELECT c.state, avg(o.total_amount) AS average_order_value, count(o.id) AS order_count FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id GROUP BY c.state ORDER BY average_order_value DESC",
  tables: ["customers", "orders"],
  explanation: "AVG depois do JOIN permite analisar comportamento regional.",
});
add(7, {
  title: "Margem estimada por categoria",
  slug: "margem-estimada-por-categoria",
  difficulty: "hard",
  prompt: "Calcule estimated_margin por categoria usando sum((price - cost) * quantity). Ordene pela maior margem.",
  starterSql: "SELECT c.name AS category_name, sum((p.price - p.cost) * oi.quantity) AS estimated_margin\nFROM categories c\nJOIN products p ON p.category_id = c.id\nJOIN order_items oi ON oi.product_id = p.id\nGROUP BY c.name\nORDER BY estimated_margin DESC;",
  expectedSql: "SELECT c.name AS category_name, sum((p.price - p.cost) * oi.quantity) AS estimated_margin FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.name ORDER BY estimated_margin DESC",
  tables: ["categories", "products", "order_items"],
  explanation: "Expressoes agregadas permitem estimar indicadores de negocio.",
});

add(8, {
  title: "CTE de produtos ativos",
  slug: "cte-produtos-ativos",
  difficulty: "medium",
  prompt: "Crie a CTE active_products com produtos ativos e retorne nome e preco dos 5 mais caros.",
  starterSql: "WITH active_products AS (\n  SELECT name, price, stock_quantity\n  FROM products\n  WHERE active = true\n)\nSELECT name, price\nFROM active_products\nORDER BY price DESC\nLIMIT 5;",
  expectedSql: "WITH active_products AS (SELECT name, price, stock_quantity FROM challenge_data.products WHERE active = true) SELECT name, price FROM active_products ORDER BY price DESC LIMIT 5",
  tables: ["products"],
  explanation: "CTEs nomeiam uma etapa intermediaria da consulta.",
});
add(8, {
  title: "CTE de pedidos pagos",
  slug: "cte-pedidos-pagos",
  difficulty: "medium",
  prompt: "Crie a CTE paid_orders com pedidos paid e retorne numero e total ordenados pelo maior total.",
  starterSql: "WITH paid_orders AS (\n  SELECT order_number, total_amount\n  FROM orders\n  WHERE status = 'paid'\n)\nSELECT order_number, total_amount\nFROM paid_orders\nORDER BY total_amount DESC;",
  expectedSql: "WITH paid_orders AS (SELECT order_number, total_amount FROM challenge_data.orders WHERE status = 'paid') SELECT order_number, total_amount FROM paid_orders ORDER BY total_amount DESC",
  tables: ["orders"],
  explanation: "A consulta final le a CTE como se fosse uma tabela temporaria.",
});
add(8, {
  title: "CTE de pedidos com cliente",
  slug: "cte-pedidos-com-cliente",
  difficulty: "hard",
  prompt: "Crie uma CTE customer_orders com cliente, pedido e total. Retorne somente totais a partir de 1000, ordenados pelo maior total.",
  starterSql: "WITH customer_orders AS (\n  SELECT c.full_name, o.order_number, o.total_amount\n  FROM customers c\n  JOIN orders o ON o.customer_id = c.id\n)\nSELECT full_name, order_number, total_amount\nFROM customer_orders\nWHERE total_amount >= 1000\nORDER BY total_amount DESC;",
  expectedSql: "WITH customer_orders AS (SELECT c.full_name, o.order_number, o.total_amount FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id) SELECT full_name, order_number, total_amount FROM customer_orders WHERE total_amount >= 1000 ORDER BY total_amount DESC",
  tables: ["customers", "orders"],
  explanation: "CTEs ajudam a separar o JOIN do filtro final.",
});
add(8, {
  title: "CTE de vendas por categoria",
  slug: "cte-vendas-por-categoria",
  difficulty: "hard",
  prompt: "Crie sales_by_category com categoria e sales_total. Retorne categorias com sales_total maior que 1000.",
  starterSql: "WITH sales_by_category AS (\n  SELECT c.name AS category_name, sum(oi.line_total) AS sales_total\n  FROM categories c\n  JOIN products p ON p.category_id = c.id\n  JOIN order_items oi ON oi.product_id = p.id\n  GROUP BY c.name\n)\nSELECT category_name, sales_total\nFROM sales_by_category\nWHERE sales_total > 1000\nORDER BY sales_total DESC;",
  expectedSql: "WITH sales_by_category AS (SELECT c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.name) SELECT category_name, sales_total FROM sales_by_category WHERE sales_total > 1000 ORDER BY sales_total DESC",
  tables: ["categories", "products", "order_items"],
  explanation: "A CTE permite filtrar uma agregacao usando um SELECT externo.",
});
add(8, {
  title: "CTE de baixo estoque",
  slug: "cte-baixo-estoque",
  difficulty: "medium",
  prompt: "Crie low_stock com produtos de estoque menor ou igual a 5 e retorne nome e estoque ordenados por estoque e nome.",
  starterSql: "WITH low_stock AS (\n  SELECT name, stock_quantity\n  FROM products\n  WHERE stock_quantity <= 5\n)\nSELECT name, stock_quantity\nFROM low_stock\nORDER BY stock_quantity, name;",
  expectedSql: "WITH low_stock AS (SELECT name, stock_quantity FROM challenge_data.products WHERE stock_quantity <= 5) SELECT name, stock_quantity FROM low_stock ORDER BY stock_quantity, name",
  tables: ["products"],
  explanation: "CTEs simples tambem melhoram a leitura de filtros importantes.",
});
add(8, {
  title: "CTE de pedidos recentes",
  slug: "cte-pedidos-recentes",
  difficulty: "medium",
  prompt: "Crie recent_orders com pedidos a partir de 2026-02-10 e retorne numero, data e total ordenados pela data.",
  starterSql: "WITH recent_orders AS (\n  SELECT order_number, order_date, total_amount\n  FROM orders\n  WHERE order_date >= '2026-02-10'\n)\nSELECT order_number, order_date, total_amount\nFROM recent_orders\nORDER BY order_date;",
  expectedSql: "WITH recent_orders AS (SELECT order_number, order_date, total_amount FROM challenge_data.orders WHERE order_date >= '2026-02-10') SELECT order_number, order_date, total_amount FROM recent_orders ORDER BY order_date",
  tables: ["orders"],
  explanation: "Separar o periodo em uma CTE facilita revisar a regra.",
});
add(8, {
  title: "Duas CTEs para pedidos entregues",
  slug: "duas-ctes-pedidos-entregues",
  difficulty: "hard",
  prompt: "Crie delivered_orders e depois delivered_customers. Retorne cliente, pedido e total de pedidos delivered ordenados pelo cliente.",
  starterSql: "WITH delivered_orders AS (\n  SELECT id, customer_id, order_number, total_amount\n  FROM orders\n  WHERE status = 'delivered'\n), delivered_customers AS (\n  SELECT c.full_name, d.order_number, d.total_amount\n  FROM delivered_orders d\n  JOIN customers c ON c.id = d.customer_id\n)\nSELECT full_name, order_number, total_amount\nFROM delivered_customers\nORDER BY full_name;",
  expectedSql: "WITH delivered_orders AS (SELECT id, customer_id, order_number, total_amount FROM challenge_data.orders WHERE status = 'delivered'), delivered_customers AS (SELECT c.full_name, d.order_number, d.total_amount FROM delivered_orders d JOIN challenge_data.customers c ON c.id = d.customer_id) SELECT full_name, order_number, total_amount FROM delivered_customers ORDER BY full_name",
  tables: ["orders", "customers"],
  explanation: "CTEs encadeadas criam uma narrativa clara para a consulta.",
});
add(8, {
  title: "CTE de totais por metodo",
  slug: "cte-totais-por-metodo",
  difficulty: "hard",
  prompt: "Crie method_totals com soma de pagamentos por metodo. Retorne metodos com total_amount >= 1000.",
  starterSql: "WITH method_totals AS (\n  SELECT payment_method, sum(amount) AS total_amount\n  FROM payments\n  GROUP BY payment_method\n)\nSELECT payment_method, total_amount\nFROM method_totals\nWHERE total_amount >= 1000\nORDER BY total_amount DESC;",
  expectedSql: "WITH method_totals AS (SELECT payment_method, sum(amount) AS total_amount FROM challenge_data.payments GROUP BY payment_method) SELECT payment_method, total_amount FROM method_totals WHERE total_amount >= 1000 ORDER BY total_amount DESC",
  tables: ["payments"],
  explanation: "Uma CTE agregada pode ser filtrada pelo SELECT externo.",
});
add(8, {
  title: "CTE de margem de produto",
  slug: "cte-margem-produto",
  difficulty: "hard",
  prompt: "Crie product_margins com name e margin. Retorne produtos com margin maior que 200 ordenados pela maior margem.",
  starterSql: "WITH product_margins AS (\n  SELECT name, price - cost AS margin\n  FROM products\n)\nSELECT name, margin\nFROM product_margins\nWHERE margin > 200\nORDER BY margin DESC;",
  expectedSql: "WITH product_margins AS (SELECT name, price - cost AS margin FROM challenge_data.products) SELECT name, margin FROM product_margins WHERE margin > 200 ORDER BY margin DESC",
  tables: ["products"],
  explanation: "A CTE permite reutilizar um alias calculado no filtro externo.",
});
add(8, {
  title: "CTE com ranking de pedidos",
  slug: "cte-ranking-pedidos",
  difficulty: "hard",
  prompt: "Crie ranked_orders com row_number por total decrescente. Retorne ranking, pedido e total dos 5 maiores.",
  starterSql: "WITH ranked_orders AS (\n  SELECT order_number, total_amount, row_number() OVER (ORDER BY total_amount DESC) AS ranking\n  FROM orders\n)\nSELECT ranking, order_number, total_amount\nFROM ranked_orders\nWHERE ranking <= 5\nORDER BY ranking;",
  expectedSql: "WITH ranked_orders AS (SELECT order_number, total_amount, row_number() OVER (ORDER BY total_amount DESC) AS ranking FROM challenge_data.orders) SELECT ranking, order_number, total_amount FROM ranked_orders WHERE ranking <= 5 ORDER BY ranking",
  tables: ["orders"],
  explanation: "Window functions podem ser isoladas em CTEs para filtrar o ranking depois.",
});

add(9, {
  title: "Clientes de SP ou RJ com UNION",
  slug: "clientes-sp-rj-union",
  difficulty: "medium",
  prompt: "Use UNION para unir clientes de SP e clientes de RJ. Retorne full_name e state, ordenando pelo nome.",
  starterSql: "SELECT full_name, state\nFROM customers\nWHERE state = 'SP'\nUNION\nSELECT full_name, state\nFROM customers\nWHERE state = 'RJ'\nORDER BY full_name;",
  expectedSql: "SELECT full_name, state FROM challenge_data.customers WHERE state = 'SP' UNION SELECT full_name, state FROM challenge_data.customers WHERE state = 'RJ' ORDER BY full_name",
  tables: ["customers"],
  explanation: "UNION combina resultados compativeis e remove duplicidades.",
});
add(9, {
  title: "Produtos ativos e inativos rotulados",
  slug: "produtos-ativos-inativos-rotulados",
  difficulty: "medium",
  prompt: "Use UNION ALL para listar produtos ativos e inativos com product_status igual a active ou inactive. Ordene por status e nome.",
  starterSql: "SELECT name, 'active' AS product_status\nFROM products\nWHERE active = true\nUNION ALL\nSELECT name, 'inactive' AS product_status\nFROM products\nWHERE active = false\nORDER BY product_status, name;",
  expectedSql: "SELECT name, 'active' AS product_status FROM challenge_data.products WHERE active = true UNION ALL SELECT name, 'inactive' AS product_status FROM challenge_data.products WHERE active = false ORDER BY product_status, name",
  tables: ["products"],
  explanation: "UNION ALL preserva todas as linhas sem tentar remover repeticoes.",
});
add(9, {
  title: "Pedidos pagos e entregues",
  slug: "pedidos-pagos-entregues-union",
  difficulty: "medium",
  prompt: "Use UNION para combinar pedidos paid e delivered. Retorne order_number e status, ordenando por status e numero.",
  starterSql: "SELECT order_number, status\nFROM orders\nWHERE status = 'paid'\nUNION\nSELECT order_number, status\nFROM orders\nWHERE status = 'delivered'\nORDER BY status, order_number;",
  expectedSql: "SELECT order_number, status FROM challenge_data.orders WHERE status = 'paid' UNION SELECT order_number, status FROM challenge_data.orders WHERE status = 'delivered' ORDER BY status, order_number",
  tables: ["orders"],
  explanation: "As duas partes do UNION precisam retornar colunas compativeis.",
});
add(9, {
  title: "Linha do tempo de pedidos e pagamentos",
  slug: "linha-tempo-pedidos-pagamentos",
  difficulty: "hard",
  prompt: "Use UNION ALL para unir pedidos e pagamentos antes de 2026-02-05. Retorne reference, event_type e event_at ordenados por event_at.",
  starterSql: "SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at\nFROM orders\nWHERE order_date < '2026-02-05'\nUNION ALL\nSELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at\nFROM payments\nWHERE paid_at < '2026-02-05' AND paid_at IS NOT NULL\nORDER BY event_at, event_type;",
  expectedSql: "SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at FROM challenge_data.orders WHERE order_date < '2026-02-05' UNION ALL SELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at FROM challenge_data.payments WHERE paid_at < '2026-02-05' AND paid_at IS NOT NULL ORDER BY event_at, event_type",
  tables: ["orders", "payments"],
  explanation: "UNION ALL pode criar uma linha do tempo quando as colunas sao padronizadas.",
});
add(9, {
  title: "Categorias e produtos premium",
  slug: "categorias-produtos-premium",
  difficulty: "medium",
  prompt: "Use UNION ALL para unir nomes de categorias e produtos com preco >= 1000. Retorne name e source, ordenando por source e name.",
  starterSql: "SELECT name, 'category' AS source\nFROM categories\nUNION ALL\nSELECT name, 'product' AS source\nFROM products\nWHERE price >= 1000\nORDER BY source, name;",
  expectedSql: "SELECT name, 'category' AS source FROM challenge_data.categories UNION ALL SELECT name, 'product' AS source FROM challenge_data.products WHERE price >= 1000 ORDER BY source, name",
  tables: ["categories", "products"],
  explanation: "Colunas literais ajudam a identificar a origem de cada linha.",
});
add(9, {
  title: "Receitas e estornos",
  slug: "receitas-e-estornos",
  difficulty: "medium",
  prompt: "Use UNION ALL para unir transacoes revenue e refund. Retorne order_id, type e amount, ordenando por type e maior amount.",
  starterSql: "SELECT order_id, type, amount\nFROM financial_transactions\nWHERE type = 'revenue'\nUNION ALL\nSELECT order_id, type, amount\nFROM financial_transactions\nWHERE type = 'refund'\nORDER BY type, amount DESC;",
  expectedSql: "SELECT order_id, type, amount FROM challenge_data.financial_transactions WHERE type = 'revenue' UNION ALL SELECT order_id, type, amount FROM challenge_data.financial_transactions WHERE type = 'refund' ORDER BY type, amount DESC",
  tables: ["financial_transactions"],
  explanation: "UNION ALL permite comparar tipos de movimento lado a lado.",
});
add(9, {
  title: "Busca combinada por nome",
  slug: "busca-combinada-por-nome",
  difficulty: "hard",
  prompt: "Use UNION ALL para retornar clientes com Silva no nome e produtos com SQL no nome. Use result_name e result_type. Ordene por tipo e nome.",
  starterSql: "SELECT full_name AS result_name, 'customer' AS result_type\nFROM customers\nWHERE full_name LIKE '%Silva%'\nUNION ALL\nSELECT name AS result_name, 'product' AS result_type\nFROM products\nWHERE name LIKE '%SQL%'\nORDER BY result_type, result_name;",
  expectedSql: "SELECT full_name AS result_name, 'customer' AS result_type FROM challenge_data.customers WHERE full_name LIKE '%Silva%' UNION ALL SELECT name AS result_name, 'product' AS result_type FROM challenge_data.products WHERE name LIKE '%SQL%' ORDER BY result_type, result_name",
  tables: ["customers", "products"],
  explanation: "UNION pode montar resultados de busca com origem padronizada.",
});
add(9, {
  title: "Clientes do Norte e Sudeste",
  slug: "clientes-norte-sudeste",
  difficulty: "medium",
  prompt: "Use UNION ALL para rotular clientes de Rondonia ou AM como norte e clientes de SP, RJ ou MG como sudeste. Ordene por region e nome.",
  starterSql: "SELECT full_name, state, 'norte' AS region\nFROM customers\nWHERE state IN ('Rondonia', 'AM')\nUNION ALL\nSELECT full_name, state, 'sudeste' AS region\nFROM customers\nWHERE state IN ('SP', 'RJ', 'MG')\nORDER BY region, full_name;",
  expectedSql: "SELECT full_name, state, 'norte' AS region FROM challenge_data.customers WHERE state IN ('Rondonia', 'AM') UNION ALL SELECT full_name, state, 'sudeste' AS region FROM challenge_data.customers WHERE state IN ('SP', 'RJ', 'MG') ORDER BY region, full_name",
  tables: ["customers"],
  explanation: "A mesma tabela pode aparecer nos dois lados do UNION com filtros diferentes.",
});
add(9, {
  title: "Contagens de metodos e status",
  slug: "contagens-metodos-status",
  difficulty: "hard",
  prompt: "Use UNION ALL para juntar contagens por payment_method e por status de pedidos. Retorne label, source e total. Ordene por source e label.",
  starterSql: "SELECT payment_method AS label, 'payment_method' AS source, count(*) AS total\nFROM payments\nGROUP BY payment_method\nUNION ALL\nSELECT status AS label, 'order_status' AS source, count(*) AS total\nFROM orders\nGROUP BY status\nORDER BY source, label;",
  expectedSql: "SELECT payment_method AS label, 'payment_method' AS source, count(*) AS total FROM challenge_data.payments GROUP BY payment_method UNION ALL SELECT status AS label, 'order_status' AS source, count(*) AS total FROM challenge_data.orders GROUP BY status ORDER BY source, label",
  tables: ["payments", "orders"],
  explanation: "Agregacoes tambem podem ser unidas quando possuem a mesma estrutura.",
});
add(9, {
  title: "UNION dentro de CTE",
  slug: "union-dentro-de-cte",
  difficulty: "hard",
  prompt: "Crie selected_orders com UNION ALL entre pedidos total_amount >= 2000 e pedidos pending. Retorne numero, status e total ordenados pelo maior total.",
  starterSql: "WITH selected_orders AS (\n  SELECT order_number, status, total_amount\n  FROM orders\n  WHERE total_amount >= 2000\n  UNION ALL\n  SELECT order_number, status, total_amount\n  FROM orders\n  WHERE status = 'pending'\n)\nSELECT order_number, status, total_amount\nFROM selected_orders\nORDER BY total_amount DESC;",
  expectedSql: "WITH selected_orders AS (SELECT order_number, status, total_amount FROM challenge_data.orders WHERE total_amount >= 2000 UNION ALL SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'pending') SELECT order_number, status, total_amount FROM selected_orders ORDER BY total_amount DESC",
  tables: ["orders"],
  explanation: "CTE e UNION juntos deixam a combinacao mais facil de revisar.",
});

add(10, {
  title: "Top clientes por gasto valido",
  slug: "top-clientes-gasto-valido",
  difficulty: "hard",
  prompt: "Com uma CTE valid_orders, some pedidos paid, shipped e delivered por cliente. Retorne os 5 maiores totais.",
  starterSql: "WITH valid_orders AS (\n  SELECT customer_id, total_amount\n  FROM orders\n  WHERE status IN ('paid', 'shipped', 'delivered')\n)\nSELECT c.full_name, sum(v.total_amount) AS total_spent\nFROM valid_orders v\nJOIN customers c ON c.id = v.customer_id\nGROUP BY c.full_name\nORDER BY total_spent DESC\nLIMIT 5;",
  expectedSql: "WITH valid_orders AS (SELECT customer_id, total_amount FROM challenge_data.orders WHERE status IN ('paid', 'shipped', 'delivered')) SELECT c.full_name, sum(v.total_amount) AS total_spent FROM valid_orders v JOIN challenge_data.customers c ON c.id = v.customer_id GROUP BY c.full_name ORDER BY total_spent DESC LIMIT 5",
  tables: ["orders", "customers"],
  explanation: "A CTE isola a regra de pedido valido antes da agregacao por cliente.",
});
add(10, {
  title: "Produtos acima da media da categoria",
  slug: "produtos-acima-media-categoria",
  difficulty: "hard",
  prompt: "Crie category_avg com media de preco por categoria e liste produtos com preco acima da media da propria categoria.",
  starterSql: "WITH category_avg AS (\n  SELECT category_id, avg(price) AS average_price\n  FROM products\n  GROUP BY category_id\n)\nSELECT p.name, p.price, a.average_price\nFROM products p\nJOIN category_avg a ON a.category_id = p.category_id\nWHERE p.price > a.average_price\nORDER BY p.price DESC;",
  expectedSql: "WITH category_avg AS (SELECT category_id, avg(price) AS average_price FROM challenge_data.products GROUP BY category_id) SELECT p.name, p.price, a.average_price FROM challenge_data.products p JOIN category_avg a ON a.category_id = p.category_id WHERE p.price > a.average_price ORDER BY p.price DESC",
  tables: ["products"],
  explanation: "Comparar com medias por grupo exige calcular o grupo antes de filtrar o item.",
});
add(10, {
  title: "Clientes sem pedido entregue",
  slug: "clientes-sem-pedido-entregue",
  difficulty: "hard",
  prompt: "Use LEFT JOIN contra pedidos delivered para listar clientes sem pedido entregue. Retorne full_name e state, ordenando pelo nome.",
  starterSql: "SELECT c.full_name, c.state\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered'\nWHERE o.id IS NULL\nORDER BY c.full_name;",
  expectedSql: "SELECT c.full_name, c.state FROM challenge_data.customers c LEFT JOIN challenge_data.orders o ON o.customer_id = c.id AND o.status = 'delivered' WHERE o.id IS NULL ORDER BY c.full_name",
  tables: ["customers", "orders"],
  explanation: "O filtro de status no ON preserva clientes que nao possuem pedido entregue.",
});
add(10, {
  title: "Pedidos pagos ainda sem entrega",
  slug: "pedidos-pagos-sem-entrega",
  difficulty: "hard",
  prompt: "Liste pedidos paid que nao possuem shipment. Retorne order_number, total_amount e status, ordenando pelo maior total.",
  starterSql: "SELECT o.order_number, o.total_amount, o.status\nFROM orders o\nLEFT JOIN shipments s ON s.order_id = o.id\nWHERE o.status = 'paid' AND s.id IS NULL\nORDER BY o.total_amount DESC;",
  expectedSql: "SELECT o.order_number, o.total_amount, o.status FROM challenge_data.orders o LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE o.status = 'paid' AND s.id IS NULL ORDER BY o.total_amount DESC",
  tables: ["orders", "shipments"],
  explanation: "LEFT JOIN com filtro combina status financeiro e ausencia logistica.",
});
add(10, {
  title: "Estoque e venda por categoria",
  slug: "estoque-venda-por-categoria",
  difficulty: "hard",
  prompt: "Use CTEs para calcular total_stock e sales_total por categoria sem duplicar estoque. Ordene pelo maior sales_total.",
  starterSql: "WITH category_stock AS (\n  SELECT c.id, c.name AS category_name, sum(p.stock_quantity) AS total_stock\n  FROM categories c\n  JOIN products p ON p.category_id = c.id\n  GROUP BY c.id, c.name\n), category_sales AS (\n  SELECT c.id, coalesce(sum(oi.line_total), 0) AS sales_total\n  FROM categories c\n  JOIN products p ON p.category_id = c.id\n  LEFT JOIN order_items oi ON oi.product_id = p.id\n  GROUP BY c.id\n)\nSELECT cs.category_name, cs.total_stock, s.sales_total\nFROM category_stock cs\nJOIN category_sales s ON s.id = cs.id\nORDER BY s.sales_total DESC;",
  expectedSql: "WITH category_stock AS (SELECT c.id, c.name AS category_name, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.id, c.name), category_sales AS (SELECT c.id, coalesce(sum(oi.line_total), 0) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.id) SELECT cs.category_name, cs.total_stock, s.sales_total FROM category_stock cs JOIN category_sales s ON s.id = cs.id ORDER BY s.sales_total DESC",
  tables: ["categories", "products", "order_items"],
  explanation: "Separar estoque e vendas evita multiplicar estoque pelo numero de itens vendidos.",
});
add(10, {
  title: "Pedidos com desconto ou frete gratis",
  slug: "pedidos-desconto-ou-frete-gratis",
  difficulty: "medium",
  prompt: "Use UNION para combinar pedidos com desconto e pedidos com frete gratis. Retorne order_number, reason e amount, ordenando por reason e numero.",
  starterSql: "SELECT order_number, 'discount' AS reason, discount_amount AS amount\nFROM orders\nWHERE discount_amount > 0\nUNION\nSELECT order_number, 'free_shipping' AS reason, shipping_amount AS amount\nFROM orders\nWHERE shipping_amount = 0\nORDER BY reason, order_number;",
  expectedSql: "SELECT order_number, 'discount' AS reason, discount_amount AS amount FROM challenge_data.orders WHERE discount_amount > 0 UNION SELECT order_number, 'free_shipping' AS reason, shipping_amount AS amount FROM challenge_data.orders WHERE shipping_amount = 0 ORDER BY reason, order_number",
  tables: ["orders"],
  explanation: "UNION ajuda a produzir listas de motivos com regras diferentes.",
});
add(10, {
  title: "Eventos recentes de pedido",
  slug: "eventos-recentes-pedido",
  difficulty: "hard",
  prompt: "Crie uma CTE events com UNION ALL entre pedidos e pagamentos. Retorne eventos a partir de 2026-02-18 ordenados por data.",
  starterSql: "WITH events AS (\n  SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at\n  FROM orders\n  UNION ALL\n  SELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at\n  FROM payments\n  WHERE paid_at IS NOT NULL\n)\nSELECT reference, event_type, event_at\nFROM events\nWHERE event_at >= '2026-02-18'\nORDER BY event_at, event_type;",
  expectedSql: "WITH events AS (SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at FROM challenge_data.orders UNION ALL SELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at FROM challenge_data.payments WHERE paid_at IS NOT NULL) SELECT reference, event_type, event_at FROM events WHERE event_at >= '2026-02-18' ORDER BY event_at, event_type",
  tables: ["orders", "payments"],
  explanation: "UNION em CTE cria uma base comum para filtros finais.",
});
add(10, {
  title: "Produtos vendidos em pedidos nao cancelados",
  slug: "produtos-vendidos-pedidos-nao-cancelados",
  difficulty: "hard",
  prompt: "Some quantity por produto considerando pedidos que nao sejam cancelled. Ordene por units_sold desc e nome.",
  starterSql: "SELECT p.name, sum(oi.quantity) AS units_sold\nFROM products p\nJOIN order_items oi ON oi.product_id = p.id\nJOIN orders o ON o.id = oi.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY units_sold DESC, p.name;",
  expectedSql: "SELECT p.name, sum(oi.quantity) AS units_sold FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.status <> 'cancelled' GROUP BY p.name ORDER BY units_sold DESC, p.name",
  tables: ["products", "order_items", "orders"],
  explanation: "Filtrar pedidos antes da agregacao muda o volume vendido.",
});
add(10, {
  title: "Resultado financeiro liquido por pedido",
  slug: "resultado-financeiro-liquido-pedido",
  difficulty: "hard",
  prompt: "Calcule net_amount por pedido: revenue soma positivo; refund, fee e shipping_cost subtraem. Ordene pelo maior net_amount.",
  starterSql: "SELECT o.order_number,\n  sum(CASE WHEN ft.type IN ('refund', 'fee', 'shipping_cost') THEN -ft.amount ELSE ft.amount END) AS net_amount\nFROM orders o\nJOIN financial_transactions ft ON ft.order_id = o.id\nGROUP BY o.order_number\nORDER BY net_amount DESC;",
  expectedSql: "SELECT o.order_number, sum(CASE WHEN ft.type IN ('refund', 'fee', 'shipping_cost') THEN -ft.amount ELSE ft.amount END) AS net_amount FROM challenge_data.orders o JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id GROUP BY o.order_number ORDER BY net_amount DESC",
  tables: ["orders", "financial_transactions"],
  explanation: "CASE transforma tipos de transacao em sinal positivo ou negativo.",
});
add(10, {
  title: "Desafio final de categorias",
  slug: "desafio-final-categorias",
  difficulty: "special",
  points: 80,
  prompt: "Com CTEs category_sales e category_stock, retorne category_name, sales_total e total_stock para categorias com sales_total > 500. Ordene pelo maior sales_total.",
  starterSql: "WITH category_sales AS (\n  SELECT c.name AS category_name, sum(oi.line_total) AS sales_total\n  FROM categories c\n  JOIN products p ON p.category_id = c.id\n  JOIN order_items oi ON oi.product_id = p.id\n  GROUP BY c.name\n), category_stock AS (\n  SELECT c.name AS category_name, sum(p.stock_quantity) AS total_stock\n  FROM categories c\n  JOIN products p ON p.category_id = c.id\n  GROUP BY c.name\n)\nSELECT s.category_name, s.sales_total, st.total_stock\nFROM category_sales s\nJOIN category_stock st ON st.category_name = s.category_name\nWHERE s.sales_total > 500\nORDER BY s.sales_total DESC;",
  expectedSql: "WITH category_sales AS (SELECT c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.name), category_stock AS (SELECT c.name AS category_name, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.name) SELECT s.category_name, s.sales_total, st.total_stock FROM category_sales s JOIN category_stock st ON st.category_name = s.category_name WHERE s.sales_total > 500 ORDER BY s.sales_total DESC",
  tables: ["categories", "products", "order_items"],
  explanation: "O desafio combina CTEs, JOIN, agregacao, filtro e ordenacao em uma consulta final.",
});

add(11, {
  type: "insert_rows",
  title: "Inserindo categoria de cursos",
  slug: "inserindo-categoria-cursos",
  difficulty: "easy",
  prompt: "Insira uma categoria chamada Cursos usando o id 20000000-0000-0000-0000-000000000090.",
  starterSql: "INSERT INTO categories (id, name)\nVALUES ('20000000-0000-0000-0000-000000000090', 'Cursos');",
  expectedSql: "INSERT INTO categories (id, name) VALUES ('20000000-0000-0000-0000-000000000090', 'Cursos')",
  validationSql: "SELECT id::text, name FROM categories WHERE id = '20000000-0000-0000-0000-000000000090'",
  tables: ["categories"],
  explanation: "INSERT adiciona uma linha nova informando colunas e valores na mesma ordem.",
});
add(11, {
  type: "insert_rows",
  title: "Inserindo novo cliente",
  slug: "inserindo-novo-cliente",
  difficulty: "medium",
  prompt: "Insira a cliente Laura Gomes, email laura@exemplo.com, cidade Boa Vista e estado RR usando o id 10000000-0000-0000-0000-000000000090.",
  starterSql: "INSERT INTO customers (id, full_name, email, city, state)\nVALUES ('10000000-0000-0000-0000-000000000090', 'Laura Gomes', 'laura@exemplo.com', 'Boa Vista', 'RR');",
  expectedSql: "INSERT INTO customers (id, full_name, email, city, state) VALUES ('10000000-0000-0000-0000-000000000090', 'Laura Gomes', 'laura@exemplo.com', 'Boa Vista', 'RR')",
  validationSql: "SELECT id::text, full_name, email, city, state FROM customers WHERE id = '10000000-0000-0000-0000-000000000090'",
  tables: ["customers"],
  explanation: "Declarar as colunas no INSERT deixa a operacao previsivel mesmo quando a tabela tem defaults.",
});
add(11, {
  type: "insert_rows",
  title: "Inserindo multiplas categorias",
  slug: "inserindo-multiplas-categorias-sandbox",
  difficulty: "medium",
  prompt: "Insira as categorias Audio e Video usando os ids 20000000-0000-0000-0000-000000000091 e 20000000-0000-0000-0000-000000000092.",
  starterSql: "INSERT INTO categories (id, name)\nVALUES\n  ('20000000-0000-0000-0000-000000000091', 'Audio'),\n  ('20000000-0000-0000-0000-000000000092', 'Video');",
  expectedSql: "INSERT INTO categories (id, name) VALUES ('20000000-0000-0000-0000-000000000091', 'Audio'), ('20000000-0000-0000-0000-000000000092', 'Video')",
  validationSql: "SELECT id::text, name FROM categories WHERE id IN ('20000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000092') ORDER BY id",
  tables: ["categories"],
  explanation: "Um unico INSERT pode criar varias linhas separando os grupos de valores por virgula.",
});
add(11, {
  type: "delete_rows",
  title: "Removendo produto inativo",
  slug: "removendo-produto-inativo",
  difficulty: "medium",
  prompt: "Remova o produto WEB-FHD pelo SKU. Use DELETE com WHERE.",
  starterSql: "DELETE FROM products\nWHERE sku = 'WEB-FHD';",
  expectedSql: "DELETE FROM products WHERE sku = 'WEB-FHD'",
  validationSql: "SELECT count(*)::int AS remaining_products FROM products WHERE sku = 'WEB-FHD'",
  tables: ["products"],
  explanation: "DELETE deve ser acompanhado de WHERE para remover apenas as linhas pretendidas.",
});
add(11, {
  type: "delete_rows",
  title: "Removendo pagamentos falhos",
  slug: "removendo-pagamentos-falhos",
  difficulty: "medium",
  prompt: "Remova todos os pagamentos com status failed.",
  starterSql: "DELETE FROM payments\nWHERE status = 'failed';",
  expectedSql: "DELETE FROM payments WHERE status = 'failed'",
  validationSql: "SELECT count(*)::int AS failed_payments FROM payments WHERE status = 'failed'",
  tables: ["payments"],
  explanation: "Filtros por status sao comuns em limpezas controladas de dados operacionais.",
});
add(11, {
  type: "delete_rows",
  title: "Removendo pedidos pendentes",
  slug: "removendo-pedidos-pendentes",
  difficulty: "hard",
  prompt: "Remova todos os pedidos com status pending.",
  starterSql: "DELETE FROM orders\nWHERE status = 'pending';",
  expectedSql: "DELETE FROM orders WHERE status = 'pending'",
  validationSql: "SELECT count(*)::int AS pending_orders FROM orders WHERE status = 'pending'",
  tables: ["orders"],
  explanation: "Mesmo em remocoes em lote, o WHERE precisa representar uma regra clara.",
});
add(11, {
  type: "create_table",
  title: "Criando tabela de fornecedores",
  slug: "criando-tabela-fornecedores-sandbox",
  difficulty: "hard",
  prompt: "Crie a tabela suppliers com id uuid primary key, name text not null, city text e active boolean default true.",
  starterSql: "CREATE TABLE suppliers (\n  id uuid PRIMARY KEY,\n  name text NOT NULL,\n  city text,\n  active boolean DEFAULT true\n);",
  expectedSql: "CREATE TABLE suppliers (id uuid PRIMARY KEY, name text NOT NULL, city text, active boolean DEFAULT true)",
  validationSql: "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'suppliers' ORDER BY ordinal_position",
  tables: ["suppliers"],
  explanation: "CREATE TABLE define colunas, tipos e restricoes antes de qualquer linha existir.",
});
add(11, {
  type: "create_table",
  title: "Criando tabela de avaliacoes",
  slug: "criando-tabela-avaliacoes",
  difficulty: "hard",
  prompt: "Crie a tabela product_reviews com id uuid primary key, product_id uuid not null, rating int not null e comment text.",
  starterSql: "CREATE TABLE product_reviews (\n  id uuid PRIMARY KEY,\n  product_id uuid NOT NULL,\n  rating int NOT NULL,\n  comment text\n);",
  expectedSql: "CREATE TABLE product_reviews (id uuid PRIMARY KEY, product_id uuid NOT NULL, rating int NOT NULL, comment text)",
  validationSql: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'product_reviews' ORDER BY ordinal_position",
  tables: ["product_reviews"],
  explanation: "A modelagem minima de uma tabela combina chave primaria, campos obrigatorios e campos opcionais.",
});
add(11, {
  type: "drop_table",
  title: "Removendo tabela de importacao",
  slug: "removendo-tabela-importacao",
  difficulty: "medium",
  prompt: "Remova a tabela staging_imports.",
  starterSql: "DROP TABLE staging_imports;",
  expectedSql: "DROP TABLE staging_imports",
  setupSql: "CREATE TABLE staging_imports (id uuid PRIMARY KEY, raw_payload text NOT NULL)",
  validationSql: "SELECT (to_regclass('staging_imports') IS NULL) AS table_removed",
  tables: ["staging_imports"],
  explanation: "DROP TABLE remove a estrutura inteira; aqui isso acontece apenas no sandbox do desafio.",
});
add(11, {
  type: "drop_table",
  title: "Removendo tabela temporaria",
  slug: "removendo-tabela-temporaria-sandbox",
  difficulty: "hard",
  prompt: "Remova a tabela temporary_reviews usando DROP TABLE IF EXISTS.",
  starterSql: "DROP TABLE IF EXISTS temporary_reviews;",
  expectedSql: "DROP TABLE IF EXISTS temporary_reviews",
  setupSql: "CREATE TABLE temporary_reviews (id uuid PRIMARY KEY, notes text)",
  validationSql: "SELECT (to_regclass('temporary_reviews') IS NULL) AS table_removed",
  tables: ["temporary_reviews"],
  explanation: "IF EXISTS evita erro quando a tabela ja nao existe, sem mudar o objetivo do DROP.",
});

if (challengeDefinitions.length !== 110) {
  throw new Error(`Expected 110 challenges, got ${challengeDefinitions.length}`);
}

const businessQuestions = [
  business("Receita total no mes", "negocio-receita-total-mes", "medium", "Pergunta de negocio: qual foi a receita total da loja em fevereiro de 2026? Retorne `revenue_total` somando `amount` das transacoes `revenue` em `financial_transactions` no periodo de 2026-02-01 ate antes de 2026-03-01.", "SELECT sum(ft.amount) AS revenue_total FROM challenge_data.financial_transactions ft WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' AND ft.type = 'revenue'", ["financial_transactions"], "Receita total usa apenas transacoes de receita dentro do periodo fechado.", ["Filtre `financial_transactions` por `transaction_date` em fevereiro de 2026.", "Some `amount` apenas quando `type = 'revenue'` e use o alias `revenue_total`."]),
  business("Lucro liquido no mes", "negocio-lucro-liquido-mes", "medium", "Pergunta de negocio: qual foi o lucro liquido da loja em fevereiro de 2026 considerando receitas positivas e `fee`, `shipping_cost` e `refund` como saidas? Retorne `net_profit`.", "SELECT sum(CASE WHEN ft.type = 'revenue' THEN ft.amount ELSE -ft.amount END) AS net_profit FROM challenge_data.financial_transactions ft WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01'", ["financial_transactions"], "O CASE transforma custos, taxas e estornos em valores negativos antes da soma.", ["Use `CASE` para manter `revenue` positivo e inverter os demais tipos.", "A coluna final deve se chamar `net_profit`."]),
  business("Pedidos validos por status", "negocio-pedidos-validos-por-status", "medium", "Pergunta de negocio: quantos pedidos validos houve por status em fevereiro de 2026? Considere status `paid`, `shipped` e `delivered`. Retorne `status` e `order_count`, ordenando por `order_count` decrescente e depois por `status` crescente.", "SELECT o.status, count(*) AS order_count FROM challenge_data.orders o WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY o.status ORDER BY order_count DESC, o.status", ["orders"], "Agrupar por status mostra o volume operacional dos pedidos validos.", ["Filtre o mes e mantenha apenas os tres status validos.", "Use `count(*) AS order_count` e ordene do maior volume para o menor."]),
  business("Ticket medio por status", "negocio-ticket-medio-por-status", "medium", "Pergunta de negocio: qual foi o ticket medio dos pedidos por status em fevereiro de 2026? Retorne `status`, `order_count` e `average_order_value`, ordenando por `average_order_value` decrescente.", "SELECT o.status, count(*) AS order_count, round(avg(o.total_amount), 2) AS average_order_value FROM challenge_data.orders o WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' GROUP BY o.status ORDER BY average_order_value DESC", ["orders"], "AVG resume o valor medio dos pedidos por grupo de status.", ["Agrupe por `status` depois de filtrar fevereiro.", "Use `round(avg(total_amount), 2)` como `average_order_value`."]),
  business("Categorias com maior receita", "negocio-categorias-maior-receita", "medium", "Pergunta de negocio: quais categorias mais venderam em fevereiro de 2026? Retorne `category_name` e `sales_total`, somando `order_items.line_total` de pedidos `paid`, `shipped` ou `delivered`, ordenando por `sales_total` decrescente.", "SELECT c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name ORDER BY sales_total DESC", ["categories", "products", "order_items", "orders"], "A receita por categoria vem dos itens vendidos conectados aos produtos e categorias.", ["Use JOIN de `categories` para `products`, `order_items` e `orders`.", "Agrupe por `c.name` e use os aliases `category_name` e `sales_total`."]),
  business("Lucro bruto por categoria", "negocio-lucro-bruto-por-categoria", "medium", "Pergunta de negocio: qual foi o lucro bruto estimado por categoria em fevereiro de 2026? Retorne `category_name` e `gross_profit`, usando `sum((price - cost) * quantity)` em pedidos validos, ordenando por `gross_profit` decrescente.", "SELECT c.name AS category_name, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name ORDER BY gross_profit DESC", ["categories", "products", "order_items", "orders"], "A margem bruta usa preco, custo e quantidade vendida por item.", ["Calcule `(p.price - p.cost) * oi.quantity` antes de somar.", "A ordenacao deve ser por `gross_profit` em ordem decrescente."]),
  business("Unidades vendidas por categoria", "negocio-unidades-vendidas-categoria", "medium", "Pergunta de negocio: quais categorias venderam mais unidades em fevereiro de 2026? Retorne `category_name` e `units_sold`, somando `order_items.quantity` em pedidos validos, ordenando por `units_sold` decrescente e `category_name` crescente.", "SELECT c.name AS category_name, sum(oi.quantity) AS units_sold FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name ORDER BY units_sold DESC, category_name", ["categories", "products", "order_items", "orders"], "Quantidade vendida mede giro, diferente de faturamento.", ["Some `oi.quantity`, nao `line_total`.", "Use desempate por `category_name` crescente."]),
  business("Clientes que mais compraram", "negocio-clientes-maior-gasto", "medium", "Pergunta de negocio: quais clientes mais compraram em fevereiro de 2026? Retorne `full_name` e `total_spent`, somando `orders.total_amount` de pedidos validos, ordenando por `total_spent` decrescente e limitando em 10.", "SELECT c.full_name, sum(o.total_amount) AS total_spent FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name ORDER BY total_spent DESC LIMIT 10", ["customers", "orders"], "O ranking de clientes soma pedidos validos por cliente.", ["Relacione `customers` com `orders` por `customer_id`.", "Use `LIMIT 10` depois de ordenar por `total_spent DESC`."]),
  business("Receita por estado", "negocio-receita-por-estado", "medium", "Pergunta de negocio: quais estados geraram mais receita em pedidos validos em fevereiro de 2026? Retorne `state` e `sales_total`, ordenando por `sales_total` decrescente.", "SELECT c.state, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.state ORDER BY sales_total DESC", ["customers", "orders"], "Cruzar clientes e pedidos permite analisar receita por estado.", ["O estado fica em `customers`, e o valor fica em `orders`.", "Agrupe por `c.state` e use `sales_total`."]),
  business("Receita por metodo de pagamento", "negocio-receita-por-metodo-pagamento", "medium", "Pergunta de negocio: quais metodos de pagamento concentraram mais valor pago em fevereiro de 2026? Retorne `payment_method`, `payment_count` e `paid_total`, considerando apenas pagamentos `paid`, ordenando por `paid_total` decrescente.", "SELECT p.payment_method, count(*) AS payment_count, sum(p.amount) AS paid_total FROM challenge_data.payments p WHERE p.paid_at >= TIMESTAMP '2026-02-01' AND p.paid_at < TIMESTAMP '2026-03-01' AND p.status = 'paid' GROUP BY p.payment_method ORDER BY paid_total DESC", ["payments"], "Pagamentos pagos por metodo mostram como a receita foi liquidada.", ["Filtre `paid_at` em fevereiro e `status = 'paid'`.", "Retorne tambem `payment_count` para volume por metodo."]),
  business("Pedidos com frete gratis", "negocio-pedidos-com-frete-gratis", "medium", "Pergunta de negocio: quantos pedidos tiveram frete gratis em fevereiro de 2026? Retorne `free_shipping_orders` contando pedidos com `shipping_amount = 0`.", "SELECT count(*) AS free_shipping_orders FROM challenge_data.orders o WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.shipping_amount = 0", ["orders"], "Pedidos com frete zero indicam uso de promocao ou condicao comercial.", ["A condicao de frete gratis e `shipping_amount = 0`.", "A coluna final deve se chamar `free_shipping_orders`."]),
  business("Descontos por dia", "negocio-descontos-por-dia", "medium", "Pergunta de negocio: quanto desconto foi concedido por dia em fevereiro de 2026? Retorne `order_day` e `discount_total`, considerando apenas pedidos com desconto maior que zero, ordenando por `order_day` crescente.", "SELECT o.order_date::date AS order_day, sum(o.discount_amount) AS discount_total FROM challenge_data.orders o WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.discount_amount > 0 GROUP BY order_day ORDER BY order_day", ["orders"], "Agrupar por dia mostra quando os descontos foram usados.", ["Converta `order_date` para data com `::date`.", "Some `discount_amount` como `discount_total`."]),
  business("Produtos com maior receita", "negocio-produtos-maior-receita", "medium", "Pergunta de negocio: quais produtos geraram mais receita em pedidos validos de fevereiro de 2026? Retorne `product_name` e `sales_total`, ordenando por `sales_total` decrescente e limitando em 10.", "SELECT p.name AS product_name, sum(oi.line_total) AS sales_total FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY p.id, p.name ORDER BY sales_total DESC LIMIT 10", ["products", "order_items", "orders"], "Produto com maior receita usa soma de line_total em pedidos validos.", ["Junte produtos aos itens e pedidos.", "Use `product_name`, `sales_total` e `LIMIT 10`."]),
  business("Produtos com maior lucro bruto", "negocio-produtos-maior-lucro-bruto", "medium", "Pergunta de negocio: quais produtos tiveram maior lucro bruto estimado em fevereiro de 2026? Retorne `product_name` e `gross_profit`, usando `(price - cost) * quantity` em pedidos validos, ordenando por `gross_profit` decrescente.", "SELECT p.name AS product_name, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY p.id, p.name ORDER BY gross_profit DESC", ["products", "order_items", "orders"], "Lucro bruto por produto combina margem unitaria e quantidade vendida.", ["Use `p.price - p.cost` como margem unitaria.", "Multiplique por `oi.quantity` antes de somar."]),
  business("Receita diaria", "negocio-receita-diaria", "medium", "Pergunta de negocio: qual foi a receita diaria de pedidos validos em fevereiro de 2026? Retorne `order_day` e `sales_total`, ordenando por `order_day` crescente.", "SELECT o.order_date::date AS order_day, sum(o.total_amount) AS sales_total FROM challenge_data.orders o WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY order_day ORDER BY order_day", ["orders"], "Receita diaria ajuda a acompanhar tendencia no periodo.", ["Transforme `order_date` em `order_day`.", "Some `total_amount` como `sales_total`."]),
  business("Transacoes por tipo", "negocio-transacoes-por-tipo", "medium", "Pergunta de negocio: qual foi o total financeiro por tipo de transacao em fevereiro de 2026? Retorne `type`, `transaction_count` e `total_amount`, ordenando por `total_amount` decrescente.", "SELECT ft.type, count(*) AS transaction_count, sum(ft.amount) AS total_amount FROM challenge_data.financial_transactions ft WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' GROUP BY ft.type ORDER BY total_amount DESC", ["financial_transactions"], "O agrupamento por tipo separa receitas, taxas, fretes e estornos.", ["Agrupe por `ft.type`.", "Retorne contagem e soma com aliases explicitos."]),
  business("Entregas por transportadora", "negocio-entregas-por-transportadora", "medium", "Pergunta de negocio: quantos pedidos entregues cada transportadora concluiu em fevereiro de 2026? Retorne `carrier` e `delivered_count`, considerando `shipments.status = 'delivered'`, ordenando por `delivered_count` decrescente.", "SELECT s.carrier, count(*) AS delivered_count FROM challenge_data.shipments s WHERE s.delivered_at >= TIMESTAMP '2026-02-01' AND s.delivered_at < TIMESTAMP '2026-03-01' AND s.status = 'delivered' GROUP BY s.carrier ORDER BY delivered_count DESC", ["shipments"], "Contar entregas concluidas por transportadora mede desempenho logistico basico.", ["Use `delivered_at` para filtrar o periodo.", "Agrupe por `carrier` e use `delivered_count`."]),
  business("Pedidos sem pagamento aprovado", "negocio-pedidos-sem-pagamento-aprovado", "medium", "Pergunta de negocio: quais pedidos de fevereiro de 2026 nao possuem pagamento `paid`? Retorne `order_number` e `status`, usando `LEFT JOIN` com pagamentos pagos, ordenando por `order_number` crescente.", "SELECT o.order_number, o.status FROM challenge_data.orders o LEFT JOIN challenge_data.payments p ON p.order_id = o.id AND p.status = 'paid' WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND p.id IS NULL ORDER BY o.order_number", ["orders", "payments"], "LEFT JOIN com IS NULL encontra pedidos sem pagamento aprovado.", ["Coloque `p.status = 'paid'` na condicao do JOIN.", "Depois filtre `p.id IS NULL`."]),
  business("Estoque por categoria", "negocio-estoque-por-categoria", "medium", "Pergunta de negocio: qual e o estoque atual por categoria? Retorne `category_name`, `product_count` e `total_stock`, ordenando por `total_stock` decrescente.", "SELECT c.name AS category_name, count(p.id) AS product_count, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.name ORDER BY total_stock DESC", ["categories", "products"], "Estoque por categoria cruza a dimensao categoria com produtos cadastrados.", ["Junte `categories` e `products` por `category_id`.", "Conte produtos e some `stock_quantity`."]),
  business("Produtos ativos sem estoque", "negocio-produtos-ativos-sem-estoque", "medium", "Pergunta de negocio: quais produtos ativos estao sem estoque? Retorne `category_name`, `product_name` e `stock_quantity`, filtrando `active = true` e `stock_quantity = 0`, ordenando por `category_name` e `product_name`.", "SELECT c.name AS category_name, p.name AS product_name, p.stock_quantity FROM challenge_data.products p JOIN challenge_data.categories c ON c.id = p.category_id WHERE p.active = true AND p.stock_quantity = 0 ORDER BY category_name, product_name", ["products", "categories"], "Produtos ativos sem estoque indicam ruptura operacional.", ["Filtre produto ativo e estoque zero.", "Retorne os aliases `category_name` e `product_name`."]),
  business("Participacao da receita por categoria", "negocio-participacao-receita-categoria", "hard", "Pergunta de negocio: qual a participacao percentual de cada categoria na receita valida de fevereiro de 2026? Retorne `category_name`, `sales_total` e `sales_share_pct`, ordenando por `sales_total` decrescente.", "SELECT c.name AS category_name, sum(oi.line_total) AS sales_total, round(100 * sum(oi.line_total) / sum(sum(oi.line_total)) OVER (), 2) AS sales_share_pct FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name ORDER BY sales_total DESC", ["categories", "products", "order_items", "orders"], "A janela sobre a soma agregada calcula participacao no total geral.", ["Calcule `sales_total` por categoria primeiro.", "Use `sum(sum(...)) OVER ()` para dividir pelo total geral."]),
  business("Lucro liquido por pedido", "negocio-lucro-liquido-por-pedido", "hard", "Pergunta de negocio: qual foi o lucro liquido financeiro por pedido em fevereiro de 2026? Retorne `order_number`, `full_name` e `net_amount`, somando receitas positivas e demais tipos negativos, ordenando por `net_amount` decrescente.", "SELECT o.order_number, c.full_name, sum(CASE WHEN ft.type = 'revenue' THEN ft.amount ELSE -ft.amount END) AS net_amount FROM challenge_data.orders o JOIN challenge_data.customers c ON c.id = o.customer_id JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' GROUP BY o.order_number, c.full_name ORDER BY net_amount DESC", ["orders", "customers", "financial_transactions"], "O lucro liquido por pedido vem das transacoes financeiras ligadas ao pedido.", ["Junte pedidos, clientes e transacoes financeiras.", "Use CASE para inverter taxas, fretes e estornos."]),
  business("Lucro bruto por cliente", "negocio-lucro-bruto-por-cliente", "hard", "Pergunta de negocio: quais clientes geraram maior lucro bruto em pedidos validos de fevereiro de 2026? Retorne `full_name`, `order_count` e `gross_profit`, ordenando por `gross_profit` decrescente e limitando em 10.", "SELECT c.full_name, count(DISTINCT o.id) AS order_count, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name ORDER BY gross_profit DESC LIMIT 10", ["customers", "orders", "order_items", "products"], "A margem bruta por cliente considera os itens comprados em pedidos validos.", ["Use `count(DISTINCT o.id)` para nao duplicar pedidos por item.", "Some a margem estimada dos itens e limite em 10."]),
  business("Giro e margem por produto", "negocio-giro-margem-produto", "hard", "Pergunta de negocio: quais produtos combinam maior giro e margem em fevereiro de 2026? Retorne `product_name`, `units_sold` e `gross_profit`, considerando pedidos validos, ordenando por `units_sold` decrescente e `gross_profit` decrescente.", "SELECT p.name AS product_name, sum(oi.quantity) AS units_sold, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY p.id, p.name ORDER BY units_sold DESC, gross_profit DESC", ["products", "order_items", "orders"], "Giro e margem juntos ajudam a priorizar produtos importantes.", ["Some `quantity` e a expressao de margem no mesmo agrupamento.", "Ordene primeiro por `units_sold DESC`."]),
  business("Estoque e vendas por categoria", "negocio-estoque-vendas-categoria", "hard", "Pergunta de negocio: compare estoque atual e vendas por categoria em fevereiro de 2026. Retorne `category_name`, `total_stock` e `sales_total`, usando CTEs `category_stock` e `category_sales`, ordenando por `sales_total` decrescente.", "WITH category_stock AS (SELECT c.id, c.name AS category_name, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.id, c.name), category_sales AS (SELECT c.id, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id) SELECT cs.category_name, cs.total_stock, coalesce(s.sales_total, 0) AS sales_total FROM category_stock cs LEFT JOIN category_sales s ON s.id = cs.id ORDER BY sales_total DESC", ["categories", "products", "order_items", "orders"], "Separar estoque e vendas em CTEs evita multiplicar estoque por item vendido.", ["Monte uma CTE para estoque e outra para vendas.", "No SELECT final use `coalesce` para categorias sem venda."]),
  business("Funil pagamento entrega", "negocio-funil-pagamento-entrega", "hard", "Pergunta de negocio: como os pedidos de fevereiro de 2026 se distribuem entre status do pedido, pagamento e entrega? Retorne `order_status`, `payment_status`, `shipment_status` e `order_count`, ordenando por `order_count` decrescente.", "SELECT o.status AS order_status, p.status AS payment_status, coalesce(s.status, 'sem_entrega') AS shipment_status, count(*) AS order_count FROM challenge_data.orders o LEFT JOIN challenge_data.payments p ON p.order_id = o.id LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' GROUP BY o.status, p.status, coalesce(s.status, 'sem_entrega') ORDER BY order_count DESC", ["orders", "payments", "shipments"], "O funil combina tres estados operacionais do pedido.", ["Use LEFT JOIN para manter pedidos sem entrega.", "Agrupe pelos tres status finais com aliases claros."]),
  business("Pedidos validos sem entrega", "negocio-pedidos-validos-sem-entrega", "hard", "Pergunta de negocio: quais pedidos validos de fevereiro de 2026 ainda nao possuem entrega registrada? Retorne `order_number`, `status` e `total_amount`, usando LEFT JOIN com `shipments`, ordenando por `total_amount` decrescente.", "SELECT o.order_number, o.status, o.total_amount FROM challenge_data.orders o LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') AND s.id IS NULL ORDER BY o.total_amount DESC", ["orders", "shipments"], "LEFT JOIN revela pedidos validos que ainda nao entraram no fluxo logistico.", ["Mantenha pedidos com status valido.", "Filtre `s.id IS NULL` depois do LEFT JOIN."]),
  business("Pagamentos pagos por dia e metodo", "negocio-pagamentos-dia-metodo", "hard", "Pergunta de negocio: qual valor pago por dia e metodo em fevereiro de 2026? Retorne `payment_day`, `payment_method`, `payment_count` e `paid_total`, considerando `payments.status = 'paid'`, ordenando por `payment_day` e `paid_total` decrescente.", "SELECT p.paid_at::date AS payment_day, p.payment_method, count(*) AS payment_count, sum(p.amount) AS paid_total FROM challenge_data.payments p WHERE p.paid_at >= TIMESTAMP '2026-02-01' AND p.paid_at < TIMESTAMP '2026-03-01' AND p.status = 'paid' GROUP BY payment_day, p.payment_method ORDER BY payment_day, paid_total DESC", ["payments"], "A visao por dia e metodo ajuda a conciliar recebimentos.", ["Use `paid_at::date` como `payment_day`.", "Agrupe por dia e metodo de pagamento."]),
  business("Estornos por cliente", "negocio-estornos-por-cliente", "hard", "Pergunta de negocio: quais clientes tiveram maior valor estornado em fevereiro de 2026? Retorne `full_name`, `refund_count` e `refund_total`, considerando transacoes `refund`, ordenando por `refund_total` decrescente.", "SELECT c.full_name, count(*) AS refund_count, sum(ft.amount) AS refund_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' AND ft.type = 'refund' GROUP BY c.id, c.full_name ORDER BY refund_total DESC", ["customers", "orders", "financial_transactions"], "Estornos por cliente cruzam transacoes financeiras com pedidos e clientes.", ["Filtre `ft.type = 'refund'`.", "Agrupe por cliente e ordene pelo maior `refund_total`."]),
  business("Ranking de estados por receita", "negocio-ranking-estados-receita", "hard", "Pergunta de negocio: gere o ranking dos estados por receita valida em fevereiro de 2026. Retorne `state_rank`, `state` e `sales_total`, usando `rank()` por `sales_total` decrescente.", "SELECT rank() OVER (ORDER BY sum(o.total_amount) DESC) AS state_rank, c.state, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.state ORDER BY state_rank, c.state", ["customers", "orders"], "A funcao de janela ranqueia os estados apos a agregacao.", ["Use `rank() OVER (ORDER BY sum(...) DESC)`.", "Ordene o resultado por `state_rank` e depois `state`."]),
  business("Compra media por cliente ativo", "negocio-compra-media-cliente-ativo", "hard", "Pergunta de negocio: qual o gasto medio por pedido dos clientes com pedidos validos em fevereiro de 2026? Retorne `full_name`, `order_count`, `total_spent` e `average_order_value`, ordenando por `average_order_value` decrescente.", "SELECT c.full_name, count(o.id) AS order_count, sum(o.total_amount) AS total_spent, round(avg(o.total_amount), 2) AS average_order_value FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name ORDER BY average_order_value DESC", ["customers", "orders"], "A media por pedido identifica clientes de ticket mais alto.", ["Filtre apenas pedidos validos do periodo.", "Retorne soma e media com aliases separados."]),
  business("Produtos acima da media da categoria", "negocio-produtos-acima-media-categoria", "hard", "Pergunta de negocio: quais produtos ativos tem preco acima da media da propria categoria? Use uma CTE `category_average`. Retorne `category_name`, `product_name`, `price` e `average_price`, ordenando por `category_name` e `price` decrescente.", "WITH category_average AS (SELECT category_id, round(avg(price), 2) AS average_price FROM challenge_data.products WHERE active = true GROUP BY category_id) SELECT c.name AS category_name, p.name AS product_name, p.price, ca.average_price FROM challenge_data.products p JOIN challenge_data.categories c ON c.id = p.category_id JOIN category_average ca ON ca.category_id = p.category_id WHERE p.active = true AND p.price > ca.average_price ORDER BY category_name, p.price DESC", ["products", "categories"], "Comparar produto com media da categoria exige uma etapa agregada antes do filtro.", ["Crie a CTE `category_average` por `category_id`.", "No SELECT final compare `p.price > ca.average_price`."]),
  business("Preco medio e margem media por categoria", "negocio-preco-margem-media-categoria", "hard", "Pergunta de negocio: qual o preco medio e a margem media dos produtos ativos por categoria? Retorne `category_name`, `active_products`, `average_price` e `average_margin`, ordenando por `average_margin` decrescente.", "SELECT c.name AS category_name, count(p.id) AS active_products, round(avg(p.price), 2) AS average_price, round(avg(p.price - p.cost), 2) AS average_margin FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id WHERE p.active = true GROUP BY c.name ORDER BY average_margin DESC", ["categories", "products"], "A margem media de cadastro usa preco menos custo em produtos ativos.", ["Filtre `p.active = true`.", "Calcule medias arredondadas e use aliases claros."]),
  business("Margem bruta por dia", "negocio-margem-bruta-por-dia", "hard", "Pergunta de negocio: qual foi a margem bruta estimada por dia em pedidos validos de fevereiro de 2026? Retorne `order_day`, `sales_total` e `gross_profit`, ordenando por `order_day` crescente.", "SELECT o.order_date::date AS order_day, sum(oi.line_total) AS sales_total, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.orders o JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY order_day ORDER BY order_day", ["orders", "order_items", "products"], "Margem diaria combina dados de pedido com os itens vendidos.", ["Agrupe por `o.order_date::date`.", "Retorne venda e margem no mesmo resultado."]),
  business("Clientes novos com pedido", "negocio-clientes-novos-com-pedido", "hard", "Pergunta de negocio: quais clientes cadastrados em janeiro de 2026 fizeram pedidos validos em fevereiro de 2026? Retorne `full_name`, `created_at`, `order_count` e `total_spent`, ordenando por `total_spent` decrescente.", "SELECT c.full_name, c.created_at, count(o.id) AS order_count, sum(o.total_amount) AS total_spent FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE c.created_at >= TIMESTAMP '2026-01-01' AND c.created_at < TIMESTAMP '2026-02-01' AND o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name, c.created_at ORDER BY total_spent DESC", ["customers", "orders"], "Cruzar data de cadastro com pedidos mede ativacao de clientes novos.", ["Filtre cadastro em janeiro e pedidos em fevereiro.", "Agrupe por cliente e mantenha `created_at` no SELECT."]),
  business("Tempo medio de entrega por transportadora", "negocio-tempo-medio-entrega-transportadora", "hard", "Pergunta de negocio: qual o tempo medio de entrega em dias por transportadora para entregas concluidas em fevereiro de 2026? Retorne `carrier`, `delivered_count` e `average_delivery_days`, ordenando por `average_delivery_days` crescente.", "SELECT s.carrier, count(*) AS delivered_count, round(avg(extract(epoch FROM (s.delivered_at - s.shipped_at)) / 86400), 2) AS average_delivery_days FROM challenge_data.shipments s WHERE s.delivered_at >= TIMESTAMP '2026-02-01' AND s.delivered_at < TIMESTAMP '2026-03-01' AND s.shipped_at IS NOT NULL AND s.delivered_at IS NOT NULL GROUP BY s.carrier ORDER BY average_delivery_days", ["shipments"], "A diferenca entre entrega e envio convertida em dias mede prazo medio.", ["Use `extract(epoch FROM delivered_at - shipped_at) / 86400`.", "Agrupe por `carrier` e ordene pelo menor prazo medio."]),
  business("Falhas de pagamento por status do pedido", "negocio-falhas-pagamento-status-pedido", "hard", "Pergunta de negocio: quais status de pedido concentram pagamentos falhos em fevereiro de 2026? Retorne `order_status`, `failed_payments` e `failed_amount`, considerando `payments.status = 'failed'`, ordenando por `failed_amount` decrescente.", "SELECT o.status AS order_status, count(p.id) AS failed_payments, sum(p.amount) AS failed_amount FROM challenge_data.orders o JOIN challenge_data.payments p ON p.order_id = o.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND p.status = 'failed' GROUP BY o.status ORDER BY failed_amount DESC", ["orders", "payments"], "Pagamentos falhos ligados ao status do pedido ajudam a identificar perdas.", ["Junte pagamentos e pedidos.", "Filtre `p.status = 'failed'` e agrupe por `o.status`."]),
  business("Clientes com pedidos pagos e cancelados", "negocio-clientes-pagos-cancelados", "hard", "Pergunta de negocio: quais clientes tiveram pedidos pagos ou entregues e tambem pedidos cancelados ou estornados em fevereiro de 2026? Retorne `full_name`, `valid_orders` e `problem_orders`, ordenando por `problem_orders` decrescente.", "SELECT c.full_name, count(*) FILTER (WHERE o.status IN ('paid', 'shipped', 'delivered')) AS valid_orders, count(*) FILTER (WHERE o.status IN ('cancelled', 'refunded')) AS problem_orders FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' GROUP BY c.id, c.full_name HAVING count(*) FILTER (WHERE o.status IN ('paid', 'shipped', 'delivered')) > 0 AND count(*) FILTER (WHERE o.status IN ('cancelled', 'refunded')) > 0 ORDER BY problem_orders DESC, c.full_name", ["customers", "orders"], "FILTER permite contar subconjuntos de status dentro do mesmo agrupamento.", ["Use `count(*) FILTER (WHERE ...)` para cada grupo de status.", "Aplique HAVING para exigir ambos os grupos."]),
  business("Categorias sem venda valida", "negocio-categorias-sem-venda-valida", "hard", "Pergunta de negocio: quais categorias nao tiveram venda em pedidos validos de fevereiro de 2026? Retorne `category_name` e `valid_sales_total`, usando LEFT JOIN, ordenando por `category_name`.", "SELECT c.name AS category_name, coalesce(sum(CASE WHEN o.id IS NOT NULL THEN oi.line_total ELSE 0 END), 0) AS valid_sales_total FROM challenge_data.categories c LEFT JOIN challenge_data.products p ON p.category_id = c.id LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id LEFT JOIN challenge_data.orders o ON o.id = oi.order_id AND o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name HAVING coalesce(sum(CASE WHEN o.id IS NOT NULL THEN oi.line_total ELSE 0 END), 0) = 0 ORDER BY category_name", ["categories", "products", "order_items", "orders"], "LEFT JOIN preserva categorias mesmo sem pedidos validos no periodo.", ["Coloque filtros de pedido valido na condicao do JOIN com `orders`.", "Use HAVING para manter apenas total valido zero."]),
  business("Lucro por status ativo do produto", "negocio-lucro-por-status-produto", "hard", "Pergunta de negocio: quanto lucro bruto veio de produtos ativos versus inativos em pedidos validos de fevereiro de 2026? Retorne `product_active`, `sales_total` e `gross_profit`, ordenando por `gross_profit` decrescente.", "SELECT p.active AS product_active, sum(oi.line_total) AS sales_total, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY p.active ORDER BY gross_profit DESC", ["products", "order_items", "orders"], "Agrupar por flag ativo mostra quanto a carteira vigente contribui.", ["Agrupe pela coluna booleana `p.active`.", "Retorne venda e lucro bruto com aliases."]),
  business("Ranking de pedidos por lucro bruto", "negocio-ranking-pedidos-lucro-bruto", "hard", "Pergunta de negocio: quais pedidos validos tiveram maior lucro bruto estimado em fevereiro de 2026? Retorne `profit_rank`, `order_number` e `gross_profit`, usando `rank()` e limitando em 10.", "SELECT rank() OVER (ORDER BY sum((p.price - p.cost) * oi.quantity) DESC) AS profit_rank, o.order_number, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.orders o JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY o.id, o.order_number ORDER BY profit_rank, o.order_number LIMIT 10", ["orders", "order_items", "products"], "Ranking por lucro bruto destaca pedidos de maior contribuicao.", ["Agregue lucro por pedido antes da janela.", "Use `rank()` e finalize com `LIMIT 10`."]),
  business("Receita por grupo de entrega", "negocio-receita-grupo-entrega", "hard", "Pergunta de negocio: quanto de receita valida de fevereiro de 2026 esta em pedidos com entrega e sem entrega? Retorne `delivery_group`, `order_count` e `sales_total`, usando LEFT JOIN com `shipments`, ordenando por `sales_total` decrescente.", "SELECT CASE WHEN s.id IS NULL THEN 'sem_entrega' ELSE 'com_entrega' END AS delivery_group, count(DISTINCT o.id) AS order_count, sum(o.total_amount) AS sales_total FROM challenge_data.orders o LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY delivery_group ORDER BY sales_total DESC", ["orders", "shipments"], "O CASE classifica pedidos conforme existencia de registro logistico.", ["Use LEFT JOIN para identificar falta de entrega.", "Conte pedidos distintos para evitar duplicacao."]),
  business("Estornos por dia", "negocio-estornos-por-dia", "hard", "Pergunta de negocio: qual foi o valor estornado por dia em fevereiro de 2026? Retorne `refund_day`, `refund_count` e `refund_total`, ordenando por `refund_day` crescente.", "SELECT ft.transaction_date AS refund_day, count(*) AS refund_count, sum(ft.amount) AS refund_total FROM challenge_data.financial_transactions ft WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' AND ft.type = 'refund' GROUP BY ft.transaction_date ORDER BY refund_day", ["financial_transactions"], "Agrupar estornos por dia mostra concentracao de reversoes.", ["Filtre apenas `type = 'refund'`.", "Use `transaction_date` como `refund_day`."]),
  business("Taxa de aprovacao por metodo", "negocio-taxa-aprovacao-metodo", "hard", "Pergunta de negocio: qual a taxa de aprovacao por metodo de pagamento para pedidos de fevereiro de 2026? Retorne `payment_method`, `total_payments`, `paid_payments` e `paid_rate_pct`, ordenando por `paid_rate_pct` decrescente.", "SELECT p.payment_method, count(*) AS total_payments, count(*) FILTER (WHERE p.status = 'paid') AS paid_payments, round(100.0 * count(*) FILTER (WHERE p.status = 'paid') / count(*), 2) AS paid_rate_pct FROM challenge_data.payments p JOIN challenge_data.orders o ON o.id = p.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' GROUP BY p.payment_method ORDER BY paid_rate_pct DESC, p.payment_method", ["payments", "orders"], "A taxa divide pagamentos pagos pelo total observado por metodo.", ["Use `FILTER` para contar apenas pagos.", "A coluna percentual deve se chamar `paid_rate_pct`."]),
  business("Vendas por categoria e estado", "negocio-vendas-categoria-estado", "hard", "Pergunta de negocio: quais categorias vendem mais por estado em pedidos validos de fevereiro de 2026? Retorne `state`, `category_name` e `sales_total`, ordenando por `state` crescente e `sales_total` decrescente.", "SELECT cu.state, c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.customers cu JOIN challenge_data.orders o ON o.customer_id = cu.id JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id JOIN challenge_data.categories c ON c.id = p.category_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY cu.state, c.name ORDER BY cu.state, sales_total DESC", ["customers", "orders", "order_items", "products", "categories"], "Esse relatorio cruza geografia do cliente com categoria do produto.", ["Siga a cadeia cliente -> pedido -> item -> produto -> categoria.", "Agrupe por estado e categoria."]),
  business("Frete cobrado por estado", "negocio-frete-cobrado-por-estado", "hard", "Pergunta de negocio: quanto frete foi cobrado por estado em pedidos validos de fevereiro de 2026? Retorne `state`, `order_count`, `shipping_total` e `sales_total`, ordenando por `shipping_total` decrescente.", "SELECT c.state, count(o.id) AS order_count, sum(o.shipping_amount) AS shipping_total, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.state ORDER BY shipping_total DESC", ["customers", "orders"], "Frete por estado ajuda a avaliar custo e politica comercial por regiao.", ["Some `shipping_amount` por estado.", "Mantenha apenas pedidos validos do periodo."]),
  business("Baixo estoque com alto giro", "negocio-baixo-estoque-alto-giro", "hard", "Pergunta de negocio: quais produtos venderam pelo menos 2 unidades em fevereiro de 2026 e tem estoque atual menor que 5? Retorne `product_name`, `stock_quantity` e `units_sold`, ordenando por `units_sold` decrescente.", "SELECT p.name AS product_name, p.stock_quantity, sum(oi.quantity) AS units_sold FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') AND p.stock_quantity < 5 GROUP BY p.id, p.name, p.stock_quantity HAVING sum(oi.quantity) >= 2 ORDER BY units_sold DESC", ["products", "order_items", "orders"], "Combinar giro e estoque identifica risco de ruptura.", ["Filtre estoque menor que 5 antes de agrupar.", "Use HAVING para exigir pelo menos 2 unidades vendidas."]),
  business("Pedidos com desconto e margem", "negocio-pedidos-desconto-margem", "hard", "Pergunta de negocio: quais pedidos com desconto tiveram maior margem bruta em fevereiro de 2026? Retorne `order_number`, `discount_amount` e `gross_profit`, considerando pedidos validos com `discount_amount > 0`, ordenando por `gross_profit` decrescente.", "SELECT o.order_number, o.discount_amount, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.orders o JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') AND o.discount_amount > 0 GROUP BY o.id, o.order_number, o.discount_amount ORDER BY gross_profit DESC", ["orders", "order_items", "products"], "Esse relatorio mostra se pedidos com desconto ainda preservam margem.", ["Filtre pedidos com desconto maior que zero.", "Calcule margem pelos itens do pedido."]),
  business("Receita por cidade", "negocio-receita-por-cidade", "hard", "Pergunta de negocio: quais cidades geraram mais receita valida em fevereiro de 2026? Retorne `city`, `state`, `order_count` e `sales_total`, considerando pedidos `paid`, `shipped` ou `delivered`, ordenando por `sales_total` decrescente.", "SELECT c.city, c.state, count(o.id) AS order_count, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.city, c.state ORDER BY sales_total DESC", ["customers", "orders"], "A receita por cidade combina localizacao do cliente com pedidos validos.", ["Use JOIN entre `customers` e `orders`.", "Agrupe por `city` e `state` e ordene por `sales_total DESC`."]),
  business("Top clientes por margem valida", "negocio-top-clientes-margem-valida", "hard", "Pergunta de negocio: quais sao os 5 clientes com maior margem bruta em pedidos validos de fevereiro de 2026? Retorne `full_name`, `sales_total` e `gross_profit`, ordenando por `gross_profit` decrescente e limitando em 5.", "SELECT c.full_name, sum(oi.line_total) AS sales_total, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.full_name ORDER BY gross_profit DESC LIMIT 5", ["customers", "orders", "order_items", "products"], "O ranking por margem prioriza clientes que mais contribuem para resultado.", ["Some venda e margem por cliente.", "Ordene por `gross_profit DESC` e use `LIMIT 5`."]),
];

const modulePracticeQuestions = [
  moduleQuestion(6, "Produtos com suas categorias ativas", "joins-basicos-produtos-categorias-ativas", "medium", "Liste produtos ativos com sua categoria. Retorne `product_name`, `category_name` e `price`, usando JOIN entre `products` e `categories`, ordenando por `category_name` e `product_name`.", "SELECT p.name AS product_name, c.name AS category_name, p.price FROM challenge_data.products p JOIN challenge_data.categories c ON c.id = p.category_id WHERE p.active = true ORDER BY category_name, product_name", ["products", "categories"], "JOIN basico conecta produtos a categorias pela chave estrangeira.", ["Use `p.category_id = c.id`.", "Retorne os aliases `product_name` e `category_name`."]),
  moduleQuestion(6, "Pedidos com cliente e estado", "joins-basicos-pedidos-cliente-estado", "medium", "Liste pedidos com cliente e estado. Retorne `order_number`, `full_name`, `state` e `total_amount`, usando JOIN entre `orders` e `customers`, ordenando por `order_number`.", "SELECT o.order_number, c.full_name, c.state, o.total_amount FROM challenge_data.orders o JOIN challenge_data.customers c ON c.id = o.customer_id ORDER BY o.order_number", ["orders", "customers"], "O pedido guarda o identificador do cliente.", ["Junte `orders.customer_id` com `customers.id`.", "A ordenacao final deve ser por `order_number`."]),
  moduleQuestion(6, "Pagamentos pagos com numero do pedido", "joins-basicos-pagamentos-pagos-pedido", "medium", "Liste pagamentos pagos com o numero do pedido. Retorne `order_number`, `payment_method` e `amount`, filtrando `payments.status = 'paid'`, ordenando por `amount` decrescente.", "SELECT o.order_number, p.payment_method, p.amount FROM challenge_data.payments p JOIN challenge_data.orders o ON o.id = p.order_id WHERE p.status = 'paid' ORDER BY p.amount DESC", ["payments", "orders"], "Pagamentos se ligam a pedidos por `order_id`.", ["Filtre o status na tabela `payments`.", "Ordene por `amount DESC`."]),
  moduleQuestion(6, "Entregas entregues com pedido", "joins-basicos-entregas-entregues-pedido", "medium", "Liste entregas concluidas com numero do pedido. Retorne `order_number`, `carrier` e `delivered_at`, filtrando `shipments.status = 'delivered'`, ordenando por `delivered_at`.", "SELECT o.order_number, s.carrier, s.delivered_at FROM challenge_data.shipments s JOIN challenge_data.orders o ON o.id = s.order_id WHERE s.status = 'delivered' ORDER BY s.delivered_at", ["shipments", "orders"], "A entrega possui `order_id` para encontrar o pedido.", ["Use JOIN entre `shipments` e `orders`.", "Filtre `s.status = 'delivered'`."]),
  moduleQuestion(6, "Itens com produto e categoria", "joins-basicos-itens-produto-categoria", "hard", "Liste itens de pedido com produto e categoria. Retorne `order_id`, `product_name`, `category_name`, `quantity` e `line_total`, usando JOINs entre `order_items`, `products` e `categories`, ordenando por `line_total` decrescente e limitando em 12.", "SELECT oi.order_id, p.name AS product_name, c.name AS category_name, oi.quantity, oi.line_total FROM challenge_data.order_items oi JOIN challenge_data.products p ON p.id = oi.product_id JOIN challenge_data.categories c ON c.id = p.category_id ORDER BY oi.line_total DESC LIMIT 12", ["order_items", "products", "categories"], "Dois JOINs enriquecem itens com produto e categoria.", ["Junte item -> produto -> categoria.", "Use `LIMIT 12` apos ordenar por maior `line_total`."]),
  moduleQuestion(6, "Pedidos pagos com cliente e pagamento", "joins-basicos-pedidos-pagos-cliente-pagamento", "hard", "Liste pedidos com cliente e pagamento aprovado. Retorne `full_name`, `order_number`, `payment_method` e `amount`, filtrando pagamentos `paid`, ordenando por `full_name` e `order_number`.", "SELECT c.full_name, o.order_number, p.payment_method, p.amount FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.payments p ON p.order_id = o.id WHERE p.status = 'paid' ORDER BY c.full_name, o.order_number", ["customers", "orders", "payments"], "JOIN em cadeia conecta cliente, pedido e pagamento.", ["Comece em `customers` ou `orders`, mas mantenha as duas chaves.", "Filtre `p.status = 'paid'`."]),
  moduleQuestion(6, "Produtos de categorias com estoque", "joins-basicos-produtos-categorias-estoque", "hard", "Liste produtos de categorias com estoque atual. Retorne `category_name`, `product_name`, `stock_quantity` e `price`, filtrando produtos com `stock_quantity > 0`, ordenando por `category_name` e `stock_quantity` decrescente.", "SELECT c.name AS category_name, p.name AS product_name, p.stock_quantity, p.price FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id WHERE p.stock_quantity > 0 ORDER BY category_name, p.stock_quantity DESC", ["categories", "products"], "O filtro de estoque fica em produtos, mas o nome da categoria vem do JOIN.", ["Use alias para os nomes retornados.", "Ordene por categoria e depois maior estoque."]),
  moduleQuestion(6, "Pedidos por cliente de Rondonia", "joins-basicos-pedidos-cliente-rondonia", "hard", "Liste pedidos de clientes de Rondonia. Retorne `full_name`, `order_number`, `status` e `total_amount`, usando JOIN entre `customers` e `orders`, filtrando `state = 'Rondonia'`, ordenando por `total_amount` decrescente.", "SELECT c.full_name, o.order_number, o.status, o.total_amount FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE c.state = 'Rondonia' ORDER BY o.total_amount DESC", ["customers", "orders"], "Filtros podem usar a tabela de dimensao enquanto valores vem da tabela de fatos.", ["Filtre `c.state`.", "Ordene por `o.total_amount DESC`."]),
  moduleQuestion(6, "Pagamentos com cliente", "joins-basicos-pagamentos-com-cliente", "hard", "Liste pagamentos com nome do cliente. Retorne `full_name`, `payment_method`, `status` e `amount`, usando JOINs entre `payments`, `orders` e `customers`, ordenando por `amount` decrescente e limitando em 10.", "SELECT c.full_name, p.payment_method, p.status, p.amount FROM challenge_data.payments p JOIN challenge_data.orders o ON o.id = p.order_id JOIN challenge_data.customers c ON c.id = o.customer_id ORDER BY p.amount DESC LIMIT 10", ["payments", "orders", "customers"], "Pagamento chega ao cliente passando pelo pedido.", ["Use dois JOINs em cadeia.", "Finalize com `LIMIT 10`."]),
  moduleQuestion(6, "Entregas com cliente e status do pedido", "joins-basicos-entregas-cliente-status-pedido", "hard", "Liste entregas com cliente e status do pedido. Retorne `full_name`, `order_number`, `order_status`, `shipment_status` e `carrier`, usando JOINs entre `shipments`, `orders` e `customers`, ordenando por `order_number`.", "SELECT c.full_name, o.order_number, o.status AS order_status, s.status AS shipment_status, s.carrier FROM challenge_data.shipments s JOIN challenge_data.orders o ON o.id = s.order_id JOIN challenge_data.customers c ON c.id = o.customer_id ORDER BY o.order_number", ["shipments", "orders", "customers"], "Aliases evitam ambiguidade quando duas tabelas tem coluna `status`.", ["Use `o.status AS order_status` e `s.status AS shipment_status`.", "Ordene pelo numero do pedido."]),
  moduleQuestion(7, "Clientes sem pedidos pagos", "joins-intermediarios-clientes-sem-pedidos-pagos", "medium", "Use LEFT JOIN para listar clientes que nao tem pedidos `paid`. Retorne `full_name` e `state`, ordenando por `full_name`.", "SELECT c.full_name, c.state FROM challenge_data.customers c LEFT JOIN challenge_data.orders o ON o.customer_id = c.id AND o.status = 'paid' WHERE o.id IS NULL ORDER BY c.full_name", ["customers", "orders"], "LEFT JOIN com filtro no JOIN encontra ausencias especificas.", ["Coloque `o.status = 'paid'` dentro do ON.", "Filtre `o.id IS NULL` no WHERE."]),
  moduleQuestion(7, "Produtos sem venda valida", "joins-intermediarios-produtos-sem-venda-valida", "medium", "Use LEFT JOIN para listar produtos que nao aparecem em pedidos `paid`, `shipped` ou `delivered`. Retorne `product_name` e `sku`, ordenando por `product_name`.", "SELECT p.name AS product_name, p.sku FROM challenge_data.products p LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id LEFT JOIN challenge_data.orders o ON o.id = oi.order_id AND o.status IN ('paid', 'shipped', 'delivered') WHERE o.id IS NULL ORDER BY product_name", ["products", "order_items", "orders"], "A ausencia de pedido valido aparece quando o pedido unido fica nulo.", ["Use LEFT JOIN ate `orders`.", "O filtro de status deve ficar no ON do JOIN com pedidos."]),
  moduleQuestion(7, "Total de pedidos por cliente", "joins-intermediarios-total-pedidos-cliente", "medium", "Liste todos os clientes com quantidade de pedidos. Retorne `full_name` e `order_count`, usando LEFT JOIN, ordenando por `order_count` decrescente e `full_name`.", "SELECT c.full_name, count(o.id) AS order_count FROM challenge_data.customers c LEFT JOIN challenge_data.orders o ON o.customer_id = c.id GROUP BY c.id, c.full_name ORDER BY order_count DESC, c.full_name", ["customers", "orders"], "COUNT da coluna da tabela ligada evita contar linha nula do LEFT JOIN.", ["Use `count(o.id) AS order_count`.", "Agrupe por `c.id` e `c.full_name`."]),
  moduleQuestion(7, "Vendas por categoria com zero", "joins-intermediarios-vendas-categoria-zero", "medium", "Liste todas as categorias com venda total em pedidos validos, incluindo categorias sem venda. Retorne `category_name` e `sales_total`, usando LEFT JOIN e `coalesce`, ordenando por `sales_total` decrescente.", "SELECT c.name AS category_name, coalesce(sum(CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN oi.line_total ELSE 0 END), 0) AS sales_total FROM challenge_data.categories c LEFT JOIN challenge_data.products p ON p.category_id = c.id LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id LEFT JOIN challenge_data.orders o ON o.id = oi.order_id GROUP BY c.name ORDER BY sales_total DESC", ["categories", "products", "order_items", "orders"], "CASE dentro da soma preserva categorias sem pedidos validos.", ["Use LEFT JOIN a partir de `categories`.", "Use `coalesce` para retornar zero quando nao houver vendas."]),
  moduleQuestion(7, "Margem por categoria em pedidos validos", "joins-intermediarios-margem-categoria-validos", "hard", "Calcule margem bruta por categoria em pedidos validos. Retorne `category_name`, `sales_total` e `gross_profit`, ordenando por `gross_profit` decrescente.", "SELECT c.name AS category_name, sum(oi.line_total) AS sales_total, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.name ORDER BY gross_profit DESC", ["categories", "products", "order_items", "orders"], "Agregacoes depois de multiplos JOINs criam metricas por dimensao.", ["Filtre status validos em `orders`.", "Retorne venda e margem com aliases obrigatorios."]),
  moduleQuestion(7, "Pedidos com pagamento sem entrega", "joins-intermediarios-pagamento-sem-entrega", "hard", "Liste pedidos com pagamento `paid` que nao possuem entrega. Retorne `order_number`, `payment_method` e `amount`, usando JOIN em `payments` e LEFT JOIN em `shipments`, ordenando por `amount` decrescente.", "SELECT o.order_number, p.payment_method, p.amount FROM challenge_data.orders o JOIN challenge_data.payments p ON p.order_id = o.id LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE p.status = 'paid' AND s.id IS NULL ORDER BY p.amount DESC", ["orders", "payments", "shipments"], "Combinar JOIN e LEFT JOIN permite achar lacunas apos pagamento.", ["Pagamentos pagos entram com JOIN comum.", "Entregas ausentes usam LEFT JOIN e `s.id IS NULL`."]),
  moduleQuestion(7, "Receita por estado e status", "joins-intermediarios-receita-estado-status", "hard", "Some receita por estado e status do pedido. Retorne `state`, `status` e `sales_total`, considerando pedidos de fevereiro de 2026, ordenando por `state` e `sales_total` decrescente.", "SELECT c.state, o.status, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' GROUP BY c.state, o.status ORDER BY c.state, sales_total DESC", ["customers", "orders"], "Agrupar por duas dimensoes revela composicao do resultado.", ["Agrupe por `c.state` e `o.status`.", "Ordene por estado e maior total dentro do estado."]),
  moduleQuestion(7, "Produtos vendidos por cliente", "joins-intermediarios-produtos-vendidos-cliente", "hard", "Liste cliente e produto com unidades compradas em pedidos validos. Retorne `full_name`, `product_name` e `units_sold`, ordenando por `full_name` e `units_sold` decrescente.", "SELECT c.full_name, p.name AS product_name, sum(oi.quantity) AS units_sold FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.full_name, p.name ORDER BY c.full_name, units_sold DESC", ["customers", "orders", "order_items", "products"], "Esse relatorio percorre cliente, pedido, item e produto.", ["Use quatro tabelas ligadas em cadeia.", "Some `oi.quantity` por cliente e produto."]),
  moduleQuestion(7, "Transportadora por status do pedido", "joins-intermediarios-transportadora-status-pedido", "hard", "Conte pedidos por transportadora e status do pedido. Retorne `carrier`, `order_status` e `order_count`, usando JOIN entre `shipments` e `orders`, ordenando por `carrier` e `order_count` decrescente.", "SELECT s.carrier, o.status AS order_status, count(*) AS order_count FROM challenge_data.shipments s JOIN challenge_data.orders o ON o.id = s.order_id GROUP BY s.carrier, o.status ORDER BY s.carrier, order_count DESC", ["shipments", "orders"], "Agrupar status por transportadora mostra composicao logistica.", ["Alias `o.status` como `order_status`.", "Agrupe tambem por `s.carrier`."]),
  moduleQuestion(7, "Financeiro por cliente", "joins-intermediarios-financeiro-por-cliente", "hard", "Calcule financeiro liquido por cliente em fevereiro de 2026. Retorne `full_name` e `net_amount`, somando `revenue` positivo e demais tipos negativos, ordenando por `net_amount` decrescente.", "SELECT c.full_name, sum(CASE WHEN ft.type = 'revenue' THEN ft.amount ELSE -ft.amount END) AS net_amount FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id WHERE ft.transaction_date >= DATE '2026-02-01' AND ft.transaction_date < DATE '2026-03-01' GROUP BY c.id, c.full_name ORDER BY net_amount DESC", ["customers", "orders", "financial_transactions"], "Financeiro por cliente exige atravessar pedidos ate transacoes.", ["Use CASE para sinal dos tipos financeiros.", "Agrupe por cliente e ordene por `net_amount DESC`."]),
  moduleQuestion(8, "CTE pedidos validos", "ctes-pedidos-validos-total", "medium", "Crie a CTE `valid_orders` com pedidos `paid`, `shipped` ou `delivered` de fevereiro de 2026. Retorne `order_count` e `sales_total` a partir dela.", "WITH valid_orders AS (SELECT id, total_amount FROM challenge_data.orders WHERE order_date >= TIMESTAMP '2026-02-01' AND order_date < TIMESTAMP '2026-03-01' AND status IN ('paid', 'shipped', 'delivered')) SELECT count(id) AS order_count, sum(total_amount) AS sales_total FROM valid_orders", ["orders"], "A CTE isola o filtro de pedidos validos antes da agregacao.", ["A CTE deve se chamar `valid_orders`.", "No SELECT final conte e some a partir dela."]),
  moduleQuestion(8, "CTE produtos ativos caros", "ctes-produtos-ativos-caros", "medium", "Crie a CTE `active_products` com produtos ativos. Retorne `name` e `price` dos produtos com `price >= 500`, ordenando por `price` decrescente.", "WITH active_products AS (SELECT name, price FROM challenge_data.products WHERE active = true) SELECT name, price FROM active_products WHERE price >= 500 ORDER BY price DESC", ["products"], "A CTE separa o filtro de ativo do filtro de preco.", ["Selecione apenas `name` e `price` na CTE.", "Filtre preco no SELECT externo."]),
  moduleQuestion(8, "CTE receita por dia", "ctes-receita-por-dia", "medium", "Crie a CTE `daily_sales` com vendas por dia em pedidos validos de fevereiro de 2026. Retorne `order_day` e `sales_total`, ordenando por `order_day`.", "WITH daily_sales AS (SELECT order_date::date AS order_day, sum(total_amount) AS sales_total FROM challenge_data.orders WHERE order_date >= TIMESTAMP '2026-02-01' AND order_date < TIMESTAMP '2026-03-01' AND status IN ('paid', 'shipped', 'delivered') GROUP BY order_day) SELECT order_day, sales_total FROM daily_sales ORDER BY order_day", ["orders"], "CTE agregada pode ser consultada como uma tabela temporaria da query.", ["Agrupe dentro da CTE.", "Ordene no SELECT final por `order_day`."]),
  moduleQuestion(8, "CTE estoque baixo", "ctes-estoque-baixo", "medium", "Crie a CTE `low_stock` com produtos ativos e estoque menor que 5. Retorne `name`, `sku` e `stock_quantity`, ordenando por `stock_quantity` e `name`.", "WITH low_stock AS (SELECT name, sku, stock_quantity FROM challenge_data.products WHERE active = true AND stock_quantity < 5) SELECT name, sku, stock_quantity FROM low_stock ORDER BY stock_quantity, name", ["products"], "A CTE nomeia o conjunto de produtos com risco de estoque.", ["Filtre ativo e baixo estoque na CTE.", "O SELECT final so ordena e retorna as colunas pedidas."]),
  moduleQuestion(8, "CTE ranking clientes", "ctes-ranking-clientes", "hard", "Use CTE `customer_sales` para somar pedidos validos por cliente em fevereiro de 2026. Retorne `full_name`, `total_spent` e `customer_rank` com `rank()` por `total_spent` decrescente, ordenando por `customer_rank`.", "WITH customer_sales AS (SELECT c.full_name, sum(o.total_amount) AS total_spent FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.full_name) SELECT full_name, total_spent, rank() OVER (ORDER BY total_spent DESC) AS customer_rank FROM customer_sales ORDER BY customer_rank, full_name", ["customers", "orders"], "A CTE calcula o total antes da funcao de janela.", ["Agrupe vendas na CTE `customer_sales`.", "Aplique `rank()` no SELECT externo."]),
  moduleQuestion(8, "CTEs vendas e estoque categoria", "ctes-vendas-estoque-categoria", "hard", "Crie CTEs `category_sales` e `category_stock`. Retorne `category_name`, `sales_total` e `total_stock`, juntando as CTEs e ordenando por `sales_total` decrescente.", "WITH category_sales AS (SELECT c.id, c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.id, c.name), category_stock AS (SELECT c.id, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.id) SELECT cs.category_name, cs.sales_total, st.total_stock FROM category_sales cs JOIN category_stock st ON st.id = cs.id ORDER BY cs.sales_total DESC", ["categories", "products", "order_items", "orders"], "Duas CTEs evitam misturar granularidades de venda e estoque.", ["Calcule vendas e estoque separadamente.", "Junte as CTEs pelo id da categoria."]),
  moduleQuestion(8, "CTE margem produtos", "ctes-margem-produtos", "hard", "Crie a CTE `product_margin` com `product_name`, `category_name` e `margin`. Retorne produtos com margem maior que 200, ordenando por `margin` decrescente.", "WITH product_margin AS (SELECT p.name AS product_name, c.name AS category_name, p.price - p.cost AS margin FROM challenge_data.products p JOIN challenge_data.categories c ON c.id = p.category_id WHERE p.active = true) SELECT product_name, category_name, margin FROM product_margin WHERE margin > 200 ORDER BY margin DESC", ["products", "categories"], "A CTE facilita filtrar uma expressao calculada com alias.", ["Calcule `price - cost AS margin` na CTE.", "Filtre `margin > 200` fora da CTE."]),
  moduleQuestion(8, "CTE pagamentos por metodo", "ctes-pagamentos-por-metodo", "hard", "Crie a CTE `method_totals` com total pago por metodo em fevereiro de 2026. Retorne `payment_method`, `payment_count` e `paid_total` apenas para metodos com `paid_total >= 1000`, ordenando por `paid_total` decrescente.", "WITH method_totals AS (SELECT payment_method, count(*) AS payment_count, sum(amount) AS paid_total FROM challenge_data.payments WHERE paid_at >= TIMESTAMP '2026-02-01' AND paid_at < TIMESTAMP '2026-03-01' AND status = 'paid' GROUP BY payment_method) SELECT payment_method, payment_count, paid_total FROM method_totals WHERE paid_total >= 1000 ORDER BY paid_total DESC", ["payments"], "A CTE permite filtrar uma agregacao pelo alias.", ["Agregue por metodo dentro da CTE.", "Filtre `paid_total` no SELECT externo."]),
  moduleQuestion(8, "CTE pedidos com lucro", "ctes-pedidos-com-lucro", "hard", "Crie a CTE `order_profit` com lucro bruto por pedido valido. Retorne `order_number` e `gross_profit` para pedidos com `gross_profit > 500`, ordenando por `gross_profit` decrescente.", "WITH order_profit AS (SELECT o.order_number, sum((p.price - p.cost) * oi.quantity) AS gross_profit FROM challenge_data.orders o JOIN challenge_data.order_items oi ON oi.order_id = o.id JOIN challenge_data.products p ON p.id = oi.product_id WHERE o.status IN ('paid', 'shipped', 'delivered') GROUP BY o.order_number) SELECT order_number, gross_profit FROM order_profit WHERE gross_profit > 500 ORDER BY gross_profit DESC", ["orders", "order_items", "products"], "A CTE transforma margem por pedido em uma tabela filtravel.", ["Calcule margem por pedido dentro da CTE.", "Aplique `WHERE gross_profit > 500` fora dela."]),
  moduleQuestion(8, "CTE clientes por estado", "ctes-clientes-por-estado-receita", "hard", "Use CTE `state_sales` para somar receita valida por estado em fevereiro de 2026. Retorne `state`, `customer_count` e `sales_total`, ordenando por `sales_total` decrescente.", "WITH state_sales AS (SELECT c.state, count(DISTINCT c.id) AS customer_count, sum(o.total_amount) AS sales_total FROM challenge_data.customers c JOIN challenge_data.orders o ON o.customer_id = c.id WHERE o.order_date >= TIMESTAMP '2026-02-01' AND o.order_date < TIMESTAMP '2026-03-01' AND o.status IN ('paid', 'shipped', 'delivered') GROUP BY c.state) SELECT state, customer_count, sales_total FROM state_sales ORDER BY sales_total DESC", ["customers", "orders"], "COUNT DISTINCT evita duplicar clientes com varios pedidos.", ["Use `count(DISTINCT c.id)`.", "A CTE deve se chamar `state_sales`."]),
  moduleQuestion(9, "UNION clientes SP RJ", "union-clientes-sp-rj", "medium", "Use UNION para combinar clientes de SP e RJ. Retorne `full_name`, `state` e `region_group`, usando `region_group = 'sudeste'`, ordenando por `state` e `full_name`.", "SELECT full_name, state, 'sudeste' AS region_group FROM challenge_data.customers WHERE state = 'SP' UNION SELECT full_name, state, 'sudeste' AS region_group FROM challenge_data.customers WHERE state = 'RJ' ORDER BY state, full_name", ["customers"], "UNION combina consultas com as mesmas colunas.", ["As duas consultas devem retornar tres colunas na mesma ordem.", "Use o alias `region_group`."]),
  moduleQuestion(9, "UNION ALL produtos ativos e inativos", "union-produtos-ativos-inativos", "medium", "Use UNION ALL para listar produtos ativos e inativos com um rotulo. Retorne `product_name` e `product_status`, ordenando por `product_status` e `product_name`.", "SELECT name AS product_name, 'ativo' AS product_status FROM challenge_data.products WHERE active = true UNION ALL SELECT name AS product_name, 'inativo' AS product_status FROM challenge_data.products WHERE active = false ORDER BY product_status, product_name", ["products"], "UNION ALL preserva todos os resultados das duas consultas.", ["Use os mesmos aliases nos dois SELECTs.", "Ordene pelo rotulo e pelo nome."]),
  moduleQuestion(9, "UNION pedidos pagos e entregues", "union-pedidos-pagos-entregues", "medium", "Use UNION para combinar pedidos `paid` e `delivered`. Retorne `order_number`, `status` e `total_amount`, ordenando por `status` e `order_number`.", "SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'paid' UNION SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'delivered' ORDER BY status, order_number", ["orders"], "UNION remove duplicatas e exige colunas compativeis.", ["Os dois SELECTs devem retornar as mesmas colunas.", "A ordenacao final vem depois do UNION."]),
  moduleQuestion(9, "UNION eventos de pedido e pagamento", "union-eventos-pedido-pagamento", "medium", "Use UNION ALL para montar uma linha do tempo com pedidos e pagamentos antes de 2026-02-05. Retorne `reference`, `event_type` e `event_at`, ordenando por `event_at` e `event_type`.", "SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at FROM challenge_data.orders WHERE order_date < TIMESTAMP '2026-02-05' UNION ALL SELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at FROM challenge_data.payments WHERE paid_at < TIMESTAMP '2026-02-05' AND paid_at IS NOT NULL ORDER BY event_at, event_type", ["orders", "payments"], "UNION ALL permite mesclar eventos de tabelas diferentes em um formato comum.", ["Padronize os nomes de saida nas duas consultas.", "Filtre datas antes da combinacao."]),
  moduleQuestion(9, "UNION categorias e produtos caros", "union-categorias-produtos-caros", "hard", "Use UNION ALL para combinar categorias e produtos com preco maior ou igual a 1000. Retorne `name` e `source`, onde categorias usam `source = 'category'` e produtos usam `source = 'product'`, ordenando por `source` e `name`.", "SELECT name, 'category' AS source FROM challenge_data.categories UNION ALL SELECT name, 'product' AS source FROM challenge_data.products WHERE price >= 1000 ORDER BY source, name", ["categories", "products"], "As duas consultas precisam produzir colunas com tipos compativeis.", ["Use texto fixo para identificar a origem.", "A segunda consulta filtra produtos caros."]),
  moduleQuestion(9, "UNION receitas e estornos", "union-receitas-estornos", "hard", "Use UNION ALL para combinar transacoes `revenue` e `refund` de fevereiro de 2026. Retorne `order_id`, `type` e `amount`, ordenando por `type` e `amount` decrescente.", "SELECT order_id, type, amount FROM challenge_data.financial_transactions WHERE transaction_date >= DATE '2026-02-01' AND transaction_date < DATE '2026-03-01' AND type = 'revenue' UNION ALL SELECT order_id, type, amount FROM challenge_data.financial_transactions WHERE transaction_date >= DATE '2026-02-01' AND transaction_date < DATE '2026-03-01' AND type = 'refund' ORDER BY type, amount DESC", ["financial_transactions"], "UNION ALL mantem todas as transacoes financeiras selecionadas.", ["Repita o filtro de periodo nos dois SELECTs.", "Ordene depois da segunda consulta."]),
  moduleQuestion(9, "UNION buscas por nome", "union-buscas-por-nome", "hard", "Use UNION ALL para combinar clientes com nome contendo `Silva` e produtos com nome contendo `SQL`. Retorne `result_name` e `result_type`, ordenando por `result_type` e `result_name`.", "SELECT full_name AS result_name, 'customer' AS result_type FROM challenge_data.customers WHERE full_name LIKE '%Silva%' UNION ALL SELECT name AS result_name, 'product' AS result_type FROM challenge_data.products WHERE name LIKE '%SQL%' ORDER BY result_type, result_name", ["customers", "products"], "UNION pode servir como busca simples em entidades diferentes.", ["Padronize a coluna de nome como `result_name`.", "Use `LIKE` em cada tabela."]),
  moduleQuestion(9, "UNION regioes de clientes", "union-regioes-clientes", "hard", "Use UNION ALL para classificar clientes de Rondonia e AM como `norte`, e clientes de SP, RJ e MG como `sudeste`. Retorne `full_name`, `state` e `region`, ordenando por `region` e `full_name`.", "SELECT full_name, state, 'norte' AS region FROM challenge_data.customers WHERE state IN ('Rondonia', 'AM') UNION ALL SELECT full_name, state, 'sudeste' AS region FROM challenge_data.customers WHERE state IN ('SP', 'RJ', 'MG') ORDER BY region, full_name", ["customers"], "Duas consultas com filtros diferentes podem virar um resultado classificado.", ["Use `IN` para cada grupo regional.", "Mantenha as mesmas colunas e aliases."]),
  moduleQuestion(9, "UNION contagens operacionais", "union-contagens-operacionais", "hard", "Use UNION ALL para combinar contagem por metodo de pagamento e contagem por status de pedido. Retorne `label`, `source` e `total`, ordenando por `source` e `label`.", "SELECT payment_method AS label, 'payment_method' AS source, count(*) AS total FROM challenge_data.payments GROUP BY payment_method UNION ALL SELECT status AS label, 'order_status' AS source, count(*) AS total FROM challenge_data.orders GROUP BY status ORDER BY source, label", ["payments", "orders"], "Agregacoes separadas podem ser empilhadas se os formatos coincidirem.", ["As duas partes precisam retornar `label`, `source` e `total`.", "Use GROUP BY em cada SELECT."]),
  moduleQuestion(9, "UNION CTE pedidos selecionados", "union-cte-pedidos-selecionados", "hard", "Crie a CTE `selected_orders` usando UNION ALL para combinar pedidos com `total_amount >= 2000` e pedidos `pending`. Retorne `order_number`, `status` e `total_amount`, ordenando por `total_amount` decrescente.", "WITH selected_orders AS (SELECT order_number, status, total_amount FROM challenge_data.orders WHERE total_amount >= 2000 UNION ALL SELECT order_number, status, total_amount FROM challenge_data.orders WHERE status = 'pending') SELECT order_number, status, total_amount FROM selected_orders ORDER BY total_amount DESC", ["orders"], "UNION dentro de CTE permite tratar a combinacao antes da ordenacao final.", ["A CTE deve se chamar `selected_orders`.", "O SELECT final ordena a CTE por valor decrescente."]),
  moduleQuestion(10, "Revisao clientes com gasto valido", "revisao-clientes-gasto-valido", "medium", "Com uma CTE `valid_orders`, retorne os 5 clientes com maior gasto em pedidos validos. Retorne `full_name` e `total_spent`, ordenando por `total_spent` decrescente e limitando em 5.", "WITH valid_orders AS (SELECT customer_id, total_amount FROM challenge_data.orders WHERE status IN ('paid', 'shipped', 'delivered')) SELECT c.full_name, sum(v.total_amount) AS total_spent FROM valid_orders v JOIN challenge_data.customers c ON c.id = v.customer_id GROUP BY c.full_name ORDER BY total_spent DESC LIMIT 5", ["orders", "customers"], "A CTE separa o filtro de pedidos antes do ranking por cliente.", ["Crie `valid_orders` com customer_id e total.", "Junte com clientes e limite em 5."]),
  moduleQuestion(10, "Revisao produtos acima da media", "revisao-produtos-acima-media", "medium", "Use CTE `category_avg` para calcular preco medio por categoria. Retorne `product_name`, `price` e `average_price` dos produtos com preco acima da media da categoria, ordenando por `price` decrescente.", "WITH category_avg AS (SELECT category_id, round(avg(price), 2) AS average_price FROM challenge_data.products GROUP BY category_id) SELECT p.name AS product_name, p.price, ca.average_price FROM challenge_data.products p JOIN category_avg ca ON ca.category_id = p.category_id WHERE p.price > ca.average_price ORDER BY p.price DESC", ["products"], "A media por categoria vira referencia para comparar cada produto.", ["A CTE deve agrupar por `category_id`.", "Compare `p.price` com `ca.average_price`."]),
  moduleQuestion(10, "Revisao clientes sem entregas", "revisao-clientes-sem-entregas", "medium", "Liste clientes que nao tem pedidos entregues (`orders.status = 'delivered'`). Retorne `full_name` e `state`, usando LEFT JOIN, ordenando por `full_name`.", "SELECT c.full_name, c.state FROM challenge_data.customers c LEFT JOIN challenge_data.orders o ON o.customer_id = c.id AND o.status = 'delivered' WHERE o.id IS NULL ORDER BY c.full_name", ["customers", "orders"], "LEFT JOIN com filtro no ON encontra clientes sem relacionamento do tipo desejado.", ["O status delivered deve ficar no JOIN.", "Use `o.id IS NULL`."]),
  moduleQuestion(10, "Revisao pedidos pagos sem envio", "revisao-pedidos-pagos-sem-envio", "medium", "Liste pedidos `paid` que nao possuem registro em `shipments`. Retorne `order_number`, `total_amount` e `status`, usando LEFT JOIN, ordenando por `total_amount` decrescente.", "SELECT o.order_number, o.total_amount, o.status FROM challenge_data.orders o LEFT JOIN challenge_data.shipments s ON s.order_id = o.id WHERE o.status = 'paid' AND s.id IS NULL ORDER BY o.total_amount DESC", ["orders", "shipments"], "Esse padrao combina filtro de status e ausencia de entrega.", ["Use LEFT JOIN com shipments.", "Filtre pedidos pagos e `s.id IS NULL`."]),
  moduleQuestion(10, "Revisao categoria estoque vendas", "revisao-categoria-estoque-vendas", "hard", "Com CTEs `category_stock` e `category_sales`, retorne `category_name`, `total_stock` e `sales_total` para todas as categorias. Ordene por `sales_total` decrescente.", "WITH category_stock AS (SELECT c.id, c.name AS category_name, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.id, c.name), category_sales AS (SELECT c.id, coalesce(sum(oi.line_total), 0) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id LEFT JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.id) SELECT cs.category_name, cs.total_stock, s.sales_total FROM category_stock cs JOIN category_sales s ON s.id = cs.id ORDER BY s.sales_total DESC", ["categories", "products", "order_items"], "Separar CTEs impede que estoque seja multiplicado por itens vendidos.", ["Calcule estoque e venda em CTEs independentes.", "Junte pelo id da categoria."]),
  moduleQuestion(10, "Revisao descontos e frete gratis", "revisao-descontos-frete-gratis", "hard", "Use UNION para listar pedidos com desconto e pedidos com frete gratis. Retorne `order_number`, `reason` e `amount`, ordenando por `reason` e `order_number`.", "SELECT order_number, 'discount' AS reason, discount_amount AS amount FROM challenge_data.orders WHERE discount_amount > 0 UNION SELECT order_number, 'free_shipping' AS reason, shipping_amount AS amount FROM challenge_data.orders WHERE shipping_amount = 0 ORDER BY reason, order_number", ["orders"], "UNION combina dois criterios comerciais em uma lista unica.", ["As duas consultas devem retornar as mesmas tres colunas.", "Use os textos `discount` e `free_shipping` como reason."]),
  moduleQuestion(10, "Revisao linha do tempo recente", "revisao-linha-tempo-recente", "hard", "Com CTE `events`, combine pedidos e pagamentos usando UNION ALL. Retorne `reference`, `event_type` e `event_at` para eventos a partir de 2026-02-18, ordenando por `event_at` e `event_type`.", "WITH events AS (SELECT order_number AS reference, 'order' AS event_type, order_date AS event_at FROM challenge_data.orders UNION ALL SELECT payment_method AS reference, 'payment' AS event_type, paid_at AS event_at FROM challenge_data.payments WHERE paid_at IS NOT NULL) SELECT reference, event_type, event_at FROM events WHERE event_at >= TIMESTAMP '2026-02-18' ORDER BY event_at, event_type", ["orders", "payments"], "A CTE cria uma linha do tempo combinada antes do filtro final.", ["Padronize `reference`, `event_type` e `event_at`.", "Filtre a data no SELECT externo."]),
  moduleQuestion(10, "Revisao unidades validas por produto", "revisao-unidades-validas-produto", "hard", "Some unidades vendidas por produto em pedidos que nao estejam `cancelled`. Retorne `product_name` e `units_sold`, ordenando por `units_sold` decrescente e `product_name`.", "SELECT p.name AS product_name, sum(oi.quantity) AS units_sold FROM challenge_data.products p JOIN challenge_data.order_items oi ON oi.product_id = p.id JOIN challenge_data.orders o ON o.id = oi.order_id WHERE o.status <> 'cancelled' GROUP BY p.name ORDER BY units_sold DESC, product_name", ["products", "order_items", "orders"], "A revisao combina JOIN, filtro, agregacao e ordenacao.", ["Filtre o status do pedido.", "Agrupe por nome do produto."]),
  moduleQuestion(10, "Revisao financeiro liquido pedido", "revisao-financeiro-liquido-pedido", "hard", "Calcule o valor liquido por pedido usando transacoes financeiras. Retorne `order_number` e `net_amount`, tratando `refund`, `fee` e `shipping_cost` como negativos, ordenando por `net_amount` decrescente.", "SELECT o.order_number, sum(CASE WHEN ft.type IN ('refund', 'fee', 'shipping_cost') THEN -ft.amount ELSE ft.amount END) AS net_amount FROM challenge_data.orders o JOIN challenge_data.financial_transactions ft ON ft.order_id = o.id GROUP BY o.order_number ORDER BY net_amount DESC", ["orders", "financial_transactions"], "CASE aplica sinal de negocio antes de somar por pedido.", ["Junte pedidos e transacoes financeiras.", "Use CASE para inverter tipos de saida."]),
  moduleQuestion(10, "Revisao final categorias", "revisao-final-categorias-inativo", "hard", "Com CTEs `category_sales` e `category_stock`, retorne `category_name`, `sales_total` e `total_stock` para categorias com `sales_total > 500`. Ordene por `sales_total` decrescente.", "WITH category_sales AS (SELECT c.name AS category_name, sum(oi.line_total) AS sales_total FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id JOIN challenge_data.order_items oi ON oi.product_id = p.id GROUP BY c.name), category_stock AS (SELECT c.name AS category_name, sum(p.stock_quantity) AS total_stock FROM challenge_data.categories c JOIN challenge_data.products p ON p.category_id = c.id GROUP BY c.name) SELECT s.category_name, s.sales_total, st.total_stock FROM category_sales s JOIN category_stock st ON st.category_name = s.category_name WHERE s.sales_total > 500 ORDER BY s.sales_total DESC", ["categories", "products", "order_items"], "Esse desafio revisa CTEs, JOIN entre CTEs, filtro e ordenacao.", ["Monte as duas CTEs com o mesmo `category_name`.", "Filtre `sales_total > 500` no SELECT final."]),
];

if (businessQuestions.length !== 50) {
  throw new Error(`Expected 50 business questions, got ${businessQuestions.length}`);
}

if (modulePracticeQuestions.length !== 50) {
  throw new Error(`Expected 50 module practice questions, got ${modulePracticeQuestions.length}`);
}

addInactiveQuestions([...businessQuestions, ...modulePracticeQuestions]);

if (challengeDefinitions.length !== 210) {
  throw new Error(`Expected 210 challenges, got ${challengeDefinitions.length}`);
}

validateChallengeSqlDefinitions(challengeDefinitions);

const reviewedChallengeDefinitions = reviewChallengeDefinitions(challengeDefinitions);
validateExpectedColumns(reviewedChallengeDefinitions);

function business(title, slug, difficulty, prompt, expectedSql, tables, explanation, hints) {
  return {
    moduleIndex: 12,
    title,
    slug,
    difficulty,
    prompt,
    expectedSql,
    tables,
    explanation,
    hints,
  };
}

function moduleQuestion(moduleIndex, title, slug, difficulty, prompt, expectedSql, tables, explanation, hints) {
  return {
    moduleIndex,
    title,
    slug,
    difficulty,
    prompt,
    expectedSql,
    tables,
    explanation,
    hints,
  };
}

function addInactiveQuestions(questions) {
  for (const { moduleIndex, ...question } of questions) {
    add(moduleIndex, {
      ...question,
      isActive: false,
      tags: [...(question.tags ?? []), "select", "draft"],
    });
  }
}

function q(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function arr(values) {
  if (!values.length) return "array[]::text[]";
  return `array[${values.map(q).join(", ")}]`;
}

function rows(values) {
  return values.map((row) => `  (${row.join(", ")})`).join(",\n");
}

function contentNumber(id) {
  return Number(String(id).slice(-12));
}

function isInitialChallenge(challenge) {
  const number = contentNumber(challenge.id);
  return number >= initialChallengeStart && number <= initialChallengeEnd;
}

function isMutatingType(type) {
  return type !== "free_select";
}

function reviewChallengeDefinitions(challenges) {
  return challenges.map((challenge) => {
    if (!isInitialChallenge(challenge)) {
      return { ...challenge, expectedColumns: [] };
    }

    const expectedColumns = inferExpectedColumns(challenge);
    return {
      ...challenge,
      prompt: reviewPrompt(challenge.prompt),
      hints: buildReviewedHints(challenge, expectedColumns),
      expectedColumns,
    };
  });
}

function reviewPrompt(prompt) {
  return prompt.trim();
}

function buildReviewedHints(challenge, expectedColumns) {
  const tableList = challenge.tables.join(", ");
  const columnsHint = expectedColumns.length
    ? `As colunas finais, nesta ordem, devem ser: ${expectedColumns.map((column) => `\`${column}\``).join(", ")}.`
    : "Confira o formato final retornado pela validacao.";

  if (isMutatingType(challenge.type)) {
    return [
      `Use somente as tabelas permitidas para este desafio: ${tableList}.`,
      columnsHint,
      "A validacao compara o estado final retornado pela query de validacao.",
    ];
  }

  return [
    `Use as tabelas permitidas para este desafio: ${tableList}.`,
    columnsHint,
    "Confira filtros, agrupamentos, limites e ordenacao antes de executar.",
  ];
}

function inferExpectedColumns(challenge) {
  const sql = isMutatingType(challenge.type) ? challenge.validationSql : challenge.expectedSql;
  if (!sql) return [];
  return parseSelectColumns(sql);
}

function parseSelectColumns(sql) {
  const selectIndex = findTopLevelKeyword(sql, "select", 0);
  if (selectIndex < 0) return [];
  const fromIndex = findTopLevelKeyword(sql, "from", selectIndex + 6);
  const endIndex = fromIndex < 0 ? sql.length : fromIndex;

  return splitTopLevel(sql.slice(selectIndex + 6, endIndex).replace(/;+\s*$/, ""), ",").map(columnNameFromExpression);
}

function findTopLevelKeyword(sql, keyword, startAt) {
  const lowerKeyword = keyword.toLowerCase();
  let depth = 0;
  let quote = null;

  for (let index = startAt; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (quote) {
      if (char === quote && next === quote) {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (depth !== 0) continue;

    const fragment = sql.slice(index, index + lowerKeyword.length).toLowerCase();
    const before = index === 0 ? "" : sql[index - 1];
    const after = sql[index + lowerKeyword.length] ?? "";
    if (fragment === lowerKeyword && !/[a-z0-9_]/i.test(before) && !/[a-z0-9_]/i.test(after)) {
      return index;
    }
  }

  return -1;
}

function splitTopLevel(value, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (quote) {
      if (char === quote && next === quote) {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === separator && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function columnNameFromExpression(expression) {
  const normalizedExpression = expression.replace(/^distinct\s+/i, "");
  const aliasMatch = normalizedExpression.match(/\s+as\s+("?[a-z_][a-z0-9_]*"?)\s*$/i);
  if (aliasMatch) return cleanIdentifier(aliasMatch[1]);

  const bareAliasMatch = normalizedExpression.match(/\s+("?[a-z_][a-z0-9_]*"?)\s*$/i);
  if (bareAliasMatch && /[)\]'"]/.test(normalizedExpression.slice(0, bareAliasMatch.index).trim().slice(-1))) {
    return cleanIdentifier(bareAliasMatch[1]);
  }

  const noCast = normalizedExpression.replace(/::[a-z_][a-z0-9_\s]*(\[\])?$/i, "");
  const parts = noCast.split(".");
  return cleanIdentifier(parts[parts.length - 1].trim());
}

function cleanIdentifier(value) {
  return value.replace(/^"|"$/g, "").trim();
}

function validateExpectedColumns(challenges) {
  const invalid = challenges
    .filter(isInitialChallenge)
    .filter((challenge) => challenge.expectedColumns.length === 0 || challenge.expectedColumns.some((column) => !column));

  if (invalid.length) {
    throw new Error(`Expected columns missing for: ${invalid.map((challenge) => challenge.slug).join(", ")}`);
  }
}

function insertUpsert(table, columns, items, mapper, updateColumns) {
  const values = rows(items.map((item) => mapper(item).map((value) => value)));
  const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(",\n  ");
  return `insert into ${table} (${columns.join(", ")})\nvalues\n${values}\non conflict (id) do update\nset\n  ${updates};`;
}

const seed = `insert into tracks (id, title, description, slug, sort_order, is_active)
values
  (${q(trackId)}, 'Trilha SQL', 'Do primeiro SELECT a analises de vendas.', 'trilha-sql', 1, true)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into modules (id, track_id, title, description, slug, sort_order, unlock_rule, is_active)
values
${rows(modules.map((module, index) => [
  q(module.id),
  q(trackId),
  q(module.title),
  q(module.description),
  q(module.slug),
  module.sortOrder,
  index === 0 ? "null" : q('{"type":"previous_module_completion","percentage":70}'),
  q(module.isActive ?? true),
]))}
on conflict (id) do update
set
  track_id = excluded.track_id,
  title = excluded.title,
  description = excluded.description,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  unlock_rule = excluded.unlock_rule,
  is_active = excluded.is_active,
  updated_at = now();

${insertUpsert(
  "challenge_data.customers",
  ["id", "full_name", "email", "city", "state", "created_at"],
  customers,
  (item) => [q(item.id), q(item.fullName), q(item.email), q(item.city), q(item.state), q(item.createdAt)],
  ["full_name", "email", "city", "state", "created_at"],
)}

${insertUpsert(
  "challenge_data.categories",
  ["id", "name"],
  categories,
  (item) => [q(item.id), q(item.name)],
  ["name"],
)}

${insertUpsert(
  "challenge_data.products",
  ["id", "category_id", "name", "sku", "price", "cost", "active", "stock_quantity"],
  products,
  (item) => [q(item.id), q(item.categoryId), q(item.name), q(item.sku), item.price, item.cost, item.active ? "true" : "false", item.stockQuantity],
  ["category_id", "name", "sku", "price", "cost", "active", "stock_quantity"],
)}

${insertUpsert(
  "challenge_data.orders",
  ["id", "customer_id", "order_number", "status", "order_date", "total_amount", "shipping_amount", "discount_amount"],
  orders,
  (item) => [q(item.id), q(item.customerId), q(item.orderNumber), q(item.status), q(item.orderDate), item.totalAmount, item.shippingAmount, item.discountAmount],
  ["customer_id", "order_number", "status", "order_date", "total_amount", "shipping_amount", "discount_amount"],
)}

${insertUpsert(
  "challenge_data.order_items",
  ["id", "order_id", "product_id", "quantity", "unit_price", "line_total"],
  orderItems,
  (item) => [q(item.id), q(item.orderId), q(item.productId), item.quantity, item.unitPrice, item.lineTotal],
  ["order_id", "product_id", "quantity", "unit_price", "line_total"],
)}

${insertUpsert(
  "challenge_data.payments",
  ["id", "order_id", "payment_method", "status", "amount", "paid_at"],
  payments,
  (item) => [q(item.id), q(item.orderId), q(item.paymentMethod), q(item.status), item.amount, q(item.paidAt)],
  ["order_id", "payment_method", "status", "amount", "paid_at"],
)}

${insertUpsert(
  "challenge_data.shipments",
  ["id", "order_id", "carrier", "status", "shipped_at", "delivered_at"],
  shipments,
  (item) => [q(item.id), q(item.orderId), q(item.carrier), q(item.status), q(item.shippedAt), q(item.deliveredAt)],
  ["order_id", "carrier", "status", "shipped_at", "delivered_at"],
)}

${insertUpsert(
  "challenge_data.financial_transactions",
  ["id", "order_id", "type", "amount", "transaction_date", "description"],
  financialTransactions,
  (item) => [q(item.id), q(item.orderId), q(item.type), item.amount, q(item.transactionDate), q(item.description)],
  ["order_id", "type", "amount", "transaction_date", "description"],
)}

insert into challenges (id, module_id, title, slug, type, difficulty, prompt, starter_sql, expected_sql, expected_columns, allowed_tables, setup_sql, validation_sql, base_points, explanation, tags, sort_order, is_active)
values
${rows(reviewedChallengeDefinitions.map((challenge) => [
  q(challenge.id),
  q(challenge.moduleId),
  q(challenge.title),
  q(challenge.slug),
  q(challenge.type),
  q(challenge.difficulty),
  q(challenge.prompt),
  "null",
  q(challenge.expectedSql),
  arr(challenge.expectedColumns),
  arr(challenge.tables),
  q(challenge.setupSql),
  q(challenge.validationSql),
  challenge.points,
  q(challenge.explanation),
  arr(challenge.tags ?? [challenge.type === "free_select" ? "select" : challenge.type]),
  challenge.sortOrder,
  q(challenge.isActive ?? true),
]))}
on conflict (id) do update
set
  module_id = excluded.module_id,
  title = excluded.title,
  slug = excluded.slug,
  type = excluded.type,
  difficulty = excluded.difficulty,
  prompt = excluded.prompt,
  starter_sql = excluded.starter_sql,
  expected_sql = excluded.expected_sql,
  expected_columns = excluded.expected_columns,
  allowed_tables = excluded.allowed_tables,
  setup_sql = excluded.setup_sql,
  validation_sql = excluded.validation_sql,
  base_points = excluded.base_points,
  explanation = excluded.explanation,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Nao grave respostas oficiais no SQL inicial exibido ao aluno.
update challenges
set starter_sql = null
where module_id in (
  select id
  from modules
  where track_id = ${q(trackId)}
);

delete from challenge_hints
where challenge_id in (${reviewedChallengeDefinitions.map((challenge) => q(challenge.id)).join(", ")});

insert into challenge_hints (challenge_id, hint_order, content)
values
${rows(reviewedChallengeDefinitions.flatMap((challenge) => challenge.hints.map((hint, index) => [
  q(challenge.id),
  index + 1,
  q(hint),
])))}
on conflict (challenge_id, hint_order) do update
set content = excluded.content;

insert into platform_events (id, title, description, type, multiplier, starts_at, ends_at, is_active)
values (${q(contentId(901))}, 'Dobro de pontos ativo', 'Todos os desafios concluidos durante o evento valem 2x XP.', 'points_multiplier', 2, now() - interval '1 hour', now() + interval '1 day', true)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  multiplier = excluded.multiplier,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active,
  updated_at = now();
`;

const outputPath = path.join(__dirname, "..", "supabase", "seed.sql");
fs.writeFileSync(outputPath, `${seed.trim()}\n`);
console.log(`Generated ${challengeDefinitions.length} challenges in ${path.relative(process.cwd(), outputPath)}`);

const contentMigrationPath = path.join(__dirname, "..", "supabase", "migrations", "20260703000200_update_initial_challenge_content.sql");
fs.writeFileSync(contentMigrationPath, `${buildInitialContentMigration(reviewedChallengeDefinitions).trim()}\n`);
console.log(`Generated production content migration in ${path.relative(process.cwd(), contentMigrationPath)}`);

function buildInitialContentMigration(challenges) {
  const initialChallenges = challenges.filter(isInitialChallenge);
  const challengeIds = initialChallenges.map((challenge) => q(challenge.id)).join(", ");

  return `begin;

alter table public.challenges
  add column if not exists expected_columns text[] not null default '{}';

with reviewed_challenges (id, prompt, expected_columns) as (
  values
${rows(initialChallenges.map((challenge) => [
  `${q(challenge.id)}::uuid`,
  q(challenge.prompt),
  arr(challenge.expectedColumns),
]))}
)
update public.challenges as challenge
set
  prompt = reviewed.prompt,
  expected_columns = reviewed.expected_columns,
  updated_at = now()
from reviewed_challenges as reviewed
where challenge.id = reviewed.id;

delete from public.challenge_hints
where challenge_id in (${challengeIds});

insert into public.challenge_hints (challenge_id, hint_order, content)
values
${rows(initialChallenges.flatMap((challenge) => challenge.hints.map((hint, index) => [
  q(challenge.id),
  index + 1,
  q(hint),
])))}
on conflict (challenge_id, hint_order) do update
set content = excluded.content;

do $$
declare
  v_reviewed_count int;
begin
  select count(*)::int
    into v_reviewed_count
  from public.challenges
  where id in (${challengeIds})
    and cardinality(expected_columns) > 0;

  if v_reviewed_count <> ${initialChallenges.length} then
    raise exception 'Expected ${initialChallenges.length} initial challenges with expected_columns, found %.', v_reviewed_count;
  end if;
end
$$;

commit;`;
}

function validateChallengeSqlDefinitions(challenges) {
  const sourcePath = path.join(__dirname, "..", "src", "shared", "sql-security.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const moduleScope = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    module: moduleScope,
    exports: moduleScope.exports,
    require,
    console,
  }, { filename: sourcePath });

  const { isMutatingChallengeType, parseChallengeType, validateChallengeSql, validateValidationSql } = moduleScope.exports;
  for (const challenge of challenges) {
    validateChallengeSql(challenge.starterSql, challenge.tables, challenge.type);
    validateChallengeSql(challenge.expectedSql, challenge.tables, challenge.type);
    if (isMutatingChallengeType(parseChallengeType(challenge.type))) {
      validateValidationSql(challenge.validationSql ?? "");
    }
  }
}
