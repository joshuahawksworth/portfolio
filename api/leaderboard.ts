export const config = { runtime: 'edge' };

const TABLE = 'snake_leaderboard';

type LeaderboardRow = {
  name: string;
  score: number;
  created_at?: string;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function topTen(rows: LeaderboardRow[]) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, 10);
}

function supa(path: string, init?: RequestInit) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
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

async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const request = supa(`${TABLE}?select=name,score,created_at&order=score.desc&limit=10`);
  if (!request) return [];

  const r = await request;
  if (!r.ok) {
    console.error('leaderboard GET failed', r.status, await r.text());
    return [];
  }

  const data = await r.json();
  return Array.isArray(data) ? topTen(data) : [];
}

async function postLeaderboardScore(
  name: string,
  score: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const initials = String(name)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  if (initials.length < 3) return { ok: false, error: 'Name must be 3 letters (A–Z)' };
  if (!Number.isInteger(score) || score < 1) {
    return { ok: false, error: 'Score must be a positive integer' };
  }

  const request = supa(TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ name: initials, score }),
  });

  if (!request) return { ok: true };

  const r = await request;
  if (!r.ok) console.error('leaderboard POST failed', r.status, await r.text());
  return { ok: true };
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }

  try {
    if (request.method === 'GET') {
      return json(await getLeaderboard());
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as { name?: string; score?: number };
      const result = await postLeaderboardScore(String(body.name ?? ''), Number(body.score));
      if (!result.ok) return json({ error: result.error }, 400);
      return json(result);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('leaderboard handler error', err);
    if (request.method === 'GET') return json([]);
    return json({ error: 'Leaderboard unavailable' }, 500);
  }
}
