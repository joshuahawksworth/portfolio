/** Optical presets aligned with liquid-dom showcase demos. */

export const GLASS_BACKDROP_Z = -3;
export const GLASS_ICONS_Z = 0;

export const glassPanel = {
  blur: 8,
  spacing: 0,
  thickness: 90,
  displacementBlur: 6,
  bezelWidth: 20,
  tint: { r: 1, g: 1, b: 1, a: 0.1 },
  shadowColor: { r: 0, g: 0, b: 0, a: 0.12 },
  shadowOffsetY: 12,
  shadowBlur: 28,
  specularOpacity: 0.5,
  specularFalloff: 1,
  specularWidth: 1,
  specularStrength: 1,
  specularSharpness: 2,
  oppositeSpecularStrength: 0.35,
} as const;

export const glassWindow = {
  ...glassPanel,
  blur: 6,
  thickness: 90,
  bezelWidth: 24,
  displacementBlur: 5,
  tint: { r: 1, g: 1, b: 1, a: 0.11 },
  shadowColor: { r: 0, g: 0, b: 0, a: 0.18 },
  shadowOffsetY: 18,
  shadowBlur: 40,
} as const;

export const glassDock = {
  blur: 8,
  spacing: 0,
  thickness: 90,
  displacementBlur: 6,
  bezelWidth: 20,
  tint: { r: 1, g: 1, b: 1, a: 0.1 },
  shadowColor: { r: 0, g: 0, b: 0, a: 0.14 },
  shadowOffsetY: 10,
  shadowBlur: 24,
  specularOpacity: 0.55,
  specularFalloff: 1,
  specularWidth: 1,
  specularStrength: 1,
  specularSharpness: 2,
} as const;

export const glassMenuBar = {
  blur: 12,
  spacing: 0,
  thickness: 28,
  bezelWidth: 0,
  displacementBlur: 4,
  tint: { r: 1, g: 1, b: 1, a: 0.08 },
  shadowColor: { r: 0, g: 0, b: 0, a: 0.08 },
  shadowOffsetY: 4,
  shadowBlur: 12,
  specularOpacity: 0.35,
  specularFalloff: 1,
} as const;
