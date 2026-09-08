/**
 * Wallpapers shared by the desktop, lock screens and mobile home screens.
 * Each rendered OS has its own set (and default); the chosen key is persisted
 * through the system settings store so every surface stays in sync.
 */
import type { OsName } from '../lib/settingsStore';

export const WALLPAPERS = {
  gold: '/wallpapers/golden-gate.jpg',
  catalina: '/wallpapers/catalina-night.jpg',
  tahoe: '/wallpapers/tahoe-day.jpg',
  wave: '/wallpapers/blue-wave.jpg',
  bloom: '/wallpapers/windows-bloom.svg',
  bloomDark: '/wallpapers/windows-bloom-dark.svg',
  spectrum: '/wallpapers/windows-spectrum.svg',
  pixel: '/wallpapers/android-pixel.svg',
  pixelDark: '/wallpapers/android-pixel-dark.svg',
  pixelCoral: '/wallpapers/android-pixel-coral.svg',
} as const;

export type WallpaperKey = keyof typeof WALLPAPERS;

export const WALLPAPER_KEYS = Object.keys(WALLPAPERS) as WallpaperKey[];

export const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  gold: 'Golden Gate',
  catalina: 'Catalina',
  tahoe: 'Tahoe',
  wave: 'Sequoia',
  bloom: 'Bloom',
  bloomDark: 'Bloom (Dark)',
  spectrum: 'Spectrum',
  pixel: 'Minimal',
  pixelDark: 'Minimal (Dark)',
  pixelCoral: 'Coral',
};

/** Wallpapers dark enough that the menu bar / status bar should flip to white text. */
export const DARK_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>([
  'catalina',
  'wave',
  'bloomDark',
  'pixelDark',
]);

const APPLE_SET: WallpaperKey[] = ['gold', 'catalina', 'tahoe', 'wave'];

export const WALLPAPERS_FOR_OS: Record<OsName, WallpaperKey[]> = {
  macos: APPLE_SET,
  ios: APPLE_SET,
  windows: ['bloom', 'bloomDark', 'spectrum'],
  android: ['pixel', 'pixelDark', 'pixelCoral'],
};

export const DEFAULT_WALLPAPER: Record<OsName, WallpaperKey> = {
  macos: 'gold',
  ios: 'catalina',
  windows: 'bloom',
  android: 'pixel',
};

const LEGACY_STORAGE_KEY = 'portfolio.wallpaper';

/** The wallpaper saved by builds before the settings store existed, if any. */
export function loadLegacyWallpaper(): WallpaperKey | null {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved && saved in WALLPAPERS ? (saved as WallpaperKey) : null;
  } catch {
    return null;
  }
}

/** Resolve the wallpaper to show for an OS from a (possibly partial) choice map. */
export function wallpaperFor(
  os: OsName,
  chosen: Partial<Record<OsName, WallpaperKey>>
): WallpaperKey {
  const key = chosen[os];
  return key && key in WALLPAPERS ? key : DEFAULT_WALLPAPER[os];
}

const preloadedFor = new Set<OsName>();
/** Warm the browser cache for one OS's set so switching wallpapers is instant. */
export function preloadWallpapers(os: OsName) {
  if (preloadedFor.has(os) || typeof Image === 'undefined') return;
  preloadedFor.add(os);
  for (const key of WALLPAPERS_FOR_OS[os]) {
    const img = new Image();
    img.decoding = 'async';
    img.src = WALLPAPERS[key];
  }
}
