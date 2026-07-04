import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import type { Pool as PoolType, PoolClient } from "pg";
import {
  isMutatingChallengeType,
  parseChallengeType,
  sanitizeSql,
  validateChallengeSql,
  validateSetupSql,
  validateValidationSql,
  type ChallengeType,
} from "../../src/shared/sql-security.js";
import { HttpError } from "./http.js";
import { normalizePostgresConnectionString } from "./pg-connection.js";

const require = createRequire(import.meta.url);
const { Pool } = require("pg") as typeof import("pg");

export type SqlValue = string | number | boolean | null;

export type QueryResult = {
  columns: string[];
  rows: Record<string, SqlValue>[];
  execution_time_ms: number;
  limited: boolean;
};

export type ChallengeExecutionConfig = {
  type?: ChallengeType | string | null;
  allowedTables: string[];
  setupSql?: string | null;
  validationSql?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __sqlArenaRunnerPool: PoolType | undefined;
  // eslint-disable-next-line no-var
  var __sqlArenaSandboxPool: PoolType | undefined;
}

function getPool() {
  if (globalThis.__sqlArenaRunnerPool) return globalThis.__sqlArenaRunnerPool;

  const connectionString = process.env.CHALLENGE_RUNNER_DATABASE_URL;
  if (!connectionString) {
    throw new HttpError(500, "CHALLENGE_RUNNER_DATABASE_URL nao configurada.");
  }

  globalThis.__sqlArenaRunnerPool = new Pool({
    connectionString: normalizePostgresConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalThis.__sqlArenaRunnerPool;
}

function getSandboxPool() {
  if (globalThis.__sqlArenaSandboxPool) return globalThis.__sqlArenaSandboxPool;

  const connectionString = process.env.CHALLENGE_SANDBOX_DATABASE_URL;
  if (!connectionString) {
    throw new HttpError(500, "CHALLENGE_SANDBOX_DATABASE_URL nao configurada.");
  }

  globalThis.__sqlArenaSandboxPool = new Pool({
    connectionString: normalizePostgresConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalThis.__sqlArenaSandboxPool;
}

export async function runChallengeQuery(sql: string, config: ChallengeExecutionConfig | string[], maxRows = 500): Promise<QueryResult> {
  const runConfig = normalizeConfig(config);
  const type = parseChallengeType(runConfig.type);
  const cleanSql = validateChallengeSql(sql, runConfig.allowedTables, type);

  if (!isMutatingChallengeType(type)) {
    return runReadOnlyQuery(cleanSql, maxRows);
  }

  return runSandboxedMutationQuery(cleanSql, { ...runConfig, type }, maxRows);
}

export async function runExpectedQuery(sql: string, config: ChallengeExecutionConfig | string[], maxRows = 500): Promise<QueryResult> {
  return runChallengeQuery(sql, config, maxRows);
}

export function sameResult(left: QueryResult, right: QueryResult) {
  return JSON.stringify({ columns: left.columns, rows: left.rows }) === JSON.stringify({ columns: right.columns, rows: right.rows });
}

async function runReadOnlyQuery(sql: string, maxRows: number): Promise<QueryResult> {
  const client = await getPool().connect();
  const startedAt = performance.now();
  const cleanSql = sanitizeSql(sql);

  try {
    await client.query("begin read only");
    await client.query("set local statement_timeout = '10s'");
    await client.query("set local search_path = challenge_data, public");

    const result = await client.query(`select * from (${cleanSql}) as __sql_arena_result limit ${maxRows + 1}`);
    await client.query("commit");

    const limited = result.rows.length > maxRows;
    const columns = result.fields.map((field) => field.name);
    const rows = result.rows.slice(0, maxRows).map((row) => normalizeRow(row, columns));

    return {
      columns,
      rows,
      execution_time_ms: Math.max(1, Math.round(performance.now() - startedAt)),
      limited,
    };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function runSandboxedMutationQuery(sql: string, config: ChallengeExecutionConfig & { type: ChallengeType }, maxRows: number): Promise<QueryResult> {
  const validationSql = validateValidationSql(config.validationSql ?? "");
  const client = await getSandboxPool().connect();
  const schemaName = `sql_arena_${randomUUID().replace(/-/g, "")}`;
  const startedAt = performance.now();
  let transactionStarted = false;

  try {
    await client.query("begin");
    transactionStarted = true;
    await client.query("set local statement_timeout = '10s'");
    await client.query("set local lock_timeout = '2s'");
    await client.query(`create schema ${quoteIdent(schemaName)}`);
    await client.query(`set local search_path = ${quoteIdent(schemaName)}, pg_catalog`);

    await copyAllowedTables(client, config.allowedTables);

    const setupSql = validateSetupSql(config.setupSql ?? "");
    if (setupSql) {
      await client.query(setupSql);
    }

    await client.query(sql);
    const result = await client.query(`select * from (${validationSql}) as __sql_arena_validation limit ${maxRows + 1}`);
    await client.query("rollback");
    transactionStarted = false;

    const limited = result.rows.length > maxRows;
    const columns = result.fields.map((field) => field.name);
    const rows = result.rows.slice(0, maxRows).map((row) => normalizeRow(row, columns));

    return {
      columns,
      rows,
      execution_time_ms: Math.max(1, Math.round(performance.now() - startedAt)),
      limited,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query("rollback").catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function copyAllowedTables(client: PoolClient, allowedTables: string[]) {
  const seen = new Set<string>();

  for (const table of allowedTables.map(stripSchema)) {
    if (seen.has(table) || !isSimpleIdentifier(table)) continue;
    seen.add(table);

    const exists = await client.query<{ exists: boolean }>(
      "select to_regclass($1) is not null as exists",
      [`challenge_data.${table}`],
    );

    if (!exists.rows[0]?.exists) continue;

    const quotedTable = quoteIdent(table);
    await client.query(`create table ${quotedTable} (like challenge_data.${quotedTable} including all)`);
    await client.query(`insert into ${quotedTable} select * from challenge_data.${quotedTable}`);
  }
}

function normalizeConfig(config: ChallengeExecutionConfig | string[]): ChallengeExecutionConfig {
  if (Array.isArray(config)) {
    return {
      type: "free_select",
      allowedTables: config,
      setupSql: null,
      validationSql: null,
    };
  }

  return {
    type: config.type ?? "free_select",
    allowedTables: config.allowedTables ?? [],
    setupSql: config.setupSql ?? null,
    validationSql: config.validationSql ?? null,
  };
}

function normalizeRow(row: Record<string, unknown>, columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, normalizeValue(row[column])]));
}

function normalizeValue(value: unknown): SqlValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  return String(value);
}

function isSimpleIdentifier(value: string) {
  return /^[a-z_][a-z0-9_]*$/.test(value);
}

function quoteIdent(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function stripSchema(value: string) {
  return value.includes(".") ? value.split(".")[1] : value;
}
