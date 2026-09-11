/**
 * Time-of-day for dynamic wallpapers: how far into night we are (drives the night image
 * cross-fade) and a tint that warms the scene at dawn and dusk, like macOS's dynamic
 * desktops moving through the day.
 */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface DynamicLook {
  phase: DayPhase;
  /** 0 at midday, 1 in the middle of the night. */
  night: number;
  /** CSS background for the tint layer over the day image. */
  overlay: string;
  /** Opacity of that tint layer. */
  overlayOpacity: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** The look for a moment in the day (hours as a decimal, 0–24). */
export function dynamicLookAt(hours: number): DynamicLook {
  if (hours >= 5 && hours < 7.5) {
    // Dawn: night fades out, a pink-gold glow lifts off the horizon.
    const t = (hours - 5) / 2.5;
    return {
      phase: 'dawn',
      night: lerp(1, 0, t),
      overlay:
        'linear-gradient(180deg, rgba(255, 168, 120, 0.55) 0%, rgba(255, 210, 140, 0.25) 45%, rgba(20, 40, 80, 0.35) 100%)',
      overlayOpacity: lerp(0.9, 0, t),
    };
  }
  if (hours >= 7.5 && hours < 17) {
    return { phase: 'day', night: 0, overlay: 'none', overlayOpacity: 0 };
  }
  if (hours >= 17 && hours < 19.5) {
    // Dusk: warm orange low sun, shadows creeping in.
    const t = (hours - 17) / 2.5;
    return {
      phase: 'dusk',
      night: lerp(0, 0.35, t),
      overlay:
        'linear-gradient(180deg, rgba(255, 140, 70, 0.5) 0%, rgba(255, 110, 90, 0.3) 40%, rgba(40, 20, 60, 0.45) 100%)',
      overlayOpacity: lerp(0.15, 0.85, t),
    };
  }
  if (hours >= 19.5 && hours < 21.5) {
    // Evening: dusk settles into night.
    const t = (hours - 19.5) / 2;
    return {
      phase: 'night',
      night: lerp(0.35, 1, t),
      overlay: 'linear-gradient(180deg, rgba(10, 20, 60, 0.6) 0%, rgba(20, 30, 70, 0.5) 100%)',
      overlayOpacity: lerp(0.5, 0.9, t),
    };
  }
  return {
    phase: 'night',
    night: 1,
    overlay: 'linear-gradient(180deg, rgba(8, 16, 50, 0.72) 0%, rgba(16, 24, 64, 0.6) 100%)',
    overlayOpacity: 0.9,
  };
}

export function dynamicLookFor(date = new Date()): DynamicLook {
  return dynamicLookAt(date.getHours() + date.getMinutes() / 60);
}
