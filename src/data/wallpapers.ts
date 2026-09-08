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
  // Optional real Windows backgrounds. Microsoft's wallpapers are copyrighted, so they are
  // not shipped with the repo: drop your own copies into public/wallpapers/ under these
  // names and they appear in the Windows set automatically (see OPTIONAL_WALLPAPERS).
  win11: '/wallpapers/windows-11-bloom.jpg',
  win10: '/wallpapers/windows-10-hero.jpg',
  win7: '/wallpapers/windows-7-harmony.jpg',
  winxp: '/wallpapers/windows-xp-bliss.jpg',
} as const;

/** Wallpapers that only show up when the file actually exists on the server. */
export const OPTIONAL_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>([
  'win11',
  'win10',
  'win7',
  'winxp',
]);

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
  win11: 'Windows 11',
  win10: 'Windows 10',
  win7: 'Windows 7',
  winxp: 'Windows XP',
};

/** Wallpapers dark enough that the menu bar / status bar should flip to white text. */
export const DARK_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>([
  'catalina',
  'wave',
  'bloomDark',
  'pixelDark',
  'win10',
]);

const APPLE_SET: WallpaperKey[] = ['gold', 'catalina', 'tahoe', 'wave'];

export const WALLPAPERS_FOR_OS: Record<OsName, WallpaperKey[]> = {
  macos: APPLE_SET,
  ios: APPLE_SET,
  windows: ['win11', 'win10', 'win7', 'winxp', 'bloom', 'bloomDark', 'spectrum'],
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
  return key && key in WALLPAPERS && isWallpaperAvailable(key) ? key : DEFAULT_WALLPAPER[os];
}

const available = new Map<WallpaperKey, boolean>();
const listeners = new Set<() => void>();

/** Which optional wallpapers have been found on the server (probed once per session). */
export function isWallpaperAvailable(key: WallpaperKey): boolean {
  return !OPTIONAL_WALLPAPERS.has(key) || available.get(key) === true;
}

export function subscribeWallpaperAvailability(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let probed = false;
/** Try to load each optional image once; those that exist join the picker. */
export function probeOptionalWallpapers() {
  if (probed || typeof Image === 'undefined') return;
  probed = true;
  for (const key of OPTIONAL_WALLPAPERS) {
    const img = new Image();
    img.onload = () => {
      available.set(key, true);
      listeners.forEach((fn) => fn());
    };
    img.onerror = () => available.set(key, false);
    img.src = WALLPAPERS[key];
  }
}

/** The wallpapers to offer for an OS right now (optional ones only once they have loaded). */
export function availableWallpapersFor(os: OsName): WallpaperKey[] {
  return WALLPAPERS_FOR_OS[os].filter(isWallpaperAvailable);
}

const preloadedFor = new Set<OsName>();
/** Warm the browser cache for one OS's set so switching wallpapers is instant. */
export function preloadWallpapers(os: OsName) {
  if (preloadedFor.has(os) || typeof Image === 'undefined') return;
  preloadedFor.add(os);
  for (const key of availableWallpapersFor(os)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = WALLPAPERS[key];
  }
}
