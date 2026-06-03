import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeaderboard, postLeaderboardScore } from './leaderboard-store';

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
