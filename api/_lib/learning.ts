import type { Challenge, ChallengeStatus, ChallengeType, Difficulty, LearningModule, ModuleStatus, RankingUser, UserProfile } from "../../src/shared/types/sql-arena.js";
import { queryAdminDb } from "./admin-db.js";

type ModuleChallengeRow = {
  module_id: string;
  module_title: string;
  module_description: string | null;
  module_sort_order: number;
  challenge_id: string | null;
  slug: string | null;
  type: ChallengeType | null;
  difficulty: Difficulty | null;
  title: string | null;
  prompt: string | null;
  starter_sql: string | null;
  expected_columns: string[] | null;
  allowed_tables: string[] | null;
  base_points: number | null;
  explanation: string | null;
  challenge_sort_order: number | null;
  completed: boolean | null;
  unlocked: boolean | null;
};

type HintRow = {
  challenge_id: string;
  content: string;
};

export async function getLearningModulesForUser(userId: string): Promise<LearningModule[]> {
  const { rows } = await queryAdminDb<ModuleChallengeRow>(
    `
      select
        m.id as module_id,
        m.title as module_title,
        m.description as module_description,
        m.sort_order as module_sort_order,
        c.id as challenge_id,
        c.slug,
        c.type,
        c.difficulty,
        c.title,
        c.prompt,
        c.starter_sql,
        c.expected_columns,
        c.allowed_tables,
        c.base_points,
        c.explanation,
        c.sort_order as challenge_sort_order,
        (ucp.challenge_id is not null) as completed,
        case
          when c.id is null then false
          else private.is_challenge_unlocked($1::uuid, c.id)
        end as unlocked
      from public.modules m
      left join public.challenges c
        on c.module_id = m.id
       and c.is_active = true
      left join public.user_challenge_progress ucp
        on ucp.challenge_id = c.id
       and ucp.user_id = $1::uuid
      where m.is_active = true
      order by m.sort_order asc, c.sort_order asc
    `,
    [userId],
  );

  const visibleChallengeIds = rows
    .filter((row) => row.challenge_id && (row.completed || row.unlocked))
    .map((row) => row.challenge_id as string);
  const hintsByChallenge = await getHintsByChallenge(visibleChallengeIds);

  const modules = new Map<string, LearningModule>();
  for (const row of rows) {
    const existing = modules.get(row.module_id);
    const module = existing ?? {
      id: row.module_id,
      title: row.module_title,
      description: row.module_description ?? "",
      status: "locked" as ModuleStatus,
      challenges: [],
    };

    if (row.challenge_id && row.title && row.type && row.difficulty) {
      module.challenges.push(mapChallenge(row, hintsByChallenge.get(row.challenge_id) ?? []));
    }

    modules.set(row.module_id, module);
  }

  return [...modules.values()].map((module) => ({
    ...module,
    status: getModuleStatus(module.challenges),
  }));
}

export async function getRanking(scope: "overall" | "weekly"): Promise<RankingUser[]> {
  if (scope === "overall") {
    const { rows } = await queryAdminDb<RankingRow>(
      `
        with point_totals as (
          select user_id, coalesce(sum(points), 0) as points
          from public.point_events
          group by user_id
        ),
        progress_totals as (
          select user_id, count(challenge_id) as completed_challenges
          from public.user_challenge_progress
          group by user_id
        )
        select
          p.id,
          p.username,
          p.display_name,
          p.avatar_url,
          coalesce(pt.points, 0)::int as total_xp,
          0::int as weekly_xp,
          coalesce(pr.completed_challenges, 0)::int as completed_challenges
        from public.profiles p
        left join point_totals pt on pt.user_id = p.id
        left join progress_totals pr on pr.user_id = p.id
        order by total_xp desc, completed_challenges desc, p.created_at asc
        limit 20
      `,
    );
    return rows.map(mapRankingRow);
  }

  const { rows } = await queryAdminDb<RankingRow>(
    `
      select
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        coalesce(p.total_points, 0)::int as total_xp,
        coalesce(sum(pe.points), 0)::int as weekly_xp,
        count(distinct pe.challenge_id) filter (where pe.source = 'challenge_completed' and pe.challenge_id is not null)::int as completed_challenges
      from public.point_events pe
      join public.profiles p on p.id = pe.user_id
      where pe.created_at >= $1::timestamptz
      group by p.id, p.username, p.display_name, p.avatar_url, p.total_points, p.created_at
      order by weekly_xp desc, completed_challenges desc, p.created_at asc
      limit 20
    `,
    [getWeekStartIso()],
  );

  return rows.map(mapRankingRow);
}

export async function getPublicProfileByUsername(username: string, requesterId: string): Promise<UserProfile | null> {
  const { rows } = await queryAdminDb<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    total_points: number;
    completed_count: number;
    completed_ids: string[] | null;
    weekly_xp: number;
  }>(
    `
      with progress_totals as (
        select
          user_id,
          count(challenge_id)::int as completed_count,
          coalesce(array_agg(challenge_id::text order by completed_at) filter (where challenge_id is not null), '{}') as completed_ids
        from public.user_challenge_progress
        group by user_id
      ),
      weekly_totals as (
        select user_id, coalesce(sum(points), 0)::int as weekly_xp
        from public.point_events
        where created_at >= $2::timestamptz
        group by user_id
      )
      select
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.total_points,
        coalesce(pt.completed_count, 0)::int as completed_count,
        coalesce(pt.completed_ids, '{}') as completed_ids,
        coalesce(wt.weekly_xp, 0)::int as weekly_xp
      from public.profiles p
      left join progress_totals pt on pt.user_id = p.id
      left join weekly_totals wt on wt.user_id = p.id
      where p.username = $1
      limit 1
    `,
    [username, getWeekStartIso()],
  );

  const profile = rows[0];
  if (!profile) return null;
  const isOwnProfile = profile.id === requesterId;

  return {
    id: profile.id,
    name: profile.display_name,
    username: profile.username,
    avatar: profile.display_name?.charAt(0)?.toUpperCase() || "U",
    avatarUrl: profile.avatar_url,
    totalXp: Number(profile.total_points ?? 0),
    weeklyXp: Number(profile.weekly_xp ?? 0),
    completedChallengeIds: isOwnProfile
      ? profile.completed_ids ?? []
      : Array.from({ length: Number(profile.completed_count ?? 0) }, (_, index) => `redacted-${index}`),
  };
}

type RankingRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  weekly_xp: number;
  completed_challenges: number;
};

async function getHintsByChallenge(challengeIds: string[]) {
  if (!challengeIds.length) return new Map<string, string[]>();

  const { rows } = await queryAdminDb<HintRow>(
    `
      select challenge_id, content
      from public.challenge_hints
      where challenge_id = any($1::uuid[])
      order by challenge_id, hint_order
    `,
    [challengeIds],
  );

  const hints = new Map<string, string[]>();
  for (const row of rows) {
    hints.set(row.challenge_id, [...(hints.get(row.challenge_id) ?? []), row.content]);
  }
  return hints;
}

function mapChallenge(row: ModuleChallengeRow, hints: string[]): Challenge {
  const completed = Boolean(row.completed);
  const unlocked = Boolean(row.unlocked);
  const status: ChallengeStatus = completed ? "completed" : unlocked ? "available" : "locked";
  const allowedTables = row.allowed_tables ?? [];
  const type = row.type ?? "free_select";

  if (status === "locked") {
    return {
      id: row.challenge_id as string,
      slug: row.slug ?? (row.challenge_id as string),
      moduleId: row.module_id,
      title: row.title ?? "Desafio",
      difficulty: row.difficulty ?? "easy",
      baseXp: Number(row.base_points ?? 0),
      status,
    } as Challenge;
  }

  return {
    id: row.challenge_id as string,
    slug: row.slug ?? (row.challenge_id as string),
    moduleId: row.module_id,
    type,
    title: row.title ?? "Desafio",
    statement: row.prompt ?? "",
    orderingHint: undefined,
    explanation: row.explanation ?? undefined,
    difficulty: row.difficulty ?? "easy",
    baseXp: Number(row.base_points ?? 0),
    status,
    starterSql: row.starter_sql ?? getDefaultStarterSql(type, allowedTables),
    expectedSql: "",
    setupSql: null,
    validationSql: null,
    expectedColumns: row.expected_columns ?? [],
    expectedRows: [],
    allowedTables,
    hints,
  };
}

function getModuleStatus(challenges: Challenge[]): ModuleStatus {
  if (!challenges.length) return "locked";
  if (challenges.every((challenge) => challenge.status === "completed")) return "completed";
  if (challenges.every((challenge) => challenge.status === "locked")) return "locked";
  return "in-progress";
}

function mapRankingRow(row: RankingRow): RankingUser {
  return {
    id: row.id,
    name: row.display_name,
    username: row.username,
    avatar: row.display_name?.charAt(0)?.toUpperCase() || "U",
    avatarUrl: row.avatar_url,
    totalXp: Number(row.total_xp ?? 0),
    weeklyXp: Number(row.weekly_xp ?? 0),
    completedChallenges: Number(row.completed_challenges ?? 0),
  };
}

function getDefaultStarterSql(type: ChallengeType, allowedTables: string[]) {
  const table = allowedTables[0] ?? "customers";

  switch (type) {
    case "insert_rows":
      return `INSERT INTO ${table} (...)\nVALUES (...);`;
    case "update_rows":
      return `UPDATE ${table}\nSET ...\nWHERE ...;`;
    case "delete_rows":
      return `DELETE FROM ${table}\nWHERE ...;`;
    case "create_table":
      return `CREATE TABLE ${table} (\n  id uuid PRIMARY KEY\n);`;
    case "alter_table":
      return `ALTER TABLE ${table}\nADD COLUMN ...;`;
    case "drop_table":
      return `DROP TABLE ${table};`;
    case "free_select":
    default:
      return `SELECT \nFROM ${table}\nLIMIT 10;`;
  }
}

function getWeekStartIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}
