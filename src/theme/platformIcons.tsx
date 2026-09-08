/**
 * Resolves app artwork for the OS being rendered. macOS keeps the real Apple icons,
 * Windows swaps in the Fluent set and Android the Material discs; anything without a
 * counterpart (GitHub, Chrome, Claude, DOOM, Snake, the duck) is shared.
 */
import type { ReactNode } from 'react';
import { DOCK_ICONS } from '../components/Dock/dockIcons';
import { WINDOWS_ICONS } from '../components/icons/WindowsIcons';
import { ANDROID_ICONS } from '../components/icons/AndroidIcons';
import type { OsName } from '../lib/settingsStore';
import { useOs } from '../context/SettingsContext';

export type AppIconKey = keyof typeof DOCK_ICONS;

const ALIASES: Record<string, AppIconKey> = { githubapp: 'github', trash: 'trashEmpty' };

export function appIconFor(key: string, os: OsName): ReactNode {
  const k = (ALIASES[key] ?? key) as AppIconKey;
  if (os === 'windows') {
    const win = (WINDOWS_ICONS as Partial<Record<AppIconKey, ReactNode>>)[k];
    if (win) return win;
  } else if (os === 'android') {
    const droid = (ANDROID_ICONS as Partial<Record<AppIconKey, ReactNode>>)[k];
    if (droid) return droid;
  }
  return DOCK_ICONS[k] ?? null;
}

export function hasAppIcon(key: string): boolean {
  return (ALIASES[key] ?? key) in DOCK_ICONS;
}

/** Hook form for components: the icon for `key` on the current OS. */
export function useAppIcon(key: string): ReactNode {
  const os = useOs();
  return appIconFor(key, os);
}
