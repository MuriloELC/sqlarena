const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const migrationPath = process.argv[2] || path.join("supabase", "migrations", "20260610000100_production_features_lgpd.sql");

function readDotEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 0) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

async function main() {
  const env = { ...readDotEnv(".env"), ...process.env };
  const connectionString = env.CHALLENGE_DATABASE_URL || env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("CHALLENGE_DATABASE_URL nao configurada no .env.");
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  const client = await pool.connect();
  try {
    await client.query(sql);

    const profileColumns = await client.query(`
      select count(*)::int as count
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name in ('terms_accepted_at', 'terms_version', 'privacy_accepted_at', 'privacy_version')
    `);
    const avatarsBucket = await client.query("select exists(select 1 from storage.buckets where id = 'avatars') as exists");
    const avatarPolicies = await client.query(`
      select count(*)::int as count
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname in (
          'users upload own avatar',
          'users update own avatar',
          'users delete own avatar'
        )
    `);

    console.log(JSON.stringify({
      profileLegalColumns: profileColumns.rows[0].count,
      avatarsBucket: avatarsBucket.rows[0].exists,
      avatarPolicies: avatarPolicies.rows[0].count,
    }));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
