/**
 * Persisted system settings shared by every surface (boot, lock screen, desktop,
 * mobile home screen and the System Settings app). Saved as one JSON blob in
 * localStorage so a reload restores the chosen platform, wallpaper, accent, etc.
 */
import { loadLegacyWallpaper, type WallpaperKey } from '../data/wallpapers';

/** `apple` renders macOS on desktops and iOS on phones; `windows` renders Windows / Android. */
export type Platform = 'apple' | 'windows';
export type OsName = 'macos' | 'ios' | 'windows' | 'android';

export type AccentKey =
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'graphite';

export type DockSize = 'small' | 'medium' | 'large';
export type TaskbarAlignment = 'center' | 'left';
export type IconShape = 'circle' | 'squircle' | 'square';

export interface Settings {
  platform: Platform;
  /** Chosen wallpaper per rendered OS; missing entries fall back to the OS default. */
  wallpaper: Partial<Record<OsName, WallpaperKey>>;
  accent: AccentKey;
  userName: string;

  clock24h: boolean;
  showSeconds: boolean;

  /** 0.6 – 1: the display dimmer overlay. */
  brightness: number;
  nightLight: boolean;
  /** 0 – 1: how warm the Night Shift / Night light tint is. */
  nightLightWarmth: number;

  /** 0 – 1 */
  volume: number;
  muted: boolean;

  wifi: boolean;
  network: string;
  bluetooth: boolean;
  airdrop: boolean;

  doNotDisturb: boolean;

  reduceMotion: boolean;
  reduceTransparency: boolean;
  increaseContrast: boolean;

  dockSize: DockSize;
  dockMagnification: boolean;

  taskbarAlignment: TaskbarAlignment;
  taskbarWeather: boolean;

  iconShape: IconShape;
  showAtAGlance: boolean;
  showHomeSearch: boolean;
}

export const NETWORKS = ['Hawksworth Home', 'Hawksworth 5G', 'Ziferblat Guest', 'BT-Openzone'];

export const ACCENTS: Record<AccentKey, { label: string; color: string; soft: string }> = {
  blue: { label: 'Blue', color: '#007aff', soft: 'rgba(0, 122, 255, 0.12)' },
  purple: { label: 'Purple', color: '#8e44d6', soft: 'rgba(142, 68, 214, 0.14)' },
  pink: { label: 'Pink', color: '#e6407e', soft: 'rgba(230, 64, 126, 0.14)' },
  red: { label: 'Red', color: '#e53935', soft: 'rgba(229, 57, 53, 0.14)' },
  orange: { label: 'Orange', color: '#f0801a', soft: 'rgba(240, 128, 26, 0.16)' },
  yellow: { label: 'Yellow', color: '#d9a300', soft: 'rgba(217, 163, 0, 0.18)' },
  green: { label: 'Green', color: '#2fa84f', soft: 'rgba(47, 168, 79, 0.14)' },
  graphite: { label: 'Graphite', color: '#6e6e73', soft: 'rgba(110, 110, 115, 0.16)' },
};

export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];

export const DEFAULT_SETTINGS: Settings = {
  platform: 'apple',
  wallpaper: {},
  accent: 'blue',
  userName: 'Joshua Hawksworth',
  clock24h: false,
  showSeconds: false,
  brightness: 1,
  nightLight: false,
  nightLightWarmth: 0.5,
  volume: 0.7,
  muted: false,
  wifi: true,
  network: NETWORKS[0],
  bluetooth: true,
  airdrop: true,
  doNotDisturb: false,
  reduceMotion: false,
  reduceTransparency: false,
  increaseContrast: false,
  dockSize: 'medium',
  dockMagnification: true,
  taskbarAlignment: 'center',
  taskbarWeather: true,
  iconShape: 'circle',
  showAtAGlance: true,
  showHomeSearch: true,
};

export const SETTINGS_STORAGE_KEY = 'portfolio.settings.v1';

/**
 * Pick the platform that matches the visitor's own device: Android phones and Windows
 * PCs start on the Windows / Android side; iPhones, Macs and anything unknown start on
 * Apple. Only used until the visitor saves a choice of their own.
 */
export function detectPlatform(
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  uaPlatform: string = typeof navigator === 'undefined'
    ? ''
    : ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
        ?.platform ?? '')
): Platform {
  const s = `${uaPlatform} ${userAgent}`.toLowerCase();
  if (s.includes('android')) return 'windows';
  if (s.includes('windows')) return 'windows';
  return 'apple';
}

/** Which OS a platform renders as on the current device. */
export function resolveOs(platform: Platform, isMobile: boolean): OsName {
  if (platform === 'apple') return isMobile ? 'ios' : 'macos';
  return isMobile ? 'android' : 'windows';
}

export function platformForOs(os: OsName): Platform {
  return os === 'macos' || os === 'ios' ? 'apple' : 'windows';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merge a stored blob over the defaults, dropping anything with the wrong shape. */
export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS, wallpaper: {} };
  if (!isRecord(raw)) return out;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = raw[key];
    if (value === undefined) continue;
    if (key === 'wallpaper') {
      if (isRecord(value)) {
        const wp: Partial<Record<OsName, WallpaperKey>> = {};
        for (const os of ['macos', 'ios', 'windows', 'android'] as OsName[]) {
          if (typeof value[os] === 'string') wp[os] = value[os] as WallpaperKey;
        }
        out.wallpaper = wp;
      }
      continue;
    }
    const def = DEFAULT_SETTINGS[key];
    if (typeof value !== typeof def) continue;
    const str = typeof value === 'string' ? value : '';
    if (key === 'platform' && str !== 'apple' && str !== 'windows') continue;
    if (key === 'accent' && !(str in ACCENTS)) continue;
    if (key === 'dockSize' && !['small', 'medium', 'large'].includes(str)) continue;
    if (key === 'taskbarAlignment' && !['center', 'left'].includes(str)) continue;
    if (key === 'iconShape' && !['circle', 'squircle', 'square'].includes(str)) continue;
    if (key === 'brightness') {
      out.brightness = Math.min(1, Math.max(0.6, Number(value)));
      continue;
    }
    if (key === 'volume' || key === 'nightLightWarmth') {
      out[key] = Math.min(1, Math.max(0, Number(value)));
      continue;
    }
    if (key === 'userName') {
      const name = String(value).trim().slice(0, 32);
      if (name) out.userName = name;
      continue;
    }
    (out as unknown as Record<string, unknown>)[key] = value;
  }
  return out;
}

export function loadSettings(): Settings {
  let settings: Settings = { ...DEFAULT_SETTINGS, wallpaper: {} };
  let saved = false;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      settings = sanitizeSettings(JSON.parse(raw));
      saved = true;
    }
  } catch {
    /* private mode or corrupt data: fall back to defaults */
  }
  // First visit: match the device the visitor is actually on.
  if (!saved) settings.platform = detectPlatform();
  // Older builds saved only the wallpaper; carry that choice over to the Apple surfaces.
  if (!settings.wallpaper.macos) {
    const legacy = loadLegacyWallpaper();
    if (legacy) settings.wallpaper = { ...settings.wallpaper, macos: legacy, ios: legacy };
  }
  return settings;
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
}

export function clearSettings() {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    localStorage.removeItem('portfolio.wallpaper');
  } catch {
    /* private mode */
  }
}

/** Initials for the avatar bubble ("Joshua Hawksworth" → "JH"). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'JH';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
