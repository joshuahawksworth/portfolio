import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  initialsOf,
  loadSettings,
  resolveOs,
  sanitizeSettings,
  saveSettings,
} from '../../src/lib/settingsStore';
import { wallpaperFor } from '../../src/data/wallpapers';
import { formatLockTime, formatTime } from '../../src/lib/clock';

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders macOS/iOS for the Apple platform and Windows/Android otherwise', () => {
    expect(resolveOs('apple', false)).toBe('macos');
    expect(resolveOs('apple', true)).toBe('ios');
    expect(resolveOs('windows', false)).toBe('windows');
    expect(resolveOs('windows', true)).toBe('android');
  });

  it('round-trips through localStorage', () => {
    saveSettings({ ...DEFAULT_SETTINGS, platform: 'windows', accent: 'purple', clock24h: true });
    const loaded = loadSettings();
    expect(loaded.platform).toBe('windows');
    expect(loaded.accent).toBe('purple');
    expect(loaded.clock24h).toBe(true);
    expect(loaded.userName).toBe(DEFAULT_SETTINGS.userName);
  });

  it('drops malformed values and clamps ranges', () => {
    const cleaned = sanitizeSettings({
      platform: 'linux',
      accent: 'neon',
      brightness: 0.1,
      volume: 7,
      userName: '   ',
      wallpaper: { macos: 'wave', windows: 12 },
      reduceMotion: 'yes',
    });
    expect(cleaned.platform).toBe('apple');
    expect(cleaned.accent).toBe('blue');
    expect(cleaned.brightness).toBe(0.6);
    expect(cleaned.volume).toBe(1);
    expect(cleaned.userName).toBe('Joshua Hawksworth');
    expect(cleaned.wallpaper).toEqual({ macos: 'wave' });
    expect(cleaned.reduceMotion).toBe(false);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    expect(loadSettings().platform).toBe('apple');
  });

  it('migrates the old wallpaper key onto the Apple surfaces', () => {
    localStorage.setItem('portfolio.wallpaper', 'tahoe');
    const loaded = loadSettings();
    expect(loaded.wallpaper.macos).toBe('tahoe');
    expect(loaded.wallpaper.ios).toBe('tahoe');
    expect(wallpaperFor('windows', loaded.wallpaper)).toBe('bloom');
    expect(wallpaperFor('android', loaded.wallpaper)).toBe('pixel');
  });

  it('builds avatar initials', () => {
    expect(initialsOf('Joshua Hawksworth')).toBe('JH');
    expect(initialsOf('Josh')).toBe('J');
    expect(initialsOf('')).toBe('JH');
  });
});

describe('clock formatting', () => {
  const nine41 = new Date(2026, 8, 8, 21, 41, 7);

  it('respects the 24-hour setting', () => {
    expect(formatLockTime(nine41, true)).toBe('21:41');
    expect(formatLockTime(nine41, false)).toBe('9:41');
    expect(formatTime(nine41, { clock24h: true })).toBe('21:41');
    expect(formatTime(nine41, { clock24h: false })).toMatch(/9:41\s?PM/);
  });

  it('can show seconds', () => {
    expect(formatTime(nine41, { clock24h: true, showSeconds: true })).toBe('21:41:07');
  });
});
