/**
 * Snake high scores, kept on this device only.
 *
 * The board is personal: it records the visitor's own best runs in localStorage rather
 * than a shared, server-backed table, so there is nothing to host and nothing to moderate.
 * The async signatures are kept so the game and its tests don't care where scores live.
 */
export interface LeaderboardEntry {
  name: string;
  score: number;
  /** Set on the entry from the run that has just finished. */
  pending?: boolean;
  /** Unix ms when the score was recorded. */
  at?: number;
}

export const LEADERBOARD_LIMIT = 5;

const STORAGE_KEY = 'portfolio.snake.scores';

function readAll(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is LeaderboardEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as LeaderboardEntry).name === 'string' &&
          Number.isInteger((e as LeaderboardEntry).score)
      )
      .map((e) => ({ name: e.name.toUpperCase().slice(0, 3), score: e.score, at: e.at }));
  } catch {
    return [];
  }
}

function writeAll(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* private mode or quota: the board simply won't persist */
  }
}

function sorted(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || (a.at ?? 0) - (b.at ?? 0));
}

/** The visitor's best scores, highest first, at most LEADERBOARD_LIMIT. */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return sorted(readAll()).slice(0, LEADERBOARD_LIMIT);
}

/** Record a finished run. Returns false only if the score isn't a positive integer. */
export async function submitLeaderboardScore(name: string, score: number): Promise<boolean> {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  if (!clean || !Number.isInteger(score) || score < 1) return false;
  const next = sorted([...readAll(), { name: clean, score, at: Date.now() }]).slice(
    0,
    LEADERBOARD_LIMIT * 4
  );
  writeAll(next);
  return true;
}

/** Wipe the local board (used by the Terminal's `snake reset`). */
export function clearLeaderboard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
