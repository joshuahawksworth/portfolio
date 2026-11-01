/**
 * When to start the next chunk of emulator sound so it stays in step with the picture.
 *
 * The chunks arrive in real time and each is queued to start where the last one ends. While
 * the AudioContext is not running (iOS keeps it suspended until the first touch, and
 * interrupts it for calls and the ringer switch) its clock stands still, so queuing on
 * regardless builds a backlog that then plays out late for the rest of the game: that was a
 * three-to-four-second lag on phones. Chunks that cannot play on time are dropped instead.
 */

/** How far ahead of the clock the queue may run before chunks are dropped, in seconds. */
export const MAX_LEAD = 0.3;

/** The start time for a chunk arriving now, or null to drop it. */
export function soundStart(
  now: number,
  queuedUntil: number,
  running: boolean,
  maxLead = MAX_LEAD
): number | null {
  if (!running) return null;
  if (queuedUntil - now > maxLead) return null;
  return Math.max(now, queuedUntil);
}
