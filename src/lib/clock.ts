/** Clock formatting shared by the menu bar, taskbar, status bars and lock screens. */

export interface ClockOptions {
  clock24h: boolean;
  showSeconds?: boolean;
}

export function formatTime(date: Date, { clock24h, showSeconds = false }: ClockOptions): string {
  return date.toLocaleTimeString(clock24h ? 'en-GB' : 'en-US', {
    hour: clock24h ? '2-digit' : 'numeric',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: !clock24h,
  });
}

/** Lock-screen style: "09:41" or "9:41" without an AM/PM suffix. */
export function formatLockTime(date: Date, clock24h: boolean): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  if (clock24h) return `${h.toString().padStart(2, '0')}:${m}`;
  return `${((h + 11) % 12) + 1}:${m}`;
}

/** "Monday 8 September" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "Mon 8 Sep" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "08/09/2026" style, used by the Windows taskbar. */
export function formatNumericDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
