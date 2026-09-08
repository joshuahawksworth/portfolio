import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCENTS,
  DEFAULT_SETTINGS,
  clearSettings,
  loadSettings,
  resolveOs,
  saveSettings,
  type OsName,
  type Settings,
} from '../lib/settingsStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { WALLPAPERS, wallpaperFor, type WallpaperKey } from '../data/wallpapers';

export interface SettingsValue {
  settings: Settings;
  /** The OS the shell is rendering right now (platform × device). */
  os: OsName;
  isMobile: boolean;
  /** Wallpaper key for the current OS. */
  wallpaper: WallpaperKey;
  update: (patch: Partial<Settings>) => void;
  setWallpaper: (key: WallpaperKey) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

const DOCK_SLOT: Record<Settings['dockSize'], string> = {
  small: '46px',
  medium: '60px',
  large: '76px',
};

/** Mirror the settings onto <html> so plain CSS (and non-React helpers) can react to them. */
function applyToDocument(settings: Settings, os: OsName) {
  const html = document.documentElement;
  html.dataset.os = os;
  html.dataset.platform = settings.platform;
  html.dataset.reduceMotion = settings.reduceMotion ? 'on' : 'off';
  html.dataset.reduceTransparency = settings.reduceTransparency ? 'on' : 'off';
  html.dataset.increaseContrast = settings.increaseContrast ? 'on' : 'off';
  html.dataset.dockMagnification = settings.dockMagnification ? 'on' : 'off';
  html.dataset.iconShape = settings.iconShape;
  const accent = ACCENTS[settings.accent];
  html.style.setProperty('--accent', accent.color);
  html.style.setProperty('--accent-soft', accent.soft);
  html.style.setProperty('--dock-slot-max', DOCK_SLOT[settings.dockSize]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      'content',
      os === 'windows'
        ? '#0f4c9a'
        : os === 'android'
          ? '#dbe6f7'
          : os === 'ios'
            ? '#101a2b'
            : '#f1c367'
    );
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const isMobile = useIsMobile();
  const os = resolveOs(settings.platform, isMobile);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    applyToDocument(settings, os);
  }, [settings, os]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setWallpaper = useCallback(
    (key: WallpaperKey) => {
      if (!(key in WALLPAPERS)) return;
      setSettings((prev) => ({ ...prev, wallpaper: { ...prev.wallpaper, [os]: key } }));
    },
    [os]
  );

  const reset = useCallback(() => {
    clearSettings();
    setSettings({ ...DEFAULT_SETTINGS, wallpaper: {} });
  }, []);

  const wallpaper = wallpaperFor(os, settings.wallpaper);

  const value = useMemo<SettingsValue>(
    () => ({ settings, os, isMobile, wallpaper, update, setWallpaper, reset }),
    [settings, os, isMobile, wallpaper, update, setWallpaper, reset]
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

const FALLBACK: SettingsValue = {
  settings: DEFAULT_SETTINGS,
  os: 'macos',
  isMobile: false,
  wallpaper: 'gold',
  update: () => {},
  setWallpaper: () => {},
  reset: () => {},
};

/** Settings for the whole shell. Renders with defaults outside the provider (unit tests). */
export function useSettings(): SettingsValue {
  return use(SettingsContext) ?? FALLBACK;
}

export function useOs(): OsName {
  return useSettings().os;
}
