import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeaderboard, postLeaderboardScore } from '../lib/leaderboard';

function parseBody(req: VercelRequest): { name?: string; score?: number } {
  const raw = req.body;
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Buffer.isBuffer(raw))
    return raw as { name?: string; score?: number };
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  try {
    return JSON.parse(text) as { name?: string; score?: number };
  } catch {
    return {};
  }
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
      const result = await postLeaderboardScore(String(body.name ?? ''), Number(body.score));
      if (!result.ok) return res.status(400).json({ error: result.error });
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('leaderboard error', err);
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(500).json({ error: 'Leaderboard unavailable' });
  }
}
