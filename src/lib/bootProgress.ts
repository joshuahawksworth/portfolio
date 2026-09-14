/**
 * The boot screen's progress, worked out from the time since it mounted rather than left to
 * CSS animations. Anything that flattens animations (a Reduce Motion setting, an extension's
 * stylesheet, a tab that was hidden while it loaded) used to snap the bar to full and freeze
 * the Windows spinner; a clock-driven value keeps them honest whatever the styles do.
 */

/** How long the boot screen stays up, from mount to the login screen. */
export const BOOT_MS = 4200;
/** The boot screen starts fading to black this long after mounting. */
export const BOOT_FADE_AT_MS = 3600;

const BAR_START_MS = 1100;
const BAR_MS = 2500; // full just as the fade to black begins
const LOGO_START_MS = 900;
const LOGO_MS = 2600;

const SPINNER_START_MS = 700;
const SPINNER_DOT_STAGGER_MS = 120;
const SPINNER_PERIOD_MS = 2200;

/** Quadratic ease-in-out: slow off the mark, slow to settle. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) * (-2 * x + 2)) / 2;
}

// Loading feels real when it rushes off and then crawls: the stops the bar and the logo
// fill pass through (fraction of the run, fraction of the distance).
const STOPS: [number, number][] = [
  [0, 0],
  [0.4, 0.55],
  [0.7, 0.78],
  [0.9, 0.92],
  [1, 1],
];

/** 0–1 along the loading curve for a 0–1 fraction of the run, eased between the stops. */
export function loadingCurve(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, v0] = STOPS[i];
    const [t1, v1] = STOPS[i + 1];
    if (x <= t1) return v0 + (v1 - v0) * easeInOut((x - t0) / (t1 - t0));
  }
  return 1;
}

/** How full the macOS-style progress bar is (0–1) `elapsed` ms after the boot screen mounted. */
export function bootProgress(elapsed: number): number {
  return loadingCurve((elapsed - BAR_START_MS) / BAR_MS);
}

/** How far the JH logo has filled from the bottom (0–1). */
export function logoFill(elapsed: number): number {
  return loadingCurve((elapsed - LOGO_START_MS) / LOGO_MS);
}

/**
 * Where one dot of the Windows spinner is: its rotation in degrees and opacity. Each dot
 * starts a little after the one before, sweeps a full turn, fades out and goes again.
 */
export function spinnerDot(elapsed: number, index: number): { angle: number; opacity: number } {
  const local = elapsed - SPINNER_START_MS - index * SPINNER_DOT_STAGGER_MS;
  if (local < 0) return { angle: 0, opacity: 0 };
  const t = (local % SPINNER_PERIOD_MS) / SPINNER_PERIOD_MS;
  const angle = 360 * easeInOut(t / 0.9);
  const opacity = t < 0.08 ? t / 0.08 : t < 0.82 ? 1 : t < 0.9 ? 1 - (t - 0.82) / 0.08 : 0;
  return { angle, opacity };
}
