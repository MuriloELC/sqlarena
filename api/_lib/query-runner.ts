import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";
import type { Pool as PoolType } from "pg";
import { sanitizeSql, validateChallengeSql } from "../../src/shared/sql-security";
import { HttpError } from "./http";

const require = createRequire(import.meta.url);
const { Pool } = require("pg") as typeof import("pg");

export type SqlValue = string | number | boolean | null;

export type QueryResult = {
  columns: string[];
  rows: Record<string, SqlValue>[];
  execution_time_ms: number;
  limited: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __sqlArenaRunnerPool: PoolType | undefined;
}

function getPool() {
  if (globalThis.__sqlArenaRunnerPool) return globalThis.__sqlArenaRunnerPool;

  const connectionString = process.env.CHALLENGE_RUNNER_DATABASE_URL;
  if (!connectionString) {
    throw new HttpError(500, "CHALLENGE_RUNNER_DATABASE_URL nao configurada.");
  }

  globalThis.__sqlArenaRunnerPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalThis.__sqlArenaRunnerPool;
}

export async function runChallengeQuery(sql: string, allowedTables: string[], maxRows = 500): Promise<QueryResult> {
  const cleanSql = validateChallengeSql(sql, allowedTables);
  return runReadOnlyQuery(cleanSql, maxRows);
}

export async function runExpectedQuery(sql: string, allowedTables: string[], maxRows = 500): Promise<QueryResult> {
  const cleanSql = validateChallengeSql(sql, allowedTables);
  return runReadOnlyQuery(cleanSql, maxRows);
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
