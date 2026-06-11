export interface LeaderboardEntry {
  name: string;
  score: number;
  pending?: boolean;
}

export const LEADERBOARD_LIMIT = 5;

const FETCH_TIMEOUT_MS = 6000;

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
}

async function fetchBoardApi(): Promise<LeaderboardEntry[]> {
  const r = await fetchWithTimeout('/api/leaderboard');
  return r.ok ? r.json() : [];
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    return (await fetchBoardApi()).slice(0, LEADERBOARD_LIMIT);
  } catch {
    return [];
  }
}

async function submitScoreApi(name: string, score: number): Promise<boolean> {
  const r = await fetchWithTimeout('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score }),
  });
  return r.ok;
}

export async function submitLeaderboardScore(name: string, score: number): Promise<boolean> {
  try {
    return await submitScoreApi(name, score);
  } catch {
    return false;
  }
}
