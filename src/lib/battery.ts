/** The simulated machine is always on mains, so it reports a full charge everywhere. */
export const BATTERY_LEVEL = 100;

/** Geometry of the battery glyph, in viewBox units; the nub sits to the right of the body. */
export const BATTERY_GLYPH = {
  viewW: 27,
  viewH: 12,
  body: { x: 0.5, y: 0.5, w: 22, h: 11, r: 3 },
  fill: { x: 2, y: 2, w: 19, h: 8, r: 1.8 },
} as const;

/** Clamp to a whole number between 0 and 100 so the fill never overshoots the body. */
export function clampBatteryLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(100, Math.max(0, Math.round(level)));
}

/** Width of the filled part of the body for a given level, in viewBox units. */
export function batteryFillWidth(level: number): number {
  return (BATTERY_GLYPH.fill.w * clampBatteryLevel(level)) / 100;
}
