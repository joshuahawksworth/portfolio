// Shared app catalogue for Spotlight, Launchpad and the Start menu.
// Icon art comes from the platform icon resolver, so it follows the chosen OS.
import { useMemo, type ReactNode } from 'react';
import { PORTFOLIO_APPS, type PortfolioAppId } from '../apps/appRegistry';
import { DOCK_LABELS, getDockAction } from '../Dock/dockConfig';
import { appIconFor } from '../../theme/platformIcons';
import { appLabelFor, appTitleFor, isAppleOs } from '../../theme/platform';
import type { OsName } from '../../lib/settingsStore';
import { useOs } from '../../context/SettingsContext';

export interface SystemApp {
  id: PortfolioAppId;
  /** Full window title (used for search). */
  title: string;
  /** Short label shown under the icon. */
  label: string;
  /** Dock key whose icon/action this app reuses, if any. */
  dockKey?: string;
  icon: ReactNode;
}

type Entry = { id: PortfolioAppId; dockKey?: string };

const ENTRIES: Entry[] = [
  { id: 'finder', dockKey: 'finder' },
  { id: 'settings', dockKey: 'settings' },
  { id: 'safari', dockKey: 'safari' },
  { id: 'githubdesktop', dockKey: 'githubdesktop' },
  { id: 'about', dockKey: 'about' },
  { id: 'askjosh', dockKey: 'askjosh' },
  { id: 'experience', dockKey: 'experience' },
  { id: 'skills', dockKey: 'skills' },
  { id: 'contact', dockKey: 'contact' },
  { id: 'outlook', dockKey: 'outlook' },
  { id: 'location', dockKey: 'location' },
  { id: 'terminal', dockKey: 'terminal' },
  { id: 'calculator', dockKey: 'calculator' },
  { id: 'texteditor', dockKey: 'texteditor' },
  { id: 'postman', dockKey: 'postman' },
  { id: 'xcode', dockKey: 'xcode' },
  { id: 'androidstudio', dockKey: 'androidstudio' },
  { id: 'word', dockKey: 'word' },
  { id: 'spotify', dockKey: 'spotify' },
  { id: 'appstore', dockKey: 'appstore' },
  { id: 'imageviewer', dockKey: 'imageviewer' },
  { id: 'doom', dockKey: 'doom' },
  { id: 'snake', dockKey: 'snake' },
  { id: 'rubberduck' },
  { id: 'shortcuts' },
  { id: 'trash' },
];

/** Xcode is a Mac app and Android Studio lives on the Windows PC. */
function shipsOn(id: PortfolioAppId, os: OsName): boolean {
  if (id === 'xcode') return isAppleOs(os);
  if (id === 'androidstudio') return !isAppleOs(os);
  return true;
}

export function systemAppsFor(os: OsName): SystemApp[] {
  return ENTRIES.filter(({ id }) => shipsOn(id, os)).map(({ id, dockKey }) => {
    const baseTitle = PORTFOLIO_APPS[id].title;
    const baseLabel = (dockKey && DOCK_LABELS[dockKey]) || DOCK_LABELS[id] || baseTitle;
    return {
      id,
      dockKey,
      title: appTitleFor(id, baseTitle, os),
      label: appLabelFor(id, baseLabel, os),
      icon: appIconFor(dockKey ?? id, os),
    };
  });
}

let defaultCatalogue: SystemApp[] | null = null;
/**
 * Default catalogue (macOS artwork) for callers outside React. Built on first use rather
 * than at import time: the App Store lists these apps, so this module and the app
 * registry import each other.
 */
export function systemApps(): SystemApp[] {
  defaultCatalogue ??= systemAppsFor('macos');
  return defaultCatalogue;
}

export function useSystemApps(): SystemApp[] {
  const os = useOs();
  return useMemo(() => systemAppsFor(os), [os]);
}

type OpenApp = (appId: string, props?: Record<string, unknown>) => void;

/** Open an app the same way the dock would (so GitHub gets its URL, etc.). */
export function launchSystemApp(app: SystemApp, openApp: OpenApp) {
  if (app.dockKey) {
    getDockAction(app.dockKey, openApp)();
  } else {
    openApp(app.id);
  }
}

/** Rank apps against a query: prefix > substring > subsequence. Empty query keeps catalogue order. */
export function searchSystemApps(query: string, apps: SystemApp[] = systemApps()): SystemApp[] {
  const q = query.trim().toLowerCase();
  if (!q) return apps;

  const scored: { app: SystemApp; score: number }[] = [];
  for (const app of apps) {
    const hay = [app.title, app.label, app.id].map((s) => s.toLowerCase());
    let score = 0;
    if (hay.some((h) => h.startsWith(q))) score = 3;
    else if (hay.some((h) => h.includes(q))) score = 2;
    else if (hay.some((h) => isSubsequence(q, h))) score = 1;
    if (score > 0) scored.push({ app, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.app);
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return i === needle.length;
}
