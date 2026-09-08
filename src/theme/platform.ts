/**
 * Platform helpers that don't need React: the OS currently rendered (mirrored on
 * <html data-os>), shell insets and the names each OS uses for shared things.
 */
import type { OsName } from '../lib/settingsStore';

export function currentOs(): OsName {
  if (typeof document === 'undefined') return 'macos';
  const os = document.documentElement.dataset.os;
  return os === 'ios' || os === 'windows' || os === 'android' ? os : 'macos';
}

export function isAppleOs(os: OsName): boolean {
  return os === 'macos' || os === 'ios';
}

/** Space reserved by the shell above and below the window area. */
export function shellInsets(os: OsName = currentOs()): { top: number; bottom: number } {
  return os === 'windows' ? { top: 0, bottom: 48 } : { top: 29, bottom: 90 };
}

export const OS_LABELS: Record<OsName, string> = {
  macos: 'macOS',
  ios: 'iOS',
  windows: 'Windows',
  android: 'Android',
};

/** Per-OS titles for apps that have a different native counterpart. */
const APP_TITLES: Partial<Record<string, Partial<Record<OsName, string>>>> = {
  finder: { windows: 'File Explorer', android: 'Files', ios: 'Files' },
  trash: { windows: 'Recycle Bin', android: 'Bin', ios: 'Recently Deleted' },
  settings: { macos: 'System Settings', windows: 'Settings', android: 'Settings', ios: 'Settings' },
  texteditor: { windows: 'Notepad', android: 'Keep Notes' },
  imageviewer: { windows: 'Photos', android: 'Photos', ios: 'Photos' },
  shortcuts: { windows: 'Keyboard Shortcuts' },
};

export function appTitleFor(appId: string, fallback: string, os: OsName): string {
  return APP_TITLES[appId]?.[os] ?? fallback;
}

/** Short labels under dock / home-screen icons. */
const APP_LABELS: Partial<Record<string, Partial<Record<OsName, string>>>> = {
  finder: { windows: 'File Explorer', android: 'Files', ios: 'Files' },
  trash: { windows: 'Recycle Bin', android: 'Bin' },
  settings: { macos: 'System Settings' },
  texteditor: { windows: 'Notepad', android: 'Keep' },
  imageviewer: { windows: 'Photos', android: 'Photos' },
  experience: { windows: 'To Do', android: 'Tasks' },
  contact: { windows: 'Outlook', android: 'Gmail' },
  location: { windows: 'Maps', android: 'Maps' },
  cv: { windows: 'Word', android: 'Docs' },
};

export function appLabelFor(appId: string, fallback: string, os: OsName): string {
  return APP_LABELS[appId]?.[os] ?? fallback;
}

/** Display names for the two locked desktop shortcuts. */
export function nodeDisplayName(nodeId: string, name: string, os: OsName): string {
  if (nodeId === 'shortcut-mycomputer') {
    if (os === 'windows') return 'This PC';
    if (os === 'android') return 'Internal storage';
    return name;
  }
  if (nodeId === 'shortcut-trash') {
    if (os === 'windows') return 'Recycle Bin';
    if (os === 'android') return 'Bin';
    return name;
  }
  return name;
}

export interface DeviceInfo {
  name: string;
  model: string;
  chip: string;
  memory: string;
  osVersion: string;
  storage: string;
  serial: string;
}

export const DEVICE_INFO: Record<OsName, DeviceInfo> = {
  macos: {
    name: "Joshua's MacBook Pro",
    model: 'MacBook Pro 14-inch, 2025',
    chip: 'Apple M4 Pro',
    memory: '24 GB',
    osVersion: 'macOS 26 Tahoe',
    storage: '1 TB SSD',
    serial: 'JH2026PORTFOLIO',
  },
  ios: {
    name: "Joshua's iPhone",
    model: 'iPhone 17 Pro',
    chip: 'A19 Pro',
    memory: '12 GB',
    osVersion: 'iOS 26',
    storage: '256 GB',
    serial: 'JH2026PORTFOLIO',
  },
  windows: {
    name: 'JOSH-DESKTOP',
    model: 'Surface Laptop 7',
    chip: 'Snapdragon X Elite',
    memory: '32 GB',
    osVersion: 'Windows 11 Pro 25H2',
    storage: '1 TB SSD',
    serial: 'JH2026PORTFOLIO',
  },
  android: {
    name: 'Pixel 10 Pro',
    model: 'Google Pixel 10 Pro',
    chip: 'Google Tensor G5',
    memory: '16 GB',
    osVersion: 'Android 16',
    storage: '256 GB',
    serial: 'JH2026PORTFOLIO',
  },
};
