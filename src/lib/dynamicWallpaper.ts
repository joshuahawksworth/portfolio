/**
 * Time of day for dynamic wallpapers. Like a macOS dynamic desktop, the picture moves through
 * dawn, day, dusk and night frames that cross-fade on the visitor's clock. The fades hang off
 * sunrise and sunset, which follow the date, so a summer evening stays light until late and a
 * winter one goes dark by tea time.
 */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** The frames layered over the day image, bottom to top. */
export const DYNAMIC_FRAMES = ['dawn', 'dusk', 'night'] as const;
export type DynamicFrame = (typeof DYNAMIC_FRAMES)[number];

export interface DynamicLook {
  /** The frame that dominates right now (what a single still, such as the lock screen, shows). */
  phase: DayPhase;
  /** Opacity of the dawn frame, stacked directly over the day image. */
  dawn: number;
  /** Opacity of the dusk frame, above dawn. */
  dusk: number;
  /** Opacity of the night frame, on top. */
  night: number;
  /** Dark enough that shell text should flip to white. */
  dark: boolean;
}

/** Sunrise and sunset as decimal hours on the local clock. */
export interface SunTimes {
  sunrise: number;
  sunset: number;
}

/** Latitude the day length is worked out for: Manchester, the portfolio's home. */
export const HOME_LATITUDE = 53.5;

/** Used when no date is to hand: an equinox-ish day. */
export const DEFAULT_SUN: SunTimes = { sunrise: 6.5, sunset: 19 };

// How long each fade takes, in hours, relative to sunrise (S) and sunset (T):
const NIGHT_TO_DAWN = 1; // night lifts across S-1 .. S
const DAWN_TO_DAY = 1; // dawn colours fade across S .. S+1
const DAY_TO_DUSK = 1.5; // the sun sinks across T-1.5 .. T
const DUSK_TO_NIGHT = 1.2; // dusk darkens into night across T .. T+1.2
// A frame that is fully covered by the one above it is switched off (or on) out of sight, this
// long after the covering frame has become opaque, so the 60 s CSS fade never shows the swap.
const HIDDEN_SWAP_MARGIN = 0.8;

function ramp(from: number, to: number, x: number): number {
  return Math.min(1, Math.max(0, (x - from) / (to - from)));
}

const RAD = Math.PI / 180;

/**
 * Sunrise and sunset for a date at a latitude, on the local clock. A textbook approximation
 * (solar declination and the sunrise hour angle, ignoring the equation of time) that lands
 * within about a quarter of an hour, which is plenty for fades that last an hour or more.
 * Solar noon is taken as 12:00 local mean time, pushed later by however far the visitor's
 * clock is on summer time.
 */
export function sunTimesFor(date: Date, latitude = HOME_LATITUDE): SunTimes {
  const lat = Math.min(60, Math.max(-60, latitude)) * RAD;
  const dayOfYear =
    Math.floor(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        Date.UTC(date.getFullYear(), 0, 1)) /
        86_400_000
    ) + 1;
  const declination = 23.44 * RAD * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear));
  // The sun's centre counts as risen 0.833° below the horizon (refraction plus its radius).
  const cosHourAngle =
    (Math.cos(90.833 * RAD) - Math.sin(lat) * Math.sin(declination)) /
    (Math.cos(lat) * Math.cos(declination));
  const halfDay = Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) / RAD / 15;
  const noon = 12 + summerTimeShift(date);
  return { sunrise: noon - halfDay, sunset: noon + halfDay };
}

/** Hours the local clock is ahead of standard time on `date` (1 during British Summer Time). */
function summerTimeShift(date: Date): number {
  const year = date.getFullYear();
  const standard = Math.max(
    new Date(year, 0, 1).getTimezoneOffset(),
    new Date(year, 6, 1).getTimezoneOffset()
  );
  return (standard - date.getTimezoneOffset()) / 60;
}

/** The look for a moment in the day (hours as a decimal, 0–24) given that day's sun times. */
export function dynamicLookAt(hours: number, sun: SunTimes = DEFAULT_SUN): DynamicLook {
  const { sunrise, sunset } = sun;

  let night = 0;
  if (hours >= sunset) night = ramp(sunset, sunset + DUSK_TO_NIGHT, hours);
  else if (hours < sunrise) night = 1 - ramp(sunrise - NIGHT_TO_DAWN, sunrise, hours);

  let dusk = 0;
  if (hours >= sunset - DAY_TO_DUSK && hours < sunset)
    dusk = ramp(sunset - DAY_TO_DUSK, sunset, hours);
  else if (hours >= sunset && hours < sunset + DUSK_TO_NIGHT + HIDDEN_SWAP_MARGIN) dusk = 1;

  let dawn = 0;
  if (hours >= sunrise - NIGHT_TO_DAWN - HIDDEN_SWAP_MARGIN && hours < sunrise) dawn = 1;
  else if (hours >= sunrise && hours < sunrise + DAWN_TO_DAY)
    dawn = 1 - ramp(sunrise, sunrise + DAWN_TO_DAY, hours);

  const phase: DayPhase =
    night >= 0.5 ? 'night' : dusk >= 0.5 ? 'dusk' : dawn >= 0.5 ? 'dawn' : 'day';
  // Every frame but the day one has a deep sky behind the menu bar.
  return { phase, dawn, dusk, night, dark: phase !== 'day' };
}

export function dynamicLookFor(date = new Date()): DynamicLook {
  return dynamicLookAt(date.getHours() + date.getMinutes() / 60, sunTimesFor(date));
}
