/**
 * System Settings. One settings model, four native layouts:
 *  - macOS: sidebar of coloured pane icons + detail
 *  - Windows 11: left navigation + breadcrumb detail
 *  - iOS: inset grouped list that drills into each pane
 *  - Android: Material list with a search bar that drills into each pane
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSettings } from '../../context/SettingsContext';
import type { OsName } from '../../lib/settingsStore';
import { initialsOf } from '../../lib/settingsStore';
import { SECTIONS, type SectionId } from './settingsSections';
import styles from './SettingsApp.module.css';

type GlyphKey =
  | 'platform'
  | 'appearance'
  | 'wallpaper'
  | 'dock'
  | 'display'
  | 'sound'
  | 'wifi'
  | 'bluetooth'
  | 'bell'
  | 'clock'
  | 'keyboard'
  | 'a11y'
  | 'user'
  | 'info'
  | 'system'
  | 'network'
  | 'brush'
  | 'phone';

const GLYPHS: Record<GlyphKey, ReactNode> = {
  platform: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9" />
      <path d="M11.5 1.5v3h-3M4.5 14.5v-3h3" />
    </svg>
  ),
  appearance: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.7-.4-1 0-.8.7-1.5 1.5-1.5H12a2.5 2.5 0 0 0 2.5-2.5C14.5 4 11.6 1.5 8 1.5zM5 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1.5-3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM10 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  ),
  wallpaper: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2 11l3.5-3.5 3 3 2-2 3.5 3.5" />
      <circle cx="10.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  dock: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4 11h8" strokeLinecap="round" strokeWidth="2" />
    </svg>
  ),
  display: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </svg>
  ),
  sound: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z" fill="currentColor" />
      <path d="M11 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6 6 0 0 1 0 9" />
    </svg>
  ),
  wifi: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M2 6.5a9 9 0 0 1 12 0M4.3 9.2a5.6 5.6 0 0 1 7.4 0M6.6 11.8a2.3 2.3 0 0 1 2.8 0" />
      <circle cx="8" cy="13.6" r="0.6" fill="currentColor" />
    </svg>
  ),
  bluetooth: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M4.5 5l7 6-3.5 3V2l3.5 3-7 6" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5a4 4 0 0 0-4 4v2.6L2.6 10.5c-.3.5 0 1 .6 1h9.6c.6 0 .9-.5.6-1L12 8.1V5.5a4 4 0 0 0-4-4zM6.5 13a1.5 1.5 0 0 0 3 0z" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  ),
  keyboard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4" width="13" height="8" rx="1.5" />
      <path d="M4 7h1M7 7h1M10 7h1M4.5 9.5h7" strokeLinecap="round" />
    </svg>
  ),
  a11y: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="3" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 6.2l5 .9 5-.9M8 7.1v3.4M8 10.5l-2.2 3.6M8 10.5l2.2 3.6" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="5" r="3" />
      <path d="M2.5 14a5.5 5.5 0 0 1 11 0z" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4M8 5v.2" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="3" width="13" height="8.5" rx="1.5" />
      <path d="M5.5 14h5" strokeLinecap="round" />
    </svg>
  ),
  network: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
    </svg>
  ),
  brush: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.6 1.6a1.4 1.4 0 0 0-2 0L6 7.2l2.8 2.8 5.6-5.6a1.4 1.4 0 0 0 0-2zM5.2 8.2a2.6 2.6 0 0 0-2.6 2.6c0 1.2-.7 2-1.6 2.5 1.6.8 4.6.9 5.9-.4a2.6 2.6 0 0 0 0-3.7 2.6 2.6 0 0 0-1.7-1z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="1.5" width="8" height="13" rx="1.8" />
      <path d="M7 12.5h2" strokeLinecap="round" />
    </svg>
  ),
};

export interface Pane {
  id: string;
  title: string;
  sub?: string;
  glyph: GlyphKey;
  color: string;
  sections: SectionId[];
}

const APPLE_PANES: Pane[] = [
  {
    id: 'platform',
    title: 'Platform',
    glyph: 'platform',
    color: '#5856d6',
    sections: ['platform'],
  },
  { id: 'wifi', title: 'Wi‑Fi', glyph: 'wifi', color: '#007aff', sections: ['wifi'] },
  {
    id: 'bluetooth',
    title: 'Bluetooth',
    glyph: 'bluetooth',
    color: '#0a84ff',
    sections: ['bluetooth'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    glyph: 'bell',
    color: '#ff3b30',
    sections: ['notifications'],
  },
  { id: 'sound', title: 'Sound', glyph: 'sound', color: '#ff2d55', sections: ['sound'] },
  {
    id: 'general',
    title: 'General',
    glyph: 'info',
    color: '#8e8e93',
    sections: ['about', 'storage', 'reset'],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    glyph: 'appearance',
    color: '#1c1c1e',
    sections: ['accent'],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    glyph: 'a11y',
    color: '#0a84ff',
    sections: ['accessibility'],
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    glyph: 'wallpaper',
    color: '#34c759',
    sections: ['wallpaper'],
  },
  { id: 'dock', title: 'Desktop & Dock', glyph: 'dock', color: '#1c1c1e', sections: ['dock'] },
  { id: 'displays', title: 'Displays', glyph: 'display', color: '#5ac8fa', sections: ['display'] },
  {
    id: 'datetime',
    title: 'Date & Time',
    glyph: 'clock',
    color: '#5856d6',
    sections: ['datetime'],
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    glyph: 'keyboard',
    color: '#8e8e93',
    sections: ['keyboard'],
  },
  { id: 'users', title: 'Users & Groups', glyph: 'user', color: '#0a84ff', sections: ['users'] },
];

const IOS_PANES: Pane[] = [
  {
    id: 'platform',
    title: 'Platform',
    glyph: 'platform',
    color: '#5856d6',
    sections: ['platform'],
  },
  { id: 'wifi', title: 'Wi‑Fi', glyph: 'wifi', color: '#007aff', sections: ['wifi'] },
  {
    id: 'bluetooth',
    title: 'Bluetooth',
    glyph: 'bluetooth',
    color: '#0a84ff',
    sections: ['bluetooth'],
  },
  {
    id: 'general',
    title: 'General',
    glyph: 'info',
    color: '#8e8e93',
    sections: ['about', 'storage', 'datetime', 'keyboard', 'reset'],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    glyph: 'a11y',
    color: '#0a84ff',
    sections: ['accessibility'],
  },
  {
    id: 'displays',
    title: 'Display & Brightness',
    glyph: 'display',
    color: '#1c1c1e',
    sections: ['display', 'accent'],
  },
  {
    id: 'homescreen',
    title: 'Home Screen & App Library',
    glyph: 'dock',
    color: '#5856d6',
    sections: ['homescreen'],
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    glyph: 'wallpaper',
    color: '#34c759',
    sections: ['wallpaper'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    glyph: 'bell',
    color: '#ff3b30',
    sections: ['notifications'],
  },
  { id: 'sound', title: 'Sounds & Haptics', glyph: 'sound', color: '#ff2d55', sections: ['sound'] },
  { id: 'users', title: 'Users', glyph: 'user', color: '#0a84ff', sections: ['users'] },
];

const WINDOWS_PANES: Pane[] = [
  {
    id: 'platform',
    title: 'Platform',
    sub: 'macOS & iOS, Windows & Android',
    glyph: 'platform',
    color: '#5856d6',
    sections: ['platform'],
  },
  {
    id: 'system',
    title: 'System',
    sub: 'Display, sound, notifications, storage',
    glyph: 'system',
    color: '#0078d4',
    sections: ['display', 'sound', 'notifications', 'storage', 'about', 'reset'],
  },
  {
    id: 'bluetooth',
    title: 'Bluetooth & devices',
    sub: 'Bluetooth, nearby sharing',
    glyph: 'bluetooth',
    color: '#0078d4',
    sections: ['bluetooth'],
  },
  {
    id: 'network',
    title: 'Network & internet',
    sub: 'Wi‑Fi, known networks',
    glyph: 'network',
    color: '#0078d4',
    sections: ['wifi'],
  },
  {
    id: 'personalization',
    title: 'Personalisation',
    sub: 'Background, colours, taskbar',
    glyph: 'brush',
    color: '#e3008c',
    sections: ['wallpaper', 'accent', 'taskbar'],
  },
  {
    id: 'accounts',
    title: 'Accounts',
    sub: 'Your info, sign-in options',
    glyph: 'user',
    color: '#0078d4',
    sections: ['users'],
  },
  {
    id: 'time',
    title: 'Time & language',
    sub: 'Date & time, keyboard',
    glyph: 'clock',
    color: '#0078d4',
    sections: ['datetime', 'keyboard'],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    sub: 'Motion, transparency, contrast',
    glyph: 'a11y',
    color: '#0078d4',
    sections: ['accessibility'],
  },
];

const ANDROID_PANES: Pane[] = [
  {
    id: 'platform',
    title: 'Platform',
    sub: 'Switch between Android and iOS',
    glyph: 'platform',
    color: '#5856d6',
    sections: ['platform'],
  },
  {
    id: 'network',
    title: 'Network & internet',
    sub: 'Wi‑Fi, known networks',
    glyph: 'wifi',
    color: '#1a73e8',
    sections: ['wifi'],
  },
  {
    id: 'bluetooth',
    title: 'Connected devices',
    sub: 'Bluetooth, Nearby Share',
    glyph: 'bluetooth',
    color: '#1a73e8',
    sections: ['bluetooth'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    sub: 'Do not disturb',
    glyph: 'bell',
    color: '#1a73e8',
    sections: ['notifications'],
  },
  {
    id: 'sound',
    title: 'Sound & vibration',
    sub: 'Volume, alert sound',
    glyph: 'sound',
    color: '#1a73e8',
    sections: ['sound'],
  },
  {
    id: 'displays',
    title: 'Display',
    sub: 'Brightness, Night light',
    glyph: 'display',
    color: '#1a73e8',
    sections: ['display'],
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper & style',
    sub: 'Colours, icon shape, home screen',
    glyph: 'brush',
    color: '#1a73e8',
    sections: ['wallpaper', 'accent', 'homescreen'],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    sub: 'Motion, transparency, contrast',
    glyph: 'a11y',
    color: '#1a73e8',
    sections: ['accessibility'],
  },
  {
    id: 'system',
    title: 'System',
    sub: 'Date & time, keyboard, users, reset',
    glyph: 'info',
    color: '#1a73e8',
    sections: ['datetime', 'keyboard', 'users', 'reset'],
  },
  {
    id: 'about',
    title: 'About phone',
    sub: 'Pixel 10 Pro, storage',
    glyph: 'phone',
    color: '#1a73e8',
    sections: ['about', 'storage'],
  },
];

export function panesFor(os: OsName): Pane[] {
  switch (os) {
    case 'windows':
      return WINDOWS_PANES;
    case 'android':
      return ANDROID_PANES;
    case 'ios':
      return IOS_PANES;
    default:
      return APPLE_PANES;
  }
}

/** Find the pane to open for a requested id: exact pane id, or the pane holding that section. */
export function resolvePane(panes: Pane[], requested: unknown): Pane | null {
  if (typeof requested !== 'string') return null;
  return (
    panes.find((p) => p.id === requested) ??
    panes.find((p) => p.sections.includes(requested as SectionId)) ??
    null
  );
}

export function searchPanes(panes: Pane[], query: string): Pane[] {
  const q = query.trim().toLowerCase();
  if (!q) return panes;
  return panes.filter((p) => {
    if (p.title.toLowerCase().includes(q) || p.sub?.toLowerCase().includes(q)) return true;
    return p.sections.some((id) => {
      const s = SECTIONS[id];
      return s.title.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q));
    });
  });
}

function PaneIcon({ pane, os }: { pane: Pane; os: OsName }) {
  const mono = os === 'windows' || os === 'android';
  return (
    <span
      className={`${styles.paneIcon} ${mono ? styles.paneIconMono : ''}`}
      style={mono ? undefined : { background: pane.color }}
      aria-hidden="true"
    >
      {GLYPHS[pane.glyph]}
    </span>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className={styles.search}>
      <svg
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="6.8" cy="6.8" r="4.6" />
        <path d="M10.4 10.4L14 14" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}

function PaneBody({ pane }: { pane: Pane }) {
  return (
    <div className={styles.paneBody}>
      {pane.sections.map((id) => {
        const Section = SECTIONS[id].component;
        return <Section key={id} />;
      })}
    </div>
  );
}

export default function SettingsApp({ props }: { props?: Record<string, unknown> }) {
  const { settings, os, isMobile } = useSettings();
  const panes = useMemo(() => panesFor(os), [os]);
  const requested = props?.pane;
  const [query, setQuery] = useState('');
  const [paneId, setPaneId] = useState<string | null>(() => {
    const hit = resolvePane(panes, requested);
    return hit ? hit.id : isMobile ? null : panes[0].id;
  });

  // The menu bar / taskbar deep-link into a pane (e.g. the Wi-Fi icon opens Wi-Fi).
  useEffect(() => {
    const hit = resolvePane(panes, requested);
    if (hit) setPaneId(hit.id);
  }, [requested, panes]);

  // Switching platform swaps the pane list; keep something sensible selected.
  useEffect(() => {
    if (paneId && !panes.some((p) => p.id === paneId)) {
      setPaneId(isMobile ? null : panes[0].id);
    }
  }, [panes, paneId, isMobile]);

  const visible = useMemo(() => searchPanes(panes, query), [panes, query]);
  const pane = panes.find((p) => p.id === paneId) ?? null;

  /* ── Phone layouts: list → detail ─────────────────────────────────── */
  if (isMobile) {
    const android = os === 'android';
    if (pane) {
      return (
        <div className={styles.root} data-os={os}>
          <div className={styles.mobileNav}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setPaneId(null)}
              aria-label="Back to settings"
            >
              {android ? (
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path
                    d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <>
                  <svg
                    viewBox="0 0 12 20"
                    width="12"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 2L2 10l8 8" />
                  </svg>
                  Settings
                </>
              )}
            </button>
            <span className={styles.mobileNavTitle}>{pane.title}</span>
          </div>
          <div className={styles.mobileScroll}>
            <PaneBody pane={pane} />
          </div>
        </div>
      );
    }
    return (
      <div className={styles.root} data-os={os}>
        <div className={styles.mobileScroll}>
          {!android && <h1 className={styles.mobileTitle}>Settings</h1>}
          <div className={styles.mobileSearch}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={android ? 'Search settings' : 'Search'}
            />
          </div>
          {!query.trim() && (
            <button type="button" className={styles.profile} onClick={() => setPaneId('users')}>
              <span className={styles.profileAvatar}>{initialsOf(settings.userName)}</span>
              <span className={styles.profileText}>
                <span className={styles.profileName}>{settings.userName}</span>
                <span className={styles.profileSub}>
                  {android ? 'Google Account, device & more' : 'Apple Account, iCloud & more'}
                </span>
              </span>
              <span className={styles.chevron} aria-hidden="true" />
            </button>
          )}
          <div className={styles.mobileList}>
            {visible.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.mobileRow}
                onClick={() => setPaneId(p.id)}
              >
                <PaneIcon pane={p} os={os} />
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>{p.title}</span>
                  {p.sub && <span className={styles.rowSub}>{p.sub}</span>}
                </span>
                <span className={styles.chevron} aria-hidden="true" />
              </button>
            ))}
            {visible.length === 0 && (
              <div className={styles.empty}>No results for “{query.trim()}”</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Desktop layouts: sidebar + detail ────────────────────────────── */
  const windows = os === 'windows';
  return (
    <div className={styles.root} data-os={os}>
      <aside className={styles.sidebar}>
        {windows && (
          <button
            type="button"
            className={styles.sideProfile}
            onClick={() => setPaneId('accounts')}
          >
            <span className={styles.profileAvatar}>{initialsOf(settings.userName)}</span>
            <span className={styles.profileText}>
              <span className={styles.profileName}>{settings.userName}</span>
              <span className={styles.profileSub}>Local account</span>
            </span>
          </button>
        )}
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={windows ? 'Find a setting' : 'Search'}
        />
        {!windows && (
          <button type="button" className={styles.sideProfile} onClick={() => setPaneId('users')}>
            <span className={styles.profileAvatar}>{initialsOf(settings.userName)}</span>
            <span className={styles.profileText}>
              <span className={styles.profileName}>{settings.userName}</span>
              <span className={styles.profileSub}>Apple Account</span>
            </span>
          </button>
        )}
        <nav className={styles.sideList} aria-label="Settings panes">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.sideRow} ${p.id === paneId ? styles.sideRowOn : ''}`}
              onClick={() => setPaneId(p.id)}
              aria-current={p.id === paneId ? 'page' : undefined}
            >
              <PaneIcon pane={p} os={os} />
              <span>{p.title}</span>
            </button>
          ))}
          {visible.length === 0 && <div className={styles.empty}>No results</div>}
        </nav>
      </aside>
      <main className={styles.content}>
        {pane && (
          <>
            <header className={styles.contentHead}>
              {windows && <span className={styles.breadcrumb}>Settings ›</span>}
              <h1 className={styles.contentTitle}>{pane.title}</h1>
            </header>
            <PaneBody pane={pane} />
          </>
        )}
      </main>
    </div>
  );
}
