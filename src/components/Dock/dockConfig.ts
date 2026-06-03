import type { ReactNode } from 'react';
import { DOCK_ICONS } from './dockIcons';

export const DOCK_DEFAULT_ORDER = [
  'github',
  'safari',
  'about',
  'experience',
  'skills',
  'contact',
  'location',
  'terminal',
  'calculator',
  'texteditor',
  'imageviewer',
  'cv',
  'slotslop',
] as const;

export type DockKey = (typeof DOCK_DEFAULT_ORDER)[number] | 'finder' | 'trash' | 'doom' | 'snake' | 'wallpaper';

export const DOCK_LABELS: Record<string, string> = {
  finder: 'Finder',
  github: 'GitHub',
  safari: 'Google Chrome',
  about: 'About',
  experience: 'Experience',
  skills: 'Skills',
  contact: 'Contact',
  location: 'Location',
  terminal: 'Terminal',
  calculator: 'Calculator',
  texteditor: 'Text Editor',
  imageviewer: 'Image Viewer',
  cv: 'CV',
  slotslop: 'Slotslop',
  doom: 'DOOM',
  snake: 'Snake',
  trash: 'Trash',
  wallpaper: 'Wallpaper',
};

/** Apps that live on the desktop as shortcuts — only appear in dock when running */
export const DOCK_DESKTOP_ONLY = new Set(['doom', 'snake']);

export const DOCK_KEY_TO_APPID: Record<string, string> = { github: 'githubapp' };

export function dockAppId(key: string): string {
  return DOCK_KEY_TO_APPID[key] ?? key;
}

export function getDockAction(
  key: string,
  openApp: (id: string, props?: Record<string, unknown>) => void
): () => void {
  switch (key) {
    case 'github':
      return () => openApp('githubapp', { url: 'https://github.com/joshuahawksworth' });
    case 'safari':
      return () => openApp('safari');
    case 'cv':
      return () => window.open('/JoshuaHawksworthCV.pdf', '_blank');
    case 'slotslop':
      return () => openApp('slotslop');
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
