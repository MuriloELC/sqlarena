import { createRequire } from "node:module";
import type { Pool as PoolType, QueryResult, QueryResultRow } from "pg";
import { HttpError } from "./http.js";

const require = createRequire(import.meta.url);
const { Pool } = require("pg") as typeof import("pg");

declare global {
  // eslint-disable-next-line no-var
  var __sqlArenaAdminPool: PoolType | undefined;
}

function getAdminPool() {
  if (globalThis.__sqlArenaAdminPool) return globalThis.__sqlArenaAdminPool;

  const connectionString = process.env.CHALLENGE_DATABASE_URL;
  if (!connectionString) {
    throw new HttpError(500, "CHALLENGE_DATABASE_URL nao configurada.");
  }

  globalThis.__sqlArenaAdminPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalThis.__sqlArenaAdminPool;
}

export async function queryAdminDb<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return getAdminPool().query<T>(sql, params);
}
