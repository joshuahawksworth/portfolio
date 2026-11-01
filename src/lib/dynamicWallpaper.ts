/**
 * Time of day for dynamic wallpapers, the way a macOS dynamic desktop does it. The picture is
 * a ring of frames taken through one day (Apple's The Beach has eight, from midnight round to
 * 9 pm); at any moment the two frames either side of "now" are blended, so the sky moves
 * continuously rather than switching. Apple anchors its frames to the sun, so the 6 am frame
 * is sunrise and the 6 pm frame is sunset wherever and whenever you are; here the visitor's
 * clock is warped the same way, with sunrise and sunset worked out for the date, so a summer
 * evening stays light until late and a winter one goes dark by tea time.
 */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** How many frames a dynamic wallpaper has, evenly spaced round the (solar) day. */
export const DYNAMIC_FRAME_COUNT = 8;

/** The nominal hour each frame was made for: frame 2 is sunrise, frame 6 sunset. */
const FRAME_HOURS = 24 / DYNAMIC_FRAME_COUNT;
const SUNRISE_FRAME = 2;
const SUNSET_FRAME = 6;

/** Frames whose sky is dark enough that shell text should flip to white. */
const DARK_FRAMES = new Set([0, 1, 6, 7]);

export interface DynamicLook {
  /** The frame underneath right now. */
  from: number;
  /** The frame being blended in over it. */
  to: number;
  /** How far the blend has gone, 0 (all `from`) to 1 (all `to`). */
  mix: number;
  /** The frame that dominates (what a single still, such as the lock screen, shows). */
  frame: number;
  /** A name for that frame, for anything that wants words rather than a number. */
  phase: DayPhase;
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

/**
 * Where on the frame ring a moment falls, in nominal hours (0–24): daylight is stretched or
 * squeezed to fit between the sunrise and sunset frames, night to fit the rest.
 */
export function nominalHour(hours: number, sun: SunTimes = DEFAULT_SUN): number {
  const { sunrise, sunset } = sun;
  const dayLength = sunset - sunrise;
  const dawnHour = SUNRISE_FRAME * FRAME_HOURS;
  const duskHour = SUNSET_FRAME * FRAME_HOURS;
  if (hours >= sunrise && hours < sunset) {
    return dawnHour + ((hours - sunrise) / dayLength) * (duskHour - dawnHour);
  }
  const sinceSunset = hours >= sunset ? hours - sunset : hours + 24 - sunset;
  return (duskHour + (sinceSunset / (24 - dayLength)) * (24 - (duskHour - dawnHour))) % 24;
}

function phaseOf(frame: number): DayPhase {
  if (frame === SUNRISE_FRAME) return 'dawn';
  if (frame === SUNSET_FRAME) return 'dusk';
  if (frame > SUNRISE_FRAME && frame < SUNSET_FRAME) return 'day';
  return 'night';
}

/** The look for a moment in the day (hours as a decimal, 0–24) given that day's sun times. */
export function dynamicLookAt(hours: number, sun: SunTimes = DEFAULT_SUN): DynamicLook {
  const position = nominalHour(hours, sun) / FRAME_HOURS;
  const from = Math.floor(position) % DYNAMIC_FRAME_COUNT;
  const to = (from + 1) % DYNAMIC_FRAME_COUNT;
  const mix = position - Math.floor(position);
  const frame = mix < 0.5 ? from : to;
  return { from, to, mix, frame, phase: phaseOf(frame), dark: DARK_FRAMES.has(frame) };
}

export function dynamicLookFor(date = new Date()): DynamicLook {
  return dynamicLookAt(date.getHours() + date.getMinutes() / 60, sunTimesFor(date));
}
