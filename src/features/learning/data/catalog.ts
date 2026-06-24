import type { Challenge, LearningModule, PlatformEvent, UserProfile } from "../../../shared/types/sql-arena";
import { challengeSchema } from "./challenge-data";

export { challengeSchema };

export const activeEvent: PlatformEvent = {
  id: "double-xp-weekend",
  title: "Dobro de pontos ativo",
  multiplier: 2,
  endsAtLabel: "42:15",
  active: true,
};

export function getCurrentUser(): UserProfile {
  return {
    id: "user-murilo",
    name: "Murilo Souza",
    username: "murilo",
    avatar: "M",
    totalXp: 0,
    weeklyXp: 0,
    completedChallengeIds: [],
  };
}

export const currentUser = getCurrentUser();

const baseModules: LearningModule[] = [
  {
    id: "select-basics",
    title: "Primeiros SELECTs",
    description: "Aprenda a consultar dados de uma tabela.",
    status: "completed",
    challenges: [
      challenge({
        id: "select-all",
        moduleId: "select-basics",
        title: "Consultando todos os dados",
        statement: "Liste todas as colunas dos clientes. Limite o resultado a 3 linhas.",
        difficulty: "easy",
        baseXp: 10,
        starterSql: "SELECT *\nFROM customers\nLIMIT 3;",
        expectedSql: "SELECT * FROM customers LIMIT 3;",
        allowedTables: ["customers"],
        hints: ["Use SELECT * para retornar todas as colunas.", "Use LIMIT 3 no final da query."],
        explanation: "SELECT * retorna todas as colunas disponiveis. LIMIT reduz o volume exibido.",
      }),
      challenge({
        id: "select-columns",
        moduleId: "select-basics",
        title: "Selecionando colunas especificas",
        statement: "Liste apenas nome completo e email dos clientes. Limite o resultado a 4 linhas.",
        difficulty: "easy",
        baseXp: 10,
        starterSql: "SELECT full_name, email\nFROM customers\nLIMIT 4;",
        expectedSql: "SELECT full_name, email FROM customers LIMIT 4;",
        allowedTables: ["customers"],
        hints: ["Escreva os nomes das colunas depois de SELECT.", "A ordem das colunas precisa ser full_name, email."],
        explanation: "Selecionar somente as colunas necessarias deixa a consulta mais clara e barata.",
      }),
      challengeStub("aliases", "Criando apelidos com AS", "easy", 10, "select-basics"),
      challengeStub("math-select", "Operacoes matematicas simples", "easy", 15, "select-basics"),
      challengeStub("first-select-boss", "Especial: O primeiro SELECT", "special", 50, "select-basics"),
    ],
  },
  {
    id: "filters",
    title: "Filtros",
    description: "Use WHERE para encontrar exatamente o que voce precisa.",
    status: "in-progress",
    challenges: [
      challenge({
        id: "sp-rj-customers",
        moduleId: "filters",
        title: "Clientes de SP e RJ",
        statement: "Liste nome completo, email, cidade e estado dos clientes que moram em SP ou RJ.",
        orderingHint: "Ordene o resultado pelo nome do cliente em ordem alfabetica crescente.",
        difficulty: "easy",
        baseXp: 15,
        starterSql: "SELECT full_name, email, city, state\nFROM customers\nWHERE state IN ('SP', 'RJ')\nORDER BY full_name;",
        expectedSql: "SELECT full_name, email, city, state FROM customers WHERE state IN ('SP', 'RJ') ORDER BY full_name;",
        allowedTables: ["customers"],
        hints: ["Use WHERE para filtrar.", "IN ('SP', 'RJ') evita repetir a coluna duas vezes."],
        explanation: "A clausula IN compara uma coluna contra uma lista de valores permitidos.",
      }),
      challenge({
        id: "out-of-stock",
        moduleId: "filters",
        title: "Produtos sem estoque",
        statement: "Liste o nome, SKU e preco dos produtos ativos com estoque igual a zero.",
        orderingHint: "Ordene pelo nome do produto em ordem alfabetica crescente.",
        difficulty: "medium",
        baseXp: 25,
        starterSql: "SELECT name, sku, price\nFROM products\nWHERE active = true AND stock_quantity = 0\nORDER BY name;",
        expectedSql: "SELECT name, sku, price FROM products WHERE active = true AND stock_quantity = 0 ORDER BY name;",
        allowedTables: ["products"],
        hints: ["Use AND para combinar filtros.", "A coluna de estoque se chama stock_quantity."],
        explanation: "Filtros combinados ajudam a transformar uma tabela grande em uma resposta especifica.",
      }),
      challenge({
        id: "rondonia-customers",
        slug: "clientes-rondonia",
        moduleId: "filters",
        title: "Clientes de Rondonia",
        statement: "Liste o nome, email e cidade dos clientes que moram no estado de Rondonia.",
        orderingHint: "Ordene o resultado pelo nome do cliente em ordem alfabetica crescente.",
        difficulty: "easy",
        baseXp: 10,
        starterSql: "SELECT full_name, email, city\nFROM customers\nWHERE state = 'Rondonia'\nORDER BY full_name;",
        expectedSql: "SELECT full_name, email, city FROM customers WHERE state = 'Rondonia' ORDER BY full_name;",
        allowedTables: ["customers"],
        hints: [
          "Use WHERE para filtrar registros.",
          "A coluna de estado se chama state.",
          "Retorne somente full_name, email e city nesta ordem.",
        ],
        explanation: "WHERE limita os registros retornados e ORDER BY garante a mesma ordem esperada pela validacao.",
      }),
      challengeStub("like-search", "Busca por texto com LIKE", "medium", 25, "filters"),
      challengeStub("detective-boss", "Especial: O Detetive", "special", 100, "filters"),
    ],
  },
  {
    id: "sorting-limits",
    title: "Ordenacao e LIMIT",
    description: "Organize resultados e traga apenas o recorte certo.",
    status: "locked",
    challenges: [
      challenge({
        id: "sort-price-desc",
        moduleId: "sorting-limits",
        title: "Produtos mais caros",
        statement: "Liste nome e preco dos produtos ativos.",
        orderingHint: "Ordene pelo preco do maior para o menor e limite em 3 linhas.",
        difficulty: "easy",
        baseXp: 10,
        starterSql: "SELECT name, price\nFROM products\nWHERE active = true\nORDER BY price DESC\nLIMIT 3;",
        expectedSql: "SELECT name, price FROM products WHERE active = true ORDER BY price DESC LIMIT 3;",
        allowedTables: ["products"],
        hints: ["Use ORDER BY price DESC.", "Finalize com LIMIT 3."],
        explanation: "ORDER BY DESC coloca os maiores valores primeiro. LIMIT entrega apenas o topo do ranking.",
      }),
      challengeStub("sort-alpha", "Ordenando alfabeticamente", "easy", 10, "sorting-limits"),
      challengeStub("top-5", "Top 5 clientes", "medium", 25, "sorting-limits"),
      challengeStub("pagination", "Paginacao de dados", "hard", 40, "sorting-limits"),
    ],
  },
];

export const learningModules = hydrateModules();

export function getLearningModules() {
  return hydrateModules();
}

export function getChallengeById(id?: string) {
  const allChallenges = hydrateModules().flatMap((module) => module.challenges);
  return allChallenges.find((item) => item.id === id) ?? allChallenges.find((item) => item.status === "available") ?? allChallenges[0];
}

export function getModuleById(id: string) {
  return hydrateModules().find((module) => module.id === id);
}

export function getModuleProgress(module: LearningModule) {
  const completed = module.challenges.filter((item) => item.status === "completed").length;
  return Math.round((completed / module.challenges.length) * 100);
}

export function getAvailableChallenge() {
  return hydrateModules().flatMap((module) => module.challenges).find((item) => item.status === "available") ?? hydrateModules()[0].challenges[0];
}

function hydrateModules(): LearningModule[] {
  const completedIds: string[] = [];
  const modules = baseModules.map((module) => ({
    ...module,
    challenges: module.challenges.map((item) => ({
      ...item,
      status: completedIds.includes(item.id) ? "completed" : item.status,
    })),
  }));

  return modules.map((module, index) => {
    const previous = modules[index - 1];
    const previousProgress = previous ? getModuleProgress(previous) : 100;
    const isUnlocked = index === 0 || previousProgress >= 70;
    const challenges = module.challenges.map((item, challengeIndex) => {
      if (item.status === "completed") return item;
      if (!isUnlocked) return { ...item, status: "locked" as const };
      const previousChallengeDone = challengeIndex === 0 || module.challenges[challengeIndex - 1].status === "completed";
      return { ...item, status: previousChallengeDone ? "available" as const : "locked" as const };
    });

    const completed = challenges.filter((item) => item.status === "completed").length;
    const status = !isUnlocked ? "locked" : completed === challenges.length ? "completed" : "in-progress";
    return { ...module, status, challenges };
  });
}

function challenge(input: Omit<Challenge, "slug" | "type" | "status" | "expectedColumns" | "expectedRows"> & Partial<Challenge>): Challenge {
  return {
    slug: input.id,
    type: "free_select",
    status: "available",
    expectedColumns: [],
    expectedRows: [],
    ...input,
  };
}

function challengeStub(
  id: string,
  title: string,
  difficulty: Challenge["difficulty"],
  baseXp: number,
  moduleId: string,
): Challenge {
  return challenge({
    id,
    moduleId,
    title,
    statement: "Desafio preparado para as proximimas etapas do MVP.",
    difficulty,
    baseXp,
    starterSql: "SELECT full_name, email\nFROM customers\nLIMIT 2;",
    expectedSql: "SELECT full_name, email FROM customers LIMIT 2;",
    allowedTables: ["customers"],
    hints: ["Leia o enunciado e confira a estrutura das tabelas antes de executar."],
    explanation: "Este desafio ja usa o mesmo contrato de execucao segura dos demais.",
  });
}
