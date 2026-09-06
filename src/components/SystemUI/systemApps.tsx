// Shared app catalogue for Spotlight and Launchpad.
// Icon art comes from the dock; only apps with no dock icon get a small local glyph.
import type { ReactNode } from 'react';
import { PORTFOLIO_APPS, type PortfolioAppId } from '../apps/appRegistry';
import { DOCK_ICONS, MacIcon } from '../Dock/dockIcons';
import { DOCK_LABELS, getDockAction } from '../Dock/dockConfig';

export interface SystemApp {
  id: PortfolioAppId;
  /** Full window title from the registry (used for search). */
  title: string;
  /** Short label shown under the Launchpad icon. */
  label: string;
  /** Dock key whose icon/action this app reuses, if any. */
  dockKey?: string;
  icon: ReactNode;
}

const LOCAL_ICONS: Partial<Record<PortfolioAppId, ReactNode>> = {
  rubberduck: (
    <MacIcon top="#ffd83d" bottom="#f2a300">
      <ellipse cx="23" cy="27" rx="11" ry="7.5" fill="#fff3a6" />
      <circle cx="17" cy="18" r="6.5" fill="#fff3a6" />
      <circle cx="15.5" cy="17" r="1.3" fill="#2a2320" />
      <path d="M10 19.5 Q6.5 20.5 8.5 22.5 Q11 23 12.5 21.5 Z" fill="#ff7a1a" />
    </MacIcon>
  ),
  shortcuts: (
    <MacIcon top="#8e8e93" bottom="#48484a">
      <rect x="8" y="12" width="28" height="20" rx="4" fill="rgba(255,255,255,0.92)" />
      {[11, 16, 21, 26].map((x) => (
        <rect key={`a${x}`} x={x} y="15.5" width="3.5" height="3.5" rx="1" fill="#48484a" />
      ))}
      {[13, 18, 23].map((x) => (
        <rect key={`b${x}`} x={x} y="20.5" width="3.5" height="3.5" rx="1" fill="#48484a" />
      ))}
      <rect x="14" y="25.5" width="16" height="3.5" rx="1" fill="#48484a" />
    </MacIcon>
  ),
  trash: (
    <MacIcon top="#e9e2d6" bottom="#b8afa3">
      <path
        d="M14 15 L30 15 L28.5 33 Q28 35 26 35 L18 35 Q16 35 15.5 33 Z"
        fill="rgba(255,255,255,0.92)"
      />
      <rect x="12" y="11.5" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.92)" />
      <rect x="19" y="9" width="6" height="3" rx="1.5" fill="rgba(255,255,255,0.92)" />
      <path
        d="M18.5 19 V31 M22 19 V31 M25.5 19 V31"
        stroke="#9c9287"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </MacIcon>
  ),
};

type Entry = { id: PortfolioAppId; dockKey?: string };

const ENTRIES: Entry[] = [
  { id: 'finder', dockKey: 'finder' },
  { id: 'safari', dockKey: 'safari' },
  { id: 'githubapp', dockKey: 'github' },
  { id: 'about', dockKey: 'about' },
  { id: 'experience', dockKey: 'experience' },
  { id: 'skills', dockKey: 'skills' },
  { id: 'contact', dockKey: 'contact' },
  { id: 'location', dockKey: 'location' },
  { id: 'terminal', dockKey: 'terminal' },
  { id: 'calculator', dockKey: 'calculator' },
  { id: 'texteditor', dockKey: 'texteditor' },
  { id: 'imageviewer', dockKey: 'imageviewer' },
  { id: 'slotslop', dockKey: 'slotslop' },
  { id: 'doom', dockKey: 'doom' },
  { id: 'snake', dockKey: 'snake' },
  { id: 'rubberduck' },
  { id: 'shortcuts' },
  { id: 'trash' },
];

export const SYSTEM_APPS: SystemApp[] = ENTRIES.map(({ id, dockKey }) => {
  const dockIcon = dockKey ? DOCK_ICONS[dockKey as keyof typeof DOCK_ICONS] : undefined;
  return {
    id,
    dockKey,
    title: PORTFOLIO_APPS[id].title,
    label: (dockKey && DOCK_LABELS[dockKey]) || PORTFOLIO_APPS[id].title,
    icon: dockIcon ?? LOCAL_ICONS[id] ?? null,
  };
});

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
export function searchSystemApps(query: string, apps: SystemApp[] = SYSTEM_APPS): SystemApp[] {
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
