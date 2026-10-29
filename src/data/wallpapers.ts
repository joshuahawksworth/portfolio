/**
 * Wallpapers shared by the desktop, lock screens and mobile home screens.
 * Each rendered OS has its own set (and default); the chosen key is persisted
 * through the system settings store so every surface stays in sync.
 */
import { hasPublicAsset } from '../lib/publicAssets';
import type { DynamicFrame, DynamicLook } from '../lib/dynamicWallpaper';
import type { OsName } from '../lib/settingsStore';

export const WALLPAPERS = {
  // "The Beach", Apple's dynamic Big Sur wallpaper and the macOS / iOS default. the-beach.jpg
  // is the day picture; DYNAMIC_FRAME_IMAGES lists the dawn, dusk and night frames it
  // cross-fades through (rendered from it by scripts/wallpapers/beach-variants.mjs).
  beach: '/wallpapers/the-beach.jpg',
  gold: '/wallpapers/golden-gate.jpg',
  catalina: '/wallpapers/catalina-night.jpg',
  tahoe: '/wallpapers/tahoe-day.jpg',
  wave: '/wallpapers/blue-wave.jpg',
  pixel: '/wallpapers/android-pixel.svg',
  pixelDark: '/wallpapers/android-pixel-dark.svg',
  pixelCoral: '/wallpapers/android-pixel-coral.svg',
  // The Windows 11 and 10 backgrounds ship with the repo. Windows 7 and XP are optional:
  // drop your own copies into public/wallpapers/ under these names and they join the
  // Windows set at the next build (see OPTIONAL_WALLPAPERS).
  win11: '/wallpapers/windows-11.jpg',
  win10: '/wallpapers/windows-10.jpg',
  win7: '/wallpapers/windows-7-harmony.jpg',
  winxp: '/wallpapers/windows-xp-bliss.jpg',
} as const;

/**
 * Wallpapers that only show up when the file is actually in public/. Whether it is gets baked
 * into the bundle at build time (src/lib/publicAssets.ts), so nothing is probed at runtime.
 */
export const OPTIONAL_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>([
  'beach',
  'win7',
  'winxp',
]);

export type WallpaperKey = keyof typeof WALLPAPERS;

export const WALLPAPER_KEYS = Object.keys(WALLPAPERS) as WallpaperKey[];

export const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  beach: 'The Beach (Dynamic)',
  gold: 'Golden Gate',
  catalina: 'Catalina',
  tahoe: 'Tahoe',
  wave: 'Sequoia',
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
  'pixelDark',
  'win10',
]);

const APPLE_SET: WallpaperKey[] = ['beach', 'gold', 'catalina', 'tahoe', 'wave'];

/** Wallpapers that follow the time of day, like macOS dynamic desktops. */
export const DYNAMIC_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>(['beach']);

/** The dawn, dusk and night pictures a dynamic wallpaper cross-fades through. */
export const DYNAMIC_FRAME_IMAGES: Partial<Record<WallpaperKey, Record<DynamicFrame, string>>> = {
  beach: {
    dawn: '/wallpapers/the-beach-dawn.jpg',
    dusk: '/wallpapers/the-beach-dusk.jpg',
    night: '/wallpapers/the-beach-night.jpg',
  },
};

/** The image for one frame of a dynamic wallpaper, or null if it was not built in. */
export function dynamicFrameSrc(key: WallpaperKey, frame: DynamicFrame): string | null {
  const src = DYNAMIC_FRAME_IMAGES[key]?.[frame];
  return src && hasPublicAsset(src) ? src : null;
}

/**
 * The single picture to show for a wallpaper right now: the frame that dominates the current
 * look for a dynamic wallpaper (the lock screens show one still rather than the layered
 * cross-fade), otherwise the wallpaper itself.
 */
export function wallpaperImageFor(key: WallpaperKey, look: DynamicLook | null): string {
  if (look && look.phase !== 'day') return dynamicFrameSrc(key, look.phase) ?? WALLPAPERS[key];
  return WALLPAPERS[key];
}

export const WALLPAPERS_FOR_OS: Record<OsName, WallpaperKey[]> = {
  macos: APPLE_SET,
  ios: APPLE_SET,
  windows: ['win11', 'win10', 'win7', 'winxp'],
  android: ['pixel', 'pixelDark', 'pixelCoral'],
};

export const DEFAULT_WALLPAPER: Record<OsName, WallpaperKey> = {
  macos: 'beach',
  ios: 'beach',
  windows: 'win11',
  android: 'pixel',
};

/** Used when the preferred default is an optional file that isn't in the build. */
const FALLBACK_WALLPAPER: Record<OsName, WallpaperKey> = {
  macos: 'gold',
  ios: 'gold',
  windows: 'win11',
  android: 'pixel',
};

/** Whether an optional wallpaper's file was in public/ when the app was built. */
export function isWallpaperAvailable(key: WallpaperKey): boolean {
  return !OPTIONAL_WALLPAPERS.has(key) || hasPublicAsset(WALLPAPERS[key]);
}

export function defaultWallpaperFor(
  os: OsName,
  available: (key: WallpaperKey) => boolean = isWallpaperAvailable
): WallpaperKey {
  // The first of the OS's set that is actually in the build, else the shipped fallback.
  const preferred = DEFAULT_WALLPAPER[os];
  if (available(preferred)) return preferred;
  return WALLPAPERS_FOR_OS[os].find(available) ?? FALLBACK_WALLPAPER[os];
}

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

/**
 * The choice-map update for picking `key` on `os`. The phone and desktop of a platform
 * share one wallpaper, so picking on macOS also sets iOS (and vice versa); Windows and
 * Android do the same for the keys their sets have in common.
 */
export function wallpaperChoiceFor(
  os: OsName,
  key: WallpaperKey
): Partial<Record<OsName, WallpaperKey>> {
  const out: Partial<Record<OsName, WallpaperKey>> = { [os]: key };
  const sibling = siblingOf(os);
  if (WALLPAPERS_FOR_OS[sibling].includes(key)) out[sibling] = key;
  return out;
}

function siblingOf(os: OsName): OsName {
  return os === 'macos' ? 'ios' : os === 'ios' ? 'macos' : os === 'windows' ? 'android' : 'windows';
}

/**
 * Resolve the wallpaper to show for an OS from a (possibly partial) choice map. A choice
 * made on the platform's other device (the Mac for the iPhone, and vice versa) counts
 * when this OS has none of its own, so a wallpaper picked before choices were shared
 * still shows on both.
 */
export function wallpaperFor(
  os: OsName,
  chosen: Partial<Record<OsName, WallpaperKey>>,
  available: (key: WallpaperKey) => boolean = isWallpaperAvailable
): WallpaperKey {
  const usable = (key: WallpaperKey | undefined): key is WallpaperKey =>
    !!key && key in WALLPAPERS && WALLPAPERS_FOR_OS[os].includes(key) && available(key);
  const own = chosen[os];
  if (usable(own)) return own;
  const shared = chosen[siblingOf(os)];
  if (usable(shared)) return shared;
  return defaultWallpaperFor(os, available);
}

/** The wallpapers to offer for an OS. */
export function availableWallpapersFor(os: OsName): WallpaperKey[] {
  return WALLPAPERS_FOR_OS[os].filter(isWallpaperAvailable);
}

const preloadedFor = new Set<OsName>();
/**
 * Warm the browser cache for one OS's set (and the frames of its dynamic wallpapers) so
 * switching wallpapers, and the next time-of-day cross-fade, are instant.
 */
export function preloadWallpapers(os: OsName) {
  if (preloadedFor.has(os) || typeof Image === 'undefined') return;
  preloadedFor.add(os);
  const sources: string[] = [];
  for (const key of availableWallpapersFor(os)) {
    sources.push(WALLPAPERS[key]);
    for (const frame of Object.values(DYNAMIC_FRAME_IMAGES[key] ?? {})) {
      if (hasPublicAsset(frame)) sources.push(frame);
    }
  }
  for (const src of sources) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
