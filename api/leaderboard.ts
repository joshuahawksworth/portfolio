import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeaderboard, postLeaderboardScore } from './leaderboard-store';

/**
 * Global Snake leaderboard backed by Supabase.
 *
 * Required environment variables (Vercel dashboard or .env.local):
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
      const { name, score } = (req.body ?? {}) as { name?: string; score?: number };
      const result = await postLeaderboardScore(String(name ?? ''), Number(score));
      if (!result.ok) return res.status(400).json({ error: result.error });
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch {
    return res.status(200).json(await getLeaderboard());
  }
}
