export interface LeaderboardEntry {
  name: string;
  score: number;
  pending?: boolean;
}

const TABLE = 'snake_leaderboard';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const FETCH_TIMEOUT_MS = 6000;

function hasDirectSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supaHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
}

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
}

function normalizeInitials(name: string) {
  return String(name)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
}

async function fetchBoardDirect(): Promise<LeaderboardEntry[] | null> {
  if (!hasDirectSupabase()) return null;
  const r = await fetchWithTimeout(
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=name,score,created_at&order=score.desc&limit=10`,
    { headers: supaHeaders() }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

async function fetchBoardApi(): Promise<LeaderboardEntry[]> {
  const r = await fetchWithTimeout('/api/leaderboard');
  return r.ok ? r.json() : [];
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const direct = await fetchBoardDirect();
    if (direct) return direct;
    return await fetchBoardApi();
  } catch {
    return [];
  }
}

async function submitScoreDirect(name: string, score: number): Promise<boolean | null> {
  if (!hasDirectSupabase()) return null;
  const initials = normalizeInitials(name);
  if (initials.length < 3 || !Number.isInteger(score) || score < 1) return false;

  const r = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: supaHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ name: initials, score }),
  });
  return r.ok;
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
    const direct = await submitScoreDirect(name, score);
    if (direct !== null) return direct;
    return await submitScoreApi(name, score);
  } catch {
    return false;
  }
}
