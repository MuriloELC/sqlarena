export const CHALLENGE_TYPES = [
  "free_select",
  "insert_rows",
  "update_rows",
  "delete_rows",
  "create_table",
  "alter_table",
  "drop_table",
] as const;

export type ChallengeType = typeof CHALLENGE_TYPES[number];

const MUTATING_TYPES = new Set<ChallengeType>([
  "insert_rows",
  "update_rows",
  "delete_rows",
  "create_table",
  "alter_table",
  "drop_table",
]);

const READ_ONLY_BLOCKED_WORDS = [
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

const MUTATION_BLOCKED_WORDS = [
  "merge",
  "truncate",
  "grant",
  "revoke",
  "copy",
  "call",
  "do",
  "vacuum",
  "analyze",
  "explain analyze",
  "begin",
  "commit",
  "rollback",
  "savepoint",
  "release",
  "reset",
  "listen",
  "notify",
  "function",
  "procedure",
  "extension",
  "policy",
  "trigger",
  "role",
  "user",
  "database",
  "schema",
  "view",
  "materialized",
  "sequence",
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

export function isMutatingChallengeType(type: ChallengeType) {
  return MUTATING_TYPES.has(type);
}

export function parseChallengeType(type: unknown): ChallengeType {
  return typeof type === "string" && (CHALLENGE_TYPES as readonly string[]).includes(type)
    ? type as ChallengeType
    : "free_select";
}

export function validateChallengeSql(sql: string, allowedTables: string[], challengeType: ChallengeType = "free_select") {
  const cleanSql = sanitizeSql(sql);
  const normalized = normalizeSql(cleanSql);
  const allowed = new Set(allowedTables.map(stripSchema));

  if (!normalized) throw new SqlValidationError("Consulta bloqueada: escreva uma query SQL antes de executar.");
  if ((cleanSql.match(/;/g) ?? []).length > 0) {
    throw new SqlValidationError("Consulta bloqueada: a execucao aceita apenas uma statement por vez.");
  }

  return challengeType === "free_select"
    ? validateReadOnlySql(cleanSql, normalized, allowed)
    : validateMutationSql(cleanSql, normalized, allowed, challengeType);
}

export function validateValidationSql(sql: string) {
  const cleanSql = sanitizeSql(sql);
  const normalized = normalizeSql(cleanSql);

  if (!normalized) throw new SqlValidationError("Validacao bloqueada: informe uma query de validacao.");
  if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
    throw new SqlValidationError("Validacao bloqueada: a validacao deve ser SELECT ou WITH.");
  }
  if ((cleanSql.match(/;/g) ?? []).length > 0) {
    throw new SqlValidationError("Validacao bloqueada: a execucao aceita apenas uma statement por vez.");
  }

  return cleanSql;
}

function validateReadOnlySql(cleanSql: string, normalized: string, allowed: Set<string>) {
  if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
    throw new SqlValidationError("Consulta bloqueada: este desafio permite somente SELECT ou WITH.");
  }

  const blockedWord = READ_ONLY_BLOCKED_WORDS.find((word) => hasWord(normalized, word));
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

function validateMutationSql(cleanSql: string, normalized: string, allowed: Set<string>, challengeType: ChallengeType) {
  const structuralSql = maskStringLiterals(normalized);

  if (/["`\[\]]/.test(cleanSql)) {
    throw new SqlValidationError("Consulta bloqueada: identificadores entre aspas nao sao permitidos nestes desafios.");
  }

  if (/\b[a-z_][a-z0-9_]*\s*\.\s*[a-z_][a-z0-9_]*\b/i.test(structuralSql)) {
    throw new SqlValidationError("Consulta bloqueada: use apenas nomes simples, sem schema explicito.");
  }

  const blockedWord = MUTATION_BLOCKED_WORDS.find((word) => hasWord(structuralSql, word));
  if (blockedWord) {
    throw new SqlValidationError(`Consulta bloqueada: ${blockedWord.toUpperCase()} nao e permitido no sandbox de escrita.`);
  }

  const rule = getMutationRule(challengeType);
  const match = normalized.match(rule.pattern);
  if (!match?.groups?.table) {
    throw new SqlValidationError(`Consulta bloqueada: este desafio espera um comando ${rule.command}.`);
  }

  const targetTable = stripSchema(match.groups.table);
  if (!allowed.has(targetTable)) {
    throw new SqlValidationError(`Consulta bloqueada: a tabela "${targetTable}" nao esta liberada para este desafio.`);
  }

  if (rule.disallowSelect && hasWord(structuralSql, "select")) {
    throw new SqlValidationError("Consulta bloqueada: subconsultas nao sao permitidas nos desafios de escrita da v1.");
  }

  if (challengeType === "update_rows" && !hasWord(normalized, "where")) {
    throw new SqlValidationError("Consulta bloqueada: UPDATE deve usar WHERE neste desafio.");
  }

  if (challengeType === "delete_rows" && !hasWord(normalized, "where")) {
    throw new SqlValidationError("Consulta bloqueada: DELETE deve usar WHERE neste desafio.");
  }

  return cleanSql;
}

function getMutationRule(challengeType: ChallengeType) {
  switch (challengeType) {
    case "insert_rows":
      return {
        command: "INSERT",
        pattern: /^insert\s+into\s+(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    case "update_rows":
      return {
        command: "UPDATE",
        pattern: /^update\s+(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    case "delete_rows":
      return {
        command: "DELETE",
        pattern: /^delete\s+from\s+(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    case "create_table":
      return {
        command: "CREATE TABLE",
        pattern: /^create\s+table\s+(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    case "alter_table":
      return {
        command: "ALTER TABLE",
        pattern: /^alter\s+table\s+(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    case "drop_table":
      return {
        command: "DROP TABLE",
        pattern: /^drop\s+table\s+(?:if\s+exists\s+)?(?<table>[a-z_][a-z0-9_]*)\b/,
        disallowSelect: true,
      };
    default:
      return {
        command: "SELECT",
        pattern: /^select\s+(?<table>__never_matches__)\b/,
        disallowSelect: false,
      };
  }
}

export function getTableRefs(sql: string) {
  return Array.from(sql.matchAll(/\b(?:from|join)\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/g)).map((match) => {
    const [schema, table] = match[1].includes(".") ? match[1].split(".") : [null, match[1]];
    return { schema, table: stripSchema(table) };
  });
}

function hasWord(sql: string, word: string) {
  return new RegExp(`\\b${word}\\b`, "i").test(sql);
}

function maskStringLiterals(sql: string) {
  return sql.replace(/'([^']|'')*'/g, "''");
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
