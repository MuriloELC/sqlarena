const fs = require("node:fs");
const { Pool } = require("pg");

function loadDotenv() {
  const envPath = ".env";
  if (!fs.existsSync(envPath)) return;

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2].trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function quoteSql(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseExpectedChallenges() {
  const migration = fs.readFileSync("supabase/migrations/20260703000200_update_initial_challenge_content.sql", "utf8");
  const block = migration.match(/with reviewed_challenges[\s\S]*?values\s*([\s\S]*?)\)\s*update public\.challenges/i)?.[1];
  if (!block) throw new Error("Nao foi possivel encontrar o bloco reviewed_challenges na migration.");

  const expected = [];
  const rowPattern = /\('([^']+)'::uuid, '((?:''|[^'])*)', array\[([^\]]*)\]\)/g;
  for (const match of block.matchAll(rowPattern)) {
    const columns = [...match[3].matchAll(/'((?:''|[^'])*)'/g)].map((column) => column[1].replace(/''/g, "'"));
    expected.push({
      id: match[1],
      prompt: match[2].replace(/''/g, "'"),
      columns,
    });
  }

  if (expected.length !== 110) {
    throw new Error(`Esperava 110 desafios na migration local, encontrei ${expected.length}.`);
  }

  return expected;
}

async function main() {
  loadDotenv();

  const connectionString = process.env.CHALLENGE_DATABASE_URL;
  if (!connectionString) {
    throw new Error("CHALLENGE_DATABASE_URL nao configurada no ambiente ou .env.");
  }

  const expected = parseExpectedChallenges();
  const ids = expected.map((challenge) => challenge.id);
  const valuesSql = expected
    .map((challenge, index) => `(${quoteSql(challenge.id)}::uuid, ${quoteSql(challenge.prompt)}, $${index + 1}::text[])`)
    .join(",");

  const pool = new Pool({
    connectionString: connectionString.replace(/\?.*$/, ""),
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 1_000,
  });

  try {
    const [history, column, comparison, hints, protectedCounts] = await Promise.all([
      pool.query(`
        select version, name
        from supabase_migrations.schema_migrations
        where version in ('20260703000100', '20260703000200')
        order by version
      `).catch((error) => ({ rows: [], error: error.message })),
      pool.query(`
        select column_name, data_type, udt_name, is_nullable, column_default
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'challenges'
          and column_name = 'expected_columns'
      `),
      pool.query(`
        with expected(id, prompt, expected_columns) as (values ${valuesSql}),
        actual as (
          select c.id, c.prompt, c.expected_columns
          from public.challenges c
          join expected e on e.id = c.id
        )
        select
          (select count(*) from expected)::int as expected_count,
          count(a.id)::int as found_count,
          count(*) filter (where a.expected_columns = e.expected_columns)::int as matching_columns,
          count(*) filter (where a.prompt = e.prompt)::int as matching_prompts,
          count(*) filter (where cardinality(a.expected_columns) > 0)::int as nonempty_columns,
          coalesce(
            array_agg(e.id::text order by e.id) filter (
              where a.id is null
                 or a.expected_columns is distinct from e.expected_columns
                 or a.prompt is distinct from e.prompt
            ),
            '{}'
          ) as mismatches
        from expected e
        left join actual a on a.id = e.id
      `, expected.map((challenge) => challenge.columns)),
      pool.query(`
        select count(*)::int as hints_count, count(distinct challenge_id)::int as challenge_count
        from public.challenge_hints
        where challenge_id = any($1::uuid[])
      `, [ids]),
      pool.query(`
        select
          (select count(*)::int from public.profiles) as profiles,
          (select count(*)::int from public.attempts) as attempts,
          (select count(*)::int from public.user_challenge_progress) as user_challenge_progress,
          (select count(*)::int from public.point_events) as point_events
      `),
    ]);

    console.log(JSON.stringify({
      migration_history: history.rows,
      migration_history_error: history.error ?? null,
      column: column.rows[0] ?? null,
      comparison: comparison.rows[0],
      hints: hints.rows[0],
      protected_table_counts: protectedCounts.rows[0],
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message, code: error.code ?? null }, null, 2));
  process.exit(1);
});
