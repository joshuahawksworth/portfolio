import pg from 'pg';

const { Pool } = pg;
const TABLE = 'snake_leaderboard';
const DEFAULT_LOCAL_DATABASE_URL = 'postgres://portfolio:portfolio@localhost:5433/portfolio';
const LEADERBOARD_LIMIT = 5;

type LeaderboardRow = {
  name: string;
  score: number;
  created_at?: string;
};

const fallbackStore = globalThis as typeof globalThis & {
  __snakeLeaderboardFallback?: LeaderboardRow[];
  __snakeLeaderboardPools?: Map<string, pg.Pool>;
};

function fallbackRows() {
  if (!fallbackStore.__snakeLeaderboardFallback) fallbackStore.__snakeLeaderboardFallback = [];
  return fallbackStore.__snakeLeaderboardFallback;
}

function topScores(rows: LeaderboardRow[]) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, LEADERBOARD_LIMIT);
}

function getDatabaseUrl(env?: NodeJS.ProcessEnv) {
  return env?.DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_LOCAL_DATABASE_URL;
}

function getPool(env?: NodeJS.ProcessEnv) {
  const connectionString = getDatabaseUrl(env);
  if (!connectionString) return null;

  if (!fallbackStore.__snakeLeaderboardPools) fallbackStore.__snakeLeaderboardPools = new Map();
  const existing = fallbackStore.__snakeLeaderboardPools.get(connectionString);
  if (existing) return existing;

  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
  });
  fallbackStore.__snakeLeaderboardPools.set(connectionString, pool);
  return pool;
}

export async function getLeaderboard(env?: NodeJS.ProcessEnv): Promise<LeaderboardRow[]> {
  const pool = getPool(env);
  if (!pool) return topScores(fallbackRows());

  try {
    const result = await pool.query<LeaderboardRow>(
      `
        select name, score, created_at
        from ${TABLE}
        order by score desc, created_at asc
        limit $1
      `,
      [LEADERBOARD_LIMIT]
    );
    return result.rows;
  } catch (err) {
    console.error('leaderboard GET failed', err);
    return topScores(fallbackRows());
  }
}

export async function postLeaderboardScore(
  name: string,
  score: number,
  env?: NodeJS.ProcessEnv
): Promise<{ ok: true; fallback?: boolean } | { ok: false; error: string }> {
  const initials = String(name)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  if (initials.length < 3) return { ok: false, error: 'Name must be 3 letters (A–Z)' };
  if (!Number.isInteger(score) || score < 1) {
    return { ok: false, error: 'Score must be a positive integer' };
  }

  const localRow: LeaderboardRow = { name: initials, score, created_at: new Date().toISOString() };
  const pool = getPool(env);

  if (!pool) {
    fallbackRows().push(localRow);
    return { ok: true, fallback: true };
  }

  try {
    await pool.query(
      `
        insert into ${TABLE} (name, score)
        values ($1, $2)
      `,
      [initials, score]
    );
    return { ok: true };
  } catch (err) {
    console.error('leaderboard POST failed', err);
    fallbackRows().push(localRow);
    return { ok: true, fallback: true };
  }
}
