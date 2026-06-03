import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Global Snake leaderboard backed by Supabase.
 *
 * Required environment variables (set in Vercel dashboard or .env.local):
 *   SUPABASE_URL       – e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  – anon/public key from Project Settings → API
 *
 * One-time Supabase SQL setup:
 *   CREATE TABLE snake_leaderboard (
 *     id         bigserial PRIMARY KEY,
 *     name       TEXT NOT NULL,
 *     score      INTEGER NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   );
 *   ALTER TABLE snake_leaderboard ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "public read"   ON snake_leaderboard FOR SELECT USING (true);
 *   CREATE POLICY "public insert" ON snake_leaderboard FOR INSERT WITH CHECK (score > 0);
 */

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
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const request = supa(`${TABLE}?select=name,score,created_at&order=score.desc&limit=10`);
      if (!request) return res.status(200).json(topTen(fallbackRows()));

      const r = await request;
      if (!r.ok) return res.status(200).json(topTen(fallbackRows()));

      const data = await r.json();
      return res.status(200).json(Array.isArray(data) ? data : topTen(fallbackRows()));
    }

    if (req.method === 'POST') {
      const { name, score } = (req.body ?? {}) as { name?: string; score?: number };
      const initials = String(name ?? '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3);
      if (initials.length < 3)
        return res.status(400).json({ error: 'Name must be 3 letters (A–Z)' });
      if (typeof score !== 'number' || score < 1 || !Number.isInteger(score)) {
        return res.status(400).json({ error: 'Score must be a positive integer' });
      }

      const localRow = { name: initials, score, created_at: new Date().toISOString() };
      const request = supa(TABLE, {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(localRow),
      });

      if (!request) {
        fallbackRows().push(localRow);
        return res.status(200).json({ ok: true, fallback: true });
      }

      const r = await request;
      if (!r.ok) fallbackRows().push(localRow);
      return res.status(200).json({ ok: true, fallback: !r.ok });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch {
    return res.status(200).json(topTen(fallbackRows()));
  }
}
