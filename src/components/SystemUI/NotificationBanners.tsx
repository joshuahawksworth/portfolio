/**
 * The notification that slides in for a moment, styled for the OS being rendered:
 * a macOS banner, a Windows 11 toast, an iOS banner or an Android heads-up card.
 * Clicking (or the action button) runs the notification's action; hovering shows a
 * close control on desktop, and phones swipe the banner up to dismiss it.
 */
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  notificationAge,
  useNotifications,
  type AppNotification,
} from '../../context/NotificationContext';
import { useOs } from '../../context/SettingsContext';
import { appIconFor } from '../../theme/platformIcons';
import { appLabelFor } from '../../theme/platform';
import { DOCK_LABELS } from '../Dock/dockConfig';
import type { OsName } from '../../lib/settingsStore';
import { DocumentIcon } from '../icons/FileSystemIcons';
import styles from './Notifications.module.css';

export function notificationAppName(appId: string, os: OsName): string {
  return appLabelFor(appId, DOCK_LABELS[appId] ?? appId, os);
}

/**
 * The artwork a notification carries. Windows files the CV reminder under the PDF
 * document (the same icon as the "My CV" desktop shortcut) rather than Word, which is
 * only the app that opens it; every other platform keeps its app icon.
 */
export function notificationIcon(appId: string, os: OsName): ReactNode {
  if (os === 'windows' && appId === 'cv') return <DocumentIcon name="CV.pdf" />;
  return appIconFor(appId, os);
}

const OS_CLASS: Record<OsName, string> = {
  macos: '',
  windows: styles.bannerWindows,
  ios: styles.bannerIos,
  android: styles.bannerAndroid,
};

function Banner({ n, os }: { n: AppNotification; os: OsName }) {
  const { activate, dismissBanner } = useNotifications();
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<number | undefined>(undefined);
  const startY = useRef<number | null>(null);
  const appName = notificationAppName(n.appId, os);
  const icon = notificationIcon(n.appId, os);
  const phone = os === 'ios' || os === 'android';

  function leave(then: () => void) {
    if (leaving) return;
    setLeaving(true);
    leaveTimer.current = window.setTimeout(then, 200);
  }

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // Phones: a short upward swipe puts the banner away, like the real thing.
  function onPointerDown(e: ReactPointerEvent) {
    if (!phone) return;
    startY.current = e.clientY;
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (!phone || startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy < -28) {
      e.preventDefault();
      leave(() => dismissBanner(n.id));
    }
  }

  return (
    <div
      className={`${styles.banner} ${OS_CLASS[os]} ${leaving ? styles.bannerLeaving : ''}`}
      role="status"
      aria-live="polite"
      onClick={() => leave(() => activate(n.id))}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.text}>
        <div className={styles.app}>
          <span>
            {os === 'windows' && (
              <span className={styles.winAppIcon} aria-hidden="true">
                {icon}
              </span>
            )}
            {os === 'android' && (
              <span className={styles.droidIcon} aria-hidden="true">
                {icon}
              </span>
            )}
            {appName}
          </span>
          <span className={styles.age}>{notificationAge(n.at)}</span>
        </div>
        <div className={styles.title}>{n.title}</div>
        <div className={styles.body}>{n.body}</div>
      </div>
      {n.onActivate && (
        <button
          type="button"
          className={styles.action}
          onClick={(e) => {
            e.stopPropagation();
            leave(() => activate(n.id));
          }}
        >
          {os === 'android' ? 'Open' : 'Open'}
        </button>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label="Close notification"
        onClick={(e) => {
          e.stopPropagation();
          leave(() => dismissBanner(n.id));
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function NotificationBanners() {
  const { banners } = useNotifications();
  const os = useOs();
  if (banners.length === 0) return null;
  const phone = os === 'ios' || os === 'android';
  return (
    <div
      className={`${styles.layer} ${os === 'windows' ? styles.layerWindows : ''} ${phone ? styles.layerPhone : ''}`}
      aria-label="Notifications"
    >
      {banners.map((n) => (
        <Banner key={n.id} n={n} os={os} />
      ))}
    </div>
  );
}

/** The list shown in a notification centre or phone shade. */
export function NotificationList({
  variant,
}: {
  variant: 'macos' | 'windows' | 'ios' | 'android';
}) {
  const { notifications, activate, remove, clearAll } = useNotifications();
  const os = useOs();
  const listClass = [
    styles.list,
    variant === 'windows' ? styles.listWindows : '',
    variant === 'ios' || variant === 'android' ? styles.listPhone : '',
    variant === 'android' ? styles.listAndroid : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={listClass}>
      {notifications.length > 0 && (
        <div className={styles.listHead} style={variant === 'ios' ? { color: '#fff' } : undefined}>
          <span>{variant === 'windows' ? 'Notifications' : 'Notification Center'}</span>
          <button type="button" className={styles.clearAll} onClick={clearAll}>
            {variant === 'macos' ? 'Clear All' : 'Clear all'}
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className={styles.empty}>
          {variant === 'windows' ? 'No new notifications' : 'No New Notifications'}
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={styles.item}
            role="button"
            tabIndex={0}
            onClick={() => activate(n.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate(n.id);
              }
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              {notificationIcon(n.appId, os)}
            </span>
            <div className={styles.text}>
              <div className={styles.app}>
                <span>{notificationAppName(n.appId, os)}</span>
                <span className={styles.age}>{notificationAge(n.at)}</span>
              </div>
              <div className={styles.title}>{n.title}</div>
              <div className={styles.body}>{n.body}</div>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Clear notification"
              onClick={(e) => {
                e.stopPropagation();
                remove(n.id);
              }}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}
