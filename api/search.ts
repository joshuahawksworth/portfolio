import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchWeb } from './search-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) return res.status(400).json({ error: 'Search query is too short' });

  const page = Number(req.query.page ?? 1);
  const response = await searchWeb(query, page);
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  return res.status(200).json(response);
}
