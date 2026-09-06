/**
 * Wallpapers shared by the desktop, login screen and mobile home screen.
 * The chosen key is persisted in localStorage so every surface stays in sync.
 */
export const WALLPAPERS = {
  gold: '/wallpapers/golden-gate.jpg',
  catalina: '/wallpapers/catalina-night.jpg',
  tahoe: '/wallpapers/tahoe-day.jpg',
  wave: '/wallpapers/blue-wave.jpg',
} as const;

export type WallpaperKey = keyof typeof WALLPAPERS;

export const WALLPAPER_KEYS = Object.keys(WALLPAPERS) as WallpaperKey[];

export const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  gold: 'Golden Gate',
  catalina: 'Catalina',
  tahoe: 'Tahoe',
  wave: 'Sequoia',
};

/** Wallpapers dark enough that the menu bar should flip to white text (like macOS). */
export const DARK_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>([
  'catalina',
  'wave',
]);

const STORAGE_KEY = 'portfolio.wallpaper';

export function loadWallpaper(): WallpaperKey {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved in WALLPAPERS ? (saved as WallpaperKey) : 'gold';
  } catch {
    return 'gold';
  }
}

export function saveWallpaper(key: WallpaperKey) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* private mode */
  }
}

let preloaded = false;
/** Warm the browser cache so switching wallpapers is instant. */
export function preloadWallpapers() {
  if (preloaded || typeof Image === 'undefined') return;
  preloaded = true;
  for (const src of Object.values(WALLPAPERS)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
