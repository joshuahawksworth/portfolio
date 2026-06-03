export const SNAKE_LEADERBOARD_TABLE = 'snake_leaderboard';

export type LeaderboardRow = {
  name: string;
  score: number;
  created_at?: string;
};

const fallbackStore = globalThis as typeof globalThis & {
  __snakeLeaderboardFallback?: LeaderboardRow[];
};

function fallbackRows() {
  if (!fallbackStore.__snakeLeaderboardFallback) fallbackStore.__snakeLeaderboardFallback = [];
  return fallbackStore.__snakeLeaderboardFallback;
}

export function topTen(rows: LeaderboardRow[]) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, 10);
}

function supa(path: string, init?: RequestInit, env?: NodeJS.ProcessEnv) {
  const url = env?.SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = env?.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function getLeaderboard(env?: NodeJS.ProcessEnv): Promise<LeaderboardRow[]> {
  const request = supa(
    `${SNAKE_LEADERBOARD_TABLE}?select=name,score,created_at&order=score.desc&limit=10`,
    undefined,
    env
  );
  if (!request) return topTen(fallbackRows());

  const r = await request;
  if (!r.ok) return topTen(fallbackRows());

  const data = await r.json();
  return Array.isArray(data) ? data : topTen(fallbackRows());
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
  const request = supa(SNAKE_LEADERBOARD_TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(localRow),
  }, env);

  if (!request) {
    fallbackRows().push(localRow);
    return { ok: true, fallback: true };
  }

  const r = await request;
  if (!r.ok) fallbackRows().push(localRow);
  return { ok: true, fallback: !r.ok };
}
