const TABLE = 'snake_leaderboard';

type LeaderboardRow = {
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

const LEADERBOARD_LIMIT = 5;

function topScores(rows: LeaderboardRow[]) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, LEADERBOARD_LIMIT);
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
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function getLeaderboard(env?: NodeJS.ProcessEnv): Promise<LeaderboardRow[]> {
  const request = supa(
    `${TABLE}?select=name,score,created_at&order=score.desc&limit=${LEADERBOARD_LIMIT}`,
    undefined,
    env
  );
  if (!request) return topScores(fallbackRows());

  const r = await request;
  if (!r.ok) {
    console.error('leaderboard GET failed', r.status, await r.text());
    return topScores(fallbackRows());
  }

  const data = await r.json();
  return Array.isArray(data) ? data.slice(0, LEADERBOARD_LIMIT) : topScores(fallbackRows());
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
  const request = supa(TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ name: initials, score }),
  }, env);

  if (!request) {
    fallbackRows().push(localRow);
    return { ok: true, fallback: true };
  }

  const r = await request;
  if (!r.ok) {
    console.error('leaderboard POST failed', r.status, await r.text());
    fallbackRows().push(localRow);
  }
  return { ok: true, fallback: !r.ok };
}
