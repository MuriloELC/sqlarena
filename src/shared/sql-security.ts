const DANGEROUS_WORDS = [
  "insert",
  "update",
  "delete",
  "merge",
  "drop",
  "alter",
  "create",
  "truncate",
  "grant",
  "revoke",
  "copy",
  "call",
  "do",
  "vacuum",
  "analyze",
  "explain analyze",
];

export class SqlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlValidationError";
  }
}

export function sanitizeSql(sql: string) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .replace(/;$/, "");
}

export function normalizeSql(sql: string) {
  return sanitizeSql(sql)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateChallengeSql(sql: string, allowedTables: string[]) {
  const cleanSql = sanitizeSql(sql);
  const normalized = normalizeSql(cleanSql);
  const allowed = new Set(allowedTables.map(stripSchema));

  if (!normalized) throw new SqlValidationError("Consulta bloqueada: escreva uma query SQL antes de executar.");
  if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
    throw new SqlValidationError("Consulta bloqueada: no MVP, somente SELECT ou WITH sao permitidos.");
  }
  if ((cleanSql.match(/;/g) ?? []).length > 0) {
    throw new SqlValidationError("Consulta bloqueada: a execucao aceita apenas uma statement por vez.");
  }

  const blockedWord = DANGEROUS_WORDS.find((word) => new RegExp(`\\b${word}\\b`, "i").test(normalized));
  if (blockedWord) {
    throw new SqlValidationError(`Consulta bloqueada: ${blockedWord.toUpperCase()} nao e permitido no ambiente de desafios.`);
  }

  const cteNames = getCteNames(normalized);
  const tableRefs = getTableRefs(normalized);
  if (!tableRefs.length) {
    throw new SqlValidationError("Consulta bloqueada: informe pelo menos uma tabela em FROM ou JOIN.");
  }

  const forbiddenSchema = tableRefs.find((ref) => ref.schema && ref.schema !== "challenge_data");
  if (forbiddenSchema) {
    throw new SqlValidationError(`Consulta bloqueada: o schema "${forbiddenSchema.schema}" nao esta liberado.`);
  }

  const forbiddenTable = tableRefs.find((ref) => !cteNames.has(ref.table) && !allowed.has(ref.table));
  if (forbiddenTable) {
    throw new SqlValidationError(`Consulta bloqueada: a tabela "${forbiddenTable.table}" nao esta liberada para este desafio.`);
  }

  return cleanSql;
}

export function getTableRefs(sql: string) {
  return Array.from(sql.matchAll(/\b(?:from|join)\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/g)).map((match) => {
    const [schema, table] = match[1].includes(".") ? match[1].split(".") : [null, match[1]];
    return { schema, table: stripSchema(table) };
  });
}

function getCteNames(sql: string) {
  if (!sql.trim().startsWith("with")) return new Set<string>();

  return new Set(
    Array.from(sql.matchAll(/(?:with|,)\s+([a-z_][a-z0-9_]*)\s+as\s*\(/g)).map((match) => match[1]),
  );
}

function stripSchema(value: string) {
  return value.includes(".") ? value.split(".")[1] : value;
}
