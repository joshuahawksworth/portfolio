import type { VercelRequest, VercelResponse } from '@vercel/node';

const TABLE = 'snake_leaderboard';
const LEADERBOARD_LIMIT = 5;

type LeaderboardRow = {
  name: string;
  score: number;
  created_at?: string;
};

function parseBody(req: VercelRequest): { name?: string; score?: number } {
  const raw = req.body;
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw as { name?: string; score?: number };
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  try {
    return JSON.parse(text) as { name?: string; score?: number };
  } catch {
    return {};
  }
}

function supaHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const r = await fetch(
    `${url}/rest/v1/${TABLE}?select=name,score,created_at&order=score.desc&limit=${LEADERBOARD_LIMIT}`,
    { headers: supaHeaders(key) }
  );
  if (!r.ok) {
    console.error('leaderboard GET', r.status, await r.text());
    return [];
  }
  const data = await r.json();
  return Array.isArray(data) ? data.slice(0, LEADERBOARD_LIMIT) : [];
}

async function postScore(name: string, score: number): Promise<{ ok: boolean; error?: string }> {
  const initials = String(name)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  if (initials.length < 3) return { ok: false, error: 'Name must be 3 letters (A–Z)' };
  if (!Number.isInteger(score) || score < 1) {
    return { ok: false, error: 'Score must be a positive integer' };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, error: 'Leaderboard not configured' };

  const r = await fetch(`${url}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: supaHeaders(key, { Prefer: 'return=minimal' }),
    body: JSON.stringify({ name: initials, score }),
  });
  if (!r.ok) {
    console.error('leaderboard POST', r.status, await r.text());
    return { ok: false, error: 'Failed to save score' };
  }
  return { ok: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getLeaderboard());
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const result = await postScore(String(body.name ?? ''), Number(body.score));
      if (!result.ok) return res.status(400).json({ error: result.error });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('leaderboard error', err);
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(500).json({ error: 'Leaderboard unavailable' });
  }
}
