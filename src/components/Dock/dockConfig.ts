import type { ReactNode } from 'react';
import { DOCK_ICONS } from './dockIcons';
import { openCv } from '../../lib/cv';

export const DOCK_DEFAULT_ORDER = [
  'github',
  'safari',
  'askjosh',
  'about',
  'experience',
  'skills',
  'contact',
  'outlook',
  'location',
  'terminal',
  'texteditor',
  'postman',
  'word',
  'calculator',
  'imageviewer',
  'spotify',
  'appstore',
  'cv',
  'settings',
] as const;

export type DockKey =
  | (typeof DOCK_DEFAULT_ORDER)[number]
  | 'finder'
  | 'trash'
  | 'doom'
  | 'snake'
  | 'xcode'
  | 'androidstudio'
  | 'wallpaper';

export const DOCK_LABELS: Record<string, string> = {
  finder: 'Finder',
  github: 'GitHub Desktop',
  safari: 'Google Chrome',
  askjosh: 'Ask Claude',
  about: 'About',
  experience: 'Experience',
  skills: 'Skills',
  contact: 'Contact',
  location: 'Location',
  terminal: 'Terminal',
  calculator: 'Calculator',
  texteditor: 'Visual Studio Code',
  outlook: 'Outlook',
  postman: 'Postman',
  xcode: 'Xcode',
  androidstudio: 'Android Studio',
  spotify: 'Spotify',
  word: 'Word',
  appstore: 'App Store',
  imageviewer: 'Image Viewer',
  cv: 'My CV',
  doom: 'DOOM',
  snake: 'Snake',
  trash: 'Trash',
  wallpaper: 'Wallpaper',
  settings: 'Settings',
  shortcuts: 'Shortcuts',
  rubberduck: 'Rubber Duck',
};

/** Apps that live on the desktop as shortcuts — only appear in dock when running */
export const DOCK_DESKTOP_ONLY = new Set(['doom', 'snake', 'xcode', 'androidstudio']);

export const DOCK_KEY_TO_APPID: Record<string, string> = { github: 'githubdesktop' };

export function dockAppId(key: string): string {
  return DOCK_KEY_TO_APPID[key] ?? key;
}

export function getDockAction(
  key: string,
  openApp: (id: string, props?: Record<string, unknown>) => void
): () => void {
  switch (key) {
    case 'github':
      return () => openApp('githubdesktop');
    case 'safari':
      return () => openApp('safari');
    case 'cv':
      return openCv;
    case 'texteditor':
      return () => openApp('texteditor');
    case 'imageviewer':
      return () => openApp('imageviewer');
    default:
      return () => openApp(key);
  }
}

export interface DockItemMeta {
  key: string;
  label: string;
  icon: ReactNode;
}

export const DOCK_ITEMS: DockItemMeta[] = DOCK_DEFAULT_ORDER.map((key) => ({
  key,
  label: DOCK_LABELS[key],
  icon: DOCK_ICONS[key as keyof typeof DOCK_ICONS],
}));
