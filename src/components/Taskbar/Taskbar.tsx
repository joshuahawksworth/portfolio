import { type ReactNode } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { useSettings } from '../../context/SettingsContext';
import { useTime } from '../../hooks/useTime';
import { formatNumericDate, formatTime } from '../../lib/clock';
import { appLabelFor, appTitleFor } from '../../theme/platform';
import { appIconFor } from '../../theme/platformIcons';
import {
  DOCK_DEFAULT_ORDER,
  DOCK_DESKTOP_ONLY,
  DOCK_LABELS,
  dockAppId,
  getDockAction,
} from '../Dock/dockConfig';
import { WindowsLogo } from '../icons/WindowsIcons';
import { describeWeather, useWeather } from '../Desktop/DesktopWidgets';
import styles from './Taskbar.module.css';

/** Windows 11 taskbar: centred Start / Search / Widgets + pinned apps, tray and clock on the right. */
export default function Taskbar() {
  const { windows, focusedId, openApp, focusWindow, minimizeWindow } = useDesktop();
  const systemUI = useSystemUI();
  const { settings, os } = useSettings();
  const now = useTime();
  const weather = useWeather();
  const focusedWindow = windows.find((w) => w.id === focusedId);
  const appName = focusedWindow
    ? appTitleFor(focusedWindow.appId, focusedWindow.title, os)
    : 'Desktop';

  const runningKeys = [
    ...new Set(windows.filter((w) => DOCK_DESKTOP_ONLY.has(w.appId)).map((w) => w.appId)),
  ];
  const pinned: string[] = ['finder', ...DOCK_DEFAULT_ORDER, ...runningKeys];
  // Windows that belong to no pinned app still get a taskbar button while open.
  const extraWindows = windows.filter(
    (w) => !pinned.some((k) => dockAppId(k) === w.appId) && w.appId !== 'trash'
  );

  function windowsFor(key: string) {
    return windows.filter((w) => w.appId === dockAppId(key));
  }

  function activate(key: string) {
    const open = windowsFor(key);
    if (open.length === 0) {
      getDockAction(key, openApp)();
      return;
    }
    const focused = open.find((w) => w.id === focusedId && !w.minimized);
    if (focused) minimizeWindow(focused.id);
    else focusWindow(open[open.length - 1].id);
  }

  function showDesktop() {
    windows.forEach((w) => !w.minimized && minimizeWindow(w.id));
  }

  const { label: weatherLabel, glyph } = describeWeather(weather?.code ?? 3);
  const time = formatTime(now, { clock24h: settings.clock24h, showSeconds: settings.showSeconds });

  function button(
    key: string,
    label: string,
    icon: ReactNode,
    onClick: () => void,
    running: boolean,
    active: boolean
  ) {
    return (
      <button
        key={key}
        type="button"
        className={`${styles.app} ${running ? styles.running : ''} ${active ? styles.active : ''}`}
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        <span className={styles.appIcon}>{icon}</span>
      </button>
    );
  }

  return (
    <div className={`${styles.taskbar} ${settings.taskbarAlignment === 'left' ? styles.left : ''}`}>
      <title>{appName} — Josh Hawksworth</title>

      <div className={styles.corner}>
        {settings.taskbarWeather && (
          <button
            type="button"
            className={styles.weather}
            onClick={() => systemUI.toggle('notificationCenter')}
            aria-label={`Weather: ${weatherLabel}. Open widgets`}
          >
            <span className={styles.weatherGlyph} aria-hidden="true">
              {glyph}
            </span>
            <span className={styles.weatherText}>
              <strong>{weather ? `${weather.temp}°C` : '—'}</strong>
              <span>{weatherLabel}</span>
            </span>
          </button>
        )}
      </div>

      <div className={styles.center}>
        <button
          type="button"
          className={`${styles.app} ${systemUI.panel === 'startMenu' ? styles.active : ''}`}
          onClick={() => systemUI.toggle('startMenu')}
          aria-label="Start"
          title="Start"
          aria-expanded={systemUI.panel === 'startMenu'}
        >
          <WindowsLogo size={22} color="#1e8bff" />
        </button>
        <button
          type="button"
          className={`${styles.search} ${systemUI.panel === 'spotlight' ? styles.active : ''}`}
          onClick={() => systemUI.toggle('spotlight')}
          aria-label="Search"
        >
          <svg
            viewBox="0 0 16 16"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.4 10.4L14 14" />
          </svg>
          <span>Search</span>
        </button>
        <button
          type="button"
          className={`${styles.app} ${systemUI.panel === 'launchpad' ? styles.active : ''}`}
          onClick={() => systemUI.toggle('launchpad')}
          aria-label="Task view"
          title="Task view"
        >
          <svg
            viewBox="0 0 20 20"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2.5" y="4.5" width="10" height="9" rx="1.5" />
            <path d="M6.5 4.5v-1a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1" />
          </svg>
        </button>

        <span className={styles.divider} aria-hidden="true" />

        {pinned.map((key) => {
          const open = windowsFor(key);
          const active = open.some((w) => w.id === focusedId && !w.minimized);
          const label = appLabelFor(dockAppId(key), DOCK_LABELS[key] ?? key, os);
          return button(
            key,
            label,
            appIconFor(key, os),
            () => activate(key),
            open.length > 0,
            active
          );
        })}
        {extraWindows.map((w) =>
          button(
            w.id,
            appTitleFor(w.appId, w.title, os),
            appIconFor(w.appId, os),
            () => (w.id === focusedId && !w.minimized ? minimizeWindow(w.id) : focusWindow(w.id)),
            true,
            w.id === focusedId && !w.minimized
          )
        )}
      </div>

      <div className={styles.tray}>
        <button
          type="button"
          className={styles.trayBtn}
          onClick={() => openApp('settings', { pane: 'system' })}
          aria-label="Hidden icons"
          title="Show hidden icons"
        >
          <svg
            viewBox="0 0 12 12"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 7.5L6 4l3.5 3.5" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.trayGroup} ${systemUI.panel === 'controlCenter' ? styles.active : ''}`}
          onClick={() => systemUI.toggle('controlCenter')}
          aria-label="Quick settings"
          title={`${settings.wifi ? settings.network : 'No internet'} · Volume ${settings.muted ? 'muted' : Math.round(settings.volume * 100) + '%'} · Battery 100%`}
        >
          {settings.doNotDisturb && (
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M9.5 1.5a6.5 6.5 0 1 0 5 9.9A5.5 5.5 0 0 1 9.5 1.5z" />
            </svg>
          )}
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 12.2a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
            <path
              d="M4.6 9.9a4.8 4.8 0 016.8 0l-1.05 1.05a3.3 3.3 0 00-4.7 0L4.6 9.9z"
              opacity={settings.wifi ? 1 : 0.25}
            />
            <path
              d="M1.6 6.9a9 9 0 0112.8 0l-1.05 1.05a7.5 7.5 0 00-10.7 0L1.6 6.9z"
              opacity={settings.wifi ? 1 : 0.25}
            />
          </svg>
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z" fill="currentColor" />
            {settings.muted ? (
              <path d="M11 6l4 4M15 6l-4 4" />
            ) : (
              <>
                <path d="M11 5.5a3.5 3.5 0 0 1 0 5" opacity={settings.volume > 0.05 ? 1 : 0.3} />
                <path d="M13 3.5a6 6 0 0 1 0 9" opacity={settings.volume > 0.5 ? 1 : 0.3} />
              </>
            )}
          </svg>
          <svg
            viewBox="0 0 24 12"
            width="22"
            height="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            aria-hidden="true"
          >
            <rect x="0.6" y="0.6" width="19" height="10.8" rx="2" opacity="0.6" />
            <rect
              x="2.2"
              y="2.2"
              width="15.8"
              height="7.6"
              rx="1"
              fill="currentColor"
              stroke="none"
            />
            <path d="M21.4 4.2v3.6" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.clock} ${systemUI.panel === 'notificationCenter' ? styles.active : ''}`}
          onClick={() => systemUI.toggle('notificationCenter')}
          aria-label="Open notification centre"
        >
          <span>{time}</span>
          <span>{formatNumericDate(now)}</span>
        </button>
        <button
          type="button"
          className={styles.showDesktop}
          onClick={showDesktop}
          aria-label="Show desktop"
          title="Show desktop"
        />
      </div>
    </div>
  );
}
